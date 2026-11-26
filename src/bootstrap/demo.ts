import path from "node:path";

import type { Core, Data } from "@strapi/strapi";

import demo from "./data/demo.json";
import { isGlbFile } from "../utils/glb";
import { prepareDemoFile, uploadDemoFile } from "./upload-demo-file";

const LOCALES = ["de", "en"] as const;
const SCENE_UID = "api::scene.scene";
const VIEWPOINT_UID = "api::viewpoint.viewpoint";
const HOTSPOT_UID = "api::hotspot.hotspot";
const SEED_VERSION = "demo-v1";
const MODEL_FILENAME = "seabed_scene.glb";
const MODEL_MIMETYPE = "model/gltf-binary";

type Locale = (typeof LOCALES)[number];

type WriteResult = Pick<
  Data.ContentType<typeof SCENE_UID>,
  "documentId" | "locale"
> | null;

async function findDocumentId(
  findForLocale: (
    locale: Locale,
  ) => Promise<ReadonlyArray<{ documentId: string }>>,
  description: string,
): Promise<string | null> {
  const matches = (
    await Promise.all(LOCALES.map((locale) => findForLocale(locale)))
  ).flat();
  const documentIds = [...new Set(matches.map(({ documentId }) => documentId))];

  if (documentIds.length > 1) {
    throw new Error(`Multiple ${description} documents match the demo data`);
  }

  return documentIds[0] ?? null;
}

function validateWrite(
  result: WriteResult,
  locale: Locale,
  expectedDocumentId?: string,
) {
  if (
    !result ||
    typeof result.documentId !== "string" ||
    result.documentId.length === 0 ||
    result.locale !== locale ||
    (expectedDocumentId && result.documentId !== expectedDocumentId)
  ) {
    throw new Error(`Demo seed write failed for locale "${locale}"`);
  }

  return result.documentId;
}

async function upsertLocalizedDocument(
  documentId: string | null,
  create: (locale: Locale) => Promise<WriteResult>,
  update: (documentId: string, locale: Locale) => Promise<WriteResult>,
) {
  let currentDocumentId = documentId;

  for (const locale of LOCALES) {
    if (currentDocumentId) {
      const updated = await update(currentDocumentId, locale);
      validateWrite(updated, locale, currentDocumentId);
      continue;
    }

    const created = await create(locale);
    currentDocumentId = validateWrite(created, locale);
  }

  if (!currentDocumentId) {
    throw new Error("The localized document could not be created");
  }

  return currentDocumentId;
}

function paragraph(text: string) {
  return [
    {
      type: "paragraph" as const,
      children: [{ type: "text" as const, text }],
    },
  ];
}

type UploadFile = Data.ContentType<"plugin::upload.file">;

async function validateStoredModel(strapi: Core.Strapi, file: UploadFile) {
  if (
    typeof file.id !== "number" ||
    file.name !== MODEL_FILENAME ||
    typeof file.hash !== "string" ||
    file.ext !== ".glb" ||
    file.mime !== MODEL_MIMETYPE
  ) {
    throw new Error(
      `Media Library file "${MODEL_FILENAME}" is not a valid GLB file`,
    );
  }

  const uploadsDirectory = path.resolve(strapi.dirs.static.public, "uploads");
  const filePath = path.resolve(uploadsDirectory, `${file.hash}${file.ext}`);
  const validContent =
    path.dirname(filePath) === uploadsDirectory && (await isGlbFile(filePath));

  if (!validContent) {
    throw new Error(
      `Media Library file "${MODEL_FILENAME}" is not a valid GLB file`,
    );
  }

  return file.id;
}

async function resolveModelId(strapi: Core.Strapi) {
  const files: UploadFile[] = await strapi.db
    .query("plugin::upload.file")
    .findMany({
      where: { name: MODEL_FILENAME, mime: MODEL_MIMETYPE },
    });

  if (files.length > 1) {
    throw new Error(
      `Found multiple files named exactly "${MODEL_FILENAME}" in the Media Library`,
    );
  }

  if (files.length === 1) {
    return validateStoredModel(strapi, files[0]);
  }

  const prepared = await prepareDemoFile(
    strapi,
    MODEL_FILENAME,
    MODEL_MIMETYPE,
  );

  if (typeof prepared === "string") {
    strapi.log.warn(`Demo seed pending: ${prepared}`);
    return null;
  }

  if (!(await isGlbFile(prepared.filepath))) {
    throw new Error(
      `"demo-materials/${MODEL_FILENAME}" is not a valid GLB file`,
    );
  }

  return uploadDemoFile(strapi, prepared);
}

export async function seedDemoOnce(strapi: Core.Strapi) {
  const seedStore = strapi.store({ type: "core", name: "demo-seed" });
  const completed = await seedStore.get({ key: SEED_VERSION });

  if (completed === true) {
    return;
  }

  const scenes = strapi.documents(SCENE_UID);
  let sceneDocumentId = await findDocumentId(
    (locale) => scenes.findMany({ locale, filters: { slug: demo.scene.slug } }),
    `scene with slug "${demo.scene.slug}"`,
  );
  let modelId: number | null = null;

  if (!sceneDocumentId) {
    modelId = await resolveModelId(strapi);

    if (!modelId) {
      return;
    }
  }

  sceneDocumentId = await upsertLocalizedDocument(
    sceneDocumentId,
    async (locale) =>
      scenes.create({
        locale,
        data: {
          slug: demo.scene.slug,
          title: demo.scene.title[locale],
          model: modelId,
        },
      }),
    async (documentId, locale) => {
      return scenes.update({
        documentId,
        locale,
        data: {
          slug: demo.scene.slug,
          title: demo.scene.title[locale],
          ...(modelId ? { model: modelId } : {}),
        },
      });
    },
  );

  const viewpoints = strapi.documents(VIEWPOINT_UID);
  const viewpointIds: string[] = [];

  for (const viewpoint of demo.viewpoints) {
    const existingId = await findDocumentId(
      (locale) =>
        viewpoints.findMany({
          locale,
          filters: {
            anchor: viewpoint.anchor,
            scene: { documentId: sceneDocumentId },
          },
        }),
      `viewpoint at anchor "${viewpoint.anchor}" in the demo scene`,
    );
    const localizedData = (locale: Locale) => ({
      name: viewpoint.name,
      anchor: viewpoint.anchor,
      order: viewpoint.order,
      label: viewpoint.label[locale],
      scene: sceneDocumentId,
    });
    const result = await upsertLocalizedDocument(
      existingId,
      async (locale) =>
        viewpoints.create({ locale, data: localizedData(locale) }),
      async (id, locale) => {
        return viewpoints.update({
          documentId: id,
          locale,
          data: localizedData(locale),
        });
      },
    );
    viewpointIds.push(result);
  }

  const hotspots = strapi.documents(HOTSPOT_UID);

  for (const hotspot of demo.hotspots) {
    const existingId = await findDocumentId(
      (locale) =>
        hotspots.findMany({
          locale,
          filters: {
            anchor: hotspot.anchor,
            scene: { documentId: sceneDocumentId },
          },
        }),
      `hotspot at anchor "${hotspot.anchor}" in the demo scene`,
    );
    const localizedData = (locale: Locale) => ({
      anchor: hotspot.anchor,
      order: hotspot.order,
      title: hotspot.title[locale],
      body: paragraph(hotspot.body[locale]),
      scene: sceneDocumentId,
    });

    await upsertLocalizedDocument(
      existingId,
      async (locale) =>
        hotspots.create({ locale, data: localizedData(locale) }),
      async (id, locale) => {
        return hotspots.update({
          documentId: id,
          locale,
          data: localizedData(locale),
        });
      },
    );
  }

  for (const locale of LOCALES) {
    const updated = await scenes.update({
      documentId: sceneDocumentId,
      locale,
      data: { startViewpoint: viewpointIds[0] },
    });
    validateWrite(updated, locale, sceneDocumentId);
  }

  await seedStore.set({ key: SEED_VERSION, value: true });

  strapi.log.info(
    `Demo seed complete: 1 scene, ${viewpointIds.length} viewpoints, ${demo.hotspots.length} hotspots`,
  );
}
