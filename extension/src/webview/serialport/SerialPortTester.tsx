import React, { useCallback, useEffect, useRef, useState } from "react";
import { useSerialPort } from "./useSerialPort";

const MAX_STREAM_LINES = 200;
const decoder = new TextDecoder("utf-8", { fatal: false });

function chunkToHexLine(u8: Uint8Array): string {
  return Array.from(u8)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join(" ");
}

function chunksToTextLines(u8: Uint8Array): string[] {
  const s = decoder.decode(u8);
  return s.split(/\r\n|\n|\r/);
}

export function SerialPortTester() {
  const [viewMode, setViewMode] = useState<"text" | "hex">("text");
  const [streamLines, setStreamLines] = useState<string[]>([]);
  const [writeText, setWriteText] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const viewModeRef = useRef(viewMode);
  viewModeRef.current = viewMode;

  const onData = useCallback((chunk: Uint8Array, _encoding?: string) => {
    setStreamLines((prev) => {
      const next =
        viewModeRef.current === "hex"
          ? [...prev, chunkToHexLine(chunk)]
          : [...prev, ...chunksToTextLines(chunk)];
      return next.slice(-MAX_STREAM_LINES);
    });
  }, []);

  const { status, write, isConnected } = useSerialPort("raw", onData);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [streamLines]);

  const handleWrite = useCallback(async () => {
    if (!writeText.trim()) return;
    try {
      await write(writeText);
      setWriteText("");
    } catch (e) {
      console.error("Write failed:", e);
    }
  }, [write, writeText]);

  return (
    <div className="flex min-h-0 flex-1 flex-col w-full p-6 space-y-4 border-2 overflow-hidden">
      <h1 className="text-2xl font-bold mb-4 shrink-0">
        SerialPort (WebSocket Bridge)
      </h1>
      <p className="text-sm text-gray-400 mb-2 shrink-0">
        Open and configure the port in the <strong>Settings</strong> tab.
      </p>

      <div className="bg-gray-800 rounded-lg p-4 space-y-3 shrink-0">
        <h2 className="text-lg font-semibold">Write</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={writeText}
            onChange={(e) => setWriteText(e.target.value)}
            placeholder="Type to send..."
            className="flex-1 px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
            disabled={!isConnected || !status?.isOpen}
            onKeyDown={(e) => e.key === "Enter" && handleWrite()}
          />
          <button
            onClick={handleWrite}
            disabled={!isConnected || !status?.isOpen}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded font-semibold"
          >
            Send
          </button>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-4 space-y-2 flex flex-col overflow-hidden flex-1 min-h-0">
        <div className="flex justify-between items-center shrink-0">
          <h2 className="text-lg font-semibold">Stream (MCU &rarr; UI)</h2>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setViewMode("text");
                setStreamLines([]);
              }}
              className={`px-3 py-1 rounded text-sm ${viewMode === "text" ? "bg-blue-600" : "bg-gray-700"}`}
            >
              Text
            </button>
            <button
              onClick={() => {
                setViewMode("hex");
                setStreamLines([]);
              }}
              className={`px-3 py-1 rounded text-sm ${viewMode === "hex" ? "bg-blue-600" : "bg-gray-700"}`}
            >
              Hex
            </button>
            <button
              onClick={() => setStreamLines([])}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded"
            >
              Clear
            </button>
          </div>
        </div>
        <div className="min-h-0 flex-1 flex flex-col">
          <div
            ref={scrollRef}
            className="bg-gray-900 rounded px-3 pt-4 pb-4 overflow-y-auto font-mono text-sm leading-normal whitespace-pre-wrap break-all min-h-0 flex-1"
            style={{ scrollPaddingTop: 8, scrollPaddingBottom: 16 }}
          >
            {streamLines.length === 0 ? (
              <p className="text-gray-500">
                No data yet. Open a port in Settings to see the stream here.
              </p>
            ) : (
              <>
                <div className="min-h-[0.25em] shrink-0" aria-hidden="true" />
                {streamLines.map((line, i) => (
                  <div key={i} className="text-lime-300">
                    {line}
                  </div>
                ))}
                <div className="min-h-[0.5em] shrink-0" aria-hidden="true" />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
