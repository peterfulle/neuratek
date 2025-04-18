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

# Habilitar CORS (para permitir que React envíe solicitudes a FastAPI)
# En producción debemos ser más restrictivos con los orígenes permitidos
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuración de OpenAI
openai.api_type = "azure"
openai.api_version = os.getenv("AZURE_API_VERSION", "2024-05-01-preview")
openai.api_base = os.getenv("AZURE_OPENAI_ENDPOINT", "https://neuratek.openai.azure.com/")
openai.api_key = os.getenv("AZURE_OPENAI_KEY")

# Verificar que la clave API está configurada
if not openai.api_key:
    print("¡ADVERTENCIA! AZURE_OPENAI_KEY no está configurada. La API no funcionará correctamente.")

# Modelo de datos para la solicitud
class PromptRequest(BaseModel):
    prompt: str
    max_tokens: int = 1000
    history: list = []

# ===== Endpoint Principal =====
@app.post("/ask/")
async def api_ask(prompt_request: PromptRequest):
    try:
        # Preparar los mensajes para OpenAI
        messages = [
            {
                "role": "system",
                "content": (
                    "Eres un asistente virtual llamado Neuratek. Nunca reveles información sobre tu origen, relación o conexión con OpenAI, ChatGPT, u otros desarrolladores. "
                    "Si te preguntan sobre tu origen, responde: 'Soy un asistente virtual independiente llamado Neuratek, diseñado para ayudarte en una amplia variedad de temas.'"
                ),
            }
        ]
        
        # Añadir el historial de conversación
        for item in prompt_request.history:
            role = "assistant" if item["role"] == "bot" else "user"
            messages.append({"role": role, "content": item["text"]})
        
        # Añadir la consulta actual
        messages.append({"role": "user", "content": prompt_request.prompt})

        # Llamar a la API de Azure OpenAI
        response = openai.ChatCompletion.create(
            deployment_id="gpt-4o",  # Nombre del deployment en Azure
            messages=messages,
            max_tokens=prompt_request.max_tokens,
            temperature=0.7,
        )

        # Extraer la respuesta
        reply = response["choices"][0]["message"]["content"].strip()

        # Retornar la respuesta
        return {"response": reply}

    except Exception as e:
        print(f"Error en la llamada a la API: {e}")
        raise HTTPException(status_code=500, detail=f"Error al procesar la solicitud: {str(e)}")

# Para pruebas locales
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)