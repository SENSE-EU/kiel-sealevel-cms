import { z } from "zod";

export const ApiErrorCodeSchema = z.enum([
  "INVALID_REQUEST",
  "NOT_FOUND",
  "INTERNAL_ERROR",
]);

export const ApiErrorSchema = z.object({
  error: z.object({
    code: ApiErrorCodeSchema,
    message: z.string(),
  }),
});

export type ApiErrorCode = z.infer<typeof ApiErrorCodeSchema>;
export type ApiErrorDto = z.infer<typeof ApiErrorSchema>;
