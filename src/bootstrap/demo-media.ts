import type { Core, Modules } from "@strapi/strapi";
import path from "node:path";

import demoMedia from "./data/demo-media.json";
import demo from "./data/demo.json";
import {
  prepareDemoFile,
  type PreparedDemoFile,
  uploadDemoFile,
} from "./upload-demo-file";

const LOCALES = ["de", "en"] as const;
const SCENE_UID = "api::scene.scene";
const HOTSPOT_UID = "api::hotspot.hotspot";
const MEDIA_SEED_VERSION = "demo-media-v1";

type MediaType = "image" | "video";
type MediaRelation = Pick<
  Modules.Documents.Params.Data.Input<typeof HOTSPOT_UID>,
  MediaType
>;
type SelectedMedia = {
  sourceId: string;
  type: MediaType;
  filename: string;
  caption: string;
};

type PendingUpload = SelectedMedia & PreparedDemoFile;

function selectFirstMedia() {
  return demoMedia.hotspots.flatMap(({ sourceId, media }) =>
    (["image", "video"] as const).flatMap((type) => {
      const selected = media
        .filter((item) => item.type === type)
        .sort((left, right) => left.order - right.order)[0];

      return selected
        ? [
            {
              sourceId,
              type,
              filename: selected.filename,
              caption: selected.caption.de,
            },
          ]
        : [];
    }),
  ) satisfies SelectedMedia[];
}

function warnPending(strapi: Core.Strapi, reasons: string[]) {
  strapi.log.warn(`Demo media seed pending: ${reasons.join("; ")}`);
}

async function findSceneDocumentId(strapi: Core.Strapi) {
  const scenes = strapi.documents(SCENE_UID);
  const matches = (
    await Promise.all(
      LOCALES.map((locale) =>
        scenes.findMany({ locale, filters: { slug: demo.scene.slug } }),
      ),
    )
  ).flat();
  const documentIds = [...new Set(matches.map(({ documentId }) => documentId))];

  return documentIds.length === 1 ? documentIds[0] : null;
}

async function findHotspotDocumentId(
  strapi: Core.Strapi,
  sceneDocumentId: string,
  anchor: string,
) {
  const hotspots = strapi.documents(HOTSPOT_UID);
  const matchesByLocale = await Promise.all(
    LOCALES.map(async (locale) => ({
      locale,
      matches: await hotspots.findMany({
        locale,
        filters: {
          anchor,
          scene: { documentId: sceneDocumentId },
        },
      }),
    })),
  );
  const documentIds = [
    ...new Set(
      matchesByLocale.flatMap(({ matches }) =>
        matches.map(({ documentId }) => documentId),
      ),
    ),
  ];
  const hasOneMatchPerLocale = matchesByLocale.every(
    ({ matches }) => matches.length === 1,
  );

  return hasOneMatchPerLocale && documentIds.length === 1
    ? documentIds[0]
    : null;
}

async function findMediaFiles(
  strapi: Core.Strapi,
  filename: string,
  type: MediaType,
) {
  const files = await strapi.db
    .query("plugin::upload.file")
    .findMany({ where: { name: filename } });
  const matches = files.filter(
    (file) =>
      file.name === filename &&
      typeof file.mime === "string" &&
      file.mime.startsWith(`${type}/`),
  );

  return matches;
}

function getMimeType(filename: string, type: MediaType) {
  const extension = path.extname(filename).toLowerCase();
  const mimeTypes: Record<string, string> = {
    ".jpeg": "image/jpeg",
    ".jpg": "image/jpeg",
    ".mp4": "video/mp4",
    ".png": "image/png",
    ".webp": "image/webp",
  };
  const mimetype = mimeTypes[extension];

  return mimetype?.startsWith(`${type}/`) ? mimetype : null;
}

function getMediaKey(filename: string, type: MediaType) {
  return `${type}:${filename}`;
}

async function prepareLocalUpload(
  strapi: Core.Strapi,
  media: SelectedMedia,
): Promise<PendingUpload | string> {
  const mimetype = getMimeType(media.filename, media.type);

  if (!mimetype) {
    return `unsupported ${media.type} filename "${media.filename}"`;
  }

  const prepared = await prepareDemoFile(strapi, media.filename, mimetype, {
    alternativeText: media.caption,
    caption: media.caption,
  });

  return typeof prepared === "string" ? prepared : { ...media, ...prepared };
}

export async function seedDemoMediaOnce(strapi: Core.Strapi) {
  const seedStore = strapi.store({ type: "core", name: "demo-seed" });
  const completed = await seedStore.get({ key: MEDIA_SEED_VERSION });

  if (completed === true) {
    return;
  }

  const sceneDocumentId = await findSceneDocumentId(strapi);

  if (!sceneDocumentId) {
    warnPending(strapi, [
      `expected one scene document with slug "${demo.scene.slug}"`,
    ]);
    return;
  }

  const hotspotDataBySourceId = new Map(
    demo.hotspots.map((hotspot) => [hotspot.sourceId, hotspot]),
  );
  const selectedMedia = selectFirstMedia();
  const assignments = new Map<
    string,
    { documentId: string; relations: MediaRelation }
  >();
  const mediaIds = new Map<string, number>();
  const pendingUploads: PendingUpload[] = [];
  const pendingReasons: string[] = [];

  for (const { sourceId } of demoMedia.hotspots) {
    const hotspotData = hotspotDataBySourceId.get(sourceId);

    if (!hotspotData) {
      pendingReasons.push(`unknown hotspot source ID "${sourceId}"`);
      continue;
    }

    const documentId = await findHotspotDocumentId(
      strapi,
      sceneDocumentId,
      hotspotData.anchor,
    );

    if (!documentId) {
      pendingReasons.push(
        `expected one localized hotspot document for "${sourceId}"`,
      );
      continue;
    }

    assignments.set(sourceId, { documentId, relations: {} });
  }

  for (const media of selectedMedia) {
    const { filename, type } = media;
    const files = await findMediaFiles(strapi, filename, type);

    if (files.length > 1) {
      pendingReasons.push(
        `found multiple ${type} files named exactly "${filename}" in the Media Library`,
      );
      continue;
    }

    if (files.length === 1) {
      mediaIds.set(getMediaKey(filename, type), files[0].id);
      continue;
    }

    const localUpload = await prepareLocalUpload(strapi, media);

    if (typeof localUpload === "string") {
      pendingReasons.push(localUpload);
      continue;
    }

    pendingUploads.push(localUpload);
  }

  if (pendingReasons.length > 0) {
    warnPending(strapi, pendingReasons);
    return;
  }

  for (const media of pendingUploads) {
    const fileId = await uploadDemoFile(strapi, media);
    mediaIds.set(getMediaKey(media.filename, media.type), fileId);
  }

  for (const { sourceId, type, filename } of selectedMedia) {
    const assignment = assignments.get(sourceId);
    const fileId = mediaIds.get(getMediaKey(filename, type));

    if (!assignment || !fileId) {
      throw new Error(
        `Demo media seed could not resolve ${type} "${filename}" for "${sourceId}"`,
      );
    }

    if (type === "image") {
      assignment.relations.image = [fileId];
    } else {
      assignment.relations.video = fileId;
    }
  }

  const hotspots = strapi.documents(HOTSPOT_UID);

  for (const { documentId, relations } of assignments.values()) {
    for (const locale of LOCALES) {
      await hotspots.update({
        documentId,
        locale,
        data: relations,
      });
    }
  }

  await seedStore.set({ key: MEDIA_SEED_VERSION, value: true });
  strapi.log.info(
    `Demo media seed complete: ${selectedMedia.length} media files assigned to ${assignments.size} hotspots`,
  );
}
