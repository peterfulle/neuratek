#!/bin/bash

# Cargar variables de entorno si existe el archivo .env
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
  echo "Variables de entorno cargadas desde .env"
else
  echo "ADVERTENCIA: archivo .env no encontrado. Asegúrate de configurar las variables de entorno."
fi

# Verificar variable de entorno crítica
if [ -z "$AZURE_OPENAI_KEY" ]; then
  echo "ERROR: AZURE_OPENAI_KEY no está configurada. La API no funcionará correctamente."
fi

# Iniciar la aplicación FastAPI
echo "Iniciando el backend de Neuratek en el puerto 8000..."
uvicorn main:app --host=0.0.0.0 --port=8000