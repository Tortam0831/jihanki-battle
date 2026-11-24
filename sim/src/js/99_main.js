// ============================================================
//  起動・タイトル・メインループ
// ============================================================
const Game = { speed: 1, userSpeed: 1, slot: 0, demo: true, opts: { nightSkip: true }, modalPause: false, dialogPause: false, started: false, last: 0, bgmT: 0, hintT: 0 };

// ---------- 花火・航空ショー ----------
const FX = { pts: null, n: 0, max: 3000, life: null, vel: null, show: [] };
function initFX() {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(FX.max * 3), col = new Float32Array(FX.max * 3);
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  FX.pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: 3, sizeAttenuation: false, vertexColors: true, transparent: true, depthWrite: false, fog: false }));
  FX.pts.frustumCulled = false; FX.pts.renderOrder = 10;
  R.scene.add(FX.pts);
  FX.life = new Float32Array(FX.max); FX.vel = new Float32Array(FX.max * 3); FX.gr = new Float32Array(FX.max);
  Bus.on('fireworks', () => { FX.fwT = 22; });
  Bus.on('airshow', () => startAirshow());
}
function burst(x, y, z, color, n, spd, life, grav) {
  const pos = FX.pts.geometry.attributes.position.array, col = FX.pts.geometry.attributes.color.array;
  const c = new THREE.Color(color);
  for (let k = 0; k < n; k++) {
    let i = -1;
    for (let j = 0; j < FX.max; j++) { const q = (FX.cur = ((FX.cur || 0) + 1) % FX.max); if (FX.life[q] <= 0) { i = q; break; } }
    if (i < 0) return;
    const th = Math.random() * TAU, ph = Math.acos(Math.random() * 2 - 1), s = spd * (0.6 + Math.random() * 0.4);
    pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z;
    FX.vel[i * 3] = Math.sin(ph) * Math.cos(th) * s; FX.vel[i * 3 + 1] = Math.cos(ph) * s; FX.vel[i * 3 + 2] = Math.sin(ph) * Math.sin(th) * s;
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    FX.life[i] = life * (0.7 + Math.random() * 0.5);
    FX.gr[i] = grav == null ? 3 : grav;
  }
  FX.pts.geometry.attributes.color.needsUpdate = true;
}
function updateFX(dt) {
  if (!FX.pts) return;
  if (FX.fwT > 0) {
    FX.fwT -= dt;
    if (Math.random() < dt * 2.2) {
      const x = Cam.tx + rnd(-14, 14), z = Cam.tz + rnd(-14, 4), y = rnd(9, 14);
      const cs = ['#ff6080', '#ffd84a', '#60d0ff', '#a0ff80', '#ff9040', '#e080ff', '#ffffff'];
      burst(x, y, z, pick(cs), 90, 4.5, 2.2, 3); burst(x, y, z, pick(cs), 30, 2.2, 2.6, 3);
      Sound.se('firework');
    }
  }
  const pos = FX.pts.geometry.attributes.position.array, col = FX.pts.geometry.attributes.color.array;
  let any = false;
  for (let i = 0; i < FX.max; i++) {
    if (FX.life[i] <= 0) continue;
    any = true;
    FX.life[i] -= dt;
    FX.vel[i * 3 + 1] -= FX.gr[i] * dt;
    FX.vel[i * 3] *= 0.985; FX.vel[i * 3 + 2] *= 0.985;
    pos[i * 3] += FX.vel[i * 3] * dt; pos[i * 3 + 1] += FX.vel[i * 3 + 1] * dt; pos[i * 3 + 2] += FX.vel[i * 3 + 2] * dt;
    if (FX.life[i] <= 0) pos[i * 3 + 1] = -100;
  }
  FX.pts.geometry.attributes.position.needsUpdate = true;
  FX.pts.visible = any;
  // 航空ショー
  for (const s of FX.show) {
    s.t += dt;
    const k = s.t / s.dur;
    s.planes.forEach((m, i) => {
      const off = (i - 1) * 1.6, lag = Math.abs(i - 1) * 1.2;
      const x = lerp(s.x0, s.x1, k) - lag * s.dx, z = lerp(s.z0, s.z1, k) + off * s.dz - lag * s.dzz;
      const y = 7 + Math.sin(k * TAU) * 1.5;
      m.position.set(x, y, z); m.rotation.y = s.hdg; m.rotation.z = Math.sin(k * TAU * 2) * 0.3 * (i - 1);
      if (Math.random() < 0.6) burst(x - Math.sin(s.hdg) * 1.2, y, z - Math.cos(s.hdg) * 1.2, ['#ff6080', '#ffffff', '#60a0ff'][i], 2, 0.2, 2.5, -0.1);
    });
    if (s.t >= s.dur) { s.planes.forEach(m => R.scene.remove(m)); s.done = true; }
  }
  FX.show = FX.show.filter(s => !s.done);
}
function startAirshow() {
  const x0 = Cam.tx - 50, x1 = Cam.tx + 50, z = Cam.tz;
  const planes = ['swallow', 'swallow', 'swallow'].map(t => { const m = planeModel(t, 'haruka'); R.scene.add(m); return m; });
  FX.show.push({ planes, t: 0, dur: 14, x0, x1, z0: z, z1: z, hdg: Math.PI / 2, dx: 1, dz: 1, dzz: 0 });
  Sound.se('jet');
  toast('航空ショーのはじまり！', 'gold', 'plane2');
}

// ---------- タイトル用のデモ空港 ----------
function buildDemo() {
  const P = (id, x, y, rot) => placeBuilding(id, x + OX, y + OY, rot || 0, { free: true, silent: true, ignoreRank: true });
  const paint = (id, x0, y0, x1, y1) => { G.free = true; paintApply(id, x0 + OX, y0 + OY, x1 + OX, y1 + OY); };
  paint('walk', 34, 14, 35, 15);
  paint('tfloor', 27, 16, 42, 23);
  paint('taxiway', 26, 29, 43, 29); paint('taxiway', 26, 30, 26, 30); paint('taxiway', 43, 30, 43, 30);
  P('runway_m', 26, 31, 0);
  for (const x of [28, 33, 38]) P('stand_m', x, 25, 2);
  for (const x of [29, 34, 39]) P('gate', x, 23, 2);
  P('tower', 45, 26); P('fire', 45, 22); P('fuel', 45, 30);
  P('checkin', 28, 17, 0); P('checkin', 31, 17, 0);
  P('security', 36, 17, 0); P('security', 34, 17, 0);
  P('baggage', 39, 17, 0);
  P('cafe', 27, 20, 1); P('book', 27, 22 - 0, 1);
  P('ramen', 31, 20, 0); P('souvenir', 33, 20, 0); P('wagashi', 35, 20, 0);
  P('toilet', 41, 20, 3); P('bench', 37, 21, 0); P('plant', 39, 21); P('fids', 40, 21);
  P('deck', 24, 26, 2); paint('walk', 24, 24, 26, 25); paint('walk', 27, 24, 27, 24);
  for (const [x, y] of [[30, 15], [39, 14], [26, 15], [44, 15], [31, 15], [39, 15], [44, 13], [27, 26], [24, 23]]) P(['sakura', 'tree', 'pine'][(x + y) % 3], x, y);
  P('flowerbed', 32, 14); P('flowerbed', 36, 14); P('fountain', 41, 13 + 1); P('lamp', 33, 15); P('lamp', 37, 15);
  P('parking', 25, 12, 0);
  paint('walk', 29, 14, 33, 14);
  G.routes = [];
  for (const [al, c] of [['soyokaze', 'shimo'], ['haruka', 'tokyo'], ['mermaid', 'naha'], ['haruka', 'osaka']]) {
    const t = bestPlaneFor(al, c);
    if (t) G.routes.push({ id: al + '-' + c, airline: al, city: c, type: t, freq: 3, active: true, opened: 0, flights: 0, pax: 0, seats: 0, ontime: 0, saluted: true });
  }
  G.min = 8 * 60 + 30; G.day = 0; G.rating = 4;
  Cam.tx = 35 + OX; Cam.tz = 24 + OY; Cam.zoom = 1.25;
}

// ---------- 起動 ----------
async function boot() {
  const bar = $('#loadBar'), txt = $('#loadTxt');
  const T0 = performance.now(); window.__bootTimes = [];
  const step = async (p, t) => { window.__bootTimes.push([t, Math.round(performance.now() - T0)]); bar.style.width = p + '%'; txt.textContent = t; await new Promise(r => setTimeout(r, 16)); };
  try {
    await step(5, 'ドット絵をかいています…');
    makePersonAtlas();
    await step(25, '3Dの準備…');
    loadOpts();
    initRender($('#game'));
    await step(45, '島をつくっています…');
    initPeopleRender();
    initFX();
    newGameState({ free: true, seed: 4242 });
    buildDemo();
    initWorldMeshes();
    RT.todayFlights = makeSchedule(0, G.min - 60);
    await step(70, '画面の準備…');
    initUI();
    initStoryEvents();
    $('#dialog').addEventListener('click', () => Dialog.click());
    await step(90, 'もうすぐ…');
    // 先に少し進めておく
    for (let i = 0; i < 300; i++) simStep(0.5);
    await step(100, '完成！');
    $('#loading').classList.add('hidden');
    showTitle();
    warmThumbs();
    Game.last = performance.now();
    requestAnimationFrame(loop);
  } catch (e) {
    console.error(e);
    txt.textContent = 'エラー：' + e.message + '（WebGLが使えないブラウザかもしれません）';
  }
}
function showTitle() {
  Game.demo = true;
  $('#hud').classList.add('hidden');
  $('#title').classList.remove('hidden');
  $('#titleVer').textContent = 'ver ' + VERSION;
  const infos = [0, 1, 2].map(slotInfo);
  const anyInfo = infos.findIndex(x => x);
  let h = '';
  if (anyInfo >= 0) h += `<button class="pbtn green" id="tContinue">${iconImg('plane', 's')}つづきから</button>`;
  h += `<button class="pbtn blue" id="tNew">${iconImg('star', 's')}はじめから</button>`;
  h += `<button class="pbtn" id="tFree">${iconImg('hangar', 's')}フリーモード（お金むげん）</button>`;
  if (Cloud.available()) h += `<button class="pbtn" id="tCloud">${iconImg('globe', 's')}クラウドから読みこむ</button>`;
  h += `<button class="pbtn" id="tHow">${iconImg('info', 's')}あそびかた</button>`;
  $('#titleBtns').innerHTML = h;
  const first = () => { Sound.init(); Sound.bgm('title'); };
  $('#title').addEventListener('pointerdown', first, { once: true });
  const c = $('#tContinue'); if (c) c.onclick = () => { first(); chooseSlot('load'); };
  $('#tNew').onclick = () => { first(); chooseSlot('new'); };
  $('#tFree').onclick = () => { first(); chooseSlot('free'); };
  $('#tHow').onclick = () => { first(); howTo(); };
  const cl = $('#tCloud'); if (cl) cl.onclick = () => {
    openModal('クラウドから読みこむ', `<p>5けたのセーブコードを入力してください。</p><input type="text" id="clK" maxlength="5" inputmode="numeric" pattern="[0-9]*" style="font-size:28px;letter-spacing:8px;text-align:center;font-family:monospace"><div class="sub" style="margin:6px 0">読みこむスロット</div><div class="seg" id="clS"><button data-s="0" class="on">1</button><button data-s="1">2</button><button data-s="2">3</button></div><button class="pbtn blue" id="clGo" style="margin-top:8px">読みこむ</button>`, { narrow: true });
    let sl = 0; $('#clS').onclick = e => { const b = e.target.closest('button'); if (!b) return; sl = +b.dataset.s; $$('#clS button').forEach(x => x.classList.toggle('on', x === b)); };
    $('#clGo').onclick = () => Cloud.load($('#clK').value.trim(), sl, () => { closeModal(); startGame(sl, null); });
  };
}
function chooseSlot(mode) {
  const infos = [0, 1, 2].map(slotInfo);
  let h = '<div class="list">';
  infos.forEach((inf, i) => {
    h += `<div class="li ${mode === 'load' && !inf ? 'lock' : ''}" data-slot="${i}" style="cursor:pointer">${iconImg('save')}<div class="grow"><b>スロット${i + 1}</b><div class="sub">${inf ? `${esc(inf.name)}・ランク${inf.rank}・${inf.date}${inf.free ? '・フリー' : ''}` : 'からっぽ'}</div></div>${inf && mode !== 'load' ? '<span class="sub" style="color:var(--bad)">上書き</span>' : ''}</div>`;
  });
  h += '</div>';
  openModal(mode === 'load' ? 'つづきから' : 'セーブするスロット', h, { narrow: true });
  $('#mBody').onclick = e => {
    const li = e.target.closest('[data-slot]'); if (!li || li.classList.contains('lock')) return;
    const slot = +li.dataset.slot;
    Sound.se('click');
    if (mode === 'load') { closeModal(); startGame(slot, null); }
    else if (infos[slot] && !confirm('このスロットのデータは消えてしまいます。いいですか？')) return;
    else nameEntry(slot, mode === 'free');
  };
}
function nameEntry(slot, free) {
  openModal('空港の名前', `<p>あなたの空港に名前をつけよう！</p><div class="sub">空港の名前</div><input type="text" id="nAp" maxlength="16" value="そらのみなと空港"><div class="sub" style="margin-top:8px">空港長（あなた）の名前</div><input type="text" id="nBoss" maxlength="10" value="空港長"><div style="margin-top:12px;text-align:center"><button class="pbtn green" id="nGo">${iconImg('plane', 's')}空港づくりをはじめる！</button></div>`, { narrow: true });
  $('#nGo').onclick = () => {
    const name = ($('#nAp').value.trim() || 'そらのみなと空港').slice(0, 16), boss = ($('#nBoss').value.trim() || '空港長').slice(0, 10);
    closeModal();
    startGame(slot, { name, boss, free });
  };
}
function howTo() {
  openModal('あそびかた', `<div style="line-height:1.9">
  <div class="sec">${iconImg('plane', 's')}ゲームの目的</div>小さな島の草原に空港をつくり、世界中（そして宇宙！）とつながる「そらのみなと」に育てよう。
  <div class="sec">${iconImg('runway', 's')}飛行機が来るまで</div>①【建設】→「短い滑走路」 ②「管制塔」 ③「小型駐機場」を置いて「誘導路」で滑走路とつなぐ ④「ターミナル床」をぬって、チェックイン・保安検査・搭乗口（駐機場から7マス以内）を置く ⑤バス停からターミナルまで「歩道」をつなぐ ⑥【路線】で就航！
  <div class="sec">${iconImg('people', 's')}お客さん</div>ひとりひとりが歩いて、ならんで、買い物をします。トイレ・ごはん・おみやげ・休けい・楽しみ…いろんな「したいこと」を満たすと満足度アップ。満足度が評価★になります。
  <div class="sec">${iconImg('note', 's')}組み合わせ</div>特定のお店を近くに置くと「組み合わせ」が見つかって売上がアップ。全部で${COMBOS.length}種類！
  <div class="sec">${iconImg('gear', 's')}操作</div><b>PC</b>：ドラッグで移動、ホイールでズーム、Q/Eで回転、Rで建物を回転、右クリック/Escでキャンセル、スペースで一時停止、1〜3で速さ。<br><b>iPad</b>：1本指で移動、2本指でズーム、建物は「1回タップで場所決め→もう1回タップで建てる」。
  </div>`, { icon: 'info' });
}
// 建設メニューのサムネイルを、タイトル画面のあいだに少しずつ作っておく
function warmThumbs() {
  const ids = BUILD_ORDER.filter(id => !B[id].paint && B[id].kind !== 'runway');
  let i = 0;
  const next = () => { if (i >= ids.length) return; const id = ids[i++]; if (!Thumb.cache[id]) { try { thumbURL(id); } catch (e) { } } setTimeout(next, 40); };
  setTimeout(next, 500);
}
function backToTitle() {
  clearRuntime();
  if (Dialog.active) { Dialog.q = []; Dialog.active = false; $('#dialog').classList.add('hidden'); Game.dialogPause = false; }
  newGameState({ free: true, seed: 4242 });
  buildDemo();
  initWorldMeshes();
  RT.todayFlights = makeSchedule(0, G.min - 60);
  for (let i = 0; i < 200; i++) simStep(0.5);
  Game.started = false;
  showTitle();
  Sound.bgm('title');
}
function clearRuntime() {
  for (const pl of RT.planes) removePlane(pl);
  RT.planes = []; RT.persons = []; RT.todayFlights = [];
  People.fac.clear();
  clearAmbient(); clearExtras(); if (typeof clearGuide === 'function') clearGuide();
  RT.fieldCache.clear(); RT.planePathCache.clear(); gcReset();
  RT.warnings = new Map(); RT.lastDay = null; RT.dirtyWalk = RT.dirtyAir = RT.dirtyBeauty = RT.dirtyCombo = RT.dirtyLinks = true;
  hideInfo(); setTool(null);
  resetWorldMeshes();
}
function startGame(slot, opt) {
  Game.slot = slot;
  clearRuntime();
  if (opt) {
    newGameState(opt);
    Cam.tx = 36 + OX; Cam.tz = 20 + OY; Cam.zoom = 1.5; Cam.rot = 0; Cam.yaw = Cam.yawT = Math.PI / 4;
  } else if (!loadSlot(slot)) { toast('データがありません', 'bad'); showTitle(); return; }
  initWorldMeshes();
  setSeasonVisual(dateOf(G.day).season);
  RT.todayFlights = makeSchedule(G.day * 1440, G.min);
  relinkGates(); rebuildBeauty(); rebuildCombos(); checkWarnings();
  Game.demo = false; Game.started = true;
  $('#title').classList.add('hidden');
  $('#hud').classList.remove('hidden');
  setSpeed(1);
  updateHUD(true);
  Story.start();
  if (opt) saveGame();
  Sound.bgm('day');
}

// ---------- 夜をとばす ----------
function canSkipNight() {
  const [ws, we] = opsWindow(), m = G.min % 1440;
  return !RT.planes.length && (m < ws - 60 || m > we + 20);
}
function skipNight(manual) {
  if (!canSkipNight()) { if (manual) toast('飛行機が飛んでいるので、いまはとばせません', 'bad'); return; }
  const [ws] = opsWindow();
  const startDay = G.day;
  let n = 0;
  // 朝（始発の1時間前）まで一気に進める
  while (n++ < 3000) {
    simStep(1);
    const m = G.min % 1440;
    if (RT.planes.length) break;
    if (G.day !== startDay || m < ws) { if (m >= ws - 60 && m < ws + 600) break; }
  }
  RT.persons = RT.persons.filter(p => p.kind !== 'visit' || p.state !== 'idle');
  Sound.se('chime2');
  toast(`夜をとばしました（${fmtTime(G.min)}）`, '', 'moon');
}
// ---------- メインループ ----------
function loop(now) {
  requestAnimationFrame(loop);
  let dtReal = Math.min(0.1, (now - Game.last) / 1000);
  Game.last = now;
  RT.time += dtReal;
  // シミュレーション
  let spd = Game.demo ? 1.5 : Game.speed;
  if (Game.modalPause || Game.dialogPause) spd = 0;
  const hr = (G.min % 1440) / 60;
  const [ws, we] = opsWindow();
  const quiet = !RT.planes.length && RT.persons.filter(p => p.w > 0).length < 4;
  const nightNow = hr * 60 < ws - 60 || hr * 60 > we + 20;
  if (!Game.demo && spd > 0 && Game.opts.nightSkip && quiet && nightNow) { skipNight(); spd = 0; }
  RT.effSpeed = spd;
  if (spd > 0) {
    let dt = dtReal / REAL_SEC_PER_GMIN * spd;
    // 速いときは細かく分けて計算（重くなりすぎないよう1フレーム最大8回）
    let n = 0;
    while (dt > 0 && n++ < 8) { const s = Math.min(dt, 0.5); simStep(s); dt -= s; }
  }
  // 描画の準備
  keyPan(dtReal);
  if (!Game.demo) { applyInertia(dtReal); updateFollow(); updateTouchConfirm(); updateGuide(); }
  if (Game.demo) { Cam.yawT += dtReal * 0.03; }
  updateCamera();
  const d = dateOf(G.day);
  updateLighting(G.min % 1440, G.weather, d.season, dtReal);
  World.glassMat && (World.glassMat.uniforms.night.value = clamp(RT.nightF * 1.3, 0, 1));
  World.lightMat && (World.lightMat.opacity = clamp(RT.nightF * 1.2, 0, 1) * 0.28);
  updateWorldMeshes();
  updateAmbient(spd > 0 ? dtReal / REAL_SEC_PER_GMIN * Math.min(spd, 4) : 0, dtReal);
  renderPeople(dtReal);
  updateFX(dtReal);
  if (!Game.demo || true) updateExtras(spd > 0 ? dtReal / REAL_SEC_PER_GMIN * Math.min(spd, 4) : 0, dtReal);
  DayReport.tick(); updateOneway();
  // 5分ごとに自動保存（GAS ならクラウドにも）
  if (!Game.demo && Game.started) {
    Game.autoT = (Game.autoT || 0) + dtReal;
    if (Game.autoT >= 300) { Game.autoT = 0; saveGame(); Cloud.save(true); }
  }
  if (Cam.shake > 0) Cam.shake = Math.max(0, Cam.shake - dtReal);
  renderFrame();
  // UI
  if (!Game.demo) {
    updateHUD();
    UI.infoT -= dtReal; if (UI.infoT <= 0 && UI.sel) { UI.infoT = 0.5; renderInfo(); }
    if (UI.landLbl) updateLandLabels();
    Game.hintT -= dtReal; if (Game.hintT <= 0) { Game.hintT = 3; checkHints(); }
    const ns = $('#bNight'); if (ns) ns.classList.toggle('hidden', !canSkipNight());
    if (UI.modalOpen === 'board') { Game.boardT = (Game.boardT || 0) - dtReal; if (Game.boardT <= 0) { Game.boardT = 2; const st = $('#mBody').scrollTop; openBoard(); $('#mBody').scrollTop = st; } }
  }
  // BGM
  Game.bgmT -= dtReal;
  if (Game.bgmT <= 0 && Sound.ctx) {
    Game.bgmT = 3;
    if (Game.demo) Sound.bgm('title');
    else if (Sound.cur !== 'ending' && Sound.cur !== 'space') {
      const ev = eventDef();
      if (ev && (ev.visitors || 0) >= 2 && RT.nightF < 0.9) Sound.bgm('event');
      else if (RT.nightF > 0.6) Sound.bgm('night');
      else Sound.bgm(G.day % 2 ? 'day2' : 'day');
    } else if (Sound.cur === 'space' && !RT.planes.some(p => p.fl.type === 'cosmo')) { Game.spaceT = (Game.spaceT || 0) + 3; if (Game.spaceT > 60) { Game.spaceT = 0; Sound.bgm('day'); } }
  }
}
window.addEventListener('load', boot);
window.__sora = { OX, OY, W, H, serialize, planeModel, PLANES, get G() { return G; }, dbg: { Cloud, rwFreeIn, standFreeAt, planePath, GC, showInfo, autoConnectStand, autoConnectRunway, standReachable, taxiInRail, departRails, rwAxis, planRollout, standGeom, axPt, relocateBuilding, rotateInPlace, openDayReport, openBank, Bank, DayReport, getField, accessTiles, findFacility, findKind, get WALKABLE() { return WALKABLE; }, People, Story, CHAPTERS, Dialog, routeCheck, checkWarnings, relinkGates }, setTool, tryPlace, RT, simStep, World, Cam, R, startGame, placeBuilding, paintApply, openRoute, B, Game, UI };
