import test from 'node:test';
import assert from 'node:assert/strict';
import { createWorld, enqueueEvent, stepWorld, snapshot, noteForEvent, DT, TRACE_TOLERANCE, MAX_DISPLACEMENT, worldManifest, replayWorld } from '../packages/dynamics/src/index.ts';

const config = { seed: 42, nodes: [{ id: 'a', x: 0, y: 0 }, { id: 'b', x: 20, y: 0 }], edges: [{ from: 'a', to: 'b', rest: 10 }] };
const events = [
  { id: 'z', tick: 0, nodeId: 'a', kind: 'playful' as const, strength: 1 },
  { id: 'a', tick: 0, nodeId: 'a', kind: 'select' as const, strength: 0.8 },
  { id: 'm', tick: 50, nodeId: 'b', kind: 'focus' as const, strength: 0.4 },
];

test('fixed-step replay is identical for shuffled nodes, edges, and same-tick events', () => {
  const first = createWorld(config);
  const second = createWorld({ ...config, nodes: [...config.nodes].reverse(), edges: [...config.edges].reverse() });
  for (const event of events) enqueueEvent(first, event);
  for (const event of [...events].reverse()) enqueueEvent(second, event);
  assert.equal(DT, 1 / 120);
  assert.equal(TRACE_TOLERANCE, 1e-6);
  stepWorld(first, 120);
  for (let i = 0; i < 120; i++) stepWorld(second);
  assert.deepEqual(snapshot(first), snapshot(second));
  assert.ok(snapshot(first).nodes.some(node => node.field > 0));
  assert.throws(() => enqueueEvent(first, events[0]), /duplicate/i);
});

test('spring energy damps and the graph field diffuses without new extrema', () => {
  const world = createWorld(config);
  const initial = snapshot(world).energy;
  stepWorld(world, 1000);
  const final = snapshot(world);
  assert.ok(final.energy < initial * 0.01, `${final.energy} < ${initial * 0.01}`);
  enqueueEvent(world, { id: 'input', tick: 1000, nodeId: 'a', kind: 'focus', strength: 1 });
  stepWorld(world, 10);
  const nodes = snapshot(world).nodes;
  assert.ok(nodes.every(node => node.field >= 0 && node.field <= 1));
  assert.ok(nodes.find(node => node.id === 'b')!.field > 0);
});

test('high-degree, stiff, low-mass stress remains finite and displacement bounded', () => {
  const nodes = Array.from({ length: 120 }, (_, i) => ({ id: String(i), x: i * 2, y: i % 3, mass: i === 0 ? 1e-6 : 1 }));
  const world = createWorld({ seed: 0, nodes, edges: nodes.slice(1).map(node => ({ from: '0', to: node.id, stiffness: 1e8, rest: 0 })) });
  for (let i = 0; i < 200; i++) enqueueEvent(world, { id: String(i), tick: i, nodeId: '0', kind: 'playful', strength: 1 });
  stepWorld(world, 2000);
  const result = snapshot(world);
  assert.ok(Number.isFinite(result.energy));
  for (const node of result.nodes) {
    assert.ok(Object.values(node).slice(1).every(Number.isFinite));
    const origin = nodes.find(origin => origin.id === node.id)!;
    assert.ok(Math.hypot(node.x - origin.x, node.y - origin.y) <= MAX_DISPLACEMENT + 1e-6);
    assert.ok(node.field >= 0 && node.field <= 1);
  }
  assert.throws(() => stepWorld(world, 100_000));
});

test('reduced motion freezes positions while retaining decaying event field and pure note mapping', () => {
  const world = createWorld({ ...config, reducedMotion: true });
  const before = snapshot(world).nodes.map(({ id, x, y }) => ({ id, x, y }));
  enqueueEvent(world, events[0]);
  stepWorld(world, 10);
  assert.deepEqual(snapshot(world).nodes.map(({ id, x, y }) => ({ id, x, y })), before);
  assert.ok(snapshot(world).nodes[0].field > 0);
  assert.equal(noteForEvent('playful'), 72);
  assert.equal(noteForEvent('focus'), 60);
  assert.equal(noteForEvent('select'), 67);
});

test('rejects malformed runtime inputs and stale or duplicate events', () => {
  for (const mass of [0, -1, NaN, Infinity]) assert.throws(() => createWorld({ ...config, nodes: [{ id: 'a', x: 0, y: 0, mass }] }));
  assert.throws(() => createWorld({ ...config, nodes: [config.nodes[0], config.nodes[0]] }));
  assert.throws(() => createWorld({ ...config, edges: [{ from: 'a', to: 'missing' }] }));
  assert.throws(() => createWorld({ ...config, edges: [{ from: 'a', to: 'b', stiffness: -1 }] }));
  assert.throws(() => createWorld({ ...config, seed: NaN }));
  const world = createWorld(config);
  assert.throws(() => enqueueEvent(world, { ...events[0], strength: Infinity }));
  assert.throws(() => enqueueEvent(world, { ...events[0], strength: -1 }));
  assert.throws(() => enqueueEvent(world, { ...events[0], nodeId: 'missing' }));
  assert.throws(() => enqueueEvent(world, { ...events[0], kind: 'purchase' as never }));
  enqueueEvent(world, events[0]);
  assert.throws(() => enqueueEvent(world, events[0]), /duplicate/i);
  stepWorld(world);
  assert.throws(() => enqueueEvent(world, { ...events[0], id: 'stale' }));
  for (const ticks of [-1, 1.5, NaN, Infinity]) assert.throws(() => stepWorld(world, ticks));
});

test('seeded event directions differ, snapshots are detached, and empty worlds advance', () => {
  const a = createWorld(config), b = createWorld({ ...config, seed: 43 });
  enqueueEvent(a, events[0]); enqueueEvent(b, events[0]);
  stepWorld(a); stepWorld(b);
  assert.notDeepEqual(snapshot(a), snapshot(b));
  const detached = snapshot(a);
  detached.nodes[0].x = Infinity;
  assert.ok(Number.isFinite(snapshot(a).nodes[0].x));
  const empty = createWorld({ seed: 0, nodes: [], edges: [] });
  stepWorld(empty, 100);
  assert.equal(snapshot(empty).energy, 0);
  assert.equal(snapshot(empty).tick, 100);
  assert.deepEqual(snapshot(empty).nodes, []);
});


test('serialized world manifests replay processed and future events with exact fields and trace', () => {
  const options = structuredClone(config);
  const world = createWorld(options);
  enqueueEvent(world, { ...events[0], tick: 3 });
  stepWorld(world, 20);
  enqueueEvent(world, { ...events[1], tick: 35 });
  enqueueEvent(world, { ...events[2], tick: 80 });
  stepWorld(world, 40);
  options.nodes[0].x = 999;
  const manifest = worldManifest(world);
  assert.equal(manifest.version, 1);
  assert.equal(manifest.options.nodes[0].x, 0);
  assert.equal(manifest.events.length, 3);
  assert.ok(snapshot(world).nodes.some(node => node.field > 0));
  const restored = replayWorld(JSON.parse(JSON.stringify(manifest)));
  assert.deepEqual(snapshot(restored), snapshot(world));
  stepWorld(world, 30); stepWorld(restored, 30);
  assert.deepEqual(snapshot(restored), snapshot(world), 'pending event also survives cold replay');
  manifest.options.nodes[0].x = -999;
  manifest.events[0].strength = 0;
  assert.equal(worldManifest(world).options.nodes[0].x, 0);
  assert.equal(worldManifest(world).events[0].strength, 1);
});

test('replay rejects tampered trace, version, inputs and oversized persistence workloads', () => {
  const world = createWorld(config);
  enqueueEvent(world, events[0]); stepWorld(world, 20);
  const manifest = worldManifest(world);
  for (const change of [
    { version: 2 }, { traceHash: '00000000' }, { traceHash: 'invalid' },
    { tick: NaN }, { tick: Infinity }, { tick: -1 }, { tick: 1.5 }, { tick: 100001 },
    { events: Array.from({ length: 1001 }, () => events[0]) },
    { events: [{ ...events[0], strength: NaN }] },
    { events: [{ ...events[0], tick: 100001 }] },
    { events: [events[0], events[0]] },
    { options: { ...config, nodes: [{ id: 'a', x: NaN, y: 0 }] } },
    { options: { ...config, nodes: Array.from({ length: 4097 }, () => config.nodes[0]) } },
    { options: { ...config, extra: true } }, { unexpected: true },
  ]) assert.throws(() => replayWorld({ ...manifest, ...change } as never));
  assert.throws(() => replayWorld(null as never));
  const tampered = structuredClone(manifest);
  tampered.events[0].strength = 0.2;
  assert.throws(() => replayWorld(tampered), /trace/i);
  const chunked = createWorld({ seed: 4, nodes: [{ id: 'x', x: 1, y: 2 }], edges: [] });
  for (let i = 0; i < 2; i++) stepWorld(chunked, 10000);
  assert.deepEqual(snapshot(replayWorld(worldManifest(chunked))), snapshot(chunked));
  for (let i = 0; i < 9; i++) stepWorld(chunked, 10000);
  assert.throws(() => worldManifest(chunked), /budget|workload|tick/i);
});
