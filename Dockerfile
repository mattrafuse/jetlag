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
# Lightweight nginx image serving the built static assets. The app sits behind
# a separate nginx reverse proxy (see Dockerfile.nginx / nginx.conf), so a
# basic static serve on port 3000 is all that's needed here.
FROM nginx:alpine AS runtime

# Replace the default nginx site config to listen on port 3000 and serve the
# SPA with an index.html fallback for client-side routing.
COPY <<'EOF' /etc/nginx/conf.d/default.conf
server {
    listen 3000;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF

# Copy the built static assets into nginx's default serve directory
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 3000
