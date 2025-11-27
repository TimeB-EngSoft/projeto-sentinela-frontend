# Etapa "build": só copia os arquivos
FROM alpine:3.18 AS build
WORKDIR /app
COPY . /app

# Etapa final: nginx serve os arquivos
FROM nginx:alpine
RUN rm -rf /usr/share/nginx/html/*

# Copia arquivos estáticos para o nginx
COPY --from=build /app /usr/share/nginx/html

# Apenas loga o conteúdo no startup (sem script externo)
ENTRYPOINT ["/bin/sh", "-c", "\
echo '=== LISTANDO /usr/share/nginx/html ==='; \
ls -la /usr/share/nginx/html; \
echo '=== INICIANDO NGINX ==='; \
nginx -g 'daemon off;' \
"]

EXPOSE 80
