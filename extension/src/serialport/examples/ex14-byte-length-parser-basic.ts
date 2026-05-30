import { SerialPort } from 'serialport';
import { ByteLengthParser } from '@serialport/parser-byte-length';
import { getFirstPort, sleep } from './direct-helpers';

export async function run(): Promise<void> {
  const portInfo = await getFirstPort();
  console.log(`Using port: ${portInfo.path}`);

  const port = new SerialPort({ path: portInfo.path, baudRate: 115200 });
  await new Promise<void>((resolve) => port.once('open', () => resolve()));

  const parser = port.pipe(new ByteLengthParser({ length: 8 }));
  parser.on('data', (buf: Buffer) =>
    console.log('8B:', buf.toString('hex'), `[${Array.from(buf).join(', ')}]`)
  );

  port.write(Buffer.from([1, 2, 3, 4, 5, 6, 7, 8]));
  port.write(Buffer.from([16, 32, 48, 64, 80, 96, 112, 128]));
  await sleep(1000);

  await new Promise<void>((resolve) => port.close(() => resolve()));
}

if (require.main === module) {
  run().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

