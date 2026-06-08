/** Default React Flow handle ids for studio catalog nodes (shared; no store import). */
export const STUDIO_HANDLE_OUT = "out";
export const STUDIO_HANDLE_IN = "in";
export const STUDIO_HANDLE_ENV = "env";
export const STUDIO_HANDLE_CAM = "cam";
export const STUDIO_HANDLE_ANIM = "anim";
export const STUDIO_HANDLE_XF = "xf";
/** Scene Output — commit one or more model wires to the Stage. */
export const STUDIO_HANDLE_MODELS = "models";
/** Scene Output — commit procedural mesh wires to the Stage. */
export const STUDIO_HANDLE_MESHES = "meshes";
/** Scene Output / Model Viewer — optional physics scene wire from **physics-world**. */
export const STUDIO_HANDLE_PHYS = "phys";
/** Dashboard Output — commit one or more dashboard widget wires. */
export const STUDIO_HANDLE_WIDGETS = "widgets";
/** Dashboard widget nodes — wire into Dashboard Output **Widgets** socket. */
export const STUDIO_HANDLE_WIDGET = "widget";
/** Dashboard Output — optional theme wire from **dashboard-theme**. */
export const STUDIO_HANDLE_THEME = "theme";
/** Dashboard Output — one or more **dashboard-tab** wires (multi-page HMI). */
export const STUDIO_HANDLE_TABS = "tabs";
/** Dashboard Tab — wire into Dashboard Output **Tabs** socket. */
export const STUDIO_HANDLE_TAB = "tab";
