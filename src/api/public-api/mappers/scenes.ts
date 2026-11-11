import type { Data } from "@strapi/strapi";
import type {
  SceneDetailDocument,
  SceneSummaryDocument,
} from "../services/scenes";

type MediaDocument = Data.ContentType<"plugin::upload.file">;

function mapMedia(
  media: MediaDocument | null | undefined,
  includeSize = false,
) {
  if (!media) {
    return null;
  }

  return {
    url: media.url,
    alt: media.alternativeText ?? "",
    ...(includeSize && typeof media.size === "number"
      ? { sizeBytes: Math.round(media.size * 1024) }
      : {}),
  };
}

export function mapSceneSummary(scene: SceneSummaryDocument) {
  return {
    id: scene.documentId,
    slug: scene.slug,
    title: scene.title,
    teaser: scene.teaser ?? "",
    cardImage: mapMedia(scene.cardImage),
  };
}

export function mapSceneDetail(scene: SceneDetailDocument) {
  return {
    ...mapSceneSummary(scene),
    model: mapMedia(scene.model, true),
    startViewpointId: scene.startViewpoint?.documentId ?? null,
    credits: scene.credits ?? "",
    viewpoints: [...(scene.viewpoints ?? [])]
      .sort((left, right) => (left.order ?? 0) - (right.order ?? 0))
      .map((viewpoint) => ({
        id: viewpoint.documentId,
        name: viewpoint.name,
        label: viewpoint.label,
        anchor: viewpoint.anchor,
        order: viewpoint.order,
      })),
    hotspots: [...(scene.hotspots ?? [])]
      .sort((left, right) => (left.order ?? 0) - (right.order ?? 0))
      .map((hotspot) => ({
        id: hotspot.documentId,
        title: hotspot.title,
        body: hotspot.body ?? "",
        image: mapMedia(hotspot.image),
        video: mapMedia(hotspot.video),
        anchor: hotspot.anchor,
        order: hotspot.order,
      })),
  };
}
