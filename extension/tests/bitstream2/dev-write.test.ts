import assert from "node:assert/strict";
import test from "node:test";
import { applyDevSerialWrite } from "../../src/bitstream2/dev/dev-write";

test("applyDevSerialWrite throws when port closed and no external sim", async () => {
  await assert.rejects(
    () =>
      applyDevSerialWrite({
        data: Uint8Array.of(9),
        portOpen: false,
        useExternalSim: false,
        writeToPort: async () => {},
        feedExternalSim: async () => {},
      }),
    /not open/i,
  );
});

test("applyDevSerialWrite writes port only when external sim off", async () => {
  let portWrites = 0;
  await applyDevSerialWrite({
    data: Uint8Array.of(4),
    portOpen: true,
    useExternalSim: false,
    writeToPort: async () => {
      portWrites += 1;
    },
    feedExternalSim: async () => {
      throw new Error("should not feed external sim");
    },
  });
  assert.equal(portWrites, 1);
});

test("applyDevSerialWrite routes to external sim when useExternalSim", async () => {
  const external: Uint8Array[] = [];
  await applyDevSerialWrite({
    data: Uint8Array.of(5, 6),
    portOpen: false,
    useExternalSim: true,
    writeToPort: async () => {
      throw new Error("should not write to port");
    },
    feedExternalSim: async (d) => {
      external.push(d);
    },
  });
  assert.equal(external.length, 1);
  assert.deepEqual([...external[0]!], [5, 6]);
});

test("applyDevSerialWrite prefers port when COM open (no external sim feed)", async () => {
  let portWrites = 0;
  let externalFeeds = 0;
  await applyDevSerialWrite({
    data: Uint8Array.of(7),
    portOpen: true,
    useExternalSim: true,
    writeToPort: async () => {
      portWrites += 1;
    },
    feedExternalSim: async () => {
      externalFeeds += 1;
    },
  });
  assert.equal(portWrites, 1);
  assert.equal(externalFeeds, 0);
});
