/**
 * Backwards-compatible barrel exports.
 *
 * Implementations live in `src/serialport/examples/exNN-*.ts`.
 */

export { run as ex01BasicUsage } from './ex01-basic-usage';
export { run as ex02Interactive } from './ex02-interactive';
export { run as ex03LineReading } from './ex03-line-reading';
export { run as ex04ContinuousLines } from './ex04-continuous-lines';
export { run as ex05ParserReadline } from './ex05-parser-readline';
export { run as ex06ParserDelimiterMulti } from './ex06-parser-delimiter-multi';
export { run as ex07ParserByteLengthMulti } from './ex07-parser-byte-length-multi';
export { run as ex08CompareParsers } from './ex08-compare-parsers';
export { run as ex09StreamOperations } from './ex09-stream-operations';
export { run as ex10BaudrateUpdate } from './ex10-baudrate-update';
export { run as ex11ControlFlags } from './ex11-control-flags';
export { run as ex12BufferManagement } from './ex12-buffer-management';
export { run as ex13DelimiterParserBasic } from './ex13-delimiter-parser-basic';
export { run as ex14ByteLengthParserBasic } from './ex14-byte-length-parser-basic';
export { run as ex15NonBlockingWrites } from './ex15-non-blocking-writes';
export { run as ex16ReadableModes } from './ex16-readable-modes';
export { run as ex17ErrorHandling } from './ex17-error-handling';
export { run as ex18Arduino } from './ex18-arduino';
export { run as ex19BinaryProtocol } from './ex19-binary-protocol';
export { run as ex20TextProtocol } from './ex20-text-protocol';

import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
import { DelimiterParser } from '@serialport/parser-delimiter';
import { ByteLengthParser } from '@serialport/parser-byte-length';

// Infer PortInfo type from SerialPort.list() return type
type PortInfo = Awaited<ReturnType<typeof SerialPort.list>>[number];

/**
 * List all available serial ports
 */
async function listPorts(): Promise<PortInfo[]> {
  try {
    const ports = await SerialPort.list();
    return ports;
  } catch (error: any) {
    throw new Error(`Failed to list serial ports: ${error.message || error}`);
  }
}

/**
 * Get first available port or throw error
 */
async function getFirstPort(): Promise<PortInfo> {
  const ports = await listPorts();
  if (ports.length === 0) {
    throw new Error('No serial ports available');
  }
  return ports[0];
}

/**
 * Example: Basic Stream Operations
 * Demonstrates opening, reading, writing, pausing, and resuming
 */
export async function exampleStreamOperations(): Promise<void> {
  console.log('📡 Basic Stream Operations Example\n');

  try {
    const portInfo = await getFirstPort();
    console.log(`Using port: ${portInfo.path}\n`);

    // Create port with autoOpen: false to demonstrate manual opening
    const port = new SerialPort({
      path: portInfo.path,
      baudRate: 115200,
      autoOpen: false,
    });

    // Open port manually
    await new Promise<void>((resolve, reject) => {
      port.open((error) => {
        if (error) {
          reject(error);
        } else {
          console.log('✅ Port opened');
          resolve();
        }
      });
    });

    // Set up data handler
    port.on('data', (data: Buffer) => {
      console.log(`📥 Received: ${data.toString('utf-8')}`);
    });

    // Write data
    console.log('📤 Writing data...');
    port.write('Hello from SerialPort!\n', (error) => {
      if (error) {
        console.error('❌ Write error:', error.message);
      } else {
        console.log('✅ Data written');
      }
    });

    // Demonstrate pause
    console.log('\n⏸️ Pausing stream...');
    port.pause();
    console.log('Stream paused (data events stopped)');

    // Wait a bit
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Demonstrate resume
    console.log('▶️ Resuming stream...');
    port.resume();
    console.log('Stream resumed (data events active)');

    // Read data manually (paused mode)
    console.log('\n📖 Reading data manually...');
    port.pause();
    const data = port.read();
    if (data) {
      console.log(`Read: ${data.toString('utf-8')}`);
    } else {
      console.log('No data available in buffer');
    }
    port.resume();

    // Wait for any incoming data
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Close port
    await new Promise<void>((resolve) => {
      port.close((error) => {
        if (error) {
          console.error('❌ Close error:', error.message);
        } else {
          console.log('✅ Port closed');
        }
        resolve();
      });
    });

    console.log('\n✅ Basic stream operations example completed');
  } catch (error: any) {
    console.error('❌ Example failed:', error.message);
    throw error;
  }
}

/**
 * Example: Baud Rate Update
 * Demonstrates changing baud rate on an open port
 */
export async function exampleBaudRateUpdate(): Promise<void> {
  console.log('⚡ Baud Rate Update Example\n');

  try {
    const portInfo = await getFirstPort();
    console.log(`Using port: ${portInfo.path}\n`);

    const port = new SerialPort({
      path: portInfo.path,
      baudRate: 9600,
    });

    await new Promise<void>((resolve) => {
      port.once('open', () => {
        console.log(`✅ Port opened at ${port.baudRate} baud`);
        resolve();
      });
    });

    // Update baud rate
    console.log('🔄 Updating baud rate to 115200...');
    await new Promise<void>((resolve, reject) => {
      port.update({ baudRate: 115200 }, (error) => {
        if (error) {
          reject(error);
        } else {
          console.log(`✅ Baud rate updated to ${port.baudRate} baud`);
          resolve();
        }
      });
    });

    // Write test data at new baud rate
    port.write('Test at 115200 baud\n');

    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Close port
    await new Promise<void>((resolve) => {
      port.close(() => {
        console.log('✅ Port closed');
        resolve();
      });
    });

    console.log('\n✅ Baud rate update example completed');
  } catch (error: any) {
    console.error('❌ Example failed:', error.message);
    throw error;
  }
}

/**
 * Example: Control Flags (set/get)
 * Demonstrates setting and reading hardware control flags
 */
export async function exampleControlFlags(): Promise<void> {
  console.log('🎛️ Control Flags Example\n');

  try {
    const portInfo = await getFirstPort();
    console.log(`Using port: ${portInfo.path}\n`);

    const port = new SerialPort({
      path: portInfo.path,
      baudRate: 115200,
    });

    await new Promise<void>((resolve) => {
      port.once('open', () => {
        console.log('✅ Port opened');
        resolve();
      });
    });

    // Get current modem status
    console.log('📊 Reading modem status...');
    await new Promise<void>((resolve) => {
      port.get((error, status) => {
        if (error) {
          console.error('❌ Get error:', error.message);
        } else if (status) {
          console.log('Modem Status:');
          console.log(`  CTS (Clear To Send): ${status.cts}`);
          console.log(`  DSR (Data Set Ready): ${status.dsr}`);
          console.log(`  DCD (Data Carrier Detect): ${status.dcd}`);
          // lowLatency is Linux-specific and may not be in type definition
          const statusWithLowLatency = status as typeof status & { lowLatency?: boolean };
          if (statusWithLowLatency.lowLatency !== undefined) {
            console.log(`  Low Latency: ${statusWithLowLatency.lowLatency}`);
          }
        } else {
          console.log('⚠️ No status data available');
        }
        resolve();
      });
    });

    // Set control flags
    console.log('\n🔧 Setting control flags...');
    await new Promise<void>((resolve) => {
      port.set(
        {
          dtr: true, // Data Terminal Ready
          rts: true, // Request To Send
          brk: false,
          cts: false,
          dsr: false,
        },
        (error) => {
          if (error) {
            console.error('❌ Set error:', error.message);
          } else {
            console.log('✅ Control flags set');
            console.log('  DTR: true (Data Terminal Ready)');
            console.log('  RTS: true (Request To Send)');
          }
          resolve();
        }
      );
    });

    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Close port
    await new Promise<void>((resolve) => {
      port.close(() => {
        console.log('✅ Port closed');
        resolve();
      });
    });

    console.log('\n✅ Control flags example completed');
  } catch (error: any) {
    console.error('❌ Example failed:', error.message);
    throw error;
  }
}

/**
 * Example: Buffer Management
 * Demonstrates flush and drain operations
 */
export async function exampleBufferManagement(): Promise<void> {
  console.log('💾 Buffer Management Example\n');

  try {
    const portInfo = await getFirstPort();
    console.log(`Using port: ${portInfo.path}\n`);

    const port = new SerialPort({
      path: portInfo.path,
      baudRate: 115200,
    });

    await new Promise<void>((resolve) => {
      port.once('open', () => {
        console.log('✅ Port opened');
        resolve();
      });
    });

    // Write multiple chunks
    console.log('📤 Writing multiple data chunks...');
    port.write('Chunk 1\n');
    port.write('Chunk 2\n');
    port.write('Chunk 3\n');

    // Drain: Wait for all writes to complete
    console.log('⏳ Draining (waiting for writes to complete)...');
    await new Promise<void>((resolve) => {
      port.drain((error) => {
        if (error) {
          console.error('❌ Drain error:', error.message);
        } else {
          console.log('✅ All data drained (transmitted)');
        }
        resolve();
      });
    });

    // Flush: Discard buffered data
    console.log('\n🗑️ Flushing (discarding buffered data)...');
    await new Promise<void>((resolve) => {
      port.flush((error) => {
        if (error) {
          console.error('❌ Flush error:', error.message);
        } else {
          console.log('✅ Buffers flushed');
        }
        resolve();
      });
    });

    await new Promise((resolve) => setTimeout(resolve, 500));

    // Close port
    await new Promise<void>((resolve) => {
      port.close(() => {
        console.log('✅ Port closed');
        resolve();
      });
    });

    console.log('\n✅ Buffer management example completed');
  } catch (error: any) {
    console.error('❌ Example failed:', error.message);
    throw error;
  }
}

/**
 * Example: DelimiterParser
 * Demonstrates parsing data with custom delimiters
 */
export async function exampleDelimiterParser(): Promise<void> {
  console.log('🔀 DelimiterParser Example\n');

  try {
    const portInfo = await getFirstPort();
    console.log(`Using port: ${portInfo.path}\n`);

    const port = new SerialPort({
      path: portInfo.path,
      baudRate: 115200,
    });

    await new Promise<void>((resolve) => {
      port.once('open', () => {
        console.log('✅ Port opened');
        resolve();
      });
    });

    // Create parser with pipe delimiter
    const parser = port.pipe(
      new DelimiterParser({ delimiter: '|' })
    );

    console.log('📄 Listening for pipe-delimited messages...');

    parser.on('data', (data: Buffer) => {
      console.log(`📥 Received packet: "${data.toString('utf-8')}"`);
    });

    // Write pipe-delimited data
    console.log('\n📤 Writing pipe-delimited data...');
    port.write('Packet1|Packet2|Packet3|', (error) => {
      if (error) {
        console.error('❌ Write error:', error.message);
      }
    });

    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Example with CRLF delimiter
    console.log('\n📄 Switching to CRLF delimiter...');
    parser.destroy();
    const crlfParser = port.pipe(
      new DelimiterParser({ delimiter: Buffer.from('\r\n') })
    );

    crlfParser.on('data', (data: Buffer) => {
      console.log(`📥 Received CRLF packet: "${data.toString('utf-8')}"`);
    });

    port.write('Line1\r\nLine2\r\nLine3\r\n');

    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Close port
    await new Promise<void>((resolve) => {
      port.close(() => {
        console.log('✅ Port closed');
        resolve();
      });
    });

    console.log('\n✅ DelimiterParser example completed');
  } catch (error: any) {
    console.error('❌ Example failed:', error.message);
    throw error;
  }
}

/**
 * Example: ByteLengthParser
 * Demonstrates parsing fixed-size binary packets
 */
export async function exampleByteLengthParser(): Promise<void> {
  console.log('📦 ByteLengthParser Example\n');

  try {
    const portInfo = await getFirstPort();
    console.log(`Using port: ${portInfo.path}\n`);

    const port = new SerialPort({
      path: portInfo.path,
      baudRate: 115200,
    });

    await new Promise<void>((resolve) => {
      port.once('open', () => {
        console.log('✅ Port opened');
        resolve();
      });
    });

    // Create parser for 8-byte packets
    const parser = port.pipe(new ByteLengthParser({ length: 8 }));

    console.log('📦 Listening for 8-byte packets...');

    parser.on('data', (data: Buffer) => {
      console.log(`📥 Received packet (${data.length} bytes):`);
      console.log(`  Hex: ${data.toString('hex')}`);
      console.log(`  Values: [${Array.from(data).join(', ')}]`);
    });

    // Write binary data (multiple 8-byte packets)
    console.log('\n📤 Writing binary packets...');
    const packet1 = Buffer.from([0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08]);
    const packet2 = Buffer.from([0x10, 0x20, 0x30, 0x40, 0x50, 0x60, 0x70, 0x80]);

    port.write(packet1);
    port.write(packet2);

    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Close port
    await new Promise<void>((resolve) => {
      port.close(() => {
        console.log('✅ Port closed');
        resolve();
      });
    });

    console.log('\n✅ ByteLengthParser example completed');
  } catch (error: any) {
    console.error('❌ Example failed:', error.message);
    throw error;
  }
}

/**
 * Example: Non-blocking Writes
 * Demonstrates handling write return values and drain events
 */
export async function exampleNonBlockingWrites(): Promise<void> {
  console.log('⚡ Non-blocking Writes Example\n');

  try {
    const portInfo = await getFirstPort();
    console.log(`Using port: ${portInfo.path}\n`);

    const port = new SerialPort({
      path: portInfo.path,
      baudRate: 115200,
    });

    await new Promise<void>((resolve) => {
      port.once('open', () => {
        console.log('✅ Port opened');
        resolve();
      });
    });

    // Function to write with drain handling
    const writeWithDrain = (data: string): Promise<void> => {
      return new Promise((resolve) => {
        const canWrite = port.write(data);
        if (canWrite) {
          // Write succeeded immediately
          console.log(`✅ Write succeeded immediately: "${data.trim()}"`);
          resolve();
        } else {
          // Write buffer is full, wait for drain
          console.log(`⏳ Write buffer full, waiting for drain: "${data.trim()}"`);
          port.once('drain', () => {
            console.log('✅ Drain event: ready to write again');
            resolve();
          });
        }
      });
    };

    // Write multiple chunks
    console.log('📤 Writing multiple chunks...\n');
    await writeWithDrain('Chunk 1\n');
    await writeWithDrain('Chunk 2\n');
    await writeWithDrain('Chunk 3\n');

    console.log('\n✅ All writes completed');

    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Close port
    await new Promise<void>((resolve) => {
      port.close(() => {
        console.log('✅ Port closed');
        resolve();
      });
    });

    console.log('\n✅ Non-blocking writes example completed');
  } catch (error: any) {
    console.error('❌ Example failed:', error.message);
    throw error;
  }
}

/**
 * Example: Readable Stream Modes
 * Demonstrates flowing vs paused mode
 */
export async function exampleReadableModes(): Promise<void> {
  console.log('📖 Readable Stream Modes Example\n');

  try {
    const portInfo = await getFirstPort();
    console.log(`Using port: ${portInfo.path}\n`);

    const port = new SerialPort({
      path: portInfo.path,
      baudRate: 115200,
    });

    await new Promise<void>((resolve) => {
      port.once('open', () => {
        console.log('✅ Port opened');
        resolve();
      });
    });

    // Flowing mode: data events
    console.log('📡 Flowing mode: Listening for data events...');
    port.on('data', (data: Buffer) => {
      console.log(`📥 [Flowing] Received: ${data.toString('utf-8')}`);
    });

    port.write('Test in flowing mode\n');

    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Switch to paused mode
    console.log('\n⏸️ Switching to paused mode...');
    port.pause();

    port.write('Test in paused mode (should be buffered)\n');

    await new Promise((resolve) => setTimeout(resolve, 500));

    // Read manually from buffer
    console.log('📖 Reading from buffer manually...');
    let data: Buffer | null;
    while ((data = port.read()) !== null) {
      console.log(`📥 [Paused] Read: ${data.toString('utf-8')}`);
    }

    // Resume flowing mode
    console.log('\n▶️ Resuming flowing mode...');
    port.resume();

    port.write('Test after resume\n');

    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Close port
    await new Promise<void>((resolve) => {
      port.close(() => {
        console.log('✅ Port closed');
        resolve();
      });
    });

    console.log('\n✅ Readable stream modes example completed');
  } catch (error: any) {
    console.error('❌ Example failed:', error.message);
    throw error;
  }
}

/**
 * Example: Error Handling Patterns
 * Demonstrates proper error handling and disconnect detection
 */
export async function exampleErrorHandling(): Promise<void> {
  console.log('⚠️ Error Handling Example\n');

  try {
    const portInfo = await getFirstPort();
    console.log(`Using port: ${portInfo.path}\n`);

    const port = new SerialPort({
      path: portInfo.path,
      baudRate: 115200,
    });

    // Set up error handler
    port.on('error', (error: Error) => {
      console.error('❌ Port error:', error.message);
      if ('disconnected' in error && (error as any).disconnected) {
        console.log('🔌 Device disconnected');
      }
    });

    // Set up close handler
    port.on('close', (error?: Error) => {
      if (error) {
        console.log('🔌 Port closed with error:', error.message);
        if ('disconnected' in error && (error as any).disconnected) {
          console.log('⚠️ Device was disconnected');
        }
      } else {
        console.log('🔌 Port closed normally');
      }
    });

    await new Promise<void>((resolve) => {
      port.once('open', () => {
        console.log('✅ Port opened');
        console.log('\n💡 Error handling is set up:');
        console.log('  - Errors will be logged');
        console.log('  - Disconnects will be detected');
        console.log('  - Close events will be handled\n');
        resolve();
      });
    });

    // Write with error handling in callback
    port.write('Test data\n', (error) => {
      if (error) {
        console.error('❌ Write callback error:', error.message);
      } else {
        console.log('✅ Write succeeded');
      }
    });

    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Close port
    await new Promise<void>((resolve) => {
      port.close((error) => {
        if (error) {
          console.error('❌ Close callback error:', error.message);
        }
        resolve();
      });
    });

    console.log('\n✅ Error handling example completed');
  } catch (error: any) {
    console.error('❌ Example failed:', error.message);
    throw error;
  }
}

/**
 * Example: Arduino Communication Pattern
 * Demonstrates waiting for device ready and command/response pattern
 */
export async function exampleArduinoCommunication(): Promise<void> {
  console.log('🤖 Arduino Communication Example\n');

  try {
    const portInfo = await getFirstPort();
    console.log(`Using port: ${portInfo.path}\n`);

    const port = new SerialPort({
      path: portInfo.path,
      baudRate: 115200, // Common Arduino baud rate
    });

    // Use ReadlineParser for Arduino Serial.println() output
    const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

    await new Promise<void>((resolve) => {
      port.once('open', () => {
        console.log('✅ Port opened');
        console.log('⏳ Waiting for Arduino to initialize (2 seconds)...');
        resolve();
      });
    });

    // Wait for Arduino reset (common issue: Arduino resets on connection)
    await new Promise((resolve) => setTimeout(resolve, 2000));

    console.log('📡 Listening for Arduino responses...\n');

    // Listen for responses
    parser.on('data', (line: string) => {
      console.log(`📥 Arduino: ${line}`);
    });

    // Send commands
    const commands = ['LED_ON', 'STATUS', 'LED_OFF'];

    for (const cmd of commands) {
      console.log(`📤 Sending: ${cmd}`);
      port.write(`${cmd}\n`);

      // Wait for response
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Close port
    await new Promise<void>((resolve) => {
      port.close(() => {
        console.log('✅ Port closed');
        resolve();
      });
    });

    console.log('\n✅ Arduino communication example completed');
  } catch (error: any) {
    console.error('❌ Example failed:', error.message);
    throw error;
  }
}

/**
 * Example: Binary Protocol
 * Demonstrates sending/receiving binary data with packet framing
 */
export async function exampleBinaryProtocol(): Promise<void> {
  console.log('🔢 Binary Protocol Example\n');

  try {
    const portInfo = await getFirstPort();
    console.log(`Using port: ${portInfo.path}\n`);

    const port = new SerialPort({
      path: portInfo.path,
      baudRate: 115200,
    });

    // Use ByteLengthParser for fixed-size packets
    const parser = port.pipe(new ByteLengthParser({ length: 4 }));

    await new Promise<void>((resolve) => {
      port.once('open', () => {
        console.log('✅ Port opened');
        resolve();
      });
    });

    console.log('📦 Listening for 4-byte binary packets...\n');

    parser.on('data', (packet: Buffer) => {
      // Simple checksum validation (sum of bytes)
      const checksum = Array.from(packet).reduce((a, b) => a + b, 0);
      console.log(`📥 Received packet:`);
      console.log(`  Data: [${Array.from(packet).join(', ')}]`);
      console.log(`  Hex: ${packet.toString('hex')}`);
      console.log(`  Checksum: ${checksum}`);
    });

    // Send binary packets with simple framing
    console.log('📤 Sending binary packets...\n');

    // Packet format: [command, param1, param2, checksum]
    const createPacket = (cmd: number, p1: number, p2: number): Buffer => {
      const data = Buffer.from([cmd, p1, p2, 0]);
      const checksum = (cmd + p1 + p2) & 0xff;
      data[3] = checksum;
      return data;
    };

    const packet1 = createPacket(0x01, 0x10, 0x20);
    const packet2 = createPacket(0x02, 0x30, 0x40);

    port.write(packet1);
    console.log(`📤 Sent: [${Array.from(packet1).join(', ')}]`);

    await new Promise((resolve) => setTimeout(resolve, 500));

    port.write(packet2);
    console.log(`📤 Sent: [${Array.from(packet2).join(', ')}]`);

    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Close port
    await new Promise<void>((resolve) => {
      port.close(() => {
        console.log('✅ Port closed');
        resolve();
      });
    });

    console.log('\n✅ Binary protocol example completed');
  } catch (error: any) {
    console.error('❌ Example failed:', error.message);
    throw error;
  }
}

/**
 * Example: Text Protocol
 * Demonstrates line-based command/response protocol
 */
export async function exampleTextProtocol(): Promise<void> {
  console.log('📝 Text Protocol Example\n');

  try {
    const portInfo = await getFirstPort();
    console.log(`Using port: ${portInfo.path}\n`);

    const port = new SerialPort({
      path: portInfo.path,
      baudRate: 115200,
    });

    // Use ReadlineParser for line-based protocol
    const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

    await new Promise<void>((resolve) => {
      port.once('open', () => {
        console.log('✅ Port opened');
        resolve();
      });
    });

    console.log('📡 Listening for text protocol responses...\n');

    // Command handler
    const sendCommand = (command: string): Promise<string> => {
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Command timeout'));
        }, 5000);

        const handler = (response: string) => {
          clearTimeout(timeout);
          parser.off('data', handler);
          resolve(response);
        };

        parser.once('data', handler);
        port.write(`${command}\n`);
      });
    };

    // Send commands and wait for responses
    try {
      console.log('📤 Sending: GET_STATUS');
      const response1 = await sendCommand('GET_STATUS');
      console.log(`📥 Response: ${response1}`);

      await new Promise((resolve) => setTimeout(resolve, 500));

      console.log('\n📤 Sending: GET_VERSION');
      const response2 = await sendCommand('GET_VERSION');
      console.log(`📥 Response: ${response2}`);
    } catch (error: any) {
      console.error('❌ Command error:', error.message);
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Close port
    await new Promise<void>((resolve) => {
      port.close(() => {
        console.log('✅ Port closed');
        resolve();
      });
    });

    console.log('\n✅ Text protocol example completed');
  } catch (error: any) {
    console.error('❌ Example failed:', error.message);
    throw error;
  }
}

/**
 * Main function - Entry point when running directly with tsx
 */
async function main(): Promise<void> {
  console.log('🔧 SerialPort Examples\n');
  console.log('Comprehensive examples demonstrating SerialPort Stream API\n');

  const args = process.argv.slice(2);
  const command = args[0];

  try {
    switch (command) {
      case 'stream':
        await exampleStreamOperations();
        break;

      case 'update':
        await exampleBaudRateUpdate();
        break;

      case 'control':
        await exampleControlFlags();
        break;

      case 'buffer':
        await exampleBufferManagement();
        break;

      case 'delimiter':
        await exampleDelimiterParser();
        break;

      case 'byte-length':
        await exampleByteLengthParser();
        break;

      case 'non-blocking':
        await exampleNonBlockingWrites();
        break;

      case 'modes':
        await exampleReadableModes();
        break;

      case 'errors':
        await exampleErrorHandling();
        break;

      case 'arduino':
        await exampleArduinoCommunication();
        break;

      case 'binary':
        await exampleBinaryProtocol();
        break;

      case 'text':
        await exampleTextProtocol();
        break;

      default:
        console.log('Usage: tsx examples.serialport.ts <command>\n');
        console.log('Commands:');
        console.log('  stream       - Basic stream operations (read, write, pause, resume)');
        console.log('  update       - Update baud rate on open port');
        console.log('  control      - Set/get hardware control flags (DTR, RTS, etc.)');
        console.log('  buffer       - Buffer management (flush, drain)');
        console.log('  delimiter    - DelimiterParser with custom delimiters');
        console.log('  byte-length  - ByteLengthParser for fixed-size packets');
        console.log('  non-blocking - Non-blocking writes and drain events');
        console.log('  modes        - Flowing vs paused stream modes');
        console.log('  errors       - Error handling patterns');
        console.log('  arduino      - Arduino communication pattern');
        console.log('  binary       - Binary protocol with packet framing');
        console.log('  text         - Text protocol with command/response');
        console.log('\nExamples:');
        console.log('  tsx examples.serialport.ts stream');
        console.log('  tsx examples.serialport.ts delimiter');
        console.log('  tsx examples.serialport.ts arduino');
        break;
    }
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Run main if executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
  });
}