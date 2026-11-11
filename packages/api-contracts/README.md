# API contracts

This directory is the source of truth for the Zod data contracts shared by the
CMS and frontend. Runtime schemas and their `z.infer` TypeScript types live
under `src/`.

Run the following command from the CMS repository after changing contracts:

```sh
pnpm contracts:sync
```

The command replaces the marked generated directory at
`../kiel-sealevel-frontend/src/api-contracts`. Do not edit that generated copy.
From the frontend repository, the equivalent command is:

```sh
pnpm --dir ../kiel-sealevel-cms contracts:sync
```

Commit the generated frontend directory so the frontend can be deployed
independently of the CMS repository.

The CMS includes Zod. The frontend must also depend on Zod before importing the
generated runtime schemas.
