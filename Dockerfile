FROM node:20-alpine
LABEL org.opencontainers.image.source=https://github.com/thristhart/kitchensync-2024

RUN addgroup -S app --gid=1234 && adduser -S app -G app --uid 1234

COPY . /srv/kitchensync
WORKDIR /srv/kitchensync
RUN npm ci --workspaces

WORKDIR /srv/kitchensync/packages/backend
USER app
CMD npm start

EXPOSE 3000
