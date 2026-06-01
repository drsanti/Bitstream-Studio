/** Quick-insert sections for the Sensor Studio header **Insert** menu (primary catalog nodes). */
export const STUDIO_TOOLBAR_INSERT_SECTIONS: ReadonlyArray<{
  title: string;
  nodeIds: readonly string[];
}> = [
  {
    title: "Sensors",
    nodeIds: ["bmi270-input", "dps368-input", "sht40-input", "bmm350-input"],
  },
  {
    title: "Logic",
    nodeIds: ["threshold"],
  },
];
