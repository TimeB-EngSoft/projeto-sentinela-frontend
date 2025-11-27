# Etapa de "build": só copia os arquivos (não há build para HTML/CSS/JS puro)
FROM alpine:3.18 AS build
WORKDIR /app
COPY . /app

# Etapa final: usar Nginx para servir os arquivos estáticos
FROM nginx:alpine
# Remove a página default do nginx (opcional)
RUN rm -rf /usr/share/nginx/html/*
# Copia os arquivos estáticos gerados para a pasta que o nginx serve
COPY --from=build /app /usr/share/nginx/html

# (Opcional) Substitua o config padrão se precisar de routing para SPA:
# COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
