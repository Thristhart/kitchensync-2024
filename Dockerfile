FROM node:20-alpine
LABEL org.opencontainers.image.source=https://github.com/thristhart/kitchensync-2024

RUN addgroup -S app && adduser -S app -G app

COPY . /srv/kitchensync
WORKDIR /srv/kitchensync
RUN npm ci --workspaces

WORKDIR /srv/kitchensync/packages/backend
USER app
CMD npm start

EXPOSE 3000
