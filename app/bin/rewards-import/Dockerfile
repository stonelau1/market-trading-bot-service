FROM --platform=linux/amd64 node:alpine

RUN mkdir -p /usr/src/app
RUN chown -R node: /usr/src/app

USER node
WORKDIR /usr/src/app

COPY package.json yarn.lock tsconfig.json /usr/src/app/
RUN yarn install

RUN mkdir -p /usr/src/app/scripts
COPY . /usr/src/app/scripts
WORKDIR /usr/src/app

CMD ["/usr/local/bin/yarn", "ts-node", "/usr/src/app/scripts/rewards-import.ts"]
