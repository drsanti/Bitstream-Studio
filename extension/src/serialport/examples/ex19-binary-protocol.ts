import { SerialPort } from 'serialport';
import { ByteLengthParser } from '@serialport/parser-byte-length';
import { getFirstPort, sleep } from './direct-helpers';

export async function run(): Promise<void> {
  const portInfo = await getFirstPort();
  console.log(`Using port: ${portInfo.path}`);

  const port = new SerialPort({ path: portInfo.path, baudRate: 115200 });
  const parser = port.pipe(new ByteLengthParser({ length: 4 }));

  parser.on('data', (packet: Buffer) => {
    const checksum = Array.from(packet).reduce((a, b) => a + b, 0) & 0xff;
    console.log('RX:', Array.from(packet), 'checksum:', checksum);
  });

  await new Promise<void>((resolve) => port.once('open', () => resolve()));

  const createPacket = (cmd: number, p1: number, p2: number): Buffer => {
    const buf = Buffer.from([cmd, p1, p2, 0]);
    buf[3] = (cmd + p1 + p2) & 0xff;
    return buf;
  };

  const p1 = createPacket(0x01, 0x10, 0x20);
  const p2 = createPacket(0x02, 0x30, 0x40);

  // Print readable data
  // console.log('p1:', p1.toString('hex'));
  // console.log('p2:', p2.toString('hex'));
  
  port.write(p1);
  await sleep(200);
  port.write(p2);

  await sleep(1500);
  await new Promise<void>((resolve) => port.close(() => resolve()));
}

if (require.main === module) {
  run().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

