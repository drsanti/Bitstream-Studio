import { z } from "zod";

/** Stale / disconnected presentation policy — default freeze-gray per DEVELOPMENT_PLAN §16.10. */
export const linkHealthPolicySchema = z.enum([
  "freeze-gray",
  "hide",
  "fallback",
  "last-no-style",
]);

export type LinkHealthPolicy = z.infer<typeof linkHealthPolicySchema>;

export const DEFAULT_LINK_HEALTH_POLICY: LinkHealthPolicy = "freeze-gray";
