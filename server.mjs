import {runOpik} from './opik-local.mjs';
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as core from './public/core.js';
const publicRoot = new URL('./public/', import.meta.url);
const files = { '/opik-ui.js':['opik-ui.js','text/javascript'], '/opik-report.json':['opik-report.json','application/json'], '/branding.css': ['branding.css', 'text/css'], '/project-cover.webp': ['project-cover.webp', 'image/webp'], '/': ['index.html', 'text/html'], '/index.html': ['index.html', 'text/html'], '/style.css': ['style.css', 'text/css'], '/app.js': ['app.js', 'text/javascript'], '/core.js': ['core.js', 'text/javascript'], '/shared.js': ['shared.js', 'text/javascript'] };
const MAX_BODY = 128000;
function send(res, status, body) { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(body)); }
async function jsonBody(req) {
  const chunks = []; let size = 0;
  for await (const chunk of req) { size += chunk.length; if (size > MAX_BODY) throw new Error('Request exceeds 128 KB.'); chunks.push(chunk); }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { throw new Error('Request must be valid JSON.'); }
}
export async function ollamaGenerate({ messages, schema }, { model, baseUrl }) {
  let response;
  try {
    response = await fetch(new URL('/api/chat', baseUrl), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model, messages, stream: false, format: schema, options: { temperature: 0.2 } }), signal: AbortSignal.timeout(60000) });
  } catch { throw new Error('Cannot reach the configured Ollama server, or generation timed out. Check that the server and selected model are running.'); }
  if (!response.ok) throw new Error(`Ollama returned HTTP ${response.status}. Check the installed model and server configuration.`);
  const body = await response.json();
  if (typeof body.message?.content !== 'string') throw new Error('Ollama did not return message content.');
  try { return JSON.parse(body.message.content); } catch { throw new Error('The model returned invalid JSON. No draft was accepted.'); }
}
export function createApp(options = {}) {
  const config = { model: options.model ?? process.env.OLLAMA_MODEL ?? '', baseUrl: options.baseUrl ?? process.env.OLLAMA_BASE_URL ?? 'http://127.0.0.1:11434' };
  return http.createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Cache-Control', 'no-store');
    const allowedHosts = ['127.0.0.1', 'localhost', '[::1]'];
    const host = (req.headers.host || '').replace(/:\d+$/, '');
    if (!allowedHosts.includes(host)) return send(res, 403, { error: 'Use the local loopback address.' });
    if (req.headers.origin && ![`http://${req.headers.host}`, `https://${req.headers.host}`].includes(req.headers.origin)) return send(res, 403, { error: 'Cross-origin requests are not accepted.' });
    const pathname = new URL(req.url, 'http://localhost').pathname;
    if (pathname === '/api/opik') { if(req.method!=='POST'||!req.headers['content-type']?.startsWith('application/json'))return send(res,415,{error:'Use POST with JSON.'}); try{return send(res,200,await runOpik(await jsonBody(req)));}catch(error){return send(res,400,{error:error.message});} }
    if (pathname === '/api/config' && req.method === 'GET') return send(res, 200, { localAiEnabled: Boolean(config.model), model: config.model || null });
    if (pathname === '/api/assist') {
      if (req.method !== 'POST') return send(res, 405, { error: 'Use POST.' });
      if (!core.prepareAssist || !core.validateAssist) return send(res, 404, { error: 'This tool evaluates imported traces without a model.' });
      if (!config.model) return send(res, 503, { error: 'Set OLLAMA_MODEL to a model you have installed, then restart npm start.' });
      if (!req.headers['content-type']?.startsWith('application/json')) return send(res, 415, { error: 'Use application/json.' });
      if (Number(req.headers['content-length'] || 0) > MAX_BODY) return send(res, 413, { error: 'Request exceeds 128 KB.' });
      let payload, prepared;
      try { payload = await jsonBody(req); prepared = core.prepareAssist(payload); } catch (error) { return send(res, 400, { error: error.message }); }
      try {
        const output = await (options.generate || ollamaGenerate)(prepared, config);
        const result = core.validateAssist(output, payload);
        return send(res, 200, result);
      } catch (error) { return send(res, 502, { error: error.message || 'The model response could not be validated.' }); }
    }
    if (!['GET', 'HEAD'].includes(req.method)) return send(res, 405, { error: 'Method not supported.' });
    if (!files[pathname]) return send(res, 404, { error: 'Not found.' });
    try { const [file, mime] = files[pathname]; const content = await readFile(new URL(file, publicRoot)); res.writeHead(200, { 'Content-Type': `${mime}; charset=utf-8` }); res.end(req.method === 'HEAD' ? undefined : content); }
    catch { send(res, 500, { error: 'Static file unavailable.' }); }
  });
}
if (process.argv[1] && pathToFileURL(fileURLToPath(pathToFileURL(process.argv[1]))).href === import.meta.url) {
  const port = Number(process.env.PORT || 4311);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be an integer from 1 to 65535.');
  const server = createApp();
  server.listen(port, '127.0.0.1', () => console.log(`Local: http://127.0.0.1:${port}\nLocal AI: ${process.env.OLLAMA_MODEL ? 'configured' : 'off (set OLLAMA_MODEL to enable)'}`));
}
