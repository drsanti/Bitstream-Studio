# Course Studio diagram golden frames

JSON fixtures for resolved `diagram.v1` binding snapshots (`validate/diagramGoldenValidate.ts`).

## Run

```bash
cd extension
npm run presentation:validate -- --golden
```

Fixtures live in this directory. Each file lists `diagramId` and `cases[]` with partial resolved node props (`y`, `content`, `flowActive`, …).

## When to update

After changing MapOp chains, binding paths, or pilot diagram geometry that affects golden expectations, edit the matching fixture and re-run `--golden`.
