// ============================================================
//  飛行機・ダイヤ・地上の車両
// ============================================================
let flightSeq = 1;

function opsWindow() {
  return G.research.nightops ? [5 * 60, 24 * 60 - 15] : [6 * 60, 22 * 60];
}
function turnTime(type) {
  let t = PLANES[type].turn;
  if (hasKind('fuel')) t *= 0.8;
  if (G.weather === 'snow' && !hasKind('snow')) t *= 1.5;
  return t * Extra.turnMul();
}
function hasKind(k) { for (const b of Object.values(G.blds)) if (B[b.id].kind === k) return true; return false; }
function countKind(k) { let n = 0; for (const b of Object.values(G.blds)) if (B[b.id].kind === k) n++; return n; }

// ---------- 1日のダイヤを作る ----------
function makeSchedule(dayStartMin, fromMin) {
  const [s, e] = opsWindow();
  const out = [];
  for (const r of G.routes) {
    if (!r.active) continue;
    const T = turnTime(r.type);
    const span = (e - s) - T - 50;
    const off = (hashStr(r.id) % 97);
    for (let i = 0; i < r.freq; i++) {
      let arr = s + 20 + off + (r.freq > 1 ? i * (span - off) / r.freq : rnd(0, span * 0.6)) + rndi(0, 15);
      arr = Math.round(arr / 5) * 5;
      const dep = Math.round((arr + T + 15) / 5) * 5;
      const A = dayStartMin + arr, D = dayStartMin + dep;
      if (fromMin && A - 20 < fromMin) continue;
      out.push(newFlight(r, A, D));
    }
  }
  out.sort((a, b) => a.arrT - b.arrT);
  // 滑走路の数に合わせて到着の間隔をあける
  const nrw = Math.max(1, countKind('runway'));
  const gap = (G.research.aitower ? 10 : 14) * Extra.gapMul() / nrw;
  // 駐機場の数にも合わせる（発着枠の調整）
  const stands = Object.values(G.blds).filter(b => B[b.id].kind === 'stand').map(b => ({ cls: B[b.id].cls, gate: !!b.gate, freeAt: -1e9 }));
  let last = -1e9;
  for (const f of out) {
    const P = PLANES[f.type], sc = P.stand || P.cls;
    const cand = stands.filter(st => st.cls >= sc && (f.cargo || st.gate)).sort((a, b) => a.freeAt - b.freeAt || a.cls - b.cls);
    if (cand.length) {
      const st = cand[0];
      if (st.freeAt > f.arrT - 15) { const sh = Math.ceil((st.freeAt - (f.arrT - 15)) / 5) * 5; f.arrT += sh; f.depT += sh; }
    }
    if (f.arrT < last + gap) { const sh = Math.ceil((last + gap - f.arrT) / 5) * 5; f.arrT += sh; f.depT += sh; }
    if (cand.length) cand[0].freeAt = f.depT + 15;
    last = f.arrT;
  }
  out.sort((a, b) => a.arrT - b.arrT);
  return out;
}
function hashStr(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); }
function newFlight(r, A, D) {
  const P = PLANES[r.type], al = AIRLINES[r.airline], city = CITIES[r.city];
  const fl = {
    id: flightSeq++, rid: r.id, code: al.code + ' ' + (100 + (hashStr(r.id) % 800) + (flightSeq % 7) * 2), city: r.city, airline: r.airline, type: r.type,
    arrT: A, depT: D, status: 'sched', stand: 0, gate: 0, cargo: !!P.cargo,
    paxArr: 0, paxDep: 0, spawned: 0, boarded: 0, missed: 0, noShow: 0, arrSpawned: 0, depSpr: 0, depSpawned: 0,
    delay: 0, plane: null
  };
  if (!fl.cargo) {
    const lf = loadFactor(r);
    fl.paxArr = Math.round(P.seats * clamp(lf * rnd(0.85, 1.1), 0.1, 1));
    fl.paxDep = Math.round(P.seats * clamp(lf * rnd(0.85, 1.1), 0.1, 1));
    fl.depSpr = spritesFor(fl.paxDep); fl.arrSpr = spritesFor(fl.paxArr);
  }
  return fl;
}
function spritesFor(pax) {
  if (pax <= 0) return 0;
  let n = pax <= 14 ? pax : 14 + (pax - 14) * 0.14;
  const load = RT.persons.length;
  if (load > 900) n *= 0.5; else if (load > 600) n *= 0.7;
  return Math.max(1, Math.round(n));
}
// 需要（搭乗率）
function loadFactor(r) {
  const city = CITIES[r.city], al = AIRLINES[r.airline];
  let lf = 0.42 + city.demand * 0.08;
  lf *= 0.75 + (G.rating / 5) * 0.4;
  if (G.research.promo) lf *= 1.1;
  if (G.research.hubnet) lf *= 1 + Math.min(0.3, G.routes.length * 0.01);
  if (al.lcc) lf *= 1.12;
  const d = dateOf(G.day);
  if ((d.month === 8 || d.month === 5 && d.part === 0 || d.month === 12 && d.part === 2 || d.month === 1 && d.part === 0) && city.region !== 'space') lf *= 1.18;
  if (city.resort && d.season === 1) lf *= 1.12;
  if (G.flags.event === 'festival' || G.flags.event === 'airshow') lf *= 1.1;
  lf *= 1 + (G.feeLevel - 1) * -0.35;
  lf *= 1 + ((G.airlines[r.airline] || {}).rel || 0) / 400;
  { const evd = eventDef(); if (evd && evd.demand) lf *= evd.demand; }
  return clamp(lf, 0.15, 1);
}

// ---------- 毎分の進行 ----------
function updateFlights(dt) {
  const now = G.min;
  for (const fl of RT.todayFlights) {
    if (fl.status === 'cancel' || fl.status === 'done') continue;
    // 出発客の生成
    if (!fl.cargo && fl.status !== 'cancel' && fl.depSpawned < fl.depSpr) {
      const t0 = fl.depT - 200, t1 = fl.depT - 80;
      if (now >= t0) {
        const want = Math.min(fl.depSpr, Math.ceil(fl.depSpr * clamp((now - t0) / (t1 - t0), 0, 1)));
        const n = want - fl.depSpawned;
        if (n > 0) { spawnDeparting(fl, n, fl.paxDep / fl.depSpr); fl.depSpawned += n; }
      }
    }
    if (fl.status === 'sched' && now >= fl.arrT - 48) startApproach(fl);
    if (fl.status === 'parked') {
      // 到着客
      if (!fl.cargo && fl.arrSpawned < fl.arrSpr) {
        const want = Math.min(fl.arrSpr, Math.ceil(fl.arrSpr * clamp((now - fl.parkT) / 10, 0, 1)));
        const n = want - fl.arrSpawned;
        if (n > 0) { spawnArriving(fl, n, fl.paxArr / fl.arrSpr, G.blds[fl.gate]); fl.arrSpawned += n; }
      }
      const T = turnTime(fl.type);
      if (!fl.boarding && !fl.cargo && now >= Math.max(fl.depT - 40, fl.parkT + T * 0.4)) {
        fl.boarding = true;
        if (G.research.fidsplus && Math.random() < 0.5) Sound.se('chime');
      }
      const ready = now >= fl.depT && now >= fl.parkT + T;
      if (ready) {
        const waiting = fl.cargo ? 0 : RT.persons.some(p => p.fl === fl && p.kind === 'dep' && (p.state === 'boarding' || p.state === 'gatewait' || p.steps[0] === 'gate'));
        if (!waiting || now >= fl.depT + 14 || fl.boarded >= fl.spawned - 0.01) pushback(fl);
      }
    }
  }
  // 飛行機の動き
  for (const pl of RT.planes) updatePlane(pl, dt);
  RT.planes = RT.planes.filter(p => !p.gone);
}
function eligibleStands(fl) {
  const P = PLANES[fl.type], sc = P.stand || P.cls;
  return Object.values(G.blds).filter(b => B[b.id].kind === 'stand' && B[b.id].cls >= sc && (fl.cargo ? true : b.gate));
}
function eligibleRunways(fl) {
  const P = PLANES[fl.type];
  return Object.values(G.blds).filter(b => B[b.id].kind === 'runway' && B[b.id].cls >= P.cls);
}
function cancelFlight(fl, why) {
  if (fl.status === 'cancel') return;
  fl.status = 'cancel'; fl.why = why;
  G.stat.today.cancel++;
  const a = G.airlines[fl.airline]; if (a) a.rel = clamp(a.rel - 2, 0, 100);
  // 出発客はがっかり
  for (const p of RT.persons) if (p.fl === fl && p.kind === 'dep') { p.mood = Math.min(p.mood, 20); missFlight(p); }
  Bus.emit('cancel', fl, why);
}
function startApproach(fl) {
  if (!hasKind('tower')) { cancelFlight(fl, '管制塔がありません'); return; }
  if (G.weather === 'typhoon') { cancelFlight(fl, '台風のため欠航'); return; }
  const rws = eligibleRunways(fl);
  if (!rws.length) { cancelFlight(fl, '使える滑走路がありません'); return; }
  const sts = eligibleStands(fl);
  if (!sts.length) { cancelFlight(fl, fl.cargo ? '駐機場がありません' : '搭乗口とつながった駐機場がありません'); return; }
  if (fl.cargo && !hasKind('cargo')) { cancelFlight(fl, '貨物ターミナルがありません'); return; }
  // つながっている組み合わせ
  const pairs = [];
  for (const r of rws) for (const s of sts) if (standReachable(s, r)) pairs.push([r, s]);
  if (!pairs.length) { cancelFlight(fl, '滑走路と駐機場がつながっていません'); return; }
  fl.status = 'approach';
  const pl = makePlane(fl);
  fl.plane = pl;
  // 滑走路はまず決める（駐機場はあとで）
  const r = weightedPick(pairs.map(p => p[0]), r => 1 / (1 + (r._load || 0)));
  pl.runway = r.uid; r._load = (r._load || 0) + 1;
  setApproachPath(pl, r);
  G.seenPlanes[fl.type + ':' + fl.airline] = 1;
  Bus.emit('approach', fl);
}
function makePlane(fl) {
  const m = planeModel(fl.type, fl.airline);
  R.scene.add(m);
  const P = PLANES[fl.type];
  const pl = { fl, mesh: m, x: 0, y: 8, z: 0, hdg: 0, pitch: 0, bank: 0, spd: vApp(P), state: 'approach', path: null, pi: 0, wait: 0, runway: 0, stand: 0, vehicles: [], P, gearT: 1, engines: true };
  RT.planes.push(pl);
  return pl;
}
// 速さ（マス/ゲーム分）。実際の進入速度の比率にあわせる
const vApp = P => 3.6 * (P.vapp / 140);
const vRot = P => vApp(P) * 1.08;
const V_TAXI = 1.4, V_TAXI_TURN = 0.65, GLIDE = Math.tan(5 * Math.PI / 180); // 見やすさのため5°の進入角
function rwAxis(r, e) {
  // e: 0=始点側から進入
  const ri = runwayInfo(r);
  const dir = e ? -1 : 1;
  const a0 = e ? ri.x1 : ri.x0;   // しきい値
  const P = (t, alt) => ri.horiz ? { x: a0 + dir * t, z: ri.c, y: alt || 0 } : { x: ri.c, z: a0 + dir * t, y: alt || 0 };
  return { ri, dir, P, len: ri.len, hdg: ri.horiz ? (dir > 0 ? Math.PI / 2 : -Math.PI / 2) : (dir > 0 ? 0 : Math.PI) };
}
function setApproachPath(pl, r) {
  const ax = rwAxis(r, G.windDir || 0);
  pl.ax = ax;
  if (pl.state !== 'hold') {
    // 最終進入の少し横から入ってきて、旋回して滑走路に正対する
    const side = Math.random() < 0.5 ? -1 : 1;
    const s = ax.P(-62, 62 * GLIDE + 1.5);
    const perp = ax.ri.horiz ? { x: 0, z: 1 } : { x: 1, z: 0 };
    pl.x = s.x + perp.x * side * 14; pl.z = s.z + perp.z * side * 14; pl.y = s.y + 1;
    pl.hdg = ax.hdg + side * 0.5 * (ax.ri.horiz ? (ax.dir > 0 ? -1 : 1) : (ax.dir > 0 ? 1 : -1));
  }
  pl.faf = ax.P(-24, 24 * GLIDE);
  pl.td = ax.P(clamp(ax.len * 0.12, 1.2, 3), 0);
  pl.state = 'approach'; pl.phase = 'base'; pl.spd = vApp(pl.P) * 1.1;
}
function runwayFreeFor(r, pl) { return (!r.busy || r.busy === pl) && G.min >= (r.wakeUntil || 0); }
function landingClose(r, except) {
  for (const p of RT.planes) if (p !== except && p.runway === r.uid && p.state === 'approach' && p.phase === 'final' && Math.hypot(p.x - p.td.x, p.z - p.td.z) < 28) return true;
  return false;
}
function pickStand(pl) {
  const fl = pl.fl;
  const r = G.blds[pl.runway];
  const cands = eligibleStands(fl).filter(s => !s.busy && standReachable(s, r));
  if (!cands.length) return null;
  const P = PLANES[fl.type], sc = P.stand || P.cls;
  cands.sort((a, b) => (B[a.id].cls - sc) * 5 - (B[b.id].cls - sc) * 5 + (a.gate && G.blds[a.gate] && B[G.blds[a.gate].id].bus ? 3 : 0) - (b.gate && G.blds[b.gate] && B[G.blds[b.gate].id].bus ? 3 : 0) + Math.random());
  return cands[0];
}
function turnToward(pl, target, rate, dt) {
  const d = angDiff(pl.hdg, target), st = rate * dt;
  pl.hdg += Math.abs(d) <= st ? d : Math.sign(d) * st;
  return d;
}
function updatePlane(pl, dt) {
  const fl = pl.fl, P = pl.P;
  const r = G.blds[pl.runway];
  if (!r && pl.state !== 'climb' && pl.state !== 'parked') { removePlane(pl); if (fl.status !== 'departed') cancelFlight(fl, '滑走路がなくなりました'); return; }
  let targetBank = 0;
  switch (pl.state) {
    case 'approach': {
      // 進入許可（駐機場・滑走路・霧）
      const dTD = Math.hypot(pl.td.x - pl.x, pl.td.z - pl.z);
      if (!pl.cleared && dTD < 40) {
        const fogBlock = G.weather === 'fog' && !hasKind('ils');
        const stand = !fogBlock ? pickStand(pl) : null;
        if (!stand) { startHold(pl); return; }
        pl.cleared = true; pl.stand = stand.uid; stand.busy = fl.id; fl.stand = stand.uid; fl.gate = stand.gate || 0;
        if (fl.gate && !fl.cargo) spawnCrew(fl, G.blds[fl.gate]);
      }
      if (pl.phase === 'base') {
        // FAF へ向かいながら旋回
        const dx = pl.faf.x - pl.x, dz = pl.faf.z - pl.z, d = Math.hypot(dx, dz);
        const want = Math.atan2(dx, dz);
        // 中心線の延長上の点（FAF）へ向かい、着いたら最終進入へ
        const turn = turnToward(pl, want, 0.42, dt);
        targetBank = clamp(-turn * 1.4, -0.45, 0.45);
        pl.x += Math.sin(pl.hdg) * pl.spd * dt; pl.z += Math.cos(pl.hdg) * pl.spd * dt;
        pl.y += (Math.max(pl.faf.y, 1.5) - pl.y) * Math.min(1, dt * 0.15);
        const hx0 = Math.sin(pl.ax.hdg), hz0 = Math.cos(pl.ax.hdg);
        const al0 = (pl.x - pl.td.x) * hx0 + (pl.z - pl.td.z) * hz0, cr0 = (pl.x - pl.td.x) * hz0 - (pl.z - pl.td.z) * hx0;
        pl.baseT = (pl.baseT || 0) + dt;
        if (d < 3.5 || (Math.abs(cr0) < 2 && al0 > -45 && al0 < -8 && Math.abs(angDiff(pl.hdg, pl.ax.hdg)) < 0.6)) { pl.phase = 'final'; pl.baseT = 0; }
        else if (pl.baseT > 30) { pl.baseT = 0; const st0 = pl.state; pl.state = 'x'; setApproachPath(pl, r); }
        pl.pitch = lerp(pl.pitch, 0.03, 0.1);
      } else {
        // 最終進入：滑走路の中心線にのり、5°で降下
        const hx = Math.sin(pl.ax.hdg), hz = Math.cos(pl.ax.hdg);
        const along = (pl.x - pl.td.x) * hx + (pl.z - pl.td.z) * hz;   // 負＝手前
        const cross = (pl.x - pl.td.x) * hz - (pl.z - pl.td.z) * hx;
        // 横ずれを直しながら中心線にのる（ローカライザー）
        const wantH = pl.ax.hdg - clamp(cross * 0.35, -0.6, 0.6);
        const tr = turnToward(pl, wantH, 0.6, dt);
        targetBank = clamp(-tr * 2, -0.3, 0.3);
        pl.spd = lerp(pl.spd, vApp(P), Math.min(1, dt * 0.3));
        pl.x += Math.sin(pl.hdg) * pl.spd * dt; pl.z += Math.cos(pl.hdg) * pl.spd * dt;
        const gs = Math.max(0, -along) * GLIDE;
        // 滑走路が空いていなければ着陸やり直し（ゴーアラウンド）
        if (along > -9 && r.busy !== pl) {
          if (runwayFreeFor(r, pl)) r.busy = pl;
          else { goAround(pl); break; }
        }
        // フレア（接地直前に機首を上げて降下をゆるめる）
        if (pl.y < 0.6) { pl.pitch = lerp(pl.pitch, 0.1, Math.min(1, dt * 0.8)); pl.y = Math.max(0, Math.min(pl.y, gs) - dt * pl.spd * 0.03); }
        else { pl.y = lerp(pl.y, gs, Math.min(1, dt * 0.5)); pl.pitch = lerp(pl.pitch, 0.045, 0.1); }
        if (along >= 0 && Math.abs(cross) > 0.7) { goAround(pl); break; }
        if (along >= 0 || (pl.y <= 0.005 && along > -1.5)) {
          // 接地は中心線の上に
          pl.x -= cross * hz; pl.z += cross * hx;
          pl.y = 0; pl.state = 'roll'; pl.rollT = 0; pl.hdg = pl.ax.hdg; pl.bank = 0;
          // 滑走路の残りで止まれるように減速度を決める
          const remain = Math.max(4, pl.ax.len - (pl.td && Math.abs(along)) - 5);
          pl.decel = (pl.spd * pl.spd - V_TAXI * V_TAXI) / (2 * Math.min(remain, Math.max(5, pl.ax.len * 0.55)));
          Sound.se('land'); if (P.eng !== 'prop') setTimeout(() => Sound.se('jet'), 300);
          Bus.emit('touchdown', pl);
          fl.status = 'landed'; fl.landT = G.min;
          onLanded(fl);
        }
      }
      break;
    }
    case 'hold': {
      // 待機経路（だ円のレーストラック）
      pl.holdT += dt;
      pl.ha += dt * pl.spd / 12;
      const cx = pl.hc.x + Math.cos(pl.ha) * 14, cz = pl.hc.z + Math.sin(pl.ha) * 8;
      const want = Math.atan2(cx - pl.x, cz - pl.z);
      turnToward(pl, want, 0.5, dt);
      pl.x += Math.sin(pl.hdg) * pl.spd * dt; pl.z += Math.cos(pl.hdg) * pl.spd * dt;
      pl.y = lerp(pl.y, 7, 0.02); targetBank = -0.4; pl.pitch = 0.02; pl.spd = vApp(P);
      if (pl.holdT > 4 && Math.floor(pl.holdT * 2) % 6 === 0) {
        const fogBlock = G.weather === 'fog' && !hasKind('ils');
        if (!fogBlock && (pl.cleared || pickStand(pl)) && !landingClose(r, pl)) { setApproachPath(pl, r); pl.phase = 'base'; }
      }
      if (pl.holdT > Extra.holdLimit()) { // ダイバート
        removePlane(pl); fl.status = 'cancel'; fl.why = '着陸できず他の空港へ';
        G.stat.today.divert++;
        const a = G.airlines[fl.airline]; if (a) a.rel = clamp(a.rel - 3, 0, 100);
        for (const p of RT.persons) if (p.fl === fl && p.kind === 'dep') missFlight(p);
        Bus.emit('divert', fl);
      }
      break;
    }
    case 'climb_ga': {
      // 再上昇して待機経路へ
      pl.gaT += dt;
      pl.pitch = lerp(pl.pitch, 0.14, 0.08); pl.spd = Math.min(vApp(P) * 1.3, pl.spd + dt * 0.3);
      pl.x += Math.sin(pl.hdg) * pl.spd * dt; pl.z += Math.cos(pl.hdg) * pl.spd * dt; pl.y += pl.spd * dt * 0.12;
      if (pl.gaT > 6) { const s2 = G.blds[pl.stand]; startHold(pl); }
      break;
    }
    case 'roll': {
      // 接地 → 前輪を下ろす → 逆噴射・ブレーキで減速
      pl.pitch = Math.max(0, pl.pitch - dt * 0.12);
      pl.spd = Math.max(V_TAXI, pl.spd - dt * (pl.decel || 0.5));
      const st = pl.spd * dt;
      pl.x += Math.sin(pl.hdg) * st; pl.z += Math.cos(pl.hdg) * st;
      pl.rollT += st;
      if (pl.spd <= V_TAXI * 1.02 || pl.rollT > pl.ax.len - 4) {
        const stand = G.blds[pl.stand];
        const cur = idx(clamp(Math.floor(pl.x), 0, W - 1), clamp(Math.floor(pl.z), 0, H - 1));
        if (!stand) { pl.state = 'taxi_out'; break; }
        const sc = bCenter(stand), goal = idx(Math.floor(sc.x), Math.floor(sc.z));
        let path = planePath(cur, goal, [stand.uid]);
        if (!path) path = planePath(runwayInfo(r).endTile(G.windDir ? 0 : 1), goal, [stand.uid]);
        pl.path = smoothPath(path ? path.map(tilePt) : [], pl);
        pl.path.push({ x: sc.x, z: sc.z });
        pl.pi = 0; pl.state = 'taxi_in'; pl.leaveRw = true;
        Bus.emit('taxiIn', pl);
      }
      break;
    }
    case 'taxi_in':
    case 'taxi_out': {
      // 滑走路を出たら使用中を解除
      if (pl.leaveRw && r && r.busy === pl && !onRunway(pl, r)) { r.busy = null; pl.leaveRw = false; r.wakeUntil = G.min + (P.cls >= 3 ? 2.5 : 1); }
      // 離陸前は滑走路の手前で一時停止（ホールドショート）
      if (pl.state === 'taxi_out' && pl.holdIdx != null && !pl.rwCleared && (pl.pi > pl.holdIdx || (pl.pi === pl.holdIdx && Math.hypot(pl.path[pl.pi].x - pl.x, pl.path[pl.pi].z - pl.z) < 0.6))) {
        pl.spd = Math.max(0, pl.spd - dt * 0.8);
        pl.wait += dt;
        if (runwayFreeFor(r, pl) && !landingClose(r, pl)) { pl.rwCleared = true; r.busy = pl; }
        if (pl.wait > 220) removePlane(pl);
        break;
      }
      if (followPath(pl, dt)) {
        if (pl.state === 'taxi_in') {
          pl.state = 'parking'; const stand = G.blds[pl.stand];
          pl.tHdg = stand ? Math.atan2(frontDir(stand.rot)[0], frontDir(stand.rot)[1]) : pl.hdg;
        } else { pl.state = 'align'; pl.wait = 0; if (!pl.rwCleared) { pl.rwCleared = true; r.busy = pl; } }
      }
      break;
    }
    case 'parking': {
      // 停止線に向かってゆっくり旋回して止まる
      const dA = turnToward(pl, pl.tHdg, 0.6, dt);
      pl.spd = 0.15;
      const stp = G.blds[pl.stand]; if (stp) { const c = bCenter(stp), k = Math.min(1, dt * 0.5); pl.x += (c.x - pl.x) * k; pl.z += (c.z - pl.z) * k; }
      if (Math.abs(dA) < 0.01 && (!stp || Math.hypot(bCenter(stp).x - pl.x, bCenter(stp).z - pl.z) < 0.05)) {
        pl.hdg = pl.tHdg; pl.state = 'parked'; pl.spd = 0; pl.engines = false;
        fl.status = 'parked'; fl.parkT = G.min;
        spawnTurnVehicles(pl);
      }
      break;
    }
    case 'parked': break;
    case 'pushback': {
      // トーイングカーで後ろに押し出し、誘導路の向きへ回す
      if (updateDeice(pl, dt)) break;
      pl.pbT += dt;
      const back = pl.pbDist || 1.5;
      if (pl.pbDone < back) {
        const sp = 0.18 * dt; pl.pbDone += sp;
        pl.x -= Math.sin(pl.hdg) * sp; pl.z -= Math.cos(pl.hdg) * sp;
        if (pl.pbDone > back * 0.45 && pl.pbTurn) turnToward(pl, pl.pbTurn, 0.22, dt);
      } else if (pl.pbT < pl.pbEnd) {
        // エンジン始動・トーイングカーが離れる
        if (!pl.engines) { pl.engines = true; Sound.se(P.eng === 'prop' ? 'prop' : 'jet'); }
      } else {
        if (pl.tug) { R.scene.remove(pl.tug); pl.tug = null; }
        pl.state = 'taxi_out'; pl.pi = 0; pl.spd = 0.1;
        // 自分の駐機場の中の経路点はとばす
        while (pl.pi < pl.path.length - 1 && G.floor[idx(Math.floor(pl.path[pl.pi].x), Math.floor(pl.path[pl.pi].z))] === FLOOR.APRON) pl.pi++;
      }
      if (pl.tug) { const nx = pl.x + Math.sin(pl.hdg) * (P.len / 2 + 0.4), nz = pl.z + Math.cos(pl.hdg) * (P.len / 2 + 0.4); pl.tug.position.set(nx, 0, nz); pl.tug.rotation.y = pl.hdg + Math.PI; }
      break;
    }
    case 'align': {
      // 滑走路の端で中心線にのって正対する
      const tp = pl.ax.P(Math.min(1.2, P.len * 0.4), 0);
      const dx = tp.x - pl.x, dz = tp.z - pl.z, d = Math.hypot(dx, dz);
      const k = Math.min(1, dt * 0.6);
      pl.x += dx * k; pl.z += dz * k;
      const dA = turnToward(pl, pl.ax.hdg, 0.7, dt);
      pl.spd = 0.2;
      if (Math.abs(dA) < 0.01 && d < 0.12) {
        pl.hdg = pl.ax.hdg; pl.x = tp.x; pl.z = tp.z; pl.state = 'takeoff'; pl.spd = 0.05; pl.rollT = 0;
        pl.acc = vRot(P) * vRot(P) / (2 * Math.max(4, pl.ax.len * (P.eng === 'prop' ? 0.32 : 0.48)));
        Sound.se(P.eng === 'prop' ? 'prop' : 'jet');
      }
      break;
    }
    case 'takeoff': {
      // 加速 → ローテーション（機首上げ） → 離陸
      pl.spd = Math.min(vRot(P) * 1.25, pl.spd + dt * (pl.acc || 0.6));
      const st = pl.spd * dt;
      pl.x += Math.sin(pl.hdg) * st; pl.z += Math.cos(pl.hdg) * st; pl.rollT += st;
      if (pl.spd >= vRot(P)) {
        pl.pitch = Math.min(0.16, pl.pitch + dt * 0.25);
        if (pl.pitch > 0.11) pl.y += st * Math.tan(pl.pitch) * 0.9;
      }
      if (pl.y > 0.5) { pl.state = 'climb'; pl.climbT = 0; pl.depTurn = (Math.random() - 0.5) * 1.6; }
      break;
    }
    case 'climb': {
      pl.climbT += dt;
      pl.spd = Math.min(vApp(P) * 1.7, pl.spd + dt * 0.25);
      if (pl.y > 0.9 && pl.gearT > 0) pl.gearT = Math.max(0, pl.gearT - dt * 0.8);
      if (r && r.busy === pl && pl.y > 1.2) { r.busy = null; r.wakeUntil = G.min + (P.cls >= 3 ? 2.5 : 1.2); }
      // 高度がとれたら行き先の方向へ旋回
      if (pl.y > 3.5 && Math.abs(pl.depTurn) > 0.02) { const t0 = pl.depTurn; const st2 = Math.sign(t0) * Math.min(Math.abs(t0), 0.12 * dt); pl.hdg += st2; pl.depTurn -= st2; targetBank = -Math.sign(t0) * 0.35; }
      const st = pl.spd * dt;
      pl.x += Math.sin(pl.hdg) * st; pl.z += Math.cos(pl.hdg) * st;
      pl.y += st * Math.tan(pl.pitch) * 0.85; pl.pitch = lerp(pl.pitch, 0.13, 0.05);
      contrail(pl);
      if (pl.y > 22 || pl.x < -60 || pl.x > W + 60 || pl.z < -60 || pl.z > H + 60) removePlane(pl);
      break;
    }
  }
  pl.bank = lerp(pl.bank, targetBank, 0.08);
  pl.hdg = Math.atan2(Math.sin(pl.hdg), Math.cos(pl.hdg));
  // 着陸脚
  if (pl.state === 'approach' || pl.state === 'hold') { const want = pl.y < 6 ? 1 : 0; pl.gearT = clamp(pl.gearT + (want ? 1 : -1) * dt * 0.6, 0, 1); }
  // メッシュ
  const m = pl.mesh, u = m.userData;
  m.position.set(pl.x, pl.y, pl.z);
  m.rotation.order = 'YXZ';
  m.rotation.y = pl.hdg; m.rotation.x = -pl.pitch; m.rotation.z = pl.bank;
  if (u.gear) { u.gear.visible = pl.gearT > 0.05; u.gear.scale.y = Math.max(0.05, pl.gearT); }
  // ライト：衝突防止灯（エンジンがかかっている間、1秒に1回）・ストロボ（滑走路と空中）・着陸灯
  const tt = RT.time;
  if (u.beacon) u.beacon.visible = pl.engines && (tt % 1.0) < 0.12;
  const inAirOrRw = pl.state === 'approach' || pl.state === 'hold' || pl.state === 'roll' || pl.state === 'takeoff' || pl.state === 'climb' || pl.state === 'align';
  if (u.strobe) u.strobe.visible = inAirOrRw && ((tt % 1.2) < 0.05 || ((tt % 1.2) > 0.15 && (tt % 1.2) < 0.2));
  if (u.land) u.land.visible = (pl.state === 'approach' && pl.phase === 'final') || pl.state === 'roll' || pl.state === 'takeoff' || (pl.state === 'climb' && pl.y < 6) || (RT.nightF > 0.5 && (pl.state === 'taxi_in' || pl.state === 'taxi_out' || pl.state === 'align'));
  // プロペラ
  for (const c of u.props || []) c.rotation.z += pl.engines ? 0.9 : (c.userData.spin = Math.max(0, (c.userData.spin || 0.9) * 0.96));
  // 地上車両・搭乗橋
  for (const v of pl.vehicles) updateTurnVehicle(pl, v, dt);
}
function onRunway(pl, r) {
  const def = B[r.id], [w, h] = dims(def, r.rot);
  return pl.x > r.x - 0.2 && pl.x < r.x + w + 0.2 && pl.z > r.y - 0.2 && pl.z < r.y + h + 0.2;
}
// タイルの中心をつないだ経路から、ほぼ一直線の点をはぶく
function smoothPath(pts, pl, keep) {
  if (pts.length < 3) return pts;
  const out = [pts[0]];
  for (let i = 1; i < pts.length - 1; i++) {
    const a = out[out.length - 1], b = pts[i], c = pts[i + 1];
    const cr = (b.x - a.x) * (c.z - b.z) - (b.z - a.z) * (c.x - b.x);
    if (Math.abs(cr) > 0.01 || i === keep) out.push(b);
  }
  out.push(pts[pts.length - 1]);
  return out;
}
function tilePt(i) { return { x: i % W + 0.5, z: Math.floor(i / W) + 0.5 }; }
function angDiff(a, b) { let d = b - a; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; return d; }
function lerpAngle(a, b, t) { return a + angDiff(a, b) * t; }
// 目標点を少し先に置いて追いかける（カーブがなめらかになる）
function followPath(pl, dt) {
  let blocked = false;
  for (const o of RT.planes) {
    if (o === pl || o.y > 0.5 || o.gone) continue;
    const dx = o.x - pl.x, dz = o.z - pl.z, d = Math.hypot(dx, dz);
    const minD = (pl.P.len + o.P.len) * 0.45 + 0.4;
    if (d < minD && d > 0.01) {
      const fwd = (dx * Math.sin(pl.hdg) + dz * Math.cos(pl.hdg)) / d;
      if (fwd > 0.6 && (o.state !== 'parked' || d < minD * 0.6)) { blocked = true; break; }
    }
  }
  if (blocked) { pl.blockT = (pl.blockT || 0) + dt; pl.spd = Math.max(0, pl.spd - dt * 1.2); if (pl.blockT < 8) return false; }
  else pl.blockT = 0;
  // 目標点
  // 近い点・うしろの点はとばす（最後の点以外）
  const rMin = 0.45 + pl.P.len * 0.12;   // 最小旋回半径
  while (pl.pi < pl.path.length - 1) {
    const q = pl.path[pl.pi], qd = Math.hypot(q.x - pl.x, q.z - pl.z);
    const fwd = (q.x - pl.x) * Math.sin(pl.hdg) + (q.z - pl.z) * Math.cos(pl.hdg);
    if (qd < 0.4 || (qd < rMin * 1.6 && fwd < qd * 0.2)) pl.pi++; else break;
  }
  if (pl.pi >= pl.path.length) return true;
  const t = pl.path[pl.pi];
  const last = pl.pi === pl.path.length - 1;
  const dx = t.x - pl.x, dz = t.z - pl.z, d = Math.hypot(dx, dz);
  const want = Math.atan2(dx, dz);
  const diff = Math.abs(angDiff(pl.hdg, want));
  // 曲がるときと止まる前はゆっくり
  let vt = diff > 0.9 ? 0.3 : diff > 0.4 ? V_TAXI_TURN : V_TAXI;
  // 目標が旋回円の内側にあるときは、ほぼその場で向きを変える（前輪ステアリング）
  const tight = diff > 0.8 && d < rMin * 1.6;
  if (tight) vt = 0.1;
  if (pl.pi + 1 < pl.path.length) { const n = pl.path[pl.pi + 1]; const nd = Math.abs(angDiff(want, Math.atan2(n.x - t.x, n.z - t.z))); if (nd > 0.6 && d < 1.6) vt = Math.min(vt, V_TAXI_TURN); }
  if (last) vt = Math.min(vt, Math.max(0.15, d * 0.5));
  if (pl.state === 'taxi_out' && pl.holdIdx != null && !pl.rwCleared && pl.pi === pl.holdIdx) vt = Math.min(vt, Math.max(0.12, d * 0.4));
  pl.spd += clamp(vt - pl.spd, -dt * 0.9, dt * 0.35);
  // 速さ÷最小旋回半径 ＝ 曲がれる角速度（小さい機体ほど小回り）
  turnToward(pl, want, Math.max(0.25, pl.spd / (tight ? rMin * 0.3 : rMin)), dt);
  const st = pl.spd * dt;
  pl.x += Math.sin(pl.hdg) * st; pl.z += Math.cos(pl.hdg) * st;
  if (last && d < Math.max(0.55, rMin * 0.9)) { pl.pi++; return true; }
  return false;
}
function goAround(pl) {
  pl.state = 'climb_ga'; pl.gaT = 0; pl.fl.goAround = (pl.fl.goAround || 0) + 1;
  Sound.se('jet');
  Bus.emit('goAround', pl.fl);
}
function startHold(pl) {
  if (!pl.cleared && (!RT.holdMsgT || G.min - RT.holdMsgT > 90)) { RT.holdMsgT = G.min; Bus.emit('holdNoStand', pl.fl); }
  pl.state = 'hold'; pl.holdT = pl.holdT || 0;
  pl.hc = { x: clamp(pl.x, 8, W - 8), z: clamp(pl.z, 6, H - 6) };
  pl.ha = Math.atan2((pl.z - pl.hc.z) / 8, (pl.x - pl.hc.x) / 14);
  pl.fl.status = 'hold';
}
function removePlane(pl) {
  pl.gone = true;
  R.scene.remove(pl.mesh);
  for (const v of pl.vehicles) R.scene.remove(v.mesh);
  if (pl.tug) R.scene.remove(pl.tug);
  pl.vehicles = [];
  const s = G.blds[pl.stand]; if (s && s.busy === pl.fl.id) s.busy = 0;
  const r = G.blds[pl.runway]; if (r) { if (r.busy === pl) r.busy = null; r._load = Math.max(0, (r._load || 1) - 1); }
}
function onLanded(fl) {
  const P = PLANES[fl.type];
  let fee = P.fee * G.feeLevel;
  earn(fee, 'landing');
  Extra.onLanded(fl);
  if (fl.cargo) earn(P.cargo * 9000 * rnd(0.8, 1.2) * Extra.cargoMul(), 'cargo');
  else earn(fl.paxArr * REGION_PFC[CITIES[fl.city].region] * G.feeLevel, 'pfc');
  if (hasKind('fuel')) earn(P.fee * 0.15, 'fuel');
  G.stat.today.flights++;
  G.dev = (G.dev || 0) + 1 + P.cls * 0.5;
  G.stat.today.paxArr += fl.paxArr;
  G.totalPax += fl.paxArr;
  // 遅れ
  const delay = Math.max(0, fl.landT - fl.arrT);
  fl.arrDelay = delay;
  if (!G.flags.firstFlight) { G.flags.firstFlight = true; Bus.emit('firstFlight', fl); }
  Bus.emit('landed', fl);
}
function pushback(fl) {
  const pl = fl.plane; if (!pl) return;
  fl.status = 'departed'; fl.actualDep = G.min; fl.boarding = false;
  fl.delay = Math.max(0, G.min - fl.depT);
  // 遅れ判定・好感度
  const a = G.airlines[fl.airline];
  if (a) {
    const ok = fl.delay <= 15;
    a.rel = clamp(a.rel + (ok ? (G.research.ontime ? 0.9 : 0.6) * (hasKind('hangar') ? 1.3 : 1) : -1.2), 0, 100);
    a.flights = (a.flights || 0) + 1;
  }
  if (fl.delay <= 15) G.stat.today.ontime++; else G.stat.today.late++;
  if (!fl.cargo) {
    earn(fl.boarded * REGION_PFC[CITIES[fl.city].region] * G.feeLevel, 'pfc');
    G.stat.today.paxDep += fl.boarded; G.totalPax += fl.boarded;
  } else earn(PLANES[fl.type].cargo * 7000 * rnd(0.8, 1.2) * Extra.cargoMul(), 'cargo');
  const route = G.routes.find(r => r.id === fl.rid);
  if (route) { route.flights = (route.flights || 0) + 1; route.pax = (route.pax || 0) + fl.boarded + fl.paxArr; route.seats = (route.seats || 0) + PLANES[fl.type].seats * 2; if (fl.delay <= 15) route.ontime = (route.ontime || 0) + 1; }
  // 車両片づけ（搭乗橋を外す）
  for (const v of pl.vehicles) R.scene.remove(v.mesh);
  pl.vehicles = [];
  // 経路：駐機場 → 誘導路 → 滑走路の手前で停止 → 滑走路へ
  const r = G.blds[pl.runway], stand = G.blds[pl.stand];
  const ax = rwAxis(r, G.windDir || 0); pl.ax = ax;
  const sc = stand ? bCenter(stand) : { x: pl.x, z: pl.z };
  const startTile = idx(Math.floor(sc.x), Math.floor(sc.z));
  const e = G.windDir || 0;
  let path = planePath(startTile, runwayInfo(r).endTile(e), [stand ? stand.uid : 0]);
  if (!path) path = planePath(startTile, runwayInfo(r).endTile(1 - e), [stand ? stand.uid : 0]);
  path = path || [];
  // 最初の滑走路マス＝ホールドショートの位置
  let hi = path.findIndex(i => G.floor[i] === FLOOR.RUNWAY);
  const pts = path.map(tilePt);
  pl.path = smoothPath(pts, pl, hi > 0 ? hi - 1 : -1);
  if (hi > 0) { const hp = pts[hi - 1]; pl.holdIdx = pl.path.indexOf(hp); if (pl.holdIdx < 0) pl.holdIdx = null; } else pl.holdIdx = null;
  pl.rwCleared = false; pl.wait = 0;
  // プッシュバック：誘導路の方へ下がって向きを変える
  const sd = stand ? dims(B[stand.id], stand.rot) : [3, 3];
  pl.pbDist = Math.max(0.8, Math.min(sd[0], sd[1]) / 2 - 0.3 + pl.P.len * 0.15);
  pl.pbDone = 0; pl.pbEnd = 5 + pl.P.cls;
  const j = pl.path.findIndex(p => G.floor[idx(Math.floor(p.x), Math.floor(p.z))] !== FLOOR.APRON);
  pl.pbTurn = null;
  if (j >= 0) {
    const p0 = pl.path[j], p1 = pl.path[j + 1] || p0;
    const D = p1 !== p0 ? Math.atan2(p1.x - p0.x, p1.z - p0.z) : Math.atan2(p0.x - pl.x, p0.z - pl.z);
    const dd = angDiff(pl.hdg, D);
    pl.pbTurn = pl.hdg + clamp(dd, -Math.PI / 2, Math.PI / 2);
  }
  pl.tug = vehicleMesh('tug'); pl.tug.scale.setScalar(0.7); R.scene.add(pl.tug);
  startDeice(pl);
  pl.state = 'pushback'; pl.pbT = 0; pl.spd = 0;
  if (stand) stand.busy = 0;
  Bus.emit('departed', fl);
}

// ---------- 折り返しの車と搭乗橋 ----------
const _dv = new THREE.Vector3();
function spawnTurnVehicles(pl) {
  const P = pl.P, gate = G.blds[pl.fl.gate];
  const bridge = gate && !B[gate.id].bus && !pl.fl.cargo && P.cls >= 2 && makeJetBridge(pl, gate);
  // 機体のまわりの車（ローカル座標：x=左翼側、z=機首側）
  const hs = P.span / 2, L = P.len;
  const list = [];
  list.push({ k: 'belt', lx: -0.45, lz: -L * 0.12 });                  // 貨物の積みこみ
  list.push({ k: 'cart', lx: -0.95, lz: -L * 0.12 });
  list.push({ k: 'cart', lx: -0.6, lz: L * 0.2 });
  if (hasKind('fuel')) list.push({ k: 'fuel', lx: hs * 0.45, lz: -L * 0.05, r: Math.PI / 2 });
  if (!pl.fl.cargo && P.cls >= 2) list.push({ k: 'catering', lx: -0.5, lz: -L * 0.36, r: -Math.PI / 2 });
  list.push({ k: 'gpu', lx: -0.35, lz: L * 0.38 });
  if (!bridge && !pl.fl.cargo) list.push({ k: 'stairs', lx: 0.45, lz: L * 0.3, r: -Math.PI / 2 });
  if (gate && B[gate.id].bus && !pl.fl.cargo) list.push({ k: 'rampbus', lx: 1.3, lz: L * 0.15, r: 0 });
  list.forEach((o, i) => {
    const m = vehicleMesh(o.k, AIRLINES[pl.fl.airline].tail);
    m.scale.setScalar(o.k === 'rampbus' ? 0.8 : 0.62);
    R.scene.add(m);
    pl.vehicles.push({ mesh: m, k: o.k, lx: o.lx, lz: o.lz, r: o.r || 0, t: -i * 1.5 - 1 });
  });
  if (bridge) pl.vehicles.push(bridge);
}
// ボーディングブリッジ（ターミナルの搭乗口から飛行機のドアへ）
function makeJetBridge(pl, gate) {
  const u = pl.mesh.userData;
  pl.mesh.updateMatrixWorld(true);
  const door = u.door.clone().applyMatrix4(pl.mesh.matrixWorld);
  const def = B[gate.id], [w, h] = dims(def, gate.rot), c = bCenter(gate);
  const [fx, fy] = frontDir(gate.rot);
  // 搭乗口の裏側（ターミナルの外壁）
  const sx = c.x - fx * (h / 2 + 0.1) * (fy !== 0 ? 1 : 0) - fx * (w / 2 + 0.1) * (fx !== 0 ? 1 : 0);
  const sz = c.z - fy * (h / 2 + 0.1) * (fy !== 0 ? 1 : 0) - fy * (w / 2 + 0.1) * (fx !== 0 ? 1 : 0);
  const dx = door.x - sx, dz = door.z - sz, len = Math.hypot(dx, dz);
  if (len > 7 || len < 0.5) return null;
  const g = new THREE.Group();
  const mb = new ModelBuilder();
  const y0 = FLOOR_H[FLOOR.TERM] + 0.35, y1 = door.y;
  // 回転台
  mb.cyl(0, 0, 0, 0.32, 0.32, y0 + 0.3, '#c8ccd4', 8);
  mb.box(0, y0 + 0.3, 0, 0.7, 0.06, 0.7, '#9aa0aa');
  // 通路（伸びる部分）
  const n = 3;
  for (let i = 0; i < n; i++) {
    const t0 = i / n, t1 = (i + 1) / n, tm = (t0 + t1) / 2;
    const yy = lerp(y0, y1 - 0.1, tm), ww = 0.34 - i * 0.02;
    mb.box(0, yy - 0.12, lerp(0, len - 0.25, tm), ww, 0.3, (len - 0.25) / n + 0.02, i % 2 ? '#d8dce4' : '#c8ccd6');
    mb.box(0, yy + 0.18, lerp(0, len - 0.25, tm), ww + 0.01, 0.02, (len - 0.25) / n, '#8a90a0');
  }
  for (const s of [-1, 1]) mb.box(s * 0.1, y0 + 0.02, len * 0.18 + 0.1, 0.03, 0.06, len * 0.5, '#4a8fe0');
  // 支柱と車輪
  mb.box(0, 0, len * 0.68, 0.06, lerp(y0, y1, 0.68) - 0.12, 0.06, '#7a7e8a');
  mb.box(0, 0, len * 0.68, 0.36, 0.1, 0.16, '#2a2a36');
  // 機体側のキャブ
  mb.box(0, y1 - 0.2, len - 0.14, 0.42, 0.36, 0.3, '#b8bcc8');
  const geo = mb.build({ shadow: true });
  g.add(geo);
  g.position.set(sx, 0, sz);
  g.rotation.y = Math.atan2(dx, dz);
  R.scene.add(g);
  return { mesh: g, k: 'bridge', t: 0, len };
}
function updateTurnVehicle(pl, v, dt) {
  v.t += dt;
  if (v.k === 'bridge') {
    // 伸びていくアニメーション
    v.mesh.scale.z = clamp(0.35 + v.t * 0.25, 0.35, 1);
    return;
  }
  const s = Math.sin(pl.hdg), c = Math.cos(pl.hdg);
  const k = clamp(v.t / 4, 0, 1);
  const lx = v.lx * (1 + (1 - k) * 3), lz = v.lz;
  // ローカル→ワールド（x=左, z=前）
  const x = pl.x + c * lx + s * lz, z = pl.z - s * lx + c * lz;
  v.mesh.position.set(x, 0, z);
  v.mesh.rotation.y = pl.hdg + v.r;
  v.mesh.visible = v.t > 0;
}

// ---------- まちの車・電車・ヘリ ----------
const Ambient = { cars: [], train: null, trainT: 0, heli: null, heliT: 0, robots: [] };
function updateAmbient(dt, dtReal) {
  // 車
  let roads = 0; for (let i = 0; i < W * H; i++) if (G.floor[i] === FLOOR.ROAD) roads++;
  const want = Math.min(24, Math.floor(roads / 5));
  while (Ambient.cars.length < want) {
    const tiles = []; for (let i = 0; i < W * H; i++) if (G.floor[i] === FLOOR.ROAD) tiles.push(i);
    if (!tiles.length) break;
    const t = pick(tiles);
    const k = Math.random() < 0.15 ? 'taxi' : Math.random() < 0.12 ? 'bus' : 'car';
    const m = vehicleMesh(k, pick(CARC)); R.scene.add(m);
    Ambient.cars.push({ mesh: m, tile: t, prev: -1, x: t % W + 0.5, z: Math.floor(t / W) + 0.5, tx: t % W + 0.5, tz: Math.floor(t / W) + 0.5, hdg: 0, spd: rnd(0.8, 1.2) });
  }
  while (Ambient.cars.length > want) { const c = Ambient.cars.pop(); R.scene.remove(c.mesh); }
  for (const c of Ambient.cars) {
    if (G.floor[c.tile] !== FLOOR.ROAD) { c.tile = -1; }
    const dx = c.tx - c.x, dz = c.tz - c.z, d = Math.hypot(dx, dz), st = c.spd * dt;
    if (d <= st || c.tile < 0) {
      c.x = c.tx; c.z = c.tz;
      if (c.tile < 0) { c.mesh.visible = false; continue; }
      const x = c.tile % W, y = Math.floor(c.tile / W);
      const opts = [];
      for (const [ddx, ddy] of DIRS4) { const nx = x + ddx, ny = y + ddy; if (inMap(nx, ny) && G.floor[idx(nx, ny)] === FLOOR.ROAD && idx(nx, ny) !== c.prev) opts.push(idx(nx, ny)); }
      if (!opts.length && c.prev >= 0) opts.push(c.prev);
      if (!opts.length) continue;
      // まっすぐを好む
      let nt = opts[0];
      if (opts.length > 1) { const sx = x - (c.prev % W), sy = y - Math.floor(c.prev / W); const str = opts.find(o => o % W - x === sx && Math.floor(o / W) - y === sy); nt = str != null && Math.random() < 0.7 ? str : pick(opts); }
      c.prev = c.tile; c.tile = nt;
      // 右側通行（日本は左側）
      const nx = nt % W, ny = Math.floor(nt / W), mx = nx - x, my = ny - y;
      c.tx = nx + 0.5 + my * 0.22; c.tz = ny + 0.5 - mx * 0.22;
    } else { c.x += dx / d * st; c.z += dz / d * st; c.hdg = lerpAngle(c.hdg, Math.atan2(dx, dz), 0.3); }
    c.mesh.visible = true;
    c.mesh.position.set(c.x, 0.005, c.z); c.mesh.rotation.y = c.hdg;
  }
  // 電車
  const st = Object.values(G.blds).find(b => b.id === 'station');
  if (st) {
    if (!Ambient.train) { Ambient.train = vehicleMesh('train'); R.scene.add(Ambient.train); Ambient.trainT = 0; }
    Ambient.trainT += dt;
    const cyc = 40, t = Ambient.trainT % cyc;
    const def = B.station, [w, h] = dims(def, st.rot), c = bCenter(st);
    // ホームの線路（ローカル z=-1.35）
    const along = t < 12 ? lerp(-40, 0, smooth(t / 12)) : t < 18 ? 0 : lerp(0, 40, smooth((t - 18) / 12));
    if (t < 0.1 + dt && t > 0) Sound.se('train');
    const fd = frontDir(st.rot);
    const lx = along, lz = -1.35;
    // ローカル→ワールド（rot）
    const rot = st.rot * Math.PI / 2, cs = Math.cos(rot), sn = Math.sin(rot);
    const wx = c.x + lx * cs + lz * sn, wz = c.z - lx * sn + lz * cs;
    Ambient.train.position.set(wx, 0.08, wz);
    Ambient.train.rotation.y = rot + Math.PI / 2;
    Ambient.train.visible = t < 30;
  } else if (Ambient.train) { R.scene.remove(Ambient.train); Ambient.train = null; }
  // 遊覧ヘリ
  const hp = Object.values(G.blds).find(b => b.id === 'heliport');
  if (hp) {
    if (!Ambient.heli) { Ambient.heli = vehicleMesh('heli'); R.scene.add(Ambient.heli); }
    const m = G.min % 1440, c = bCenter(hp);
    const flying = m > 9 * 60 && m < 17 * 60 && (m % 60) < 25 && G.weather !== 'typhoon' && G.weather !== 'fog';
    if (flying) {
      const t = (m % 60) / 25;
      const alt = Math.min(1, t * 6, (1 - t) * 6) * 9;
      const a = t * TAU;
      Ambient.heli.position.set(c.x + Math.sin(a) * 14 * Math.min(1, alt / 9), 0.2 + alt, c.z + (1 - Math.cos(a)) * 8 * Math.min(1, alt / 9));
      Ambient.heli.rotation.y = a + Math.PI / 2;
      Ambient.heli.visible = true;
      if ((m % 60) === 0 && !Ambient.heliPaid) { Ambient.heliPaid = true; earn(90000 * (1 + G.rank * 0.1), 'svc'); }
    } else { Ambient.heli.visible = false; Ambient.heliPaid = false; }
  } else if (Ambient.heli) { R.scene.remove(Ambient.heli); Ambient.heli = null; }
  // おそうじロボ
  const wantR = G.research.clean ? Math.min(6, 1 + Math.floor(countFloor(FLOOR.TERM) / 120)) : 0;
  while (Ambient.robots.length < wantR) { const m = vehicleMesh('robot'); R.scene.add(m); const t = randomTermTile(); if (t < 0) break; Ambient.robots.push({ mesh: m, x: t % W + 0.5, z: Math.floor(t / W) + 0.5, tx: t % W + 0.5, tz: Math.floor(t / W) + 0.5 }); }
  for (const r of Ambient.robots) {
    const dx = r.tx - r.x, dz = r.tz - r.z, d = Math.hypot(dx, dz), st2 = 0.25 * dt;
    if (d <= st2) { const x = Math.floor(r.x), y = Math.floor(r.z); const o = DIRS4.map(([a, b]) => [x + a, y + b]).filter(([a, b]) => inMap(a, b) && WALKABLE[idx(a, b)] && G.floor[idx(a, b)] === FLOOR.TERM); if (o.length) { const [a, b] = pick(o); r.tx = a + 0.5; r.tz = b + 0.5; } else { const t = randomTermTile(); if (t >= 0) { r.x = r.tx = t % W + 0.5; r.z = r.tz = Math.floor(t / W) + 0.5; } } }
    else { r.x += dx / d * st2; r.z += dz / d * st2; }
    r.mesh.position.set(r.x, FLOOR_H[FLOOR.TERM], r.z);
  }
}
function countFloor(f) { let n = 0; for (let i = 0; i < W * H; i++) if (G.floor[i] === f) n++; return n; }
function randomTermTile() { const t = []; for (let i = 0; i < W * H; i++) if (G.floor[i] === FLOOR.TERM && !G.occ[i]) t.push(i); return t.length ? pick(t) : -1; }
function clearAmbient() {
  for (const c of Ambient.cars) R.scene.remove(c.mesh); Ambient.cars = [];
  if (Ambient.train) R.scene.remove(Ambient.train); Ambient.train = null;
  if (Ambient.heli) R.scene.remove(Ambient.heli); Ambient.heli = null;
  for (const r of Ambient.robots) R.scene.remove(r.mesh); Ambient.robots = [];
}
