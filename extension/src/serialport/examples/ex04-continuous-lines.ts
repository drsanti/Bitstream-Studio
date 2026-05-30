import {
  closePort,
  displayStatus,
  getFirstPort,
  openPort,
  readLines,
} from './t3d-helpers';

export async function run(): Promise<void> {
  const portInfo = await getFirstPort();
  console.log(`Using port: ${portInfo.path}`);

  const port = await openPort(portInfo.path, 115200, {
    readline: true,
    readlineDelimiter: '\n',
    readlineEncoding: 'utf8',
  });

  displayStatus(port);

  const stop = readLines(port, (line) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${line}`);
  });

  process.on('SIGINT', async () => {
    stop();
    await closePort(port);
    process.exit(0);
  });

  console.log('Reading lines continuously (Ctrl+C to quit)...');
  await new Promise(() => {});
}

if (require.main === module) {
  run().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

