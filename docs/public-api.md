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
Strapi filters, population or field selections. Media URLs retain their stored
root-relative or HTTP(S) form. Frontend deployments must serve or proxy
root-relative `/uploads` URLs to the CMS.

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
