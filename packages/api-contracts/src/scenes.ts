import { z } from "zod";
import { MediaSchema } from "./media";
import { RichTextSchema } from "./rich-text";

const DocumentIdSchema = z.string().min(1);
const SlugSchema = z
  .string()
  .max(60)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const ShortLabelSchema = z.string().max(100);

export const LocaleSchema = z.enum(["de", "en"]);

export const SceneQuerySchema = z.object({
  locale: LocaleSchema.default("de"),
});

export const SceneParamsSchema = z.object({
  slug: SlugSchema,
});

export const SceneSummarySchema = z.object({
  id: DocumentIdSchema,
  slug: SlugSchema,
  title: ShortLabelSchema,
  teaser: z.string(),
  cardImage: MediaSchema.nullable(),
});

export const ViewpointSchema = z.object({
  id: DocumentIdSchema,
  name: ShortLabelSchema,
  label: ShortLabelSchema,
  anchor: z.string().min(1),
  order: z.number().int().nonnegative(),
});

export const HotspotSchema = z.object({
  id: DocumentIdSchema,
  title: ShortLabelSchema,
  body: RichTextSchema,
  image: MediaSchema.nullable(),
  video: MediaSchema.nullable(),
  anchor: z.string().min(1),
  order: z.number().int().nonnegative(),
});

export const SceneDetailSchema = SceneSummarySchema.extend({
  model: MediaSchema.nullable(),
  startViewpointId: DocumentIdSchema.nullable(),
  credits: z.string().max(260),
  viewpoints: z.array(ViewpointSchema),
  hotspots: z.array(HotspotSchema),
});

export const SceneListResponseSchema = z.object({
  data: z.array(SceneSummarySchema),
});

export const SceneDetailResponseSchema = z.object({
  data: SceneDetailSchema,
});

export type Locale = z.infer<typeof LocaleSchema>;
export type SceneQuery = z.infer<typeof SceneQuerySchema>;
export type SceneParams = z.infer<typeof SceneParamsSchema>;
export type SceneSummaryDto = z.infer<typeof SceneSummarySchema>;
export type ViewpointDto = z.infer<typeof ViewpointSchema>;
export type HotspotDto = z.infer<typeof HotspotSchema>;
export type SceneDetailDto = z.infer<typeof SceneDetailSchema>;
export type SceneListResponseDto = z.infer<typeof SceneListResponseSchema>;
export type SceneDetailResponseDto = z.infer<typeof SceneDetailResponseSchema>;
