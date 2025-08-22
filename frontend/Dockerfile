# syntax=docker/dockerfile:1

FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
# Serve with Vite preview (no SSR) or a tiny static server
RUN npm i -g serve
COPY --from=build /app/dist /app/dist
EXPOSE 5173
CMD ["serve","-s","dist","-l","5173"]
