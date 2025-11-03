# Build stage
FROM node:10.18.0 as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run prod

# Production stage with Apache2
FROM httpd:2.4-alpine
COPY --from=build /app/xtremandApp/ /usr/local/apache2/htdocs/
RUN sed -i 's/#LoadModule rewrite_module/LoadModule rewrite_module/' /usr/local/apache2/conf/httpd.conf && \
    sed -i 's/AllowOverride None/AllowOverride All/g' /usr/local/apache2/conf/httpd.conf
EXPOSE 80
