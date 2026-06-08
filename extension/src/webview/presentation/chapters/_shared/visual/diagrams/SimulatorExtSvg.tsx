/** External bitstream-simulator VSIX streams into the same broker as Bitstream Studio. */
export function SimulatorExtSvg() {
  return (
    <svg className="presentation-diagram-svg" viewBox="0 0 420 200" aria-hidden>
      <rect x={24} y={56} width={120} height={72} rx={10} fill="var(--surface-card)" stroke="var(--accent-cyan)" strokeWidth={1.5} />
      <text x={84} y={88} textAnchor="middle" fontSize={10} fontWeight="700" fill="var(--accent-cyan)">
        Bitstream
      </text>
      <text x={84} y={104} textAnchor="middle" fontSize={8} fill="var(--text-muted)">
        Studio VSIX
      </text>
      <text x={84} y={118} textAnchor="middle" fontSize={8} fill="var(--text-secondary)">
        webviews
      </text>

      <rect x={276} y={56} width={120} height={72} rx={10} fill="var(--surface-card)" stroke="var(--accent-purple)" strokeWidth={1.5} />
      <text x={336} y={88} textAnchor="middle" fontSize={10} fontWeight="700" fill="var(--accent-purple)">
        Simulator
      </text>
      <text x={336} y={104} textAnchor="middle" fontSize={8} fill="var(--text-muted)">
        external VSIX
      </text>
      <text x={336} y={118} textAnchor="middle" fontSize={8} fill="var(--text-secondary)">
        virtual MCU
      </text>

      <circle cx={210} cy={92} r={32} fill="var(--accent-cyan-bg)" stroke="var(--accent-cyan)" strokeWidth={2} />
      <text x={210} y={88} textAnchor="middle" fontSize={9} fontWeight="700" fill="var(--accent-cyan)">
        Bridge
      </text>
      <text x={210} y={102} textAnchor="middle" fontSize={8} fill="var(--text-muted)">
        :9998
      </text>

      <line x1={144} y1={92} x2={178} y2={92} stroke="var(--surface-border)" strokeWidth={2} />
      <line x1={242} y1={92} x2={276} y2={92} stroke="var(--surface-border)" strokeWidth={2} />

      <text x={210} y={152} textAnchor="middle" fontSize={9} fill="var(--text-secondary)">
        Mutually exclusive route: uart OR sim · origin tagged on each sample
      </text>
      <text x={210} y={168} textAnchor="middle" fontSize={8} fill="var(--text-muted)">
        sim/status · inject-rx · host-tx
      </text>
    </svg>
  );
}
