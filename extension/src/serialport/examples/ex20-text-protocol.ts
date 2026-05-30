import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
import { getFirstPort } from './direct-helpers';

export async function run(): Promise<void> {
  const portInfo = await getFirstPort();
  console.log(`Using port: ${portInfo.path}`);

  const port = new SerialPort({ path: portInfo.path, baudRate: 115200 });
  const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

  await new Promise<void>((resolve) => port.once('open', () => resolve()));

  const sendCommand = (command: string): Promise<string> =>
    new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error('timeout')), 5000);
      const handler = (line: string) => {
        clearTimeout(t);
        resolve(line);
      };
      parser.once('data', handler);
      port.write(`${command}\n`);
    });

  try {
    console.log('TX: GET_STATUS');
    console.log('RX:', await sendCommand('GET_STATUS'));
    console.log('TX: GET_VERSION');
    console.log('RX:', await sendCommand('GET_VERSION'));
  } catch (e) {
    console.error(e);
  } finally {
    await new Promise<void>((resolve) => port.close(() => resolve()));
  }
}

if (require.main === module) {
  run().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

