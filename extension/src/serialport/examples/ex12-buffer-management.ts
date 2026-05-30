import { SerialPort } from 'serialport';
import { getFirstPort, sleep } from './direct-helpers';

export async function run(): Promise<void> {
  const portInfo = await getFirstPort();
  console.log(`Using port: ${portInfo.path}`);

  const port = new SerialPort({ path: portInfo.path, baudRate: 115200 });
  await new Promise<void>((resolve) => port.once('open', () => resolve()));
  console.log('opened');

  port.write('Chunk1\n');
  port.write('Chunk2\n');
  port.write('Chunk3\n');

  await new Promise<void>((resolve) => port.drain(() => resolve()));
  console.log('drained');

  await new Promise<void>((resolve) => port.flush(() => resolve()));
  console.log('flushed');

  await sleep(200);
  await new Promise<void>((resolve) => port.close(() => resolve()));
}

if (require.main === module) {
  run().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

