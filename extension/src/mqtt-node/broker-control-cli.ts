import { WebSocket } from 'ws';

type CliCommand = 'status' | 'stop' | 'restart';

interface ControlResponse {
  id: string;
  data: unknown;
  error?: string;
}

function parseCommand(): CliCommand {
  const command = (process.argv[2] ?? 'status').toLowerCase();
  if (command === 'status' || command === 'stop' || command === 'restart') {
    return command;
  }
  throw new Error(
    `Unknown command "${command}". Use one of: status, stop, restart.`
  );
}

function commandToMessageType(command: CliCommand) {
  switch (command) {
    case 'status':
      return 'get-status';
    case 'stop':
      return 'stop';
    case 'restart':
      return 'restart';
  }
}

async function run(): Promise<void> {
  const command = parseCommand();
  const requestType = commandToMessageType(command);
  const controlUrl = process.env.T3D_BROKER_CONTROL_URL ?? 'ws://127.0.0.1:9999';
  const requestId = Math.random().toString(36).slice(2);

  await new Promise<void>((resolve, reject) => {
    const ws = new WebSocket(controlUrl);
    const timeout = setTimeout(() => {
      ws.close();
      reject(new Error(`Request timeout for ${command} at ${controlUrl}`));
    }, 5000);

    ws.on('open', () => {
      ws.send(
        JSON.stringify({
          id: requestId,
          type: requestType,
        })
      );
    });

    ws.on('message', (payload) => {
      const response = JSON.parse(payload.toString()) as ControlResponse;
      if (response.id !== requestId) {
        return;
      }

      clearTimeout(timeout);
      ws.close();

      if (response.error) {
        reject(new Error(response.error));
        return;
      }

      if (command === 'status') {
        console.log(
          JSON.stringify(
            {
              source: controlUrl,
              status: response.data,
            },
            null,
            2
          )
        );
      } else {
        console.log(`Broker ${command} command sent successfully via ${controlUrl}`);
      }
      resolve();
    });

    ws.on('error', (error) => {
      clearTimeout(timeout);
      reject(
        new Error(
          `Cannot connect to broker control API at ${controlUrl}: ${
            error instanceof Error ? error.message : String(error)
          }`
        )
      );
    });
  });
}

run().catch((error) => {
  console.error(
    `[broker-control-cli] ${error instanceof Error ? error.message : String(error)}`
  );
  process.exit(1);
});
