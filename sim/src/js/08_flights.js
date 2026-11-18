// ============================================================
//  飛行機・ダイヤ・地上の車両
// ============================================================
const SPD = { approach: 3.0, roll0: 2.6, taxi: 1.1, takeoff: 3.6, climb: 3.6, hold: 2.2 };
let flightSeq = 1;

function opsWindow() {
  return G.research.nightops ? [5 * 60, 24 * 60 - 15] : [6 * 60, 22 * 60];
}
function turnTime(type) {
  let t = PLANES[type].turn;
  if (hasKind('fuel')) t *= 0.8;
  if (G.weather === 'snow' && !hasKind('snow')) t *= 1.5;
  return t;
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
  const gap = (G.research.aitower ? 10 : 14) / nrw;
  let last = -1e9;
  for (const f of out) {
    if (f.arrT < last + gap) { const sh = Math.ceil((last + gap - f.arrT) / 5) * 5; f.arrT += sh; f.depT += sh; }
    last = f.arrT;
  }
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
    if (fl.status === 'sched' && now >= fl.arrT - 30) startApproach(fl);
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
  const pl = { fl, mesh: m, x: 0, y: 10, z: 0, hdg: 0, pitch: 0, bank: 0, spd: SPD.approach, state: 'approach', path: null, pi: 0, wait: 0, runway: 0, stand: 0, vehicles: [], P: PLANES[fl.type] };
  RT.planes.push(pl);
  return pl;
}
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
  const start = ax.P(-48, 13);
  if (pl.state !== 'hold') { pl.x = start.x; pl.y = start.y; pl.z = start.z; }
  pl.td = ax.P(2.5, 0);
  pl.hdg = Math.atan2(pl.td.x - pl.x, pl.td.z - pl.z);
  pl.state = 'approach'; pl.spd = SPD.approach;
}
function runwayFreeFor(r, pl) { return !r.busy || r.busy === pl; }
function landingClose(r, except) {
  for (const p of RT.planes) if (p !== except && p.runway === r.uid && (p.state === 'approach' && Math.hypot(p.x - p.td.x, p.z - p.td.z) < 20)) return true;
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
function updatePlane(pl, dt) {
  const fl = pl.fl;
  const r = G.blds[pl.runway];
  if (!r && pl.state !== 'climb' && pl.state !== 'parked') { removePlane(pl); if (fl.status !== 'departed') cancelFlight(fl, '滑走路がなくなりました'); return; }
  switch (pl.state) {
    case 'approach': {
      const dx = pl.td.x - pl.x, dz = pl.td.z - pl.z, d = Math.hypot(dx, dz);
      // 霧（ILSなし）・駐機場なし・滑走路使用中 → 待機
      if (d < 22 && !pl.cleared) {
        const fogBlock = G.weather === 'fog' && !hasKind('ils');
        const stand = !fogBlock && runwayFreeFor(r, pl) ? pickStand(pl) : null;
        if (!stand) { startHold(pl); return; }
        pl.cleared = true; r.busy = pl; pl.stand = stand.uid; stand.busy = fl.id; fl.stand = stand.uid; fl.gate = stand.gate || 0;
        if (fl.gate && !fl.cargo) spawnCrew(fl, G.blds[fl.gate]);
      }
      const st = pl.spd * dt;
      if (d <= st) {
        pl.x = pl.td.x; pl.z = pl.td.z; pl.y = 0; pl.state = 'roll'; pl.rollT = 0; pl.spd = SPD.roll0;
        pl.hdg = pl.ax.hdg;
        Sound.se('land');
        fl.status = 'landed'; fl.landT = G.min;
        onLanded(fl);
      } else {
        pl.x += dx / d * st; pl.z += dz / d * st;
        const tot = 50.5;
        pl.y = Math.max(0, 13 * clamp(d / tot, 0, 1));
        pl.hdg = lerpAngle(pl.hdg, Math.atan2(dx, dz), 0.1);
        pl.pitch = -0.04; pl.bank *= 0.95;
      }
      break;
    }
    case 'hold': {
      pl.holdT += dt;
      pl.ha += dt * SPD.hold / 11;
      const cx = pl.hc.x + Math.cos(pl.ha) * 11, cz = pl.hc.z + Math.sin(pl.ha) * 11;
      pl.hdg = Math.atan2(cx - pl.x, cz - pl.z);
      pl.x = cx; pl.z = cz; pl.y = 11; pl.bank = -0.35; pl.pitch = 0;
      if (pl.holdT > 4 && Math.floor(pl.holdT) % 3 === 0) {
        const fogBlock = G.weather === 'fog' && !hasKind('ils');
        if (!fogBlock && !r.busy && pickStand(pl)) { pl.cleared = false; setApproachPath(pl, r); pl.state = 'approach'; }
      }
      if (pl.holdT > 100) { // ダイバート
        removePlane(pl); fl.status = 'cancel'; fl.why = '着陸できず他の空港へ';
        G.stat.today.divert++;
        const a = G.airlines[fl.airline]; if (a) a.rel = clamp(a.rel - 3, 0, 100);
        for (const p of RT.persons) if (p.fl === fl && p.kind === 'dep') missFlight(p);
        Bus.emit('divert', fl);
      }
      break;
    }
    case 'roll': {
      pl.spd = Math.max(SPD.taxi * 0.9, pl.spd - dt * 0.6);
      const st = pl.spd * dt;
      pl.x += Math.sin(pl.hdg) * st; pl.z += Math.cos(pl.hdg) * st;
      pl.rollT += st;
      if (pl.spd <= SPD.taxi * 0.92 || pl.rollT > pl.ax.len - 4) {
        // 駐機場へ
        const stand = G.blds[pl.stand];
        const cur = idx(clamp(Math.floor(pl.x), 0, W - 1), clamp(Math.floor(pl.z), 0, H - 1));
        if (!stand) { pl.state = 'taxi_out'; break; }
        const sc = bCenter(stand);
        const path = planePath(cur, idx(Math.floor(sc.x), Math.floor(sc.z)), [stand.uid]);
        if (!path) {
          // 進行方向の先の端から
          const alt = planePath(runwayInfo(r).endTile(G.windDir ? 0 : 1), idx(Math.floor(sc.x), Math.floor(sc.z)), [stand.uid]);
          pl.path = alt ? alt.map(tilePt) : [{ x: sc.x, z: sc.z }];
        } else pl.path = path.map(tilePt);
        // 最後は駐機場の中心（ずらし）
        pl.path.push({ x: sc.x, z: sc.z });
        pl.pi = 0; pl.state = 'taxi_in';
        if (r.busy === pl) r.busy = null;
      }
      break;
    }
    case 'taxi_in':
    case 'taxi_out': {
      if (followPath(pl, dt)) {
        if (pl.state === 'taxi_in') {
          pl.state = 'parking'; const stand = G.blds[pl.stand];
          pl.tHdg = stand ? Math.atan2(frontDir(stand.rot)[0], frontDir(stand.rot)[1]) : pl.hdg;
        } else { pl.state = 'lineup'; pl.wait = 0; }
      }
      break;
    }
    case 'parking': {
      { const dA = angDiff(pl.hdg, pl.tHdg), stp = dt * 0.9; pl.hdg += Math.abs(dA) <= stp ? dA : Math.sign(dA) * stp; }
      if (Math.abs(angDiff(pl.hdg, pl.tHdg)) < 0.01) {
        pl.hdg = pl.tHdg; pl.state = 'parked';
        fl.status = 'parked'; fl.parkT = G.min;
        spawnTurnVehicles(pl);
      }
      break;
    }
    case 'parked': break;
    case 'pushback': {
      // 後ろへ少し下がる
      pl.pbT += dt;
      const sp = 0.12 * dt;
      pl.x -= Math.sin(pl.hdg) * sp; pl.z -= Math.cos(pl.hdg) * sp;
      if (pl.pbT > 4) { pl.state = 'taxi_out'; pl.pi = 0; }
      break;
    }
    case 'lineup': {
      pl.wait += dt;
      const can = runwayFreeFor(r, pl) && !landingClose(r, pl);
      if (can) {
        r.busy = pl; pl.state = 'align';
      }
      if (pl.wait > 200) { removePlane(pl); }
      break;
    }
    case 'align': {
      { const dA = angDiff(pl.hdg, pl.ax.hdg), stp = dt * 0.9; pl.hdg += Math.abs(dA) <= stp ? dA : Math.sign(dA) * stp; }
      const tp = pl.ax.P(1, 0);
      pl.x += (tp.x - pl.x) * Math.min(1, dt * 0.6); pl.z += (tp.z - pl.z) * Math.min(1, dt * 0.6);
      if (Math.abs(angDiff(pl.hdg, pl.ax.hdg)) < 0.01 && Math.hypot(tp.x - pl.x, tp.z - pl.z) < 0.4) { pl.hdg = pl.ax.hdg; pl.state = 'takeoff'; pl.spd = 0.3; pl.rollT = 0; Sound.se(pl.P.eng === 'prop' ? 'prop' : 'jet'); }
      break;
    }
    case 'takeoff': {
      pl.spd = Math.min(SPD.takeoff, pl.spd + dt * 0.5);
      const st = pl.spd * dt;
      pl.x += Math.sin(pl.hdg) * st; pl.z += Math.cos(pl.hdg) * st; pl.rollT += st;
      if (pl.rollT > pl.ax.len * 0.6) { pl.state = 'climb'; if (r.busy === pl) r.busy = null; }
      break;
    }
    case 'climb': {
      pl.spd = Math.min(SPD.climb * 1.2, pl.spd + dt * 0.2);
      const st = pl.spd * dt;
      pl.x += Math.sin(pl.hdg) * st; pl.z += Math.cos(pl.hdg) * st;
      pl.y += st * 0.28; pl.pitch = lerp(pl.pitch, 0.18, 0.05);
      if (pl.y > 16 || pl.x < -40 || pl.x > W + 40 || pl.z < -40 || pl.z > H + 40) removePlane(pl);
      break;
    }
  }
  // メッシュ
  const m = pl.mesh;
  const base = pl.y <= 0.001 ? 0 : 0;
  m.position.set(pl.x, pl.y + base, pl.z);
  m.rotation.set(0, 0, 0);
  m.rotation.order = 'YXZ';
  m.rotation.y = pl.hdg; m.rotation.x = -pl.pitch; m.rotation.z = pl.bank;
  // プロペラ
  for (const c of m.children) if (c.userData.prop) c.rotation.z += 0.9;
  // 地上車両
  for (const v of pl.vehicles) updateTurnVehicle(pl, v, dt);
}
function tilePt(i) { return { x: i % W + 0.5, z: Math.floor(i / W) + 0.5 }; }
function angDiff(a, b) { let d = b - a; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; return d; }
function lerpAngle(a, b, t) { return a + angDiff(a, b) * t; }
function followPath(pl, dt) {
  // 前の飛行機
  let blocked = false;
  for (const o of RT.planes) {
    if (o === pl || o.y > 0.5 || o.gone) continue;
    const dx = o.x - pl.x, dz = o.z - pl.z, d = Math.hypot(dx, dz);
    const minD = (pl.P.len + o.P.len) * 0.42 + 0.3;
    if (d < minD && d > 0.01) {
      const fwd = (dx * Math.sin(pl.hdg) + dz * Math.cos(pl.hdg)) / d;
      if (fwd > 0.55 && (o.state !== 'parked' || d < minD * 0.7)) { blocked = true; break; }
    }
  }
  if (blocked) { pl.blockT = (pl.blockT || 0) + dt; if (pl.blockT < 7) return false; }
  else pl.blockT = 0;
  let rem = pl.spd * dt;
  while (rem > 0 && pl.pi < pl.path.length) {
    const t = pl.path[pl.pi];
    const dx = t.x - pl.x, dz = t.z - pl.z, d = Math.hypot(dx, dz);
    if (d < 0.001) { pl.pi++; continue; }
    const want = Math.atan2(dx, dz);
    const turn = Math.abs(angDiff(pl.hdg, want));
    pl.hdg = lerpAngle(pl.hdg, want, Math.min(1, dt * 0.9 + (d < 0.6 ? 0.3 : 0)));
    const spd = turn > 0.6 ? 0.5 : 1;
    const st = rem * spd;
    if (d <= st) { pl.x = t.x; pl.z = t.z; pl.pi++; rem -= d / spd; }
    else { pl.x += dx / d * st; pl.z += dz / d * st; rem = 0; }
  }
  pl.spd = Math.min(SPD.taxi, pl.spd + dt * 0.4);
  return pl.pi >= pl.path.length;
}
function startHold(pl) {
  pl.state = 'hold'; pl.holdT = pl.holdT || 0;
  pl.hc = { x: clamp(pl.x, 5, W - 5), z: clamp(pl.z, 5, H - 5) };
  pl.ha = Math.atan2(pl.z - pl.hc.z, pl.x - pl.hc.x);
  pl.fl.status = 'hold';
}
function removePlane(pl) {
  pl.gone = true;
  R.scene.remove(pl.mesh);
  for (const v of pl.vehicles) R.scene.remove(v.mesh);
  pl.vehicles = [];
  const s = G.blds[pl.stand]; if (s && s.busy === pl.fl.id) s.busy = 0;
  const r = G.blds[pl.runway]; if (r) { if (r.busy === pl) r.busy = null; r._load = Math.max(0, (r._load || 1) - 1); }
}
function onLanded(fl) {
  const P = PLANES[fl.type];
  let fee = P.fee * G.feeLevel;
  earn(fee, 'landing');
  if (fl.cargo) earn(P.cargo * 9000 * rnd(0.8, 1.2), 'cargo');
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
  { const st = {}; for (const p of RT.persons) if (p.fl === fl && p.kind === 'dep') { const k = p.state + ':' + (p.steps[0] || '') + (p.facUid && G.blds[p.facUid] ? ':' + G.blds[p.facUid].id : ''); st[k] = (st[k] || 0) + 1; } RT.dbgPush = RT.dbgPush || []; RT.dbgPush.push(fl.code + ' ' + JSON.stringify(st)); }
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
  } else earn(PLANES[fl.type].cargo * 7000 * rnd(0.8, 1.2), 'cargo');
  const route = G.routes.find(r => r.id === fl.rid);
  if (route) { route.flights = (route.flights || 0) + 1; route.pax = (route.pax || 0) + fl.boarded + fl.paxArr; route.seats = (route.seats || 0) + PLANES[fl.type].seats * 2; if (fl.delay <= 15) route.ontime = (route.ontime || 0) + 1; }
  // 車両片づけ
  for (const v of pl.vehicles) R.scene.remove(v.mesh);
  pl.vehicles = [];
  // 経路
  const r = G.blds[pl.runway], stand = G.blds[pl.stand];
  const ax = rwAxis(r, G.windDir || 0); pl.ax = ax;
  const sc = stand ? bCenter(stand) : { x: pl.x, z: pl.z };
  const startTile = idx(Math.floor(sc.x), Math.floor(sc.z));
  const e = G.windDir || 0;
  let path = planePath(startTile, runwayInfo(r).endTile(e), [stand ? stand.uid : 0]);
  if (!path) path = planePath(startTile, runwayInfo(r).endTile(1 - e), [stand ? stand.uid : 0]);
  pl.path = path ? path.map(tilePt) : [];
  pl.state = 'pushback'; pl.pbT = 0; pl.spd = 0.2;
  if (stand) stand.busy = 0;
  Bus.emit('departed', fl);
}

// ---------- 折り返しの車 ----------
function spawnTurnVehicles(pl) {
  const kinds = ['cart'];
  if (hasKind('fuel')) kinds.push('fuel');
  if (!pl.fl.cargo && pl.P.cls >= 2) kinds.push('catering');
  const gate = G.blds[pl.fl.gate];
  if (pl.P.cls === 1 || (gate && B[gate.id].bus)) kinds.push('stairs');
  if (gate && B[gate.id].bus) kinds.push('rampbus');
  const side = [[1, 0.3], [-1, -0.1], [1, -0.5], [-1, 0.45], [1.3, 0.8]];
  kinds.forEach((k, i) => {
    const m = vehicleMesh(k, AIRLINES[pl.fl.airline].tail);
    R.scene.add(m);
    const [sx, sz] = side[i % side.length];
    const off = (pl.P.span / 2) * 0.55 + 0.3;
    pl.vehicles.push({ mesh: m, k, lx: sx * (k === 'stairs' ? pl.P.span * 0.12 + 0.35 : off), lz: sz * pl.P.len * 0.4, t: -i * 2 - 1 });
  });
}
function updateTurnVehicle(pl, v, dt) {
  v.t += dt;
  const s = Math.sin(pl.hdg), c = Math.cos(pl.hdg);
  const k = clamp(v.t / 4, 0, 1);
  const lx = v.lx * (1 + (1 - k) * 2.5), lz = v.lz;
  const x = pl.x + c * lx + s * lz, z = pl.z - s * lx + c * lz;
  v.mesh.position.set(x, 0, z);
  v.mesh.rotation.y = pl.hdg + (v.k === 'stairs' ? (v.lx > 0 ? -Math.PI / 2 : Math.PI / 2) : 0);
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
