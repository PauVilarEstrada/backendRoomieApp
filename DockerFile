# Usa Node oficial
FROM node:20

# Crea directorio de trabajo
WORKDIR /app

# Copia los archivos de dependencias
COPY package*.json ./
RUN npm install

# Copia el resto del código
COPY . .

# Compila el proyecto si usas TypeScript
RUN npx prisma generate
RUN npm run build

# Expone el puerto
EXPOSE 8080

# Comando de inicio
CMD ["npm", "start"]
