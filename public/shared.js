export function el(tag, attributes = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attributes)) {
    if (value === undefined || value === null) continue;
    if (key.startsWith('on') && typeof value === 'function') node.addEventListener(key.slice(2), value);
    else if (key === 'className') node.className = value;
    else if (key === 'value') node.value = value;
    else node.setAttribute(key, String(value));
  }
  for (const child of children.flat(Infinity)) {
    if (child !== null && child !== undefined && child !== false) node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return node;
}
export function download(name, content, type = 'text/plain') {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = el('a', { href: url, download: name });
  document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function showError(error) {
  const node = document.getElementById('error');
  node.textContent = error.message || 'The request could not be completed.';
  node.hidden = false;
  node.scrollIntoView({ block: 'nearest', behavior: 'instant' });
}
export async function assist(payload) {
  let response;
  try { response = await fetch('./api/assist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: AbortSignal.timeout(65000) }); }
  catch { throw new Error('The local AI server is unavailable or timed out. Run npm start with OLLAMA_MODEL configured, or choose the mode that needs no model.'); }
  if (response.status === 404 || !response.headers.get('content-type')?.includes('application/json')) throw new Error('Local AI is available when running this repository locally. See the README for Ollama setup.');
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || 'The model request failed.');
  return body;
}
