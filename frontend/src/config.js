// config.js
const isDevelopment = window.location.hostname === "localhost" || 
                      window.location.hostname === "127.0.0.1";

let baseUrl;

if (isDevelopment) {
  // URL para desarrollo local
  baseUrl = "http://localhost:8000";
} else {
  // URL de tu proxy personalizado en Cloudflare Workers
  baseUrl = "https://neuratek.alejandroiglesias.workers.dev";
}

export const API_BASE_URL = baseUrl;