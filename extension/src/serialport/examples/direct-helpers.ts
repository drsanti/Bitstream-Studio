import { SerialPort } from 'serialport';

export type PortInfo = Awaited<ReturnType<typeof SerialPort.list>>[number];

export async function listPorts(): Promise<PortInfo[]> {
  return SerialPort.list();
}

export async function getFirstPort(): Promise<PortInfo> {
  const ports = await listPorts();
  if (ports.length === 0) {
    throw new Error('No serial ports available');
  }
  return ports[0];
}

export async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

