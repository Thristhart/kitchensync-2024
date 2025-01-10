FROM node:20-alpine
LABEL org.opencontainers.image.source=https://github.com/thristhart/kitchensync-2024

COPY . .
RUN npm ci
WORKDIR packages/backend

CMD npm start

EXPOSE 3000