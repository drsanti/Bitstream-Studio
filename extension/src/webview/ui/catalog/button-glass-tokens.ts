export type GlassButtonTone = 'emerald' | 'sky' | 'violet' | 'amber' | 'zinc';

export const GLASS_BUTTON_IDLE_CLASS =
  'border-white/15 bg-white/5 text-zinc-300 hover:border-white/20 hover:bg-white/10';

export const GLASS_BUTTON_SELECTED_CLASS_BY_TONE: Record<GlassButtonTone, string> = {
  emerald: 'border-emerald-400/60 bg-emerald-500/20 text-emerald-200 shadow-md',
  sky: 'border-sky-400/60 bg-sky-500/20 text-sky-200 shadow-md',
  violet: 'border-violet-400/60 bg-violet-500/20 text-violet-200 shadow-md',
  amber: 'border-amber-400/60 bg-amber-500/20 text-amber-200 shadow-md',
  zinc: 'border-white/25 bg-white/10 text-zinc-100 shadow-md',
};

export const GLASS_BUTTON_DISABLED_CLASS =
  'border-gray-700 bg-gray-700 text-gray-500 cursor-not-allowed opacity-60';
