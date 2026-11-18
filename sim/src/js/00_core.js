// ============================================================
//  そらのみなと ～ドット空港経営記～   core utilities
// ============================================================
const W = 72, H = 48, SEC = 12, SECW = W / SEC, SECH = H / SEC; // 6 x 4 sectors
const MIN_PER_DAY = 1440, DAYS_PER_MONTH = 3, DAYS_PER_YEAR = 36;
const REAL_SEC_PER_GMIN = 0.4;           // 1倍速で 1ゲーム分 = 0.4秒
const VERSION = '1.0';

const $ = (s, el) => (el || document).querySelector(s);
const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = t => t * t * (3 - 2 * t);
const rnd = (a, b) => a + Math.random() * (b - a);
const rndi = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const chance = p => Math.random() < p;
const idx = (x, y) => y * W + x;
const inMap = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
const DIRS4 = [[0, 1], [1, 0], [0, -1], [-1, 0]];
const DIRS8 = [[0, 1], [1, 0], [0, -1], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]];
const TAU = Math.PI * 2;

function hash2(x, y, s) {
  let h = (x * 374761393 + y * 668265263 + (s || 0) * 1442695041) | 0;
  h = (h ^ (h >>> 13)) * 1274126177 | 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function weightedPick(items, wf) {
  let tot = 0; for (const it of items) tot += Math.max(0, wf(it));
  if (tot <= 0) return items[0];
  let r = Math.random() * tot;
  for (const it of items) { r -= Math.max(0, wf(it)); if (r <= 0) return it; }
  return items[items.length - 1];
}
function fmtYen(n) {
  n = Math.round(n);
  const s = Math.abs(n).toLocaleString('ja-JP');
  return (n < 0 ? '-' : '') + '¥' + s;
}
function fmtYenShort(n) {
  n = Math.round(n); const a = Math.abs(n), sg = n < 0 ? '-' : '';
  if (a >= 1e8) return sg + (a / 1e8).toFixed(a >= 1e9 ? 1 : 2).replace(/\.?0+$/, '') + '億円';
  if (a >= 1e4) return sg + Math.round(a / 1e4).toLocaleString('ja-JP') + '万円';
  return sg + a + '円';
}
function fmtNum(n) { return Math.round(n).toLocaleString('ja-JP'); }
function fmtTime(min) {
  min = ((Math.floor(min) % 1440) + 1440) % 1440;
  const h = Math.floor(min / 60), m = min % 60;
  return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
}
function esc(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

// ---- 日付 ----
function dateOf(day) {
  const year = Math.floor(day / DAYS_PER_YEAR) + 1;
  const mi = Math.floor(day / DAYS_PER_MONTH) % 12;      // 0 = 4月
  const month = (mi + 3) % 12 + 1;
  const part = day % DAYS_PER_MONTH;
  const season = month >= 3 && month <= 5 ? 0 : month >= 6 && month <= 8 ? 1 : month >= 9 && month <= 11 ? 2 : 3;
  return { year, month, part, season, partName: ['上旬', '中旬', '下旬'][part], seasonName: ['春', '夏', '秋', '冬'][season] };
}
const SEASON_COLORS = ['#ff9cc2', '#5fd08a', '#f0963c', '#9fd4ff'];

// ---- イベントバス ----
const Bus = {
  h: {},
  on(n, f) { (this.h[n] = this.h[n] || []).push(f); },
  emit(n, a, b, c) { const l = this.h[n]; if (l) for (const f of l) { try { f(a, b, c); } catch (e) { console.error(e); } } }
};

// ---- 最小ヒープ（使わない場面も多いが経路探索用） ----
class Ring {
  constructor(n) { this.a = new Float32Array(n); this.n = n; this.i = 0; this.c = 0; }
  push(v) { this.a[this.i] = v; this.i = (this.i + 1) % this.n; this.c = Math.min(this.c + 1, this.n); }
  avg(def) { if (!this.c) return def; let s = 0; for (let k = 0; k < this.c; k++) s += this.a[k]; return s / this.c; }
}

// ---- ゲーム状態（G）----
let G = null;
const RT = {   // 実行時のみ（保存しない）
  persons: [], planes: [], vehicles: [], effects: [],
  fieldCache: new Map(), planePathCache: new Map(),
  dirtyWalk: true, dirtyAir: true, dirtyBeauty: true,
  beauty: new Float32Array(W * H),
  crowd: new Uint16Array(W * H),
  hover: null, selected: null,
  nightF: 0, dayLight: 1,
  time: 0, paused: false,
  warnings: new Map(),
  todayFlights: [],
  ui: {},
};
