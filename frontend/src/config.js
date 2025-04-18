// Configuración dinámica de URLs de API
const getApiBaseUrl = () => {
    // En producción, queremos usar la URL relativa para aprovechar el mismo dominio
    // donde está alojada la aplicación frontend
    if (process.env.NODE_ENV === 'production') {
      // Usar ruta relativa en producción para que apunte al mismo dominio
      return '';
    }
    // En desarrollo, apuntar a la instancia local de FastAPI
    return 'http://localhost:8000';
  };
  
  export const API_BASE_URL = getApiBaseUrl();