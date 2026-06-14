# ---- Development ----
FROM node:20-alpine AS development
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]

# ---- Builder ----
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_GRAPHQL_URL
ARG VITE_WS_URL
ENV VITE_GRAPHQL_URL=$VITE_GRAPHQL_URL
ENV VITE_WS_URL=$VITE_WS_URL
RUN npm run build

# ---- Production ----
FROM nginx:alpine AS production
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
