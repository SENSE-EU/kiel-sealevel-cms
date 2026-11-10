import path from "node:path";

import type { Core, Modules } from "@strapi/strapi";
import { errors } from "@strapi/utils";

import { isGlbFile } from "../utils/glb";
import { getRelationId } from "../utils/relations";

export function createSceneModelMiddleware(
  strapi: Core.Strapi,
): Modules.Documents.Middleware.Middleware {
  return async (context, next) => {
    if (context.uid === "api::scene.scene") {
      const { action, params } = context;
      if (action !== "create" && action !== "update" && action !== "clone") {
        return next();
      }

      const data = params.data;
      if (!data) {
        return next();
      }

      const model = data.model;
      if (model === undefined) {
        return next();
      }

      const id = getRelationId(model);
      const file =
        id !== null
          ? await strapi.db
              .query("plugin::upload.file")
              .findOne({ where: { id } })
          : null;

      const uploadsDirectory = path.resolve(
        strapi.dirs.static.public,
        "uploads",
      );
      const filePath =
        file && typeof file.hash === "string" && typeof file.ext === "string"
          ? path.resolve(uploadsDirectory, `${file.hash}${file.ext}`)
          : null;
      const hasValidGlbContent =
        filePath !== null &&
        path.dirname(filePath) === uploadsDirectory &&
        (await isGlbFile(filePath));

      if (
        file?.ext !== ".glb" ||
        file.mime !== "model/gltf-binary" ||
        !hasValidGlbContent
      ) {
        const message = "Scene model must be a valid GLB file";
        throw new errors.ValidationError(message, {
          errors: [{ path: ["model"], message, name: "ValidationError" }],
        });
      }
    }

    return next();
  };
}
