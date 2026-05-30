import { SerialPort } from 'serialport';
import { ByteLengthParser } from '@serialport/parser-byte-length';
import { getFirstPort, sleep } from './direct-helpers';

export async function run(): Promise<void> {
  const portInfo = await getFirstPort();
  console.log(`Using port: ${portInfo.path}`);

  const port = new SerialPort({ path: portInfo.path, baudRate: 115200 });
  const parser = port.pipe(new ByteLengthParser({ length: 8 }));

  parser.on('data', (data: Buffer) => {
    console.log('PACKET 8B:', data.toString('hex'));
  });

  await new Promise<void>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('open timeout')), 5000);
    port.once('open', () => {
      clearTimeout(t);
      resolve();
    });
    port.once('error', (e) => {
      clearTimeout(t);
      reject(e);
    });
  });

  port.write('HelloWorld12345678'); // 16 bytes = 2 packets
  await sleep(200);

  port.write(
    Buffer.from([0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x10, 0x20, 0x30, 0x40, 0x50, 0x60, 0x70, 0x80])
  );
  await sleep(1000);

  await new Promise<void>((resolve) => port.close(() => resolve()));
}

if (require.main === module) {
  run().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

