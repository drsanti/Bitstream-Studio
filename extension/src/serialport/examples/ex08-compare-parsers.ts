import { listPorts } from './t3d-helpers';

export async function run(): Promise<void> {
  console.log('Compare parsers (no I/O required)\n');
  const ports = await listPorts();
  console.log(`Ports detected: ${ports.length}`);
  console.log('\nReadlineParser: text protocols (newline-separated)');
  console.log('DelimiterParser: custom delimiters (CRLF, pipes, binary markers)');
  console.log('ByteLengthParser: fixed-size binary packets\n');
}

if (require.main === module) {
  run().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

