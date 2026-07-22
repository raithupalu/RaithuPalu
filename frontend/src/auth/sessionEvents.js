let onSessionInvalid = null;

export function setSessionInvalidHandler(handler) {
  onSessionInvalid = typeof handler === "function" ? handler : null;
}

export function notifySessionInvalid() {
  if (onSessionInvalid) onSessionInvalid();
}
