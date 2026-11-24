// ============================================================
//  誘導路の自動接続（駐機場・滑走路をワンタップで誘導路につなぐ）
// ============================================================
// 滑走路とつながっている誘導路マス（滑走路マスも含む）
function taxiNetworkFromRunways() {
  const net = new Uint8Array(W * H), q = [];
  for (let i = 0; i < W * H; i++) if (G.floor[i] === FLOOR.RUNWAY) { net[i] = 1; q.push(i); }
  for (let h = 0; h < q.length; h++) {
    const i = q[h], x = i % W, y = (i / W) | 0;
    for (const [dx, dy] of DIRS4) { const nx = x + dx, ny = y + dy; if (!inMap(nx, ny)) continue; const ni = idx(nx, ny); if (!net[ni] && G.floor[ni] === FLOOR.TAXI) { net[ni] = 1; q.push(ni); } }
  }
  return net;
}
// 駐機場の入口とつながっている誘導路マス
function taxiNetworkFromStands() {
  const net = new Uint8Array(W * H), q = [];
  for (const b of Object.values(G.blds)) {
    if (B[b.id].kind !== 'stand') continue;
    const g = standGeom(b, { len: 2 }); const t = idx(Math.floor(g.out.x), Math.floor(g.out.z));
    if (inMap(Math.floor(g.out.x), Math.floor(g.out.z)) && G.floor[t] === FLOOR.TAXI && !net[t]) { net[t] = 1; q.push(t); }
  }
  for (let h = 0; h < q.length; h++) {
    const i = q[h], x = i % W, y = (i / W) | 0;
    for (const [dx, dy] of DIRS4) { const nx = x + dx, ny = y + dy; if (!inMap(nx, ny)) continue; const ni = idx(nx, ny); if (!net[ni] && G.floor[ni] === FLOOR.TAXI) { net[ni] = 1; q.push(ni); } }
  }
  return net;
}
// 新しくぬるマスが少なく、曲がる回数も少ない道（ダイクストラ法）
function autoTaxiRoute(starts, isGoal) {
  const N = W * H, dist = new Float32Array(N * 4).fill(1e9), prev = new Int32Array(N * 4).fill(-1);
  const paintable = i => { const x = i % W, y = (i / W) | 0; return G.floor[i] === FLOOR.NONE && !G.occ[i] && unlocked(x, y) && isLand(x, y); };
  const heap = [];
  const push = (c, st) => { heap.push([c, st]); let k = heap.length - 1; while (k > 0) { const p = (k - 1) >> 1; if (heap[p][0] <= heap[k][0]) break; [heap[p], heap[k]] = [heap[k], heap[p]]; k = p; } };
  const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let k = 0; for (;;) { const l = k * 2 + 1, r = l + 1; let m = k; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === k) break; [heap[m], heap[k]] = [heap[k], heap[m]]; k = m; } } return top; };
  const stepCost = i => G.floor[i] === FLOOR.TAXI ? 1 : 10;
  for (const s of starts) {
    if (isGoal(s)) return [];
    if (!(paintable(s) || G.floor[s] === FLOOR.TAXI)) continue;
    for (let d = 0; d < 4; d++) { const st = s * 4 + d, c = stepCost(s); if (c < dist[st]) { dist[st] = c; push(c, st); } }
  }
  let found = -1, n = 0;
  while (heap.length && n++ < 400000) {
    const [c, st] = pop(); if (c > dist[st]) continue;
    const i = st >> 2, d = st & 3, x = i % W, y = (i / W) | 0;
    for (let nd = 0; nd < 4; nd++) {
      const nx = x + DIRS4[nd][0], ny = y + DIRS4[nd][1]; if (!inMap(nx, ny)) continue;
      const ni = idx(nx, ny);
      if (isGoal(ni)) { found = st; break; }
      if (!(paintable(ni) || G.floor[ni] === FLOOR.TAXI)) continue;
      const cc = c + stepCost(ni) + (nd !== d ? 6 : 0), ns = ni * 4 + nd;
      if (cc < dist[ns]) { dist[ns] = cc; prev[ns] = st; push(cc, ns); }
    }
    if (found >= 0) break;
  }
  if (found < 0) return null;
  const tiles = [];
  for (let st = found; st >= 0; st = prev[st]) { const i = st >> 2; if (G.floor[i] === FLOOR.NONE && !tiles.includes(i)) tiles.push(i); }
  return tiles;
}
function confirmAutoTaxi(tiles, what, after) {
  if (!tiles) { toast('つなげる道が見つかりませんでした（土地を広げるか、まわりの建物を動かしてください）', 'bad'); Sound.se('error'); return; }
  if (!tiles.length) { toast('もうつながっています', 'good'); return; }
  let cost = 0; for (const i of tiles) cost += B.taxiway.cost + (G.trees[i] ? 2000 : 0);
  if (G.free) cost = 0;
  if (G.money < cost && !G.free) { toast(`お金が足りません（${fmtYen(cost)}）`, 'bad'); Sound.se('error'); return; }
  pay(cost, 'build');
  UI.lastPaint = tiles.map(i => [i, G.floor[i]]);
  for (const i of tiles) { G.floor[i] = FLOOR.TAXI; G.trees[i] = 0; markChunk(i % W, Math.floor(i / W)); }
  worldChanged(B.taxiway); World.dirtyWalls = true;
  pushUndo({ type: 'paint', tiles: UI.lastPaint, cost: G.free ? 0 : cost });
  G.flags.autoTaxi = true;
  Sound.se('place'); toast(`${what}を誘導路でつなぎました（${tiles.length}マス ${fmtYen(cost)}）`, 'good', 'taxiway');
  after && after();
}
// 駐機場のうしろ（入口）から、滑走路につながる誘導路まで
function autoConnectStand(b) {
  if (!Object.values(G.blds).some(o => B[o.id].kind === 'runway')) { toast('先に滑走路を作ってください', 'bad'); return; }
  const g = standGeom(b, { len: 2 }), lat = [-g.f[1], g.f[0]];
  const starts = [];
  for (const k of [0.01, -0.99, 1.01]) { const x = Math.floor(g.out.x + lat[0] * k), y = Math.floor(g.out.z + lat[1] * k); if (inMap(x, y)) starts.push(idx(x, y)); }
  const net = taxiNetworkFromRunways();
  const tiles = autoTaxiRoute(starts, i => !!net[i]);
  confirmAutoTaxi(tiles, '駐機場', () => renderInfo());
}
// 滑走路の両はしから、駐機場につながる誘導路まで
function autoConnectRunway(r) {
  const net = taxiNetworkFromStands();
  if (!net.some(v => v)) { toast('先に駐機場を置いて、自動接続でつないでください', 'bad'); return; }
  const [w, h] = dims(B[r.id], r.rot), horiz = r.rot % 2 === 0;
  let all = [];
  for (const end of [0, 1]) {
    const a = horiz ? (end ? r.x + w - 1 : r.x) : (end ? r.y + h - 1 : r.y);
    const sides = horiz ? [[a, r.y - 1], [a, r.y + h]] : [[r.x - 1, a], [r.x + w, a]];
    // その端に、もう出入口があればとばす
    if (sides.some(([x, y]) => inMap(x, y) && G.floor[idx(x, y)] === FLOOR.TAXI && net[idx(x, y)])) continue;
    const tiles = autoTaxiRoute(sides.filter(([x, y]) => inMap(x, y)).map(([x, y]) => idx(x, y)), i => !!net[i]);
    if (tiles) all = all.concat(tiles);
  }
  confirmAutoTaxi([...new Set(all)], '滑走路の両はし', () => renderInfo());
}
// 滑走路の警告：着陸する向きによって、前方に出口がない
function runwayExitWarning(r) {
  for (const e of [0, 1]) {
    const ax = rwAxis(r, e), ex = rwExits(r, ax);
    if (!ex.length) return [];
    if (!ex.some(x => x.s > ax.len * 0.55)) return ['片方のはしにしか出入口がないので、風向きによっては着陸した飛行機が滑走路の上でUターンします。「両はしを自動でつなぐ」で直せます'];
  }
  return [];
}
