import type { Core } from "@strapi/strapi";

import { createSceneModelMiddleware } from "./middlewares/scene-model";

export default {
  register({ strapi }: { strapi: Core.Strapi }) {
    strapi.documents.use(createSceneModelMiddleware(strapi));
  },
};
