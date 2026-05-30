import {
  closePort,
  displayStatus,
  getFirstPort,
  openPort,
  readData,
} from './t3d-helpers';

export async function run(): Promise<void> {
  const portInfo = await getFirstPort();
  console.log(`Using port: ${portInfo.path}`);

  const port = await openPort(portInfo.path, 115200);
  displayStatus(port);

  const stop = readData(port, (data) => {
    const text = data.toString('utf8');
    process.stdout.write(text);
  });

  const shutdown = async () => {
    stop();
    await closePort(port);
  };

  process.on('SIGINT', async () => {
    await shutdown();
    process.exit(0);
  });

  console.log('Listening (Ctrl+C to quit)...');
  await new Promise(() => {});
}

if (require.main === module) {
  run().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

