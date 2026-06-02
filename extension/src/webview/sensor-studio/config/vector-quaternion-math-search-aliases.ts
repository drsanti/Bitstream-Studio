/** Extra palette / Shift+A search terms (not shown in titles). */
export const VECTOR_QUATERNION_MATH_SEARCH_ALIASES: Readonly<Record<string, readonly string[]>> = {
  lerp: ["scalar", "linear", "number", "blend", "interpolate", "mix"],
  "vector-lerp": ["slerp", "lerp", "linear", "blend", "interpolate", "mix"],
  "quaternion-slerp": ["slerp", "lerp", "spherical", "blend", "rotation", "interpolate"],
  "vector-length": ["magnitude", "norm", "len"],
  "vector-normalize": ["unit", "normalized"],
  "euler-to-quaternion": ["euler", "quat", "convert"],
  "quaternion-to-euler": ["euler", "quat", "convert"],
};
