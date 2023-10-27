FROM node:18.15.0-alpine3.17 as build
WORKDIR /usr/app
COPY . /usr/app
RUN npm install
RUN npm run build:production

FROM nginx:1.24.0-alpine3.17
EXPOSE 80
COPY .nginx/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /usr/app/build /usr/share/nginx/html