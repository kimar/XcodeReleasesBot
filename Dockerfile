FROM node:20

WORKDIR /home/node/app

COPY package.json ./
COPY yarn.lock ./
COPY tsconfig.json ./

COPY src ./src

EXPOSE 3000
CMD [ "yarn", "start" ]