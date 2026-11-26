import type { Core } from "@strapi/strapi";

import { seedDemoOnce } from "./bootstrap/demo";
import { seedDemoMediaOnce } from "./bootstrap/demo-media";
import { configureLocales } from "./bootstrap/locales";
import { createSceneModelMiddleware } from "./middlewares/scene-model";

export default {
  register({ strapi }: { strapi: Core.Strapi }) {
    strapi.documents.use(createSceneModelMiddleware(strapi));
  },

  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    await configureLocales(strapi);
    await seedDemoOnce(strapi);
    await seedDemoMediaOnce(strapi);
  },
};
