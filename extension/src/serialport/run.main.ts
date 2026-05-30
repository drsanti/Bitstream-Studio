type ExampleId =
  | 'ex01'
  | 'ex02'
  | 'ex03'
  | 'ex04'
  | 'ex05'
  | 'ex06'
  | 'ex07'
  | 'ex08'
  | 'ex09'
  | 'ex10'
  | 'ex11'
  | 'ex12'
  | 'ex13'
  | 'ex14'
  | 'ex15'
  | 'ex16'
  | 'ex17'
  | 'ex18'
  | 'ex19'
  | 'ex20';

const exampleMap: Record<ExampleId, string> = {
  ex01: './examples/ex01-basic-usage',
  ex02: './examples/ex02-interactive',
  ex03: './examples/ex03-line-reading',
  ex04: './examples/ex04-continuous-lines',
  ex05: './examples/ex05-parser-readline',
  ex06: './examples/ex06-parser-delimiter-multi',
  ex07: './examples/ex07-parser-byte-length-multi',
  ex08: './examples/ex08-compare-parsers',
  ex09: './examples/ex09-stream-operations',
  ex10: './examples/ex10-baudrate-update',
  ex11: './examples/ex11-control-flags',
  ex12: './examples/ex12-buffer-management',
  ex13: './examples/ex13-delimiter-parser-basic',
  ex14: './examples/ex14-byte-length-parser-basic',
  ex15: './examples/ex15-non-blocking-writes',
  ex16: './examples/ex16-readable-modes',
  ex17: './examples/ex17-error-handling',
  ex18: './examples/ex18-arduino',
  ex19: './examples/ex19-binary-protocol',
  ex20: './examples/ex20-text-protocol',
};

function printHelp(): void {
  console.log('Usage: tsx src/serialport/run.main.ts <exNN>\n');
  console.log('Examples:');
  console.log('  ex01  - basic usage (T3DSerialPort wrapper)');
  console.log('  ex02  - interactive raw data (T3DSerialPort wrapper)');
  console.log('  ex03  - line reading (T3DSerialPort + ReadlineParser)');
  console.log('  ex04  - continuous lines (T3DSerialPort + ReadlineParser)');
  console.log('  ex05  - parser-readline (direct SerialPort.pipe)');
  console.log('  ex06  - parser-delimiter multi (direct SerialPort.pipe)');
  console.log('  ex07  - parser-byte-length multi (direct SerialPort.pipe)');
  console.log('  ex08  - compare parsers (no I/O)');
  console.log('  ex09  - stream operations (pause/resume/read)');
  console.log('  ex10  - update baudRate');
  console.log('  ex11  - set/get control flags');
  console.log('  ex12  - flush/drain');
  console.log('  ex13  - delimiter parser (basic)');
  console.log('  ex14  - byte-length parser (basic)');
  console.log('  ex15  - non-blocking writes + drain');
  console.log('  ex16  - readable modes');
  console.log('  ex17  - error handling');
  console.log('  ex18  - arduino pattern');
  console.log('  ex19  - binary protocol');
  console.log('  ex20  - text protocol');
}

async function main(): Promise<void> {
  const arg = process.argv.slice(2)[0] as ExampleId | undefined;
  if (!arg) {
    printHelp();
    return;
  }

  const target = exampleMap[arg];
  if (!target) {
    printHelp();
    process.exitCode = 1;
    return;
  }

  const mod = (await import(target)) as { run?: () => Promise<void> };
  if (!mod.run) {
    throw new Error(`Example module ${target} has no exported run()`);
  }
  await mod.run();
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

