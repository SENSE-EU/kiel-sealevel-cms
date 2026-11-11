import type { Core } from "@strapi/strapi";
import type { Locale } from "../../../../packages/api-contracts/src";

const sceneUid = "api::scene.scene";

export const createScenesService = (strapi: Core.Strapi) => ({
  list(locale: Locale) {
    return strapi.documents(sceneUid).findMany({
      fields: ["documentId", "slug", "title", "teaser"],
      locale,
      sort: ["slug:asc"],
      status: "published",
      populate: {
        cardImage: {
          fields: ["url", "alternativeText"],
        },
      },
    });
  },

  detail(slug: string, locale: Locale) {
    return strapi.documents(sceneUid).findFirst({
      fields: ["documentId", "slug", "title", "teaser", "credits"],
      filters: { slug },
      locale,
      status: "published",
      populate: {
        cardImage: {
          fields: ["url", "alternativeText"],
        },
        model: {
          fields: ["url", "size"],
        },
        startViewpoint: {
          fields: ["documentId"],
        },
        viewpoints: {
          fields: ["documentId", "name", "label", "anchor", "order"],
        },
        hotspots: {
          fields: ["documentId", "title", "body", "anchor", "order"],
          populate: {
            image: {
              fields: ["url", "alternativeText"],
            },
            video: {
              fields: ["url"],
            },
          },
        },
      },
    });
  },
});

type ScenesService = ReturnType<typeof createScenesService>;

export type SceneSummaryDocument = Awaited<
  ReturnType<ScenesService["list"]>
>[number];

export type SceneDetailDocument = NonNullable<
  Awaited<ReturnType<ScenesService["detail"]>>
>;

export default ({ strapi }: { strapi: Core.Strapi }) =>
  createScenesService(strapi);
