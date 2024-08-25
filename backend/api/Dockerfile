FROM node:20.13.0-alpine as dev

WORKDIR /app
COPY . .
RUN npm ci

FROM node:20.13.0-alpine as builder

ENV NODE_ENV production

WORKDIR /app
COPY --from=dev /app/node_modules node_modules
COPY ./ ./
RUN npm run build

FROM node:20.13.0-alpine as prod-deps

ENV NODE_ENV production

WORKDIR /app
COPY ./ ./
RUN npm ci --production

FROM node:20.13.0-alpine as prod

ENV NODE_ENV production

WORKDIR /app
RUN apk --no-cache add curl
COPY --from=builder /app/dist dist
COPY --from=builder /app/package.json package.json
COPY --from=builder /app/package-lock.json package-lock.json
COPY --from=prod-deps /app/node_modules node_modules

EXPOSE 8000

CMD [ "npm", "start" ]

