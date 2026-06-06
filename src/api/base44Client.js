import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';

const { appId, token, functionsVersion, appBaseUrl } = appParams;

// Creamos el cliente apuntando al servidor real de Base44
export const base44 = createClient({
  appId,
  token,
  functionsVersion,
  // Le asignamos la URL base del backend para que no quede vacía y conecte con la IA y Sheets
  serverUrl: appBaseUrl || 'https://api.base44.com', 
  requiresAuth: false,
  appBaseUrl
});
