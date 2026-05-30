declare module "chroma-js" {
  interface ChromaColor {
    hex(): string;
  }

  interface ChromaStatic {
    mix(
      color1: string,
      color2: string,
      ratio: number,
      mode?: string,
    ): ChromaColor;
  }

  const chroma: ChromaStatic;
  export default chroma;
}
