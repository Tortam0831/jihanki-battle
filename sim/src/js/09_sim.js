// ============================================================
//  シミュレーション（時間・お金・評価・ランク・天気・イベント）
// ============================================================
function newStatDay() {
  return {
    income: { landing: 0, pfc: 0, food: 0, shop: 0, svc: 0, park: 0, hotel: 0, cargo: 0, fuel: 0, other: 0 },
    expense: { upkeep: 0, other: 0 }, flights: 0, paxArr: 0, paxDep: 0, paxDone: 0, sat: 0, satW: 0,
    missed: 0, cancel: 0, divert: 0, ontime: 0, late: 0, unmet: {}, visitors: 0, noIntl: 0
  };
}
function newGameState(opt) {
  opt = opt || {};
  G = {
    ver: VERSION, name: opt.name || 'そらのみなと空港', boss: opt.boss || '空港長', free: !!opt.free,
    money: opt.free ? 999999999 : 5000000, min: 7 * 60, day: 0, speed: 1,
    rank: 1, points: 0, rating: 2.5, totalPax: 0, feeLevel: 1,
    routes: [], airlines: {}, research: {}, combos: {}, ach: {}, seenPax: {}, seenPlanes: {}, stamps: {},
    weather: 'sun', forecast: ['sun', 'sun'], windDir: 0, flags: {}, story: { ch: 0, step: 0, done: {} },
    stat: { today: newStatDay(), buildCost: 0 }, hist: [], satHist: [], events: [], monthReport: null,
    tut: !opt.free, nextUid: 1,
  };
  for (const id of Object.keys(AIRLINES)) G.airlines[id] = { rel: id === 'soyokaze' ? 40 : 25, flights: 0 };
  G.seed = opt.seed || Math.floor(Math.random() * 99999);
  genMap(G.seed);
  setupStart();
  if (opt.free) { G.rank = 10; G.points = RANKS[9].pts; G.sectors.fill(1); G.tut = false; }
  G.forecast = [rollWeather(0), rollWeather(1)];
  RT.todayFlights = [];
}

function earn(amount, cat, b) {
  if (!amount || !isFinite(amount)) return;
  G.money += amount;
  const inc = G.stat.today.income;
  inc[cat] = (inc[cat] || 0) + amount;
  if (b) { b.salesToday = (b.salesToday || 0) + amount; b.salesTotal = (b.salesTotal || 0) + amount; }
  RT.earnAcc = (RT.earnAcc || 0) + amount;
  if (b && amount > 0) Bus.emit('earn', b, amount);
}
function spend(amount, cat) {
  G.money -= amount;
  const ex = G.stat.today.expense;
  ex[cat] = (ex[cat] || 0) + amount;
}
function dailyUpkeep() {
  let up = 0;
  for (const b of Object.values(G.blds)) { const d = B[b.id]; up += (d.upkeep || 0) * (1 + (b.lv - 1) * 0.3); }
  let k = 1;
  if (G.research.eco) k -= 0.15;
  if (G.research.ecoplus) k -= 0.15;
  up *= k * 2 * Extra.upkeepMul();
  // 人件費（乗客の数に応じて）
  const t = G.stat.today; up += (t.paxArr + t.paxDep) * 70;
  const solars = Object.values(G.blds).filter(b => b.id === 'solar').length;
  up -= Math.min(10, solars) * (G.weather === 'sun' ? 5000 : 3000);
  return Math.max(0, Math.round(up));
}
function rollWeather(dayOffset) {
  const d = dateOf(G.day + dayOffset);
  const tbl = [
    { sun: 50, cloud: 25, rain: 18, fog: 7 },
    { sun: 55, cloud: 15, rain: 20, fog: 4, typhoon: (d.month === 8 || d.month === 9) ? 6 : 0 },
    { sun: 52, cloud: 25, rain: 14, fog: 7, typhoon: d.month === 9 ? 4 : 0 },
    { sun: 40, cloud: 25, snow: 28, fog: 5, rain: 2 },
  ][d.season];
  if (G.day + dayOffset < 4) return 'sun';
  return weightedPick(Object.keys(tbl), k => tbl[k]);
}

// ---------- 1日のはじまり ----------
function closeDay() {
  const t = G.stat.today;
  const sat = t.satW > 0 ? t.sat / t.satW : (G.satHist.length ? G.satHist[G.satHist.length - 1] : 50);
  const up = dailyUpkeep();
  spend(up, 'upkeep');
  // ホテル
  for (const b of Object.values(G.blds)) {
    const d = B[b.id];
    if (d.kind === 'hotel') { const v = (t.paxArr + t.paxDep) * 60 * d.income * (1 + comboBonus(b)) * (1 + (b.lv - 1) * 0.2) + 20000 * d.income; earn(v, 'hotel', b); }
  }
  const inc = Object.values(t.income).reduce((a, b) => a + b, 0), exp = Object.values(t.expense).reduce((a, b) => a + b, 0);
  G.hist.push({ day: G.day, pax: t.paxArr + t.paxDep, inc, exp, sat, flights: t.flights, visitors: t.visitors, cancel: t.cancel + t.divert, income: Object.assign({}, t.income), ontime: t.ontime, late: t.late, unmet: Object.assign({}, t.unmet), missed: t.missed });
  if (G.hist.length > 72) G.hist.shift();
  if (t.satW > 0) G.satHist.push(sat);
  if (G.satHist.length > 4) G.satHist.shift();
  updateRating();
  for (const b of Object.values(G.blds)) { b.salesYest = b.salesToday || 0; b.salesToday = 0; b.ckToday = 0; }
  RT.lastDay = G.hist[G.hist.length - 1];
  Extra.daily();
  Bus.emit('dayClosed', RT.lastDay);
}
function updateRating() {
  const s = G.satHist.length ? G.satHist.reduce((a, b) => a + b, 0) / G.satHist.length : 50;
  let r = s / 20;
  // 施設ボーナス・ペナルティ
  const jets = G.routes.some(rt => rt.active && PLANES[rt.type].cls >= 2);
  if (jets && !hasKind('fire')) r -= 0.5;
  if (hasKind('fire')) r += 0.1;
  const last = G.hist[G.hist.length - 1];
  if (last && last.flights > 0) { const otp = (last.ontime + 1) / (last.ontime + last.late + 1); r += (otp - 0.8) * 0.8; }
  if (last && last.cancel > 0) r -= Math.min(0.6, last.cancel * 0.1);
  if (G.research.mascot) r += 0.1;
  r += Extra.ratingAdd();
  G.rating = clamp(Math.round(r * 10) / 10, 0.5, 5);
}
function startDay(day) {
  G.day = day;
  G.stat.today = newStatDay();
  const d = dateOf(day);
  // 天気
  G.weather = G.forecast.shift() || rollWeather(0);
  G.forecast.push(rollWeather(2));
  if (G.weather === 'typhoon') G.ach.typhoon || unlockAch('typhoon');
  G.windDir = Math.random() < 0.5 ? 0 : 1;
  setSeasonVisual(d.season);
  // 雪だるまは春にとける
  if (d.season !== 3) for (const b of Object.values(G.blds)) if (b.id === 'snowman') removeBuilding(b.uid, { noRefund: true });
  // イベント
  G.flags.event = null; G.flags.schoolTrip = false; G.flags.athlete = G.flags.idol = G.flags.diplomat = G.flags.bizBoost = G.flags.clean = G.flags.birds = false;
  rollEvent(day);
  RT.todayFlights = makeSchedule(day * 1440);
  RT.visitorsToday = 0;
  if (d.part === 0 && day > 0) monthReport();
  if (d.month === 4 && d.part === 0 && d.year === 3) unlockAch('year3');
  Bus.emit('newDay', day);
  autoSave();
}
function monthReport() {
  const days = G.hist.slice(-3);
  if (!days.length) return;
  const sum = k => days.reduce((a, b) => a + (b[k] || 0), 0);
  G.monthReport = { pax: sum('pax'), inc: sum('inc'), exp: sum('exp'), flights: sum('flights'), visitors: sum('visitors'), sat: days.reduce((a, b) => a + b.sat, 0) / days.length, day: G.day };
  Bus.emit('monthReport', G.monthReport);
}
// ---------- イベント ----------
const EVENTS = [
  { id: 'festival', name: '夏まつり', when: d => d.month === 8 && d.part === 1, desc: '夜に花火があがる！見学客がたくさん来る', visitors: 2.5, fireworks: true },
  { id: 'hanami', name: 'お花見シーズン', when: d => d.month === 4 && d.part === 1, desc: '桜の木の美しさがアップ。見学客も増える', visitors: 1.6 },
  { id: 'airshow', name: '航空祭', when: d => d.month === 10 && d.part === 1 && G.research.airshow, desc: '空を飛行機が舞う！見学客が大集合', visitors: 4, airshow: true },
  { id: 'xmas', name: 'クリスマス', when: d => d.month === 12 && d.part === 2, desc: 'イルミネーションで夜の満足度アップ', visitors: 1.5 },
  { id: 'newyear', name: 'お正月ラッシュ', when: d => d.month === 1 && d.part === 0, desc: '帰省のお客さんで大にぎわい', demand: 1.2 },
  { id: 'gw', name: 'ゴールデンウィーク', when: d => d.month === 5 && d.part === 0, desc: '旅行のお客さんがいっぱい', demand: 1.15, visitors: 1.5 },
  { id: 'obon', name: 'お盆', when: d => d.month === 8 && d.part === 2, desc: '帰省ラッシュ', demand: 1.15 },
  { id: 'snowfes', name: '雪まつり', when: d => d.month === 2 && d.part === 1, desc: '雪だるまを作ろう！美しさアップ', visitors: 1.4 },
  { id: 'halloween', name: 'ハロウィン', when: d => d.month === 10 && d.part === 2, desc: '仮装したお客さんが来る…かも', visitors: 1.3 },
];
const RANDOM_EVENTS = [
  { id: 'schooltrip', name: '修学旅行', p: 0.08, desc: '学生さんがたくさんやってくる', apply: () => { G.flags.schoolTrip = true; } },
  { id: 'celeb', name: '有名人がお忍びで来港', p: 0.05, minRank: 3, desc: 'ファンの見学客が増える！', visitors: 1.8 },
  { id: 'tv', name: 'テレビの取材', p: 0.05, minRank: 2, desc: '評価が高いと宣伝効果バツグン', apply: () => { G.points += Math.round(G.rating * 60 * G.rank); } },
  { id: 'gift', name: '町からの補助金', p: 0.04, desc: 'ミナト町長から応援のお金が届いた', apply: () => { const v = 300000 * G.rank; earn(v, 'other'); toast(`補助金 ${fmtYen(v)} を受け取りました！`, 'good'); } },
  { id: 'birds', name: '渡り鳥の群れ', p: 0.04, desc: 'ちょっとだけ発着が遅れるかも', apply: () => { G.flags.birds = true; } },
];
function rollEvent(day) {
  const d = dateOf(day);
  for (const ev of EVENTS) if (ev.when(d)) { G.flags.event = ev.id; G.flags.eventDef = ev.id; if (ev.apply) ev.apply(); announceEvent(ev); if (ev.id === 'airshow') unlockAch('airshow'); return; }
  if (day < 3) return;
  for (const ev of RANDOM_EVENTS) {
    if (ev.minRank && G.rank < ev.minRank) continue;
    if (Math.random() < ev.p) { G.flags.event = ev.id; if (ev.apply) ev.apply(); announceEvent(ev); return; }
  }
}
function announceEvent(ev) { G.events.unshift({ day: G.day, name: ev.name }); if (G.events.length > 30) G.events.pop(); Bus.emit('event', ev); }
function eventDef() { return EVENTS.find(e => e.id === G.flags.event) || RANDOM_EVENTS.find(e => e.id === G.flags.event) || null; }

// ---------- 見学客 ----------
function visitorRate() {
  let v = 0;
  for (const b of Object.values(G.blds)) {
    if (b.id === 'deck') v += (3 + b.lv * 1.5) * (nearRunway(b) ? 1.5 : 1);
    if (b.id === 'park') v += 2;
    if (b.id === 'heliport') v += 2;
    if (b.id === 'aquarium' || b.id === 'planetarium') v += 1.5;
    if (b.id === 'statue' || b.id === 'shrine' || b.id === 'clocktower') v += 0.6;
  }
  for (const b of Object.values(G.blds)) { if (b.id === 'outlet') v += 4; if (b.id === 'museum') v += 3; if (b.id === 'ferris') v += 2.5; }
  const ev = eventDef(); if (ev && ev.visitors) v *= ev.visitors;
  v *= (0.6 + G.rating / 6) * Extra.visitorMul();
  return v;
}
function hourlyTick(hour) {
  const ev = eventDef();
  const night = hour < 7 || hour >= (G.research.lightup ? 21 : 19);
  if (!night) {
    const rate = visitorRate();
    let n = Math.floor(rate) + (Math.random() < rate % 1 ? 1 : 0);
    if (RT.persons.length > 1000) n = Math.floor(n / 3);
    for (let i = 0; i < n; i++) { spawnVisitor(pick(['family', 'kid', 'maniac', 'couple', 'elder', 'student', 'tourist', 'kid', 'maniac'])); G.stat.today.visitors++; }
  }
  if (G.weather === 'fog' && hour >= 11) { G.weather = 'cloud'; Bus.emit('weather'); }
  if (G.research.mascot) spawnMascot();
  // からくり時計
  if (Object.values(G.blds).some(b => b.id === 'karakuri')) for (const p of RT.persons) if (p.w > 0 && Math.random() < 0.3) { moodAdd(p, 2); bubble(p, 'note', 1.2); }
  if (ev && ev.fireworks && hour === 20) Bus.emit('fireworks');
  if (ev && ev.airshow && (hour === 11 || hour === 14)) Bus.emit('airshow');
}

// ---------- ランク ----------
function checkRank() {
  let r = 1;
  for (let i = 0; i < RANKS.length; i++) if (G.points >= RANKS[i].pts) r = i + 1;
  if (r > G.rank) {
    const old = G.rank; G.rank = r;
    Bus.emit('rankUp', r, old);
  }
}
function unlockAch(id) {
  if (G.ach[id] || G.free) return;
  const a = ACHIEVEMENTS.find(x => x.id === id); if (!a) return;
  G.ach[id] = G.day + 1;
  Bus.emit('ach', a);
}
function checkAchievements() {
  const last = RT.lastDay;
  const t = G.stat.today;
  const paxToday = t.paxArr + t.paxDep;
  const best = Math.max(paxToday, last ? last.pax : 0);
  if (G.flags.firstFlight) unlockAch('first');
  if (best >= 100) unlockAch('pax100');
  if (best >= 1000) unlockAch('pax1000');
  if (best >= 5000) unlockAch('pax5000');
  if (best >= 10000) unlockAch('pax10000');
  if (G.totalPax >= 1e6) unlockAch('total1m');
  const nr = G.routes.length;
  if (nr >= 5) unlockAch('routes5'); if (nr >= 15) unlockAch('routes15'); if (nr >= 30) unlockAch('routes30');
  if (G.routes.some(r => CITIES[r.city].region !== 'dom' && CITIES[r.city].region !== 'space')) unlockAch('intl');
  if (G.routes.some(r => CITIES[r.city].region === 'long')) unlockAch('long');
  if (G.routes.some(r => CITIES[r.city].region === 'space')) unlockAch('space');
  if (G.rating >= 3) unlockAch('star3'); if (G.rating >= 4) unlockAch('star4'); if (G.rating >= 4.8) unlockAch('star5');
  if (!G.free) { if (G.money >= 1e7) unlockAch('money10m'); if (G.money >= 1e8) unlockAch('money100m'); if (G.money >= 1e9) unlockAch('money1b'); }
  const nc = Object.keys(G.combos).length;
  if (nc >= 1) unlockAch('combo1'); if (nc >= 10) unlockAch('combo10'); if (nc >= COMBOS.length) unlockAch('comboall');
  if (countKind('runway') >= 3) unlockAch('runway3');
  if (Object.keys(G.seenPlanes).some(k => k.startsWith('whale') || k.startsWith('cargo_l'))) unlockAch('jumbo');
  if (Object.keys(G.seenPlanes).some(k => k.startsWith('sst'))) unlockAch('sst');
  if (G.sectors.every(v => v)) unlockAch('land');
  const nrs = Object.keys(G.research).length;
  if (nrs >= 15) unlockAch('research'); if (nrs >= RESEARCH.length) unlockAch('research_all');
  if (G.rank >= 10) unlockAch('rank10');
  extraAchievements();
}

// ---------- 開発（研究） ----------
function devPoints() { return Math.floor(G.dev || 0); }
function canResearch(r) {
  if (G.research[r.id]) return { ok: false, why: '完了' };
  if (r.rank > G.rank && !G.free) return { ok: false, why: `ランク${r.rank}で解放` };
  if ((G.dev || 0) < r.dev && !G.free) return { ok: false, why: '開発ポイントが足りません' };
  if (G.money < r.cost && !G.free) return { ok: false, why: 'お金が足りません' };
  return { ok: true };
}
function doResearch(id) {
  const r = RESEARCH_BY[id]; const c = canResearch(r);
  if (!c.ok) { toast(c.why, 'bad'); Sound.se('error'); return false; }
  if (!G.free) { G.dev -= r.dev; G.money -= r.cost; }
  G.research[id] = G.day + 1;
  Sound.se('levelup');
  Bus.emit('research', r);
  worldChanged(null);
  return true;
}
function maxLevel() { return G.research.reno2 ? 5 : G.research.reno1 ? 3 : 2; }
function upgradeCost(b) { return Math.round(B[b.id].cost * 0.6 * b.lv); }
function upgradeBuilding(b) {
  const def = B[b.id];
  if (b.lv >= maxLevel()) { toast(maxLevel() < 5 ? '開発「施設改装」でもっと上げられます' : '最大レベルです', 'bad'); return false; }
  const c = upgradeCost(b);
  if (G.money < c && !G.free) { toast('お金が足りません', 'bad'); Sound.se('error'); return false; }
  if (!G.free) G.money -= c;
  b.lv++;
  refreshBuildingMesh(b);
  Sound.se('levelup');
  toast(`${def.name} が Lv${b.lv} になりました！`, 'good');
  Bus.emit('upgrade', b);
  return true;
}

// ---------- 路線 ----------
const ROUTE_COST = { dom: 300000, asia: 1500000, long: 4000000, space: 30000000 };
function maxRunwayCls() { let c = 0; for (const b of Object.values(G.blds)) if (B[b.id].kind === 'runway') c = Math.max(c, B[b.id].cls); return c; }
function maxStandCls() { let c = 0; for (const b of Object.values(G.blds)) if (B[b.id].kind === 'stand' && (b.gate || true)) c = Math.max(c, B[b.id].cls); return c; }
// その路線で使える機材（滑走路・駐機場の大きさ、ランク、距離）
function planesFor(airlineId, cityId) {
  const al = AIRLINES[airlineId], city = CITIES[cityId];
  const minCls = REGION_CLS[city.region];
  const rc = maxRunwayCls(), sc = maxStandCls();
  return al.fleet.filter(t => {
    const P = PLANES[t];
    if (P.rank > G.rank && !G.free) return false;
    if (P.cls < minCls && !(al.cargo && P.cargo)) return false;
    return P.cls <= rc && (P.stand || P.cls) <= sc;
  });
}
function bestPlaneFor(airlineId, cityId) {
  let best = null;
  for (const t of planesFor(airlineId, cityId)) { const P = PLANES[t]; if (!best || P.seats + (P.cargo || 0) * 4 > PLANES[best].seats + (PLANES[best].cargo || 0) * 4) best = t; }
  return best;
}
function airlineAvailable(id) {
  const al = AIRLINES[id];
  if (G.free) return { ok: true };
  if (al.rank > G.rank) return { ok: false, why: `ランク${al.rank}で解放` };
  if (al.needRating && G.rating < al.needRating) return { ok: false, why: `評価★${al.needRating}以上が必要` };
  if (al.space && !G.research.spaceport) return { ok: false, why: '開発「宇宙港計画」が必要' };
  return { ok: true };
}
function routeCheck(airlineId, cityId, wantType) {
  const al = AIRLINES[airlineId], city = CITIES[cityId];
  const a = airlineAvailable(airlineId); if (!a.ok) return a;
  if (city.rank > G.rank && !G.free) return { ok: false, why: `ランク${city.rank}で就航できます` };
  if (G.routes.some(r => r.airline === airlineId && r.city === cityId)) return { ok: false, why: 'もう就航しています' };
  if (!hasKind('tower')) return { ok: false, why: '管制塔が必要です' };
  if (!countKind('runway')) return { ok: false, why: '滑走路が必要です' };
  const t = wantType && planesFor(airlineId, cityId).includes(wantType) ? wantType : bestPlaneFor(airlineId, cityId);
  if (!t) {
    const need = REGION_CLS[city.region];
    const nm = ['', '短い滑走路', 'ふつうの滑走路', '長い滑走路'][Math.max(need, Math.min(...al.fleet.map(f => PLANES[f].cls)))];
    return { ok: false, why: `${nm}と同じ大きさの駐機場が必要です（または機材がランク不足）` };
  }
  const P = PLANES[t];
  if ((P.eng !== 'prop') && !hasKind('fire')) return { ok: false, why: 'ジェット機には消防署が必要です' };
  if (city.region !== 'dom' && city.region !== 'space' && !P.cargo && (!hasKind('emig') || !hasKind('immig'))) return { ok: false, why: '国際線には出国審査場と入国審査・税関が必要です' };
  if (P.cargo && !hasKind('cargo')) return { ok: false, why: '貨物ターミナルが必要です' };
  if (!P.cargo && !Object.values(G.blds).some(b => B[b.id].kind === 'stand' && b.gate && B[b.id].cls >= (P.stand || P.cls))) return { ok: false, why: '搭乗口とつながった駐機場が必要です（7マス以内に搭乗口）' };
  const cost = routeCost(cityId);
  if (G.money < cost && !G.free) return { ok: false, why: 'お金が足りません', cost, type: t };
  return { ok: true, cost, type: t };
}
function routeCost(cityId) { const c = CITIES[cityId]; return Math.round(ROUTE_COST[c.region] * (1 + c.demand * 0.1)); }
function maxFreq(airlineId) { const rel = (G.airlines[airlineId] || {}).rel || 0; return Math.min(6, 2 + Math.floor(rel / 25)); }
function openRoute(airlineId, cityId, freq, type) {
  const c = routeCheck(airlineId, cityId, type);
  if (!c.ok) { toast(c.why, 'bad'); Sound.se('error'); return null; }
  if (!G.free) G.money -= c.cost;
  const r = { id: airlineId + '-' + cityId, airline: airlineId, city: cityId, type: c.type, freq: clamp(freq || 1, 1, maxFreq(airlineId)), active: true, opened: G.day, flights: 0, pax: 0, seats: 0, ontime: 0 };
  G.routes.push(r);
  G.stamps[cityId] = G.day + 1;
  G.points += 30 + CITIES[cityId].demand * 10;
  // 今日の残りにも追加
  const extra = makeScheduleFor(r, G.day * 1440, G.min + 40);
  RT.todayFlights.push(...extra); RT.todayFlights.sort((a, b) => a.arrT - b.arrT);
  Sound.se('stamp');
  Bus.emit('routeOpened', r);
  return r;
}
function makeScheduleFor(r, dayStart, fromMin) {
  const save = G.routes; G.routes = [r];
  const out = makeSchedule(dayStart, fromMin);
  G.routes = save;
  return out;
}
function upgradeRoutePlanes() {
  // 滑走路が大きくなったら機材も大きく
  for (const r of G.routes) { const t = bestPlaneFor(r.airline, r.city); if (t && PLANES[t].seats > PLANES[r.type].seats) r.type = t; }
}

// ---------- 定期処理 ----------
function refreshAux() {
  if (RT.dirtyLinks) relinkGates();
  if (RT.dirtyBeauty) rebuildBeauty();
  if (RT.dirtyCombo) rebuildCombos();
  if (RT.dirtyAura !== false || RT.dirtyBeauty === false) {
    const a = RT.aura || (RT.aura = new Float32Array(W * H)); a.fill(0);
    const atms = [];
    for (const b of Object.values(G.blds)) {
      const d = B[b.id];
      if (b.id === 'atm') atms.push(bCenter(b));
      if (!d.aura) continue;
      const c = bCenter(b);
      for (let y = Math.max(0, Math.floor(c.z - 4)); y <= Math.min(H - 1, Math.floor(c.z + 4)); y++)
        for (let x = Math.max(0, Math.floor(c.x - 4)); x <= Math.min(W - 1, Math.floor(c.x + 4)); x++) {
          const dd = Math.hypot(x + 0.5 - c.x, y + 0.5 - c.z); if (dd <= 4) a[idx(x, y)] += d.aura * (1 - dd / 5) * 0.2;
        }
    }
    for (const b of Object.values(G.blds)) { if (B[b.id].kind !== 'svc') continue; const c = bCenter(b); b.nearATM = atms.some(a2 => Math.hypot(a2.x - c.x, a2.z - c.z) < 6); }
    RT.dirtyAura = false;
  }
  checkWarnings();
}
function simStep(dt) {
  const prevMin = G.min;
  G.min += dt;
  const day = Math.floor(G.min / 1440);
  if (day !== G.day) { closeDay(); startDay(day); }
  const h0 = Math.floor(prevMin / 60), h1 = Math.floor(G.min / 60);
  if (h1 !== h0) hourlyTick(h1 % 24);
  RT.auxT = (RT.auxT || 0) + dt;
  if (RT.auxT > 3 || RT.dirtyLinks || RT.dirtyCombo) { RT.auxT = 0; refreshAux(); }
  updateFlights(dt);
  updatePeople(dt);
  RT.slowT = (RT.slowT || 0) + dt;
  if (RT.slowT > 10) { RT.slowT = 0; checkRank(); checkAchievements(); Story.check(); }
  // 開発ポイント：便の数に応じて
  G.dev = (G.dev || 0) + dt * (RT.planes.length * 0.004 + 0.002);
}
