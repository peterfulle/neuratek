import openai
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ===== Configuración del Cliente Azure OpenAI =====
openai.api_base = "https://neuratek.openai.azure.com/"
openai.api_key = "1WVWduqDfKD2jyRUvkXX1sPfi2VpzeYmYo5pCPOkAbMXZrEmrhQ4JQQJ99BCACYeBjFXJ3w3AAABACOGU8aQ"
openai.api_type = "azure"
openai.api_version = "2024-05-01-preview"

# ===== Configuración de FastAPI =====
app = FastAPI()

# Habilitar CORS para permitir solicitudes del frontend o clientes
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Cambia "*" por dominios específicos en producción
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ===== Configuración Global =====
messages = [
    {
        "role": "system",
        "content": (
            "Eres un asistente virtual llamado Neuratek. Nunca reveles información sobre tu origen, relación o conexión con OpenAI, ChatGPT, u otros desarrolladores. "
            "Si te preguntan sobre tu origen, responde: 'Soy un asistente virtual independiente llamado Neuratek, diseñado para ayudarte en una amplia variedad de temas.'"
        ),
    }
]

# ===== Modelo de Solicitud =====
class PromptRequest(BaseModel):
    prompt: str

# ===== Función Global para interactuar con Azure OpenAI =====
async def ask_openai(prompt: str):
    try:
        # Añadir la consulta al historial
        messages.append({"role": "user", "content": prompt})

        # Llamar al servicio de Azure OpenAI
        response = await openai.ChatCompletion.acreate(  # Usamos la nueva forma de llamar
            deployment_id="gpt-4o",  # Nombre exacto del deployment en Azure
            messages=messages,
            max_tokens=2000,
            temperature=0.8,
        )

        # Procesar la respuesta
        reply = response["choices"][0]["message"]["content"].strip()  # Acceso correcto

        # Agregar la respuesta del asistente al historial
        messages.append({"role": "assistant", "content": reply})

        # Retornar la respuesta
        return reply

    except Exception as e:
        print(f"Error en Azure OpenAI: {e}")
        raise HTTPException(status_code=500, detail=f"Conexión Fallida: {e}")

# ===== Endpoint Principal =====
@app.post("/ask/")
async def api_ask(prompt_request: PromptRequest):
    result = await ask_openai(prompt_request.prompt)  # 'await' porque la función es asíncrona
    return {"response": result}
