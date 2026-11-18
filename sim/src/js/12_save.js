// ============================================================
//  セーブ・ロード
// ============================================================
const SAVE_KEY = 'soranominato_v1_slot', OPT_KEY = 'soranominato_v1_opts';
function rle(arr) {
  const out = []; let prev = arr[0], n = 0;
  for (let i = 0; i < arr.length; i++) { if (arr[i] === prev && n < 65535) n++; else { out.push(n > 1 ? prev + '*' + n : String(prev)); prev = arr[i]; n = 1; } }
  out.push(n > 1 ? prev + '*' + n : String(prev));
  return out.join(',');
}
function unrle(s, Ctor, len) {
  const a = new Ctor(len); let k = 0;
  for (const tok of s.split(',')) { const [v, n] = tok.split('*'); const c = n ? +n : 1; for (let i = 0; i < c && k < len; i++) a[k++] = +v; }
  return a;
}
const BLD_KEYS = ['uid', 'id', 'x', 'y', 'rot', 'lv', 'day', 'fixed', 'num', 'gate', 'salesTotal', 'visits', 'salesYest'];
function serialize() {
  const g = Object.assign({}, G);
  g.ter = undefined; g.occ = undefined;
  g.floor = rle(G.floor); g.trees = rle(G.trees); g.sectors = Array.from(G.sectors);
  g.oneway = G.oneway && G.oneway.some(v => v) ? rle(G.oneway) : undefined;
  g.blds = Object.values(G.blds).map(b => BLD_KEYS.map(k => b[k] == null ? null : b[k]));
  g.cam = { tx: Cam.tx, tz: Cam.tz, zoom: Cam.zoom, rot: Cam.rot };
  g.saved = Date.now(); g.mapW = W; g.mapH = H;
  g.stat = { today: G.stat.today, buildCost: G.stat.buildCost };
  return JSON.stringify(g);
}
function deserialize(json) {
  const g = JSON.parse(json);
  if (!g || !g.floor) throw new Error('bad save');
  const seed = g.seed;
  G = g;
  // 地形は種から作り直す
  const keep = { floor: g.floor, trees: g.trees, sectors: g.sectors, blds: g.blds };
  genMap(seed);
  const oldMap = !g.mapW;   // 72x48 の古いセーブ
  if (oldMap) {
    const W0 = 72, H0 = 48, old = genTerrain(seed, W0, H0);
    const f0 = unrle(keep.floor, Uint8Array, W0 * H0), t0 = unrle(keep.trees, Uint8Array, W0 * H0);
    G.floor = new Uint8Array(W * H);
    for (let y = 0; y < H0; y++) for (let x = 0; x < W0; x++) {
      const i0 = y * W0 + x, i = idx(x + OX, y + OY);
      if (old.ter[i0] !== TER.WATER || f0[i0]) { G.ter[i] = old.ter[i0] === TER.WATER ? TER.GRASS : old.ter[i0]; G.trees[i] = t0[i0]; }
      G.floor[i] = f0[i0];
    }
    const s0 = keep.sectors; G.sectors = new Uint8Array(SECW * SECH);
    for (let sy = 0; sy < 4; sy++) for (let sx = 0; sx < 6; sx++) if (s0[sy * 6 + sx]) G.sectors[(sy + 1) * SECW + sx + 1] = 1;
    if (g.cam) { g.cam.tx += OX; g.cam.tz += OY; }
  } else {
    G.floor = unrle(keep.floor, Uint8Array, W * H);
    G.trees = unrle(keep.trees, Uint8Array, W * H);
    G.sectors = Uint8Array.from(keep.sectors);
  }
  G.oneway = typeof g.oneway === 'string' && !oldMap ? unrle(g.oneway, Uint8Array, W * H) : new Uint8Array(W * H);
  G.occ = new Int32Array(W * H);
  G.blds = {};
  for (const arr of keep.blds) {
    const b = {}; BLD_KEYS.forEach((k, i) => { if (arr[i] != null) b[k] = arr[i]; });
    if (oldMap) { b.x += OX; b.y += OY; }
    const def = B[b.id]; if (!def) continue;
    const [w, h] = dims(def, b.rot);
    for (let y = b.y; y < b.y + h; y++) for (let x = b.x; x < b.x + w; x++) G.occ[idx(x, y)] = b.uid;
    G.blds[b.uid] = b;
  }
  // 足りない項目をおぎなう
  const base = { routes: [], airlines: {}, research: {}, combos: {}, ach: {}, seenPax: {}, seenPlanes: {}, stamps: {}, flags: {}, story: { ch: 0, step: 0, done: {} }, hist: [], satHist: [], events: [], forecast: ['sun', 'sun'], feeLevel: 1, hints: {} };
  for (const [k, v] of Object.entries(base)) if (G[k] == null) G[k] = v;
  for (const id of Object.keys(AIRLINES)) if (!G.airlines[id]) G.airlines[id] = { rel: 25, flights: 0 };
  if (!G.stat || !G.stat.today) G.stat = { today: newStatDay(), buildCost: 0 };
  G.stat.today = Object.assign(newStatDay(), G.stat.today);
  if (g.cam) { Cam.tx = g.cam.tx; Cam.tz = g.cam.tz; Cam.zoom = g.cam.zoom; Cam.rot = g.cam.rot || 0; Cam.yaw = Cam.yawT = Math.PI / 4 + Cam.rot * Math.PI / 2; }
  G.flags.event = G.flags.event || null;
  if (G.landBought == null) { let n = 0; for (const v of G.sectors) n += v; G.landBought = Math.max(0, n - (oldMap ? 4 : 6)); }
  clearAirsideTrees();
  return G;
}
function saveGame(slot) {
  if (Game.demo || !G) return false;
  slot = slot == null ? Game.slot : slot;
  try { localStorage.setItem(SAVE_KEY + slot, serialize()); return true; }
  catch (e) { console.warn(e); toast('セーブできませんでした（ブラウザの保存領域）', 'bad'); return false; }
}
function autoSave() { if (!Game.demo) saveGame(); }
function slotInfo(slot) {
  try {
    const s = localStorage.getItem(SAVE_KEY + slot); if (!s) return null;
    const g = JSON.parse(s);
    const d = dateOf(g.day);
    return { name: g.name, rank: g.rank, money: g.money, date: `${d.year}年目 ${d.month}月${d.partName}`, saved: g.saved, free: g.free };
  } catch (e) { return null; }
}
function loadSlot(slot) {
  const s = localStorage.getItem(SAVE_KEY + slot);
  if (!s) return false;
  deserialize(s);
  return true;
}
function saveOpts() {
  try { localStorage.setItem(OPT_KEY, JSON.stringify({ bgm: Sound.vol.bgm, se: Sound.vol.se, q: R.opts.quality, tilt: R.opts.tilt, outline: R.opts.outline, nightSkip: Game.opts.nightSkip, dayReport: Game.opts.dayReport })); } catch (e) { }
}
function loadOpts() {
  try {
    const o = JSON.parse(localStorage.getItem(OPT_KEY) || '{}');
    if (o.bgm != null) Sound.vol.bgm = o.bgm; if (o.se != null) Sound.vol.se = o.se;
    if (o.q) R.opts.quality = o.q; if (o.tilt != null) R.opts.tilt = o.tilt; if (o.outline != null) R.opts.outline = o.outline;
    if (o.nightSkip != null) Game.opts.nightSkip = o.nightSkip;
    if (o.dayReport != null) Game.opts.dayReport = o.dayReport;
  } catch (e) { }
}
// 引きつぎコード（文字列）
function b64enc(str) { return btoa(unescape(encodeURIComponent(str))); }
function b64dec(s) { return decodeURIComponent(escape(atob(s))); }
function exportCode() { return 'SORA1:' + b64enc(serialize()); }
function importCode(code) {
  try {
    if (!code.startsWith('SORA1:')) return false;
    const json = b64dec(code.slice(6));
    JSON.parse(json);
    localStorage.setItem(SAVE_KEY + Game.slot, json);
    setTimeout(() => startGame(Game.slot, null), 300);
    return true;
  } catch (e) { return false; }
}
// GAS のクラウド保存
const Cloud = {
  available() { return !!(window.google && google.script && google.script.run); },
  save() {
    if (!this.available()) return;
    const data = serialize();
    toast('クラウドに保存中…');
    google.script.run.withSuccessHandler(key => {
      if (!key || key.err) { toast('保存できませんでした：' + (key && key.err || ''), 'bad'); return; }
      openModal('クラウド保存', `<div style="text-align:center"><p>別の端末で、タイトルの「クラウドから読みこむ」にこのコードを入力してください。</p><div style="font-size:34px;letter-spacing:6px;font-family:monospace">${key}</div><p class="sub">（30日間保存されます）</p></div>`, { narrow: true });
    }).withFailureHandler(e => toast('保存できませんでした', 'bad')).cloudSave(data);
  },
  load(key, slot, done) {
    if (!this.available()) return;
    google.script.run.withSuccessHandler(data => {
      if (!data || data.err) { toast('見つかりませんでした', 'bad'); return; }
      try { JSON.parse(data); localStorage.setItem(SAVE_KEY + slot, data); done && done(); } catch (e) { toast('データがこわれています', 'bad'); }
    }).withFailureHandler(() => toast('読みこめませんでした', 'bad')).cloudLoad(key);
  }
};
