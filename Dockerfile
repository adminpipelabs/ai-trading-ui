# Cache bust: 1769650680
FROM node:18-alpine as builder

WORKDIR /app

# Clear npm cache
RUN npm cache clean --force

COPY package*.json ./
RUN npm install --no-cache

COPY . .
RUN npm run build

FROM node:18-alpine

WORKDIR /app

RUN npm install -g serve

COPY --from=builder /app/build ./build

EXPOSE 3000

CMD ["serve", "-s", "build", "-l", "3000"]
