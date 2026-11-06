# KIEL SEALEVEL CMS

Backend content management system for the SEALEVEL interactive underwater experience, developed as part of the SENSE project.

Built with **Strapi 5**, the CMS manages the content and media used by interactive 3D scenes, allowing editors to update content without requiring frontend deployments.

## Overview

The CMS provides content management for:

- **Scenes** — Underwater environments, metadata, and associated 3D models.
- **Viewpoints** — Defined camera positions used for scene navigation.
- **Hotspots** — Interactive points containing educational content and media.
- **Media** — GLB models, images, and optional videos.
- **Localization** — Multilingual content support (German and English).

The backend exposes a public REST API consumed by the frontend, with dedicated response contracts independent of Strapi's internal content structure.

## Tech Stack

- **Strapi 5** — Headless CMS
- **PostgreSQL** — Database
- **TypeScript** — Backend development
- **pnpm** — Package management

## Getting Started

### Prerequisites

- Node.js (compatible with the installed Strapi version)
- pnpm
- PostgreSQL

### Installation

Install dependencies:

```bash
pnpm install
```

Configure the required environment variables before starting the application.

### Development

Start Strapi in development mode with automatic reload:

```bash
pnpm run develop
```

### Production

Build the Strapi admin panel:

```bash
pnpm run build
```

Start the application in production mode:

```bash
pnpm run start
```

## API

The backend provides public read-only endpoints for retrieving scene content, viewpoints, hotspots, and associated media.

API responses use dedicated DTOs to maintain a consistent contract with the frontend.

## Deployment

The application is designed to run in a containerized environment using Docker, with PostgreSQL and persistent media storage.

## Documentation

- [Strapi Documentation](https://docs.strapi.io)
- [Strapi REST API](https://docs.strapi.io/cms/api/rest)
