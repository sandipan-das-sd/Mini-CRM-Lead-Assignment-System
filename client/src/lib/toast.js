export function notify(message, type = 'success') {
  window.dispatchEvent(new CustomEvent('leadflow:toast', { detail: { message, type } }));
}
