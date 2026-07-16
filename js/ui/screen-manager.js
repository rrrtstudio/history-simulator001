export function setScreen(root, screenId, html) {
  root.dataset.screen = screenId;
  root.innerHTML = html;
  window.scrollTo(0, 0);
}

export function bind(root, selector, eventName, handler) {
  const elements = root.querySelectorAll
    ? Array.from(root.querySelectorAll(selector))
    : [];
  if (elements.length) {
    elements.forEach((element) => element.addEventListener(eventName, handler));
    return elements[0];
  }

  const element = root.querySelector?.(selector);
  if (element) element.addEventListener(eventName, handler);
  return element || null;
}
