# Stage 1: Builder
FROM node:22-alpine AS builder

# 1. Instalar pnpm y configurar el store (Capa de herramientas)
RUN npm install --global corepack@latest && \
    corepack enable && corepack prepare pnpm@latest --activate

# Configurar el directorio del store de pnpm para aprovechar la caché de Docker
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

WORKDIR /app

# 2. Copiar SOLO archivos de dependencias (Capa de dependencias)
# Esto evita que un cambio en el código fuente invalide la caché de la instalación
COPY package.json pnpm-lock.yaml ./

# 3. Instalar dependencias usando un "mount" de caché (Opcional pero recomendado)
# Esto guarda los paquetes en el host para que el próximo build sea instantáneo
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

# 4. Copiar el resto del código (Capa de código fuente)
COPY . .

# 5. Build
ENV NODE_OPTIONS="--max-old-space-size=8192"
# RUN pnpm run build

# Stage 2: Production
FROM nginx:alpine

# Copiar configuración y assets
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html/n4l/

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]