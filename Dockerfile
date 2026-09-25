# ==============================================================================
# DOCKERFILE - FARMACIA HOSPITAL DE LA MUJER DE TEPIC (IMSS-BIENESTAR)
# Imagen de Producción Optimizada y Fortalecida (Nginx Alpine)
# ==============================================================================

FROM nginx:1.27-alpine

LABEL maintainer="Servicios de Salud IMSS-Bienestar Nayarit"
LABEL hospital="Hospital de la Mujer Tepic"
LABEL description="Sistema de Gestión de Farmacia Hospitalaria y Abasto"

# Instalar curl para healthchecks del contenedor
RUN apk add --no-cache curl

# Configuración personalizada de Nginx con Headers de Seguridad Hospitalaria y Compresión
RUN rm -rf /etc/nginx/conf.d/default.conf

COPY <<EOF /etc/nginx/conf.d/farmacia.conf
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Compresión GZIP para transferencias ultrarrápidas
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;

    # Headers de Seguridad Institucional y Protección contra Ataques Web
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;

    # Caché optimizada para activos estáticos (imágenes, scripts y estilos)
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 7d;
        add_header Cache-Control "public, no-transform";
    }

    # Ruta principal SPA
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Endpoint para Healthcheck del contenedor
    location /health {
        access_log off;
        return 200 "FARMACIA_HOSPITAL_MUJER_OK\n";
    }

    # Página de error
    error_page 500 502 503 504 /50x.html;
    location = /50x.html {
        root /usr/share/nginx/html;
    }
}
EOF

# Copiar archivos del proyecto al directorio público de Nginx
COPY index.html /usr/share/nginx/html/
COPY Logo-hospital-de-la-mujer-servicios-de-salud-imss-bienestar.png /usr/share/nginx/html/
COPY css/ /usr/share/nginx/html/css/
COPY js/ /usr/share/nginx/html/js/
COPY vendor/ /usr/share/nginx/html/vendor/

# Permisos seguros
RUN chmod -R 755 /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
