FROM node:20-alpine

COPY . .
WORKDIR packages/backend
RUN npm ci

CMD npm start

EXPOSE 3000