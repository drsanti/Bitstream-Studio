import { SerialPort } from 'serialport';
import { T3DSerialPort, type SerialPortConfig } from '../T3DSerialPort';

export type PortInfo = Awaited<ReturnType<typeof SerialPort.list>>[number];

export async function listPorts(): Promise<PortInfo[]> {
  const ports = await T3DSerialPort.list();
  return ports;
}

export async function getFirstPort(): Promise<PortInfo> {
  const ports = await listPorts();
  if (ports.length === 0) {
    throw new Error('No serial ports available');
  }
  return ports[0];
}

export async function openPort(
  path: string,
  baudRate: number,
  options?: Partial<SerialPortConfig>
): Promise<T3DSerialPort> {
  const port = new T3DSerialPort();
  await port.open({
    path,
    baudRate,
    ...options,
  });
  return port;
}

export async function writeData(
  port: T3DSerialPort,
  data: string | Buffer
): Promise<void> {
  await port.write(data);
}

export function readData(
  port: T3DSerialPort,
  handler: (data: Buffer) => void
): () => void {
  port.on('data', handler);
  return () => port.off('data', handler);
}

export function readLines(
  port: T3DSerialPort,
  handler: (line: string) => void
): () => void {
  port.on('line', handler);
  return () => port.off('line', handler);
}

export function displayStatus(port: T3DSerialPort): void {
  const status = port.getStatus();
  const cfg = port.getConfig();
  console.log('Status:', {
    isOpen: status.isOpen,
    path: status.path,
    baudRate: status.baudRate,
    bytesWritten: status.bytesWritten,
    bytesRead: status.bytesRead,
    readline: cfg?.readline ?? false,
  });
}

export async function closePort(port: T3DSerialPort): Promise<void> {
  if (port.isOpen()) {
    await port.close();
  }
}

