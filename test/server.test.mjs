import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp, ollamaGenerate } from '../server.mjs';
import * as core from '../public/core.js';
async function withServer(options, fn) {
  const server = createApp(options);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try { await fn(`http://127.0.0.1:${server.address().port}`); }
  finally { await new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }); }
}
test('serves the app and rejects unrelated origins and unknown paths', async () => {
  await withServer({}, async base => {
    const response = await fetch(base);
    assert.equal(response.status, 200);
    assert.match(await response.text(), /<!doctype html>/i);
    assert.equal((await fetch(`${base}/api/config`, { headers: { Origin: 'https://unrelated.example' } })).status, 403);
    assert.equal((await fetch(`${base}/server.mjs`)).status, 404);
    assert.equal((await fetch(`${base}/api/assist`)).status, 405);
  });
});
if (core.prepareAssist) {
  const payload = core.SAMPLE_BRIEF ? { brief: core.SAMPLE_BRIEF } : { text: core.SAMPLE_TRANSCRIPT };
  const output = core.SAMPLE_BRIEF ? { scenes: core.makeStoryboard(core.SAMPLE_BRIEF).scenes } : { opportunities: core.mapEvidence(core.SAMPLE_TRANSCRIPT).opportunities };
  test('AI-disabled mode is explicit and never silently substitutes a template', async () => {
    await withServer({ model: '' }, async base => {
      const response = await fetch(`${base}/api/assist`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      assert.equal(response.status, 503);
    });
  });
  test('accepts a validated model response and rejects an invalid one', async () => {
    await withServer({ model: 'test-model', generate: async request => { assert.equal(request.schema.type, 'object'); return output; } }, async base => {
      const response = await fetch(`${base}/api/assist`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      assert.equal(response.status, 200);
      assert.equal((await response.json()).mode, 'ollama');
      const invalid = await fetch(`${base}/api/assist`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      assert.equal(invalid.status, 400);
      const huge = await fetch(`${base}/api/assist`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: 'x'.repeat(129000) }) });
      assert.equal(huge.status, 413);
    });
    await withServer({ model: 'test-model', generate: async () => ({ scenes: [], opportunities: [] }) }, async base => {
      const response = await fetch(`${base}/api/assist`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      assert.equal(response.status, 502);
    });
  });
  test('Ollama adapter uses structured output and rejects malformed content', async () => {
    const originalFetch = globalThis.fetch;
    try {
      globalThis.fetch = async (url, options) => {
        assert.equal(new URL(url).pathname, '/api/chat');
        const request = JSON.parse(options.body);
        assert.equal(request.stream, false);
        assert.equal(request.format.type, 'object');
        return new Response(JSON.stringify({ message: { content: JSON.stringify(output) } }), { status: 200 });
      };
      assert.deepEqual(await ollamaGenerate(core.prepareAssist(payload), { model: 'test', baseUrl: 'http://localhost:11434' }), output);
      globalThis.fetch = async () => new Response(JSON.stringify({ message: { content: 'not json' } }), { status: 200 });
      await assert.rejects(ollamaGenerate(core.prepareAssist(payload), { model: 'test', baseUrl: 'http://localhost:11434' }));
    } finally { globalThis.fetch = originalFetch; }
  });
}
