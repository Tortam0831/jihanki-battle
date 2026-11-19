// ============================================================
//  管制塔の滑走路の順番づけ（ゴーアラウンドを減らす）
//  ・着陸機は、前の飛行機が滑走路を空ける時間から逆算して速度を落とす（間隔をあける）
//  ・どうしても間に合わないときは、早めに上空待機（ぎりぎりのゴーアラウンドにしない）
//  ・出発機は、次の着陸機が来るまでに離陸できるときだけ滑走路に入れる
// ============================================================
// 接地までの時間
function arrETA(p) {
  if (p.state !== 'approach' || !p.td) return Infinity;
  const v = Math.max(0.2, p.spd);
  if (p.phase === 'base') return (Math.hypot(p.faf.x - p.x, p.faf.z - p.z) + Math.hypot(p.faf.x - p.td.x, p.faf.z - p.td.z)) / v;
  return Math.hypot(p.td.x - p.x, p.td.z - p.z) / v;
}
// 着陸してから滑走路を出るまでの時間
function arrOccupy(p) {
  const ax = p.ax; if (!ax) return 10;
  const v = vApp(p.P), tdS = p.td ? axS(ax, p.td) : 2;
  const exitS = p.exitPlan && p.exitPlan.ahead ? p.exitPlan.ex.s : ax.len * 0.8;
  return Math.max(2, exitS - tdS) / ((v + V_TAXI) / 2) + 1.5;
}
// 離陸の許可から、滑走路を空けるまでの時間
function depOccupy(pl) {
  const ax = pl.ax; if (!ax) return 20;
  const remain = pl.rail && pl.state === 'taxi_out' ? Math.max(0, pl.rail.len - pl.rs) : 2;
  const roll = Math.max(4, ax.len - (pl.takeS || 1.2));
  return remain / 0.7 + roll / Math.max(0.3, vRot(pl.P)) + 2;
}
// いま滑走路を使っている飛行機が、空けるまであとどれくらいか
function rwFreeIn(r, except) {
  const b = r.busy; if (!b || b === except || b.gone) return Math.max(0, (r.wakeUntil || 0) - G.min);
  if (b.state === 'approach') return arrETA(b) + arrOccupy(b);
  if (b.state === 'roll') { const s = axS(b.ax, b); return Math.max(0, (b.rollHand || b.ax.len) - s) / Math.max(0.3, (b.spd + V_TAXI) / 2) + 5; }
  if (b.state === 'taxi_in') return 5;
  if (b.state === 'taxi_out') return depOccupy(b);
  if (b.state === 'takeoff') return Math.max(0, (b.ax.len - b.rollT)) / Math.max(0.3, b.spd) + 3;
  if (b.state === 'climb') return 2;
  return 6;
}
// 着陸機ごとに、間隔のための速度の係数を決める。'hold' を返したら上空待機
function atcSpacing(pl, r) {
  const commitIn = arrETA(pl) - 9 / Math.max(0.2, pl.spd);
  let need = 0;
  // 滑走路を使っている飛行機
  if (r.busy && r.busy !== pl) need = Math.max(need, rwFreeIn(r, pl));
  // 先に降りる着陸機
  for (const o of RT.planes) {
    if (o === pl || o.gone || o.runway !== pl.runway || o.state !== 'approach') continue;
    const eo = arrETA(o); if (eo >= arrETA(pl)) continue;
    need = Math.max(need, eo + arrOccupy(o));
  }
  if (need <= 0) { pl.spdK = 1; return null; }
  if (commitIn >= need + 1) { pl.spdK = Math.min(1, (pl.spdK || 1) + 0.02); return null; }
  // 速度を落として間に合うか（最低で進入速度の72%）
  const k = clamp(commitIn / (need + 1), 0.72, 1);
  pl.spdK = Math.min(pl.spdK || 1, k);
  if (commitIn / 0.72 < need + 1 && (pl.phase === 'base' || commitIn > 12)) return 'hold';
  return null;
}
// 上空待機からもう一度進入してよいか（ほかの着陸機と重ならないか）
function atcReapproachOk(pl, r) {
  if (rwFreeIn(r, pl) > 20) return false;
  for (const o of RT.planes) if (o !== pl && !o.gone && o.runway === pl.runway && o.state === 'approach' && arrETA(o) < 26) return false;
  return true;
}
// 出発機を滑走路に入れてよいか
function atcDepartOk(pl, r) {
  if (!runwayFreeFor(r, pl)) return false;
  const T = depOccupy(pl);
  for (const o of RT.planes) {
    if (o === pl || o.gone || o.runway !== pl.runway || o.state !== 'approach') continue;
    if (arrETA(o) - 9 / Math.max(0.2, o.spd) < T) return false;
  }
  return true;
}
