# Etapa de build: apenas copia os arquivos do projeto
FROM alpine:3.18 AS build
WORKDIR /app
COPY . /app

# Etapa final: Nginx servindo os arquivos estáticos
FROM nginx:alpine

# Remove o conteúdo padrão do nginx
RUN rm -rf /usr/share/nginx/html/*

# Copia os arquivos da etapa build
COPY --from=build /app /usr/share/nginx/html

# Expor porta 80
EXPOSE 80

# Healthcheck (opcional, recomendado para Railway)
HEALTHCHECK --interval=5s --timeout=3s --retries=5 CMD wget -q --spider http://localhost:80/ || exit 1

# Comando padrão do nginx
CMD ["nginx", "-g", "daemon off;"]
