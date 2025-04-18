// Configuración dinámica de URLs de API
const getApiBaseUrl = () => {
  // En producción, usar la URL de Azure
  if (process.env.NODE_ENV === 'production') {
    return 'https://neuratek-backend-e7haeehjfmfkhchv.canadacentral-01.azurewebsites.net';
  }
  // En desarrollo, apuntar a la instancia local de FastAPI
  return 'http://localhost:8000';
};

export const API_BASE_URL = getApiBaseUrl();