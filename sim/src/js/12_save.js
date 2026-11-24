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
  const W0 = g.mapW || 72, H0 = g.mapH || 48;   // セーブしたときのマップの大きさ
  const oldMap = W0 !== W || H0 !== H;
  // 古いマップの座標 → いまの座標のずれ（72x48 → OX,OY ／ それより後のマップは、まん中にそろえる）
  const DX = W0 === 72 ? OX : (W - W0) / 2, DY = W0 === 72 ? OY : (H - H0) / 2;
  if (oldMap) {
    const old = genTerrain(seed, W0, H0);
    const f0 = unrle(keep.floor, Uint8Array, W0 * H0), t0 = unrle(keep.trees, Uint8Array, W0 * H0);
    const o0 = typeof g.oneway === 'string' ? unrle(g.oneway, Uint8Array, W0 * H0) : null;
    G.floor = new Uint8Array(W * H); G.oneway = new Uint8Array(W * H);
    for (let y = 0; y < H0; y++) for (let x = 0; x < W0; x++) {
      const i0 = y * W0 + x, i = idx(x + DX, y + DY);
      if (old.ter[i0] !== TER.WATER || f0[i0]) { G.ter[i] = old.ter[i0] === TER.WATER ? TER.GRASS : old.ter[i0]; G.trees[i] = t0[i0]; }
      G.floor[i] = f0[i0];
      if (o0) G.oneway[i] = o0[i0];
    }
    const s0 = keep.sectors, SW0 = W0 / SEC, SH0 = H0 / SEC; G.sectors = new Uint8Array(SECW * SECH);
    for (let sy = 0; sy < SH0; sy++) for (let sx = 0; sx < SW0; sx++) if (s0[sy * SW0 + sx]) G.sectors[(sy + DY / SEC) * SECW + sx + DX / SEC] = 1;
    // 北から来る道路を、新しいマップの端までのばす
    for (let x = 0; x < W0; x++) if (f0[x] === FLOOR.ROAD) for (let y = 0; y < DY; y++) { const i = idx(x + DX, y); G.floor[i] = FLOOR.ROAD; G.ter[i] = TER.GRASS; G.trees[i] = 0; for (const dx of [-1, 1]) if (inMap(x + DX + dx, y)) G.trees[idx(x + DX + dx, y)] = 0; }
    if (g.cam) { g.cam.tx += DX; g.cam.tz += DY; }
  } else {
    G.floor = unrle(keep.floor, Uint8Array, W * H);
    G.trees = unrle(keep.trees, Uint8Array, W * H);
    G.sectors = Uint8Array.from(keep.sectors);
    G.oneway = typeof g.oneway === 'string' ? unrle(g.oneway, Uint8Array, W * H) : new Uint8Array(W * H);
  }
  G.occ = new Int32Array(W * H);
  G.blds = {};
  for (const arr of keep.blds) {
    const b = {}; BLD_KEYS.forEach((k, i) => { if (arr[i] != null) b[k] = arr[i]; });
    if (oldMap) { b.x += DX; b.y += DY; }
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
  if (G.landBought == null) { let n = 0; for (const v of G.sectors) n += v; G.landBought = Math.max(0, n - (W0 === 72 ? 4 : 6)); }
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
// ---------- 圧縮（gzip → base64） ----------
async function packSave(str) {
  try {
    if (typeof CompressionStream === 'undefined') return str;
    const cs = new Blob([str]).stream().pipeThrough(new CompressionStream('gzip'));
    const buf = new Uint8Array(await new Response(cs).arrayBuffer());
    let bin = ''; for (let i = 0; i < buf.length; i += 8192) bin += String.fromCharCode.apply(null, buf.subarray(i, i + 8192));
    return 'GZ1:' + btoa(bin);
  } catch (e) { return str; }
}
async function unpackSave(str) {
  if (typeof str !== 'string' || !str.startsWith('GZ1:')) return str;
  const bin = atob(str.slice(4)), buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  const ds = new Blob([buf]).stream().pipeThrough(new DecompressionStream('gzip'));
  return await new Response(ds).text();
}
// ---------- GAS のクラウド保存（5けたのコード。最初に1回だけ発行して、あとはずっと同じコード） ----------
const Cloud = {
  busy: false,
  available() { return !!(window.google && google.script && google.script.run); },
  code() { return G && G.cloud && G.cloud.key || null; },
  async save(silent) {
    if (!this.available() || Game.demo || !G || this.busy) return;
    this.busy = true;
    const first = !this.code();
    let data;
    try { data = await packSave(serialize()); } catch (e) { this.busy = false; return; }
    if (!silent) toast('クラウドに保存中…');
    const c = G.cloud || {};
    google.script.run.withSuccessHandler(res => {
      this.busy = false;
      if (!res || res.err) {
        if (res && /別のセーブ/.test(res.err)) { G.cloud = null; toast('このコードは使えなくなっていたので、新しいコードを発行します', 'bad'); setTimeout(() => this.save(false), 500); return; }
        if (!silent) toast('クラウドに保存できませんでした：' + (res && res.err || ''), 'bad'); return;
      }
      G.cloud = { key: res.key, token: res.token, t: Date.now() };
      saveGame();
      if (first) this.showCode(true);
      else if (!silent) toast(`クラウドに保存しました（コード ${res.key}）`, 'good', 'save');
      else toast(`自動でクラウドに保存しました（コード ${res.key}）`, '', 'save');
    }).withFailureHandler(() => { this.busy = false; if (!silent) toast('クラウドに保存できませんでした', 'bad'); }).cloudSave(data, c.key || '', c.token || '');
  },
  showCode(isNew) {
    const k = this.code(); if (!k) return;
    openModal('セーブコード', `<div style="text-align:center"><p>${isNew ? 'セーブコードを発行しました！' : 'この空港のセーブコード'}</p><div style="font-size:44px;letter-spacing:10px;font-family:monospace;font-weight:900">${k}</div><p class="sub">このコードは<b>ずっと同じ</b>です。5分ごとに自動でクラウドに保存されます。<br>別の端末では、タイトルの「クラウドから読みこむ」にこのコードを入れてください。</p></div>`, { narrow: true });
  },
  load(key, slot, done) {
    if (!this.available()) return;
    key = String(key || '').replace(/[^0-9]/g, '');
    if (key.length !== 5) { toast('5けたの数字を入れてください', 'bad'); return; }
    toast('読みこみ中…');
    google.script.run.withSuccessHandler(async data => {
      if (!data || data.err) { toast('そのコードは見つかりませんでした', 'bad'); return; }
      try { const json = await unpackSave(data); JSON.parse(json); localStorage.setItem(SAVE_KEY + slot, json); done && done(); } catch (e) { toast('データがこわれています', 'bad'); }
    }).withFailureHandler(() => toast('読みこめませんでした', 'bad')).cloudLoad(key);
  }
};
