// ============================================================
//  管制塔（到着・出発の順番づけ）
//  ・到着機には、着陸の時刻（スロット）と駐機場を早めに決める
//    - 駐機場は「いま空いている」だけでなく「着くころに空く」ものも予約する（次の便として）
//    - 滑走路は、到着と出発を1本の時間表にならべて、すき間に入れていく（先に来た順を守る）
//  ・遅らせる量が小さいときは速度を落とし、大きいときは待機経路で「進入予定時刻」まで待つ
//  ・出発機は、時間表で自分の番のときだけ滑走路に入る
// ============================================================
const ATC = { t: 0 };
const COMMIT_D = 6;   // 着陸許可を出す点（接地の何マス手前か）

// ---------- 時間の見積もり（単位：ゲーム内の分） ----------
function arrETA(p) {
  if (p.state !== 'approach' || !p.td) return Infinity;
  const v = Math.max(0.2, p.spd);
  if (p.phase === 'base') return (Math.hypot(p.faf.x - p.x, p.faf.z - p.z) + Math.hypot(p.faf.x - p.td.x, p.faf.z - p.td.z)) / v;
  return Math.hypot(p.td.x - p.x, p.td.z - p.z) / v;
}
// ふつうの速さで飛んだとき、着陸許可の点（接地の9マス手前）まであと何分か
function natCommit(pl, r) {
  const v = vApp(pl.P);
  if (pl.state === 'approach' && pl.td) {
    if (pl.phase === 'final') return Math.max(0, Math.hypot(pl.td.x - pl.x, pl.td.z - pl.z) - COMMIT_D) / v;
    return Math.hypot(pl.faf.x - pl.x, pl.faf.z - pl.z) / (v * 1.1) + Math.max(0, Math.hypot(pl.faf.x - pl.td.x, pl.faf.z - pl.td.z) - COMMIT_D) / v;
  }
  const ax = rwAxis(r, G.windDir || 0), faf = ax.P(-24, 0);
  return Math.hypot(faf.x - pl.x, faf.z - pl.z) / (v * 1.1) + 15 / v + 1.5;
}
// 着陸してから滑走路を出るまで
function arrOccupy(p) {
  const ax = p.ax; if (!ax) return 6;
  const v = vApp(p.P), tdS = p.td ? axS(ax, p.td) : 2;
  const exitS = p.exitPlan && p.exitPlan.ahead ? p.exitPlan.ex.s : ax.len * 0.8;
  return Math.max(2, exitS - tdS) / ((v + V_TAXI) / 2) + 1.5;
}
function wakeOf(P) { return P.cls >= 3 ? 2.5 : 1; }
// 到着機が滑走路を使う時間（許可 → 滑走路を出る → 後方乱気流の間隔）
function arrRunwayDur(pl) {
  const r = G.blds[pl.runway], est = COMMIT_D / vApp(pl.P) + arrOccupy(pl);
  return (Math.max(est, r && r.occA ? r.occA * 1.05 : 0) + wakeOf(pl.P) + 0.5) * (G.research.rapidexit ? 0.85 : 1);
}
// 出発機が滑走路を使う時間（手前で待つ所 → 離陸 → 上昇）
function depRunwayDur(pl) {
  const ax = pl.ax; if (!ax) return 8;
  let line = 2;
  if (pl.fwdRail) line = Math.max(1, pl.fwdRail.len - (pl.holdS != null ? pl.holdS : pl.fwdRail.len - 2));
  const roll = Math.max(4, ax.len - (pl.takeS || 1.2));
  const est = line / 1.0 + roll * 0.7 / Math.max(0.3, vRot(pl.P)) + 1;
  const r = G.blds[pl.runway];
  return Math.max(est, r && r.occD ? r.occD * 1.05 : 0) + wakeOf(pl.P) * 0.6 + 0.5;
}
function depOccupy(pl) { return depRunwayDur(pl); }
// いま滑走路を使っている飛行機が、空けるまであとどれくらいか
function rwFreeIn(r, except) {
  const b = r.busy; if (!b || b === except || b.gone) return Math.max(0, (r.wakeUntil || 0) - G.min);
  if (b.state === 'approach') return arrETA(b) + arrOccupy(b);
  if (b.state === 'roll') { const s = axS(b.ax, b); return Math.max(0, (b.rollHand || b.ax.len) - s) / Math.max(0.3, (b.spd + V_TAXI) / 2) + 2; }
  if (b.state === 'taxi_in') return b.spd < 0.05 ? 6 : 2;
  if (b.state === 'taxi_out') return Math.max(1, b.rail ? (b.rail.len - b.rs) / 0.7 : 2) + Math.max(4, b.ax.len - (b.takeS || 1.2)) * 0.7 / Math.max(0.3, vRot(b.P)) + 1;
  if (b.state === 'takeoff') return Math.max(0, (b.ax.len - b.rollT)) / Math.max(0.3, b.spd) + 2;
  if (b.state === 'climb') return 1;
  return 4;
}

// 滑走路を空けたら、実際にかかった時間を覚えておく（次からの見積もりに使う）
function rwRelease(r, pl, arr) {
  if (r.busy !== pl) return;
  r.busy = null;
  if (r.busyT != null) {
    const d = G.min - r.busyT, k = arr ? 'occA' : 'occD';
    r[k] = r[k] ? r[k] * 0.7 + d * 0.3 : d;
  }
}
// ---------- 駐機場の予約 ----------
function flightById(id) {
  for (const p of RT.planes) if (p.fl.id === id) return p.fl;
  return RT.todayFlights.find(f => f.id === id) || null;
}
// その駐機場が空く見こみの時刻
function standFreeAt(s) {
  const now = G.min;
  if (!s.busy) return s.next ? Infinity : now;
  if (s.next) return Infinity;
  const fl = flightById(s.busy); if (!fl) return now;
  const pl = fl.plane;
  if (!pl || pl.gone) return now;
  if (pl.state === 'pushback') return now + (pl.pbPhase === 0 ? 7 : 3);
  if (pl.state === 'taxi_out' || pl.state === 'takeoff' || pl.state === 'climb') return now;
  // まだ到着前・駐機中：出発予定（遅れていればいま）＋押し出しの時間
  const park = fl.parkT != null ? fl.parkT : now + 12;
  // 出発時刻をすぎても出ていない（お客さん待ちなど）ときは、少し先と見こむ
  const late = now > fl.depT ? 6 : 0;
  return Math.max(now, fl.depT, park + turnTime(fl.type)) + 6 + late;
}
// 到着機に駐機場を決める（着く時刻 tLand のころに空いているもの）
function assignStand(pl, tLand) {
  const fl = pl.fl, r = G.blds[pl.runway], P = PLANES[fl.type], sc = P.stand || P.cls;
  let best = null, bs = 1e9;
  for (const s of eligibleStands(fl)) {
    if (!standReachable(s, r)) continue;
    const free = standFreeAt(s); if (!isFinite(free)) continue;
    const wait = Math.max(0, free - (tLand + 6));
    const score = wait * 10 + (B[s.id].cls - sc) * 4 + (s.gate && G.blds[s.gate] && B[G.blds[s.gate].id].bus ? 3 : 0) + Math.random() * 0.5;
    if (score < bs) { bs = score; best = s; }
  }
  if (!best) return null;
  if (!best.busy) best.busy = fl.id; else best.next = fl.id;
  pl.stand = best.uid; fl.stand = best.uid; fl.gate = best.gate || 0; pl.cleared = true;
  if (fl.gate && !fl.cargo) spawnCrew(fl, G.blds[fl.gate]);
  return best;
}
// 飛行機が駐機場を出たら、次の便に渡す
function standLeave(s, flId) {
  if (!s) return;
  if (s.busy === flId) { s.busy = s.next || 0; s.next = 0; }
  else if (s.next === flId) s.next = 0;
}
// いまの駐機場がまだ空かないとき、すぐ使える別の駐機場があれば乗りかえる
function reassignStand(pl) {
  const cur = G.blds[pl.stand]; if (!cur || cur.busy === pl.fl.id) return false;
  const fl = pl.fl, r = G.blds[pl.runway], P = PLANES[fl.type], sc = P.stand || P.cls;
  const alt = eligibleStands(fl).filter(s => s !== cur && !s.busy && !s.next && standReachable(s, r)).sort((a, b) => (B[a.id].cls - sc) - (B[b.id].cls - sc))[0];
  if (!alt) return false;
  standLeave(cur, fl.id);
  alt.busy = fl.id; pl.stand = alt.uid; fl.stand = alt.uid; fl.gate = alt.gate || 0;
  if (fl.gate && !fl.cargo) spawnCrew(fl, G.blds[fl.gate]);
  ATC.t = 99;
  return true;
}
function standIsMine(pl) { const s = G.blds[pl.stand]; return !!s && s.busy === pl.fl.id; }

// ---------- 滑走路の時間表 ----------
function atcPlan() {
  for (const r of Object.values(G.blds)) {
    if (B[r.id].kind !== 'runway') continue;
    const now = G.min, items = [];
    for (const p of RT.planes) {
      if (p.gone || p.runway !== r.uid || r.busy === p) continue;
      if (p.state === 'approach' || p.state === 'hold' || p.state === 'climb_ga') {
        if (!p.cleared) continue;
        const s = G.blds[p.stand];
        // 時刻表どおり（到着予定の少し前）に降りるよう、早すぎるときは遅らせる
        let ready = Math.max(now + natCommit(p, r), p.fl.arrT - 14);
        // 駐機場が空くまで降りても待つだけなので、着陸をそのぶん遅らせる
        const nat = ready;
        if (s && s.busy !== p.fl.id) ready = Math.max(ready, standFreeAt(s) - 8);
        p.planWhy = ready > nat + 0.5 ? 'stand' : 'rw';
        if (p.seqKey == null) p.seqKey = ready;
        items.push({ p, arr: true, key: p.seqKey, ready, dur: arrRunwayDur(p) });
      } else if (p.state === 'taxi_out' && !p.rwCleared) {
        // 出発機：滑走路の手前に着いた（またはもうすぐ着く）ものだけ時間表に入れる
        const toHold = p.holdS != null ? Math.max(0, p.holdS - p.rs) / 1.0 : Math.max(0, p.rail.len - p.rs) / 1.0;
        if (toHold > 0.3 && (p.spd < 0.1 || toHold > 6)) continue;
        const ready = now + toHold;
        if (p.seqKey == null) p.seqKey = ready;
        items.push({ p, arr: false, key: p.seqKey, ready, dur: depRunwayDur(p) });
      }
    }
    // 用意ができた順（3分以内なら先に来た順）
    items.sort((a, b) => Math.round(a.ready / 3) - Math.round(b.ready / 3) || a.key - b.key || (a.arr ? -1 : 1));
    // 先に来た順に、空いている時間のすき間へ入れる
    const busy = [[-1e9, now + rwFreeIn(r)]];
    for (const it of items) {
      let t = it.ready;
      for (let k = 0; k < 40; k++) {
        const hit = busy.find(([a, b]) => t < b && t + it.dur > a);
        if (!hit) break;
        t = hit[1];
      }
      busy.push([t, t + it.dur]);
      it.p.planT = t; it.p.planDelay = t - it.ready;
      if (it.arr && t > it.ready + 0.5) it.p.planWhy = 'runway';
    }
    r.plan = items.map(it => ({ p: it.p, t: it.p.planT, arr: it.arr, dur: it.dur }));
  }
}
// 着陸機：時間表にあわせて速度を決める。'hold' を返したら待機経路へ
function atcArrivalControl(pl, r) {
  if (pl.planT == null) { pl.spdK = 1; return null; }
  const nat = natCommit(pl, r), need = pl.planT - G.min;
  if (need <= nat + 0.3) { pl.spdK = Math.min(1, (pl.spdK || 1) + 0.03); return null; }
  const k = nat / need;
  const kMin = G.research.aman ? 0.68 : 0.74;
  if (k >= kMin) { pl.spdK = Math.max(kMin, Math.min(1, k)); return null; }
  pl.spdK = kMin;
  // 速度だけでは間に合わない：進入の道すじをのばす（レーダー誘導）。それでも足りなければ待機経路
  if (pl.phase === 'base') {
    // 延長線を外へ出て戻る分（行き帰りで2倍）だけ、合流点を遠くする
    const v = vApp(pl.P), want = (need * 0.78 - nat) * v / 2;
    const ext = pl.fafExt || 0, extMax = G.research.aman ? 55 : 40;
    if (want > 3 && ext < extMax && want > ext + 3) {
      pl.fafExt = Math.min(extMax, want);
      pl.faf = pl.ax.P(-24 - pl.fafExt, (24 + pl.fafExt) * GLIDE);
      return null;
    }
    if (ext > 0 && want <= ext + 3) return null;
    if (nat > 6 && need - nat > 4) return 'hold';
  }
  return null;
}
// 待機経路から出る時刻になったか
function atcHoldDone(pl, r) {
  if (pl.planT == null) return false;
  const nat = natCommit(pl, r);
  return G.min >= pl.planT - nat / 0.9;
}
// 出発機を滑走路に入れてよいか（時間表で、次の着陸機より前に離陸し終わるか）
function atcDepartOk(pl, r) {
  if (!runwayFreeFor(r, pl)) return false;
  const T = depRunwayDur(pl);
  for (const o of RT.planes) {
    if (o === pl || o.gone || o.runway !== pl.runway || o.state !== 'approach') continue;
    const commitIn = arrETA(o) - COMMIT_D / Math.max(0.2, o.spd);
    if (commitIn < T) return false;
  }
  return true;
}
// 古い関数名の互換
function atcReapproachOk(pl, r) { return atcHoldDone(pl, r); }
