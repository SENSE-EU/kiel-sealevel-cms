import type { Data } from "@strapi/strapi";
import type {
  SceneDetailDocument,
  SceneSummaryDocument,
} from "../services/scenes";

type MediaDocument = Data.ContentType<"plugin::upload.file">;

function mapMedia(
  media: MediaDocument | null | undefined,
  serverUrl: string,
  includeSize = false,
) {
  if (!media) {
    return null;
  }

  const baseUrl = serverUrl.replace(/\/+$/, "");
  const url = media.url?.startsWith("/uploads/")
    ? `${baseUrl}${media.url}`
    : media.url;

  return {
    url,
    alt: media.alternativeText ?? "",
    caption: media.caption ?? "",
    ...(includeSize && typeof media.size === "number"
      ? { sizeBytes: Math.round(media.size * 1024) }
      : {}),
  };
}

export function mapSceneSummary(
  scene: SceneSummaryDocument,
  serverUrl: string,
) {
  return {
    id: scene.documentId,
    slug: scene.slug,
    title: scene.title,
    teaser: scene.teaser ?? "",
    cardImage: mapMedia(scene.cardImage, serverUrl),
  };
}

export function mapSceneDetail(scene: SceneDetailDocument, serverUrl: string) {
  return {
    ...mapSceneSummary(scene, serverUrl),
    model: mapMedia(scene.model, serverUrl, true),
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
      .map((hotspot) => {
        const images = (hotspot.image ?? []).map((image) =>
          mapMedia(image, serverUrl),
        );

        return {
          id: hotspot.documentId,
          title: hotspot.title,
          body: hotspot.body ?? "",
          images,
          image: images[0] ?? null,
          video: mapMedia(hotspot.video, serverUrl),
          anchor: hotspot.anchor,
          order: hotspot.order,
        };
      }),
  };
}
