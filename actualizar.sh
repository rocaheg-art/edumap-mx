#!/bin/bash

# 1. Entrar a la carpeta de trabajo
cd "/Users/robertohernandez/Downloads/edumap-mx (1)"

echo "🚀 Iniciando actualización de EduMapMX..."

# 2. Limpieza preventiva (No queremos subir carpetas pesadas que Render genera solo)
rm -rf dist
rm -rf node_modules/.cache

# 3. Asegurar que el .gitignore esté bien (El "escudo" contra archivos de 172MB)
echo "node_modules/" > .gitignore
echo "dist/" >> .gitignore
echo "*.sql" >> .gitignore
echo ".DS_Store" >> .gitignore
echo ".env" >> .gitignore

# 4. Comandos de Git
git add .

# Pedir al usuario el mensaje del cambio
echo "📝 ¿Qué mejoras hiciste? (Escribe tu mensaje y presiona Enter):"
read message

git commit -m "$message"

# 5. Subida a GitHub
echo "📤 Subiendo cambios a la nube..."
git push origin main

echo "✅ ¡Listo, Roberto! En unos 2 minutos Render actualizará tu web automáticamente."
