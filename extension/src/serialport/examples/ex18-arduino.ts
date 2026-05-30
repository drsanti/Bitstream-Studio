import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
import { getFirstPort, sleep } from './direct-helpers';

export async function run(): Promise<void> {
  const portInfo = await getFirstPort();
  console.log(`Using port: ${portInfo.path}`);

  const port = new SerialPort({ path: portInfo.path, baudRate: 9600 });
  const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));
  parser.on('data', (line: string) => console.log('ARDUINO:', line));

  await new Promise<void>((resolve) => port.once('open', () => resolve()));
  console.log('opened (waiting 2s for Arduino reset)');
  await sleep(2000);

  for (const cmd of ['LED_ON', 'STATUS', 'LED_OFF']) {
    console.log('TX:', cmd);
    port.write(`${cmd}\n`);
    await sleep(500);
  }

  await sleep(1000);
  await new Promise<void>((resolve) => port.close(() => resolve()));
}

if (require.main === module) {
  run().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

