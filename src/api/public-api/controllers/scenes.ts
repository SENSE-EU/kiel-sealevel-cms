import type { Core } from "@strapi/strapi";
import {
  ApiErrorSchema,
  SceneDetailResponseSchema,
  SceneListResponseSchema,
  SceneParamsSchema,
  SceneQuerySchema,
} from "../../../../packages/api-contracts/src";
import { mapSceneDetail, mapSceneSummary } from "../mappers/scenes";
import { createScenesService } from "../services/scenes";

export default ({ strapi }: { strapi: Core.Strapi }): Core.Controller => {
  const service = createScenesService(strapi);

  return {
    async list(ctx) {
      const query = SceneQuerySchema.safeParse(ctx.query);
      if (!query.success) {
        ctx.status = 400;
        ctx.body = ApiErrorSchema.parse({
          error: { code: "INVALID_REQUEST", message: "Invalid request" },
        });
        return;
      }

      try {
        const scenes = await service.list(query.data.locale);
        ctx.body = SceneListResponseSchema.parse({
          data: scenes.map(mapSceneSummary),
        });
      } catch (error) {
        strapi.log.error({
          message: "[public.scenes.list] Failed to list public scenes",
          locale: query.data.locale,
          error,
          ...(error instanceof Error ? { stack: error.stack } : {}),
        });
        ctx.status = 500;
        ctx.body = ApiErrorSchema.parse({
          error: { code: "INTERNAL_ERROR", message: "Internal server error" },
        });
      }
    },

    async detail(ctx) {
      const query = SceneQuerySchema.safeParse(ctx.query);
      const params = SceneParamsSchema.safeParse(ctx.params);
      if (!query.success || !params.success) {
        ctx.status = 400;
        ctx.body = ApiErrorSchema.parse({
          error: { code: "INVALID_REQUEST", message: "Invalid request" },
        });
        return;
      }

      try {
        const scene = await service.detail(params.data.slug, query.data.locale);
        if (!scene) {
          ctx.status = 404;
          ctx.body = ApiErrorSchema.parse({
            error: { code: "NOT_FOUND", message: "Scene not found" },
          });
          return;
        }

        ctx.body = SceneDetailResponseSchema.parse({
          data: mapSceneDetail(scene),
        });
      } catch (error) {
        strapi.log.error({
          message: "[public.scenes.detail] Failed to load public scene",
          slug: params.data.slug,
          locale: query.data.locale,
          error,
          ...(error instanceof Error ? { stack: error.stack } : {}),
        });
        ctx.status = 500;
        ctx.body = ApiErrorSchema.parse({
          error: { code: "INTERNAL_ERROR", message: "Internal server error" },
        });
      }
    },
  };
};
