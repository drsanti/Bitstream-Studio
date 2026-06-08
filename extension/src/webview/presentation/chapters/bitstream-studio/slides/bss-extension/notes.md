**Duration:** ~4 min

**Talking points**
- Same React bundle in Vite dev and packaged VSIX — differences are host shell and asset URL resolution.
- Three workspace tabs share one broker connection; switching tabs does not restart the bridge.
- Presentation side panel is optional for dual-monitor teaching.

**Demo script**
- Show `?workspace=presentation` in browser dev, then mention VSIX install from `HOW_TO_RUN.md`.

**Q&A prompts**
- Why not three separate extensions?
- What breaks if you rely on `T3DVSCodeUtils.isVsCodeMode()` alone in VSIX?
