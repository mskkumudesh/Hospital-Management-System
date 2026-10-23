# One container: the Express API also serves the built website.
FROM node:20-slim AS build
WORKDIR /app
COPY Frontend/package.json Frontend/package-lock.json Frontend/
COPY Backend/package.json Backend/package-lock.json Backend/
RUN npm ci --prefix Frontend && npm ci --prefix Backend
COPY Frontend Frontend
COPY Backend Backend
RUN npm run build --prefix Frontend && npm run build --prefix Backend

FROM node:20-slim
# mysqldump, used by the nightly backup job
RUN apt-get update && apt-get install -y --no-install-recommends default-mysql-client \
    && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production
WORKDIR /app/Backend
COPY Backend/package.json Backend/package-lock.json ./
RUN npm ci --omit=dev
COPY --from=build /app/Backend/dist dist
COPY --from=build /app/Frontend/dist ../Frontend/dist
COPY database ../database
CMD ["node", "dist/app.js"]
