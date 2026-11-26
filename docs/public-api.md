# Public scene API

These anonymous, read-only endpoints return the shared Zod DTOs from
`packages/api-contracts/src`. The generated collection routes remain disabled.
No public collection permissions or user JWT are needed for these endpoints.

## Endpoints

| Request                                  | Success response                                      |
| ---------------------------------------- | ----------------------------------------------------- |
| `GET /api/public/scenes?locale=de`       | `SceneListResponseDto`: `{ data: SceneSummaryDto[] }` |
| `GET /api/public/scenes/:slug?locale=en` | `SceneDetailResponseDto`: `{ data: SceneDetailDto }`  |

`locale` accepts `de` or `en` and defaults to `de`. The slug uses lowercase
letters, digits and separating hyphens, with a maximum length of 60 characters.
A missing scene in the requested language returns 404; an empty listing returns
200 with `{ data: [] }`.

The service owns explicit field and relation selections. Clients do not supply
Strapi filters, population or field selections. Stored `/uploads/...` media
paths are resolved against Strapi's configured `server.url`. In production,
set `PUBLIC_URL` to the externally reachable CMS URL, including any deployment
prefix (for example, `https://example.com/cms`). External HTTP(S) media URLs and
already-prefixed paths are returned unchanged. When `server.url` is empty, as
in local development, `/uploads/...` paths remain root-relative. The public API
routes themselves remain available directly under `/api/public/...` upstream.

## Errors

Errors use the shared `ApiErrorSchema`:

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Scene not found"
  }
}
```

| HTTP status | Code              | Meaning                                          |
| ----------- | ----------------- | ------------------------------------------------ |
| 400         | `INVALID_REQUEST` | Invalid locale or slug                           |
| 404         | `NOT_FOUND`       | Scene unavailable in the requested locale        |
| 500         | `INTERNAL_ERROR`  | Retrieval or response-contract validation failed |

Internal errors are logged on the server without returning database or
validation internals to clients. Only GET routes are exposed.
