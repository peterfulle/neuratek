from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import openai

# ===== Configuración inicial =====
app = FastAPI()

# Habilitar CORS (para permitir que React envíe solicitudes a FastAPI)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Cambiar "*" por los orígenes exactos en producción
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuración de OpenAI
openai.api_type = "azure"
openai.api_version = "2024-05-01-preview"
openai.api_base = "https://neuratek.openai.azure.com/"  # Reemplaza con tu endpoint de Azure
openai.api_key = "1WVWduqDfKD2jyRUvkXX1sPfi2VpzeYmYo5pCPOkAbMXZrEmrhQ4JQQJ99BCACYeBjFXJ3w3AAABACOGU8aQ"  # Reemplaza con tu clave API

# Modelo de datos para la solicitud
class RequestInput(BaseModel):
    prompt: str
    max_tokens: int = 300
    history: list = []  # Historial de mensajes

# Endpoint para manejar las solicitudes del cliente
@app.post("/generate/")
async def generate_response(request: RequestInput):
    try:
        # Combinar el historial de mensajes y la consulta del usuario
        messages = [{"role": "system", "content": "Eres un asistente útil y amigable."}]
        for item in request.history:
            role = "assistant" if item["role"] == "bot" else "user"
            messages.append({"role": role, "content": item["text"]})
        messages.append({"role": "user", "content": request.prompt})

        # Llamar a la API de OpenAI
        response = openai.ChatCompletion.create(
            deployment_id="gpt-4o",  # Reemplaza con el ID del deployment
            messages=messages,
            max_tokens=request.max_tokens,
            temperature=0.7
        )

        # Extraer el contenido de la respuesta
        bot_response = response["choices"][0]["message"]["content"].strip()

        # Retornar el resultado al cliente
        return {"response": bot_response}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {e}")
