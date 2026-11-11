import { z } from "zod";
import { PublicUrlSchema } from "./media";

const LinkUrlSchema = z.union([
  z.url({ protocol: /^(?:https?|mailto)$/ }),
  z.string().regex(/^\/(?!\/)/),
]);

export const TextNodeSchema = z.object({
  type: z.literal("text"),
  text: z.string(),
  bold: z.boolean().optional(),
  italic: z.boolean().optional(),
  underline: z.boolean().optional(),
  strikethrough: z.boolean().optional(),
  code: z.boolean().optional(),
});

export const LinkNodeSchema = z.object({
  type: z.literal("link"),
  url: LinkUrlSchema,
  get children() {
    return z.array(InlineNodeSchema);
  },
});

export const InlineNodeSchema = z.discriminatedUnion("type", [
  TextNodeSchema,
  LinkNodeSchema,
]);

const InlineBlockSchema = z.object({
  type: z.enum(["paragraph", "quote", "code"]),
  children: z.array(InlineNodeSchema),
});

const HeadingBlockSchema = z.object({
  type: z.literal("heading"),
  level: z.number().int().min(1).max(6),
  children: z.array(InlineNodeSchema),
});

const ListBlockSchema = z.object({
  type: z.literal("list"),
  format: z.enum(["ordered", "unordered"]),
  get children() {
    return z.array(BlockNodeSchema);
  },
});

const ListItemBlockSchema = z.object({
  type: z.literal("list-item"),
  children: z.array(InlineNodeSchema),
});

const ImageBlockSchema = z.object({
  type: z.literal("image"),
  image: z.object({
    url: PublicUrlSchema,
    alternativeText: z.string().nullable().optional(),
  }),
});

export const BlockNodeSchema = z.discriminatedUnion("type", [
  InlineBlockSchema,
  HeadingBlockSchema,
  ListBlockSchema,
  ListItemBlockSchema,
  ImageBlockSchema,
]);

export const RichTextSchema = z.union([z.string(), z.array(BlockNodeSchema)]);

export type TextNodeDto = z.infer<typeof TextNodeSchema>;
export type LinkNodeDto = z.infer<typeof LinkNodeSchema>;
export type InlineNodeDto = z.infer<typeof InlineNodeSchema>;
export type BlockNodeDto = z.infer<typeof BlockNodeSchema>;
export type RichTextDto = z.infer<typeof RichTextSchema>;
