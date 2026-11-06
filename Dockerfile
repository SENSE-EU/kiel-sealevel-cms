FROM node:24-alpine

# Install dependencies required for Sharp and native modules
RUN apk add --no-cache \
    build-base \
    gcc \
    autoconf \
    automake \
    zlib-dev \
    libpng-dev \
    bash \
    vips-dev \
    git

# Install Corepack and enable pnpm
RUN npm install -g corepack && corepack enable

WORKDIR /opt/

# Copy dependency manifests first to leverage Docker layer caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Install dependencies using pnpm
RUN pnpm install --frozen-lockfile

ENV PATH=/opt/node_modules/.bin:$PATH

WORKDIR /opt/app

COPY . .

# Ensure the node user owns the application directory
RUN chown -R node:node /opt/app

USER node

EXPOSE 1337

CMD ["pnpm", "develop"]