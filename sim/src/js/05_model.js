// ============================================================
//  モデル作成（箱を組み合わせてボクセル風の3Dモデル）
// ============================================================
const _m4 = new THREE.Matrix4(), _n3 = new THREE.Matrix3(), _tv = new THREE.Vector3(), _tn = new THREE.Vector3();
class ModelBuilder {
  constructor() {
    this.L = { p: [], n: [], c: [] };        // ふつう
    this.G = { p: [], n: [], c: [], c2: [] }; // 光る（夜）
    this.I = { p: [], n: [], uv: [] };       // アイコン
    this.mat = null;
  }
  setMat(m) { this.mat = m; if (m) _n3.getNormalMatrix(m); }
  _push(T, p, n, col, col2) {
    if (this.mat) { _tv.set(p[0], p[1], p[2]).applyMatrix4(this.mat); _tn.set(n[0], n[1], n[2]).applyMatrix3(_n3).normalize(); T.p.push(_tv.x, _tv.y, _tv.z); T.n.push(_tn.x, _tn.y, _tn.z); }
    else { T.p.push(p[0], p[1], p[2]); T.n.push(n[0], n[1], n[2]); }
    if (col) T.c.push(col.r, col.g, col.b);
    if (col2) T.c2.push(col2.r, col2.g, col2.b);
  }
  _quad(T, a, b, c, d, n, col, col2) {
    this._push(T, a, n, col, col2); this._push(T, b, n, col, col2); this._push(T, c, n, col, col2);
    this._push(T, a, n, col, col2); this._push(T, c, n, col, col2); this._push(T, d, n, col, col2);
  }
  // 中心(x,z)・下端y・幅w(x)・高さh・奥行d(z)
  box(x, y, z, w, h, d, color, opt) {
    opt = opt || {};
    const glow = opt.glow, T = glow ? this.G : this.L;
    const col = _col(glow ? glow : color), colDay = glow ? _col(color) : null;
    const sideCol = opt.side ? _col(opt.side) : col, sideDay = glow && opt.side ? _col(opt.side) : colDay;
    const x0 = x - w / 2, x1 = x + w / 2, y0 = y, y1 = y + h, z0 = z - d / 2, z1 = z + d / 2;
    const sk = opt.skip || '';
    if (!sk.includes('t')) this._quad(T, [x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], [0, 1, 0], col, colDay);
    if (!sk.includes('b') && opt.bottom) this._quad(T, [x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [0, -1, 0], sideCol, sideDay);
    if (!sk.includes('f')) this._quad(T, [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [0, 0, 1], sideCol, sideDay);
    if (!sk.includes('k')) this._quad(T, [x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [0, 0, -1], sideCol, sideDay);
    if (!sk.includes('r')) this._quad(T, [x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [1, 0, 0], sideCol, sideDay);
    if (!sk.includes('l')) this._quad(T, [x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [-1, 0, 0], sideCol, sideDay);
    return this;
  }
  // 円柱（多角形）
  cyl(x, y, z, rt, rb, h, color, seg, opt) {
    opt = opt || {}; seg = seg || 8;
    const glow = opt.glow, T = glow ? this.G : this.L, col = _col(glow || color), cd = glow ? _col(color) : null;
    const a0 = opt.a0 || Math.PI / seg;
    for (let i = 0; i < seg; i++) {
      const a = a0 + i / seg * TAU, b = a0 + (i + 1) / seg * TAU;
      const p1 = [x + Math.cos(a) * rb, y, z + Math.sin(a) * rb], p2 = [x + Math.cos(b) * rb, y, z + Math.sin(b) * rb];
      const p3 = [x + Math.cos(b) * rt, y + h, z + Math.sin(b) * rt], p4 = [x + Math.cos(a) * rt, y + h, z + Math.sin(a) * rt];
      const m = (a + b) / 2, n = [Math.cos(m), (rb - rt) / Math.max(h, 0.01) * 0.5, Math.sin(m)];
      this._quad(T, p2, p1, p4, p3, n, col, cd);
      if (rt > 0.001) { this._push(T, [x, y + h, z], [0, 1, 0], col, cd); this._push(T, p3, [0, 1, 0], col, cd); this._push(T, p4, [0, 1, 0], col, cd); }
    }
    return this;
  }
  // 横向き円柱（z方向）
  cylZ(x, y, z, r, len, color, seg, opt) {
    const save = this.mat;
    const m = new THREE.Matrix4().makeTranslation(x, y, z).multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2)).multiply(new THREE.Matrix4().makeTranslation(0, -len / 2, 0));
    this.setMat(save ? save.clone().multiply(m) : m);
    this.cyl(0, 0, 0, r, r, len, color, seg || 6, opt);
    this.setMat(save);
    return this;
  }
  // 三角屋根（x方向に伸びる）
  gable(x, y, z, w, h, d, color, opt) {
    const col = _col(color), T = this.L;
    const x0 = x - w / 2, x1 = x + w / 2, z0 = z - d / 2, z1 = z + d / 2, yt = y + h;
    const nf = [0, d / 2, h], nk = [0, d / 2, -h];
    this._quad(T, [x0, y, z1], [x1, y, z1], [x1, yt, z], [x0, yt, z], norm(nf), col);
    this._quad(T, [x1, y, z0], [x0, y, z0], [x0, yt, z], [x1, yt, z], norm(nk), col);
    const ec = _col(opt && opt.end || color);
    this._push(T, [x1, y, z1], [1, 0, 0], ec); this._push(T, [x1, y, z0], [1, 0, 0], ec); this._push(T, [x1, yt, z], [1, 0, 0], ec);
    this._push(T, [x0, y, z0], [-1, 0, 0], ec); this._push(T, [x0, y, z1], [-1, 0, 0], ec); this._push(T, [x0, yt, z], [-1, 0, 0], ec);
    return this;
  }
  // アイコン看板（face: 0=+z 1=+x 2=-z 3=-x, up: 上向き）
  icon(name, x, y, z, s, face, up) {
    const i = ICON_INDEX[name] != null ? ICON_INDEX[name] : 0;
    const u0 = (i % 16) * 16 / 256 + 1 / 256, v1 = 1 - Math.floor(i / 16) * 16 / 256 - 1 / 256, u1 = u0 + 14 / 256, v0 = v1 - 14 / 256;
    const h = s / 2, T = this.I;
    let A, Bp, Cp, Dp, n;
    if (up) { A = [x - h, y, z + h]; Bp = [x + h, y, z + h]; Cp = [x + h, y, z - h]; Dp = [x - h, y, z - h]; n = [0, 1, 0]; }
    else if (face === 0) { A = [x - h, y - h, z]; Bp = [x + h, y - h, z]; Cp = [x + h, y + h, z]; Dp = [x - h, y + h, z]; n = [0, 0, 1]; }
    else if (face === 1) { A = [x, y - h, z + h]; Bp = [x, y - h, z - h]; Cp = [x, y + h, z - h]; Dp = [x, y + h, z + h]; n = [1, 0, 0]; }
    else if (face === 2) { A = [x + h, y - h, z]; Bp = [x - h, y - h, z]; Cp = [x - h, y + h, z]; Dp = [x + h, y + h, z]; n = [0, 0, -1]; }
    else { A = [x, y - h, z - h]; Bp = [x, y - h, z + h]; Cp = [x, y + h, z + h]; Dp = [x, y + h, z - h]; n = [-1, 0, 0]; }
    const uvs = [[u0, v0], [u1, v0], [u1, v1], [u0, v1]];
    const pts = [A, Bp, Cp, Dp];
    for (const k of [0, 1, 2, 0, 2, 3]) { this._push(T, pts[k], n); T.uv.push(uvs[k][0], uvs[k][1]); }
    return this;
  }
  build(opt) {
    opt = opt || {};
    const g = new THREE.Group();
    const mk = (T, mat, uv) => {
      if (!T.p.length) return null;
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(T.p, 3));
      geo.setAttribute('normal', new THREE.Float32BufferAttribute(T.n, 3));
      if (T.c && T.c.length) geo.setAttribute('color', new THREE.Float32BufferAttribute(T.c, 3));
      if (T.c2 && T.c2.length) geo.setAttribute('color2', new THREE.Float32BufferAttribute(T.c2, 3));
      if (uv) geo.setAttribute('uv', new THREE.Float32BufferAttribute(T.uv, 2));
      geo.computeBoundingSphere();
      const m = new THREE.Mesh(geo, mat);
      m.castShadow = opt.shadow !== false; m.receiveShadow = true;
      g.add(m); return m;
    };
    mk(this.L, opt.mat || R.matLambert);
    const gm = mk(this.G, opt.glowMat || GlowMat());
    if (gm) { gm.castShadow = false; gm.userData.glow = true; }
    const im = mk(this.I, R.matIcon, true);
    if (im) im.castShadow = false;
    return g;
  }
  geos() {
    const out = {};
    const mk = (T, uv) => {
      if (!T.p.length) return null;
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(T.p, 3));
      geo.setAttribute('normal', new THREE.Float32BufferAttribute(T.n, 3));
      if (T.c && T.c.length) geo.setAttribute('color', new THREE.Float32BufferAttribute(T.c, 3));
      if (T.c2 && T.c2.length) geo.setAttribute('color2', new THREE.Float32BufferAttribute(T.c2, 3));
      if (uv) geo.setAttribute('uv', new THREE.Float32BufferAttribute(T.uv, 2));
      return geo;
    };
    out.L = mk(this.L); out.G = mk(this.G); out.I = mk(this.I, true);
    return out;
  }
}
function norm(v) { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; }
const _colCache = new Map();
function _col(c) {
  if (c && c.isColor) return c;
  let v = _colCache.get(c);
  if (!v) { v = new THREE.Color(c); _colCache.set(c, v); }
  return v;
}
// 昼の色(color2) と 夜の光る色(color) を混ぜるマテリアル
let _glowMat = null;
function GlowMat() {
  if (_glowMat) return _glowMat;
  _glowMat = new THREE.ShaderMaterial({
    uniforms: { night: { value: 0 } },
    vertexShader: 'attribute vec3 color; attribute vec3 color2; varying vec3 vC; uniform float night; void main(){ vC = mix(color2, color * 1.25, night); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
    fragmentShader: 'varying vec3 vC;\nvoid main(){ gl_FragColor = vec4(vC, 1.);\n#include <colorspace_fragment>\n}',
  });
  return _glowMat;
}

// ============================================================
//  建物モデル
// ============================================================
const MODELS = {};
const WOOD = '#a0683c', WOOD2 = '#7a4c2c', WHITE = '#f4f2ee', GRAY = '#9a9aa6', DGRAY = '#5a5a66', GLASS = '#8fc8e8', GLASSN = '#ffe8a0';

// 店のブース（屋根なし・中が見える）
function booth(mb, w, d, o) {
  const hw = w / 2, hd = d / 2, wh = o.wallH || 1.15;
  mb.box(0, 0, 0, w - 0.04, 0.05, d - 0.04, o.floor || '#e8dcc8');
  mb.box(0, 0, -hd + 0.07, w - 0.04, wh, 0.12, o.wall || WHITE);          // 奥の壁
  mb.box(-hd > 0 ? 0 : -hw + 0.07, 0, 0, 0.12, wh * 0.85, d - 0.04, o.wall2 || o.wall || WHITE);
  mb.box(hw - 0.07, 0, 0, 0.12, wh * 0.85, d - 0.04, o.wall2 || o.wall || WHITE);
  // 前のカウンター（真ん中は入口）
  const cw = (w - 0.9) / 2;
  if (!o.noCounter) {
    mb.box(-hw + cw / 2 + 0.02, 0, hd - 0.12, cw, 0.5, 0.2, o.counter || WOOD);
    mb.box(hw - cw / 2 - 0.02, 0, hd - 0.12, cw, 0.5, 0.2, o.counter || WOOD);
  }
  // ひさし（ストライプ）
  if (o.awn) {
    const n = Math.round(w / 0.25);
    for (let i = 0; i < n; i++) {
      const x = -hw + (i + 0.5) * (w / n);
      mb.box(x, wh - 0.05, hd - 0.02, w / n, 0.16, 0.3, (o.stripe && i % 2) ? '#ffffff' : o.awn);
    }
  }
  // 看板
  const sw = Math.min(w * 0.7, 1.6);
  mb.box(0, wh, -hd + 0.07, sw, 0.55, 0.14, o.sign || o.awn || '#2a2a36');
  mb.box(0, wh + 0.07, -hd + 0.15, sw - 0.12, 0.41, 0.02, o.signIn || '#fff8e8', { glow: o.signGlow || '#fff0c0' });
  if (o.icon) mb.icon(o.icon, 0, wh + 0.28, -hd + 0.17, 0.4, 0);
  return { hw, hd, wh };
}
function tables(mb, w, d, n, tc, cc, z0) {
  const hw = w / 2, hd = d / 2;
  const cols = Math.max(1, Math.floor((w - 0.5) / 0.8)), rows = Math.max(1, Math.floor((d - 0.8) / 0.8));
  let k = 0;
  for (let r = 0; r < rows && k < n; r++) for (let c = 0; c < cols && k < n; c++, k++) {
    const x = -hw + 0.55 + c * ((w - 1.1) / Math.max(1, cols - 1 || 1)) * (cols > 1 ? 1 : 0) + (cols === 1 ? hw - 0.55 : 0);
    const z = (z0 != null ? z0 : -hd + 0.6) + r * 0.75;
    mb.box(x, 0, z, 0.36, 0.32, 0.36, tc || WHITE);
    mb.box(x - 0.3, 0, z, 0.14, 0.2, 0.18, cc || '#e5484d'); mb.box(x + 0.3, 0, z, 0.14, 0.2, 0.18, cc || '#e5484d');
  }
}
function shelves(mb, w, d, colors, h) {
  const hw = w / 2, hd = d / 2; h = h || 0.7;
  const n = Math.max(1, Math.floor((w - 0.4) / 0.6));
  for (let i = 0; i < n; i++) {
    const x = -hw + 0.4 + i * ((w - 0.8) / Math.max(1, n - 1));
    mb.box(x, 0, -0.05, 0.3, h, d * 0.45, '#d8d0c0');
    for (let k = 0; k < 3; k++) mb.box(x, 0.18 + k * 0.2, -0.05, 0.34, 0.1, d * 0.42, colors[(i + k) % colors.length]);
  }
  // 奥の棚
  for (let i = 0; i < Math.floor(w / 0.5); i++) mb.box(-hw + 0.35 + i * 0.5, 0.3, -hd + 0.22, 0.4, 0.3, 0.14, colors[i % colors.length]);
}

function shopModel(id, o) {
  MODELS[id] = (mb, w, d) => {
    const b = booth(mb, w, d, o);
    if (o.props) o.props(mb, w, d, b);
  };
}
// ---- 飲食 ----
shopModel('conbini', { wall: '#ffffff', awn: '#3fa060', stripe: true, sign: '#3fa060', icon: 'store', counter: '#d8d8d8', props: (mb, w, d) => { shelves(mb, w, d, ['#e5484d', '#ffd84a', '#4a8fe0', '#ffffff']); mb.box(w / 2 - 0.3, 0, -0.2, 0.3, 0.9, 0.9, '#d8eef8', { glow: '#c8f0ff' }); } });
shopModel('cafe', { wall: '#7a4c2c', wall2: '#a0683c', floor: '#c8a070', awn: '#2e7d4a', stripe: true, sign: '#2e7d4a', icon: 'cafe', props: (mb, w, d) => { tables(mb, w, d, 3, '#f4e8d0', '#2e7d4a', -0.15); mb.box(-w / 2 + 0.4, 0, -d / 2 + 0.35, 0.5, 0.7, 0.3, '#3a3a40'); mb.box(-w / 2 + 0.4, 0.7, -d / 2 + 0.35, 0.2, 0.15, 0.2, '#c0c0c8'); } });
shopModel('ramen', { wall: '#a02838', wall2: '#7a2030', floor: '#d8c4a0', awn: '#e5484d', sign: '#2a1e1a', signIn: '#ffd84a', signGlow: '#ffd84a', icon: 'ramen', props: (mb, w, d) => {
  mb.box(0, 0, -0.1, w - 0.5, 0.55, 0.4, WOOD); for (let i = 0; i < 4; i++) mb.cyl(-w / 2 + 0.5 + i * (w - 1) / 3, 0, 0.35, 0.1, 0.1, 0.3, '#e5484d', 6);
  mb.box(0, 0.55, -0.55, 0.5, 0.25, 0.3, '#c0c0c8'); for (let i = 0; i < 3; i++) mb.box(-0.6 + i * 0.6, 0.95, d / 2 - 0.05, 0.5, 0.4, 0.04, i % 2 ? '#ffffff' : '#e5484d'); } });
shopModel('soba', { wall: '#a0683c', floor: '#c8b090', awn: '#2f4f9a', sign: '#2f4f9a', icon: 'soba', noCounter: true, props: (mb, w, d) => { mb.box(0, 0, 0.05, w - 0.3, 0.62, 0.3, WOOD2); mb.box(0, 0.62, 0.05, w - 0.25, 0.04, 0.34, '#d8c4a0'); mb.box(0.5, 0.62, -0.25, 0.4, 0.3, 0.2, '#c0c0c8'); } });
shopModel('bakery', { wall: '#fff1c8', awn: '#f39a3c', stripe: true, sign: '#a0683c', icon: 'bread', props: (mb, w, d) => { for (let i = 0; i < 3; i++) { mb.box(-0.6 + i * 0.6, 0, -0.1, 0.45, 0.45, 0.7, '#e8d8b8'); for (let k = 0; k < 3; k++) mb.box(-0.6 + i * 0.6, 0.45, -0.3 + k * 0.22, 0.15, 0.08, 0.12, ['#d8a050', '#c08040', '#f0c070'][k]); } } });
shopModel('bento', { wall: '#ffffff', awn: '#e5484d', stripe: true, sign: '#e5484d', icon: 'bento', noCounter: true, props: (mb, w, d) => { mb.box(0, 0, 0.05, w - 0.3, 0.55, 0.45, '#d8d8d8'); mb.box(0, 0.55, 0.05, w - 0.35, 0.25, 0.4, '#bfe8ff', { glow: '#e0f8ff' }); for (let i = 0; i < 5; i++) mb.box(-0.7 + i * 0.35, 0.55, 0.05, 0.22, 0.08, 0.2, ['#e5484d', '#ffd84a', '#4cb85c', '#f39a3c', '#a0683c'][i]); } });
shopModel('burger', { wall: '#e5484d', wall2: '#ffd84a', floor: '#f4e8d0', awn: '#ffd84a', stripe: false, sign: '#e5484d', icon: 'burger', props: (mb, w, d) => { tables(mb, w, d, 4, '#ffffff', '#ffd84a', -0.2); } });
shopModel('curry', { wall: '#f39a3c', wall2: '#e08030', floor: '#f0dcb0', awn: '#a0683c', sign: '#7a3a10', icon: 'curry', props: (mb, w, d) => { tables(mb, w, d, 3, '#fff1c8', '#a0683c', -0.1); } });
shopModel('sushi', { wall: '#d8b888', wall2: '#a0683c', floor: '#e8d8b8', awn: '#2f4f9a', sign: '#2f4f9a', icon: 'sushi', props: (mb, w, d) => {
  mb.box(0, 0, -0.1, w - 1, 0.45, 0.6, '#c0c0c8'); mb.box(0, 0, -0.1, w - 1.5, 0.5, 0.25, WOOD);
  for (let i = 0; i < 9; i++) mb.box(-w / 2 + 0.6 + i * (w - 1.2) / 8, 0.45, (i % 2 ? 0.14 : -0.34), 0.14, 0.05, 0.14, ['#e5484d', '#ffd84a', '#ffffff', '#4a8fe0'][i % 4]);
  for (let i = 0; i < 5; i++) mb.cyl(-w / 2 + 0.6 + i * (w - 1.2) / 4, 0, 0.5, 0.1, 0.1, 0.3, '#2f4f9a', 6); } });
shopModel('sweets', { wall: '#ffd0e0', wall2: '#ffffff', floor: '#fff0f4', awn: '#f59ac0', stripe: true, sign: '#f59ac0', icon: 'cake', props: (mb, w, d) => { mb.box(0, 0, -0.2, w - 0.6, 0.5, 0.5, '#ffffff'); mb.box(0, 0.5, -0.2, w - 0.65, 0.25, 0.45, '#fff0f8', { glow: '#fff8ff' }); for (let i = 0; i < 4; i++) mb.cyl(-0.6 + i * 0.4, 0.5, -0.2, 0.08, 0.1, 0.12, ['#f59ac0', '#ffffff', '#a0683c', '#ffd84a'][i], 6); } });
shopModel('chinese', { wall: '#c02838', wall2: '#a02030', floor: '#f0e0c0', awn: '#d8a020', sign: '#c02838', signIn: '#ffd84a', icon: 'dumpling', props: (mb, w, d) => { for (let i = 0; i < 2; i++) { const x = -0.7 + i * 1.4; mb.cyl(x, 0, -0.1, 0.35, 0.35, 0.34, '#f4f2ee', 8); for (let k = 0; k < 4; k++) mb.box(x + Math.cos(k * 1.57) * 0.5, 0, -0.1 + Math.sin(k * 1.57) * 0.5, 0.14, 0.22, 0.14, '#c02838'); } mb.cyl(0, 1.0, d / 2 - 0.1, 0.12, 0.12, 0.22, '#e5484d', 6, { glow: '#ff6060' }); } });
shopModel('izakaya', { wall: '#5a3a24', wall2: '#7a4c2c', floor: '#c8a878', awn: '#2a1e1a', sign: '#2a1e1a', signIn: '#ffffff', icon: 'beer', props: (mb, w, d) => { mb.box(0, 0, -0.35, w - 0.5, 0.6, 0.3, WOOD); for (let i = 0; i < 5; i++) mb.cyl(-w / 2 + 0.5 + i * (w - 1) / 4, 0, 0.05, 0.09, 0.09, 0.3, '#2a1e1a', 6); for (const x of [-w / 2 + 0.25, w / 2 - 0.25]) { mb.cyl(x, 0.8, d / 2 - 0.1, 0.13, 0.13, 0.3, '#e5484d', 6, { glow: '#ff5040' }); } } });
shopModel('restaurant', { wall: '#ffffff', wall2: '#e8e0d0', floor: '#d8c8a8', awn: '#2a5a3a', sign: '#2a5a3a', icon: 'fork', props: (mb, w, d) => { tables(mb, w, d, 4, '#ffffff', '#7a4c2c', -0.2); mb.box(w / 2 - 0.3, 0, -d / 2 + 0.35, 0.25, 0.25, 0.25, '#a0683c'); mb.box(w / 2 - 0.3, 0.25, -d / 2 + 0.35, 0.3, 0.4, 0.3, '#3e8a3c'); } });
shopModel('steak', { wall: '#4a2a1a', wall2: '#6a3a22', floor: '#a07850', awn: '#a02838', sign: '#2a1e1a', signIn: '#ffd84a', icon: 'steak', props: (mb, w, d) => { tables(mb, w, d, 3, '#e8d8c0', '#a02838', -0.05); mb.box(-w / 2 + 0.5, 0, -d / 2 + 0.4, 0.7, 0.5, 0.35, '#3a3a40'); mb.box(-w / 2 + 0.5, 0.5, -d / 2 + 0.4, 0.6, 0.05, 0.3, '#ff8040', { glow: '#ff6020' }); } });
MODELS.foodcourt = (mb, w, d) => {
  mb.box(0, 0, 0, w - 0.04, 0.05, d - 0.04, '#e8e0d0');
  const cols = ['#e5484d', '#ffd84a', '#4cb85c', '#4a8fe0'], ic = ['ramen', 'burger', 'curry', 'dumpling'];
  for (let i = 0; i < 4; i++) {
    const x = -w / 2 + 0.5 + i * (w - 1) / 3;
    mb.box(x, 0, -d / 2 + 0.4, 0.9, 1.1, 0.6, cols[i]); mb.box(x, 0, -d / 2 + 0.85, 0.9, 0.5, 0.3, WHITE);
    mb.box(x, 1.1, -d / 2 + 0.3, 0.8, 0.4, 0.1, '#2a2a36'); mb.icon(ic[i], x, 1.3, -d / 2 + 0.36, 0.36, 0);
  }
  for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) { const x = -w / 2 + 0.6 + c * (w - 1.2) / 3, z = 0.1 + r * 0.8; mb.box(x, 0, z, 0.4, 0.3, 0.4, WHITE); mb.box(x - 0.3, 0, z, 0.12, 0.2, 0.2, cols[(r + c) % 4]); mb.box(x + 0.3, 0, z, 0.12, 0.2, 0.2, cols[(r + c + 1) % 4]); }
};
MODELS.kaiseki = (mb, w, d) => {
  const b = booth(mb, w, d, { wall: '#c8a878', wall2: '#a07850', floor: '#b8c890', awn: '#2a1e1a', sign: '#2a1e1a', signIn: '#ffd84a', icon: 'sushi', counter: '#7a4c2c' });
  for (let i = 0; i < 2; i++) { mb.box(-0.6 + i * 1.2, 0, -0.3, 0.7, 0.22, 0.5, '#7a4c2c'); mb.box(-0.6 + i * 1.2, 0, 0.15, 0.6, 0.06, 0.25, '#e5484d'); }
  mb.box(w / 2 - 0.35, 0, -d / 2 + 0.4, 0.3, 0.2, 0.3, '#5a5a66'); mb.box(w / 2 - 0.35, 0.2, -d / 2 + 0.4, 0.45, 0.35, 0.35, '#2e7d4a');
  mb.box(0, 1.2, -d / 2 + 0.07, w * 0.8, 0.05, 0.16, '#d8a020');
};
// ---- ショップ ----
const SHOPC = {
  souvenir: ['#fff1c8', '#e5484d', 'gift', ['#e5484d', '#ffd84a', '#4a8fe0', '#f59ac0']],
  book: ['#a0683c', '#2f4f9a', 'book', ['#e5484d', '#4a8fe0', '#4cb85c', '#ffd84a', '#ffffff']],
  wagashi: ['#e8d8b8', '#4a7a3a', 'dango', ['#f59ac0', '#ffffff', '#4cb85c', '#a0683c']],
  goods: ['#e8f0ff', '#3a7bd5', 'plane2', ['#ffffff', '#4a8fe0', '#e5484d', '#ffd84a']],
  zakka: ['#fff8e0', '#9a62d0', 'star', ['#ffd84a', '#3fc9b8', '#f59ac0', '#ffffff']],
  flower: ['#ffffff', '#4cb85c', 'flower', ['#f59ac0', '#ffd84a', '#e5484d', '#ffffff']],
  pharmacy: ['#ffffff', '#3a9ad8', 'pill', ['#ffffff', '#e5484d', '#4a8fe0', '#ffd84a']],
  toy: ['#fff0a0', '#e5484d', 'bear', ['#e5484d', '#4a8fe0', '#ffd84a', '#4cb85c']],
  apparel: ['#f4f2ee', '#4a4a58', 'shirt', ['#4a8fe0', '#e5484d', '#ffffff', '#2a2a36']],
  electronics: ['#e8e8f0', '#3a3a48', 'tv', ['#2a2a36', '#c0c0c8', '#4a4a58', '#ffffff']],
  dutyfree: ['#f8f0e0', '#9a62d0', 'perfume', ['#c9a0ff', '#f59ac0', '#ffd84a', '#ffffff']],
  brand: ['#2a2a30', '#d8a020', 'handbag', ['#d8a020', '#a02838', '#f4f2ee', '#2a2a30']],
};
for (const [id, [wall, awn, icon, cols]] of Object.entries(SHOPC)) {
  shopModel(id, { wall, awn, stripe: id !== 'brand' && id !== 'electronics', sign: awn, icon, floor: id === 'brand' ? '#3a3a44' : id === 'dutyfree' ? '#f0e8f8' : '#efe6d6', counter: id === 'brand' ? '#d8a020' : WOOD, signGlow: id === 'brand' ? '#ffe080' : undefined, props: (mb, w, d) => {
    if (id === 'flower') { for (let i = 0; i < 5; i++) { mb.box(-0.8 + i * 0.4, 0, -0.1, 0.26, 0.2, 0.26, WOOD); mb.box(-0.8 + i * 0.4, 0.2, -0.1, 0.24, 0.18, 0.24, cols[i % 4]); } return; }
    if (id === 'electronics') { shelves(mb, w, d, cols); for (let i = 0; i < 3; i++) mb.box(-0.8 + i * 0.8, 0.5, -d / 2 + 0.2, 0.6, 0.4, 0.05, '#3a5a8a', { glow: '#80d0ff' }); return; }
    if (id === 'dutyfree' || id === 'brand') { for (let i = 0; i < 3; i++) { mb.box(-0.9 + i * 0.9, 0, -0.1, 0.5, 0.55, 0.5, cols[3]); mb.box(-0.9 + i * 0.9, 0.55, -0.1, 0.45, 0.2, 0.45, '#f0f8ff', { glow: '#ffffff' }); mb.box(-0.9 + i * 0.9, 0.55, -0.1, 0.12, 0.15, 0.12, cols[i]); } shelves(mb, w, 0.5, cols, 0.9); return; }
    shelves(mb, w, d, cols);
  } });
}
// ---- サービス ----
MODELS.lounge = (mb, w, d) => {
  mb.box(0, 0, 0, w - 0.04, 0.05, d - 0.04, '#6a4a8a');
  mb.box(0, 0, -d / 2 + 0.07, w - 0.04, 1.4, 0.12, '#3a2a4a');
  mb.box(-w / 2 + 0.07, 0, 0, 0.12, 1.4, d - 0.04, '#3a2a4a'); mb.box(w / 2 - 0.07, 0, 0, 0.12, 1.4, d - 0.04, '#3a2a4a');
  mb.box(-w / 4 - 0.25, 0, d / 2 - 0.07, w / 2 - 0.5, 1.4, 0.1, '#bfe0f0', { glow: '#ffe8b0' }); mb.box(w / 4 + 0.25, 0, d / 2 - 0.07, w / 2 - 0.5, 1.4, 0.1, '#bfe0f0', { glow: '#ffe8b0' });
  for (let i = 0; i < 3; i++) { const x = -1 + i; mb.box(x, 0, -0.2, 0.6, 0.25, 0.3, '#c9a0ff'); mb.box(x, 0.25, -0.33, 0.6, 0.25, 0.08, '#9a62d0'); mb.box(x, 0, 0.5, 0.3, 0.25, 0.3, '#d8a020'); }
  mb.box(0, 0, -d / 2 + 0.4, 1.4, 0.55, 0.3, WOOD2); mb.box(0, 1.4, -d / 2 + 0.07, 1.4, 0.4, 0.14, '#d8a020'); mb.icon('sofa', 0, 1.6, -d / 2 + 0.15, 0.36, 0);
  mb.box(w / 2 - 0.4, 0, d / 2 - 0.4, 0.3, 0.3, 0.3, WOOD); mb.box(w / 2 - 0.4, 0.3, d / 2 - 0.4, 0.4, 0.5, 0.4, '#3e8a3c');
};
MODELS.footbath = (mb, w, d) => {
  mb.box(0, 0, 0, w - 0.04, 0.18, d - 0.04, '#a07850');
  mb.box(0, 0.06, 0.05, w - 0.5, 0.14, d - 0.6, '#5cc8e0', { glow: '#90e8ff' });
  mb.box(0, 0, -d / 2 + 0.15, w - 0.1, 0.35, 0.2, WOOD2);
  for (let i = 0; i < 4; i++) mb.box(-0.6 + i * 0.4, 0.15, 0.1, 0.04, 0.4 + (i % 2) * 0.2, 0.04, '#ffffff');
  mb.box(0, 0.35, -d / 2 + 0.1, 1.2, 0.5, 0.1, '#2a1e1a'); mb.icon('onsen', 0, 0.6, -d / 2 + 0.16, 0.36, 0);
};
MODELS.game = (mb, w, d) => {
  booth(mb, w, d, { wall: '#2a2040', wall2: '#3a2a5a', floor: '#3a3060', awn: '#ff4080', sign: '#2a2040', signIn: '#ff80c0', signGlow: '#ff60c0', icon: 'game', noCounter: true });
  for (let i = 0; i < 3; i++) { const x = -0.6 + i * 0.6; mb.box(x, 0, -0.3, 0.42, 1.0, 0.42, ['#e5484d', '#4a8fe0', '#ffd84a'][i]); mb.box(x, 0.55, -0.08, 0.34, 0.3, 0.02, '#2a2a40', { glow: ['#ff80a0', '#80c0ff', '#ffe080'][i] }); }
  mb.box(0.5, 0, 0.5, 0.5, 0.7, 0.5, '#f59ac0'); mb.box(0.5, 0.7, 0.5, 0.45, 0.3, 0.45, '#ffffff', { glow: '#ffe0f0' });
};
MODELS.massage = (mb, w, d) => { booth(mb, w, d, { wall: '#e8e0d0', floor: '#d8c8b0', awn: '#3fc9b8', sign: '#3fc9b8', icon: 'sofa' }); for (let i = 0; i < 2; i++) { mb.box(-0.4 + i * 0.8, 0, -0.1, 0.4, 0.35, 0.7, '#3a3a48'); mb.box(-0.4 + i * 0.8, 0.35, -0.4, 0.4, 0.4, 0.12, '#3a3a48'); } };
MODELS.gallery = (mb, w, d) => {
  booth(mb, w, d, { wall: '#ffffff', floor: '#c8b898', awn: '#4a4a58', sign: '#2a2a36', icon: 'picture', noCounter: true });
  const cs = ['#8fdcf4', '#f39a3c', '#4cb85c', '#f59ac0', '#ffd84a'];
  for (let i = 0; i < 4; i++) { mb.box(-w / 2 + 0.6 + i * (w - 1.2) / 3, 0.45, -d / 2 + 0.15, 0.5, 0.4, 0.04, '#d8a020'); mb.box(-w / 2 + 0.6 + i * (w - 1.2) / 3, 0.5, -d / 2 + 0.17, 0.4, 0.3, 0.02, cs[i]); }
  for (let i = 0; i < 2; i++) { mb.box(-w / 2 + 0.15, 0.45, -0.3 + i * 0.6, 0.04, 0.4, 0.45, '#d8a020'); mb.box(w / 2 - 0.15, 0.45, -0.3 + i * 0.6, 0.04, 0.4, 0.45, '#d8a020'); }
  mb.box(0, 0, 0.1, 0.3, 0.5, 0.3, '#f4f2ee'); mb.box(0, 0.5, 0.1, 0.4, 0.1, 0.2, '#ffffff');
};
MODELS.aquarium = (mb, w, d) => {
  mb.box(0, 0, 0, w - 0.04, 0.05, d - 0.04, '#2a3a5a');
  mb.box(0, 0, -0.15, w - 0.3, 0.25, d - 0.8, '#3a4a6a');
  mb.box(0, 0.25, -0.15, w - 0.35, 1.35, d - 0.85, '#3a8ad0', { glow: '#60c8ff' });
  const fc = ['#f39a3c', '#ffd84a', '#ff7090', '#ffffff'];
  for (let i = 0; i < 8; i++) mb.box(-w / 2 + 0.5 + (i * 0.37) % (w - 1), 0.5 + (i % 3) * 0.35, -0.15 + (i % 2 ? 0.42 : -0.42), 0.16, 0.08, 0.04, fc[i % 4], { glow: fc[i % 4] });
  mb.box(0, 0.25, -0.15, 0.2, 0.5, 0.2, '#4cb85c'); mb.box(0.8, 0.25, -0.1, 0.12, 0.7, 0.12, '#3e8a3c');
  mb.box(0, 1.6, -0.15, w - 0.3, 0.12, d - 0.8, '#3a4a6a');
};
MODELS.capsule = (mb, w, d) => {
  booth(mb, w, d, { wall: '#d8d8e0', floor: '#c8c8d0', awn: '#4a4a58', sign: '#2a2a36', icon: 'bed', noCounter: true });
  for (let r = 0; r < 2; r++) for (let i = 0; i < 4; i++) { mb.box(-w / 2 + 0.5 + i * 0.65, r * 0.45, -d / 2 + 0.45, 0.6, 0.42, 0.6, '#f4f2ee'); mb.box(-w / 2 + 0.5 + i * 0.65, r * 0.45 + 0.08, -d / 2 + 0.76, 0.36, 0.26, 0.02, '#3a3a48', { glow: '#ffe8a0' }); }
};
MODELS.cinema = (mb, w, d) => {
  mb.box(0, 0, 0, w - 0.04, 0.05, d - 0.04, '#3a1a2a');
  mb.box(0, 0, -d / 2 + 0.07, w - 0.04, 1.4, 0.12, '#2a1a22'); mb.box(-w / 2 + 0.07, 0, 0, 0.12, 1.4, d - 0.04, '#5a2030'); mb.box(w / 2 - 0.07, 0, 0, 0.12, 1.4, d - 0.04, '#5a2030');
  mb.box(0, 0.35, -d / 2 + 0.15, w - 0.6, 0.9, 0.03, '#d8e8f8', { glow: '#ffffff' });
  for (let r = 0; r < 3; r++) for (let i = 0; i < 5; i++) mb.box(-1 + i * 0.5, r * 0.08, -0.2 + r * 0.5, 0.36, 0.3, 0.3, '#c02838');
  mb.box(0, 1.4, d / 2 - 0.1, w * 0.6, 0.5, 0.12, '#2a1a22'); mb.icon('film', 0, 1.65, d / 2 - 0.03, 0.36, 0);
};
MODELS.planetarium = (mb, w, d) => {
  mb.box(0, 0, 0, w - 0.04, 0.05, d - 0.04, '#2a2a40');
  for (let k = 0; k < 5; k++) { const r = 1.35 * Math.cos(k / 5 * Math.PI / 2); mb.cyl(0, 0.05 + k * 0.28, -0.1, r * 0.97, r, 0.28, k % 2 ? '#3a4a8a' : '#4a5a9a', 12); }
  for (let i = 0; i < 7; i++) mb.box(Math.cos(i) * 0.9, 0.8 + (i % 3) * 0.3, -0.1 + Math.sin(i) * 0.9, 0.06, 0.06, 0.06, '#ffffff', { glow: '#ffffa0' });
  mb.box(0, 0, d / 2 - 0.25, 1.0, 0.8, 0.3, '#3a4a8a'); mb.icon('moon', 0, 0.5, d / 2 - 0.09, 0.4, 0);
};
MODELS.atm = (mb) => { mb.box(0, 0, -0.1, 0.6, 1.0, 0.5, '#4a8fe0'); mb.box(0, 0.5, 0.16, 0.4, 0.25, 0.02, '#203040', { glow: '#80e0a0' }); mb.icon('atm', 0, 0.85, 0.16, 0.3, 0); };
MODELS.exchange = (mb, w, d) => { booth(mb, w, d, { wall: '#f4f2ee', awn: '#d8a020', sign: '#d8a020', icon: 'coin' }); mb.box(0, 0, 0, 1.2, 0.8, 0.2, '#e8e0d0'); mb.box(0, 0.8, 0, 1.2, 0.35, 0.05, '#bfe0f0', { glow: '#e0f0ff' }); };

// ---- ターミナル施設 ----
MODELS.checkin = (mb, w, d) => {
  mb.box(0, 0, -0.25, w - 0.1, 0.55, 0.35, '#e8e4dc', { side: '#d0ccc4' });
  mb.box(0, 0.55, -0.25, w - 0.05, 0.05, 0.4, '#4a8fe0');
  mb.box(0, 0, -0.45, w - 0.1, 0.12, 0.08, '#4a4a58');
  for (let i = 0; i < 3; i++) { const x = -1 + i; mb.box(x, 0.6, -0.3, 0.2, 0.16, 0.04, '#2a2a36'); mb.box(x, 0.62, -0.27, 0.16, 0.1, 0.02, '#203040', { glow: '#80c0ff' }); }
  mb.box(0, 0.0, -0.47, w, 1.3, 0.06, '#c8d8e8');
  mb.box(0, 1.0, -0.43, w - 0.2, 0.3, 0.04, '#3a7bd5', { glow: '#80b0ff' });
  mb.icon('checkin', -0.9, 1.15, -0.4, 0.26, 0); mb.icon('plane', 0.9, 1.15, -0.4, 0.26, 0);
  // ポールとベルト（行列用）
  for (const x of [-1.3, -0.4, 0.4, 1.3]) mb.cyl(x, 0, 0.35, 0.03, 0.04, 0.42, '#c0c0c8', 5);
  mb.box(-0.85, 0.36, 0.35, 0.9, 0.04, 0.02, '#3a5ab0'); mb.box(0.85, 0.36, 0.35, 0.9, 0.04, 0.02, '#3a5ab0');
};
MODELS.kiosk = (mb) => { mb.box(0, 0, -0.05, 0.5, 0.9, 0.4, '#f4f2ee'); mb.box(0, 0.9, -0.15, 0.5, 0.35, 0.12, '#3a7bd5'); mb.box(0, 0.6, 0.16, 0.36, 0.25, 0.02, '#203040', { glow: '#90d0ff' }); };
MODELS.security = (mb, w, d) => {
  // 金属探知ゲート
  mb.box(-0.5, 0, -0.1, 0.12, 1.1, 0.3, '#c0c0c8'); mb.box(0.1, 0, -0.1, 0.12, 1.1, 0.3, '#c0c0c8'); mb.box(-0.2, 1.0, -0.1, 0.72, 0.14, 0.3, '#c0c0c8');
  mb.box(-0.2, 1.05, 0.06, 0.2, 0.06, 0.02, '#203040', { glow: '#60ff80' });
  // X線
  mb.box(0.62, 0, -0.1, 0.5, 0.55, 1.6, '#d8d8e0'); mb.box(0.62, 0.55, -0.1, 0.52, 0.45, 0.6, '#5a6a8a'); mb.box(0.62, 0.55, -0.1, 0.4, 0.04, 1.6, '#3a3a48');
  mb.box(0.62, 0.62, 0.65, 0.3, 0.12, 0.25, '#e5484d');
  mb.box(-0.75, 0, -0.75, 0.4, 0.75, 0.3, '#4a4a58'); mb.box(-0.75, 0.75, -0.75, 0.3, 0.2, 0.04, '#203040', { glow: '#80ffa0' });
  mb.box(0, 0, -0.95, w, 1.4, 0.06, '#c8d8e8'); mb.box(0, 1.15, -0.9, 1.4, 0.25, 0.04, '#2a2a36'); mb.icon('security', 0, 1.27, -0.87, 0.24, 0);
};
MODELS.gate = (mb, w, d, o) => {
  mb.box(0, 0, -0.25, 0.8, 0.6, 0.35, '#e8e4dc'); mb.box(0, 0.6, -0.25, 0.85, 0.04, 0.4, '#ffd84a');
  mb.box(0, 0, -0.47, w, 1.5, 0.06, '#c8d8e8');
  mb.box(0, 1.05, -0.43, 1.3, 0.38, 0.05, '#2a2a36'); mb.box(0, 1.1, -0.4, 1.2, 0.28, 0.02, '#202830', { glow: '#ffd84a' });
  mb.icon('gate', -0.42, 1.24, -0.38, 0.24, 0);
  for (let i = 0; i < 3; i++) { mb.box(-0.7 + i * 0.7, 0, 0.25, 0.16, 0.4, 0.04, '#c0c0c8'); }
};
MODELS.busgate = (mb, w, d) => {
  mb.box(0, 0, 0, w - 0.04, 0.05, d - 0.04, '#d8e4ec');
  mb.box(0, 0, -d / 2 + 0.07, w, 1.4, 0.1, '#bfe0f0', { glow: '#fff0c0' });
  for (let r = 0; r < 2; r++) for (let i = 0; i < 4; i++) { mb.box(-1.05 + i * 0.7, 0, 0.0 + r * 0.55, 0.5, 0.25, 0.3, '#3a7bd5'); mb.box(-1.05 + i * 0.7, 0.25, -0.12 + r * 0.55, 0.5, 0.2, 0.06, '#3a7bd5'); }
  mb.box(0, 1.0, -d / 2 + 0.15, 1.4, 0.35, 0.05, '#2a2a36'); mb.icon('bus', -0.45, 1.17, -d / 2 + 0.19, 0.26, 0);
  mb.box(0.3, 1.08, -d / 2 + 0.18, 0.7, 0.2, 0.02, '#202830', { glow: '#ffd84a' });
};
MODELS.baggage = (mb, w, d) => {
  mb.box(0, 0, -0.1, w - 0.6, 0.35, d - 0.9, '#9a9aa6');
  mb.box(0, 0.35, -0.1, w - 0.7, 0.04, d - 1.0, '#3a3a48');
  mb.box(0, 0, -0.1, w - 1.2, 0.5, 0.25, '#c0c0c8');
  const bc = ['#e5484d', '#4a8fe0', '#ffd84a', '#3fc9b8', '#9a62d0', '#4a4a58'];
  for (let i = 0; i < 7; i++) { const a = i / 7 * TAU; mb.box(Math.cos(a) * (w / 2 - 0.55), 0.39, -0.1 + Math.sin(a) * (d / 2 - 0.65), 0.22, 0.16, 0.15, bc[i % 6]); }
  mb.box(0, 0, -d / 2 + 0.07, 1.0, 1.3, 0.12, '#4a4a58'); mb.box(0, 0.1, -d / 2 + 0.13, 0.7, 0.5, 0.02, '#1a1a22');
  mb.box(0, 1.0, -d / 2 + 0.14, 0.9, 0.25, 0.02, '#203040', { glow: '#ffd84a' });
};
MODELS.emig = (mb, w, d) => {
  for (let i = 0; i < 2; i++) { const x = -0.45 + i * 0.9; mb.box(x, 0, -0.2, 0.55, 0.75, 0.55, '#d8d8e0'); mb.box(x, 0.75, -0.2, 0.55, 0.45, 0.55, '#bfe0f0', { glow: '#e0f0ff' }); mb.box(x, 1.2, -0.2, 0.6, 0.06, 0.6, '#2f4f9a'); }
  mb.box(0, 0, -0.95, w, 1.4, 0.06, '#c8d8e8'); mb.box(0, 1.15, -0.9, 1.4, 0.25, 0.04, '#2f4f9a'); mb.icon('passport', 0, 1.27, -0.87, 0.24, 0);
};
MODELS.immig = (mb, w, d) => {
  for (let i = 0; i < 3; i++) { const x = -1 + i; mb.box(x, 0, -0.2, 0.55, 0.75, 0.55, '#d8d8e0'); mb.box(x, 0.75, -0.2, 0.55, 0.45, 0.55, '#bfe0f0', { glow: '#e0f0ff' }); mb.box(x, 1.2, -0.2, 0.6, 0.06, 0.6, '#2a5a3a'); }
  mb.box(0, 0, -0.95, w, 1.4, 0.06, '#c8d8e8'); mb.box(0, 1.15, -0.9, 1.8, 0.25, 0.04, '#2a5a3a'); mb.icon('customs', 0, 1.27, -0.87, 0.24, 0);
};
MODELS.info = (mb, w) => { mb.cyl(0, 0, -0.05, 0.5, 0.55, 0.6, '#f4f2ee', 10); mb.cyl(0, 0.6, -0.05, 0.55, 0.55, 0.05, '#4a8fe0', 10); mb.cyl(0, 0, -0.05, 0.05, 0.05, 1.4, '#c0c0c8', 4); mb.box(0, 1.25, -0.05, 0.5, 0.4, 0.06, '#4a8fe0', { glow: '#80b0ff' }); mb.icon('info', 0, 1.45, 0.0, 0.32, 0); };
MODELS.toilet = (mb, w, d) => {
  mb.box(0, 0, 0, w - 0.04, 0.05, d - 0.04, '#e0e8f0');
  mb.box(0, 0, -d / 2 + 0.07, w, 1.3, 0.12, '#f0f0f4'); mb.box(-w / 2 + 0.07, 0, 0, 0.12, 1.3, d, '#f0f0f4'); mb.box(w / 2 - 0.07, 0, 0, 0.12, 1.3, d, '#f0f0f4');
  mb.box(0, 0, -0.1, 0.1, 1.3, d - 0.4, '#d8d8e0');
  mb.box(-0.55, 0, d / 2 - 0.1, 0.5, 1.3, 0.08, '#4a8fe0'); mb.box(0.55, 0, d / 2 - 0.1, 0.5, 1.3, 0.08, '#e5484d');
  mb.box(-0.55, 0.1, d / 2 - 0.1, 0.32, 0.9, 0.1, '#ffffff'); mb.box(0.55, 0.1, d / 2 - 0.1, 0.32, 0.9, 0.1, '#ffffff');
  mb.box(0, 1.3, 0, w, 0.06, d, '#c8d0d8');
  mb.icon('toilet', 0, 1.0, d / 2 - 0.04, 0.4, 0);
};
MODELS.nursing = (mb, w, d) => { mb.box(0, 0, -0.1, w - 0.1, 1.2, d - 0.3, '#fff0f4'); mb.box(0, 1.2, -0.1, w - 0.05, 0.06, d - 0.25, '#f59ac0'); mb.box(0, 0, d / 2 - 0.22, 0.5, 1.0, 0.06, '#f59ac0'); mb.icon('nursing', 0, 0.75, d / 2 - 0.18, 0.34, 0); };
MODELS.firstaid = (mb, w, d) => { mb.box(0, 0, -0.1, w - 0.1, 1.2, d - 0.3, '#ffffff'); mb.box(0, 1.2, -0.1, w - 0.05, 0.06, d - 0.25, '#e5484d'); mb.box(0, 0, d / 2 - 0.22, 0.5, 1.0, 0.06, '#e0e8f0'); mb.icon('firstaid', 0, 0.75, d / 2 - 0.18, 0.34, 0); };
MODELS.bench = (mb, w) => { for (let i = 0; i < 3; i++) { mb.box(-0.6 + i * 0.6, 0, 0, 0.5, 0.25, 0.4, '#3a7bd5'); mb.box(-0.6 + i * 0.6, 0.25, -0.17, 0.5, 0.25, 0.06, '#3a7bd5'); } mb.box(0, 0, 0, w - 0.1, 0.1, 0.1, '#9a9aa6'); };
MODELS.plant = (mb) => { mb.box(0, 0, 0, 0.4, 0.35, 0.4, '#f4f2ee'); mb.box(0, 0.35, 0, 0.5, 0.25, 0.5, '#3e8a3c'); mb.box(0, 0.6, 0, 0.36, 0.3, 0.36, '#4cb85c'); mb.box(0.1, 0.9, 0.05, 0.16, 0.18, 0.16, '#5ac86a'); };
MODELS.fids = (mb) => { mb.box(0, 0, 0, 0.15, 1.1, 0.15, '#4a4a58'); mb.box(0, 1.1, 0, 0.8, 0.6, 0.12, '#1a1a22'); for (let i = 0; i < 4; i++) mb.box(0, 1.17 + i * 0.12, 0.065, 0.66, 0.06, 0.01, '#202020', { glow: i % 2 ? '#ffd84a' : '#80ff80' }); };
MODELS.karakuri = (mb) => {
  mb.box(0, 0, 0, 1.2, 0.3, 1.2, '#c8b898'); mb.box(0, 0.3, 0, 0.8, 1.6, 0.8, '#a0683c'); mb.box(0, 1.9, 0, 1.0, 0.1, 1.0, '#d8a020'); mb.gable(0, 2.0, 0, 1.0, 0.5, 1.0, '#a02838');
  mb.cyl(0, 1.35, 0.41, 0.3, 0.3, 0.02, '#f4f2ee', 10); mb.box(0, 1.35, 0.43, 0.04, 0.25, 0.02, '#2a2a36'); mb.box(0.08, 1.45, 0.43, 0.18, 0.04, 0.02, '#2a2a36');
  mb.box(0, 0.5, 0.41, 0.5, 0.5, 0.04, '#2a1e1a', { glow: '#ffd84a' });
};
// ---- 空側 ----
MODELS.tower = (mb) => {
  mb.box(0, 0, 0, 1.8, 0.8, 1.8, '#e8e4dc'); mb.box(0, 0.8, 0, 0.9, 3.4, 0.9, '#f4f2ee', { side: '#e8e4dc' });
  for (let i = 0; i < 5; i++) mb.box(0, 1.0 + i * 0.6, 0.46, 0.25, 0.25, 0.02, '#8fc8e8', { glow: '#ffe8a0' });
  mb.cyl(0, 4.2, 0, 0.95, 0.7, 0.25, '#e8e4dc', 8);
  mb.cyl(0, 4.45, 0, 1.0, 0.92, 0.75, '#5aa0d0', 8, { glow: '#a0e0ff' });
  mb.cyl(0, 5.2, 0, 0.75, 1.05, 0.25, '#3a4a6a', 8);
  mb.cyl(0, 5.45, 0, 0.05, 0.05, 0.9, '#c0c0c8', 4); mb.box(0, 6.3, 0, 0.12, 0.12, 0.12, '#ff3030', { glow: '#ff2020' });
  mb.box(0.5, 5.45, 0.2, 0.3, 0.3, 0.3, '#f4f2ee');
};
MODELS.fire = (mb, w, d) => {
  mb.box(0, 0, -0.2, w - 0.1, 1.4, d - 0.5, '#f4f2ee'); mb.box(0, 1.4, -0.2, w, 0.12, d - 0.4, '#e5484d');
  for (let i = 0; i < 2; i++) { const x = -0.7 + i * 1.4; mb.box(x, 0, 0.56, 1.0, 1.05, 0.04, '#9a9aa6'); }
  mb.box(-0.7, 0, 0.9, 0.7, 0.55, 1.0, '#e5484d'); mb.box(-0.7, 0.55, 0.75, 0.6, 0.3, 0.5, '#e5484d'); mb.box(-0.7, 0.85, 0.75, 0.15, 0.06, 0.15, '#4a8fe0', { glow: '#60a0ff' });
  mb.box(w / 2 - 0.3, 1.5, -0.6, 0.3, 0.8, 0.3, '#e5484d'); mb.icon('fire', 0.6, 1.0, 0.1, 0.4, 0);
};
MODELS.fuel = (mb, w, d) => {
  for (let i = 0; i < 2; i++) { const x = -0.8 + i * 1.5; mb.cyl(x, 0, -0.1, 0.65, 0.65, 1.1, '#f4f2ee', 10); mb.cyl(x, 0.4, -0.1, 0.66, 0.66, 0.15, '#e5484d', 10); mb.cyl(x, 1.1, -0.1, 0.3, 0.65, 0.15, '#e0e0e8', 10); }
  mb.box(0, 0.2, 0.6, w - 0.4, 0.12, 0.12, '#9a9aa6'); mb.box(0.8, 0, 0.75, 0.5, 0.5, 0.3, '#ffd84a');
};
MODELS.hangar = (mb, w, d) => {
  const steps = 5;
  for (let k = 0; k < steps; k++) { const t = k / steps, ww = w * Math.cos(t * Math.PI / 2.4); mb.box(0, 0.5 + k * 0.45, -0.1, ww, 0.45, d - 0.3, k % 2 ? '#d8d8e0' : '#c8ccd8'); }
  mb.box(0, 0, -0.1, w, 0.5, d - 0.3, '#c8ccd8');
  mb.box(0, 0, d / 2 - 0.22, w - 0.5, 2.1, 0.06, '#8a90a0'); for (let i = 0; i < 6; i++) mb.box(-w / 2 + 0.55 + i * (w - 1.1) / 5, 0, d / 2 - 0.18, 0.04, 2.1, 0.02, '#6a7080');
  mb.box(0, 2.2, d / 2 - 0.2, 1.6, 0.35, 0.05, '#2f4f9a'); mb.icon('hangar', 0, 2.37, d / 2 - 0.16, 0.3, 0);
};
MODELS.cargo = (mb, w, d) => {
  mb.box(0, 0, -0.4, w - 0.1, 1.4, d - 1, '#d8c8a8'); mb.box(0, 1.4, -0.4, w, 0.1, d - 0.9, '#a07850');
  for (let i = 0; i < 4; i++) mb.box(-1.4 + i * 0.93, 0, 0.12, 0.7, 0.9, 0.04, '#8a7a5a');
  const cc = ['#f08a24', '#4a8fe0', '#4cb85c', '#e5484d'];
  for (let i = 0; i < 4; i++) mb.box(-1.4 + i * 0.93, 0, 0.9, 0.7, 0.5 + (i % 2) * 0.5, 0.7, cc[i]);
  mb.icon('cargo', 0, 1.2, 0.12, 0.36, 0);
};
MODELS.snow = (mb, w, d) => { mb.box(0, 0, -0.2, w - 0.1, 1.1, d - 0.5, '#e8e4dc'); mb.box(0, 1.1, -0.2, w, 0.1, d - 0.4, '#f39a3c'); mb.box(0, 0, 0.56, 1.2, 0.9, 0.04, '#9a9aa6'); mb.box(0.3, 0, 0.85, 0.7, 0.5, 0.5, '#f39a3c'); mb.box(-0.15, 0, 0.85, 0.2, 0.3, 0.7, '#ffd84a'); mb.icon('snow', 0, 0.7, 0.6, 0.3, 0); };
MODELS.radar = (mb) => { mb.box(0, 0, 0, 1.4, 0.4, 1.4, '#d8d8e0'); mb.box(0, 0.4, 0, 0.5, 2.0, 0.5, '#f4f2ee'); for (let k = 0; k < 4; k++) { const r = 0.8 * Math.sin((k + 1) / 5 * Math.PI); mb.cyl(0, 2.4 + k * 0.32, 0, r * 0.95, r, 0.32, '#ffffff', 10); } mb.box(0, 3.75, 0, 0.1, 0.1, 0.1, '#ff3030', { glow: '#ff2020' }); };
MODELS.ils = (mb, w, d) => { for (let i = 0; i < 5; i++) { mb.cyl(0, 0, -0.8 + i * 0.4, 0.04, 0.04, 0.7, i % 2 ? '#e5484d' : '#f4f2ee', 4); mb.box(0, 0.7, -0.8 + i * 0.4, 0.3, 0.06, 0.06, '#c0c0c8'); } mb.box(0.3, 0, 0.6, 0.4, 0.5, 0.4, '#f4f2ee'); };
MODELS.windsock = (mb) => { mb.cyl(0, 0, 0, 0.04, 0.05, 1.5, '#f4f2ee', 4); for (let i = 0; i < 4; i++) mb.box(0.15 + i * 0.2, 1.3 - i * 0.04, 0, 0.2, 0.22 - i * 0.03, 0.22 - i * 0.03, i % 2 ? '#ffffff' : '#f39a3c'); };
MODELS.heliport = (mb, w, d) => {
  mb.box(0, 0, 0, w - 0.2, 0.1, d - 0.2, '#5a6a5a'); mb.cyl(0, 0.1, 0, 1.2, 1.2, 0.02, '#f4f2ee', 16); mb.cyl(0, 0.11, 0, 1.08, 1.08, 0.02, '#5a6a5a', 16);
  mb.box(-0.35, 0.12, 0, 0.12, 0.02, 0.8, '#f4f2ee'); mb.box(0.35, 0.12, 0, 0.12, 0.02, 0.8, '#f4f2ee'); mb.box(0, 0.12, 0, 0.6, 0.02, 0.12, '#f4f2ee');
  // ヘリ
  mb.box(0.2, 0.15, 0.3, 0.55, 0.45, 0.9, '#e5484d'); mb.box(0.2, 0.35, 0.72, 0.45, 0.25, 0.1, '#8fc8e8'); mb.box(0.2, 0.4, -0.5, 0.12, 0.12, 0.9, '#e5484d'); mb.box(0.2, 0.45, -0.95, 0.04, 0.3, 0.2, '#e5484d');
  mb.box(0.2, 0.62, 0.3, 2.0, 0.03, 0.1, '#2a2a36'); mb.box(0.2, 0.62, 0.3, 0.1, 0.03, 2.0, '#2a2a36'); mb.box(-0.05, 0.15, 0.3, 0.04, 0.04, 0.9, '#2a2a36'); mb.box(0.45, 0.15, 0.3, 0.04, 0.04, 0.9, '#2a2a36');
};
// ---- 陸側 ----
MODELS.busstop = (mb, w) => { mb.box(0, 0, -0.2, 1.6, 0.06, 0.6, '#c8c8d0'); mb.box(-0.7, 0, -0.35, 0.06, 1.1, 0.06, '#9a9aa6'); mb.box(0.7, 0, -0.35, 0.06, 1.1, 0.06, '#9a9aa6'); mb.box(0, 1.1, -0.25, 1.7, 0.06, 0.6, '#4cb85c'); mb.box(0, 0, -0.45, 1.5, 0.9, 0.04, '#bfe0f0'); mb.box(0, 0, -0.2, 1.0, 0.28, 0.25, '#a0683c'); mb.cyl(0.9, 0, 0.2, 0.04, 0.04, 1.3, '#9a9aa6', 4); mb.cyl(0.9, 1.3, 0.2, 0.22, 0.22, 0.08, '#4cb85c', 8); mb.icon('bus', 0.9, 1.34, 0.26, 0.3, 0); };
MODELS.taxistand = (mb) => { mb.box(0, 0, -0.2, 1.8, 0.06, 0.6, '#c8c8d0'); mb.cyl(-0.8, 0, -0.2, 0.04, 0.04, 1.2, '#9a9aa6', 4); mb.box(-0.8, 1.2, -0.2, 0.5, 0.3, 0.06, '#ffd84a'); mb.icon('taxi', -0.8, 1.35, -0.16, 0.26, 0); car(mb, 0.3, -0.05, '#ffd84a', 0, true); };
function car(mb, x, z, col, rotX, taxi) {
  if (rotX) { mb.box(x, 0.08, z, 0.85, 0.24, 0.45, col); mb.box(x - 0.05, 0.32, z, 0.45, 0.2, 0.4, col); mb.box(x - 0.05, 0.34, z, 0.47, 0.14, 0.36, '#3a4a5a'); }
  else { mb.box(x, 0.08, z, 0.45, 0.24, 0.85, col); mb.box(x, 0.32, z - 0.05, 0.4, 0.2, 0.45, col); mb.box(x, 0.34, z - 0.05, 0.36, 0.14, 0.47, '#3a4a5a'); }
  if (taxi) mb.box(x, 0.52, z, 0.12, 0.06, 0.08, '#ffffff', { glow: '#ffe080' });
}
const CARC = ['#e5484d', '#4a8fe0', '#ffffff', '#2a2a36', '#c0c0c8', '#ffd84a', '#4cb85c', '#9a62d0'];
MODELS.parking = (mb, w, d) => {
  mb.box(0, 0, 0, w - 0.06, 0.04, d - 0.06, '#5a5a64');
  for (let i = 0; i <= 5; i++) mb.box(-w / 2 + 0.3 + i * 0.68, 0.04, -0.55, 0.04, 0.005, 0.9, '#f0f0f0');
  for (let i = 0; i <= 5; i++) mb.box(-w / 2 + 0.3 + i * 0.68, 0.04, 0.75, 0.04, 0.005, 0.9, '#f0f0f0');
  const r = mulberry32(w * 7 + d);
  for (let i = 0; i < 5; i++) { if (r() < 0.75) car(mb, -w / 2 + 0.64 + i * 0.68, -0.55, CARC[Math.floor(r() * 8)]); if (r() < 0.6) car(mb, -w / 2 + 0.64 + i * 0.68, 0.75, CARC[Math.floor(r() * 8)]); }
  mb.box(w / 2 - 0.35, 0, d / 2 - 0.25, 0.4, 0.7, 0.3, '#f4f2ee'); mb.box(w / 2 - 0.35, 0.7, d / 2 - 0.25, 0.5, 0.05, 0.4, '#4a8fe0');
  mb.cyl(-w / 2 + 0.25, 0, d / 2 - 0.2, 0.04, 0.04, 1.3, '#9a9aa6', 4); mb.box(-w / 2 + 0.25, 1.3, d / 2 - 0.2, 0.5, 0.5, 0.06, '#4a8fe0'); mb.icon('parking', -w / 2 + 0.25, 1.55, d / 2 - 0.16, 0.4, 0);
};
MODELS.rentacar = (mb, w, d) => { mb.box(0, 0, 0, w - 0.06, 0.04, d - 0.06, '#5a5a64'); mb.box(-0.8, 0, -0.3, 1.2, 1.0, 1.0, '#f4f2ee'); mb.box(-0.8, 1.0, -0.3, 1.3, 0.08, 1.1, '#e5484d'); mb.box(-0.8, 0.1, 0.22, 0.8, 0.6, 0.02, '#8fc8e8', { glow: '#ffe8a0' }); mb.icon('key', -0.8, 1.25, 0.25, 0.34, 0); car(mb, 0.55, -0.4, '#ffffff', 0); car(mb, 1.1, -0.4, '#4a8fe0', 0); car(mb, 0.8, 0.45, '#e5484d', 1); };
MODELS.parkingtower = (mb, w, d) => {
  for (let f = 0; f < 4; f++) {
    mb.box(0, f * 0.7, 0, w - 0.1, 0.12, d - 0.1, '#b8b8c0');
    if (f > 0) for (const [x, z] of [[-1.7, -1.7], [1.7, -1.7], [-1.7, 1.7], [1.7, 1.7], [0, -1.7], [0, 1.7]]) mb.box(x, (f - 1) * 0.7 + 0.12, z, 0.2, 0.58, 0.2, '#c8c8d0');
    const r = mulberry32(f * 31 + 5);
    for (let i = 0; i < 5; i++) if (r() < 0.7) car(mb, -1.4 + i * 0.7, 0.04 + f * 0.7 - 0.0, CARC[Math.floor(r() * 8)]);
    mb.box(0, f * 0.7 + 0.12, d / 2 - 0.08, w - 0.1, 0.2, 0.06, '#e8e8f0');
  }
  mb.box(0, 2.8, 0, w - 0.1, 0.15, d - 0.1, '#a8a8b0'); mb.box(0, 2.95, d / 2 - 0.2, 1.2, 0.6, 0.1, '#4a8fe0'); mb.icon('parking', 0, 3.25, d / 2 - 0.14, 0.45, 0);
};
MODELS.station = (mb, w, d) => {
  mb.box(0, 0, -0.6, w - 0.1, 0.5, 1.3, '#c8c8d0');
  for (let i = 0; i < 6; i++) mb.box(-w / 2 + 0.5 + i * (w - 1) / 5, 0.5, -0.6, 0.12, 1.3, 0.12, '#9a9aa6');
  mb.box(0, 1.8, -0.6, w, 0.12, 1.5, '#3a7bd5');
  mb.box(0, 0, -1.35, w, 0.08, 0.3, '#7a6a5a'); mb.box(0, 0.08, -1.25, w, 0.04, 0.04, '#c0c0c8'); mb.box(0, 0.08, -1.45, w, 0.04, 0.04, '#c0c0c8');
  mb.box(0, 0, 0.75, 3.0, 1.6, 1.4, '#f4f2ee'); mb.box(0, 1.6, 0.75, 3.2, 0.12, 1.5, '#3a7bd5'); mb.box(0, 0.1, 1.46, 1.6, 1.1, 0.02, '#8fc8e8', { glow: '#ffe8a0' });
  mb.box(0, 1.75, 1.3, 1.6, 0.4, 0.08, '#2a2a36'); mb.icon('train', -0.55, 1.95, 1.35, 0.32, 0); mb.box(0.25, 1.85, 1.35, 0.9, 0.2, 0.02, '#202830', { glow: '#ffffff' });
};
MODELS.deck = (mb, w, d) => {
  mb.box(0, 0, 0, w - 0.1, 1.0, d - 0.1, '#e8e4dc', { side: '#d8d4cc' });
  for (let i = 0; i < 4; i++) mb.box(-w / 2 + 0.6 + i * (w - 1.2) / 3, 0.1, d / 2 - 0.02, 0.6, 0.7, 0.02, '#8fc8e8', { glow: '#ffe8a0' });
  mb.box(0, 1.0, 0, w - 0.1, 0.06, d - 0.1, '#a07850');
  for (const [x, z, ww, dd] of [[0, d / 2 - 0.1, w - 0.1, 0.06], [0, -d / 2 + 0.1, w - 0.1, 0.06], [-w / 2 + 0.1, 0, 0.06, d - 0.1], [w / 2 - 0.1, 0, 0.06, d - 0.1]]) mb.box(x, 1.06, z, ww, 0.4, dd, '#c0c0c8');
  for (let i = 0; i < 3; i++) { mb.cyl(-1 + i, 1.06, d / 2 - 0.4, 0.04, 0.04, 0.5, '#4a4a58', 4); mb.box(-1 + i, 1.5, d / 2 - 0.4, 0.12, 0.12, 0.3, '#4a8fe0'); }
  mb.box(-w / 2 + 0.6, 1.06, -0.3, 0.5, 0.25, 0.4, '#a0683c'); mb.cyl(w / 2 - 0.6, 1.06, -0.4, 0.04, 0.04, 1.3, '#9a9aa6', 4); mb.box(w / 2 - 0.6, 2.0, -0.4, 0.6, 0.4, 0.04, '#ffd84a'); mb.icon('binocular', w / 2 - 0.6, 2.2, -0.37, 0.32, 0);
};
MODELS.hotel = (mb, w, d) => {
  const fl = 5;
  mb.box(0, 0, -0.3, w - 0.6, 0.9, d - 1.0, '#e8e0d0');
  mb.box(0, 0.1, d / 2 - 0.82, 1.6, 0.7, 0.02, '#8fc8e8', { glow: '#ffe0a0' });
  for (let f = 0; f < fl; f++) {
    mb.box(0, 0.9 + f * 0.6, -0.3, w - 0.8, 0.6, d - 1.2, f % 2 ? '#f4f0e8' : '#eee8dc');
    for (let i = 0; i < 5; i++) mb.box(-w / 2 + 0.9 + i * (w - 1.8) / 4, 1.05 + f * 0.6, d / 2 - 0.89, 0.35, 0.3, 0.02, '#8fc8e8', { glow: (f + i) % 3 ? '#ffe8a0' : '#605848' });
  }
  mb.box(0, 0.9 + fl * 0.6, -0.3, w - 0.7, 0.15, d - 1.1, '#a07850');
  mb.box(0, 0.9 + fl * 0.6 + 0.15, -0.3, 1.8, 0.45, 0.15, '#2f4f9a'); mb.icon('bed', -0.55, 0.9 + fl * 0.6 + 0.38, -0.21, 0.32, 0);
  mb.box(0.3, 0.9 + fl * 0.6 + 0.25, -0.21, 0.9, 0.25, 0.02, '#203040', { glow: '#ffffff' });
  mb.box(0, 0, d / 2 - 0.45, 2.2, 0.05, 0.6, '#c8c8d0'); mb.box(0, 0.9, d / 2 - 0.55, 2.0, 0.06, 0.7, '#2f4f9a');
};
MODELS.onsen = (mb, w, d) => {
  mb.box(0, 0, -0.5, w - 0.6, 1.0, d - 1.6, '#e8dcc0'); mb.gable(0, 1.0, -0.5, w - 0.3, 0.8, d - 1.2, '#4a4a58', { end: '#3a3a44' });
  for (let i = 0; i < 4; i++) mb.box(-w / 2 + 0.7 + i * (w - 1.4) / 3, 0.25, d / 2 - 1.29, 0.5, 0.5, 0.02, '#e8d8a8', { glow: '#ffd080' });
  mb.box(1.0, 0, d / 2 - 0.55, 1.5, 0.15, 0.9, '#a07850'); mb.box(1.0, 0.05, d / 2 - 0.55, 1.2, 0.12, 0.65, '#5cc8e0', { glow: '#90e8ff' });
  for (let i = 0; i < 3; i++) mb.box(0.7 + i * 0.3, 0.2, d / 2 - 0.5, 0.05, 0.5 + i * 0.1, 0.05, '#ffffff');
  mb.box(-1.0, 0, d / 2 - 0.5, 0.3, 0.3, 0.3, '#7a7a80'); mb.box(-1.0, 0.3, d / 2 - 0.5, 0.15, 0.25, 0.15, '#c8c0a8', { glow: '#ffd080' });
  mb.box(-1.4, 0, d / 2 - 0.4, 0.5, 0.5, 0.5, '#3e8a3c');
  mb.box(0, 1.9, d / 2 - 1.3, 1.0, 0.4, 0.06, '#2a1e1a'); mb.icon('onsen', 0, 2.1, d / 2 - 1.26, 0.34, 0);
};
MODELS.solar = (mb, w, d) => {
  for (let r = 0; r < 3; r++) for (let c = 0; c < 2; c++) {
    const z = -1 + r * 1.0, x = -0.7 + c * 1.4;
    mb.box(x, 0, z, 0.06, 0.4, 0.06, '#9a9aa6');
    const save = mb.mat; const m = new THREE.Matrix4().makeTranslation(x, 0.45, z).multiply(new THREE.Matrix4().makeRotationX(-0.5));
    mb.setMat(m); mb.box(0, 0, 0, 1.3, 0.05, 0.8, '#2a4a8a'); for (let k = 0; k < 3; k++) mb.box(-0.43 + k * 0.43, 0.051, 0, 0.02, 0.005, 0.8, '#8ab0e0'); mb.setMat(save);
  }
};
MODELS.park = (mb, w, d) => {
  mb.box(0, 0, 0, w - 0.1, 0.04, d - 0.1, '#6ac05a');
  mb.box(0, 0.04, 0, w - 0.1, 0.01, 0.6, '#d8c8a8'); mb.box(0, 0.04, 0, 0.6, 0.01, d - 0.1, '#d8c8a8');
  mb.cyl(0, 0.04, 0, 0.7, 0.7, 0.2, '#c8c8d0', 10); mb.cyl(0, 0.08, 0, 0.6, 0.6, 0.18, '#5cc8e0', 10, { glow: '#80e0ff' }); mb.cyl(0, 0.2, 0, 0.08, 0.08, 0.5, '#ffffff', 6);
  for (const [x, z] of [[-1.3, -1.3], [1.3, -1.3], [-1.3, 1.3], [1.3, 1.3]]) treeShape(mb, x, z, 'round', 0, 0.9);
  for (const [x, z, r] of [[-1.3, 0.55, 0], [1.3, -0.55, 0]]) { mb.box(x, 0, z, 0.8, 0.22, 0.25, '#a0683c'); }
  for (let i = 0; i < 6; i++) mb.box(-0.4 + (i % 3) * 0.4, 0.04, 1.4 + Math.floor(i / 3) * 0.3, 0.15, 0.1, 0.15, ['#f59ac0', '#ffd84a', '#e5484d'][i % 3]);
};
MODELS.shrine = (mb, w, d) => {
  mb.box(0, 0, 0, w - 0.1, 0.05, d - 0.1, '#d8d0c0');
  // 鳥居
  mb.box(-0.7, 0, 1.1, 0.14, 1.4, 0.14, '#e5484d'); mb.box(0.7, 0, 1.1, 0.14, 1.4, 0.14, '#e5484d'); mb.box(0, 1.4, 1.1, 1.9, 0.14, 0.2, '#2a1e1a'); mb.box(0, 1.15, 1.1, 1.6, 0.1, 0.14, '#e5484d');
  mb.box(0, 0, -0.5, 1.6, 0.3, 1.4, '#a07850'); mb.box(0, 0.3, -0.5, 1.2, 0.8, 1.0, '#c8a070'); mb.gable(0, 1.1, -0.5, 1.8, 0.7, 1.6, '#5a6a4a');
  mb.box(0, 0.4, 0.0, 0.5, 0.4, 0.06, '#d8a020'); mb.icon('mascot', 0, 0.62, 0.04, 0.34, 0);
  for (const x of [-1.1, 1.1]) { mb.box(x, 0, 0.3, 0.2, 0.5, 0.2, '#9a9aa6'); mb.box(x, 0.5, 0.3, 0.3, 0.25, 0.3, '#c8c0a8', { glow: '#ffd080' }); mb.box(x, 0.75, 0.3, 0.34, 0.06, 0.34, '#7a7a80'); }
};
// ---- かざり ----
function treeShape(mb, x, z, kind, season, s) {
  s = s || 1;
  const leaf = {
    round: [['#5ab04a', '#4a9a40', '#6ac05a'], ['#3e9a3a', '#2e8030', '#4aaa44'], ['#e0902c', '#d06a24', '#f0b040'], ['#8a7a6a', '#7a6a5a', '#9a8a7a']],
    sakura: [['#ffb0d0', '#ff90c0', '#ffd0e4'], ['#5ab04a', '#4a9a40', '#6ac05a'], ['#e07a3a', '#c86030', '#f0a050'], ['#8a7060', '#7a6050', '#9a8070']],
    pine: [['#2e7d4a', '#246a3e', '#3a8a54'], ['#2e7d4a', '#246a3e', '#3a8a54'], ['#2e7d4a', '#246a3e', '#3a8a54'], ['#3a7a50', '#2e6a44', '#e8f0f8']],
  }[kind === 'palm' || kind === 'bush' ? 'round' : kind][season] || ['#5ab04a', '#4a9a40', '#6ac05a'];
  if (kind === 'pine') {
    mb.box(x, 0, z, 0.14 * s, 0.4 * s, 0.14 * s, '#6b4226');
    mb.box(x, 0.3 * s, z, 0.8 * s, 0.35 * s, 0.8 * s, leaf[0]); mb.box(x, 0.65 * s, z, 0.6 * s, 0.35 * s, 0.6 * s, leaf[1]); mb.box(x, 1.0 * s, z, 0.38 * s, 0.35 * s, 0.38 * s, leaf[2]);
    if (season === 3) mb.box(x, 1.35 * s, z, 0.2 * s, 0.1 * s, 0.2 * s, '#ffffff');
    return;
  }
  if (kind === 'palm') {
    for (let i = 0; i < 5; i++) mb.box(x + i * 0.04 * s, i * 0.3 * s, z, 0.14 * s, 0.32 * s, 0.14 * s, i % 2 ? '#8a6040' : '#a07050');
    const top = 1.5 * s, lc = season === 3 ? '#4a8a40' : '#3fae4a';
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { mb.box(x + 0.2 * s + dx * 0.35 * s, top, z + dz * 0.35 * s, dx ? 0.7 * s : 0.2 * s, 0.08 * s, dz ? 0.7 * s : 0.2 * s, lc); mb.box(x + 0.2 * s + dx * 0.65 * s, top - 0.12 * s, z + dz * 0.65 * s, dx ? 0.2 * s : 0.16 * s, 0.12 * s, dz ? 0.2 * s : 0.16 * s, lc); }
    mb.box(x + 0.2 * s, top - 0.1 * s, z, 0.16 * s, 0.14 * s, 0.16 * s, '#8a5a30');
    return;
  }
  if (kind === 'bush') { mb.box(x, 0, z, 0.6 * s, 0.35 * s, 0.6 * s, leaf[0]); mb.box(x + 0.05, 0.3 * s, z, 0.4 * s, 0.15 * s, 0.4 * s, leaf[2]); return; }
  mb.box(x, 0, z, 0.16 * s, 0.55 * s, 0.16 * s, '#6b4226');
  if (season === 3 && kind !== 'pine') {
    mb.box(x, 0.5 * s, z, 0.5 * s, 0.08 * s, 0.08 * s, '#6b4226'); mb.box(x, 0.65 * s, z, 0.08 * s, 0.08 * s, 0.5 * s, '#6b4226');
    mb.box(x, 0.55 * s, z, 0.7 * s, 0.5 * s, 0.7 * s, leaf[0]);
    mb.box(x, 1.05 * s, z, 0.5 * s, 0.1 * s, 0.5 * s, '#ffffff');
    return;
  }
  mb.box(x, 0.45 * s, z, 0.8 * s, 0.55 * s, 0.8 * s, leaf[0]);
  mb.box(x - 0.05 * s, 0.95 * s, z + 0.05 * s, 0.56 * s, 0.32 * s, 0.56 * s, leaf[2]);
  mb.box(x + 0.22 * s, 0.6 * s, z + 0.25 * s, 0.3 * s, 0.25 * s, 0.3 * s, leaf[1]);
  if (kind === 'sakura' && season === 0) mb.box(x - 0.2 * s, 0.75 * s, z - 0.3 * s, 0.25 * s, 0.2 * s, 0.25 * s, '#ffffff');
}
MODELS.tree = (mb, w, d, o) => treeShape(mb, 0, 0, 'round', o.season || 0, o.s || 1);
MODELS.sakura = (mb, w, d, o) => treeShape(mb, 0, 0, 'sakura', o.season || 0, 1.1);
MODELS.pine = (mb, w, d, o) => treeShape(mb, 0, 0, 'pine', o.season || 0, 1.1);
MODELS.palm = (mb, w, d, o) => treeShape(mb, 0, 0, 'palm', o.season || 0, 1);
MODELS.bush = (mb, w, d, o) => treeShape(mb, 0, 0, 'bush', o.season || 0, 1);
MODELS.flowerbed = (mb, w) => { mb.box(0, 0, 0, w - 0.1, 0.22, 0.8, '#a0683c'); mb.box(0, 0.22, 0, w - 0.2, 0.04, 0.7, '#5a3a24'); const fc = ['#f59ac0', '#ffd84a', '#e5484d', '#ffffff', '#c9a0ff']; for (let i = 0; i < 10; i++) { const x = -0.8 + (i % 5) * 0.4, z = -0.17 + Math.floor(i / 5) * 0.34; mb.box(x, 0.26, z, 0.06, 0.14, 0.06, '#4cb85c'); mb.box(x, 0.4, z, 0.14, 0.1, 0.14, fc[i % 5]); } };
MODELS.fountain = (mb) => { mb.cyl(0, 0, 0, 0.95, 0.95, 0.3, '#d8d8e0', 12); mb.cyl(0, 0.05, 0, 0.82, 0.82, 0.27, '#5cc8e0', 12, { glow: '#90e8ff' }); mb.cyl(0, 0.3, 0, 0.15, 0.2, 0.6, '#d8d8e0', 8); mb.cyl(0, 0.9, 0, 0.4, 0.4, 0.08, '#d8d8e0', 10); mb.cyl(0, 0.92, 0, 0.32, 0.32, 0.08, '#5cc8e0', 10, { glow: '#90e8ff' }); mb.cyl(0, 1.0, 0, 0.05, 0.08, 0.5, '#c8f4ff', 6, { glow: '#ffffff' }); };
MODELS.statue = (mb) => { mb.box(0, 0, 0, 1.2, 0.6, 1.2, '#c8c0b0'); mb.box(0, 0.6, 0, 0.3, 0.6, 0.3, '#9a9aa6'); mb.box(0.0, 1.2, 0, 0.3, 0.3, 1.5, '#d8d8e0'); mb.box(0, 1.25, 0.1, 1.7, 0.06, 0.4, '#d8d8e0'); mb.box(0, 1.5, -0.65, 0.06, 0.4, 0.25, '#d8d8e0'); mb.box(0, 1.27, -0.65, 0.6, 0.05, 0.2, '#d8d8e0'); mb.box(0, 0.25, 0.61, 0.8, 0.2, 0.02, '#d8a020'); };
MODELS.lamp = (mb) => { mb.cyl(0, 0, 0, 0.05, 0.07, 1.6, '#3a3a48', 5); mb.box(0, 1.6, 0, 0.26, 0.24, 0.26, '#3a3a48'); mb.box(0, 1.6, 0, 0.2, 0.18, 0.2, '#fff8e0', { glow: '#ffe8a0' }); };
MODELS.flag = (mb, w, d, o) => { mb.cyl(0, 0, 0, 0.04, 0.05, 1.9, '#d8d8e0', 5); const c = ['#e5484d', '#4a8fe0', '#4cb85c', '#ffd84a'][(o.var || 0) % 4]; mb.box(0.32, 1.45, 0, 0.6, 0.38, 0.03, c); mb.box(0.25, 1.58, 0.01, 0.2, 0.14, 0.03, '#ffffff'); };
MODELS.benchout = (mb, w) => { mb.box(0, 0, 0, w - 0.2, 0.26, 0.4, '#a0683c'); mb.box(0, 0.26, -0.17, w - 0.2, 0.3, 0.06, '#a0683c'); mb.box(-0.7, 0, 0, 0.06, 0.3, 0.42, '#3a3a48'); mb.box(0.7, 0, 0, 0.06, 0.3, 0.42, '#3a3a48'); };
MODELS.pond = (mb, w, d) => { mb.cyl(0, 0, 0, 1.4, 1.45, 0.1, '#a8a090', 12); mb.cyl(0, 0.02, 0, 1.25, 1.25, 0.1, '#4aa8c8', 12, { glow: '#70c8e8' }); mb.box(0.6, 0.1, 0.3, 0.3, 0.03, 0.3, '#4cb85c'); mb.box(-0.5, 0.1, -0.4, 0.25, 0.03, 0.25, '#4cb85c'); mb.box(-0.5, 0.13, -0.4, 0.08, 0.06, 0.08, '#ffb0d0'); for (let i = 0; i < 6; i++) { const a = i; mb.box(Math.cos(a) * 1.35, 0, Math.sin(a) * 1.35, 0.3, 0.2, 0.3, '#8a8478'); } };
MODELS.clocktower = (mb) => { mb.box(0, 0, 0, 1.2, 0.3, 1.2, '#c8c0b0'); mb.box(0, 0.3, 0, 0.7, 2.4, 0.7, '#e8dcc0'); mb.box(0, 2.7, 0, 0.9, 0.7, 0.9, '#c8a070'); for (let f = 0; f < 4; f++) { const v = [[0, 0.46], [0.46, 0], [0, -0.46], [-0.46, 0]][f]; mb.cyl(v[0], 2.75, v[1], 0.28, 0.28, 0.6, '#f4f2ee', 8); } mb.gable(0, 3.4, 0, 1.0, 0.7, 1.0, '#3a7bd5'); mb.box(0, 2.85, 0.47, 0.04, 0.22, 0.02, '#2a2a36'); };
MODELS.snowman = (mb) => { mb.cyl(0, 0, 0, 0.35, 0.4, 0.5, '#ffffff', 8); mb.cyl(0, 0.5, 0, 0.25, 0.3, 0.4, '#ffffff', 8); mb.box(0, 0.9, 0, 0.3, 0.2, 0.3, '#2a2a36'); mb.box(0, 0.72, 0.27, 0.06, 0.06, 0.14, '#f39a3c'); mb.box(0, 0.45, 0, 0.62, 0.08, 0.1, '#e5484d'); };

// 滑走路・駐機場（テクスチャ）
const _runwayTexCache = new Map();
function runwayModel(def, num, lightsOn) {
  const g = new THREE.Group();
  const key = def.w + 'x' + def.h + ':' + num;
  let tex = _runwayTexCache.get(key);
  if (!tex) { tex = canvasTex(makeRunwayTexture(def.w, def.h, num)); _runwayTexCache.set(key, tex); }
  const geo = new THREE.PlaneGeometry(def.w, def.h); geo.rotateX(-Math.PI / 2);
  const m = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ map: tex }));
  m.position.y = 0.02; m.receiveShadow = true; g.add(m);
  const mb = new ModelBuilder();
  // 縁
  mb.box(0, -0.2, 0, def.w + 0.1, 0.21, def.h + 0.1, '#3a3a44', { skip: 't' });
  // ライト
  for (let i = 0; i <= def.w; i += 2) for (const z of [-def.h / 2 + 0.08, def.h / 2 - 0.08]) mb.box(-def.w / 2 + i, 0.02, z, 0.08, 0.06, 0.08, '#f4f4f4', { glow: '#fff0b0' });
  for (const e of [-1, 1]) for (let k = -1; k <= 1; k++) mb.box(e * (def.w / 2 - 0.08), 0.02, k * 0.6, 0.08, 0.06, 0.08, '#e0f0e0', { glow: e < 0 ? '#60ff80' : '#ff5050' });
  const ex = mb.build({ shadow: false });
  g.add(ex);
  return g;
}
function standModel(def, num) {
  const g = new THREE.Group();
  const tex = canvasTex(makeStandTexture(def.w, num));
  const geo = new THREE.PlaneGeometry(def.w, def.h); geo.rotateX(-Math.PI / 2);
  const m = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ map: tex }));
  m.position.y = 0.015; m.receiveShadow = true; g.add(m);
  const mb = new ModelBuilder();
  mb.box(0, -0.2, 0, def.w, 0.205, def.h, '#9a9aa4', { skip: 't' });
  mb.cyl(def.w / 2 - 0.25, 0, -def.h / 2 + 0.25, 0.04, 0.05, 1.8, '#9a9aa6', 4);
  mb.box(def.w / 2 - 0.25, 1.8, -def.h / 2 + 0.25, 0.3, 0.12, 0.3, '#5a5a66'); mb.box(def.w / 2 - 0.25, 1.76, -def.h / 2 + 0.25, 0.24, 0.04, 0.24, '#fff8e0', { glow: '#ffe8a0' });
  g.add(mb.build());
  return g;
}

// 建物の3Dモデルを作る（rot は外で適用）
function buildModel(id, opt) {
  opt = opt || {};
  const def = B[id];
  if (def.kind === 'runway') return runwayModel(def, opt.num || 9);
  if (def.kind === 'stand') return standModel(def, opt.num || 1);
  const mb = new ModelBuilder();
  const f = MODELS[id];
  if (f) f(mb, def.w, def.h, opt);
  else mb.box(0, 0, 0, def.w - 0.2, 1, def.h - 0.2, '#e5484d');
  // レベル表示
  if (opt.lv >= 3 && def.zone === 'term' && def.kind === 'svc') {
    mb.box(def.w / 2 - 0.2, (def.inside ? 1.15 : 1.0), def.h / 2 - 0.2, 0.18, 0.18, 0.18, opt.lv >= 5 ? '#ffd84a' : '#c0c0c8', { glow: opt.lv >= 5 ? '#ffe080' : '#e0e0f0' });
  }
  return mb.build();
}

// ============================================================
//  飛行機モデル（実在機の寸法・形にあわせて作る）
// ============================================================
const _planeGeoCache = new Map();
const LIGHT_MATS = {};
function lightMat(col) { return LIGHT_MATS[col] || (LIGHT_MATS[col] = new THREE.MeshBasicMaterial({ color: col, fog: false })); }
function planeModel(typeId, airlineId) {
  const key = typeId + ':' + airlineId;
  let gs = _planeGeoCache.get(key);
  if (!gs) { gs = makePlaneGeos(typeId, airlineId); _planeGeoCache.set(key, gs); }
  const g = new THREE.Group();
  const add = (geo, mat, shadow) => { if (!geo) return null; const m = new THREE.Mesh(geo, mat); m.castShadow = !!shadow; m.receiveShadow = !!shadow; m.userData.shared = true; g.add(m); return m; };
  add(gs.L, R.matLambert, true);
  add(gs.G, GlowMat());
  const gear = add(gs.gear, R.matLambert, true);
  const beacon = add(gs.beacon, lightMat('#ff2a2a'));
  const strobe = add(gs.strobe, lightMat('#ffffff'));
  const land = add(gs.land, lightMat('#fff6d0'));
  add(gs.nav, lightMat('#ffffff'));
  const props = [];
  for (const p of gs.props) { const pm = new THREE.Mesh(p.geo, R.matLambert); pm.position.copy(p.pos); pm.userData.shared = true; g.add(pm); props.push(pm); }
  g.userData = { gear, beacon, strobe, land, props, door: gs.door, fixedGear: gs.fixedGear };
  return g;
}
function makePlaneGeos(typeId, airlineId) {
  const P = PLANES[typeId], A = AIRLINES[airlineId] || AIRLINES.soyokaze;
  const mb = new ModelBuilder(), gearB = new ModelBuilder(), beaconB = new ModelBuilder(), strobeB = new ModelBuilder(), landB = new ModelBuilder(), navB = new ModelBuilder();
  const L = P.len, S = P.span, hs = S / 2;
  const space = P.eng === 'space', sst = P.eng === 'sst', prop = P.eng === 'prop';
  const fw = Math.max(0.16, P.dia / TILE_M * 1.3), fh = fw * (P.deck2 ? 1.22 : 1.04);
  const y0 = Math.max(0.07, fw * (prop ? 0.42 : 0.38));
  const zb = -L / 2, zf = L / 2;
  const body = A.body, tail = A.tail, acc = A.accent, belly = shade(body, -0.1);
  const WING = body === '#ffffff' || body === '#f8f4ec' ? '#cdd2dc' : shade(body, 0.1), WING2 = '#9aa0ae';
  const win = '#3a4a60', winGlow = '#ffe2a0';
  // ---- 胴体 ----
  const c0 = zb + L * (prop ? 0.24 : 0.22), c1 = zf - L * (P.deck2 ? 0.1 : 0.13);
  const mid = (c0 + c1) / 2, clen = c1 - c0;
  mb.box(0, y0 + fh * 0.12, mid, fw, fh * 0.76, clen, body);
  mb.box(0, y0, mid, fw * 0.78, fh, clen, body);
  mb.box(0, y0 - 0.005, mid, fw * 0.8, fh * 0.2, clen, belly);
  // 機首（3段で丸く）
  const nl = (zf - c1) / 3;
  [[0.9, 0.92, 0.0], [0.72, 0.8, 0.06], [0.46, 0.55, 0.16]].forEach(([sw, sh, lift], i) => {
    const z = c1 + nl * (i + 0.5);
    mb.box(0, y0 + fh * lift, z, fw * sw, fh * sh, nl, body);
    if (i === 1) mb.box(0, y0 + fh * (lift + sh * 0.62), z + nl * 0.1, fw * sw * (typeId === 'a350' ? 1.02 : 0.92), fh * 0.16, nl * 0.85, '#1e2836', { glow: '#556070' });
  });
  if (sst) mb.box(0, y0 + fh * 0.25, zf + nl * 0.5, fw * 0.28, fh * 0.25, nl, body);
  // 尾部（下が上がっていく）
  const tl = (c0 - zb) / 4;
  for (let i = 0; i < 4; i++) {
    const t = (i + 0.5) / 4, sh = 1 - t * 0.62, sw = 1 - t * 0.55;
    mb.box(0, y0 + fh * (1 - sh) * 0.92, c0 - tl * (i + 0.5), fw * sw, fh * sh, tl, body);
  }
  if (P.hump) { mb.box(0, y0 + fh * 0.9, c1 - L * 0.12, fw * 0.74, fh * 0.42, L * 0.26, body); mb.box(0, y0 + fh * 0.9, c1 + L * 0.02, fw * 0.6, fh * 0.32, L * 0.06, body); }
  // 窓・チートライン・ドア
  if (!P.cargo && !space) {
    const rows = P.deck2 ? [0.42, 0.74] : [0.56];
    for (const ry of rows) for (const sx of [-1, 1]) mb.box(sx * (fw / 2 + 0.003), y0 + fh * ry, mid + clen * 0.02, 0.005, fh * 0.09, clen * 0.94, win, { glow: winGlow });
    if (P.hump) for (const sx of [-1, 1]) mb.box(sx * (fw * 0.37 + 0.003), y0 + fh * 1.12, c1 - L * 0.12, 0.005, fh * 0.07, L * 0.2, win, { glow: winGlow });
    // ドア（左側）
    for (const dz of [c1 - L * 0.02, c0 + L * 0.03]) mb.box(fw / 2 + 0.004, y0 + fh * 0.3, dz, 0.004, fh * 0.5, Math.max(0.05, L * 0.022), shade(body, -0.18));
  }
  for (const sx of [-1, 1]) mb.box(sx * (fw / 2 + 0.006), y0 + fh * (P.deck2 ? 0.24 : 0.36), mid, 0.004, fh * 0.06, clen, acc);
  // ---- 主翼 ----
  const sweepDeg = prop ? 3 : sst || space ? 0 : typeId === 'swallow' ? 23 : P.wide ? 32 : 26;
  const tanS = Math.tan(sweepDeg * Math.PI / 180);
  const high = P.wing === 'high';
  const wingY = high ? y0 + fh * 0.96 : y0 + fh * 0.1;
  const wz = high ? L * 0.04 : -L * 0.03;
  const cr = prop ? L * 0.11 : L * 0.2, ct = prop ? cr * 0.62 : cr * 0.28;
  const LE = t => wz + cr / 2 - t * (hs - fw / 2) * tanS;
  const chord = t => lerp(cr, ct, t);
  const dih = t => high ? 0 : t * hs * 0.07;
  if (sst || space) {
    const n = 7;
    for (let i = 0; i < n; i++) { const t = i / n, half = hs * (1 - t); mb.box(0, y0 + 0.02 + (space ? 0 : 0.01), wz - L * 0.32 + t * L * 0.6, half * 2 + fw * 0.9, 0.05, L * 0.6 / n + 0.01, space ? '#d8dce8' : WING); }
    if (space) { mb.box(0, y0 - 0.01, wz - L * 0.05, fw * 1.05, 0.04, L * 0.75, '#22222c'); for (const sx of [-1, 1]) mb.box(sx * hs * 0.98, y0 + 0.05, wz - L * 0.3, 0.04, fh * 0.6, L * 0.12, tail); }
  } else {
    const n = 6;
    for (let i = 0; i < n; i++) {
      const t0 = i / n, t1 = (i + 1) / n, tm = (t0 + t1) / 2;
      const x0 = fw / 2 + t0 * (hs - fw / 2), x1 = fw / 2 + t1 * (hs - fw / 2);
      const c = chord(tm), zc = LE(tm) - c / 2;
      for (const sx of [-1, 1]) {
        mb.box(sx * (x0 + x1) / 2, wingY + dih(tm), zc, x1 - x0 + 0.012, 0.05, c, WING);
        mb.box(sx * (x0 + x1) / 2, wingY + dih(tm) + 0.051, zc - c * 0.38, x1 - x0, 0.003, c * 0.18, WING2); // フラップ
      }
    }
    mb.box(0, wingY, LE(0) - cr / 2, fw * 0.98, 0.05, cr, WING);
    // 翼端
    for (const sx of [-1, 1]) {
      const tx = sx * (hs - 0.02), tz = LE(1) - ct / 2, ty = wingY + dih(1);
      if (P.tip === 'blended') { mb.box(tx, ty, tz - ct * 0.1, 0.03, fh * 0.5, ct * 0.8, tail); }
      else if (P.tip === 'sharklet') { mb.box(tx, ty, tz, 0.03, fh * 0.38, ct * 0.65, tail); }
      else if (P.tip === 'curved') { mb.box(tx, ty, tz, 0.03, fh * 0.22, ct * 0.8, WING); mb.box(tx + sx * 0.02, ty + fh * 0.2, tz - ct * 0.15, 0.03, fh * 0.2, ct * 0.5, WING); }
      else if (P.tip === 'raked') { mb.box(tx + sx * hs * 0.04, ty + 0.01, tz - ct * 0.4, hs * 0.08, 0.04, ct * 0.55, WING); }
      else if (P.tip === 'fence') { mb.box(tx, ty - fh * 0.1, tz, 0.03, fh * 0.32, ct * 0.7, tail); }
      // 航行灯（左＝赤・右＝緑）と衝突防止灯
      const nxp = sx * (hs + (P.tip === 'raked' ? hs * 0.08 : 0)), nzp = tz + (P.tip === 'raked' ? -ct * 0.4 : 0);
      navB.box(nxp, ty + 0.02, nzp, 0.05, 0.05, 0.05, sx > 0 ? '#ff3030' : '#30ff60');
      strobeB.box(nxp, ty + 0.02, nzp - 0.05, 0.06, 0.06, 0.06, '#ffffff');
      landB.box(sx * (fw / 2 + 0.12), wingY + 0.01, LE(0.05) + 0.02, 0.07, 0.05, 0.03, '#fff6d0');
    }
  }
  // ---- 尾翼 ----
  const fin = fh * (prop ? 1.75 : P.deck2 ? 1.25 : 1.6), finZ = zb + L * 0.1;
  const finSweep = prop ? 0.06 : 0.1;
  if (!space) {
    for (let i = 0; i < 5; i++) { const t = i / 5; mb.box(0, y0 + fh * 0.75 + t * fin, finZ - t * L * finSweep, 0.05, fin / 5 + 0.005, L * (sst ? 0.22 : 0.16) * (1 - t * 0.5), tail); }
    mb.box(0, y0 + fh * 0.75 + fin * 0.45, finZ - L * finSweep * 0.5, 0.055, fin * 0.16, L * 0.08, acc);
    navB.box(0, y0 + fh * 0.75 + fin + 0.02, finZ - L * finSweep, 0.04, 0.04, 0.04, '#ffffff');
  } else {
    for (const sx of [-1, 1]) for (let i = 0; i < 4; i++) { const t = i / 4; mb.box(sx * (fw * 0.3 + t * 0.06), y0 + fh * 0.7 + t * fin * 0.8, finZ - t * L * 0.08, 0.04, fin * 0.2, L * 0.13 * (1 - t * 0.4), tail); }
  }
  const hsSpan = S * (P.wide ? 0.19 : 0.17);
  if (!sst && !space) {
    const tY = P.tail === 'T' ? y0 + fh * 0.75 + fin : y0 + fh * 0.62;
    const tZ = P.tail === 'T' ? finZ - L * finSweep - L * 0.02 : finZ - L * 0.01;
    for (let i = 0; i < 3; i++) { const t = (i + 0.5) / 3; for (const sx of [-1, 1]) mb.box(sx * (fw * 0.3 + t * hsSpan), tY, tZ - t * hsSpan * (prop ? 0.08 : 0.5), hsSpan / 3 + 0.01, 0.035, L * 0.085 * (1 - t * 0.45), P.tail === 'T' ? tail : WING); }
  }
  // ---- エンジン ----
  const props = [];
  if (P.eng === 'jet') {
    const ts = P.engines === 4 ? [0.3, 0.58] : [P.wide ? 0.33 : 0.36];
    const r = fw * (P.bigEng ? 0.4 : P.wide ? 0.33 : typeId === 'swallow' ? 0.3 : 0.27);
    const eL = L * (P.wide ? 0.12 : 0.13);
    for (const t of ts) for (const sx of [-1, 1]) {
      const x = sx * (fw / 2 + t * (hs - fw / 2)), z = LE(t) + r * 0.9, y = wingY + dih(t) - r * 1.05;
      mb.cylZ(x, y, z, r, eL, shade(acc === '#2a2a36' ? '#c8ccd4' : '#d8dce4', 0), 10);
      mb.cylZ(x, y, z + eL / 2, r * 0.78, 0.012, '#1a1a22', 10);
      mb.cylZ(x, y, z + eL / 2 - 0.004, r * 1.02, 0.03, '#a8acb8', 10);
      mb.cylZ(x, y, z - eL / 2 - 0.04, r * 0.5, 0.1, '#7a7e8a', 8);
      mb.box(x, y + r * 0.7, z - eL * 0.2, 0.04, r * 0.7, eL * 0.8, WING);
      if (typeId === 'kamome' || typeId === 'cargo_s') mb.box(x, y - r * 0.9, z, r * 1.6, 0.02, eL * 0.6, shade('#d8dce4', -0.08)); // おにぎり形
    }
  } else if (P.eng === 'rear') {
    for (const sx of [-1, 1]) { const r = fw * 0.28; mb.cylZ(sx * (fw / 2 + r * 1.1), y0 + fh * 0.62, zb + L * 0.27, r, L * 0.17, '#d8dce4', 8); mb.cylZ(sx * (fw / 2 + r * 1.1), y0 + fh * 0.62, zb + L * 0.355, r * 0.75, 0.01, '#1a1a22', 8); mb.box(sx * (fw / 2 + 0.03), y0 + fh * 0.62, zb + L * 0.27, r * 1.2, 0.04, L * 0.1, WING); }
  } else if (prop) {
    const t = P.engines === 2 ? 0.32 : 0.3;
    for (const sx of [-1, 1]) {
      const x = sx * (fw / 2 + t * (hs - fw / 2)), r = fw * 0.24, y = high ? wingY - r * 0.4 : wingY, z = LE(t) + L * 0.05;
      mb.cylZ(x, y, z, r, L * 0.2, body, 8);
      mb.cylZ(x, y, z + L * 0.1 + 0.02, r * 0.6, 0.06, '#3a3a44', 8);
      if (high) mb.box(x, y - r * 0.6, z - L * 0.04, r * 1.1, r * 0.8, L * 0.12, body);
      const pg = new ModelBuilder();
      const bl = S * (typeId === 'humming' ? 0.13 : 0.15);
      for (let k = 0; k < (typeId === 'humming' ? 3 : 6); k++) { const a = k / (typeId === 'humming' ? 3 : 6) * TAU; const m4 = new THREE.Matrix4().makeRotationZ(a); pg.setMat(m4); pg.box(0, 0, 0, 0.035, bl, 0.012, '#30303a'); }
      pg.setMat(null); pg.cylZ(0, 0, 0.02, r * 0.45, 0.08, acc, 8);
      props.push({ geo: pg.geos().L, pos: new THREE.Vector3(x, y, z + L * 0.1 + 0.06) });
    }
  } else if (sst) {
    for (const sx of [-1, 1]) for (const k of [0.2, 0.34]) mb.box(sx * k * hs * 1.6, y0 - 0.08, wz - L * 0.16, 0.13, 0.12, L * 0.25, '#c0c4cc');
  } else if (space) {
    for (const [ex, ey] of [[-0.13, 0.05], [0.13, 0.05], [0, 0.25]]) { mb.cylZ(ex, y0 + fh * 0.3 + ey, zb - 0.04, 0.11, 0.18, '#3a3a46', 8); mb.cylZ(ex, y0 + fh * 0.3 + ey, zb - 0.14, 0.08, 0.02, '#40e0ff', 8, { glow: '#9ff8ff' }); }
  }
  // ---- 脚 ----
  const G2 = P.gear === 'fixed' ? mb : gearB;
  const tire = '#1a1a22', strut = '#8a8e98';
  G2.box(0, 0, zf - L * 0.1, 0.03, y0, 0.03, strut); G2.box(0, 0, zf - L * 0.1, 0.06, 0.07, 0.08, tire);
  const mgX = high ? fw * 0.55 : fw * 0.42, mgZ = high ? wz - cr * 0.2 : LE(0.15) - cr * 0.45;
  const bogie = P.wide ? (P.deck2 ? 3 : 2) : 1;
  for (const sx of [-1, 1]) for (let k = 0; k < (P.deck2 ? 2 : 1); k++) {
    const x = sx * (mgX + k * fw * 0.25), z = mgZ - k * L * 0.05;
    G2.box(x, 0, z, 0.035, y0 + (high ? fh * 0.5 : 0), 0.035, strut);
    for (let b = 0; b < bogie; b++) G2.box(x, 0, z + (b - (bogie - 1) / 2) * 0.09, 0.08, 0.08, 0.08, tire);
    if (high) G2.box(x - sx * 0.05, y0 * 0.5, z, 0.12, 0.08, 0.2, body);
  }
  // ---- 衝突防止灯（上と下） ----
  beaconB.box(0, y0 + fh + (P.hump ? fh * 0.32 : 0) + 0.015, mid, 0.05, 0.03, 0.05, '#ff2a2a');
  beaconB.box(0, y0 - 0.02, mid, 0.05, 0.03, 0.05, '#ff2a2a');
  strobeB.box(0, y0 + fh * 0.6, zb - 0.02, 0.04, 0.04, 0.04, '#ffffff');
  landB.box(0, y0 + fh * 0.2, zf - L * 0.08, 0.06, 0.04, 0.04, '#fff6d0');
  const gs = mb.geos();
  gs.gear = gearB.geos().L; gs.beacon = beaconB.geos().L; gs.strobe = strobeB.geos().L; gs.land = landB.geos().L; gs.nav = navB.geos().L;
  gs.props = props; gs.fixedGear = P.gear === 'fixed';
  gs.door = new THREE.Vector3(fw / 2, y0 + fh * 0.45, c1 - L * 0.02);
  return gs;
}

// ============================================================
//  車両
// ============================================================
const VEH = {};
function vehicleGeo(kind, color) {
  const key = kind + ':' + (color || '');
  if (VEH[key]) return VEH[key];
  const mb = new ModelBuilder();
  switch (kind) {
    case 'bus': mb.box(0, 0.12, 0, 0.55, 0.55, 1.6, color || '#4cb85c'); mb.box(0, 0.4, 0, 0.57, 0.18, 1.5, '#3a4a5a', { glow: '#ffe8a0' }); mb.box(0, 0.12, 0, 0.57, 0.1, 1.62, '#ffffff'); break;
    case 'rampbus': mb.box(0, 0.1, 0, 0.6, 0.5, 1.7, '#f4f2ee'); mb.box(0, 0.32, 0, 0.62, 0.22, 1.6, '#3a4a5a', { glow: '#ffe8a0' }); mb.box(0, 0.1, 0, 0.62, 0.08, 1.72, '#3a7bd5'); break;
    case 'car': mb.box(0, 0.08, 0, 0.42, 0.22, 0.82, color); mb.box(0, 0.3, -0.05, 0.38, 0.18, 0.44, color); mb.box(0, 0.32, -0.05, 0.4, 0.12, 0.46, '#3a4a5a'); mb.box(0, 0.12, 0.42, 0.3, 0.06, 0.02, '#fff8e0', { glow: '#fff0b0' }); break;
    case 'taxi': mb.box(0, 0.08, 0, 0.42, 0.22, 0.82, '#ffd84a'); mb.box(0, 0.3, -0.05, 0.38, 0.18, 0.44, '#ffd84a'); mb.box(0, 0.32, -0.05, 0.4, 0.12, 0.46, '#3a4a5a'); mb.box(0, 0.48, -0.05, 0.12, 0.06, 0.08, '#ffffff', { glow: '#ffe080' }); break;
    case 'fuel': mb.box(0, 0.08, 0.35, 0.45, 0.4, 0.35, '#e5484d'); mb.cylZ(0, 0.35, -0.15, 0.22, 0.7, '#f4f2ee', 8); mb.box(0, 0.08, -0.15, 0.4, 0.1, 0.75, '#3a3a44'); break;
    case 'tug': mb.box(0, 0.04, 0, 0.5, 0.16, 0.75, '#ffd84a'); mb.box(0, 0.2, -0.22, 0.34, 0.16, 0.2, '#3a4a5a'); mb.box(0, 0.08, 0.42, 0.08, 0.06, 0.25, '#4a4a58'); mb.box(0, 0.2, 0.05, 0.08, 0.06, 0.08, '#ff9030', { glow: '#ffb040' }); break;
    case 'belt': mb.box(0, 0.05, 0.2, 0.32, 0.18, 0.4, '#e8e8f0'); { const m4 = new THREE.Matrix4().makeTranslation(0, 0.25, -0.15).multiply(new THREE.Matrix4().makeRotationX(0.45)); mb.setMat(m4); mb.box(0, 0, 0, 0.2, 0.04, 0.8, '#3a3a44'); mb.setMat(null); } break;
    case 'gpu': mb.box(0, 0.05, 0, 0.3, 0.25, 0.4, '#4cb85c'); break;
    case 'cart': mb.box(0, 0.06, 0.3, 0.35, 0.25, 0.3, '#f39a3c'); for (let i = 0; i < 2; i++) { mb.box(0, 0.08, -0.15 - i * 0.45, 0.4, 0.06, 0.38, '#9a9aa6'); mb.box(-0.05, 0.14, -0.15 - i * 0.45, 0.2, 0.15, 0.2, ['#e5484d', '#4a8fe0'][i]); mb.box(0.1, 0.14, -0.15 - i * 0.45, 0.12, 0.12, 0.2, '#ffd84a'); } break;
    case 'catering': mb.box(0, 0.08, 0.38, 0.45, 0.35, 0.3, '#f4f2ee'); mb.box(0, 0.4, -0.12, 0.5, 0.5, 0.75, '#f4f2ee'); mb.box(0, 0.08, -0.12, 0.42, 0.32, 0.7, '#9a9aa6'); mb.box(0, 0.6, 0.27, 0.51, 0.1, 0.02, color || '#3a7bd5'); break;
    case 'stairs': mb.box(0, 0.06, 0.2, 0.4, 0.2, 0.5, '#f4f2ee'); for (let i = 0; i < 4; i++) mb.box(0, 0.26 + i * 0.1, -0.1 - i * 0.12, 0.3, 0.05, 0.14, '#c0c0c8'); break;
    case 'fire': mb.box(0, 0.08, 0, 0.55, 0.5, 1.1, '#e5484d'); mb.box(0, 0.58, 0.2, 0.45, 0.06, 0.6, '#c0c0c8'); mb.box(0, 0.58, -0.3, 0.12, 0.08, 0.12, '#4a8fe0', { glow: '#60a0ff' }); break;
    case 'snowplow': mb.box(0, 0.08, 0, 0.5, 0.45, 0.8, '#f39a3c'); mb.box(0, 0.05, 0.5, 0.75, 0.3, 0.08, '#ffd84a'); mb.box(0, 0.53, -0.1, 0.3, 0.06, 0.06, '#ffd84a', { glow: '#ffb020' }); break;
    case 'robot': mb.cyl(0, 0.02, 0, 0.18, 0.18, 0.1, '#f4f2ee', 8); mb.box(0, 0.12, 0.05, 0.08, 0.04, 0.08, '#4cb85c', { glow: '#60ff80' }); break;
    case 'train':
      for (let i = 0; i < 3; i++) { mb.box(0, 0.1, -i * 2.1, 0.7, 0.75, 2.0, '#f4f2ee'); mb.box(0, 0.5, -i * 2.1, 0.72, 0.22, 1.9, '#3a4a5a', { glow: '#ffe8a0' }); mb.box(0, 0.2, -i * 2.1, 0.72, 0.08, 2.0, '#3a7bd5'); }
      mb.box(0, 0.1, 1.05, 0.6, 0.6, 0.12, '#3a7bd5'); break;
    case 'heli': mb.box(0, 0, 0, 0.5, 0.4, 0.8, '#e5484d'); mb.box(0, 0.15, 0.4, 0.4, 0.22, 0.1, '#8fc8e8'); mb.box(0, 0.2, -0.75, 0.1, 0.1, 0.8, '#e5484d'); mb.box(0, 0.25, -1.1, 0.04, 0.3, 0.2, '#e5484d'); break;
    case 'blimp': mb.cylZ(0, 0, 0, 0.6, 3, '#f4f2ee', 10); mb.cylZ(0, 0, 1.55, 0.4, 0.2, '#f4f2ee', 10); mb.box(0, -0.6, 0, 0.3, 0.2, 0.7, '#3a7bd5'); mb.box(0, 0, -1.5, 1.4, 0.04, 0.3, '#3a7bd5'); mb.box(0, 0, -1.5, 0.04, 1.4, 0.3, '#3a7bd5'); break;
  }
  VEH[key] = mb.geos();
  return VEH[key];
}
function vehicleMesh(kind, color) {
  const gs = vehicleGeo(kind, color);
  const g = new THREE.Group();
  if (gs.L) { const m = new THREE.Mesh(gs.L, R.matLambert); m.castShadow = true; g.add(m); }
  if (gs.G) g.add(new THREE.Mesh(gs.G, GlowMat()));
  return g;
}
