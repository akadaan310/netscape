/** Fixed-step bounded spring/damper runtime. No semantic actions or host callbacks. */
export const DT = 1 / 120;
export const TRACE_TOLERANCE = 1e-6;
export const MAX_DISPLACEMENT = 64;
export const MAX_SPEED = 120;
export const MAX_TICKS_PER_STEP = 10_000;
export const DIFFUSION_ALPHA = 0.15;
export const FIELD_DECAY = 0.008;
/** Persistence budgets bound cold-reload replay work; ordinary simulation may run longer. */
export const MAX_REPLAY_TICKS = 100_000;
export const MAX_REPLAY_EVENTS = 1_000;
export const MAX_REPLAY_WORK = 20_000_000;
export type EventKind = 'playful' | 'focus' | 'select';
export type DynamicsEvent = { id: string; tick: number; nodeId: string; kind: EventKind; strength: number };
export type WorldOptions = { seed: number; nodes: { id: string; x: number; y: number; mass?: number }[]; edges: { from: string; to: string; rest?: number; stiffness?: number }[]; reducedMotion?: boolean };
export type World = { readonly tick: number };
export type WorldManifest = { version: 1; options: WorldOptions; events: DynamicsEvent[]; tick: number; traceHash: string };
export type WorldSnapshot = { tick: number; nodes: { id: string; x: number; y: number; vx: number; vy: number; field: number }[]; energy: number; traceHash: string };
type Particle = { id: string; x: number; y: number; ox: number; oy: number; mass: number; vx: number; vy: number; field: number; neighbors: number[] };
type Spring = { a: number; b: number; rest: number; k: number };
type State = { tick: number; seed: number; nodes: Particle[]; edges: Spring[]; reduced: boolean; events: DynamicsEvent[]; ids: Set<string>; index: Map<string, number>; trace: number; initialOptions: WorldOptions; acceptedEvents: DynamicsEvent[] };
const states = new WeakMap<World, State>();
const cmp = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;
const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
function id(value: unknown): value is string { return typeof value === 'string' && value.length > 0 && value.length <= 256; }
function state(world: World): State { const result = states.get(world); if (!result) throw new TypeError('Unknown world'); return result; }
function mix(text: string, hash = 2166136261): number { for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 16777619); return hash >>> 0; }
function q(n: number): number { return Math.round(n / TRACE_TOLERANCE) * TRACE_TOLERANCE; }
function checkBounds(n: unknown, min: number, max: number): n is number { return finite(n) && n >= min && n <= max; }
export function createWorld(options: WorldOptions): World {
  if (!options || !Number.isSafeInteger(options.seed) || !Array.isArray(options.nodes) || options.nodes.length > 4096 || !Array.isArray(options.edges) || options.edges.length > 16384 || (options.reducedMotion !== undefined && typeof options.reducedMotion !== 'boolean')) throw new RangeError('Invalid world options or workload');
  const index = new Map<string, number>();
  const nodes: Particle[] = [...options.nodes].sort((a, b) => cmp(a.id, b.id)).map((n, i) => {
    if (!n || !id(n.id) || index.has(n.id) || !checkBounds(n.x, -1e6, 1e6) || !checkBounds(n.y, -1e6, 1e6) || !checkBounds(n.mass ?? 1, 1e-6, 1e6)) throw new RangeError('Invalid/duplicate node or nonpositive mass');
    index.set(n.id, i);
    return { id: n.id, x: n.x, y: n.y, ox: n.x, oy: n.y, mass: n.mass ?? 1, vx: 0, vy: 0, field: 0, neighbors: [] };
  });
  const sorted = options.edges.map(e => {
    if (!e || !index.has(e.from) || !index.has(e.to) || e.from === e.to || (e.rest !== undefined && !checkBounds(e.rest, 0, 4e6)) || (e.stiffness !== undefined && !checkBounds(e.stiffness, 0, 1e12))) throw new RangeError('Invalid edge, rest length or stiffness');
    return cmp(e.from, e.to) <= 0 ? { ...e } : { ...e, from: e.to, to: e.from };
  }).sort((a, b) => cmp(a.from, b.from) || cmp(a.to, b.to) || (a.rest ?? -1) - (b.rest ?? -1) || (a.stiffness ?? -1) - (b.stiffness ?? -1));
  for (const e of sorted) { const a = index.get(e.from)!, b = index.get(e.to)!; nodes[a].neighbors.push(b); nodes[b].neighbors.push(a); }
  const edges = sorted.map(e => {
    const a = index.get(e.from)!, b = index.get(e.to)!;
    // Per-particle sum(k)/mass <= 36, so the weighted linear Laplacian has lambda <= 72.
    const k = Math.min(e.stiffness ?? 24, 36 * nodes[a].mass / nodes[a].neighbors.length, 36 * nodes[b].mass / nodes[b].neighbors.length);
    return { a, b, k, rest: e.rest ?? Math.hypot(nodes[a].x - nodes[b].x, nodes[a].y - nodes[b].y) };
  });
  const internal: State = { tick: 0, seed: options.seed, nodes, edges, reduced: options.reducedMotion ?? false, events: [], ids: new Set(), index, trace: 2166136261, initialOptions: immutableOptions(options), acceptedEvents: [] };
  const world = Object.freeze({ get tick() { return internal.tick; } });
  states.set(world, internal);
  record(internal);
  return world;
}
export function enqueueEvent(world: World, event: DynamicsEvent): void {
  const s = state(world);
  if (event && s.ids.has(event.id)) throw new RangeError('Duplicate event ID');
  if (!event || !id(event.id) || !s.index.has(event.nodeId) || !Number.isSafeInteger(event.tick) || event.tick < s.tick || !['playful', 'focus', 'select'].includes(event.kind) || !checkBounds(event.strength, 0, 1) || s.ids.size >= 100_000 || s.events.length >= 10_000) throw new RangeError('Invalid event, stale tick, strength or workload');
  s.ids.add(event.id);
  const accepted = { id: event.id, tick: event.tick, nodeId: event.nodeId, kind: event.kind, strength: event.strength };
  s.events.push(accepted);
  s.acceptedEvents.push(accepted);
  s.events.sort((a, b) => a.tick - b.tick || cmp(a.id, b.id));
}
function eventInput(s: State): void {
  while (s.events.length && s.events[0].tick === s.tick) {
    const event = s.events.shift()!;
    const n = s.nodes[s.index.get(event.nodeId)!];
    n.field = Math.min(1, n.field + event.strength);
    if (!s.reduced) {
      const angle = mix(`${s.seed}:${event.id}:${event.nodeId}:${event.kind}`) / 2 ** 32 * Math.PI * 2;
      const impulse = event.strength * (event.kind === 'playful' ? 30 : 12);
      n.vx += Math.cos(angle) * impulse;
      n.vy += Math.sin(angle) * impulse;
      limitSpeed(n);
    }
  }
}
function limitSpeed(n: Particle): void { const speed = Math.hypot(n.vx, n.vy); if (speed > MAX_SPEED) { n.vx *= MAX_SPEED / speed; n.vy *= MAX_SPEED / speed; } }
function record(s: State): void {
  const values = s.nodes.map(n => [n.id, q(n.x), q(n.y), q(n.vx), q(n.vy), q(n.field)]);
  s.trace = mix(JSON.stringify([s.tick, values]), s.trace);
}
/** Integrates bounded logical ticks; dt is deliberately not caller-controlled. */
export function stepWorld(world: World, ticks = 1): World {
  const s = state(world);
  if (!Number.isSafeInteger(ticks) || ticks < 0 || ticks > MAX_TICKS_PER_STEP || ticks * (s.nodes.length + s.edges.length) > 20_000_000 || !Number.isSafeInteger(s.tick + ticks)) throw new RangeError('Invalid or excessive tick workload');
  for (let tick = 0; tick < ticks; tick++) {
    eventInput(s);
    const forces = s.nodes.map(n => ({ x: -0.3 * n.mass * (n.x - n.ox), y: -0.3 * n.mass * (n.y - n.oy) }));
    if (!s.reduced) {
      for (const e of s.edges) {
        const a = s.nodes[e.a], b = s.nodes[e.b];
        const dx = b.x - a.x, dy = b.y - a.y, distance = Math.hypot(dx, dy);
        // Coincident particles use a seeded edge direction instead of dividing by zero.
        const angle = mix(`${s.seed}:${a.id}:${b.id}`) / 2 ** 32 * Math.PI * 2;
        const ux = distance > 1e-12 ? dx / distance : Math.cos(angle);
        const uy = distance > 1e-12 ? dy / distance : Math.sin(angle);
        const force = e.k * (distance - e.rest);
        forces[e.a].x += force * ux; forces[e.a].y += force * uy;
        forces[e.b].x -= force * ux; forces[e.b].y -= force * uy;
      }
      s.nodes.forEach((n, i) => {
        n.vx = (n.vx + forces[i].x / n.mass * DT) / (1 + 6 * DT);
        n.vy = (n.vy + forces[i].y / n.mass * DT) / (1 + 6 * DT);
        limitSpeed(n);
        n.x += n.vx * DT; n.y += n.vy * DT;
        const dx = n.x - n.ox, dy = n.y - n.oy, displacement = Math.hypot(dx, dy);
        if (displacement > MAX_DISPLACEMENT) { n.x = n.ox + dx * MAX_DISPLACEMENT / displacement; n.y = n.oy + dy * MAX_DISPLACEMENT / displacement; n.vx = 0; n.vy = 0; }
        if (![n.x, n.y, n.vx, n.vy].every(Number.isFinite)) throw new Error('Nonfinite numerical state');
      });
    }
    const fields = s.nodes.map(n => {
      const mean = n.neighbors.length ? n.neighbors.reduce((sum, i) => sum + s.nodes[i].field, 0) / n.neighbors.length : n.field;
      return Math.max(0, Math.min(1, (1 - FIELD_DECAY - DIFFUSION_ALPHA) * n.field + DIFFUSION_ALPHA * mean));
    });
    s.nodes.forEach((n, i) => { n.field = fields[i]; });
    s.tick++;
    record(s);
  }
  return world;
}
export function snapshot(world: World): WorldSnapshot {
  const s = state(world);
  let energy = 0;
  for (const n of s.nodes) energy += n.mass / 2 * (n.vx ** 2 + n.vy ** 2) + 0.15 * n.mass * ((n.x - n.ox) ** 2 + (n.y - n.oy) ** 2);
  for (const e of s.edges) energy += e.k / 2 * (Math.hypot(s.nodes[e.a].x - s.nodes[e.b].x, s.nodes[e.a].y - s.nodes[e.b].y) - e.rest) ** 2;
  return { tick: s.tick, nodes: s.nodes.map(n => ({ id: n.id, x: q(n.x), y: q(n.y), vx: q(n.vx), vy: q(n.vy), field: q(n.field) })), energy: q(energy), traceHash: s.trace.toString(16).padStart(8, '0') };
}
/** MIDI mapping only. Host must enforce user gesture and mute before audio playback. */
export function noteForEvent(kind: EventKind): number {
  if (!['playful', 'focus', 'select'].includes(kind)) throw new RangeError('Unknown event kind');
  return { playful: 72, focus: 60, select: 67 }[kind];
}


function cloneOptions(options: WorldOptions): WorldOptions {
  return {
    seed: options.seed,
    nodes: options.nodes.map(n => ({ id: n.id, x: n.x, y: n.y, ...(n.mass !== undefined ? { mass: n.mass } : {}) })),
    edges: options.edges.map(e => ({ from: e.from, to: e.to, ...(e.rest !== undefined ? { rest: e.rest } : {}), ...(e.stiffness !== undefined ? { stiffness: e.stiffness } : {}) })),
    ...(options.reducedMotion !== undefined ? { reducedMotion: options.reducedMotion } : {}),
  };
}
function immutableOptions(options: WorldOptions): WorldOptions {
  const copy = cloneOptions(options);
  copy.nodes.forEach(Object.freeze); copy.edges.forEach(Object.freeze);
  Object.freeze(copy.nodes); Object.freeze(copy.edges);
  return Object.freeze(copy);
}
function persistenceBudget(options: WorldOptions, events: DynamicsEvent[], tick: number): void {
  if (!Number.isSafeInteger(tick) || tick < 0 || tick > MAX_REPLAY_TICKS || events.length > MAX_REPLAY_EVENTS || tick * (options.nodes.length + options.edges.length) > MAX_REPLAY_WORK || events.some(e => !Number.isSafeInteger(e.tick) || e.tick < 0 || e.tick > MAX_REPLAY_TICKS)) throw new RangeError('Persistence tick/event/workload budget exceeded');
}
/** Detached serializable inputs plus the expected integrated trace, never an injected snapshot. */
export function worldManifest(world: World): WorldManifest {
  const s = state(world);
  persistenceBudget(s.initialOptions, s.acceptedEvents, s.tick);
  return {
    version: 1,
    options: cloneOptions(s.initialOptions),
    events: s.acceptedEvents.map(e => ({ ...e })).sort((a, b) => a.tick - b.tick || cmp(a.id, b.id)),
    tick: s.tick,
    traceHash: snapshot(world).traceHash,
  };
}
function schemaObject(value: unknown, allowed: string[], required: string[]): asserts value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value) || ![Object.prototype, null].includes(Object.getPrototypeOf(value)) || Reflect.ownKeys(value).some(key => typeof key !== 'string' || !allowed.includes(key)) || required.some(key => !Object.hasOwn(value, key))) throw new RangeError('Malformed replay object schema');
}
/** Validate a JSON-compatible manifest and reproduce state through the same fixed-step runtime. */
export function replayWorld(manifest: WorldManifest): World {
  schemaObject(manifest, ['version', 'options', 'events', 'tick', 'traceHash'], ['version', 'options', 'events', 'tick', 'traceHash']);
  if (manifest.version !== 1 || typeof manifest.traceHash !== 'string' || !/^[0-9a-f]{8}$/.test(manifest.traceHash) || !Array.isArray(manifest.events) || manifest.events.length > MAX_REPLAY_EVENTS) throw new RangeError('Invalid replay version, trace hash or event count');
  schemaObject(manifest.options, ['seed', 'nodes', 'edges', 'reducedMotion'], ['seed', 'nodes', 'edges']);
  const options = manifest.options;
  if (!Array.isArray(options.nodes) || options.nodes.length > 4096 || !Array.isArray(options.edges) || options.edges.length > 16384) throw new RangeError('Invalid replay node/edge counts');
  options.nodes.forEach(n => schemaObject(n, ['id', 'x', 'y', 'mass'], ['id', 'x', 'y']));
  options.edges.forEach(e => schemaObject(e, ['from', 'to', 'rest', 'stiffness'], ['from', 'to']));
  manifest.events.forEach(e => schemaObject(e, ['id', 'tick', 'nodeId', 'kind', 'strength'], ['id', 'tick', 'nodeId', 'kind', 'strength']));
  persistenceBudget(options, manifest.events, manifest.tick);
  const world = createWorld(options);
  const ordered = [...manifest.events].sort((a, b) => a.tick - b.tick || cmp(a.id, b.id));
  for (const event of ordered) enqueueEvent(world, event);
  const chunk = Math.min(MAX_TICKS_PER_STEP, Math.floor(MAX_REPLAY_WORK / Math.max(1, options.nodes.length + options.edges.length)));
  while (world.tick < manifest.tick) stepWorld(world, Math.min(chunk, manifest.tick - world.tick));
  if (snapshot(world).traceHash !== manifest.traceHash) throw new RangeError('Replay trace hash mismatch');
  return world;
}
