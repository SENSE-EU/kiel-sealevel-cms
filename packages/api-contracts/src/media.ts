import { z } from "zod";

const RootRelativeUrlSchema = z.string().regex(/^\/(?!\/)/);

export const PublicUrlSchema = z.union([
  z.url({ protocol: /^https?$/ }),
  RootRelativeUrlSchema,
]);

export const MediaSchema = z.object({
  url: PublicUrlSchema,
  alt: z.string(),
  sizeBytes: z.number().int().nonnegative().optional(),
});

export type MediaDto = z.infer<typeof MediaSchema>;
