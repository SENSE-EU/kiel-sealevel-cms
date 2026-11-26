import { copyFile, mkdtemp, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import type { Core } from "@strapi/strapi";

import { getRelationId } from "../utils/relations";

type DemoFileInfo = {
  alternativeText?: string;
  caption?: string;
};

export type PreparedDemoFile = {
  filename: string;
  filepath: string;
  fileInfo?: DemoFileInfo;
  mimetype: string;
  size: number;
};

export async function prepareDemoFile(
  strapi: Core.Strapi,
  filename: string,
  mimetype: string,
  fileInfo?: DemoFileInfo,
): Promise<PreparedDemoFile | string> {
  const materialsDirectory = path.resolve(
    strapi.dirs.app.root,
    "demo-materials",
  );
  const filepath = path.resolve(materialsDirectory, filename);

  if (path.dirname(filepath) !== materialsDirectory) {
    return `invalid demo media filename "${filename}"`;
  }

  try {
    const fileStat = await stat(filepath);

    if (!fileStat.isFile()) {
      return `expected a file at "demo-materials/${filename}"`;
    }

    return {
      filename,
      filepath,
      fileInfo,
      mimetype,
      size: fileStat.size,
    };
  } catch {
    return `missing "demo-materials/${filename}"`;
  }
}

export async function uploadDemoFile(
  strapi: Core.Strapi,
  file: PreparedDemoFile,
) {
  const temporaryDirectory = await mkdtemp(
    path.join(tmpdir(), "kiel-demo-media-"),
  );
  const temporaryFilepath = path.join(temporaryDirectory, file.filename);

  try {
    await copyFile(file.filepath, temporaryFilepath);
    const uploadService = strapi.plugin("upload").service("upload");
    const uploadedFiles: unknown = await uploadService.upload({
      data: {
        fileInfo: {
          name: file.filename,
          ...file.fileInfo,
        },
      },
      files: [
        {
          filepath: temporaryFilepath,
          originalFilename: file.filename,
          mimetype: file.mimetype,
          size: file.size,
        },
      ],
    });

    const uploadedFileId =
      Array.isArray(uploadedFiles) && uploadedFiles.length === 1
        ? getRelationId(uploadedFiles[0])
        : null;

    if (typeof uploadedFileId !== "number") {
      throw new Error(
        `Strapi upload returned an invalid result for "${file.filename}"`,
      );
    }

    return uploadedFileId;
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true });
  }
}
