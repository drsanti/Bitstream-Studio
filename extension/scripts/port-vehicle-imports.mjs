/**
 * One-shot: rewrite T3D path aliases in ported vehicle-physics sources.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(
  __dirname,
  "../src/webview/simulations/vehicle-physics",
);

function walk(dir, out = [])
{
  for (const ent of fs.readdirSync(dir, { withFileTypes: true }))
  {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory())
    {
      if (ent.name === "docs")
      {
        continue;
      }
      walk(p, out);
    }
    else if (/\.tsx?$/.test(ent.name))
    {
      out.push(p);
    }
  }
  return out;
}

for (const file of walk(root))
{
  let s = fs.readFileSync(file, "utf8");
  const before = s;
  s = s.replaceAll("@/physics-jolt/", "@vehicle-jolt/");
  s = s.replaceAll("from '@/engine'", "from '@vehicle-engine'");
  s = s.replaceAll('from "@/engine"', 'from "@vehicle-engine"');
  s = s.replaceAll("import type { T3D } from '@/engine'", "import type { VehicleSimulationEngine } from '@vehicle-engine'");
  s = s.replaceAll('import type { T3D } from "@/engine"', 'import type { VehicleSimulationEngine } from "@vehicle-engine"');
  s = s.replaceAll("import { T3D } from '@/engine'", "import type { VehicleSimulationEngine } from '@vehicle-engine'");
  s = s.replaceAll('import { T3D } from "@/engine"', 'import type { VehicleSimulationEngine } from "@vehicle-engine"');
  s = s.replaceAll(/\bT3D\b/g, (m, offset) => {
    const line = s.slice(s.lastIndexOf("\n", offset) + 1, offset);
    if (line.includes("T3DPhysics") || line.includes("T3DDynamic") || line.includes("T3DCollider") || line.includes("T3DModel"))
    {
      return m;
    }
    return "VehicleSimulationEngine";
  });
  s = s.replaceAll("from '@/three'", "from 'three'");
  s = s.replaceAll('from "@/three"', 'from "three"');
  s = s.replaceAll(
    "import { THREE } from 'three'",
    "import * as THREE from 'three'",
  );
  if (file.includes(`${path.sep}physics${path.sep}jolt${path.sep}`))
  {
    s = s.replaceAll("@vehicle-engine", "@vehicle-host");
    s = s.replaceAll("VehicleSimulationEngine", "VehiclePhysicsHost");
  }
  if (s !== before)
  {
    fs.writeFileSync(file, s);
    console.log("patched", path.relative(root, file));
  }
}
