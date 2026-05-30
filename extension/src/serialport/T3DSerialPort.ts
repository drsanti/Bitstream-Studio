import { SerialPort } from "serialport";
import { EventEmitter } from "events";
import { ReadlineParser } from "@serialport/parser-readline";
import { PassThrough } from "stream";

// Infer PortInfo type from SerialPort.list() return type
type PortInfo = Awaited<ReturnType<typeof SerialPort.list>>[number];

/**
 * Serial port configuration options
 */
export interface SerialPortConfig {
  /** Port path (e.g., 'COM3' on Windows or '/dev/ttyUSB0' on Linux) */
  path: string;
  /** Communication speed in baud (e.g., 9600, 115200) */
  baudRate: number;
  /** Number of data bits (5, 6, 7, or 8). Default: 8 */
  dataBits?: 5 | 6 | 7 | 8;
  /** Number of stop bits (1 or 2). Default: 1 */
  stopBits?: 1 | 2;
  /** Parity setting. Default: 'none' */
  parity?: "none" | "even" | "odd" | "mark" | "space";
  /** Whether to automatically open the port on creation. Default: true */
  autoOpen?: boolean;
  /** Data reception mode: 'data' (raw bytes only), 'line' (parsed lines only), or 'both' (both simultaneously). Default: 'data' */
  mode?: "data" | "line" | "both";
  /** Enable readline parsing. Default: false. @deprecated Use mode instead */
  readline?: boolean;
  /** Line delimiter for readline parser. Default: '\n' */
  readlineDelimiter?: string | Buffer | number[];
  /** Include delimiter in emitted lines. Default: false */
  readlineIncludeDelimiter?: boolean;
  /** Text encoding for readline parser. Default: 'utf8' */
  readlineEncoding?: string;
}

/**
 * Serial port status information
 */
export interface SerialPortStatus {
  /** Whether the port is currently open */
  isOpen: boolean;
  /** Port path or null if not configured */
  path: string | null;
  /** Baud rate or null if not configured */
  baudRate: number | null;
  /** Total bytes written since opening */
  bytesWritten: number;
  /** Total bytes read since opening */
  bytesRead: number;
}

/**
 * T3DSerialPort - Wrapper class for serialport package
 * Provides basic functionality for serial port communication
 */
export class T3DSerialPort extends EventEmitter {
  private port: SerialPort | null = null;
  private parser: ReadlineParser | null = null;
  private passthrough: PassThrough | null = null;
  private config: SerialPortConfig | null = null;
  private intentionalCloseInProgress = false;
  private status: SerialPortStatus;

  constructor() {
    super();
    this.status = {
      isOpen: false,
      path: null,
      baudRate: null,
      bytesWritten: 0,
      bytesRead: 0,
    };
  }

  /**
   * List all available serial ports
   * @returns Promise resolving to array of port information
   */
  static async list(): Promise<PortInfo[]> {
    try {
      const ports = await SerialPort.list();
      return ports;
    } catch (error: any) {
      throw new Error(`Failed to list serial ports: ${error.message || error}`);
    }
  }

  /**
   * Open a serial port with the given configuration
   * @param config Serial port configuration
   * @throws Error if port is already open or configuration is invalid
   */
  async open(config: SerialPortConfig): Promise<void> {
    if (this.isOpen()) {
      throw new Error(`Serial port is already open at ${this.config?.path}`);
    }

    if (!config.path) {
      throw new Error("Port path is required");
    }

    if (!config.baudRate || config.baudRate <= 0) {
      throw new Error("Valid baud rate is required");
    }

    try {
      // Determine mode: use mode if provided, otherwise map from readline for backward compatibility
      let mode: "data" | "line" | "both" = config.mode ?? "data";
      if (!config.mode && config.readline !== undefined) {
        mode = config.readline ? "line" : "data";
      }

      this.config = {
        autoOpen: true,
        ...config,
        mode,
      };

      // Create SerialPort instance
      this.port = new SerialPort({
        path: this.config.path,
        baudRate: this.config.baudRate,
        dataBits: this.config.dataBits ?? 8,
        stopBits: this.config.stopBits ?? 1,
        parity: this.config.parity ?? "none",
        autoOpen: this.config.autoOpen ?? true,
      });

      // Set up parser and passthrough based on mode
      if (mode === "both") {
        // For 'both' mode, we need to manually handle data flow to emit both raw data and parsed lines
        // Create parser for line parsing
        this.parser = new ReadlineParser({
          delimiter: this.config.readlineDelimiter ?? "\n",
          includeDelimiter: this.config.readlineIncludeDelimiter ?? false,
          encoding: (this.config.readlineEncoding ?? "utf8") as BufferEncoding,
        });

        // Set up parser listener for line events (parsed lines)
        this.parser.on("data", (line: string) => {
          // Emit line event (don't update bytesRead here to avoid double counting with raw data)
          this.emit("line", line);
        });

        // Manually handle port data: emit raw data AND feed to parser
        // We'll set this up in setupEventListeners() after the port is ready
        // For now, we'll use a PassThrough to feed the parser
        this.passthrough = new PassThrough();
        this.passthrough.pipe(this.parser);
      } else if (mode === "line") {
        // Pipe port directly to ReadlineParser (existing behavior)
        this.parser = this.port.pipe(
          new ReadlineParser({
            delimiter: this.config.readlineDelimiter ?? "\n",
            includeDelimiter: this.config.readlineIncludeDelimiter ?? false,
            encoding: (this.config.readlineEncoding ?? "utf8") as BufferEncoding,
          }),
        );

        // Set up parser listener for line events
        this.parser.on("data", (line: string) => {
          // Update statistics with line length (as bytes)
          const encoding = (this.config?.readlineEncoding ?? "utf8") as BufferEncoding;
          const lineBytes = Buffer.byteLength(line, encoding);
          this.updateStatus({
            bytesRead: this.status.bytesRead + lineBytes,
          });
          // Emit line event
          this.emit("line", line);
        });
      }
      // mode === 'data': no parser needed, listen to port directly

      // Set up event listeners
      this.setupEventListeners();

      // Wait for port to open if autoOpen is true
      if (this.config.autoOpen) {
        const openingSnapshot = { path: this.config.path, baudRate: this.config.baudRate };
        await new Promise<void>((resolve, reject) => {
          let settled = false;
          const timeout = setTimeout(() => {
            if (settled) return;
            settled = true;
            reject(new Error("Port opening timeout"));
          }, 5000);

          this.port!.once("open", () => {
            clearTimeout(timeout);
            if (settled) return;
            // `close` may clear `this.config` before this runs; ignore stale `open` without `reject`
            // (the real failure is delivered via `once("error")` or timeout).
            if (!this.port || !this.port.isOpen) {
              return;
            }
            settled = true;
            this.updateStatus({
              isOpen: true,
              path: openingSnapshot.path,
              baudRate: openingSnapshot.baudRate,
            });
            console.log(
              `✅ Serial port opened: ${openingSnapshot.path} at ${openingSnapshot.baudRate} baud`,
            );
            this.emit("open");
            this.emit("status-changed", this.getStatus());
            resolve();
          });

          this.port!.once("error", (error) => {
            clearTimeout(timeout);
            if (settled) return;
            settled = true;
            reject(error);
          });
        });
      }
    } catch (error: any) {
      // Clean up on error
      if (this.parser) {
        try {
          this.parser.destroy();
        } catch (cleanupError) {
          // Ignore cleanup errors
        }
        this.parser = null;
      }
      if (this.passthrough) {
        try {
          this.passthrough.destroy();
        } catch (cleanupError) {
          // Ignore cleanup errors
        }
        this.passthrough = null;
      }
      if (this.port) {
        try {
          this.port.destroy();
        } catch (cleanupError) {
          // Ignore cleanup errors
        }
        this.port = null;
      }
      this.config = null;
      this.updateStatus({
        isOpen: false,
        path: null,
        baudRate: null,
      });

      const errorMessage = `Failed to open serial port: ${error.message || error}`;
      console.error("❌", errorMessage);
      this.emit("error", error);
      throw new Error(errorMessage);
    }
  }

  /**
   * Close the serial port
   * @throws Error if port is not open
   */
  async close(): Promise<void> {
    if (!this.port)
    {
      if (this.status.isOpen)
      {
        this.updateStatus({
          isOpen: false,
          path: null,
          baudRate: null,
          bytesWritten: 0,
          bytesRead: 0,
        });
        this.config = null;
        this.emit("close");
        this.emit("status-changed", this.getStatus());
      }
      return;
    }

    if (!this.port.isOpen)
    {
      this.teardownPortInstance();
      return;
    }

    try {
      this.intentionalCloseInProgress = true;
      return new Promise<void>((resolve, reject) => {
        this.port!.close((error) => {
          if (error) {
            this.intentionalCloseInProgress = false;
            const errorMessage = `Failed to close serial port: ${error.message || error}`;
            console.error("❌", errorMessage);
            this.emit("error", error);
            reject(new Error(errorMessage));
            return;
          }

          console.log(`🔌 Serial port closed: ${this.config?.path}`);
          this.teardownPortInstance();
          this.intentionalCloseInProgress = false;
          this.emit("close");
          this.emit("status-changed", this.getStatus());
          resolve();
        });
      });
    } catch (error: any) {
      const errorMessage = `Error closing serial port: ${error.message || error}`;
      console.error("❌", errorMessage);
      this.emit("error", error);
      throw new Error(errorMessage);
    }
  }

  /**
   * Force-close: remove listeners and tear down even if `close()` already ran partially.
   */
  async forceClose(): Promise<void> {
    this.intentionalCloseInProgress = true;
    const activePort = this.port;
    if (activePort != null && activePort.isOpen)
    {
      await new Promise<void>((resolve) => {
        activePort.close(() => resolve());
      });
    }
    this.teardownPortInstance();
    this.intentionalCloseInProgress = false;
    if (this.status.isOpen)
    {
      this.emit("close");
      this.emit("status-changed", this.getStatus());
    }
  }

  /**
   * Write data to the serial port
   * @param data Data to write (string or Buffer)
   * @throws Error if port is not open or write fails
   */
  async write(data: string | Buffer): Promise<void> {
    if (!this.isOpen() || !this.port) {
      throw new Error("Serial port is not open");
    }

    try {
      return new Promise<void>((resolve, reject) => {
        const buffer = typeof data === "string" ? Buffer.from(data) : data;

        this.port!.write(buffer, (error) => {
          if (error) {
            const errorMessage = `Failed to write to serial port: ${error.message || error}`;
            console.error("❌", errorMessage);
            this.emit("error", error);
            reject(new Error(errorMessage));
            return;
          }

          // Update statistics
          this.updateStatus({
            bytesWritten: this.status.bytesWritten + buffer.length,
          });

          // Wait for drain to ensure data is sent
          this.port!.drain((drainError) => {
            if (drainError) {
              console.warn("⚠️ Drain error (data may still be sent):", drainError.message);
            }
            resolve();
          });
        });
      });
    } catch (error: any) {
      const errorMessage = `Error writing to serial port: ${error.message || error}`;
      console.error("❌", errorMessage);
      this.emit("error", error);
      throw new Error(errorMessage);
    }
  }

  /**
   * Check if the serial port is currently open
   * @returns true if port is open, false otherwise
   */
  isOpen(): boolean {
    return this.status.isOpen && this.port !== null && this.port.isOpen;
  }

  /**
   * Get current status of the serial port
   * @returns Current status object
   */
  getStatus(): SerialPortStatus {
    return { ...this.status };
  }

  /**
   * Get current configuration of the serial port
   * @returns Current configuration or null if not configured
   */
  getConfig(): SerialPortConfig | null {
    return this.config ? { ...this.config } : null;
  }

  /** Destroy parser/passthrough and drop the native port handle. */
  private teardownPortInstance(): void {
    if (this.port)
    {
      try
      {
        this.port.removeAllListeners();
      }
      catch
      {
        /* ignore */
      }
      this.port = null;
    }

    if (this.parser)
    {
      try
      {
        this.parser.destroy();
      }
      catch
      {
        /* ignore */
      }
      this.parser = null;
    }

    if (this.passthrough)
    {
      try
      {
        this.passthrough.destroy();
      }
      catch
      {
        /* ignore */
      }
      this.passthrough = null;
    }

    this.updateStatus({
      isOpen: false,
      path: null,
      baudRate: null,
      bytesWritten: 0,
      bytesRead: 0,
    });
    this.config = null;
  }

  /**
   * Set up event listeners for the serial port
   */
  private setupEventListeners(): void {
    if (!this.port) return;

    const mode = this.config?.mode ?? "data";

    // Handle data received (raw buffer chunks)
    if (mode === "data") {
      // Listen to port directly for raw data
      this.port.on("data", (data: Buffer) => {
        // Update statistics
        this.updateStatus({
          bytesRead: this.status.bytesRead + data.length,
        });

        // Emit data event
        this.emit("data", data);
      });
    } else if (mode === "both" && this.passthrough) {
      // For 'both' mode: manually handle data to emit raw data AND feed to parser
      this.port.on("data", (data: Buffer) => {
        // Update statistics
        this.updateStatus({
          bytesRead: this.status.bytesRead + data.length,
        });

        // Emit raw data event
        this.emit("data", data);

        // Also feed data to parser via passthrough
        if (this.passthrough) {
          this.passthrough.write(data);
        }
      });
    }
    // For 'line' mode, port is piped to parser, so no raw data events (parser handles it)

    // Handle errors
    this.port.on("error", (error: Error) => {
      console.error("❌ Serial port error:", error.message);
      this.emit("error", error);
    });

    // Handle close event
    this.port.on("close", () => {
      if (this.intentionalCloseInProgress) {
        console.log("🔌 Serial port closed (requested)");
      } else {
        console.log("🔌 Serial port closed by system");
      }

      // Clean up parser
      if (this.parser) {
        try {
          this.parser.destroy();
        } catch (cleanupError) {
          // Ignore cleanup errors
        }
        this.parser = null;
      }

      // Clean up passthrough
      if (this.passthrough) {
        try {
          this.passthrough.destroy();
        } catch (cleanupError) {
          // Ignore cleanup errors
        }
        this.passthrough = null;
      }

      this.port = null;
      this.updateStatus({
        isOpen: false,
        path: null,
        baudRate: null,
        bytesWritten: 0,
        bytesRead: 0,
      });
      this.config = null;
      this.intentionalCloseInProgress = false;
      this.emit("close");
      this.emit("status-changed", this.getStatus());
    });
  }

  /**
   * Update status object
   * @param updates Partial status updates
   */
  private updateStatus(updates: Partial<SerialPortStatus>): void {
    this.status = { ...this.status, ...updates };
    if (updates.bytesRead !== undefined || updates.bytesWritten !== undefined) {
      this.emit("status-changed", this.getStatus());
    }
  }
}
