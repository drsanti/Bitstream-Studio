import {
  Building2,
  Droplets,
  Image,
  Leaf,
  Map,
  MoonStar,
  Snowflake,
  Trees,
  Waves,
} from "lucide-react";

export function getEnvPresetIconByTitle(title: string) {
  const t = title.trim().toLowerCase();
  if (t.includes("bridge")) {
    return <Building2 className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />;
  }
  if (t.includes("park")) {
    return <Trees className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />;
  }
  if (t.includes("snow")) {
    return <Snowflake className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />;
  }
  if (t.includes("lawn")) {
    return <Leaf className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />;
  }
  if (t.includes("shore") || t.includes("river")) {
    return <Waves className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />;
  }
  if (t.includes("waterfall")) {
    return <Droplets className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />;
  }
  if (t.includes("footpath") || t.includes("path")) {
    return <Map className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />;
  }
  if (t.includes("night")) {
    return <MoonStar className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />;
  }
  return <Image className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />;
}
