import { SerialPort } from 'serialport';
import { getFirstPort, sleep } from './direct-helpers';

export async function run(): Promise<void> {
  const portInfo = await getFirstPort();
  console.log(`Using port: ${portInfo.path}`);

  const port = new SerialPort({ path: portInfo.path, baudRate: 115200 });
  await new Promise<void>((resolve) => port.once('open', () => resolve()));

  console.log('flowing mode');
  port.on('data', (buf: Buffer) => console.log('FLOW:', buf.toString('utf8').trim()));
  port.write('flowing\n');
  await sleep(500);

  console.log('paused mode');
  port.pause();
  port.write('paused (buffered)\n');
  await sleep(200);
  let chunk: Buffer | null;
  while ((chunk = port.read()) !== null) {
    console.log('READ:', chunk.toString('utf8').trim());
  }
  port.resume();

  await sleep(500);
  await new Promise<void>((resolve) => port.close(() => resolve()));
}

if (require.main === module) {
  run().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

