import { open } from "node:fs/promises";

const HEADER_SIZE = 20;
const GLB_MAGIC = 0x46546c67;
const JSON_CHUNK_TYPE = 0x4e4f534a;

export async function isGlbFile(filePath: string): Promise<boolean> {
  let file;

  try {
    file = await open(filePath, "r");
    const { size } = await file.stat();
    if (size < HEADER_SIZE) {
      return false;
    }

    const header = Buffer.alloc(HEADER_SIZE);
    const { bytesRead } = await file.read(header, 0, HEADER_SIZE, 0);
    if (bytesRead !== HEADER_SIZE) {
      return false;
    }

    const firstChunkLength = header.readUInt32LE(12);
    return (
      header.readUInt32LE(0) === GLB_MAGIC &&
      header.readUInt32LE(4) === 2 &&
      header.readUInt32LE(8) === size &&
      firstChunkLength > 0 &&
      firstChunkLength <= size - HEADER_SIZE &&
      header.readUInt32LE(16) === JSON_CHUNK_TYPE
    );
  } catch {
    return false;
  } finally {
    if (file) {
      await file.close().catch(() => undefined);
    }
  }
}
