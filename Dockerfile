# syntax=docker/dockerfile:1

# ---- Build stage ----
FROM node:alpine AS build
WORKDIR /app

RUN npm install -g pnpm@11

# Copy manifests first for better layer caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy the rest of the sources
COPY . .

# Install dependencies and build the static web UI into dist/
RUN pnpm install --frozen-lockfile
RUN pnpm build

# ---- Runtime stage ----
FROM node:alpine AS runtime
WORKDIR /app

RUN npm install -g pnpm@11

# Bring over the app manifest, dependencies, and built assets
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/pnpm-lock.yaml ./pnpm-lock.yaml
# Install only production dependencies for the runtime image
RUN pnpm install --frozen-lockfile --prod
COPY --from=build /app/dist ./dist

# Serve the built vite web UI on port 3000
EXPOSE 3000

CMD ["pnpm", "preview", "--host", "0.0.0.0", "--port", "3000"]
