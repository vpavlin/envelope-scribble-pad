FROM nginx:alpine

RUN sed -i 's/index  index.html index.htm;/index  index.html index.htm;\n        try_files $uri \/index.html;/g' /etc/nginx/conf.d/default.conf

COPY dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]