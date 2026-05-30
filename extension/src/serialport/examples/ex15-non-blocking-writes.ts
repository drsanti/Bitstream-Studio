import { SerialPort } from 'serialport';
import { getFirstPort, sleep } from './direct-helpers';

export async function run(): Promise<void> {
  const portInfo = await getFirstPort();
  console.log(`Using port: ${portInfo.path}`);

  const port = new SerialPort({ path: portInfo.path, baudRate: 115200 });
  await new Promise<void>((resolve) => port.once('open', () => resolve()));

  const writeWithDrain = async (data: string) => {
    const ok = port.write(data);
    if (!ok) {
      await new Promise<void>((resolve) => port.once('drain', () => resolve()));
    }
  };

  await writeWithDrain('Chunk 1\n');
  await writeWithDrain('Chunk 2\n');
  await writeWithDrain('Chunk 3\n');
  await sleep(500);

  await new Promise<void>((resolve) => port.close(() => resolve()));
}

if (require.main === module) {
  run().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

