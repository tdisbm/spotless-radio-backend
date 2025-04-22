# ========== BUILD STAGE ==========
FROM node:22.14-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install -g nodemon
RUN npm install

COPY ../.. .

RUN npm run start:build


# ========== RUNTIME STAGE ==========
FROM node:22.14-alpine AS runtime

# Install runtime dependencies
RUN apk add --no-cache ffmpeg libgomp expat nmap
RUN ffmpeg -version
RUN nmap --version

WORKDIR /app

COPY package*.json ./
RUN npm install -g nodemon
RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist
COPY media ./media

CMD ["npm", "run", "start:start-express-prod"]
