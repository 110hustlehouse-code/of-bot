FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY src ./src
COPY tsconfig.json ./
COPY drizzle.config.ts ./
RUN npm install tsx
EXPOSE 3001
CMD ["npx", "tsx", "src/index.ts"]
