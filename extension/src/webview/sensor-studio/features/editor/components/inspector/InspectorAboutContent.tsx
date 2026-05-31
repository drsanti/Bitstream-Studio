import type { SensorInspectorAboutContent } from "./sensor-inspector-about-content";

export type InspectorAboutContentProps = {
  content: SensorInspectorAboutContent;
  /** Catalog one-liner (shown when distinct from role). */
  catalogLead?: string | null;
};

function AboutSubheading(props: { children: string }) {
  return (
    <div className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
      {props.children}
    </div>
  );
}

export function InspectorAboutContent(props: InspectorAboutContentProps) {
  const { content, catalogLead } = props;

  return (
    <div className="space-y-3 text-[11px] leading-relaxed text-zinc-400">
      <div className="space-y-1">
        <div className="text-[11px] font-medium text-zinc-200">
          {content.vendor} {content.chip}
        </div>
        <p>{content.role}</p>
        {catalogLead != null && catalogLead !== content.role ? (
          <p className="text-zinc-500">{catalogLead}</p>
        ) : null}
      </div>

      {content.tapNote != null ? (
        <p className="rounded border border-zinc-800/70 bg-zinc-950/50 px-2 py-1.5 text-[10px] leading-snug text-zinc-400">
          {content.tapNote}
        </p>
      ) : null}

      <div className="space-y-1.5">
        <AboutSubheading>Learn</AboutSubheading>
        <ul className="list-disc space-y-1 pl-4">
          {content.learnMore.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      <div className="space-y-1.5">
        <AboutSubheading>Measurement range (datasheet FSR / operating)</AboutSubheading>
        <div className="overflow-x-auto rounded border border-zinc-800/60">
          <table className="w-full min-w-0 border-collapse text-left text-[10px]">
            <thead>
              <tr className="border-b border-zinc-800/70 bg-zinc-950/50 text-zinc-500">
                <th scope="col" className="px-2 py-1.5 font-medium">
                  Quantity
                </th>
                <th scope="col" className="px-2 py-1.5 font-medium">
                  Min
                </th>
                <th scope="col" className="px-2 py-1.5 font-medium">
                  Max
                </th>
                <th scope="col" className="px-2 py-1.5 font-medium">
                  Unit
                </th>
              </tr>
            </thead>
            <tbody>
              {content.ranges.map((row) => (
                <tr key={row.quantity} className="border-b border-zinc-800/40 last:border-b-0">
                  <td className="px-2 py-1.5 align-top text-zinc-300">{row.quantity}</td>
                  <td className="px-2 py-1.5 align-top font-mono tabular-nums text-zinc-400">
                    {row.min}
                  </td>
                  <td className="px-2 py-1.5 align-top font-mono tabular-nums text-zinc-400">
                    {row.max}
                  </td>
                  <td className="px-2 py-1.5 align-top text-zinc-400">
                    {row.unit}
                    {row.note != null ? (
                      <span className="mt-0.5 block text-[9px] leading-snug text-zinc-600">
                        {row.note}
                      </span>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-1.5">
        <AboutSubheading>Typical accuracy (datasheet)</AboutSubheading>
        <div className="overflow-x-auto rounded border border-zinc-800/60">
          <table className="w-full min-w-0 border-collapse text-left text-[10px]">
            <tbody>
              {content.accuracy.map((row) => (
                <tr key={row.quantity} className="border-b border-zinc-800/40 last:border-b-0">
                  <th
                    scope="row"
                    className="max-w-[55%] px-2 py-1.5 text-left font-normal text-zinc-500"
                  >
                    {row.quantity}
                  </th>
                  <td className="px-2 py-1.5 text-right font-mono tabular-nums text-zinc-300">
                    {row.typical}
                    {row.note != null ? (
                      <span className="mt-0.5 block text-[9px] font-sans text-zinc-600">
                        {row.note}
                      </span>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-1">
        <AboutSubheading>In Bitstream Studio</AboutSubheading>
        <p>{content.bitstreamNote}</p>
      </div>

      <a
        href={content.datasheetUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex text-[10px] font-medium text-sky-400/90 hover:text-sky-300"
      >
        {content.datasheetLabel} (PDF) ↗
      </a>
    </div>
  );
}
