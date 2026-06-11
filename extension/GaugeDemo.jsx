/**
 * GaugeDemo.jsx — Interactive test page for the Gauge component
 *
 * Usage (e.g. in App.jsx or main.jsx):
 *   import GaugeDemo from './GaugeDemo';
 *   export default function App() { return <GaugeDemo />; }
 */

import React, { useState, useCallback } from 'react';
import Gauge, { DEFAULT_CONFIG, PRESETS } from './Gauge';

/* ─────────────────────────────────────────────────────────────────
   STYLES  (plain objects — no CSS-in-JS needed)
───────────────────────────────────────────────────────────────── */
const S = {
  page: {
    display: 'flex', flexDirection: 'column', height: '100vh',
    background: '#0d1117', color: '#e6edf3',
    fontFamily: 'system-ui, -apple-system, sans-serif', overflow: 'hidden',
  },
  header: {
    padding: '12px 24px', borderBottom: '1px solid #21262d',
    display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
  },
  headerTitle: { fontSize: 15, fontWeight: 600, color: '#e6edf3', margin: 0 },
  headerSub:   { fontSize: 12, color: '#8b949e', margin: 0 },

  body: { display: 'flex', flex: 1, overflow: 'hidden' },

  // Left: gauge + slider
  left: {
    width: 360, flexShrink: 0, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', gap: 24,
    borderRight: '1px solid #21262d', padding: '24px 20px',
  },
  valueBox: {
    textAlign: 'center',
  },
  valueBig: { fontSize: 38, fontWeight: 700, color: '#e6edf3', lineHeight: 1 },
  valueSub: { fontSize: 13, color: '#8b949e', marginTop: 4 },

  sliderWrap: { width: '100%', padding: '0 8px' },
  slider: { width: '100%', accentColor: '#58a6ff' },
  sliderLabels: {
    display: 'flex', justifyContent: 'space-between',
    fontSize: 11, color: '#6e7681', marginTop: 4,
  },

  // Preset row
  presetRow: {
    display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center',
  },
  presetBtn: (active) => ({
    padding: '5px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer', border: 'none',
    background: active ? '#58a6ff' : '#21262d',
    color:      active ? '#0d1117' : '#8b949e',
    fontWeight: active ? 600 : 400, transition: 'all .15s',
  }),

  // Right: config panel
  right: {
    flex: 1, overflowY: 'auto', padding: '20px 20px 32px',
  },
  panelTitle: {
    fontSize: 11, fontWeight: 600, color: '#8b949e', letterSpacing: '.06em',
    textTransform: 'uppercase', margin: '0 0 10px',
  },

  // Accordion section
  section: { marginBottom: 6 },
  sectionHeader: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '9px 12px', borderRadius: 8, cursor: 'pointer',
    background: '#161b22', border: '1px solid #21262d',
    userSelect: 'none',
  },
  sectionTitle: { fontSize: 13, fontWeight: 500, color: '#c9d1d9', flex: 1, margin: 0 },
  chevron: (open) => ({
    fontSize: 12, color: '#8b949e',
    transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
    transition: 'transform .2s',
  }),
  sectionBody: {
    padding: '12px 12px 4px', borderLeft: '1px solid #21262d',
    borderRight: '1px solid #21262d', borderBottom: '1px solid #21262d',
    borderRadius: '0 0 8px 8px', background: '#0d1117',
    marginTop: -1,
  },

  // Form rows
  row: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 10, gap: 12,
  },
  label: { fontSize: 12, color: '#8b949e', flex: '0 0 auto' },
  input: {
    background: '#161b22', border: '1px solid #30363d', borderRadius: 6,
    color: '#e6edf3', fontSize: 12, padding: '4px 8px',
    width: 90, outline: 'none', boxSizing: 'border-box',
  },
  inputWide: {
    background: '#161b22', border: '1px solid #30363d', borderRadius: 6,
    color: '#e6edf3', fontSize: 12, padding: '4px 8px',
    width: 140, outline: 'none', boxSizing: 'border-box',
  },
  select: {
    background: '#161b22', border: '1px solid #30363d', borderRadius: 6,
    color: '#e6edf3', fontSize: 12, padding: '4px 8px',
    width: 140, outline: 'none', cursor: 'pointer',
  },
  colorInput: {
    width: 36, height: 28, border: '1px solid #30363d', borderRadius: 6,
    cursor: 'pointer', padding: 2, background: '#161b22',
  },
  toggle: { cursor: 'pointer', accentColor: '#58a6ff', width: 16, height: 16 },

  // Zone list
  zoneRow: {
    display: 'flex', alignItems: 'center', gap: 6, marginBottom: 7,
  },
  zoneInput: {
    background: '#161b22', border: '1px solid #30363d', borderRadius: 5,
    color: '#e6edf3', fontSize: 11, padding: '3px 6px', width: 52, outline: 'none',
  },
  zoneLabel: { fontSize: 11, color: '#6e7681', width: 14, textAlign: 'center' },
  zoneDelete: {
    background: 'none', border: 'none', color: '#6e7681', cursor: 'pointer',
    fontSize: 15, lineHeight: 1, padding: '0 2px',
  },
  addZoneBtn: {
    display: 'block', width: '100%', marginTop: 6, padding: '6px 0',
    background: '#21262d', border: '1px dashed #30363d', borderRadius: 6,
    color: '#8b949e', fontSize: 12, cursor: 'pointer', textAlign: 'center',
  },
};

/* ─────────────────────────────────────────────────────────────────
   ACCORDION SECTION
───────────────────────────────────────────────────────────────── */
function Section({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={S.section}>
      <div style={S.sectionHeader} onClick={() => setOpen(o => !o)}>
        <p style={S.sectionTitle}>{title}</p>
        <span style={S.chevron(open)}>▼</span>
      </div>
      {open && <div style={S.sectionBody}>{children}</div>}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   GAUGE DEMO PAGE
───────────────────────────────────────────────────────────────── */
export default function GaugeDemo() {
  const [value,       setValue]       = useState(8);
  const [config,      setConfig]      = useState(DEFAULT_CONFIG);
  const [activePreset, setActivePreset] = useState('default');

  /* ── Generic config updater ── */
  const set = useCallback((key, val) => {
    setConfig(prev => ({ ...prev, [key]: val }));
    setActivePreset('custom');
  }, []);

  /* ── Preset handler ── */
  const applyPreset = useCallback((name) => {
    if (!PRESETS[name]) return;
    setConfig(prev => ({ ...prev, ...PRESETS[name] }));
    setActivePreset(name);
  }, []);

  /* ── Zone handlers ── */
  const updateZone = useCallback((i, field, val) => {
    setConfig(prev => {
      const zones = prev.zones.map((z, idx) =>
        idx === i ? { ...z, [field]: field === 'color' ? val : parseFloat(val) || 0 } : z
      );
      return { ...prev, zones };
    });
    setActivePreset('custom');
  }, []);

  const addZone = useCallback(() => {
    setConfig(prev => {
      const last = prev.zones[prev.zones.length - 1];
      const from = last ? last.to : prev.minValue;
      const to   = Math.min(from + (prev.maxValue - prev.minValue) / 5, prev.maxValue);
      return { ...prev, zones: [...prev.zones, { from, to, color: '#888888' }] };
    });
    setActivePreset('custom');
  }, []);

  const removeZone = useCallback((i) => {
    setConfig(prev => ({ ...prev, zones: prev.zones.filter((_, idx) => idx !== i) }));
    setActivePreset('custom');
  }, []);

  const presetNames = ['default', 'industrial', 'medical', 'dark', 'minimal'];

  return (
    <div style={S.page}>
      {/* ── Header ── */}
      <div style={S.header}>
        <div>
          <p style={S.headerTitle}>Gauge Designer</p>
          <p style={S.headerSub}>Live config · React component</p>
        </div>
      </div>

      <div style={S.body}>

        {/* ── Left: live gauge ── */}
        <div style={S.left}>
          <Gauge value={value} config={config} />

          <div style={S.valueBox}>
            <div style={S.valueBig}>
              {value.toFixed(config.decimalPlaces)}
              <span style={{ fontSize: 18, fontWeight: 400, color: '#8b949e', marginLeft: 6 }}>
                {config.unit}
              </span>
            </div>
            <div style={S.valueSub}>drag slider to test</div>
          </div>

          <div style={S.sliderWrap}>
            <input
              type="range" style={S.slider}
              min={config.minValue} max={config.maxValue} step={0.1}
              value={value}
              onChange={e => setValue(parseFloat(e.target.value))}
            />
            <div style={S.sliderLabels}>
              <span>{config.minValue}</span>
              <span>{config.unit}</span>
              <span>{config.maxValue}</span>
            </div>
          </div>

          {/* Preset themes */}
          <div>
            <p style={{ ...S.panelTitle, textAlign: 'center', marginBottom: 8 }}>Themes</p>
            <div style={S.presetRow}>
              {presetNames.map(name => (
                <button key={name} style={S.presetBtn(activePreset === name)}
                  onClick={() => applyPreset(name)}>
                  {name.charAt(0).toUpperCase() + name.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right: config panel ── */}
        <div style={S.right}>
          <p style={S.panelTitle}>Configuration</p>

          {/* Scale */}
          <Section title="Scale" defaultOpen>
            <div style={S.row}>
              <span style={S.label}>Min value</span>
              <input style={S.input} type="number" value={config.minValue}
                onChange={e => set('minValue', parseFloat(e.target.value) || 0)} />
            </div>
            <div style={S.row}>
              <span style={S.label}>Max value</span>
              <input style={S.input} type="number" value={config.maxValue}
                onChange={e => set('maxValue', parseFloat(e.target.value) || 100)} />
            </div>
            <div style={S.row}>
              <span style={S.label}>Unit label</span>
              <input style={S.input} type="text" value={config.unit}
                onChange={e => set('unit', e.target.value)} />
            </div>
            <div style={S.row}>
              <span style={S.label}>Major tick every</span>
              <input style={S.input} type="number" min="1" value={config.majorTickInterval}
                onChange={e => set('majorTickInterval', parseFloat(e.target.value) || 1)} />
            </div>
            <div style={S.row}>
              <span style={S.label}>Minor tick every</span>
              <input style={S.input} type="number" min="0.1" step="0.1" value={config.minorTickInterval}
                onChange={e => set('minorTickInterval', parseFloat(e.target.value) || 1)} />
            </div>
            <div style={S.row}>
              <span style={S.label}>Decimal places</span>
              <input style={S.input} type="number" min="0" max="4" value={config.decimalPlaces}
                onChange={e => set('decimalPlaces', parseInt(e.target.value) || 0)} />
            </div>
          </Section>

          {/* Color zones */}
          <Section title="Color Zones" defaultOpen>
            {config.zones.map((z, i) => (
              <div key={i} style={S.zoneRow}>
                <input style={S.zoneInput} type="number" value={z.from}
                  onChange={e => updateZone(i, 'from', e.target.value)} />
                <span style={S.zoneLabel}>–</span>
                <input style={S.zoneInput} type="number" value={z.to}
                  onChange={e => updateZone(i, 'to', e.target.value)} />
                <input style={S.colorInput} type="color" value={z.color}
                  onChange={e => updateZone(i, 'color', e.target.value)} />
                <button style={S.zoneDelete} onClick={() => removeZone(i)} title="Remove zone">×</button>
              </div>
            ))}
            <button style={S.addZoneBtn} onClick={addZone}>+ Add zone</button>
          </Section>

          {/* Structure */}
          <Section title="Structure">
            <div style={S.row}>
              <span style={S.label}>Size (px)</span>
              <input style={S.input} type="number" min="100" max="600" step="10" value={config.size}
                onChange={e => set('size', parseInt(e.target.value) || 300)} />
            </div>
            <div style={S.row}>
              <span style={S.label}>Sweep angle (°)</span>
              <input style={S.input} type="number" min="90" max="355" value={config.sweepAngle}
                onChange={e => set('sweepAngle', parseFloat(e.target.value) || 270)} />
            </div>
            <div style={S.row}>
              <span style={S.label}>Start angle (°)</span>
              <input style={S.input} type="number" min="0" max="360" value={config.startAngle}
                onChange={e => set('startAngle', parseFloat(e.target.value) || 135)} />
            </div>
            <div style={S.row}>
              <span style={S.label}>Arc radius ratio</span>
              <input style={S.input} type="number" min="0.4" max="0.95" step="0.01" value={config.arcRadiusRatio}
                onChange={e => set('arcRadiusRatio', parseFloat(e.target.value) || 0.72)} />
            </div>
            <div style={S.row}>
              <span style={S.label}>Arc thickness (px)</span>
              <input style={S.input} type="number" min="2" max="40" value={config.arcThickness}
                onChange={e => set('arcThickness', parseFloat(e.target.value) || 14)} />
            </div>
          </Section>

          {/* Face & Bezel */}
          <Section title="Face & Bezel">
            <div style={S.row}>
              <span style={S.label}>Face color</span>
              <input style={S.colorInput} type="color" value={config.faceColor}
                onChange={e => set('faceColor', e.target.value)} />
            </div>
            <div style={S.row}>
              <span style={S.label}>Bezel color</span>
              <input style={S.colorInput} type="color" value={config.bezelColor}
                onChange={e => set('bezelColor', e.target.value)} />
            </div>
            <div style={S.row}>
              <span style={S.label}>Bezel width (px)</span>
              <input style={S.input} type="number" min="2" max="30" value={config.bezelWidth}
                onChange={e => set('bezelWidth', parseFloat(e.target.value) || 10)} />
            </div>
            <div style={S.row}>
              <span style={S.label}>Glare effect</span>
              <input style={S.toggle} type="checkbox" checked={config.glare}
                onChange={e => set('glare', e.target.checked)} />
            </div>
          </Section>

          {/* Ticks & Labels */}
          <Section title="Ticks & Labels">
            <div style={S.row}>
              <span style={S.label}>Show major ticks</span>
              <input style={S.toggle} type="checkbox" checked={config.showMajorTicks}
                onChange={e => set('showMajorTicks', e.target.checked)} />
            </div>
            <div style={S.row}>
              <span style={S.label}>Show minor ticks</span>
              <input style={S.toggle} type="checkbox" checked={config.showMinorTicks}
                onChange={e => set('showMinorTicks', e.target.checked)} />
            </div>
            <div style={S.row}>
              <span style={S.label}>Tick color</span>
              <input style={S.colorInput} type="color" value={config.tickColor}
                onChange={e => set('tickColor', e.target.value)} />
            </div>
            <div style={S.row}>
              <span style={S.label}>Show labels</span>
              <input style={S.toggle} type="checkbox" checked={config.showLabels}
                onChange={e => set('showLabels', e.target.checked)} />
            </div>
            <div style={S.row}>
              <span style={S.label}>Label font size</span>
              <input style={S.input} type="number" min="8" max="24" value={config.labelFontSize}
                onChange={e => set('labelFontSize', parseInt(e.target.value) || 13)} />
            </div>
            <div style={S.row}>
              <span style={S.label}>Label color</span>
              <input style={S.colorInput} type="color" value={config.labelColor}
                onChange={e => set('labelColor', e.target.value)} />
            </div>
            <div style={S.row}>
              <span style={S.label}>Unit color</span>
              <input style={S.colorInput} type="color" value={config.unitColor}
                onChange={e => set('unitColor', e.target.value)} />
            </div>
          </Section>

          {/* Needle */}
          <Section title="Needle">
            <div style={S.row}>
              <span style={S.label}>Style</span>
              <select style={S.select} value={config.needleStyle}
                onChange={e => set('needleStyle', e.target.value)}>
                <option value="tapered">Tapered</option>
                <option value="line">Line</option>
                <option value="arrow">Arrow</option>
              </select>
            </div>
            <div style={S.row}>
              <span style={S.label}>Needle color</span>
              <input style={S.colorInput} type="color" value={config.needleColor}
                onChange={e => set('needleColor', e.target.value)} />
            </div>
            <div style={S.row}>
              <span style={S.label}>Tail length (px)</span>
              <input style={S.input} type="number" min="5" max="60" value={config.needleTailLength}
                onChange={e => set('needleTailLength', parseFloat(e.target.value) || 22)} />
            </div>
            <div style={S.row}>
              <span style={S.label}>Drop shadow</span>
              <input style={S.toggle} type="checkbox" checked={config.needleShadow}
                onChange={e => set('needleShadow', e.target.checked)} />
            </div>
          </Section>

          {/* Text */}
          <Section title="Text">
            <div style={S.row}>
              <span style={S.label}>Title</span>
              <input style={S.inputWide} type="text" value={config.title}
                placeholder="(none)"
                onChange={e => set('title', e.target.value)} />
            </div>
            <div style={S.row}>
              <span style={S.label}>Show value on face</span>
              <input style={S.toggle} type="checkbox" checked={config.showValue}
                onChange={e => set('showValue', e.target.checked)} />
            </div>
          </Section>

          {/* Pipe */}
          <Section title="Pipe Fitting">
            <div style={S.row}>
              <span style={S.label}>Show pipe</span>
              <input style={S.toggle} type="checkbox" checked={config.showPipe}
                onChange={e => set('showPipe', e.target.checked)} />
            </div>
          </Section>

          {/* Animation */}
          <Section title="Animation">
            <div style={S.row}>
              <span style={S.label}>Smooth animation</span>
              <input style={S.toggle} type="checkbox" checked={config.animated}
                onChange={e => set('animated', e.target.checked)} />
            </div>
            <div style={S.row}>
              <span style={S.label}>Duration (ms)</span>
              <input style={S.input} type="number" min="50" max="3000" step="50"
                value={config.animDuration}
                disabled={!config.animated}
                onChange={e => set('animDuration', parseInt(e.target.value) || 500)} />
            </div>
          </Section>

        </div>
      </div>
    </div>
  );
}
