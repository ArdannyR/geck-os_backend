# 1. Usamos una imagen base oficial de Node.js (Debian-based)
FROM node:20

# 2. Instalamos las dependencias del sistema operativo
# 'default-jdk' para Java, 'g++' para C++ y 'python3' para Python
RUN apt-get update && apt-get install -y \
    default-jdk \
    g++ \
    python3 \
    && rm -rf /var/lib/apt/lists/*

# 3. Creamos el directorio de trabajo dentro del contenedor
WORKDIR /app

# 4. Copiamos solo los archivos de dependencias primero
# Esto ayuda a que Render no tenga que reinstalar todo si solo cambias código
COPY package*.json ./

# 5. Instalamos las dependencias de Node.js
RUN npm install

# 6. Copiamos todo el código fuente del backend
COPY . .

# 7. Creamos la carpeta de uploads por si acaso no existe
# (Donde se guardan tus archivos temporales de ejecución)
RUN mkdir -p uploads

# 8. Exponemos el puerto que usa tu servidor Express
EXPOSE 3000

# 9. Comando para iniciar la aplicación
# Asegúrate de que en tu package.json 'npm start' apunte a tu archivo principal
CMD ["npm", "start"]