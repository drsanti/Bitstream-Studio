import { listSerialPortDetails } from "./services/serial-port-details-service";

async function main(): Promise<void> {
  const ports = await listSerialPortDetails();
  console.log("LIST_RESPONSE", JSON.stringify({ ports }));
}

void main().catch((error) => {
  console.error("PROBE_ERR", error);
  process.exit(1);
});
