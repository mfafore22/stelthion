FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

ENV PRISMA_SKIP_ENV_VALIDATION=true

RUN npx prisma generate --schema=./prisma/schema.prisma
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]