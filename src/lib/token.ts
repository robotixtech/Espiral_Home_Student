export interface AppConfig {
  token: string;
  baseUrl: string;
  programShortname: string;
  pluginUrl?: string;
  userId?: number;
  isExampleMode?: boolean;
}

/** Extrae la configuración inyectada por Moodle en el nodo raíz */
export function getAppConfig(): AppConfig {
  const rootNode = document.getElementById('espiral-dashboard-root');
  
  if (!rootNode) {
    throw new Error('No se encontró el contenedor #espiral-dashboard-root');
  }

  const configStr = rootNode.getAttribute('data-config');
  if (!configStr) {
    throw new Error('Falta el atributo data-config en el contenedor raíz');
  }

  try {
    const config = JSON.parse(configStr);
    
    if (!config.token && !config.isExampleMode) {
      console.warn('Advertencia: No se recibió token de Moodle y no estamos en modo ejemplo.');
    }

    return {
      token: config.token || '',
      baseUrl: config.baseUrl || '',
      programShortname: config.program || 'C450',
      pluginUrl: config.pluginUrl || '',
      userId: config.userId,
      isExampleMode: config.isExampleMode || false
    };
  } catch (error) {
    throw new Error('Error al parsear data-config JSON desde Moodle.');
  }
}