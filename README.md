# Neuratek Chat

Aplicación de chat con inteligencia artificial que utiliza Azure OpenAI para proporcionar respuestas inteligentes, desarrollada con FastAPI para el backend y React para el frontend.

## Características

- 💬 Interfaz de chat intuitiva y atractiva
- 🎨 Múltiples modos visuales (Estándar, Oscuro, Creativo)
- 🔊 Reconocimiento de voz para entrada de texto
- 📋 Modo "Neurapasted" para pegar contenido como respuestas
- 🧠 Integración con Azure OpenAI (GPT-4o)
- 📱 Diseño responsivo para todas las pantallas

## Estructura del Proyecto

```
proyecto-neuratek/
├── backend/              # Servidor FastAPI
│   ├── app.py            # API principal
│   └── requirements.txt  # Dependencias Python
├── frontend/             # Aplicación React
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── App.js        # Componente principal
│   │   └── ...
│   ├── package.json
│   └── ...
```

## Requisitos

- Python 3.8+
- Node.js 14+
- Cuenta de Azure con servicio OpenAI configurado

## Configuración

### Backend

1. Crear un entorno virtual:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # En Windows: venv\Scripts\activate
   ```

2. Instalar dependencias:
   ```bash
   pip install -r requirements.txt
   ```

3. Configurar variables de entorno (opcional, ya configuradas en el código):
   ```
   OPENAI_API_BASE=https://tu-servicio.openai.azure.com/
   OPENAI_API_KEY=tu-clave-api
   OPENAI_API_VERSION=2024-05-01-preview
   ```

4. Iniciar el servidor:
   ```bash
   uvicorn app:app --reload
   ```

### Frontend

1. Instalar dependencias:
   ```bash
   cd frontend
   npm install
   ```

2. Iniciar la aplicación:
   ```bash
   npm start
   ```

## Despliegue en Azure

Esta aplicación está configurada para ser desplegada como una Web App de Azure. Consulta la documentación para más detalles sobre el proceso de despliegue.

## Licencia

© 2025 - Todos los derechos reservados🔄 Activando workflow
