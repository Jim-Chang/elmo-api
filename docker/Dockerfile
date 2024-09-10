FROM node:18.20.4-alpine AS base

WORKDIR /usr/src/app

RUN npm install -g pnpm@">=9.9"
COPY --chown=node:node package*.json pnpm-lock.yaml ./

FROM base AS build

RUN pnpm install --frozen-lockfile --prefer-offline

COPY --chown=node:node . .
RUN pnpm run build


FROM base AS production

ENV NODE_ENV=production

RUN pnpm install --prod --frozen-lockfile --prefer-offline

COPY --chown=node:node --from=build /usr/src/app/dist ./dist
CMD [ "node", "dist/main.js" ]
