import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
import { getFirstPort, sleep } from './direct-helpers';

export async function run(): Promise<void> {
  const portInfo = await getFirstPort();
  console.log(`Using port: ${portInfo.path}`);

  const port = new SerialPort({ path: portInfo.path, baudRate: 115200 });
  const parser = port.pipe(
    new ReadlineParser({ delimiter: '\n', encoding: 'utf8', includeDelimiter: false })
  );

  parser.on('data', (line: string) => console.log('LINE:', line));

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

  port.write('Hello\n');
  await sleep(100);
  port.write('World\n');
  await sleep(1000);

  await new Promise<void>((resolve) => port.close(() => resolve()));
}

if (require.main === module) {
  run().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

