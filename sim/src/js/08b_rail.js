// ============================================================
//  地上走行のレール（誘導路の中心線を、角を丸めた曲線でたどる）
// ============================================================
const TAXI_ACC = 0.5, TAXI_DEC = 1.2, A_LAT = 0.6;

// 折れ線 → 角を円弧で丸めた、0.1マスごとの点列
function buildRail(poly, radius) {
  const P = [];
  for (const p of poly) { const l = P[P.length - 1]; if (!l || Math.hypot(p.x - l.x, p.z - l.z) > 0.05) P.push({ x: p.x, z: p.z }); }
  if (P.length === 1) P.push({ x: P[0].x + 0.01, z: P[0].z });
  const dense = [P[0]];
  for (let i = 1; i < P.length - 1; i++) {
    const A = P[i - 1], Bp = P[i], C = P[i + 1];
    const ab = Math.hypot(Bp.x - A.x, Bp.z - A.z), bc = Math.hypot(C.x - Bp.x, C.z - Bp.z);
    const ux = (Bp.x - A.x) / ab, uz = (Bp.z - A.z) / ab, vx = (C.x - Bp.x) / bc, vz = (C.z - Bp.z) / bc;
    const cos = clamp(ux * vx + uz * vz, -1, 1), th = Math.acos(cos);
    if (th < 0.04) { dense.push(Bp); continue; }
    let t = radius * Math.tan(th / 2);
    t = Math.min(t, ab * 0.5, bc * 0.5);
    const p1 = { x: Bp.x - ux * t, z: Bp.z - uz * t }, p2 = { x: Bp.x + vx * t, z: Bp.z + vz * t };
    const n = Math.max(3, Math.ceil(th * 10));
    for (let k = 0; k <= n; k++) {
      const s = k / n, a = (1 - s) * (1 - s), b = 2 * (1 - s) * s, c = s * s;
      dense.push({ x: a * p1.x + b * Bp.x + c * p2.x, z: a * p1.z + b * Bp.z + c * p2.z });
    }
  }
  dense.push(P[P.length - 1]);
  // 等間隔に取りなおす
  const X = [dense[0].x], Z = [dense[0].z], S = [0];
  let acc = 0, carry = 0;
  for (let i = 1; i < dense.length; i++) {
    const a = dense[i - 1], b = dense[i], L = Math.hypot(b.x - a.x, b.z - a.z);
    if (L < 1e-6) continue;
    let d = 0.1 - carry;
    while (d <= L) { X.push(a.x + (b.x - a.x) * d / L); Z.push(a.z + (b.z - a.z) * d / L); acc += 0.1; S.push(acc); d += 0.1; }
    carry = L - (d - 0.1);
  }
  const last = dense[dense.length - 1];
  if (Math.hypot(X[X.length - 1] - last.x, Z[Z.length - 1] - last.z) > 0.01) { X.push(last.x); Z.push(last.z); S.push(acc + Math.hypot(X[X.length - 2] - last.x, Z[Z.length - 2] - last.z)); }
  const n = X.length, Hd = new Float32Array(n), V = new Float32Array(n);
  for (let i = 0; i < n; i++) { const a = Math.max(0, i - 1), b = Math.min(n - 1, i + 1); Hd[i] = Math.atan2(X[b] - X[a], Z[b] - Z[a]); }
  for (let i = 0; i < n; i++) {
    const a = Math.max(0, i - 3), b = Math.min(n - 1, i + 3);
    const k = Math.abs(angDiff(Hd[a], Hd[b])) / Math.max(0.05, S[b] - S[a]);
    V[i] = clamp(Math.sqrt(A_LAT / Math.max(k, 1e-3)), 0.4, V_TAXI);
  }
  return { X, Z, S, Hd, V, n, len: S[n - 1] };
}
function railAt(rail, s, hint) {
  let i = clamp(hint || 0, 0, rail.n - 2);
  while (i < rail.n - 2 && rail.S[i + 1] < s) i++;
  while (i > 0 && rail.S[i] > s) i--;
  const s0 = rail.S[i], s1 = rail.S[i + 1], t = s1 > s0 ? clamp((s - s0) / (s1 - s0), 0, 1) : 0;
  return { x: lerp(rail.X[i], rail.X[i + 1], t), z: lerp(rail.Z[i], rail.Z[i + 1], t), hdg: lerpAngle(rail.Hd[i], rail.Hd[i + 1], t), i };
}
function railNearestS(rail, p) {
  let best = 0, bd = 1e9;
  for (let i = 0; i < rail.n; i++) { const d = Math.hypot(rail.X[i] - p.x, rail.Z[i] - p.z); if (d < bd) { bd = d; best = rail.S[i]; } }
  return best;
}
// レールにそって進む。stopS で止まる（ホールドショートなど）。reverse=プッシュバック
function railFollow(pl, dt, opt) {
  opt = opt || {};
  const rail = pl.rail; if (!rail) return true;
  const end = Math.max(pl.rs, Math.min(rail.len, opt.stopS != null ? opt.stopS : rail.len));
  const remain = end - pl.rs;
  let vt = (opt.vmax || V_TAXI) * (G.research.groundsys && !opt.reverse ? 1.15 : 1);
  // 先のカーブにそなえて減速
  const look = (vt * vt) / (2 * TAXI_DEC) + 0.5;
  for (let i = pl.ri || 0; i < rail.n && rail.S[i] - pl.rs < look; i++) {
    const ds = Math.max(0, rail.S[i] - pl.rs);
    vt = Math.min(vt, Math.sqrt(rail.V[i] * rail.V[i] + 2 * TAXI_DEC * ds));
  }
  vt = Math.min(vt, Math.sqrt(2 * TAXI_DEC * Math.max(0, remain)) + (remain > 0.03 ? 0.05 : 0));
  // 前の飛行機：自分のレールの先（中心線から0.8マス以内）にいる、同じ向きの飛行機だけを見る
  // （すれちがい・交差は地上管制が整理する）
  if (!opt.reverse) {
    for (const o of RT.planes) {
      if (o === pl || o.y > 0.5 || o.gone) continue;
      const d = Math.hypot(o.x - pl.x, o.z - pl.z);
      const minD = (pl.P.len + o.P.len) * 0.45 + 0.4;
      if (d > minD + 2 || d < 0.01) continue;
      const inStand = o.state === 'parked' || o.state === 'parking' || (o.state === 'pushback' && o.pbPhase === 0);
      const oh = o.state === 'pushback' && o.pbPhase === 1 ? o.hdg + Math.PI : o.hdg;
      const same = Math.cos(oh - pl.hdg) > 0.3;
      if (inStand || !same) continue;
      let along = -1;
      for (let i = pl.ri || 0; i < rail.n && rail.S[i] - pl.rs < minD + 2; i++) if (Math.hypot(rail.X[i] - o.x, rail.Z[i] - o.z) < 0.8) { along = rail.S[i] - pl.rs; break; }
      if (along > 0.05) { pl.blockT = (pl.blockT || 0) + dt; pl.blockBy = o; if (pl.blockT < 60) vt = Math.min(vt, Math.max(0, (along - minD) * 0.6)); break; }
    }
  }
  pl.spd += clamp(vt - pl.spd, -TAXI_DEC * dt, TAXI_ACC * dt);
  if (pl.spd < 0.02 && vt < 0.02) pl.spd = 0; else pl.blockT = vt > 0.05 ? 0 : pl.blockT;
  pl.rs = Math.min(end, pl.rs + pl.spd * dt);
  const q = railAt(rail, pl.rs, pl.ri);
  pl.ri = q.i; pl.x = q.x; pl.z = q.z;
  const want = opt.reverse ? q.hdg + Math.PI : q.hdg;
  pl.hdg = lerpAngle(pl.hdg, want, Math.min(1, dt * 14));
  return end - pl.rs < 0.02;
}

// 駐機場の形（後ろ＝入口、前＝ターミナル側。止まる位置）
function standGeom(stand, P) {
  const def = B[stand.id], [w, h] = dims(def, stand.rot), [fx, fy] = frontDir(stand.rot);
  const depth = fx ? w : h, c = bCenter(stand);
  const back = { x: c.x - fx * depth / 2, z: c.z - fy * depth / 2 };
  const fwd = Math.max(0, depth / 2 - P.len / 2 - 0.3);
  const stop = { x: c.x + fx * fwd, z: c.z + fy * fwd };
  const out = { x: back.x - fx * 0.5, z: back.z - fy * 0.5 };
  // 入口の外側の誘導路マス
  const lat = [-fy, fx];
  let outTile = -1;
  for (const k of [0.01, -0.99, 1.01, -1.99]) {
    const tx = Math.floor(out.x + lat[0] * k), tz = Math.floor(out.z + lat[1] * k);
    if (inMap(tx, tz) && isTaxiLike(tx, tz) && G.floor[idx(tx, tz)] !== FLOOR.APRON) { outTile = idx(tx, tz); break; }
  }
  return { f: [fx, fy], back, stop, out, outTile, c };
}
function taxiTurnR(P) { return 0.7 + P.len * 0.12; }

// ---------- 滑走路まわり ----------
function axA0(ax) { return ax.ri.horiz ? ax.P(0).x : ax.P(0).z; }
function axPt(ax, s, lat) { const p = ax.P(s); return ax.ri.horiz ? { x: p.x, z: p.z + lat } : { x: p.x + lat, z: p.z }; }
function axS(ax, p) { return ((ax.ri.horiz ? p.x : p.z) - axA0(ax)) * ax.dir; }
// 滑走路の横にある誘導路マス（出入口）
function rwExits(r, ax) {
  const [w, h] = dims(B[r.id], r.rot), out = [];
  for (let k = 0; k < ax.len; k++) {
    const a = Math.floor(axA0(ax) + ax.dir * (k + 0.5));
    const sides = ax.ri.horiz ? [[a, r.y - 1], [a, r.y + h]] : [[r.x - 1, a], [r.x + w, a]];
    for (const [x, y] of sides) if (inMap(x, y) && G.floor[idx(x, y)] === FLOOR.TAXI) out.push({ tile: idx(x, y), s: k + 0.5 });
  }
  return out;
}
// 滑走路の上での180度ターン（u=+1：進行方向が＋）
function uturnPts(ax, s, u) {
  const L = [[-1.2, 0], [-0.5, -0.6]];
  for (let a = -90; a <= 90; a += 30) L.push([0.6 * Math.cos(a * Math.PI / 180), 0.6 * Math.sin(a * Math.PI / 180)]);
  L.push([-0.5, 0.6], [-1.2, 0]);
  return L.map(([da, lat]) => axPt(ax, s + u * da, lat * u));
}
// 経路点を誘導路の真ん中にそろえて、階段状のギザギザをなくす
function simplifyPts(pts) {
  centerOnTaxi(pts);
  if (pts.length < 3) return pts;
  const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1;
  const dp = (a, b) => {
    let md = 0, mi = -1; const A = pts[a], Bq = pts[b], L = Math.hypot(Bq.x - A.x, Bq.z - A.z) || 1e-6;
    for (let i = a + 1; i < b; i++) { const d = Math.abs((Bq.x - A.x) * (A.z - pts[i].z) - (A.x - pts[i].x) * (Bq.z - A.z)) / L; if (d > md) { md = d; mi = i; } }
    if (md > 0.3) { keep[mi] = 1; dp(a, mi); dp(mi, b); }
  };
  dp(0, pts.length - 1);
  return pts.filter((p, i) => keep[i]);
}
function centerTile(b) { const c = bCenter(b); return idx(Math.floor(c.x), Math.floor(c.z)); }
// 誘導路の中心線上で、駐機場の正面の線と交わる点
function laneQ(g, lanePt) {
  const dq = Math.abs((lanePt.x - g.back.x) * g.f[0] + (lanePt.z - g.back.z) * g.f[1]);
  return { x: g.back.x - g.f[0] * dq, z: g.back.z - g.f[1] * dq };
}

// 接地したら、どの出口で滑走路を出るか決めて、そこまでに減速する
function planRollout(pl, r) {
  const ax = pl.ax, s0 = axS(ax, pl), v = pl.spd;
  const minRoll = (v * v - V_TAXI * V_TAXI) / (2 * 1.5);         // 強めのブレーキでも必要な距離
  const ex = rwExits(r, ax).map(e => e.s).filter(s => s - 2 >= s0 + minRoll).sort((a, b) => a - b);
  // ちょうどよい出口（ゆるいブレーキで届く最初の出口）
  const want = s0 + (v * v - V_TAXI * V_TAXI) / (2 * (G.research.rapidexit ? 1.2 : 0.9));
  let exitS = ex.find(s => s - 2 >= want) || ex[ex.length - 1];
  if (pl.exitPlan) exitS = pl.exitPlan.ahead ? Math.max(pl.exitPlan.ex.s, s0 + minRoll + 2) : ax.len - 0.8;
  if (exitS == null) exitS = ax.len - 0.8;
  pl.rollHand = Math.max(s0 + 1, Math.min(exitS - 2, ax.len - 3));
  pl.decel = Math.max(0.2, (v * v - V_TAXI * V_TAXI) / (2 * Math.max(1, pl.rollHand - s0)));
}
// 着陸後：滑走路 → 出口 → 誘導路 → 駐機場（機首から入って停止線で止まる）
function taxiInRail(pl, r, stand) {
  const P = pl.P, ax = pl.ax, g = stand ? standGeom(stand, P) : null;
  const s0 = axS(ax, pl);
  const target = g && g.outTile >= 0 ? g.outTile : stand ? centerTile(stand) : -1;
  const allow = g && g.outTile >= 0 ? [] : stand ? [stand.uid] : [];
  let best = null;
  // 着陸許可のときに管制塔が決めた出口を使う（前方の出口）
  if (pl.exitPlan && pl.exitPlan.ex.s >= s0 + 0.8) { const pp = target >= 0 ? planePath(pl.exitPlan.ex.tile, target, allow, true) : [pl.exitPlan.ex.tile]; if (pp) best = { ex: pl.exitPlan.ex, path: pp, ahead: true }; }
  if (!best) {
    // 前方に出口があれば必ずそこから出る（Uターンは前方に出口がないときだけ）
    const cands = [];
    for (const ex of rwExits(r, ax)) {
      const path = target >= 0 ? planePath(ex.tile, target, allow, true) : [ex.tile];
      if (path) cands.push({ ex, path, ahead: ex.s >= s0 + 0.8 });
    }
    const ah = cands.filter(c => c.ahead);
    const pool = ah.length ? ah : cands;
    for (const c of pool) { c.cost = c.ahead ? (c.ex.s - s0) * 0.6 + c.path.length + gcPathPenalty(c.path, pl) * 0.2 : (ax.len - c.ex.s) + c.path.length; if (!best || c.cost < best.cost) best = c; }
  }
  pl.exitPlan = null;
  let poly = [{ x: pl.x, z: pl.z }];
  if (best) {
    if (!best.ahead) (RT.uturnLog = RT.uturnLog || []).push(pl.fl.code + ' s0=' + s0.toFixed(1) + ' ex=' + best.ex.s + ' pen=' + gcPathPenalty(best.path, pl)); if (RT.uturnLog && RT.uturnLog.length > 50) RT.uturnLog.shift();
    if (!best.ahead) poly = poly.concat(uturnPts(ax, clamp(ax.len - 1.0, s0 + 0.8, ax.len - 0.7), 1));
    poly.push(axPt(ax, best.ex.s, 0));
    const pts = simplifyPts(best.path.map(tilePt));
    if (g && g.outTile >= 0) { const Q = laneQ(g, pts[pts.length - 1]); pts.pop(); poly = poly.concat(pts, [Q, g.stop]); }
    else { poly = poly.concat(pts); if (g) poly.push(g.stop); }
  } else {
    // 出口が見つからないとき（ふつうは起きない）
    const cur = idx(clamp(Math.floor(pl.x), 0, W - 1), clamp(Math.floor(pl.z), 0, H - 1));
    const p2 = stand ? planePath(cur, centerTile(stand), [stand.uid]) : null;
    poly = poly.concat(simplifyPts((p2 || []).map(tilePt)));
    if (g) poly.push(g.stop);
  }
  pl.rail = buildRail(poly, taxiTurnR(P)); pl.rs = 0; pl.ri = 0;
  pl.inRail = poly;
}
// 出発：プッシュバック用（後ろ向き）と、滑走路までの前向きレール
function departRails(pl, r, stand) {
  const P = pl.P, ax = pl.ax, g = stand ? standGeom(stand, P) : null;
  const hasOut = g && g.outTile >= 0;
  const src = hasOut ? g.outTile : stand ? centerTile(stand) : idx(Math.floor(pl.x), Math.floor(pl.z));
  const allow = hasOut ? [] : [stand ? stand.uid : 0];
  let best = null;
  for (const ex of rwExits(r, ax)) {
    const path = planePath(src, ex.tile, allow, true); if (!path) continue;
    const cost = path.length + ex.s * 1.5 + gcPathPenalty(path, pl) * 0.5;   // しきい値に近い入口ほどよい
    if (!best || cost < best.cost) best = { ex, path, cost };
  }
  if (!best) {
    // 横の出入口がない（駐機場が滑走路に直接くっついている等）：滑走路マスも使って探す
    const e = G.windDir || 0;
    let p = planePath(src, runwayInfo(r).endTile(e), allow) || planePath(src, runwayInfo(r).endTile(1 - e), allow);
    if (p) { const k = p.findIndex(i => G.floor[i] === FLOOR.RUNWAY); if (k > 0) p = p.slice(0, k); if (p.length) best = { ex: { tile: p[p.length - 1], s: clamp(axS(ax, tilePt(p[p.length - 1])), 0.5, ax.len - 1) }, path: p }; }
  }
  const pts = best ? simplifyPts(best.path.map(tilePt)) : [{ x: pl.x, z: pl.z }];
  // --- プッシュバック ---
  let E;
  if (hasOut && pts.length) {
    const Q = laneQ(g, pts[0]);
    const nxt = pts.length > 1 ? pts[1] : null;
    let d0 = nxt ? [Math.round(Math.sign(nxt.x - Q.x) * (Math.abs(nxt.x - Q.x) > Math.abs(nxt.z - Q.z) ? 1 : 0)), Math.round(Math.sign(nxt.z - Q.z) * (Math.abs(nxt.z - Q.z) >= Math.abs(nxt.x - Q.x) ? 1 : 0))] : [g.f[1], -g.f[0]];
    if (d0[0] === -g.f[0] && d0[1] === -g.f[1] || (d0[0] === 0 && d0[1] === 0)) {
      // 道がまっすぐ後ろへ続くときは、横向きに押し出す
      const cand = [[g.f[1], -g.f[0]], [-g.f[1], g.f[0]]];
      d0 = cand.find(([dx, dy]) => isTaxiLike(Math.floor(Q.x - dx * 1.2), Math.floor(Q.z - dy * 1.2))) || cand[0];
    }
    const L1 = P.len * 0.5 + 0.4;
    E = { x: Q.x - d0[0] * L1, z: Q.z - d0[1] * L1 };
    if (!isTaxiLike(Math.floor(E.x), Math.floor(E.z))) E = { x: Q.x - d0[0] * 0.5, z: Q.z - d0[1] * 0.5 };
    pl.pbRail = buildRail([{ x: pl.x, z: pl.z }, Q, E], 0.5 + P.len * 0.15);
  } else {
    E = { x: pl.x - Math.sin(pl.hdg) * 1.2, z: pl.z - Math.cos(pl.hdg) * 1.2 };
    pl.pbRail = buildRail([{ x: pl.x, z: pl.z }, E], 0.5);
  }
  // --- 前向き：誘導路 → 滑走路の手前（ホールドショート） → 滑走路に正対 ---
  let poly = [E].concat(hasOut && pts.length ? [laneQ(g, pts[0])] : [], pts.slice(1));
  const hold = best ? pts[pts.length - 1] : null;
  let sLine;
  if (best && best.ex.s > 2.5) {
    // 滑走路の上をしきい値までもどって（バックトラック）、180度ターン
    poly.push(axPt(ax, best.ex.s, 0));
    poly = poly.concat(uturnPts(ax, 1.0, -1));
    sLine = 2.2;
  } else {
    const s1 = best ? best.ex.s : 0.6;
    poly.push(axPt(ax, s1, 0));
    sLine = s1;
  }
  const sEnd = sLine + 1.4;
  poly.push(axPt(ax, sEnd, 0));
  pl.fwdRail = buildRail(poly, taxiTurnR(P));
  pl.takeS = sEnd;
  pl.holdS = hold ? Math.max(0, railNearestS(pl.fwdRail, hold) - Math.max(0, P.len * 0.5 - 0.45)) : null;
}
