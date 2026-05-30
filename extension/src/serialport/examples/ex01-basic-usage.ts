import {
  closePort,
  displayStatus,
  getFirstPort,
  openPort,
  readData,
  writeData,
} from './t3d-helpers';

export async function run(): Promise<void> {
  const portInfo = await getFirstPort();
  console.log(`Using port: ${portInfo.path}`);

  const port = await openPort(portInfo.path, 115200);
  try {
    displayStatus(port);

    const stop = readData(port, (data) => {
      const text = data.toString('utf8').trim();
      if (text.length > 0) console.log('RX:', text);
    });

    await writeData(port, 'Hello from ex01-basic-usage\n');
    await new Promise((r) => setTimeout(r, 2000));
    stop();

    displayStatus(port);
  } finally {
    await closePort(port);
  }
}

if (require.main === module) {
  run().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

