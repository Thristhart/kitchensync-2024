FROM node:20-alpine
LABEL org.opencontainers.image.source=https://github.com/thristhart/kitchensync-2024

COPY . .
WORKDIR packages/backend
RUN npm ci

CMD npm start

EXPOSE 3000