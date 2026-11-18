// ============================================================
//  地上管制（管制塔が誘導路の交通整理をする）
//  ・飛行機は動き出す前に、通る道（マス）をまとめて予約する
//  ・同じ向きに走る飛行機どうしは同じマスを使える（車間はあける）
//  ・反対向き・交差する飛行機とは同じマスを同時に使えない → 向かい合って止まることがない
//  ・着陸した飛行機は優先。まだ止まれる出発機の予約は取り消して待ってもらう
//  ・一方通行の誘導路（矢印）も作れる
// ============================================================
const GC = { tile: new Array(W * H), gid: 0, warned: false };
function gcReset() { GC.tile = new Array(W * H); GC.gid = 0; }
function gcList(t) { return GC.tile[t] || (GC.tile[t] = []); }

// レールが通るマス（滑走路マスは滑走路の管制で別に扱うので除く）
function gcTiles(rail, off) {
  const out = [];
  let cur = null;
  for (let i = 0; i < rail.n; i++) {
    const tx = Math.floor(rail.X[i]), tz = Math.floor(rail.Z[i]);
    if (!inMap(tx, tz)) continue;
    const t = idx(tx, tz);
    if (cur && cur.t === t) { cur.s1 = off + rail.S[i]; cur.x1 = rail.X[i]; cur.z1 = rail.Z[i]; continue; }
    if (cur) out.push(cur);
    cur = G.floor[t] === FLOOR.RUNWAY ? { t: -1 } : { t, s0: off + rail.S[i], s1: off + rail.S[i], x0: rail.X[i], z0: rail.Z[i], x1: rail.X[i], z1: rail.Z[i], hd: rail.Hd[i] };
  }
  if (cur) out.push(cur);
  return out.filter(e => e.t >= 0).map(e => {
    let dx = e.x1 - e.x0, dz = e.z1 - e.z0; const L = Math.hypot(dx, dz);
    if (L < 0.05) { dx = Math.sin(e.hd); dz = Math.cos(e.hd); } else { dx /= L; dz /= L; }
    return { t: e.t, s0: e.s0, s1: Math.max(e.s1, e.s0 + 0.05), dx, dz, st: 0 };   // st: 0=未予約 1=予約中 2=通過ずみ
  });
}
// 経路をセット（rails：[{rail, off}]、全体の長さでつなぐ）
function gcSetRoute(pl, rails) {
  gcReleaseAll(pl);
  if (!pl.gid) pl.gid = ++GC.gid;
  let tiles = [];
  for (const { rail, off } of rails) tiles = tiles.concat(gcTiles(rail, off));
  pl.gr = { tiles, rails, waitT: 0, ghost: false, why: null };
}
function gcSG(pl) {
  if (!pl.gr) return 0;
  const seg = pl.gr.rails.find(s => s.rail === pl.rail);
  return (seg ? seg.off : 0) + (pl.rs || 0);
}
function gcConflict(a, aPl, b) { return b.pl !== aPl && (a.dx * b.dx + a.dz * b.dz) < 0.5; }
// 予約を試す（全部とれるときだけとる）
function gcTry(pl) {
  const gr = pl.gr; if (!gr) return true;
  const need = gr.tiles.filter(e => e.st === 0);
  if (!need.length) return true;
  if (gr.ghost) { for (const e of need) { e.st = 1; e.pl = pl; gcList(e.t).push(e); } return true; }
  const blockers = new Map();   // plane → いちばん早いぶつかる位置
  for (const e of need) for (const o of gcList(e.t)) if (gcConflict(e, pl, o)) { const s = blockers.get(o.pl); if (s == null || o.s0 < s) blockers.set(o.pl, o.s0); }
  if (blockers.size) {
    // 着陸機は優先：まだ止まれる出発機には、そこから先の予約をゆずってもらう
    const canPre = pl.state === 'taxi_in' || pl.state === 'roll';
    const cuts = [];
    for (const [o, s] of blockers) {
      const pre = canPre && ((o.state === 'pushback' && o.pbPhase === 0) || o.state === 'taxi_out');
      if (!pre) { gr.why = o; return false; }
      const sg = o.state === 'pushback' && o.pbPhase === 0 ? -1e9 : gcSG(o);
      const stopNeed = sg + o.P.len / 2 + (o.spd * o.spd) / (2 * TAXI_DEC) + 0.4;
      if (stopNeed > s) { gr.why = o; return false; }
      cuts.push([o, s]);
    }
    for (const [o, s] of cuts) {
      for (const e of o.gr.tiles) if (e.st === 1 && e.s1 > s - 0.01) { gcDrop(e); e.st = 0; }
      if (o.state === 'pushback' && o.pbPhase === 0) o.gr.tiles.forEach(e => { if (e.st === 1) { gcDrop(e); e.st = 0; } });
    }
    // ゆずってもらったあと、まだぶつかる？
    for (const e of need) for (const o of gcList(e.t)) if (gcConflict(e, pl, o)) { gr.why = o.pl; return false; }
  }
  for (const e of need) { e.st = 1; e.pl = pl; gcList(e.t).push(e); }
  gr.why = null;
  return true;
}
function gcDrop(e) { const L = GC.tile[e.t]; if (!L) return; const i = L.indexOf(e); if (i >= 0) L.splice(i, 1); }
function gcReleaseAll(pl) { if (!pl.gr) return; for (const e of pl.gr.tiles) if (e.st === 1) { gcDrop(e); e.st = 2; } }
// 通りすぎたマスを返す
function gcReleaseBehind(pl) {
  const gr = pl.gr; if (!gr) return;
  const sg = gcSG(pl) - pl.P.len / 2 - 0.4;
  for (const e of gr.tiles) if (e.st === 1 && e.s1 < sg) { gcDrop(e); e.st = 2; }
}
// いまのレールの上で、どこまで進んでよいか（ローカルの距離）
function gcLimit(pl) {
  const gr = pl.gr; if (!gr || gr.ghost) return null;
  const first = gr.tiles.find(e => e.st === 0);
  if (!first) return null;
  const seg = gr.rails.find(s => s.rail === pl.rail);
  return first.s0 - (seg ? seg.off : 0) - pl.P.len / 2 - 0.3;
}
// 毎フレーム：予約を更新して、止まる位置を返す
function gcUpdate(pl, dt) {
  if (!pl.gr) return null;
  gcReleaseBehind(pl);
  const ok = gcTry(pl);
  const lim = gcLimit(pl);
  if (!ok && pl.spd < 0.05) {
    pl.gr.waitT += dt;
    // どうしても動けないとき（すれちがえない1本道など）は、管制が順番をつけて通す
    const limit = pl.state === 'taxi_in' ? 90 : 150;
    if (pl.gr.waitT > limit) {
      pl.gr.ghost = true; gcTry(pl); RT.gcGhost = (RT.gcGhost || 0) + 1;
      if (!GC.warned) { GC.warned = true; toast('誘導路が1本道で、飛行機がすれちがえません。誘導路をもう1本作るか、「一方通行」の矢印をぬりましょう', 'bad', 'tower'); }
    }
  } else if (ok) pl.gr.waitT = 0;
  return lim;
}
// プッシュバックが終わったら、押し出しの区間の予約を返す（機体の下は前向きの予約が守る）
function gcPushDone(pl) {
  const gr = pl.gr; if (!gr || !pl.pbRail) return;
  const L = pl.pbRail.len;
  for (const e of gr.tiles) if (e.st === 1 && e.s1 <= L + 0.01) { gcDrop(e); e.st = 2; }
}
// 着陸してよいか：滑走路を出て駐機場まで行ける道が、いま空いている（またはゆずってもらえる）か
function gcCanExit(pl, r, commit) {
  const stand = G.blds[pl.stand]; if (!stand || !GC.tile) return true;
  const ax = pl.ax || rwAxis(r, G.windDir || 0), g = standGeom(stand, pl.P);
  const target = g.outTile >= 0 ? g.outTile : centerTile(stand), allow = g.outTile >= 0 ? [] : [stand.uid];
  const exits = rwExits(r, ax); if (!exits.length) return true;
  let any = false;
  for (const ex of exits) {
    const path = planePath(ex.tile, target, allow, true); if (!path) continue;
    any = true;
    let ok = true;
    const ents = [], cuts = new Map();
    for (let k = 0; k < path.length && ok; k++) {
      const a = path[Math.max(0, k - 1)], b = path[Math.min(path.length - 1, k + 1)];
      let dx = (b % W) - (a % W), dz = Math.floor(b / W) - Math.floor(a / W); const n = Math.hypot(dx, dz) || 1; dx /= n; dz /= n;
      ents.push({ t: path[k], s0: k, s1: k + 1, dx, dz, st: 0 });
      const L = GC.tile[path[k]]; if (!L || !L.length) continue;
      for (const o of L) {
        if (o.pl === pl || (o.dx * dx + o.dz * dz) >= 0.5) continue;
        const q = o.pl;
        if (q.state === 'pushback' && q.pbPhase === 0) { cuts.set(q, -1e9); continue; }
        if (q.state === 'taxi_out' && gcSG(q) + q.P.len / 2 + (q.spd * q.spd) / (2 * TAXI_DEC) + 0.4 <= o.s0) { cuts.set(q, Math.min(cuts.has(q) ? cuts.get(q) : 1e9, o.s0)); continue; }
        ok = false; break;
      }
    }
    if (ok) {
      if (commit) {
        // 着陸許可と同時に、出口から駐機場までの道を押さえる（出発機には手前で待ってもらう）
        for (const [q, s] of cuts) for (const e of q.gr.tiles) if (e.st === 1 && (s < -1e8 || e.s1 > s - 0.01)) { gcDrop(e); e.st = 0; }
        gcReleaseAll(pl);
        if (!pl.gid) pl.gid = ++GC.gid;
        pl.gr = { tiles: ents, rails: [], waitT: 0, ghost: false, why: null };
        for (const e of ents) { e.st = 1; e.pl = pl; gcList(e.t).push(e); }
      }
      return true;
    }
  }
  return !any;
}
// 出発機が動き出してよいか：着陸直前の飛行機がいるときは待つ
function gcDepartOk(pl, r) {
  if (!r) return true;
  const b = r.busy;
  if (b && b !== pl && (b.state === 'approach' || b.state === 'roll')) return false;
  return !landingClose(r, pl);
}
// 情報パネル用
function gcStatus(pl) {
  const gr = pl.gr; if (!gr) return null;
  if (gr.why && !gr.why.gone && gr.tiles.some(e => e.st === 0)) return `地上管制の指示で待機中（${gr.why.fl.code}便が通るのを待っています）`;
  return null;
}
// 出口を選ぶとき：いま動けない飛行機がいるマスは通りにくい
function gcPathPenalty(path, pl) {
  // 反対向き・交差で、しかも止まっている（または着陸機の）予約があるマスを通る道は選びにくくする
  if (!GC.tile) return 0;
  let pen = 0;
  for (let k = 0; k < path.length; k++) {
    const t = path[k], L = GC.tile[t]; if (!L || !L.length) continue;
    const a = path[Math.max(0, k - 1)], b = path[Math.min(path.length - 1, k + 1)];
    let dx = (b % W) - (a % W), dz = Math.floor(b / W) - Math.floor(a / W); const n = Math.hypot(dx, dz) || 1; dx /= n; dz /= n;
    if (L.some(o => o.pl !== pl && (o.dx * dx + o.dz * dz) < 0.5 && (o.pl.state === 'taxi_in' || o.pl.spd < 0.05))) { pen += 90; break; }
  }
  return pen;
}
// ---------- 一方通行 ----------
function OW() { if (!G.oneway || G.oneway.length !== W * H) G.oneway = new Uint8Array(W * H); return G.oneway; }
// (dx,dy) で i → ni に進んでよいか
function owAllowed(i, ni, dx, dy) {
  const o = G.oneway; if (!o) return true;
  for (const t of [i, ni]) { const d = o[t]; if (d && DIRS4[d - 1][0] === -dx && DIRS4[d - 1][1] === -dy) return false; }
  return true;
}
defB('oneway', { cat: 'air', name: '一方通行（誘導路の矢印）', oneway: true, paint: -1, cost: 1000, icon: 'taxiway', desc: '誘導路の上を、進ませたい向きにドラッグすると矢印がつきます。飛行機は矢印の向きにしか走りません。すれちがえない道におすすめ。1マスだけタップすると矢印を消せます。' });
{ const k = BUILD_ORDER.indexOf('oneway'); if (k >= 0) BUILD_ORDER.splice(k, 1); BUILD_ORDER.splice(Math.max(0, BUILD_ORDER.indexOf('taxiway') + 1), 0, 'oneway'); }
function onewayCheck(x0, y0, x1, y1) {
  const xa = Math.min(x0, x1), xb = Math.max(x0, x1), ya = Math.min(y0, y1), yb = Math.max(y0, y1);
  const tiles = [];
  for (let y = ya; y <= yb; y++) for (let x = xa; x <= xb; x++) if (inMap(x, y) && G.floor[idx(x, y)] === FLOOR.TAXI) tiles.push(idx(x, y));
  return { tiles, cost: G.free ? 0 : tiles.length * B.oneway.cost };
}
function onewayApply(x0, y0, x1, y1) {
  const { tiles, cost } = onewayCheck(x0, y0, x1, y1);
  if (!tiles.length) { toast('誘導路の上をドラッグしてください', 'bad'); return 0; }
  const dx = x1 - x0, dy = y1 - y0;
  let d = 0;
  if (dx || dy) { const v = Math.abs(dx) >= Math.abs(dy) ? [Math.sign(dx), 0] : [0, Math.sign(dy)]; d = DIRS4.findIndex(q => q[0] === v[0] && q[1] === v[1]) + 1; }
  const o = OW();
  UI.lastOneway = tiles.map(i => [i, o[i]]);
  if (d) { if (G.money < cost && !G.free) { toast('お金が足りません', 'bad'); return -1; } pay(cost, 'build'); }
  for (const i of tiles) o[i] = d;
  RT.planePathCache.clear(); RT.owDirty = true; RT.dirtyAir = true;
  toast(d ? `${tiles.length}マスを一方通行にしました` : '矢印を消しました', 'good', 'taxiway');
  return tiles.length;
}
// 矢印の表示
function rebuildOneway() {
  if (World.owMesh) { R.scene.remove(World.owMesh); World.owMesh.geometry.dispose(); World.owMesh = null; }
  const o = G.oneway; if (!o) return;
  const P = [];
  for (let i = 0; i < W * H; i++) {
    if (!o[i] || G.floor[i] !== FLOOR.TAXI) continue;
    const x = i % W + 0.5, z = Math.floor(i / W) + 0.5, [fx, fz] = DIRS4[o[i] - 1], lx = -fz, lz = fx, y = floorH(i % W, Math.floor(i / W)) + 0.035;
    const pt = (a, b) => [x + fx * a + lx * b, y, z + fz * a + lz * b];
    for (const [a, b, c] of [[pt(0.32, 0), pt(-0.05, 0.28), pt(-0.05, -0.28)], [pt(0.02, 0), pt(-0.3, 0.24), pt(-0.3, -0.24)]]) P.push(...a, ...b, ...c);
  }
  if (!P.length) return;
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: '#ffffff', side: THREE.DoubleSide, transparent: true, opacity: 0.85, depthWrite: false }));
  m.renderOrder = 3; World.owMesh = m; R.scene.add(m);
}
function updateOneway() {
  if (World._owG !== G || RT.owDirty) { World._owG = G; RT.owDirty = false; rebuildOneway(); }
}
{ const _wc = worldChanged; worldChanged = function (d) { _wc(d); RT.owDirty = true; }; }
