// config.js
const isDevelopment = window.location.hostname === "localhost" || 
                      window.location.hostname === "127.0.0.1";

let baseUrl;

if (isDevelopment) {
  // URL para desarrollo local
  baseUrl = "http://localhost:8000";
} else {
  // URL para producción con proxy CORS
  baseUrl = "https://corsproxy.io/?" + encodeURIComponent("https://neuratek-backend-e7haeehjfmfkhchv.canadacentral-01.azurewebsites.net");
}

export const API_BASE_URL = baseUrl;