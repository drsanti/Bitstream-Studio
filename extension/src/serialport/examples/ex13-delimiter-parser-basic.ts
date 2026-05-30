import { SerialPort } from 'serialport';
import { DelimiterParser } from '@serialport/parser-delimiter';
import { getFirstPort, sleep } from './direct-helpers';

export async function run(): Promise<void> {
  const portInfo = await getFirstPort();
  console.log(`Using port: ${portInfo.path}`);

  const port = new SerialPort({ path: portInfo.path, baudRate: 115200 });
  await new Promise<void>((resolve) => port.once('open', () => resolve()));

  const parser = port.pipe(new DelimiterParser({ delimiter: '|' }));
  parser.on('data', (buf: Buffer) => console.log('PKT:', buf.toString('utf8')));

  port.write('Packet1|Packet2|Packet3|');
  await sleep(1500);

  await new Promise<void>((resolve) => port.close(() => resolve()));
}

if (require.main === module) {
  run().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

