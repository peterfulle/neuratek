import { API_BASE_URL } from './config';

export async function generateResponse(prompt, history = []) {
  const response = await fetch(`${API_BASE_URL}/ask/`, {
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