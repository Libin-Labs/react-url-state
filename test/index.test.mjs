import { beforeEach, afterEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { act, createElement } from 'react';
import { setup } from './helpers.mjs';
import { useUrlState, stringParam, numberParam, booleanParam } from '../dist/index.js';
let ui, api;
beforeEach(async () => (ui = await setup()));
afterEach(async () => ui.cleanup());
test('schema defaults reject malformed values and writes preserve unrelated parameters/hash', async () => {
  window.history.replaceState(null, '', '/?other=keep&page=bad#section');
  function App() {
    api = useUrlState({ q: stringParam(), page: numberParam(1, 1, 100), open: booleanParam() });
    return null;
  }
  await ui.render(createElement(App));
  assert.equal(api.state.page, 1);
  await act(() => assert.equal(api.setState({ q: '<text>', page: 2 }), true));
  assert.equal(new URL(window.location.href).searchParams.get('other'), 'keep');
  assert.equal(window.location.hash, '#section');
  assert.equal(api.state.q, '<text>');
  await act(() => assert.equal(api.setState({ page: 1000 }), false));
  assert.ok(api.error);
});
