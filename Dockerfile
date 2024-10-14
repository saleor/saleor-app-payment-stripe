# syntax = docker/dockerfile:1
ARG NODE_VERSION=22.9.0
FROM node:${NODE_VERSION}-slim AS base
ENV NODE_VERSION="$NODE_VERSION"


LABEL fly_launch_runtime="Next.js"

# Next.js app lives here
WORKDIR /app

# Install pnpm
ARG PNPM_VERSION=8.12.0
RUN npm install -g pnpm@$PNPM_VERSION


FROM base AS build

# Set these via `docker run -e APP_DEBUG=debug ...`
# OR set them in your deployed containers environment secrets
# these are needed for pnpm install schema:generate
ENV APL='file'
ENV APP_DEBUG='debug'
# do not replace these here, set these in the deployed environment, or docker run -e ...
# ENV TEST_SALEOR_API_URL=''
# ENV UPSTASH_TOKEN=''
# ENV UPSTASH_URL=''
# ENV SECRET_KEY='test-see-comment-above'


ENV NODE_ENV="production"

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod=false

COPY . .
RUN SECRET_KEY='test-see-comment-above' pnpm run build
# Remove development dependencies
RUN pnpm prune --prod
# Final stage for app image
FROM base

# Copy built application
COPY --from=build /app /app

# Start the server by default, this can be overwritten at runtime
EXPOSE 3000
CMD [ "pnpm", "run", "start" ]
