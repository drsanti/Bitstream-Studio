import { SerialPort } from 'serialport';
import { getFirstPort, sleep } from './direct-helpers';

export async function run(): Promise<void> {
  const portInfo = await getFirstPort();
  console.log(`Using port: ${portInfo.path}`);

  const port = new SerialPort({ path: portInfo.path, baudRate: 115200 });

  port.on('error', (err: Error) => {
    console.error('error event:', err.message);
  });

  port.on('close', (err?: Error) => {
    if (err) console.log('closed with error:', err.message);
    else console.log('closed');
  });

  await new Promise<void>((resolve) => port.once('open', () => resolve()));
  console.log('opened');

  port.write('Test data\n', (err) => {
    if (err) console.error('write cb error:', err.message);
  });

  await sleep(1000);
  await new Promise<void>((resolve) => port.close(() => resolve()));
}

if (require.main === module) {
  run().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

