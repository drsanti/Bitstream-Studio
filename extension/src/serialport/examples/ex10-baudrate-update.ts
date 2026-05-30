import { SerialPort } from 'serialport';
import { getFirstPort, sleep } from './direct-helpers';

export async function run(): Promise<void> {
  const portInfo = await getFirstPort();
  console.log(`Using port: ${portInfo.path}`);

  const port = new SerialPort({ path: portInfo.path, baudRate: 9600 });
  await new Promise<void>((resolve) => port.once('open', () => resolve()));
  console.log(`opened at ${port.baudRate}`);

  await new Promise<void>((resolve, reject) => {
    port.update({ baudRate: 115200 }, (err) => (err ? reject(err) : resolve()));
  });
  console.log(`updated to ${port.baudRate}`);

  port.write('Test after update\n');
  await sleep(500);
  await new Promise<void>((resolve) => port.close(() => resolve()));
}

if (require.main === module) {
  run().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

