/**
 * Backwards-compatible re-exports.
 *
 * Examples were moved into `src/serialport/examples/exNN-*.ts`.
 * Use `npxtsx src/serialport/run.main.ts exNN` to run them.
 */

export type { PortInfo } from './examples/t3d-helpers';
export {
  closePort,
  displayStatus,
  getFirstPort,
  listPorts,
  openPort,
  readData,
  readLines,
  writeData,
} from './examples/t3d-helpers';

