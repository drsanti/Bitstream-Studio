import { SerialPort } from 'serialport';
import { getFirstPort, sleep } from './direct-helpers';

export async function run(): Promise<void> {
  const portInfo = await getFirstPort();
  console.log(`Using port: ${portInfo.path}`);

  const port = new SerialPort({ path: portInfo.path, baudRate: 115200 });
  await new Promise<void>((resolve) => port.once('open', () => resolve()));
  console.log('opened');

  await new Promise<void>((resolve) => {
    port.get((err, status) => {
      if (err) {
        console.error('get error:', err.message);
      } else if (status) {
        console.log('Modem status:', status);
      } else {
        console.log('No status returned');
      }
      resolve();
    });
  });

  await new Promise<void>((resolve) => {
    port.set({ dtr: true, rts: true }, (err) => {
      if (err) console.error('set error:', err.message);
      else console.log('set dtr/rts');
      resolve();
    });
  });

  await sleep(500);
  await new Promise<void>((resolve) => port.close(() => resolve()));
}

if (require.main === module) {
  run().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

