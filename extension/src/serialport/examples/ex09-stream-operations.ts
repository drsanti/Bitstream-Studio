import { SerialPort } from 'serialport';
import { getFirstPort, sleep } from './direct-helpers';

export async function run(): Promise<void> {
  const portInfo = await getFirstPort();
  console.log(`Using port: ${portInfo.path}`);

  const port = new SerialPort({ path: portInfo.path, baudRate: 115200, autoOpen: false });

  await new Promise<void>((resolve, reject) => {
    port.open((err) => (err ? reject(err) : resolve()));
  });
  console.log('opened');

  port.on('data', (buf: Buffer) => console.log('RX:', buf.toString('utf8')));
  port.write('Hello from ex09\n');

  console.log('pause');
  port.pause();
  await sleep(500);
  console.log('resume');
  port.resume();
  await sleep(500);

  port.pause();
  const data = port.read();
  console.log('read():', data ? data.toString('utf8') : null);
  port.resume();

  await sleep(1000);
  await new Promise<void>((resolve) => port.close(() => resolve()));
}

if (require.main === module) {
  run().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

