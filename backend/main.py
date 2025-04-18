# En backend/main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import openai
import os
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# ===== Configuración inicial =====
app = FastAPI()

# Habilitar CORS (mejorado para manejar preflight requests)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://neuratek.cl", "http://localhost:3003", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],  # Incluye OPTIONS explícitamente
    allow_headers=["*"],
    max_age=86400,  # Cache para preflight requests (24 horas)
)

# Configuración de OpenAI
openai.api_type = "azure"
openai.api_version = os.getenv("AZURE_API_VERSION", "2024-05-01-preview")
openai.api_base = os.getenv("AZURE_OPENAI_ENDPOINT", "https://neuratek.openai.azure.com/")
openai.api_key = os.getenv("AZURE_OPENAI_KEY")

# Modelo de datos para ambos endpoints
class RequestInput(BaseModel):
    prompt: str
    max_tokens: int = 300
    history: list = []  # Historial de mensajes

# Modelo para el endpoint /ask/ (compatible con el frontend actual)
class PromptRequest(BaseModel):
    prompt: str

# Endpoint original /generate/
@app.post("/generate/")
async def generate_response(request: RequestInput):
    try:
        # Validación explícita de que `history` contiene elementos correctos
        for item in request.history:
            if not isinstance(item, dict) or "role" not in item or "text" not in item:
                raise HTTPException(status_code=400, detail="El historial de mensajes tiene un formato incorrecto.")
        
        # Combinar historial y prompt del usuario
        messages = [{"role": "system", "content": "Eres un asistente virtual llamado Neuratek."}]
        for item in request.history:
            role = "assistant" if item["role"] == "bot" else "user"
            messages.append({"role": role, "content": item["text"]})
        messages.append({"role": "user", "content": request.prompt})

        # Llamada a la API de OpenAI
        response = openai.ChatCompletion.create(
            deployment_id="gpt-4o",  # Reemplaza con el ID de tu deployment
            messages=messages,
            max_tokens=request.max_tokens,
            temperature=0.7
        )

        bot_response = response["choices"][0]["message"]["content"].strip()

        return {"response": bot_response}

    except HTTPException as e:
        raise e  # Propagar errores HTTP si la validación falla
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {e}")

# NUEVO ENDPOINT que coincide con lo que espera el frontend
@app.post("/ask/")
async def api_ask(prompt_request: PromptRequest):
    # Convertir el formato simple a RequestInput
    request = RequestInput(
        prompt=prompt_request.prompt,
        max_tokens=300,
        history=[]  # En este caso no usamos history desde el endpoint /ask/
    )
    # Llamar al mismo proceso del endpoint /generate/
    return await generate_response(request)

# Para pruebas locales (y Render)
if __name__ == "__main__":
    import uvicorn
    # Usa el puerto dinámico proporcionado por Render a través de la variable de entorno PORT
    port = int(os.getenv("PORT", 8000))  # Si no se encuentra la variable de entorno, usa 8000
    uvicorn.run(app, host="0.0.0.0", port=port)