import { getAppConfig } from './token';

let cachedAssetsUrl: string | null = null;

export function getAssetUrl(relativePath: string): string {
  if (cachedAssetsUrl === null) {
    try {
      const config = getAppConfig();
      
      // 1. Intentamos usar 'assetsUrl' si PHP lo envió correctamente
      if (config.assetsUrl) {
        cachedAssetsUrl = config.assetsUrl.replace(/\/$/, '');
      } 
      // 2. Si falta, pero tenemos el 'baseUrl' de Moodle, construimos la ruta manualmente
      else if (config.baseUrl) {
        cachedAssetsUrl = `${config.baseUrl.replace(/\/$/, '')}/blocks/espiral_dashboard/visual`;
      } 
      // 3. Fallback de desarrollo local (Vite)
      else {
        cachedAssetsUrl = import.meta.env.BASE_URL.replace(/\/$/, '');
      }
    } catch (e) {
      cachedAssetsUrl = import.meta.env.BASE_URL.replace(/\/$/, '');
    }
  }

  // Limpiamos la ruta entrante para evitar dobles barras
  const cleanPath = relativePath.replace(/^\//, '');
  
  return `${cachedAssetsUrl}/${cleanPath}`;
}