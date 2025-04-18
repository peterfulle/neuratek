import os
import sys
import uvicorn

def main():
    # Verificar que tenemos la variable de entorno AZURE_OPENAI_KEY
    if not os.environ.get("AZURE_OPENAI_KEY"):
        print("ERROR: AZURE_OPENAI_KEY no está configurada. La API no funcionará correctamente.")
        print("Asegúrate de configurar las variables de entorno en Azure App Service.")
        # No interrumpir el inicio para evitar ciclos de reinicio en Azure

    port = os.environ.get("PORT", 8000)
    
    # Iniciar la aplicación FastAPI
    uvicorn.run("main:app", host="0.0.0.0", port=int(port))

if __name__ == "__main__":
    main()