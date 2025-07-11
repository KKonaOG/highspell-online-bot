FROM node:lts-alpine

# Install dependencies
RUN apk add --no-cache \
    && npm install -g pnpm

# Create app directory
WORKDIR /app

# Copy app source
COPY . .

# Install app dependencies
RUN pnpm install

ENTRYPOINT ["pnpm", "start"]