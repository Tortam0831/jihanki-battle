// ============================================================
//  人（乗客・見学客・乗務員・マスコット）
// ============================================================
const MAXP = 1600;
const People = { inst: null, shadow: null, bubbles: null, frameAttr: null, flipAttr: null, bFrame: null, nextId: 1, fac: new Map() };
const WALK_SPD = 0.65;   // マス / ゲーム分

function initPeopleRender() {
  const tex = canvasTex(SPR.atlas || makePersonAtlas());
  const geo = new THREE.PlaneGeometry(SPR_W / 26, SPR_H / 26); geo.translate(0, SPR_H / 52, 0);
  const ib = (n, s) => new THREE.InstancedBufferAttribute(new Float32Array(n * s), s);
  People.frameAttr = ib(MAXP, 1); People.flipAttr = ib(MAXP, 1);
  geo.setAttribute('aFrame', People.frameAttr); geo.setAttribute('aFlip', People.flipAttr);
  const mat = new THREE.ShaderMaterial({
    uniforms: { map: { value: tex }, cell: { value: new THREE.Vector2(SPR_W / 512, SPR_H / 1024) }, cols: { value: SPR_COLS }, night: { value: 0 }, tint: { value: new THREE.Color(1, 1, 1) } },
    vertexShader: `
      attribute float aFrame; attribute float aFlip; uniform vec2 cell; uniform float cols; varying vec2 vUv;
      void main(){
        vec4 c = modelViewMatrix * instanceMatrix * vec4(0., 0., 0., 1.);
        float s = length(instanceMatrix[0].xyz);
        c.xy += position.xy * s;
        gl_Position = projectionMatrix * c;
        float fx = mod(aFrame, cols), fy = floor(aFrame / cols);
        vec2 u = uv; if (aFlip > 0.5) u.x = 1. - u.x;
        vUv = vec2((fx + u.x) * cell.x, 1. - (fy + 1. - u.y) * cell.y);
      }`,
    fragmentShader: `uniform sampler2D map; uniform vec3 tint; varying vec2 vUv;
      void main(){ vec4 t = texture2D(map, vUv); if (t.a < 0.5) discard; gl_FragColor = vec4(t.rgb * tint, 1.);
      #include <colorspace_fragment>
      }`,
  });
  const inst = new THREE.InstancedMesh(geo, mat, MAXP);
  inst.count = 0; inst.frustumCulled = false; inst.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  People.inst = inst; R.scene.add(inst);
  // 影
  const sg = new THREE.CircleGeometry(0.16, 8); sg.rotateX(-Math.PI / 2);
  const sh = new THREE.InstancedMesh(sg, new THREE.MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.22, depthWrite: false }), MAXP);
  sh.count = 0; sh.frustumCulled = false; sh.renderOrder = 4; People.shadow = sh; R.scene.add(sh);
  // ふきだし
  const bg = new THREE.PlaneGeometry(0.42, 0.42); bg.translate(0, 0.21, 0);
  People.bFrame = ib(300, 1); bg.setAttribute('aFrame', People.bFrame); bg.setAttribute('aFlip', ib(300, 1));
  const bm = new THREE.ShaderMaterial({
    uniforms: { map: { value: R.texBubbles }, cell: { value: new THREE.Vector2(16 / 256, 16 / 256) }, cols: { value: 16 } },
    vertexShader: mat.vertexShader, fragmentShader: `uniform sampler2D map; varying vec2 vUv; void main(){ vec4 t = texture2D(map, vUv); if (t.a < 0.5) discard; gl_FragColor = vec4(t.rgb, 1.);
      #include <colorspace_fragment>
      }`,
  });
  const bi = new THREE.InstancedMesh(bg, bm, 300); bi.count = 0; bi.frustumCulled = false; bi.renderOrder = 6;
  People.bubbles = bi; R.scene.add(bi);
}

// ---------- 施設の状態 ----------
function facOf(b) {
  let f = People.fac.get(b.uid);
  if (!f) { f = { queue: [], serving: [], today: 0 }; People.fac.set(b.uid, f); }
  return f;
}
function facCap(b) {
  const def = B[b.id];
  return Math.max(1, Math.round((def.cap || 1) * (1 + (b.lv - 1) * 0.25)));
}
function facSvc(b, p) {
  const def = B[b.id];
  let t = def.svc || 3;
  if (def.kind === 'checkin' && G.research.autock) t *= 0.7;
  if (def.kind === 'security' && G.research.smartsec) t *= 0.7;
  if ((def.kind === 'security' || def.kind === 'emig') && G.research.facegate) t *= 0.8;
  if (def.kind === 'baggage' && G.research.autobag) t *= 0.6;
  t *= 1 - (b.lv - 1) * 0.06;
  return t * rnd(0.75, 1.25);
}
// 並ぶ位置
function servicePoint(b, k, slot) {
  const acc = accessTiles(b);
  const def = B[b.id];
  const [fx, fy] = frontDir(b.rot);
  const [w, h] = dims(def, b.rot);
  const c = bCenter(b);
  // 正面の中央（建物のふち）
  let ex = c.x + fx * (w / 2), ez = c.z + fy * (h / 2);
  if (!acc.length) return { x: ex, z: ez };
  const a0 = acc[0];
  const ax = a0 % W + 0.5, az = Math.floor(a0 / W) + 0.5;
  // 正面にアクセスがない場合は最寄りの通路
  const frontOK = Math.abs((ax - c.x) * fx + (az - c.z) * fy) > 0.1;
  let bx = frontOK ? ex + fx * 0.25 : ax, bz = frontOK ? ez + fy * 0.25 : az;
  const lat = [-fy, fx];
  if (slot != null) {
    const n = facCap(b), span = Math.min((fx ? h : w) - 0.4, n * 0.45);
    const o = n > 1 ? -span / 2 + span * (slot / (n - 1)) : 0;
    return { x: bx + lat[0] * o, z: bz + lat[1] * o };
  }
  const kk = k + 1;
  return { x: bx + fx * (0.12 + kk * 0.36) + lat[0] * ((kk % 2) * 0.16 - 0.08), z: bz + fy * (0.12 + kk * 0.36) + lat[1] * ((kk % 2) * 0.16 - 0.08) };
}

// ---------- 生成 ----------
function newPerson(type, kind, x, z) {
  const vs = SPR.variants[type] || SPR.variants.worker;
  const def = PAX[type] || PAX.worker;
  const p = {
    id: People.nextId++, type, kind, v: pick(vs), x, z, nx: x, nz: z, tile: idx(clamp(Math.floor(x), 0, W - 1), clamp(Math.floor(z), 0, H - 1)),
    state: 'think', target: 0, steps: [], needs: [], mood: 58, w: 1, spd: WALK_SPD * (def.speed || 1) * rnd(0.9, 1.1),
    anim: Math.random() * 4, face: 0, flip: 0, bub: null, bubT: 0, wait: 0, stuck: 0, walked: 0, hidden: false, t0: G.min,
    money: (def.money || 1), spent: 0, seen: {}, ox: rnd(-0.28, 0.28), oz: rnd(-0.28, 0.28)
  };
  if (G.research.wifi) p.mood += 4;
  p.mood += Extra.moodStart(p);
  if (G.research.multi && (type === 'foreign')) p.mood += 8;
  if (G.flags.event === 'festival') p.mood += 5;
  if (!G.seenPax[type] && PAX[type]) { G.seenPax[type] = 1; }
  RT.persons.push(p);
  return p;
}
function rollNeeds(p) {
  const def = PAX[p.type]; if (!def) return [];
  const out = [];
  for (const [n, pr] of Object.entries(def.needs)) if (Math.random() < pr) out.push(n);
  // 長いフライト前はお腹がすく
  return out.sort(() => Math.random() - 0.5);
}
function accessPoints() {
  if (RT.apCache && RT.apVer === RT.walkVer && !RT.dirtyWalk) return RT.apCache;
  const all = Object.values(G.blds).filter(b => B[b.id].kind === 'access' && accessTiles(b).length);
  const cks = Object.values(G.blds).filter(b => B[b.id].kind === 'checkin');
  let ok = all;
  if (cks.length) {
    const fs = cks.map(getField);
    ok = all.filter(ap => accessTiles(ap).some(i => fs.some(f => f[i] >= 0)));
    if (!ok.length) ok = all;
  }
  RT.apCache = ok; RT.apVer = RT.walkVer;
  return ok;
}
function spawnAt(b) {
  const acc = accessTiles(b);
  const i = pick(acc);
  return { x: i % W + 0.5 + rnd(-0.3, 0.3), z: Math.floor(i / W) + 0.5 + rnd(-0.3, 0.3) };
}
function chooseAccess(type) {
  const aps = accessPoints(); if (!aps.length) return null;
  return weightedPick(aps, b => (B[b.id].access || 10) * Extra.accessMul(b) * (B[b.id].likes && B[b.id].likes.includes(type) ? 2 : 1));
}
function spawnDeparting(fl, n, w) {
  for (let k = 0; k < n; k++) {
    const type = pickPaxType(fl);
    const ap = chooseAccess(type);
    if (!ap) { fl.noShow += w; continue; }
    const pos = spawnAt(ap);
    const p = newPerson(type, 'dep', pos.x, pos.z);
    p.w = w; p.fl = fl; p.from = ap.uid;
    const intl = CITIES[fl.city].region !== 'dom';
    p.steps = ['checkin', 'security'];
    if (intl) p.steps.push('emig');
    p.steps.push('free', 'gate');
    p.needs = rollNeeds(p);
    p.intl = intl;
    if (B[ap.id].likes && B[ap.id].likes.includes(type)) p.mood += 3;
    if ((type === 'family' || type === 'babyc') && Math.random() < 0.6) addFollower(p);
    RT.accessCount = (RT.accessCount || 0) + w;
    if (B[ap.id].park) earn(B[ap.id].park * w * 0.35 * (1 + (ap.lv - 1) * 0.2), 'park', ap);
    fl.spawned += w;
  }
}
function spawnArriving(fl, n, w, gate) {
  for (let k = 0; k < n; k++) {
    const type = pickPaxType(fl);
    let pos;
    if (gate && accessTiles(gate).length) { const a = pick(accessTiles(gate)); pos = { x: a % W + 0.5 + rnd(-0.3, 0.3), z: Math.floor(a / W) + 0.5 + rnd(-0.3, 0.3) }; }
    else { fl.arrLost = (fl.arrLost || 0) + w; continue; }
    const p = newPerson(type, 'arr', pos.x, pos.z);
    p.w = w; p.fl = fl; p.intl = CITIES[fl.city].region !== 'dom';
    p.steps = [];
    if (p.intl) p.steps.push('immig');
    if (Math.random() < 0.8) p.steps.push('baggage');
    p.needs = Math.random() < 0.35 ? ['toilet'] : [];
    if (Math.random() < 0.25) p.needs.push(pick(['shop', 'food']));
    p.steps.push('free', 'exit');
    p.wait = rnd(0, 6); p.state = 'delay';
    if (type === 'family' && Math.random() < 0.5) addFollower(p);
  }
}
function spawnVisitor(type) {
  const ap = chooseAccess(type); if (!ap) return;
  const pos = spawnAt(ap);
  const p = newPerson(type, 'visit', pos.x, pos.z);
  p.w = 1; p.from = ap.uid;
  p.needs = ['fun', 'fun'];
  if (Math.random() < 0.6) p.needs.push('food');
  if (Math.random() < 0.6) p.needs.push('shop');
  p.steps = ['free', 'exit'];
  p.deadline = G.min + rnd(90, 200);
  RT.visitorsToday = (RT.visitorsToday || 0) + 1;
}
function spawnCrew(fl, gate) {
  if (!gate) return;
  const ap = chooseAccess('pilot'); if (!ap) return;
  for (const t of ['pilot', 'ca', 'ca']) {
    const pos = spawnAt(ap);
    const p = newPerson(t, 'crew', pos.x, pos.z);
    p.w = 0; p.fl = fl; p.steps = ['gate']; p.crew = true; p.spd *= 1.15;
  }
}
function spawnMascot() {
  if (RT.persons.some(p => p.kind === 'mascot')) return;
  const terms = [];
  for (let i = 0; i < W * H; i++) if (G.floor[i] === FLOOR.TERM && !G.occ[i]) terms.push(i);
  if (!terms.length) return;
  const i = pick(terms);
  const p = newPerson('mascot', 'mascot', i % W + 0.5, Math.floor(i / W) + 0.5);
  p.v = SPR.mascot; p.spd = WALK_SPD * 0.8; p.state = 'wander'; p.w = 0;
}
function pickPaxType(fl) {
  const city = CITIES[fl.city], al = AIRLINES[fl.airline];
  let mix;
  if (city.region === 'space') mix = MIX.space;
  else if (al.lux) mix = MIX.lux;
  else if (city.region === 'long') mix = MIX.long;
  else if (city.region === 'asia') mix = MIX.asia;
  else if (al.lcc) mix = MIX.lcc;
  else if (city.resort || al.resort) mix = MIX.resort;
  else if (city.island) mix = MIX.island;
  else mix = MIX.dom;
  if (PLANES[fl.type].vip && Math.random() < 0.6) return 'vip';
  { const ex = Extra.extraPax(fl); if (ex) return ex; }
  if (Math.random() < 0.003 * (G.rank + 1)) return 'celeb';
  if (G.flags.schoolTrip && Math.random() < 0.4 && city.region === 'dom') return 'student';
  return weightedPick(Object.keys(mix), k => mix[k]);
}

// ---------- 行動 ----------
function bubble(p, icon, t) { p.bub = icon; p.bubT = t || 1.6; }
function moodAdd(p, v) { p.mood = clamp(p.mood + v, 0, 100); }
function findFacility(p, need) {
  const cur = p.tile;
  let best = null, bs = -1e9;
  for (const b of Object.values(G.blds)) {
    const def = B[b.id];
    if (def.kind !== 'svc') continue;
    if (def.need !== need && def.need2 !== need) continue;
    if (def.intlOnly && !p.intl) continue;
    if (def.rich && p.money < 1.4) continue;
    if (p.seen[b.uid]) continue;
    if (p.kind === 'visit' && def.zone === 'term' && b.id === 'lounge') continue;
    const f = getField(b);
    const d = f[cur];
    if (d < 0) continue;
    const fac = facOf(b);
    let s = 10 - d * 0.18 - fac.queue.length * 0.8 + b.lv * 0.6 + comboBonus(b) * 4;
    if (def.likes && def.likes.includes(p.type)) s += 4;
    if (def.price && p.money < 0.6 && def.price > 1500) s -= 4;
    if (p.kind === 'visit' && (b.id === 'deck' || b.id === 'park')) s += 6;
    if (p.type === 'maniac' && (b.id === 'deck' || b.id === 'goods' || b.id === 'gallery')) s += 6;
    if (p.type === 'kid' && (b.id === 'game' || b.id === 'toy' || b.id === 'deck')) s += 5;
    if (p.type === 'foreign' && ['sushi', 'ramen', 'dutyfree', 'wagashi', 'kaiseki', 'souvenir'].includes(b.id)) s += 4;
    s += Math.random() * 3;
    if (s > bs) { bs = s; best = b; }
  }
  return best;
}
function findKind(p, kind) {
  let best = null, bd = 1e9;
  for (const b of Object.values(G.blds)) {
    if (kind === 'aura_fids') { if (b.id !== 'fids') continue; } else if (B[b.id].kind !== kind) continue;
    const d = getField(b)[p.tile]; if (d < 0) continue;
    const s = d + facOf(b).queue.length * 1.5;
    if (s < bd) { bd = s; best = b; }
  }
  return best;
}
function goTo(p, b) { p.target = b.uid; p.state = 'walk'; p.stuck = 0; }
function nextStep(p) {
  p.state = 'think';
}
function think(p) {
  const fl = p.fl;
  if (p.kind === 'mascot') { p.state = 'wander'; return; }
  if (p.kind === 'dep' && fl && fl.status === 'departed') { missFlight(p); return; }
  const step = p.steps[0];
  if (!step) { leave(p); return; }
  if (step === 'free') {
    // 出発便：時間を見て搭乗口へ
    if (p.kind === 'dep') {
      const margin = G.research.fidsplus ? 65 : 55;
      if (fl.boarding || G.min > fl.depT - margin) { p.steps.shift(); return think(p); }
    }
    if (p.kind === 'visit' && G.min > p.deadline) { p.steps.shift(); return think(p); }
    if (p.kind === 'arr' && (G.min - p.t0) > 70) { p.steps.shift(); return think(p); }
    while (p.needs.length) {
      const need = p.needs[0];
      const b = findFacility(p, need);
      if (b) { p.curNeed = need; goTo(p, b); return; }
      p.needs.shift();
      p.unmet = (p.unmet || 0) + 1;
      bubble(p, need === 'toilet' ? 'sweat' : need === 'food' ? 'food' : need === 'shop' ? 'shopping' : need === 'rest' ? 'zzz' : 'note', 1.4);
      moodAdd(p, need === 'toilet' ? -9 : -4);
      G.stat.today.unmet[need] = (G.stat.today.unmet[need] || 0) + p.w;
    }
    // やることがない：搭乗口の近くで待つ／帰る
    p.steps.shift(); return think(p);
  }
  if (step === 'gate') {
    const gate = fl && fl.gate && G.blds[fl.gate];
    if (!gate) {
      // まだ搭乗口が決まっていない
      if (p.kind === 'crew') { if (G.min - p.t0 > 120) leave(p); else { p.state = 'idle'; p.wait = 10; } return; }
      const fids = !p.lookedFids && findKind(p, 'aura_fids');
      if (fids) { goTo(p, fids); return; }
      p.state = 'idle'; p.wait = rnd(5, 10); return;
    }
    if (p.atGate === gate.uid) { p.state = 'gatewait'; return; }
    goTo(p, gate); return;
  }
  if (step === 'exit') {
    const ap = p.from && G.blds[p.from] ? G.blds[p.from] : chooseAccess(p.type);
    if (!ap) { leave(p); return; }
    p.from = ap.uid;
    if (getField(ap)[p.tile] < 0) { leave(p); return; }
    goTo(p, ap); return;
  }
  // checkin / security / emig / immig / baggage
  const b = findKind(p, step);
  if (!b) {
    p.steps.shift();
    if (step === 'checkin' || step === 'security') { moodAdd(p, -6); }
    if (step === 'emig' || step === 'immig') { moodAdd(p, -10); G.stat.today.noIntl = (G.stat.today.noIntl || 0) + p.w; }
    if (step === 'baggage') moodAdd(p, -8);
    return think(p);
  }
  goTo(p, b);
}
function arrive(p, b) {
  const def = B[b.id];
  const fac = facOf(b);
  if (def.kind === 'gate') {
    p.atGate = b.uid; p.state = 'gatewait';
    // 待つ位置
    const acc = accessTiles(b);
    const field = getField(b);
    const near = [];
    for (let i = 0; i < W * H && near.length < 40; i++) if (field[i] >= 0 && field[i] <= 2) near.push(i);
    const t = near.length ? pick(near) : acc[0];
    p.nx = t % W + 0.5 + rnd(-0.35, 0.35); p.nz = Math.floor(t / W) + 0.5 + rnd(-0.35, 0.35);
    p.wait = 0;
    return;
  }
  if (def.kind === 'access') { leave(p); return; }
  if (def.kind === 'aura' || def.kind === 'decor') { p.state = 'idle'; p.wait = rnd(3, 7); p.lookedFids = true; if (b.id === 'fids') bubble(p, 'board', 1.5); return; }
  // 列にならぶ（出発がせまっている人は優先レーン）
  if (p.kind === 'dep' && p.fl && G.min > p.fl.depT - 40 && (def.kind === 'checkin' || def.kind === 'security' || def.kind === 'emig')) { fac.queue.unshift(p); bubble(p, 'sweat', 1.2); }
  else fac.queue.push(p);
  p.state = 'queue'; p.wait = 0; p.facUid = b.uid;
  const sp = servicePoint(b, fac.queue.length - 1);
  p.nx = sp.x; p.nz = sp.z;
}
function serviceDone(p, b) {
  const def = B[b.id];
  const fac = facOf(b);
  fac.today++;
  b.visits = (b.visits || 0) + p.w;
  p.hidden = false;
  if (def.kind === 'svc') {
    const need = p.curNeed;
    p.needs = p.needs.filter((n, i) => !(n === need && i === p.needs.indexOf(need)));
    p.seen[b.uid] = 1;
    let q = 5 + b.lv * 1.5 + comboBonus(b) * 10;
    if (def.likes && def.likes.includes(p.type)) q += 5;
    if (p.kind === 'visit' && b.id === 'deck' && nearRunway(b)) q += 6;
    moodAdd(p, q);
    const price = def.price || 0;
    if (price > 0) {
      let m = price * p.money * (1 + (b.lv - 1) * 0.15) * (1 + comboBonus(b));
      if (G.research.pointcard) m *= 1.1;
      if (def.cat === 'food' && G.research.gourmet) m *= 1.15;
      if ((b.id === 'dutyfree' || b.id === 'brand') && G.research.dutyplus) m *= 1.25;
      if (b.id === 'lounge' && G.research.firstlounge) m *= 2;
      if (b.nearATM) m *= 1.05;
      m *= Extra.priceMul(b, p);
      if (p.fl && AIRLINES[p.fl.airline] && AIRLINES[p.fl.airline].lcc) m *= 0.75;
      if (b.id === 'izakaya' && (G.min % 1440) > 17 * 60) m *= 1.4;
      if (b.combo && b.combo.includes('morning') && (G.min % 1440) < 10 * 60) m *= 1.3;
      m *= rnd(0.7, 1.3) * p.w;
      earn(m, def.cat === 'food' ? 'food' : def.cat === 'shop' ? 'shop' : 'svc', b);
      p.spent += m;
      if (m > 3000 * p.w) bubble(p, 'money', 1.2); else bubble(p, need === 'food' ? 'heart' : need === 'fun' ? 'note' : need === 'rest' ? 'zzz' : 'heart', 1.2);
    } else bubble(p, 'heart', 1.0);
  } else {
    moodAdd(p, 3);
    p.steps.shift();
    if (def.kind === 'checkin') b.ckToday = (b.ckToday || 0) + p.w;
  }
  p.state = 'think';
}
function nearRunway(b) {
  const c = bCenter(b);
  for (const r of Object.values(G.blds)) { if (B[r.id].kind !== 'runway') continue; const rc = bCenter(r); const [w, h] = dims(B[r.id], r.rot); if (Math.abs(c.x - rc.x) < w / 2 + 8 && Math.abs(c.z - rc.z) < h / 2 + 8) return true; }
  return false;
}
function leave(p, why) {
  if (p.gone) return;
  p.gone = true;
  if (p.kind === 'arr' || p.kind === 'visit') finishPax(p);
}
function missFlight(p) {
  p.mood = 5; p.missed = true;
  if (p.fl) p.fl.missed += p.w;
  G.stat.today.missed += p.w;
  bubble(p, 'anger', 2);
  p.steps = ['exit']; p.state = 'think'; p.kind = 'missed';
}
function boardPerson(p) {
  const fl = p.fl;
  if (!fl) return;
  if (p.crew) { p.gone = true; return; }
  fl.boarded += p.w;
  // 遅れの不満
  const delay = Math.max(0, (fl.actualDep || G.min) - fl.depT);
  if (delay > 60) moodAdd(p, -15); else if (delay > 30) moodAdd(p, -8);
  const gate = G.blds[fl.gate];
  if (gate && B[gate.id].bus) moodAdd(p, -3);
  if (p.type === 'vip' && !Object.values(G.blds).some(b => b.id === 'lounge')) moodAdd(p, -10);
  if (p.walked > 70) moodAdd(p, -(p.walked - 70) * 0.05);
  finishPax(p);
  p.gone = true;
}
function finishPax(p) {
  let m = p.mood;
  m -= (p.unmet || 0) * 1;
  m = clamp(m, 0, 100);
  if (p.w > 0) {
    G.stat.today.satW += p.w; G.stat.today.sat += m * p.w;
    G.points += p.w * (0.4 + m / 100) * (p.kind === 'visit' ? 0.5 : 1);
    if (p.kind !== 'visit') G.stat.today.paxDone += p.w;
  }
}

// ---------- 1人ぶんの更新 ----------
function updatePerson(p, dt) {
  if (p.bubT > 0) { p.bubT -= dt * REAL_SEC_PER_GMIN * 2; if (p.bubT <= 0) p.bub = null; }
  switch (p.state) {
    case 'delay': p.wait -= dt; if (p.wait <= 0) p.state = 'think'; return;
    case 'follow': updateFollower(p, dt); return;
    case 'wave': p.wait -= dt; p.moving = false; if (Math.random() < dt * 0.4) bubble(p, pick(['heart', 'note']), 1); if (p.wait <= 0) p.gone = true; return;
    case 'think': think(p); return;
    case 'walk': walkStep(p, dt); return;
    case 'queue': {
      p.wait += dt;
      const b = G.blds[p.facUid];
      if (!b) { p.state = 'think'; return; }
      const fac = facOf(b);
      const k = fac.queue.indexOf(p);
      if (k < 0) return;
      if (k === 0 && fac.serving.length < facCap(b)) {
        fac.queue.shift();
        let slot = 0; const used = new Set(fac.serving.map(s => s.slot)); while (used.has(slot)) slot++;
        fac.serving.push({ p, t: facSvc(b, p), slot });
        p.state = 'service';
        if (B[b.id].inside) { p.hidden = true; }
        const sp = servicePoint(b, 0, slot); p.nx = sp.x; p.nz = sp.z;
        for (let j = 0; j < fac.queue.length; j++) { const q = fac.queue[j]; const s2 = servicePoint(b, j); q.nx = s2.x; q.nz = s2.z; }
        // 待ち時間の不満
        if (p.wait > 6) { moodAdd(p, -(p.wait - 6) * 0.45); if (p.wait > 15) bubble(p, 'anger', 1.4); }
        p.wait = 0;
        return;
      }
      // 待ちすぎ（お店）はあきらめる
      if (B[b.id].kind === 'svc' && p.wait > 18) {
        fac.queue.splice(k, 1); p.seen[b.uid] = 1; moodAdd(p, -5); bubble(p, 'anger', 1.2); p.state = 'think';
        for (let j = 0; j < fac.queue.length; j++) { const q = fac.queue[j]; const s2 = servicePoint(b, j); q.nx = s2.x; q.nz = s2.z; }
        return;
      }
      if (p.kind === 'dep' && p.fl && p.fl.status === 'departed') { fac.queue.splice(k, 1); missFlight(p); return; }
      moveToward(p, p.nx, p.nz, dt * 0.8);
      return;
    }
    case 'service': moveToward(p, p.nx, p.nz, dt); return;
    case 'gatewait': {
      moveToward(p, p.nx, p.nz, dt * 0.6);
      const fl = p.fl;
      if (!fl) { leave(p); return; }
      if (fl.status === 'departed') { if (p.crew) p.gone = true; else missFlight(p); return; }
      p.wait += dt;
      if (p.crew && p.wait > 5) { p.gone = true; return; }
      if (fl.boarding && fl.gate === p.atGate) {
        // 搭乗口のカウンターへ
        const gate = G.blds[fl.gate];
        if (gate) { const sp = servicePoint(gate, 0); p.nx = sp.x; p.nz = sp.z; }
        p.state = 'boarding';
      } else if (fl.gate && fl.gate !== p.atGate) { p.atGate = 0; p.state = 'think'; }
      else if (p.wait > 25 && Math.random() < 0.02) { p.face = 1 - p.face; }
      return;
    }
    case 'boarding': {
      if (moveToward(p, p.nx, p.nz, dt * 1.2)) boardPerson(p);
      return;
    }
    case 'idle': {
      p.wait -= dt;
      if (p.wait <= 0) p.state = 'think';
      if (p.kind === 'dep' && p.fl && p.fl.status === 'departed') missFlight(p);
      return;
    }
    case 'wander': {
      if (p.wait > 0) { p.wait -= dt; return; }
      if (moveToward(p, p.nx, p.nz, dt)) {
        // 次の行き先
        if (Math.random() < 0.15) { p.wait = rnd(3, 10); return; }
        const x = Math.floor(p.x), y = Math.floor(p.z);
        if (RT.dirtyWalk) rebuildWalkable();
        const opts = [];
        for (const [dx, dy] of DIRS8) { const nx = x + dx, ny = y + dy; if (inMap(nx, ny) && WALKABLE[idx(nx, ny)] && G.floor[idx(nx, ny)] === FLOOR.TERM) opts.push([nx, ny]); }
        if (opts.length) { const [nx, ny] = pick(opts); p.nx = nx + 0.5 + rnd(-0.3, 0.3); p.nz = ny + 0.5 + rnd(-0.3, 0.3); }
        else p.wait = 5;
      }
      // まわりの人が喜ぶ
      if (Math.random() < 0.02) for (const q of RT.persons) if (q !== p && q.w > 0 && Math.abs(q.x - p.x) < 1.5 && Math.abs(q.z - p.z) < 1.5 && !q.metMascot) { q.metMascot = 1; moodAdd(q, 6); bubble(q, 'heart', 1.5); }
      return;
    }
  }
}
function moveToward(p, tx, tz, dt) {
  const dx = tx - p.x, dz = tz - p.z, d = Math.hypot(dx, dz);
  const st = p.spd * dt;
  if (d <= st || d < 0.01) { p.x = tx; p.z = tz; p.moving = false; return true; }
  p.x += dx / d * st; p.z += dz / d * st; p.moving = true; p.mvx = dx; p.mvz = dz;
  return false;
}
function walkStep(p, dt) {
  const b = G.blds[p.target];
  if (!b) { p.state = 'think'; return; }
  if (p.kind === 'dep' && p.fl && p.fl.status === 'departed' && p.steps[0] !== 'exit') { missFlight(p); return; }
  const field = getField(b);
  let rem = dt;
  let guard = 0;
  while (rem > 0 && guard++ < 6) {
    if (!p.hasStep) {
      const ti = p.tile, d = field[ti];
      if (d === 0) { p.hasStep = false; arrive(p, b); return; }
      if (d < 0) {
        // 迷子
        p.stuck += dt;
        if (RT.dirtyWalk) rebuildWalkable();
        if (!WALKABLE[ti]) {
          // 近くの通れるマスへ
          const x = ti % W, y = (ti / W) | 0;
          for (let r = 1; r < 6; r++) {
            let found = -1;
            for (let yy = y - r; yy <= y + r && found < 0; yy++) for (let xx = x - r; xx <= x + r; xx++) if (inMap(xx, yy) && WALKABLE[idx(xx, yy)] && field[idx(xx, yy)] >= 0) { found = idx(xx, yy); break; }
            if (found >= 0) { p.tile = found; p.x = found % W + 0.5; p.z = Math.floor(found / W) + 0.5; break; }
          }
        }
        if (p.stuck > 8) { p.seen[b.uid] = 1; p.state = 'think'; if (p.steps[0] === B[b.id].kind) p.steps.shift(); moodAdd(p, -4); bubble(p, 'sweat'); }
        if (p.stuck > 30) leave(p, 'stuck_' + B[b.id].kind);
        return;
      }
      // つぎのマス
      const x = ti % W, y = (ti / W) | 0;
      const cand = [];
      for (let k = 0; k < 8; k++) {
        const [dx, dy] = DIRS8[k], nx = x + dx, ny = y + dy;
        if (!inMap(nx, ny)) continue;
        const ni = idx(nx, ny);
        if (field[ni] === d - 1) { if (k >= 4 && (field[idx(nx, y)] < 0 || field[idx(x, ny)] < 0)) continue; cand.push(ni); }
      }
      if (!cand.length) { p.stuck += dt; p.tile = p.tile; return; }
      // 混雑していない方
      let ni = cand[0];
      if (cand.length > 1) { cand.sort((a, c) => RT.crowd[a] - RT.crowd[c] + (Math.random() - 0.5) * 2); ni = cand[0]; }
      p.next = ni; p.hasStep = true;
      const lane = field[ni] === 0 ? 0.15 : 0.28;
      p.nx = ni % W + 0.5 + p.ox * lane / 0.28; p.nz = Math.floor(ni / W) + 0.5 + p.oz * lane / 0.28;
    }
    const before = Math.hypot(p.nx - p.x, p.nz - p.z);
    let crowdSlow = RT.crowd[p.tile] > 7 ? 0.8 : 1;
    if (p.kind === 'dep' && p.fl && G.min > p.fl.depT - 35) { crowdSlow *= 1.6; if (!p.bub && Math.random() < 0.02) bubble(p, 'sweat', 1); }
    if (moveToward(p, p.nx, p.nz, rem * crowdSlow)) {
      rem -= before / (p.spd * crowdSlow);
      p.tile = p.next; p.hasStep = false; p.walked++;
      // 道すがら
      const be = RT.beauty[p.tile];
      if (be > 0) moodAdd(p, Math.min(0.6, be * 0.06));
      if (RT.crowd[p.tile] > 7) moodAdd(p, -0.15);
      if (RT.aura && RT.aura[p.tile]) moodAdd(p, RT.aura[p.tile] * (p.type === 'foreign' ? 0.06 : 0.03));
    } else rem = 0;
  }
}

// ---------- 全体の更新 ----------
function updatePeople(dt) {
  RT.crowd.fill(0);
  const arr = RT.persons;
  for (const p of arr) if (!p.hidden) RT.crowd[p.tile]++;
  // 施設のサービス進行
  for (const [uid, fac] of People.fac) {
    const b = G.blds[uid];
    if (!b) { for (const q of fac.queue) q.state = 'think'; for (const s of fac.serving) { s.p.state = 'think'; s.p.hidden = false; } People.fac.delete(uid); continue; }
    for (let i = fac.serving.length - 1; i >= 0; i--) {
      const s = fac.serving[i];
      s.t -= dt;
      if (s.p.gone) { fac.serving.splice(i, 1); continue; }
      if (s.t <= 0) { fac.serving.splice(i, 1); serviceDone(s.p, b); }
    }
    if (fac.queue.length) fac.queue = fac.queue.filter(q => !q.gone && q.state === 'queue');
  }
  for (const p of arr) updatePerson(p, dt);
  separatePeople(dt);
  // 消えた人を削除
  let j = 0;
  for (let i = 0; i < arr.length; i++) if (!arr[i].gone) arr[j++] = arr[i];
  arr.length = j;
}

// ---------- 描画 ----------
const _mm = new THREE.Matrix4(), _pos3 = new THREE.Vector3(), _q = new THREE.Quaternion(), _sc = new THREE.Vector3();
function renderPeople(dtReal) {
  const inst = People.inst, sh = People.shadow, bi = People.bubbles;
  const sy = Math.sin(Cam.yaw), cy = Math.cos(Cam.yaw);
  const rx = cy, rz = -sy, fx = -sy, fz = -cy;
  let n = 0, nb = 0;
  const fa = People.frameAttr.array, fl = People.flipAttr.array, bf = People.bFrame.array;
  for (const p of RT.persons) {
    if (p.hidden || n >= MAXP) continue;
    const base = floorH(Math.floor(p.x), Math.floor(p.z));
    if (p.moving) {
      p.anim += dtReal * 7 * (Game.speed > 0 ? Math.min(Game.speed, 3) : 0);
      const sr = p.mvx * rx + p.mvz * rz, sf = p.mvx * fx + p.mvz * fz;
      p.flip = sr < 0 ? 1 : 0;
      p.face = sf > 0 ? 1 : 0;
    }
    const frame = p.moving ? Math.floor(p.anim) % 4 : 0;
    const scale = p.type === 'kid' ? 0.95 : p.kind === 'mascot' ? 1.15 : 1;
    _pos3.set(p.x, base, p.z); _sc.set(scale, scale, scale);
    _mm.compose(_pos3, _q, _sc);
    inst.setMatrixAt(n, _mm);
    fa[n] = p.v * 8 + (p.face ? 4 : 0) + frame;
    fl[n] = p.flip;
    _pos3.y = base + 0.012; _sc.set(1, 1, 1); _mm.compose(_pos3, _q, _sc); sh.setMatrixAt(n, _mm);
    if (p.bub && nb < 300) {
      _pos3.y = base + 0.72; _mm.compose(_pos3, _q, _sc); bi.setMatrixAt(nb, _mm);
      bf[nb] = ICON_INDEX[p.bub] || 0; nb++;
    }
    n++;
  }
  // 警告アイコン
  for (const [uid, msgs] of RT.warnings) {
    const b = G.blds[uid]; if (!b || nb >= 300) continue;
    if (Math.floor(RT.time * 2) % 2) continue;
    const c = bCenter(b);
    _pos3.set(c.x, 1.9, c.z); _sc.set(1.3, 1.3, 1.3); _mm.compose(_pos3, _q, _sc); bi.setMatrixAt(nb, _mm);
    bf[nb] = ICON_INDEX.anger; nb++;
  }
  inst.count = n; sh.count = n; bi.count = nb;
  inst.instanceMatrix.needsUpdate = true; sh.instanceMatrix.needsUpdate = true; bi.instanceMatrix.needsUpdate = true;
  People.frameAttr.needsUpdate = true; People.flipAttr.needsUpdate = true; People.bFrame.needsUpdate = true;
  // 夜は少し暗く
  const t = inst.material.uniforms.tint.value; const k = lerp(1, 0.78, RT.nightF); t.setRGB(k, k * 0.98, k * 0.95);
}

// 人どうしが重ならないように、近すぎる人をそっと押しはなす
const SEP_STATES = { walk: 1, gatewait: 1, idle: 1, follow: 0.5, wave: 1, wander: 1, think: 1, boarding: 0.3 };
const _bucket = new Map();
function separatePeople(dt) {
  _bucket.clear();
  for (const p of RT.persons) {
    if (p.hidden || p.gone || !SEP_STATES[p.state]) continue;
    const k = (Math.floor(p.x * 2) << 10) | Math.floor(p.z * 2);
    let l = _bucket.get(k); if (!l) _bucket.set(k, l = []); l.push(p);
  }
  const R0 = 0.3, k = Math.min(1, dt * 3);
  for (const [key, l] of _bucket) {
    const bx = key >> 10, bz = key & 1023;
    for (let ox = 0; ox <= 1; ox++) for (let oz = -1; oz <= 1; oz++) {
      if (ox === 0 && oz < 0) continue;
      const o = ox === 0 && oz === 0 ? l : _bucket.get(((bx + ox) << 10) | (bz + oz)); if (!o) continue;
      for (let i = 0; i < l.length; i++) for (let j = (o === l ? i + 1 : 0); j < o.length; j++) {
        const a = l[i], b = o[j];
        let dx = b.x - a.x, dz = b.z - a.z, d = Math.hypot(dx, dz);
        if (d >= R0) continue;
        if (d < 0.001) { dx = Math.random() - 0.5; dz = Math.random() - 0.5; d = Math.hypot(dx, dz); }
        const push = (R0 - d) * 0.5 * k, ux = dx / d, uz = dz / d;
        const wa = SEP_STATES[a.state], wb = SEP_STATES[b.state];
        tryNudge(a, -ux * push * wa, -uz * push * wa); tryNudge(b, ux * push * wb, uz * push * wb);
      }
    }
  }
}
function tryNudge(p, dx, dz) {
  const nx = p.x + dx, nz = p.z + dz, tx = Math.floor(nx), tz = Math.floor(nz);
  if (!inMap(tx, tz)) return;
  const i = idx(tx, tz);
  if (!WALKABLE[i] && i !== p.tile) return;
  p.x = nx; p.z = nz;
  if (p.state === 'gatewait' || p.state === 'idle') { p.nx += dx; p.nz += dz; }
}
