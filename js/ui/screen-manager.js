export function setScreen(root, screenId, html, { preserveScroll = false, scrollPosition = null } = {}) {
  const scrollX = Number(scrollPosition?.x ?? window.scrollX ?? window.pageXOffset ?? 0);
  const scrollY = Number(scrollPosition?.y ?? window.scrollY ?? window.pageYOffset ?? 0);
  root.dataset.screen = screenId;
  root.innerHTML = html;
  if (!preserveScroll) {
    window.scrollTo(0, 0);
    return;
  }

  const restoreScroll = () => window.scrollTo(scrollX, scrollY);
  restoreScroll();
  window.requestAnimationFrame?.(() => {
    restoreScroll();
    window.requestAnimationFrame?.(restoreScroll);
  });
  window.setTimeout?.(restoreScroll, 40);
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
