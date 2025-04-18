from fastapi import FastAPI

# Crear instancia de FastAPI
app = FastAPI()

# Endpoint raíz para probar el servidor
@app.get("/")
def read_root():
    return {"message": "Hola, FastAPI está funcionando correctamente."}
