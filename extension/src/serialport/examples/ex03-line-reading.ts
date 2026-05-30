import {
  closePort,
  displayStatus,
  getFirstPort,
  openPort,
  readLines,
  writeData,
} from './t3d-helpers';

export async function run(): Promise<void> {
  const portInfo = await getFirstPort();
  console.log(`Using port: ${portInfo.path}`);

  const port = await openPort(portInfo.path, 115200, {
    readline: true,
    readlineDelimiter: '\n',
    readlineEncoding: 'utf8',
  });

  try {
    displayStatus(port);

    const stop = readLines(port, (line) => {
      console.log('LINE:', line);
    });

    await writeData(port, 'Line 1\n');
    await writeData(port, 'Line 2\n');
    await writeData(port, 'Line 3\n');

    await new Promise((r) => setTimeout(r, 3000));
    stop();
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

