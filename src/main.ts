import { mount } from 'svelte'
import './app.css'
import App from './App.svelte'

// Esperamos a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', () => {
  const targetNode = document.getElementById('espiral-dashboard-root');

  if (targetNode) {
    // Montamos Svelte en el contenedor correcto
    mount(App, {
      target: targetNode,
    });
  } else {
    console.error('Espiral Dashboard: No se encontró el contenedor #espiral-dashboard-root');
  }
});