import { SerialPort } from 'serialport';
import { DelimiterParser } from '@serialport/parser-delimiter';
import { getFirstPort, sleep } from './direct-helpers';

export async function run(): Promise<void> {
  const portInfo = await getFirstPort();
  console.log(`Using port: ${portInfo.path}`);

  const port = new SerialPort({ path: portInfo.path, baudRate: 115200 });

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

  console.log('CRLF delimiter (\\r\\n)');
  const parser1 = port.pipe(new DelimiterParser({ delimiter: '\r\n', includeDelimiter: false }));
  parser1.on('data', (buf: Buffer) => console.log('CRLF:', buf.toString('utf8')));
  port.write('Message 1\r\n');
  await sleep(100);
  port.write('Message 2\r\n');
  await sleep(500);
  parser1.destroy();

  console.log('Pipe delimiter (|)');
  const parser2 = port.pipe(new DelimiterParser({ delimiter: '|', includeDelimiter: false }));
  parser2.on('data', (buf: Buffer) => console.log('PIPE:', buf.toString('utf8')));
  port.write('A|B|C|');
  await sleep(500);
  parser2.destroy();

  console.log('Binary delimiter ([0xFF,0xFE])');
  const parser3 = port.pipe(new DelimiterParser({ delimiter: [0xff, 0xfe], includeDelimiter: false }));
  parser3.on('data', (buf: Buffer) => console.log('BIN:', buf.toString('hex')));
  port.write(Buffer.from([0x48, 0x65, 0x6c, 0x6c, 0x6f, 0xff, 0xfe]));
  await sleep(500);
  parser3.destroy();

  await new Promise<void>((resolve) => port.close(() => resolve()));
}

if (require.main === module) {
  run().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

