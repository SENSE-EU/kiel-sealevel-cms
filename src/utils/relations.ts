import type { Data } from "@strapi/strapi";

export function isId(value: unknown): value is Data.ID {
  return typeof value === "number" || typeof value === "string";
}

export function getRelationId(value: unknown): Data.ID | null {
  if (isId(value)) {
    return value;
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    isId(value.id)
  ) {
    return value.id;
  }

  return null;
}
