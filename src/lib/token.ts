export async function getAppConfig(): Promise<any> {
  // 1. Buscamos el contenedor raíz donde PHP inyectó los datos
  const rootNode = document.getElementById('espiral-dashboard-root');

  // 2. Extraemos y parseamos el atributo 'data-config'
  if (rootNode && rootNode.hasAttribute('data-config')) {
    try {
      const configStr = rootNode.getAttribute('data-config');
      if (configStr) {
        return JSON.parse(configStr);
      }
    } catch (e) {
      console.error('Espiral Dashboard: Error parseando el data-config del DOM.', e);
    }
  }

  // 3. Fallback de seguridad (útil cuando haces 'npm run dev' en local sin Moodle)
  console.warn('Espiral Dashboard: No se encontró data-config. Usando fallback de desarrollo.');
  return {
    token: 'TOKEN_PROVISIONAL',
    baseUrl: 'http://localhost/moodle_robotix_405',
    assetsUrl: '',
    program: 'C450',
    isExampleMode: true
  };
}