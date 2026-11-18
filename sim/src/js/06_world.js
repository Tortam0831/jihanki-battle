// ============================================================
//  マップ（地形・床・建物の配置・経路）
// ============================================================
const World = {
  chunkMeshes: [], floraMeshes: [], wallMesh: null, glassMesh: null, lockMesh: null, gridMesh: null,
  bldGroup: null, tileTex: null, tileMat: null, dirtyChunks: new Set(), dirtyFlora: new Set(), dirtyWalls: true, wallRot: -1,
  season: -1,
};
const FLOOR_H = { 0: 0, 1: 0.005, 2: 0, 3: 0, 4: 0.07, 5: 0.035, 6: 0.005, 7: 0 };
function floorH(x, y) { return inMap(x, y) ? FLOOR_H[G.floor[idx(x, y)]] || 0 : 0; }
function secOf(x, y) { return Math.floor(y / SEC) * SECW + Math.floor(x / SEC); }
function unlocked(x, y) { return inMap(x, y) && G.sectors[secOf(x, y)] === 1; }
function isLand(x, y) { return inMap(x, y) && G.ter[idx(x, y)] !== TER.WATER; }
function bAt(x, y) { if (!inMap(x, y)) return null; const u = G.occ[idx(x, y)]; return u ? G.blds[u] : null; }
function dims(def, rot) { return rot % 2 ? [def.h, def.w] : [def.w, def.h]; }
function frontDir(rot) { return DIRS4[rot % 4]; }
function bCenter(b) { const [w, h] = dims(B[b.id], b.rot); return { x: b.x + w / 2, z: b.y + h / 2 }; }

// ---------- マップ生成 ----------
function genMap(seed) {
  const rng = mulberry32(seed || 777);
  G.ter = new Uint8Array(W * H); G.floor = new Uint8Array(W * H); G.trees = new Uint8Array(W * H);
  G.occ = new Int32Array(W * H); G.sectors = new Uint8Array(SECW * SECH);
  const noise = (x, y, s) => {
    let v = 0, a = 1, f = 1 / 8, t = 0;
    for (let o = 0; o < 3; o++) {
      const xx = x * f, yy = y * f, x0 = Math.floor(xx), y0 = Math.floor(yy), fx = smooth(xx - x0), fy = smooth(yy - y0);
      const n = lerp(lerp(hash2(x0, y0, s + o), hash2(x0 + 1, y0, s + o), fx), lerp(hash2(x0, y0 + 1, s + o), hash2(x0 + 1, y0 + 1, s + o), fx), fy);
      v += n * a; t += a; a *= 0.5; f *= 2;
    }
    return v / t;
  };
  const s = Math.floor(rng() * 1000);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const d = Math.min(x, y, W - 1 - x, (H - 1 - y) * 0.7);
    const n = noise(x, y, s) * 4.2;
    const i = idx(x, y);
    if (d + n < 3.2) G.ter[i] = TER.WATER;
    else if (d + n < 4.6) G.ter[i] = TER.SAND;
    else G.ter[i] = TER.GRASS;
    // 木
    if (G.ter[i] === TER.GRASS) {
      const tn = noise(x + 100, y + 50, s + 9);
      const inStart = x >= 24 && x < 48 && y >= 12 && y < 36;
      if (tn > (inStart ? 0.66 : 0.55) && rng() < 0.75) G.trees[i] = rng() < 0.25 ? 2 : rng() < 0.15 ? 3 : 1;
    }
  }
  // 開始の土地
  for (const [sx, sy] of [[2, 1], [3, 1], [2, 2], [3, 2]]) G.sectors[sy * SECW + sx] = 1;
  // 橋と道路（北から）
  const rx = 35;
  for (let y = 0; y <= 11; y++) { G.floor[idx(rx, y)] = FLOOR.ROAD; G.floor[idx(rx + 1, y)] = FLOOR.ROAD; G.trees[idx(rx, y)] = 0; G.trees[idx(rx + 1, y)] = 0; G.trees[idx(rx - 1, y)] = 0; G.trees[idx(rx + 2, y)] = 0; }
  // 開始エリアの木を少しへらす
  for (let y = 12; y < 20; y++) for (let x = 28; x < 44; x++) G.trees[idx(x, y)] = 0;
}
function setupStart() {
  G.blds = {}; G.nextUid = 1;
  // 初期のバス停と歩道
  for (let x = 31; x <= 40; x++) { G.floor[idx(x, 13)] = FLOOR.WALK; G.trees[idx(x, 13)] = 0; G.trees[idx(x, 12)] = 0; }
  G.floor[idx(35, 12)] = FLOOR.ROAD; G.floor[idx(36, 12)] = FLOOR.ROAD;
  placeBuilding('busstop', 33, 12, 0, { free: true, silent: true, fixed: true });
}

// ---------- 置けるか判定 ----------
function canPlace(id, x, y, rot, opt) {
  opt = opt || {};
  const def = B[id]; if (!def) return { ok: false, reason: '?' };
  const [w, h] = dims(def, rot);
  let treeCost = 0;
  if (!opt.ignoreRank && def.rank > G.rank && !G.free) return { ok: false, reason: `ランク${def.rank}で解放` };
  if (def.unique && !opt.move && Object.values(G.blds).some(b => b.id === id)) return { ok: false, reason: 'ひとつしか建てられません' };
  if (def.winter && dateOf(G.day).season !== 3) return { ok: false, reason: '冬だけ作れます' };
  let zoneT = null;
  for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) {
    if (!inMap(xx, yy)) return { ok: false, reason: 'マップの外です' };
    if (!unlocked(xx, yy)) return { ok: false, reason: 'まだ買っていない土地です' };
    if (!isLand(xx, yy)) return { ok: false, reason: '水の上には置けません' };
    const i = idx(xx, yy);
    if (G.occ[i] && G.occ[i] !== opt.ignoreUid) return { ok: false, reason: 'ほかの建物と重なっています' };
    const f = G.floor[i];
    if (def.zone === 'term') { if (f !== FLOOR.TERM) return { ok: false, reason: 'ターミナル床の上に置いてください' }; }
    else if (def.zone === 'any') {
      const t = f === FLOOR.TERM ? 'T' : f === FLOOR.NONE ? 'N' : 'X';
      if (t === 'X') return { ok: false, reason: '芝生かターミナル床の上に置いてください' };
      if (zoneT && zoneT !== t) return { ok: false, reason: '床がまたがっています' };
      zoneT = t;
    } else {
      if (f !== FLOOR.NONE) return { ok: false, reason: '何もない芝生の上に置いてください' };
    }
    if (G.trees[i]) treeCost += 2000;
  }
  const cost = opt.free || opt.move ? 0 : def.cost + treeCost;
  if (!opt.free && !opt.move && G.money < cost && !G.free) return { ok: false, reason: 'お金が足りません', cost };
  return { ok: true, cost };
}
function placeBuilding(id, x, y, rot, opt) {
  opt = opt || {};
  const def = B[id];
  const chk = canPlace(id, x, y, rot, opt);
  if (!chk.ok) return null;
  const [w, h] = dims(def, rot);
  const uid = opt.uid || G.nextUid++;
  const b = { uid, id, x, y, rot, lv: opt.lv || 1, day: G.day, fixed: !!opt.fixed, num: opt.num || 0 };
  if (def.kind === 'runway') b.num = opt.num || runwayNumber(rot);
  if (def.kind === 'stand' || def.kind === 'gate') b.num = opt.num || nextNum(def.kind);
  for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) {
    const i = idx(xx, yy);
    G.occ[i] = uid; G.trees[i] = 0;
    if (def.kind === 'runway') G.floor[i] = FLOOR.RUNWAY;
    if (def.kind === 'stand') G.floor[i] = FLOOR.APRON;
    markChunk(xx, yy);
  }
  G.blds[uid] = b;
  if (!opt.free && !opt.move && !G.free) { G.money -= chk.cost; G.stat.buildCost += chk.cost; }
  spawnBuildingMesh(b);
  worldChanged(def);
  if (!opt.silent) { Bus.emit('built', b); }
  return b;
}
function runwayNumber(rot) { return rot % 2 ? 36 : 9; }
function nextNum(kind) {
  const used = new Set(Object.values(G.blds).filter(b => B[b.id].kind === kind).map(b => b.num));
  let n = 1; while (used.has(n)) n++; return n;
}
function removeBuilding(uid, opt) {
  opt = opt || {};
  const b = G.blds[uid]; if (!b) return;
  const def = B[b.id];
  const [w, h] = dims(def, b.rot);
  for (let yy = b.y; yy < b.y + h; yy++) for (let xx = b.x; xx < b.x + w; xx++) {
    const i = idx(xx, yy);
    if (G.occ[i] === uid) G.occ[i] = 0;
    if (def.kind === 'runway' || def.kind === 'stand') G.floor[i] = FLOOR.NONE;
    markChunk(xx, yy);
  }
  delete G.blds[uid];
  if (b.mesh) { World.bldGroup.remove(b.mesh); disposeObj(b.mesh); }
  if (!opt.move) {
    const refund = Math.floor(def.cost * 0.5 * (1 + (b.lv - 1) * 0.5));
    if (!opt.noRefund) G.money += refund;
    Bus.emit('removed', b, refund);
  }
  worldChanged(def);
}
function disposeObj(o) {
  o.traverse(m => { if (m.geometry && !m.userData.shared) m.geometry.dispose(); if (m.material && m.material.map && m.material.map !== R.texIcons && !m.material.userData.keep) { /* 滑走路テクスチャはキャッシュ */ } });
}
function worldChanged(def) {
  RT.dirtyWalk = true; RT.dirtyAir = true; RT.dirtyBeauty = true; RT.dirtyCombo = true; RT.dirtyLinks = true;
  RT.fieldCache.clear(); RT.planePathCache.clear();
  if (!def || def.paint === FLOOR.TERM || def.zone === 'term') World.dirtyWalls = true;
}
function markChunk(x, y) {
  const c = Math.floor(y / SEC) * SECW + Math.floor(x / SEC);
  World.dirtyChunks.add(c); World.dirtyFlora.add(c);
  // となりのチャンクの側面も
  if (x % SEC === 0 && x > 0) { World.dirtyChunks.add(c - 1); }
  if (x % SEC === SEC - 1 && x < W - 1) { World.dirtyChunks.add(c + 1); }
  if (y % SEC === 0 && y > 0) { World.dirtyChunks.add(c - SECW); }
  if (y % SEC === SEC - 1 && y < H - 1) { World.dirtyChunks.add(c + SECW); }
}

// ---------- 床ぬり ----------
function paintCheck(id, x0, y0, x1, y1) {
  const def = B[id]; const f = def.paint;
  const xa = Math.min(x0, x1), xb = Math.max(x0, x1), ya = Math.min(y0, y1), yb = Math.max(y0, y1);
  const tiles = [];
  let cost = 0;
  for (let y = ya; y <= yb; y++) for (let x = xa; x <= xb; x++) {
    if (!unlocked(x, y) || !isLand(x, y)) continue;
    const i = idx(x, y);
    if (G.occ[i]) continue;
    const cur = G.floor[i];
    if (cur === f) continue;
    if (cur !== FLOOR.NONE && !((f === FLOOR.TERM && cur === FLOOR.WALK) || (f === FLOOR.WALK && (cur === FLOOR.TERM || cur === FLOOR.ROAD)) || (f === FLOOR.ROAD && cur === FLOOR.WALK) || (f === FLOOR.TAXI && cur === FLOOR.WALK))) continue;
    tiles.push(i);
    cost += def.cost + (G.trees[i] ? 2000 : 0);
  }
  if (G.free) cost = 0;
  return { tiles, cost };
}
function paintApply(id, x0, y0, x1, y1) {
  const def = B[id];
  const { tiles, cost } = paintCheck(id, x0, y0, x1, y1);
  if (!tiles.length) return 0;
  if (G.money < cost && !G.free) { toast('お金が足りません', 'bad'); Sound.se('error'); return -1; }
  if (!G.free) { G.money -= cost; G.stat.buildCost += cost; }
  for (const i of tiles) { G.floor[i] = def.paint; G.trees[i] = 0; markChunk(i % W, Math.floor(i / W)); }
  worldChanged(def);
  World.dirtyWalls = true;
  Bus.emit('painted', id, tiles.length);
  return tiles.length;
}
function clearFloor(x0, y0, x1, y1) {
  const xa = Math.min(x0, x1), xb = Math.max(x0, x1), ya = Math.min(y0, y1), yb = Math.max(y0, y1);
  let n = 0, refund = 0;
  for (let y = ya; y <= yb; y++) for (let x = xa; x <= xb; x++) {
    if (!inMap(x, y) || !unlocked(x, y)) continue;
    const i = idx(x, y);
    if (G.occ[i]) continue;
    const f = G.floor[i];
    if (f === FLOOR.NONE || f === FLOOR.RUNWAY || f === FLOOR.APRON) { if (G.trees[i]) { G.trees[i] = 0; markChunk(x, y); n++; } continue; }
    if (isFixedRoad(x, y)) continue;
    const def = Object.values(B).find(d => d.paint === f);
    refund += def ? def.cost * 0.5 : 0;
    G.floor[i] = FLOOR.NONE; n++; markChunk(x, y);
  }
  if (n) { G.money += refund; worldChanged(null); World.dirtyWalls = true; }
  return n;
}
function isFixedRoad(x, y) { return y <= 12 && (x === 35 || x === 36) && G.floor[idx(x, y)] === FLOOR.ROAD; }

// ---------- 土地 ----------
function sectorPrice() {
  let n = 0; for (const v of G.sectors) n += v;
  return LAND_COST[Math.min(n, LAND_COST.length - 1)] || 100000000;
}
function canBuySector(sx, sy) {
  if (G.sectors[sy * SECW + sx]) return false;
  for (const [dx, dy] of DIRS4) { const nx = sx + dx, ny = sy + dy; if (nx >= 0 && ny >= 0 && nx < SECW && ny < SECH && G.sectors[ny * SECW + nx]) return true; }
  return false;
}
function landTilesIn(sx, sy) { let n = 0; for (let y = sy * SEC; y < sy * SEC + SEC; y++) for (let x = sx * SEC; x < sx * SEC + SEC; x++) if (isLand(x, y)) n++; return n; }
function buySector(sx, sy) {
  const p = sectorPrice();
  if (!canBuySector(sx, sy)) return false;
  if (G.money < p && !G.free) { toast('お金が足りません', 'bad'); Sound.se('error'); return false; }
  if (!G.free) G.money -= p;
  G.sectors[sy * SECW + sx] = 1;
  for (let y = sy * SEC; y < sy * SEC + SEC; y++) for (let x = sx * SEC; x < sx * SEC + SEC; x++) markChunk(x, y);
  buildLockMesh();
  Sound.se('levelup');
  toast(`土地を買いました（${fmtYen(p)}）`, 'good');
  Bus.emit('land');
  return true;
}

// ============================================================
//  メッシュ作り
// ============================================================
function initWorldMeshes() {
  World.tileCanvas = makeTileAtlas(dateOf(G.day).season);
  World.tileTex = canvasTex(World.tileCanvas);
  World.tileMat = new THREE.MeshLambertMaterial({ map: World.tileTex });
  World.bldGroup = new THREE.Group(); R.scene.add(World.bldGroup);
  World.season = dateOf(G.day).season;
  for (let c = 0; c < SECW * SECH; c++) { World.dirtyChunks.add(c); World.dirtyFlora.add(c); }
  World.dirtyWalls = true;
  buildLockMesh();
  buildGridMesh();
  for (const b of Object.values(G.blds)) spawnBuildingMesh(b);
}
function resetWorldMeshes() {
  for (const m of World.chunkMeshes) if (m) { R.scene.remove(m); m.geometry.dispose(); }
  for (const m of World.floraMeshes) if (m) { R.scene.remove(m); m.traverse(o => o.geometry && o.geometry.dispose()); }
  World.chunkMeshes = []; World.floraMeshes = [];
  if (World.bldGroup) { R.scene.remove(World.bldGroup); World.bldGroup = null; }
  if (World.wallMesh) { R.scene.remove(World.wallMesh); World.wallMesh = null; }
  if (World.lockMesh) { R.scene.remove(World.lockMesh); World.lockMesh = null; }
  if (World.gridMesh) { R.scene.remove(World.gridMesh); World.gridMesh = null; }
}
function setSeasonVisual(season) {
  if (World.season === season) return;
  World.season = season;
  const ctx = World.tileCanvas.getContext('2d');
  drawGrassTiles(ctx, season);
  World.tileTex.needsUpdate = true;
  for (let c = 0; c < SECW * SECH; c++) World.dirtyFlora.add(c);
  for (const b of Object.values(G.blds)) { const d = B[b.id]; if (d.cat === 'deco' || b.id === 'park') refreshBuildingMesh(b); }
}
function updateWorldMeshes() {
  if (World.dirtyChunks.size) { for (const c of World.dirtyChunks) buildChunk(c); World.dirtyChunks.clear(); }
  if (World.dirtyFlora.size) { for (const c of World.dirtyFlora) buildFlora(c); World.dirtyFlora.clear(); }
  if (World.dirtyWalls || World.wallRot !== Cam.rot) { buildWalls(); World.dirtyWalls = false; World.wallRot = Cam.rot; }
}
function tileUV(t, inset) {
  const [x, y] = tileXY(t); inset = inset == null ? 0.5 : inset;
  return [(x + inset) / 256, 1 - (y + 16 - inset) / 256, (x + 16 - inset) / 256, 1 - (y + inset) / 256];
}
function isTaxiLike(x, y) { if (!inMap(x, y)) return false; const f = G.floor[idx(x, y)]; return f === FLOOR.TAXI || f === FLOOR.RUNWAY || f === FLOOR.APRON; }
function buildChunk(c) {
  const cx = (c % SECW) * SEC, cy = Math.floor(c / SECW) * SEC;
  const P = [], N = [], U = [];
  const quad = (a, b, cc, d, n, uv) => {
    const [u0, v0, u1, v1] = uv;
    P.push(...a, ...b, ...cc, ...a, ...cc, ...d);
    for (let k = 0; k < 6; k++) N.push(...n);
    U.push(u0, v0, u1, v0, u1, v1, u0, v0, u1, v1, u0, v1);
  };
  const DEPTH = -1.2;
  for (let y = cy; y < cy + SEC; y++) for (let x = cx; x < cx + SEC; x++) {
    const i = idx(x, y), ter = G.ter[i], f = G.floor[i];
    const water = ter === TER.WATER;
    if (water && f !== FLOOR.ROAD) continue;
    const h = water ? 0.02 : FLOOR_H[f] || 0;
    let t;
    if (f === FLOOR.TAXI) {
      const m = (isTaxiLike(x, y - 1) ? 1 : 0) | (isTaxiLike(x + 1, y) ? 2 : 0) | (isTaxiLike(x, y + 1) ? 4 : 0) | (isTaxiLike(x - 1, y) ? 8 : 0);
      t = TILE.TAXI + m;
    } else if (f === FLOOR.ROAD) {
      const rl = (xx, yy) => inMap(xx, yy) && G.floor[idx(xx, yy)] === FLOOR.ROAD;
      const m = (rl(x, y - 1) ? 1 : 0) | (rl(x + 1, y) ? 2 : 0) | (rl(x, y + 1) ? 4 : 0) | (rl(x - 1, y) ? 8 : 0);
      t = TILE.ROAD + m;
    } else if (f === FLOOR.TERM) t = ((x >> 1) + (y >> 1)) % 2 ? TILE.TFLOOR : TILE.TFLOOR2;
    else if (f === FLOOR.WALK) t = TILE.WALK;
    else if (f === FLOOR.RUNWAY || f === FLOOR.APRON) t = TILE.APRON;
    else t = ter === TER.SAND ? TILE.SAND : TILE.GRASS + Math.floor(hash2(x, y, 1) * 4);
    quad([x, h, y + 1], [x + 1, h, y + 1], [x + 1, h, y], [x, h, y], [0, 1, 0], tileUV(t));
    // 側面
    const sideT = ter === TER.SAND ? TILE.SIDE_SAND : TILE.SIDE_GRASS;
    for (let d = 0; d < 4; d++) {
      const [dx, dy] = DIRS4[d], nx = x + dx, ny = y + dy;
      let nh;
      const nWater = !inMap(nx, ny) || (G.ter[idx(nx, ny)] === TER.WATER && G.floor[idx(nx, ny)] !== FLOOR.ROAD);
      if (nWater) nh = water ? -0.35 : DEPTH; else nh = (G.ter[idx(nx, ny)] === TER.WATER ? 0.02 : FLOOR_H[G.floor[idx(nx, ny)]] || 0);
      if (nh >= h - 0.001) continue;
      let st = nWater ? (water ? TILE.SIDE_ROCK : sideT) : (f === FLOOR.TERM ? TILE.SIDE_ROCK : f === FLOOR.WALK ? TILE.PLAZA : TILE.SIDE_DIRT);
      const uv = tileUV(st);
      // 側面のUVは高さに合わせる
      const vh = (h - nh) / 1.2;
      const uvS = [uv[0], uv[3] - (uv[3] - uv[1]) * Math.min(1, vh), uv[2], uv[3]];
      if (d === 0) quad([x + 1, nh, y + 1], [x, nh, y + 1], [x, h, y + 1], [x + 1, h, y + 1], [0, 0, 1], uvS);       // +z
      else if (d === 1) quad([x + 1, nh, y], [x + 1, nh, y + 1], [x + 1, h, y + 1], [x + 1, h, y], [1, 0, 0], uvS); // +x
      else if (d === 2) quad([x, nh, y], [x + 1, nh, y], [x + 1, h, y], [x, h, y], [0, 0, -1], uvS);                // -z
      else quad([x, nh, y + 1], [x, nh, y], [x, h, y], [x, h, y + 1], [-1, 0, 0], uvS);                            // -x
    }
  }
  if (World.chunkMeshes[c]) { R.scene.remove(World.chunkMeshes[c]); World.chunkMeshes[c].geometry.dispose(); World.chunkMeshes[c] = null; }
  if (!P.length) return;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2));
  geo.computeBoundingSphere();
  const m = new THREE.Mesh(geo, World.tileMat);
  m.receiveShadow = true;
  R.scene.add(m); World.chunkMeshes[c] = m;
}
const MERGE_DECOR = { tree: 'round', sakura: 'sakura', pine: 'pine', palm: 'palm', bush: 'bush' };
function buildFlora(c) {
  const cx = (c % SECW) * SEC, cy = Math.floor(c / SECW) * SEC;
  const season = dateOf(G.day).season;
  const mb = new ModelBuilder();
  for (let y = cy; y < cy + SEC; y++) for (let x = cx; x < cx + SEC; x++) {
    const i = idx(x, y);
    const t = G.trees[i];
    if (t) {
      const ox = (hash2(x, y, 3) - 0.5) * 0.3, oz = (hash2(x, y, 4) - 0.5) * 0.3, s = 0.85 + hash2(x, y, 5) * 0.4;
      treeShape(mb, x + 0.5 + ox, y + 0.5 + oz, t === 2 ? 'pine' : t === 3 ? 'bush' : 'round', season, s);
    }
    // 橋
    if (G.ter[i] === TER.WATER && G.floor[i] === FLOOR.ROAD) {
      const rl = (xx, yy) => inMap(xx, yy) && G.floor[idx(xx, yy)] === FLOOR.ROAD;
      if (!rl(x - 1, y)) mb.box(x + 0.06, 0.02, y + 0.5, 0.1, 0.35, 1.0, '#d8d8e0');
      if (!rl(x + 1, y)) mb.box(x + 0.94, 0.02, y + 0.5, 0.1, 0.35, 1.0, '#d8d8e0');
      mb.box(x + 0.5, -0.5, y + 0.5, 1.0, 0.52, 1.0, '#9a9aa6', { skip: 't' });
      if (y % 3 === 0) mb.box(x + 0.5, -1.4, y + 0.5, 0.4, 1.0, 0.4, '#8a8a96');
    }
    // 道路の街灯（自動）
    if (G.floor[i] === FLOOR.ROAD && y % 4 === 1 && !(inMap(x - 1, y) && G.floor[idx(x - 1, y)] === FLOOR.ROAD)) {
      mb.cyl(x + 0.08, 0.02, y + 0.5, 0.03, 0.04, 1.2, '#4a4a58', 4); mb.box(x + 0.2, 1.2, y + 0.5, 0.3, 0.06, 0.12, '#4a4a58'); mb.box(x + 0.3, 1.16, y + 0.5, 0.14, 0.04, 0.1, '#fff8e0', { glow: '#ffe8a0' });
    }
  }
  // まとめて描く小さなかざり
  for (const b of Object.values(G.blds)) {
    const k = MERGE_DECOR[b.id];
    if (!k) continue;
    if (b.x < cx || b.x >= cx + SEC || b.y < cy || b.y >= cy + SEC) continue;
    treeShape(mb, b.x + 0.5, b.y + 0.5, k, season, k === 'sakura' || k === 'pine' ? 1.1 : 1);
    if (k === 'sakura' && season === 0 && hash2(b.x, b.y, 2) > 0.5) mb.box(b.x + 0.2, 0.01, b.y + 0.7, 0.2, 0.01, 0.2, '#ffc0d8');
  }
  if (World.floraMeshes[c]) { R.scene.remove(World.floraMeshes[c]); World.floraMeshes[c].traverse(o => o.geometry && o.geometry.dispose()); World.floraMeshes[c] = null; }
  const g = mb.build();
  if (g.children.length) { R.scene.add(g); World.floraMeshes[c] = g; }
}
// ターミナルのガラス壁（カメラ側の壁は低くする）
function buildWalls() {
  if (World.wallMesh) { R.scene.remove(World.wallMesh); World.wallMesh.traverse(o => o.geometry && o.geometry.dispose()); }
  const mb = new ModelBuilder();
  const glassMb = new ModelBuilder();
  const LP = [];
  const yaw = Cam.yawT;
  const camDir = [Math.sin(yaw), Math.cos(yaw)]; // カメラのいる方向（x,z）
  const isT = (x, y) => inMap(x, y) && G.floor[idx(x, y)] === FLOOR.TERM;
  const FH = FLOOR_H[FLOOR.TERM];
  const WH = 1.55;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!isT(x, y)) continue;
    { const h = FH + 0.012; LP.push(x, h, y + 1, x + 1, h, y + 1, x + 1, h, y, x, h, y + 1, x + 1, h, y, x, h, y); }
    for (let d = 0; d < 4; d++) {
      const [dx, dy] = DIRS4[d], nx = x + dx, ny = y + dy;
      if (isT(nx, ny)) continue;
      const nf = inMap(nx, ny) ? G.floor[idx(nx, ny)] : 0;
      const door = nf === FLOOR.WALK || nf === FLOOR.ROAD;
      const facing = dx * camDir[0] + dy * camDir[1] > 0.1;
      const h = facing ? 0.32 : WH;
      // 壁の中心
      const ex = x + 0.5 + dx * 0.47, ez = y + 0.5 + dy * 0.47;
      const lx = dy !== 0 ? 1 : 0.07, lz = dx !== 0 ? 1 : 0.07;
      if (door) {
        // 自動ドア：わくだけ
        mb.box(ex - (dy !== 0 ? 0.46 : 0), FH, ez - (dx !== 0 ? 0.46 : 0), 0.08, facing ? 0.4 : WH, 0.08, '#d8d8e0');
        if (!facing) mb.box(ex, FH + WH - 0.15, ez, lx, 0.15, lz, '#c8ccd4');
        else mb.box(ex, FH, ez, lx, 0.06, lz, '#3a7bd5');
        continue;
      }
      mb.box(ex, FH, ez, lx, 0.14, lz, '#d8d8e0');
      if (h > 0.4) {
        glassMb.box(ex, FH + 0.14, ez, lx * 0.98, h - 0.28, lz, '#9fd4ee', { glow: '#ffe6a8' });
        mb.box(ex, FH + h - 0.14, ez, lx, 0.14, lz, '#d8d8e0');
        // 柱
        mb.box(ex - (dy !== 0 ? 0.46 : 0), FH, ez - (dx !== 0 ? 0.46 : 0), 0.09, h, 0.09, '#c8ccd4');
      } else {
        glassMb.box(ex, FH + 0.14, ez, lx * 0.98, 0.16, lz, '#9fd4ee', { glow: '#ffe6a8' });
      }
    }
  }
  const g = mb.build();
  const gl = glassMb.geos();
  if (gl.G) {
    if (!World.glassMat) World.glassMat = new THREE.ShaderMaterial({
      uniforms: { night: { value: 0 } }, transparent: true, depthWrite: false,
      vertexShader: 'attribute vec3 color; attribute vec3 color2; varying vec3 vC; uniform float night; void main(){ vC = mix(color2, color, night); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
      fragmentShader: 'varying vec3 vC; uniform float night;\nvoid main(){ gl_FragColor = vec4(vC, mix(0.42, 0.6, night));\n#include <colorspace_fragment>\n}'
    });
    const gm = new THREE.Mesh(gl.G, World.glassMat); gm.renderOrder = 5; g.add(gm);
  }
  if (LP.length) {
    if (!World.lightMat) World.lightMat = new THREE.MeshBasicMaterial({ color: '#ffb860', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
    const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(LP, 3));
    const lm = new THREE.Mesh(lg, World.lightMat); lm.renderOrder = 1; g.add(lm);
  }
  R.scene.add(g);
  World.wallMesh = g;
}
function buildLockMesh() {
  if (World.lockMesh) { R.scene.remove(World.lockMesh); World.lockMesh.traverse(o => o.geometry && o.geometry.dispose()); }
  const g = new THREE.Group();
  const P = [];
  for (let sy = 0; sy < SECH; sy++) for (let sx = 0; sx < SECW; sx++) {
    if (G.sectors[sy * SECW + sx]) continue;
    for (let y = sy * SEC; y < sy * SEC + SEC; y++) for (let x = sx * SEC; x < sx * SEC + SEC; x++) {
      if (!isLand(x, y)) continue;
      const h = 0.06;
      P.push(x, h, y + 1, x + 1, h, y + 1, x + 1, h, y, x, h, y + 1, x + 1, h, y, x, h, y);
    }
  }
  if (P.length) {
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: '#1a1030', transparent: true, opacity: 0.28, depthWrite: false }));
    m.renderOrder = 2; g.add(m);
  }
  // 境界の柵
  const mb = new ModelBuilder();
  for (let sy = 0; sy < SECH; sy++) for (let sx = 0; sx < SECW; sx++) {
    if (!G.sectors[sy * SECW + sx]) continue;
    for (let d = 0; d < 4; d++) {
      const [dx, dy] = DIRS4[d], nx = sx + dx, ny = sy + dy;
      if (nx < 0 || ny < 0 || nx >= SECW || ny >= SECH || G.sectors[ny * SECW + nx]) continue;
      for (let k = 0; k < SEC; k++) {
        let x, z;
        if (dx === 1) { x = (sx + 1) * SEC; z = sy * SEC + k + 0.5; } else if (dx === -1) { x = sx * SEC; z = sy * SEC + k + 0.5; }
        else if (dy === 1) { z = (sy + 1) * SEC; x = sx * SEC + k + 0.5; } else { z = sy * SEC; x = sx * SEC + k + 0.5; }
        const tx = Math.floor(x - (dx === 1 ? 0.5 : dx === -1 ? 0.5 : 0)), tz = Math.floor(z - (dy === 1 ? 0.5 : dy === -1 ? 0.5 : 0));
        if (!isLand(Math.min(W - 1, Math.max(0, tx)), Math.min(H - 1, Math.max(0, tz)))) continue;
        mb.box(x, 0, z, 0.08, 0.35, 0.08, '#e8d8b8');
        mb.box(x, 0.22, z, dx ? 0.05 : 0.95, 0.06, dx ? 0.95 : 0.05, '#ffffff');
      }
    }
  }
  const fence = mb.build(); g.add(fence);
  R.scene.add(g); World.lockMesh = g;
}
function buildGridMesh() {
  const geo = new THREE.PlaneGeometry(W, H); geo.rotateX(-Math.PI / 2);
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { op: { value: 0.0 } },
    vertexShader: 'varying vec2 vP; void main(){ vec4 w = modelMatrix * vec4(position,1.); vP = w.xz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: 'uniform float op; varying vec2 vP; void main(){ vec2 f = fract(vP); float l = step(f.x, 0.04) + step(f.y, 0.04); if (l < 0.5) discard; gl_FragColor = vec4(1.,1.,1., op); }'
  });
  const m = new THREE.Mesh(geo, mat); m.position.set(W / 2, 0.085, H / 2); m.renderOrder = 3; m.visible = false;
  R.scene.add(m); World.gridMesh = m;
}

// 建物メッシュ
function spawnBuildingMesh(b) {
  const def = B[b.id];
  if (!World.bldGroup) return;
  if (MERGE_DECOR[b.id]) { World.dirtyFlora.add(secOf(b.x, b.y)); return; }
  const m = buildModel(b.id, { num: b.num, lv: b.lv, season: dateOf(G.day).season, var: b.uid });
  placeMeshAt(m, def, b.x, b.y, b.rot);
  m.userData.uid = b.uid;
  b.mesh = m;
  World.bldGroup.add(m);
}
function refreshBuildingMesh(b) {
  if (b.mesh) { World.bldGroup.remove(b.mesh); disposeObj(b.mesh); b.mesh = null; }
  spawnBuildingMesh(b);
}
function placeMeshAt(m, def, x, y, rot) {
  const [w, h] = dims(def, rot);
  const base = def.zone === 'term' || (def.zone === 'any' && G.floor[idx(x, y)] === FLOOR.TERM) ? FLOOR_H[FLOOR.TERM] : 0;
  m.position.set(x + w / 2, base, y + h / 2);
  m.rotation.y = rot * Math.PI / 2;
}

// ============================================================
//  人の通り道（フローフィールド）
// ============================================================
let WALKABLE = new Uint8Array(W * H);
function rebuildWalkable() {
  for (let i = 0; i < W * H; i++) {
    const f = G.floor[i];
    WALKABLE[i] = (f === FLOOR.TERM || f === FLOOR.WALK || f === FLOOR.ROAD) && !G.occ[i] ? 1 : 0;
  }
  RT.dirtyWalk = false; RT.walkVer = (RT.walkVer || 0) + 1;
}
// 建物の前のマス（人が並ぶ場所）
function accessTiles(b) {
  if (RT.dirtyWalk) rebuildWalkable();
  if (b._acc && b._accV === RT.walkVer) return b._acc;
  const def = B[b.id];
  const [w, h] = dims(def, b.rot);
  const [fx, fy] = frontDir(b.rot);
  const out = [];
  const push = (x, y) => { if (inMap(x, y) && WALKABLE[idx(x, y)]) out.push(idx(x, y)); };
  if (fx === 0) { const yy = fy > 0 ? b.y + h : b.y - 1; for (let x = b.x; x < b.x + w; x++) push(x, yy); }
  else { const xx = fx > 0 ? b.x + w : b.x - 1; for (let y = b.y; y < b.y + h; y++) push(xx, y); }
  if (!out.length) {
    for (let x = b.x; x < b.x + w; x++) { push(x, b.y - 1); push(x, b.y + h); }
    for (let y = b.y; y < b.y + h; y++) { push(b.x - 1, y); push(b.x + w, y); }
  }
  // 中央に近い順
  const c = bCenter(b);
  out.sort((a, bb) => Math.hypot(a % W + 0.5 - c.x, Math.floor(a / W) + 0.5 - c.z) - Math.hypot(bb % W + 0.5 - c.x, Math.floor(bb / W) + 0.5 - c.z));
  b._acc = out; b._accV = RT.walkVer;
  return out;
}
function getField(b) {
  if (RT.dirtyWalk) rebuildWalkable();
  let f = RT.fieldCache.get(b.uid);
  if (f) return f;
  f = new Int16Array(W * H).fill(-1);
  const q = new Int32Array(W * H); let qh = 0, qt = 0;
  for (const i of accessTiles(b)) { f[i] = 0; q[qt++] = i; }
  while (qh < qt) {
    const i = q[qh++], x = i % W, y = (i / W) | 0, d = f[i] + 1;
    for (let k = 0; k < 8; k++) {
      const [dx, dy] = DIRS8[k], nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      const ni = ny * W + nx;
      if (f[ni] >= 0 || !WALKABLE[ni]) continue;
      if (k >= 4 && (!WALKABLE[y * W + nx] || !WALKABLE[ny * W + x])) continue;
      f[ni] = d; q[qt++] = ni;
    }
  }
  RT.fieldCache.set(b.uid, f);
  return f;
}

// ============================================================
//  飛行機の通り道
// ============================================================
function planePath(fromTile, toTile, allowStands) {
  const key = fromTile + '>' + toTile + ':' + allowStands.join(',');
  if (RT.planePathCache.has(key)) return RT.planePathCache.get(key);
  const prev = new Int32Array(W * H).fill(-2);
  const q = [fromTile]; prev[fromTile] = -1;
  let found = false;
  const ok = i => {
    const f = G.floor[i];
    if (f === FLOOR.TAXI || f === FLOOR.RUNWAY) return true;
    if (f === FLOOR.APRON) return allowStands.includes(G.occ[i]);
    return false;
  };
  for (let h = 0; h < q.length; h++) {
    const i = q[h]; if (i === toTile) { found = true; break; }
    const x = i % W, y = (i / W) | 0;
    for (const [dx, dy] of DIRS4) {
      const nx = x + dx, ny = y + dy; if (!inMap(nx, ny)) continue;
      const ni = idx(nx, ny); if (prev[ni] !== -2 || !ok(ni)) continue;
      prev[ni] = i; q.push(ni);
    }
  }
  let path = null;
  if (found) { path = []; for (let i = toTile; i !== -1; i = prev[i]) path.push(i); path.reverse(); }
  RT.planePathCache.set(key, path);
  return path;
}
function runwayInfo(b) {
  const def = B[b.id];
  const [w, h] = dims(def, b.rot);
  const horiz = b.rot % 2 === 0;
  const mid = horiz ? b.y + Math.floor(h / 2) : b.x + Math.floor(w / 2);
  const len = horiz ? w : h;
  const c = horiz ? b.y + h / 2 : b.x + w / 2;
  // 端（0=始点側 1=終点側）
  const endTile = e => horiz ? idx(e ? b.x + w - 1 : b.x, mid) : idx(mid, e ? b.y + h - 1 : b.y);
  return { horiz, len, c, x0: horiz ? b.x : b.y, x1: horiz ? b.x + w : b.y + h, endTile, cls: def.cls, w, h };
}
// 滑走路と駐機場がつながっているか
function standReachable(stand, runway) {
  const ri = runwayInfo(runway);
  const sc = bCenter(stand), st = idx(Math.floor(sc.x), Math.floor(sc.z));
  for (const e of [0, 1]) { const p = planePath(ri.endTile(e), st, [stand.uid]); if (p) return true; }
  return false;
}

// ---------- 搭乗口と駐機場のリンク ----------
function rectDist(a, b) {
  const da = dims(B[a.id], a.rot), db = dims(B[b.id], b.rot);
  const dx = Math.max(0, a.x - (b.x + db[0] - 1), b.x - (a.x + da[0] - 1));
  const dy = Math.max(0, a.y - (b.y + db[1] - 1), b.y - (a.y + da[1] - 1));
  return dx + dy;
}
function relinkGates() {
  const stands = Object.values(G.blds).filter(b => B[b.id].kind === 'stand').sort((a, b) => a.num - b.num);
  const gates = Object.values(G.blds).filter(b => B[b.id].kind === 'gate');
  const used = new Set();
  for (const s of stands) {
    const prev = s.gate && G.blds[s.gate];
    if (prev && !used.has(prev.uid) && (B[prev.id].bus || rectDist(s, prev) <= 7)) { used.add(prev.uid); continue; }
    s.gate = 0;
  }
  for (const s of stands) {
    if (s.gate) continue;
    let best = null, bd = 1e9;
    for (const g of gates) {
      if (used.has(g.uid)) continue;
      const d = rectDist(s, g);
      if (!B[g.id].bus && d > 7) continue;
      const score = d + (B[g.id].bus ? 30 : 0);
      if (score < bd) { bd = score; best = g; }
    }
    if (best) { s.gate = best.uid; used.add(best.uid); }
  }
  for (const g of gates) g.stand = 0;
  for (const s of stands) if (s.gate && G.blds[s.gate]) G.blds[s.gate].stand = s.uid;
  RT.dirtyLinks = false;
}

// ---------- 美しさ ----------
function rebuildBeauty() {
  const be = RT.beauty; be.fill(0);
  const season = dateOf(G.day).season;
  const night = RT.nightF > 0.5;
  const add = (cx, cy, v, r) => {
    for (let y = Math.max(0, Math.floor(cy - r)); y <= Math.min(H - 1, Math.floor(cy + r)); y++)
      for (let x = Math.max(0, Math.floor(cx - r)); x <= Math.min(W - 1, Math.floor(cx + r)); x++) {
        const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
        if (d <= r) be[idx(x, y)] += v * (1 - d / (r + 1));
      }
  };
  for (const b of Object.values(G.blds)) {
    const def = B[b.id]; let v = def.beauty || 0;
    if (!v) continue;
    if (b.id === 'sakura' && season === 0) v *= 2;
    if (def.seasonBoost != null && (def.seasonBoost === season || (def.seasonBoost === 3 && dateOf(G.day).month === 12))) v *= 2;
    if (G.flags.clean) v *= 1.2;
    if (def.lamp && night) v *= 2;
    if (G.research.clean) v *= 1.15;
    if (G.research.lightup && night) v *= 1.5;
    const c = bCenter(b);
    add(c.x, c.z, v, 3 + Math.min(3, (def.w + def.h) / 3));
  }
  for (let i = 0; i < W * H; i++) if (G.trees[i]) be[i] += 0.3;
  RT.dirtyBeauty = false;
}

// ---------- 組み合わせ ----------
function rebuildCombos() {
  const blds = Object.values(G.blds);
  for (const b of blds) b.combo = null;
  const active = new Set();
  for (const C of COMBOS) {
    let ids, nNeed;
    if (Array.isArray(C.need[0])) { ids = C.need[0]; nNeed = C.need[1]; } else { ids = C.need; nNeed = C.need.length; }
    const cand = blds.filter(b => ids.includes(b.id));
    for (const a of cand) {
      const ca = bCenter(a);
      const near = cand.filter(b => { const cb = bCenter(b); return Math.hypot(ca.x - cb.x, ca.z - cb.z) <= 4.6; });
      const distinct = new Set(near.map(b => b.id));
      if (distinct.size >= nNeed) {
        active.add(C.id);
        for (const b of near) { (b.combo = b.combo || []); if (!b.combo.includes(C.id)) b.combo.push(C.id); }
      }
    }
  }
  for (const id of active) if (!G.combos[id]) {
    G.combos[id] = G.day + 1;
    Bus.emit('combo', COMBOS.find(c => c.id === id));
  }
  RT.activeCombos = active;
  RT.dirtyCombo = false;
}
function comboBonus(b) {
  if (!b.combo) return 0;
  let s = 0; for (const id of b.combo) { const c = COMBOS.find(x => x.id === id); if (c) s += c.bonus; }
  return s;
}

// ---------- 警告（問題チェック） ----------
function checkWarnings() {
  const W2 = new Map();
  const blds = Object.values(G.blds);
  const runways = blds.filter(b => B[b.id].kind === 'runway');
  if (RT.dirtyWalk) rebuildWalkable();
  const cks = blds.filter(b => B[b.id].kind === 'checkin'), ckF = cks.map(getField);
  for (const b of blds) {
    const def = B[b.id];
    const msgs = [];
    if (def.kind === 'stand') {
      if (!b.gate) msgs.push('近くに搭乗口がありません（7マス以内）');
      if (runways.length && !runways.some(r => standReachable(b, r))) msgs.push('滑走路と誘導路でつながっていません');
    }
    if (def.kind === 'gate' && !b.stand) msgs.push('つながっている駐機場がありません');
    if (def.kind === 'access' && cks.length && accessTiles(b).length && !accessTiles(b).some(i => ckF.some(f => f[i] >= 0))) msgs.push('歩道でターミナル（チェックイン）とつながっていません');
    if (def.zone === 'term' || def.kind === 'access' || (def.kind === 'svc' && def.zone === 'land')) {
      if (def.kind !== 'decor' && !accessTiles(b).length) msgs.push('前に通路がありません');
    }
    if (msgs.length) W2.set(b.uid, msgs);
  }
  RT.warnings = W2;
}
