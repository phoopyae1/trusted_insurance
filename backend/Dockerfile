FROM node:18-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY prisma ./prisma
RUN npm run prisma:generate

COPY src ./src

EXPOSE 4000

CMD ["npm", "run", "start"]
