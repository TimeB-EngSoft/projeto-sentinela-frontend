# Etapa "build": só copia arquivos
FROM alpine:3.18 AS build
WORKDIR /app
COPY . /app

# Etapa final: nginx serve os arquivos
FROM nginx:alpine
RUN rm -rf /usr/share/nginx/html/*

# Copia arquivos estáticos para o nginx
COPY --from=build /app /usr/share/nginx/html

# Script de startup que lista arquivos (útil para debug nos logs) e inicia nginx
RUN printf '#!/bin/sh\n\necho "==== LISTANDO /usr/share/nginx/html ===="\nls -la /usr/share/nginx/html || true\n\necho "==== CONTEÚDO RECURSIVO (1 nível) ===="\nls -la /usr/share/nginx/html/* 2>/dev/null || true\n\nexec nginx -g \"daemon off;\"' > /start.sh && chmod +x /start.sh

EXPOSE 80

HEALTHCHECK --interval=5s --timeout=3s --retries=3 CMD wget -q --spider http://localhost:80/ || exit 1

CMD ["/start.sh"]
