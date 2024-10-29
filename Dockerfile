ARG ARG_BUILD
FROM node:22-alpine

RUN apk add bash
RUN apk add xsel

ENV NODE_OPTIONS="--max-old-space-size=8192"
RUN npm install -g serve

WORKDIR /usr/src/app
COPY . /usr/src/app

ARG ARG_BUILD
ENV ARG_BUILD=${ARG_BUILD}

# RUN npm install
# RUN npm run build:${ARG_BUILD}

EXPOSE 3000

CMD bash /usr/src/app/n4l_start.sh