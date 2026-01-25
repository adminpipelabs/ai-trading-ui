FROM node:18-alpine as builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM node:18-alpine

WORKDIR /app

RUN npm install -g serve

COPY --from=builder /app/build ./build
COPY public/serve.json ./build/serve.json 2>/dev/null || true

EXPOSE 3000

CMD ["serve", "-s", "build", "-l", "3000"]
