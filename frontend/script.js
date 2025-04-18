const BASE_URL = "http://localhost:8000/ask/"; // URL del backend FastAPI

// Referencias del DOM
const chatArea = document.getElementById("chat-area");
const userInput = document.getElementById("user-input");
const sendButton = document.getElementById("send-button");

// Función para enviar un mensaje al backend
const sendMessage = async () => {
  const userMessage = userInput.value.trim(); // Obtiene el texto ingresado por el usuario

  if (!userMessage) {
    return; // No enviar mensajes vacíos
  }

  // Muestra el mensaje del usuario en el chat
  displayMessage("user", userMessage);

  // Limpia el área de entrada
  userInput.value = "";

  try {
    // Realiza la solicitud POST al backend
    const response = await fetch(BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: userMessage,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const botMessage = data.response;

      // Muestra la respuesta del asistente en el chat
      displayMessage("bot", botMessage);
    } else {
      displayMessage("bot", "⚠️ Error al comunicar con el servidor.");
    }
  } catch (error) {
    displayMessage("bot", "⚠️ No se pudo conectar con el backend.");
    console.error("Error:", error);
  }
};

// Función para mostrar un mensaje en el área de chat
const displayMessage = (sender, message) => {
  const messageContainer = document.createElement("div");
  messageContainer.classList.add("message", sender); // "message user" o "message bot"
  messageContainer.textContent = message;

  chatArea.appendChild(messageContainer);
  chatArea.scrollTop = chatArea.scrollHeight; // Mantener el chat con scroll
};

// Escuchar los clics en el botón
sendButton.addEventListener("click", sendMessage);

// También puedes enviar al pulsar "Enter" en el área de texto
userInput.addEventListener("keypress", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault(); // Evita un salto de línea
    sendMessage();
  }
});
