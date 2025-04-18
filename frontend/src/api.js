const BASE_URL = "http://localhost:8000"; // URL del backend

export async function generateResponse(prompt, history = []) {
  const response = await fetch(`${BASE_URL}/generate/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
      max_tokens: 300,
      history,
    }),
  });

  if (!response.ok) {
    throw new Error("Error en la comunicación con el backend");
  }

  return response.json();
}
