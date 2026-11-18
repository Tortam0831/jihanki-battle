// ============================================================
//  画面（HUD・建設・情報・各ウィンドウ・入力）
// ============================================================
const UI = { cat: 'air', tool: null, ghost: null, rectMesh: null, hoverTile: null, infoT: 0, hudT: 0, popT: {}, photo: false, lastMoney: null, touch: false, newIds: {} };
const TOOLBAR = [
  { id: 'build', icon: 'hangar', name: '建設' },
  { id: 'demolish', icon: 'dozer', name: '撤去' },
  { id: 'land', icon: 'flag', name: '土地' },
  { id: 'routes', icon: 'globe', name: '路線' },
  { id: 'research', icon: 'flask', name: '開発' },
  { id: 'board', icon: 'board', name: '発着' },
  { id: 'stats', icon: 'chart', name: '統計' },
  { id: 'zukan', icon: 'book', name: '図鑑' },
  { id: 'missions', icon: 'mission', name: '目標' },
  { id: 'menu', icon: 'gear', name: 'メニュー' },
];
function initUI() {
  const tb = $('#toolbar');
  tb.innerHTML = TOOLBAR.map(t => `<button class="tbtn" id="tb_${t.id}" data-id="${t.id}">${iconImg(t.icon)}<span>${t.name}</span></button>`).join('');
  tb.addEventListener('click', e => { const b = e.target.closest('.tbtn'); if (!b) return; Sound.init(); Sound.se('click'); toolbarAction(b.dataset.id); });
  $('#bRotL').innerHTML = iconImg('rotate'); $('#bRotR').innerHTML = `<span style="transform:scaleX(-1);display:inline-flex">${iconImg('rotate')}</span>`;
  $('#bPhoto').innerHTML = iconImg('camera');
  $('#bRotL').onclick = () => rotateCam(-1); $('#bRotR').onclick = () => rotateCam(1);
  $('#bZoomIn').onclick = () => { Cam.zoom = clamp(Cam.zoom * 1.25, 0.55, 4.5); };
  $('#bZoomOut').onclick = () => { Cam.zoom = clamp(Cam.zoom / 1.25, 0.55, 4.5); };
  $('#bPhoto').onclick = () => togglePhoto();
  $('#spd').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; Sound.init(); setSpeed(+b.dataset.s); });
  $('#moneyIcon').src = iconURL('money');
  $('#mClose').onclick = () => closeModal();
  $('#modal').addEventListener('pointerdown', e => { if (e.target.id === 'modal') closeModal(); });
  $('#mission').addEventListener('click', () => { $('#mission').classList.toggle('min'); });
  initInput();
  Bus.on('earn', (b, amt) => popEarn(b, amt));
}
function toolbarAction(id) {
  if (id === 'build') { if (!$('#buildPanel').classList.contains('hidden')) { closeBuild(); setTool(null); } else openBuild(); return; }
  closeBuild();
  if (id === 'demolish') { setTool(UI.tool && UI.tool.type === 'demolish' ? null : { type: 'demolish' }); return; }
  if (id === 'land') { setTool(UI.tool && UI.tool.type === 'land' ? null : { type: 'land' }); return; }
  setTool(null);
  ({ routes: openRoutes, research: openResearch, board: openBoard, stats: openStats, zukan: openZukan, missions: openMissions, menu: openMenu })[id]();
}
function setSpeed(s) {
  Game.speed = s; Game.userSpeed = s;
  $$('#spd button').forEach(b => b.classList.toggle('on', +b.dataset.s === s));
}

// ---------- HUD ----------
function updateHUD(force) {
  UI.hudT -= 1;
  if (UI.hudT > 0 && !force) return;
  UI.hudT = 10;
  const d = dateOf(G.day);
  $('#apName').textContent = G.name;
  $('#rankB').textContent = 'ランク' + G.rank;
  $('#rankN').textContent = RANKS[G.rank - 1].name;
  $('#stars').innerHTML = starStr(G.rating);
  $('#dateTxt').innerHTML = `${d.year}年目 <span style="color:${SEASON_COLORS[d.season]};text-shadow:0 1px 0 #0004">${d.seasonName}</span> ${d.month}月${d.partName}`;
  $('#clock').textContent = fmtTime(G.min);
  const wx = WEATHER[G.weather] || WEATHER.sun;
  const wsrc = iconURL(wx.icon);
  if ($('#wxIcon').getAttribute('src') !== wsrc) $('#wxIcon').src = wsrc;
  $('#wxIcon').title = wx.name;
  const m = $('#money');
  m.textContent = G.free ? '∞' : fmtYen(G.money);
  m.classList.toggle('neg', G.money < 0);
  // バッジ
  const bw = $('#tb_research');
  const can = RESEARCH.filter(r => canResearch(r).ok).length;
  setBadge(bw, can);
  setBadge($('#tb_missions'), Story.unseenDone || 0);
  if (UI.tool && UI.tool.type === 'land') updateLandLabels();
}
function setBadge(el, n) {
  let b = el.querySelector('.badge');
  if (!n) { if (b) b.remove(); return; }
  if (!b) { b = document.createElement('span'); b.className = 'badge'; el.appendChild(b); }
  b.textContent = n;
}
function starStr(r) {
  let s = '';
  for (let i = 1; i <= 5; i++) s += r >= i ? '★' : r >= i - 0.5 ? '<span style="opacity:.6">★</span>' : '<span style="opacity:.2">★</span>';
  return s + `<span style="font-size:11px;color:var(--ink2);margin-left:3px">${r.toFixed(1)}</span>`;
}
function toast(msg, kind, icon) {
  const t = document.createElement('div');
  t.className = 'toast px ' + (kind || '');
  t.innerHTML = (icon ? iconImg(icon, 's') : '') + `<span>${msg}</span>`;
  const box = $('#toasts');
  box.appendChild(t);
  while (box.children.length > 5) box.firstChild.remove();
  setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 450); }, 4200);
}
function popEarn(b, amt) {
  if (UI.photo || !b || amt < 300) return;
  const now = performance.now();
  if (UI.popT[b.uid] && now - UI.popT[b.uid] < 600) return;
  UI.popT[b.uid] = now;
  if (Cam.zoom < 1.1) return;
  const c = bCenter(b);
  const s = worldToScreen(c.x, 1.6, c.z);
  if (!s.vis || s.x < 0 || s.y < 0 || s.x > R.w || s.y > R.h) return;
  const el = document.createElement('div');
  el.className = 'pop' + (amt >= 10000 ? ' gold' : '');
  el.textContent = '+' + fmtYen(amt);
  el.style.left = s.x + 'px'; el.style.top = s.y + 'px';
  $('#popups').appendChild(el);
  setTimeout(() => el.remove(), 1200);
  if ($('#popups').children.length > 24) $('#popups').firstChild.remove();
}

// ---------- 建設パネル ----------
function openBuild() {
  $('#buildPanel').classList.remove('hidden');
  $('#tb_build').classList.add('on');
  renderBuildTabs(); renderBuildCards();
  Sound.se('open');
}
function closeBuild() { $('#buildPanel').classList.add('hidden'); $('#tb_build').classList.remove('on'); }
function renderBuildTabs() {
  $('#bTabs').innerHTML = CATS.map(c => `<button data-c="${c.id}" class="${c.id === UI.cat ? 'on' : ''}">${iconImg(c.icon, 's')}${c.name}</button>`).join('');
  $('#bTabs').onclick = e => { const b = e.target.closest('button'); if (!b) return; UI.cat = b.dataset.c; Sound.se('tab'); renderBuildTabs(); renderBuildCards(); };
}
function renderBuildCards() {
  const ids = BUILD_ORDER.filter(id => B[id].cat === UI.cat && id !== 'busstop' || (UI.cat === 'land' && id === 'busstop'));
  const html = ids.map(id => {
    const d = B[id];
    const lock = d.rank > G.rank && !G.free;
    const uniqueDone = d.unique && Object.values(G.blds).some(b => b.id === id);
    const cant = !lock && !G.free && G.money < d.cost;
    const isNew = !lock && d.rank === G.rank && G.rank > 1 && !UI.newIds[id];
    const on = UI.tool && UI.tool.id === id;
    return `<div class="bcard ${lock ? 'lock' : ''} ${cant ? 'cant' : ''} ${on ? 'on' : ''}" data-id="${id}" title="${esc(d.desc || '')}">
      <img class="th" src="${d.paint || d.kind === 'runway' ? iconURL(d.icon, 6) : thumbURL(id)}" alt="">
      <div class="nm">${d.name}</div>
      <div class="pr">${d.paint ? fmtYen(d.cost) + '/マス' : fmtYen(d.cost)}</div>
      ${d.w && !d.paint ? `<div class="sub">${d.w}×${d.h}${uniqueDone ? '・建設済' : ''}</div>` : '<div class="sub">ドラッグでぬる</div>'}
      ${lock ? `<div class="lk">${iconImg('lock')}ランク${d.rank}</div>` : ''}
      ${isNew ? '<div class="new">NEW</div>' : ''}
    </div>`;
  }).join('');
  $('#bCards').innerHTML = html;
  $('#bCards').onclick = e => {
    const c = e.target.closest('.bcard'); if (!c) return;
    const id = c.dataset.id, d = B[id];
    if (d.rank > G.rank && !G.free) { toast(`ランク${d.rank}になると建てられます`, 'bad', 'lock'); Sound.se('error'); return; }
    UI.newIds[id] = 1;
    Sound.se('click');
    setTool(d.paint ? { type: 'paint', id } : { type: 'build', id, rot: UI.lastRot || 0 });
    renderBuildCards();
    if (window.innerWidth < 720 || UI.touch) closeBuild();
  };
}
// サムネイル
const Thumb = { rt: null, scene: null, cam: null, cache: {} };
function thumbURL(id, force) {
  if (Thumb.cache[id] && !force) return Thumb.cache[id];
  const TW = 48, TH = 36;
  if (!Thumb.rt) {
    Thumb.rt = new THREE.WebGLRenderTarget(TW, TH, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });
    Thumb.rt.texture.colorSpace = THREE.SRGBColorSpace;
    Thumb.scene = new THREE.Scene(); Thumb.scene.background = new THREE.Color('#bfe0ff');
    Thumb.scene.add(new THREE.HemisphereLight('#ffffff', '#8a9a70', 1.1));
    const dl = new THREE.DirectionalLight('#fff4e0', 1.6); dl.position.set(5, 10, 7); Thumb.scene.add(dl);
    Thumb.cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 200);
    Thumb.buf = new Uint8Array(TW * TH * 4);
    Thumb.cv = document.createElement('canvas'); Thumb.cv.width = TW; Thumb.cv.height = TH;
  }
  const def = B[id];
  const obj = buildModel(id, { num: 1, lv: 1, season: 1 });
  const base = new THREE.Mesh(new THREE.BoxGeometry(def.w + 0.2, 0.1, def.h + 0.2), new THREE.MeshLambertMaterial({ color: def.zone === 'term' ? '#e8e0d0' : '#6ab85a' }));
  base.position.y = -0.05;
  const g = new THREE.Group(); g.add(obj); g.add(base);
  Thumb.scene.add(g);
  const box = new THREE.Box3().setFromObject(g);
  const c = box.getCenter(new THREE.Vector3()), sz = box.getSize(new THREE.Vector3());
  const r = Math.max(sz.x, sz.z) * 0.62 + sz.y * 0.35 + 0.2;
  const cam = Thumb.cam, asp = TW / TH;
  cam.left = -r * asp; cam.right = r * asp; cam.top = r; cam.bottom = -r; cam.updateProjectionMatrix();
  cam.position.set(c.x + 20, c.y + 14, c.z + 20); cam.lookAt(c.x, c.y, c.z);
  const rd = R.renderer;
  rd.setRenderTarget(Thumb.rt); rd.render(Thumb.scene, cam); rd.readRenderTargetPixels(Thumb.rt, 0, 0, TW, TH, Thumb.buf); rd.setRenderTarget(null);
  Thumb.scene.remove(g); disposeObj(g);
  const ctx = Thumb.cv.getContext('2d'), img = ctx.createImageData(TW, TH);
  for (let y = 0; y < TH; y++) img.data.set(Thumb.buf.subarray((TH - 1 - y) * TW * 4, (TH - y) * TW * 4), y * TW * 4);
  ctx.putImageData(img, 0, 0);
  const big = document.createElement('canvas'); big.width = TW * 2; big.height = TH * 2;
  const bx = big.getContext('2d'); bx.imageSmoothingEnabled = false; bx.drawImage(Thumb.cv, 0, 0, TW * 2, TH * 2);
  return (Thumb.cache[id] = big.toDataURL());
}

// ---------- ツール ----------
function setTool(t) {
  UI.tool = t;
  if (UI.ghost) { R.scene.remove(UI.ghost); UI.ghost = null; }
  clearRect();
  if (World.gridMesh) { World.gridMesh.visible = !!t && t.type !== 'land'; World.gridMesh.material.uniforms.op.value = 0.13; }
  $('#tb_demolish').classList.toggle('on', !!t && t.type === 'demolish');
  $('#tb_land').classList.toggle('on', !!t && t.type === 'land');
  $('#labels').innerHTML = ''; UI.landLbl = null;
  if (t && (t.type === 'build' || t.type === 'move')) makeGhost();
  if (t && t.type === 'land') updateLandLabels(true);
  renderBuildBar();
  if (t) hideInfo();
}
function makeGhost() {
  const t = UI.tool;
  const def = B[t.id];
  const m = buildModel(t.id, { num: 0, lv: t.lv || 1, season: dateOf(G.day).season });
  UI.ghostMat = UI.ghostMat || new THREE.MeshBasicMaterial({ color: '#80ff80', transparent: true, opacity: 0.55, depthWrite: false });
  m.traverse(o => { if (o.isMesh) { o.material = UI.ghostMat; o.castShadow = false; o.renderOrder = 8; } });
  UI.ghost = m; m.visible = false;
  R.scene.add(m);
}
function renderBuildBar() {
  const t = UI.tool, bar = $('#buildBar');
  if (!t) { bar.classList.add('hidden'); return; }
  bar.classList.remove('hidden');
  let h = '';
  if (t.type === 'build' || t.type === 'move') {
    const d = B[t.id];
    h = `${iconImg(d.icon)}<div class="msg"><b>${t.type === 'move' ? '移動：' : ''}${d.name}</b> <span class="sub">${t.type === 'move' ? '' : fmtYen(d.cost)}</span><div class="sub" id="bbMsg">置きたい場所をタップ</div></div>
      <button class="pbtn sm" id="bbRot">${iconImg('rotate', 's')}回転</button>${UI.touch ? '<button class="pbtn sm green" id="bbOk">建てる</button>' : ''}<button class="pbtn sm red" id="bbX">やめる</button>`;
  } else if (t.type === 'paint') {
    const d = B[t.id];
    h = `${iconImg(d.icon)}<div class="msg"><b>${d.name}</b> <span class="sub">${fmtYen(d.cost)}/マス</span><div class="sub" id="bbMsg">ドラッグで四角くぬれます</div></div><button class="pbtn sm red" id="bbX">やめる</button>`;
  } else if (t.type === 'demolish') {
    h = `${iconImg('dozer')}<div class="msg"><b>撤去</b><div class="sub" id="bbMsg">建物をタップ／ドラッグで床をはがす（半額もどる）</div></div><button class="pbtn sm red" id="bbX">やめる</button>`;
  } else if (t.type === 'land') {
    h = `${iconImg('flag')}<div class="msg"><b>土地を買う</b><div class="sub">となりの土地を買って空港を広げよう。次の土地：${fmtYen(sectorPrice())}</div></div><button class="pbtn sm red" id="bbX">やめる</button>`;
  }
  bar.innerHTML = h;
  const x = $('#bbX'); if (x) x.onclick = () => { cancelTool(); };
  const r = $('#bbRot'); if (r) r.onclick = () => rotateTool();
  const ok = $('#bbOk'); if (ok) ok.onclick = () => { if (UI.hoverTile) tryPlace(UI.hoverTile.x, UI.hoverTile.y); };
}
function cancelTool() {
  if (UI.tool && UI.tool.type === 'move' && UI.tool.orig) {
    const o = UI.tool.orig; placeBuilding(o.id, o.x, o.y, o.rot, { move: true, uid: o.uid, lv: o.lv, num: o.num, silent: true });
    const nb = G.blds[o.uid]; if (nb) Object.assign(nb, { salesTotal: o.salesTotal, visits: o.visits, day: o.day, fixed: o.fixed });
  }
  setTool(null); Sound.se('close');
}
function rotateTool() {
  if (!UI.tool || !(UI.tool.type === 'build' || UI.tool.type === 'move')) return;
  UI.tool.rot = (UI.tool.rot + 1) % 4; UI.lastRot = UI.tool.rot;
  Sound.se('tab'); updateGhost();
}
function ghostOrigin(tx, ty) {
  const t = UI.tool, def = B[t.id];
  const [w, h] = dims(def, t.rot);
  return [tx - Math.floor((w - 1) / 2), ty - Math.floor((h - 1) / 2)];
}
function updateGhost() {
  const t = UI.tool;
  if (!t || !UI.ghost || !UI.hoverTile) return;
  const [x, y] = ghostOrigin(UI.hoverTile.x, UI.hoverTile.y);
  const def = B[t.id];
  const chk = canPlace(t.id, x, y, t.rot, { move: t.type === 'move', ignoreUid: t.uid });
  placeMeshAt(UI.ghost, def, x, y, t.rot);
  UI.ghost.position.y += 0.02;
  UI.ghost.visible = true;
  UI.ghostMat.color.set(chk.ok ? '#80ff90' : '#ff6060');
  const msg = $('#bbMsg');
  if (msg) { msg.textContent = chk.ok ? (chk.cost ? `ここに建てる：${fmtYen(chk.cost)}` : 'ここに置けます') : chk.reason; msg.className = 'sub ' + (chk.ok ? '' : 'err'); }
  UI.ghostOk = chk.ok;
  // 搭乗口の距離ガイド
  if (def.kind === 'stand' || def.kind === 'gate') showGateHint(x, y, t);
}
function showGateHint(x, y, t) { /* シンプル化：メッセージのみ */ }
function tryPlace(tx, ty) {
  const t = UI.tool; if (!t) return;
  const [x, y] = ghostOrigin(tx, ty);
  const def = B[t.id];
  const chk = canPlace(t.id, x, y, t.rot, { move: t.type === 'move', ignoreUid: t.uid });
  if (!chk.ok) { toast(chk.reason, 'bad'); Sound.se('error'); return; }
  if (t.type === 'move') {
    const o = t.orig;
    placeBuilding(o.id, x, y, t.rot, { move: true, uid: o.uid, lv: o.lv, num: o.num });
    const nb = G.blds[o.uid]; if (nb) Object.assign(nb, { salesTotal: o.salesTotal, visits: o.visits, day: o.day });
    UI.tool.orig = null; setTool(null); Sound.se('place'); return;
  }
  const b = placeBuilding(t.id, x, y, t.rot);
  if (b) {
    Sound.se('place');
    puff(b);
    if (def.unique || def.kind === 'runway') setTool(null);
    else updateGhost();
    if (!$('#buildPanel').classList.contains('hidden')) renderBuildCards();
  }
}
function puff(b) {
  // 建てたときのけむり（簡易：画面のポップ）
  const c = bCenter(b); const s = worldToScreen(c.x, 0.5, c.z);
  const el = document.createElement('div'); el.className = 'pop'; el.textContent = '✨'; el.style.left = s.x + 'px'; el.style.top = s.y + 'px'; el.style.fontSize = '22px';
  $('#popups').appendChild(el); setTimeout(() => el.remove(), 1200);
}
// 四角選択（床ぬり・撤去）
function clearRect() { if (UI.rectMesh) { R.scene.remove(UI.rectMesh); UI.rectMesh.geometry.dispose(); UI.rectMesh = null; } }
function showRect(x0, y0, x1, y1, col) {
  clearRect();
  const P = [];
  const xa = Math.min(x0, x1), xb = Math.max(x0, x1), ya = Math.min(y0, y1), yb = Math.max(y0, y1);
  const tiles = UI.tool.type === 'paint' ? new Set(paintCheck(UI.tool.id, x0, y0, x1, y1).tiles) : null;
  for (let y = ya; y <= yb; y++) for (let x = xa; x <= xb; x++) {
    if (!inMap(x, y)) continue;
    if (tiles && !tiles.has(idx(x, y))) continue;
    const h = floorH(x, y) + 0.09;
    P.push(x + 0.05, h, y + 0.95, x + 0.95, h, y + 0.95, x + 0.95, h, y + 0.05, x + 0.05, h, y + 0.95, x + 0.95, h, y + 0.05, x + 0.05, h, y + 0.05);
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  UI.rectMesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.5, depthWrite: false }));
  UI.rectMesh.renderOrder = 9;
  R.scene.add(UI.rectMesh);
  const msg = $('#bbMsg');
  if (msg && UI.tool.type === 'paint') { const c = paintCheck(UI.tool.id, x0, y0, x1, y1); msg.textContent = `${c.tiles.length}マス ${fmtYen(c.cost)}`; msg.className = 'sub' + (G.money < c.cost && !G.free ? ' err' : ''); }
}

// ---------- 入力 ----------
const Inp = { ptrs: new Map(), down: null, moved: false, pinch: 0, keys: {}, rect: null, lastTap: 0 };
function tileAtScreen(sx, sy) {
  const g = screenToGround(sx, sy, 0.05);
  if (!g) return null;
  return { x: Math.floor(g.x), y: Math.floor(g.z), fx: g.x, fz: g.z };
}
function initInput() {
  const cv = R.renderer.domElement;
  cv.addEventListener('contextmenu', e => e.preventDefault());
  cv.addEventListener('pointerdown', e => {
    Sound.init();
    if (e.pointerType === 'touch') UI.touch = true;
    cv.setPointerCapture(e.pointerId);
    Inp.ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, btn: e.button, t: performance.now() });
    if (Inp.ptrs.size === 2) {
      const [a, b] = [...Inp.ptrs.values()];
      Inp.pinch = Math.hypot(a.x - b.x, a.y - b.y); Inp.mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      Inp.rect = null; clearRect(); Inp.moved = true;
    } else if (Inp.ptrs.size === 1) {
      Inp.moved = false; Inp.down = { x: e.clientX, y: e.clientY, btn: e.button };
      const t = UI.tool;
      if (t && (t.type === 'paint' || t.type === 'demolish') && e.button === 0) {
        const tl = tileAtScreen(e.clientX, e.clientY);
        if (tl) { Inp.rect = { x0: tl.x, y0: tl.y, x1: tl.x, y1: tl.y }; showRect(tl.x, tl.y, tl.x, tl.y, t.type === 'paint' ? '#ffffff' : '#ff4040'); }
      }
      if (t && (t.type === 'build' || t.type === 'move') && e.pointerType === 'touch') {
        const tl = tileAtScreen(e.clientX, e.clientY); if (tl) { Inp.touchBuildStart = { x: tl.x, y: tl.y, same: UI.hoverTile && UI.hoverTile.x === tl.x && UI.hoverTile.y === tl.y }; }
      }
    }
  });
  cv.addEventListener('pointermove', e => {
    const p = Inp.ptrs.get(e.pointerId);
    if (e.pointerType === 'mouse' && !p) { hover(e.clientX, e.clientY); return; }
    if (!p) return;
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    p.x = e.clientX; p.y = e.clientY;
    if (Math.hypot(p.x - p.sx, p.y - p.sy) > 7) Inp.moved = true;
    if (Inp.ptrs.size === 2) {
      const [a, b] = [...Inp.ptrs.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y), mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      if (Inp.pinch > 0) Cam.zoom = clamp(Cam.zoom * d / Inp.pinch, 0.55, 4.5);
      panCam(mid.x - Inp.mid.x, mid.y - Inp.mid.y);
      Inp.pinch = d; Inp.mid = mid;
      return;
    }
    const t = UI.tool;
    if (Inp.rect && p.btn === 0) {
      const tl = tileAtScreen(e.clientX, e.clientY);
      if (tl && (tl.x !== Inp.rect.x1 || tl.y !== Inp.rect.y1)) { Inp.rect.x1 = tl.x; Inp.rect.y1 = tl.y; showRect(Inp.rect.x0, Inp.rect.y0, tl.x, tl.y, t.type === 'paint' ? '#ffffff' : '#ff4040'); Sound.se('paint'); }
      return;
    }
    if (t && (t.type === 'build' || t.type === 'move') && e.pointerType === 'touch' && Inp.moved) { hover(e.clientX, e.clientY); return; }
    if (e.pointerType === 'mouse' && p.btn === 0 && t && (t.type === 'build' || t.type === 'move')) { hover(e.clientX, e.clientY); }
    if (!(t && (t.type === 'build' || t.type === 'move') && e.pointerType === 'touch')) { if (Inp.moved) panCam(dx, dy); }
  });
  const up = e => {
    const p = Inp.ptrs.get(e.pointerId);
    Inp.ptrs.delete(e.pointerId);
    if (!p) return;
    if (Inp.ptrs.size > 0) { Inp.pinch = 0; const q = [...Inp.ptrs.values()][0]; Inp.mid = { x: q.x, y: q.y }; return; }
    const t = UI.tool;
    if (Inp.rect) {
      const r = Inp.rect; Inp.rect = null; clearRect();
      if (t.type === 'paint') { const n = paintApply(t.id, r.x0, r.y0, r.x1, r.y1); if (n > 0) Sound.se('place'); }
      else if (t.type === 'demolish') {
        if (!Inp.moved || (r.x0 === r.x1 && r.y0 === r.y1)) { tapDemolish(r.x0, r.y0); }
        else { const n = clearFloor(r.x0, r.y0, r.x1, r.y1); if (n) Sound.se('demolish'); }
      }
      return;
    }
    if (Inp.moved) return;
    if (p.btn === 2) { if (t) cancelTool(); return; }
    tap(e.clientX, e.clientY, e.pointerType);
  };
  cv.addEventListener('pointerup', up);
  cv.addEventListener('pointercancel', e => { Inp.ptrs.delete(e.pointerId); Inp.rect = null; clearRect(); });
  cv.addEventListener('wheel', e => { e.preventDefault(); Cam.zoom = clamp(Cam.zoom * (e.deltaY < 0 ? 1.12 : 1 / 1.12), 0.55, 4.5); }, { passive: false });
  window.addEventListener('keydown', e => {
    if (e.target && e.target.tagName === 'INPUT') return;
    Inp.keys[e.key.toLowerCase()] = true;
    const k = e.key.toLowerCase();
    if (k === 'q') rotateCam(-1);
    if (k === 'e') rotateCam(1);
    if (k === 'r') rotateTool();
    if (k === 'escape') { if (!$('#modal').classList.contains('hidden')) closeModal(); else if (UI.tool) cancelTool(); else if (UI.photo) togglePhoto(); else hideInfo(); }
    if (k === ' ') { e.preventDefault(); setSpeed(Game.speed === 0 ? (Game.lastSpeed || 1) : (Game.lastSpeed = Game.speed, 0)); }
    if (k === '1') setSpeed(1); if (k === '2') setSpeed(2); if (k === '3') setSpeed(4);
    if (k === 'b') toolbarAction('build');
    if (k === 'delete' || k === 'x') toolbarAction('demolish');
    if (k === '+' || k === '=') Cam.zoom = clamp(Cam.zoom * 1.2, 0.55, 4.5);
    if (k === '-') Cam.zoom = clamp(Cam.zoom / 1.2, 0.55, 4.5);
  });
  window.addEventListener('keyup', e => { Inp.keys[e.key.toLowerCase()] = false; });
  window.addEventListener('blur', () => { Inp.keys = {}; });
}
function keyPan(dtReal) {
  const k = Inp.keys, s = 700 * dtReal;
  let dx = 0, dy = 0;
  if (k['w'] || k['arrowup']) dy += s; if (k['s'] || k['arrowdown']) dy -= s;
  if (k['a'] || k['arrowleft']) dx += s; if (k['d'] || k['arrowright']) dx -= s;
  if (dx || dy) panCam(dx, dy);
}
function hover(sx, sy) {
  const tl = tileAtScreen(sx, sy);
  UI.hoverTile = tl;
  if (UI.tool && (UI.tool.type === 'build' || UI.tool.type === 'move')) updateGhost();
  // ツールチップ
  const tip = $('#tip');
  if (!UI.tool && tl && inMap(tl.x, tl.y) && !UI.touch) {
    const b = bAt(tl.x, tl.y);
    if (b) { tip.textContent = B[b.id].name + (b.lv > 1 ? ' Lv' + b.lv : ''); tip.style.left = (sx + 14) + 'px'; tip.style.top = (sy + 14) + 'px'; tip.classList.remove('hidden'); return; }
  }
  tip.classList.add('hidden');
}
function tap(sx, sy, ptype) {
  const t = UI.tool;
  const tl = tileAtScreen(sx, sy);
  if (t && (t.type === 'build' || t.type === 'move')) {
    if (!tl) return;
    if (ptype === 'touch') {
      const same = UI.hoverTile && UI.hoverTile.x === tl.x && UI.hoverTile.y === tl.y;
      UI.hoverTile = tl; updateGhost();
      if (same) tryPlace(tl.x, tl.y);
      return;
    }
    UI.hoverTile = tl; tryPlace(tl.x, tl.y); return;
  }
  if (t && t.type === 'land') {
    if (!tl) return;
    const sx2 = Math.floor(tl.x / SEC), sy2 = Math.floor(tl.y / SEC);
    if (sx2 >= 0 && sy2 >= 0 && sx2 < SECW && sy2 < SECH) askBuySector(sx2, sy2);
    return;
  }
  // 選択
  const pick = pickAt(sx, sy, tl);
  if (pick) { Sound.se('click'); showInfo(pick); } else hideInfo();
}
function pickAt(sx, sy, tl) {
  let best = null, bd = 26;
  for (const pl of RT.planes) {
    const s = worldToScreen(pl.x, pl.y + 0.5, pl.z);
    const d = Math.hypot(s.x - sx, s.y - sy) - pl.P.len * 4 * Cam.zoom;
    if (d < bd) { bd = d; best = { type: 'plane', obj: pl }; }
  }
  if (!best) {
    let pd = 16 * Math.max(1, Cam.zoom * 0.8);
    for (const p of RT.persons) {
      if (p.hidden) continue;
      const s = worldToScreen(p.x, floorH(Math.floor(p.x), Math.floor(p.z)) + 0.3, p.z);
      const d = Math.hypot(s.x - sx, s.y - sy);
      if (d < pd) { pd = d; best = { type: 'person', obj: p }; }
    }
  }
  if (!best && tl) {
    const b = bAt(tl.x, tl.y);
    if (b) best = { type: 'bld', obj: b };
  }
  return best;
}
function tapDemolish(x, y) {
  const b = bAt(x, y);
  if (!b) { const n = clearFloor(x, y, x, y); if (n) Sound.se('demolish'); return; }
  if (b.fixed) { toast('この建物はこわせません', 'bad'); Sound.se('error'); return; }
  if (b.busy) { toast('いま使用中です', 'bad'); Sound.se('error'); return; }
  const def = B[b.id];
  removeBuilding(b.uid);
  Sound.se('demolish');
  toast(`${def.name} を撤去しました`, '', 'dozer');
}
function askBuySector(sx, sy) {
  if (G.sectors[sy * SECW + sx]) { toast('もう買った土地です'); return; }
  if (!canBuySector(sx, sy)) { toast('となりの土地から順に買えます', 'bad'); Sound.se('error'); return; }
  const p = sectorPrice();
  openModal('土地を買う', `<div style="text-align:center">${iconImg('flag', 'xl')}<p>この土地（${SEC}×${SEC}マス・陸地${landTilesIn(sx, sy)}マス）を<br><b style="font-size:20px">${fmtYen(p)}</b> で買いますか？</p>
    <div style="display:flex;gap:8px;justify-content:center"><button class="pbtn green" id="buyY">買う</button><button class="pbtn" id="buyN">やめる</button></div></div>`, { narrow: true });
  $('#buyY').onclick = () => { if (buySector(sx, sy)) { closeModal(); updateLandLabels(true); renderBuildBar(); } };
  $('#buyN').onclick = () => closeModal();
}
function updateLandLabels(force) {
  const box = $('#labels');
  if (force || !UI.landLbl) {
    box.innerHTML = '';
    UI.landLbl = [];
    for (let sy = 0; sy < SECH; sy++) for (let sx = 0; sx < SECW; sx++) {
      if (G.sectors[sy * SECW + sx] || !canBuySector(sx, sy) || landTilesIn(sx, sy) < 6) continue;
      const el = document.createElement('div'); el.className = 'lbl px';
      el.innerHTML = `${iconImg('flag', 's')} ${fmtYenShort(sectorPrice())}`;
      el.onclick = () => askBuySector(sx, sy);
      box.appendChild(el);
      UI.landLbl.push({ el, x: sx * SEC + SEC / 2, z: sy * SEC + SEC / 2 });
    }
  }
  for (const l of UI.landLbl) { const s = worldToScreen(l.x, 0.3, l.z); l.el.style.left = s.x + 'px'; l.el.style.top = s.y + 'px'; }
}

// ---------- 情報パネル ----------
function showInfo(sel) { UI.sel = sel; $('#info').classList.remove('hidden'); renderInfo(); }
function hideInfo() { UI.sel = null; $('#info').classList.add('hidden'); if (UI.selBox) { R.scene.remove(UI.selBox); UI.selBox = null; } }
function renderInfo() {
  const s = UI.sel; if (!s) return;
  const box = $('#info');
  let h = `<button class="pbtn sm x" id="infoX">✕</button>`;
  if (s.type === 'bld') {
    const b = G.blds[s.obj.uid]; if (!b) { hideInfo(); return; }
    const def = B[b.id];
    h += `<h3>${iconImg(def.icon)}${def.name}${b.lv > 1 ? ` <span class="rankb">Lv${b.lv}</span>` : ''}</h3><div class="sub">${esc(def.desc || '')}</div>`;
    const ws = RT.warnings.get(b.uid);
    if (ws) h += ws.map(w => `<div class="warn">⚠ ${w}</div>`).join('');
    if (b.combo) h += b.combo.map(id => { const c = COMBOS.find(x => x.id === id); return `<div class="combo">${iconImg('note', 's')} <b>${c.name}</b> ${c.desc}</div>`; }).join('');
    const rows = [];
    if (def.kind === 'svc' || def.kind === 'checkin' || def.kind === 'security' || def.kind === 'emig' || def.kind === 'immig' || def.kind === 'baggage') {
      const f = facOf(b);
      rows.push(['ならんでいる人', f.queue.length + '人'], ['利用中', f.serving.length + ' / ' + facCap(b)]);
      if (def.price) rows.push(['今日の売上', fmtYen(b.salesToday || 0)], ['きのうの売上', fmtYen(b.salesYest || 0)], ['これまでの売上', fmtYen(b.salesTotal || 0)]);
      rows.push(['今日の利用', fmtNum(f.today) + '回']);
    }
    if (def.kind === 'stand') {
      const g = G.blds[b.gate];
      rows.push(['番号', b.num + '番'], ['大きさ', ['', '小型機', '中型機まで', '大型機まで'][def.cls]], ['搭乗口', g ? (B[g.id].bus ? 'バスラウンジ' : '搭乗口' + g.num) : 'なし']);
      const fl = RT.todayFlights.find(f => f.id === b.busy);
      rows.push(['いまの飛行機', fl ? `${fl.code} ${CITIES[fl.city].name}` : '空き']);
    }
    if (def.kind === 'gate') {
      const st = G.blds[b.stand];
      rows.push(['番号', b.num + '番'], ['駐機場', st ? st.num + '番' : 'なし']);
      const next = RT.todayFlights.find(f => f.gate === b.uid && f.status !== 'departed' && f.status !== 'cancel');
      if (next) rows.push(['次の便', `${next.code} ${CITIES[next.city].name}行 ${fmtTime(next.depT)}`]);
    }
    if (def.kind === 'runway') rows.push(['番号', `${String(b.num).padStart(2, '0')}/${String((b.num + 18) % 36 || 36).padStart(2, '0')}`], ['使える機材', ['', '小型機', '中型機まで', '大型機・ジャンボ'][def.cls]], ['状態', b.busy ? '使用中' : '空き']);
    if (def.kind === 'access') rows.push(['1時間に来られる人', (def.access || 0) + '人くらい']);
    if (def.kind === 'hotel') rows.push(['きのうの収入', fmtYen(b.salesYest || 0)]);
    rows.push(['維持費', fmtYen((def.upkeep || 0) * (1 + (b.lv - 1) * 0.3)) + '/日']);
    h += rows.map(([k, v]) => `<div class="row"><b>${k}</b><span>${v}</span></div>`).join('');
    h += '<div class="btns">';
    const canUp = def.kind === 'svc' || def.kind === 'checkin' || def.kind === 'security' || def.kind === 'baggage' || def.kind === 'emig' || def.kind === 'immig' || def.kind === 'access' || def.kind === 'hotel';
    if (canUp) h += b.lv < maxLevel() ? `<button class="pbtn sm gold" id="iUp">${iconImg('up', 's')}Lv${b.lv + 1}へ ${fmtYenShort(upgradeCost(b))}</button>` : `<span class="sub">${b.lv >= 5 ? '最大レベル' : '開発「施設改装」でLvアップ解放'}</span>`;
    if (!b.fixed && !b.busy) h += `<button class="pbtn sm" id="iMove">${iconImg('move', 's')}移動</button><button class="pbtn sm red" id="iDel">${iconImg('trash', 's')}撤去 +${fmtYenShort(def.cost * 0.5 * (1 + (b.lv - 1) * 0.5))}</button>`;
    h += '</div>';
    box.innerHTML = h;
    const up = $('#iUp'); if (up) up.onclick = () => { if (upgradeBuilding(b)) renderInfo(); };
    const mv = $('#iMove'); if (mv) mv.onclick = () => startMove(b);
    const dl = $('#iDel'); if (dl) dl.onclick = () => { removeBuilding(b.uid); Sound.se('demolish'); hideInfo(); };
    showSelBox(b);
  } else if (s.type === 'person') {
    const p = s.obj;
    if (p.gone) { hideInfo(); return; }
    const pd = PAX[p.type] || { name: p.kind === 'mascot' ? 'ソラまる' : p.type === 'pilot' ? 'パイロット' : p.type === 'ca' ? '客室乗務員' : 'スタッフ', desc: '' };
    const fl = p.fl;
    const kindName = { dep: '出発', arr: '到着', visit: '見学', crew: '乗務員', mascot: 'マスコット', missed: '乗りおくれ…' }[p.kind] || '';
    const sprite = spriteURL(p.v);
    h += `<h3><img src="${sprite}" style="width:32px;height:40px;image-rendering:pixelated">${p.kind === 'mascot' ? 'ソラまる' : pd.name} <span class="tag">${kindName}</span></h3><div class="sub">${esc(pd.desc || '')}</div>`;
    if (p.w > 0) h += `<div class="row"><b>きもち</b><span style="flex:1;max-width:150px"><div class="bar"><i style="width:${p.mood}%;background:${p.mood > 65 ? 'var(--good)' : p.mood > 40 ? 'var(--gold)' : 'var(--bad)'}"></i></div></span></div>`;
    if (fl) h += `<div class="row"><b>便</b><span>${fl.code} ${p.kind === 'arr' ? CITIES[fl.city].name + 'から' : CITIES[fl.city].name + '行'}</span></div><div class="row"><b>${p.kind === 'arr' ? '到着' : '出発'}</b><span>${fmtTime(p.kind === 'arr' ? fl.arrT : fl.depT)}</span></div>`;
    if (p.needs && p.needs.length) h += `<div class="row"><b>したいこと</b><span>${p.needs.map(n => iconImg({ food: 'food', shop: 'shopping', toilet: 'toilet', rest: 'zzz', fun: 'note' }[n], 's')).join('')}</span></div>`;
    if (p.spent) h += `<div class="row"><b>使ったお金</b><span>${fmtYen(p.spent)}</span></div>`;
    h += `<div class="row"><b>いま</b><span>${personDoing(p)}</span></div>`;
    if (p.w > 1.05) h += `<div class="sub">※この人は約${p.w.toFixed(1)}人ぶんのお客さんを表しています</div>`;
    box.innerHTML = h;
  } else if (s.type === 'plane') {
    const pl = s.obj; if (pl.gone) { hideInfo(); return; }
    const fl = pl.fl, P = PLANES[fl.type], al = AIRLINES[fl.airline];
    h += `<h3>${iconImg('plane')}${fl.code}</h3><div class="sub">${al.name}・${P.name}</div>`;
    const st = { approach: '着陸態勢', hold: '上空で待機中', landed: '着陸', parked: fl.boarding ? '搭乗中' : '駐機中', departed: '出発' }[fl.status] || fl.status;
    const rows = [['行き先', CITIES[fl.city].name + `（${REGION_NAME[CITIES[fl.city].region]}）`], ['到着予定', fmtTime(fl.arrT)], ['出発予定', fmtTime(fl.depT)], ['状態', st]];
    if (!fl.cargo) rows.push(['到着した人', fl.paxArr + '人'], ['乗る予定', fl.paxDep + '人'], ['搭乗済み', Math.round(fl.boarded) + '人']);
    else rows.push(['貨物', P.cargo + 'トン']);
    h += rows.map(([k, v]) => `<div class="row"><b>${k}</b><span>${v}</span></div>`).join('');
    h += `<div class="sub" style="margin-top:6px">${P.desc}</div>`;
    box.innerHTML = h;
  }
  const x = $('#infoX'); if (x) x.onclick = () => hideInfo();
}
function personDoing(p) {
  if (p.state === 'queue') { const b = G.blds[p.facUid]; return b ? B[b.id].name + 'にならんでいる' : '並んでいる'; }
  if (p.state === 'service') { const b = G.blds[p.facUid]; return b ? B[b.id].name + 'を利用中' : '利用中'; }
  if (p.state === 'walk') { const b = G.blds[p.target]; return b ? B[b.id].name + 'へ向かっている' : '歩いている'; }
  if (p.state === 'gatewait') return '搭乗口で待っている';
  if (p.state === 'boarding') return '飛行機に乗るところ';
  if (p.state === 'wander') return 'おさんぽ中';
  return 'かんがえ中';
}
function spriteURL(v) {
  const key = 'spr' + v;
  if (_iconURL[key]) return _iconURL[key];
  const c = document.createElement('canvas'); c.width = SPR_W; c.height = SPR_H;
  const cell = v * 8, cx = (cell % SPR_COLS) * SPR_W, cy = Math.floor(cell / SPR_COLS) * SPR_H;
  c.getContext('2d').drawImage(SPR.atlas, cx, cy, SPR_W, SPR_H, 0, 0, SPR_W, SPR_H);
  return (_iconURL[key] = c.toDataURL());
}
function showSelBox(b) {
  if (UI.selBox) { R.scene.remove(UI.selBox); }
  const def = B[b.id], [w, h] = dims(def, b.rot);
  const g = new THREE.BoxGeometry(w + 0.1, 0.05, h + 0.1);
  const m = new THREE.LineSegments(new THREE.EdgesGeometry(g), new THREE.LineBasicMaterial({ color: '#ffd84a' }));
  m.position.set(b.x + w / 2, floorH(b.x, b.y) + 0.06, b.y + h / 2);
  UI.selBox = m; R.scene.add(m);
}
function startMove(b) {
  const orig = Object.assign({}, b);
  delete orig.mesh;
  removeBuilding(b.uid, { move: true });
  hideInfo();
  setTool({ type: 'move', id: b.id, rot: b.rot, lv: b.lv, uid: b.uid, orig });
}

// ---------- モーダル ----------
function openModal(title, html, opt) {
  opt = opt || {};
  $('#mTitle').innerHTML = (opt.icon ? iconImg(opt.icon) + ' ' : '') + title;
  $('#mBody').innerHTML = html;
  $('#modal .win').classList.toggle('narrow', !!opt.narrow);
  const tabs = $('#mTabs');
  if (opt.tabs) {
    tabs.classList.remove('hidden');
    tabs.innerHTML = opt.tabs.map(t => `<button data-t="${t.id}" class="${t.id === opt.tab ? 'on' : ''}">${t.name}</button>`).join('');
    tabs.onclick = e => { const b = e.target.closest('button'); if (!b) return; Sound.se('tab'); opt.onTab(b.dataset.t); };
  } else tabs.classList.add('hidden');
  $('#modal').classList.remove('hidden');
  UI.modalOpen = opt.id || title;
  Game.modalPause = !!opt.pause;
  if (!opt.silent) Sound.se('open');
}
function closeModal() {
  if ($('#modal').classList.contains('hidden')) return;
  $('#modal').classList.add('hidden'); UI.modalOpen = null; Game.modalPause = false; Sound.se('close');
  if (UI.onModalClose) { const f = UI.onModalClose; UI.onModalClose = null; f(); }
}

// ---- 路線 ----
function openRoutes(tab, sel) {
  tab = tab || UI.routeTab || 'new'; UI.routeTab = tab;
  const tabs = [{ id: 'new', name: '新しい路線' }, { id: 'list', name: `就航中（${G.routes.length}）` }, { id: 'air', name: '航空会社' }, { id: 'fee', name: '使用料' }];
  let h = '';
  if (tab === 'new') {
    const regions = ['dom', 'asia', 'long', 'space'];
    const selCity = sel || UI.routeCity;
    h += `<div class="sub" style="margin-bottom:6px">行き先を選んで、飛んでくれる航空会社を決めよう。ランクが上がるほど遠くの都市へ就航できます。</div>`;
    for (const rg of regions) {
      const cities = Object.entries(CITIES).filter(([, c]) => c.region === rg);
      h += `<div class="sec"><span class="tag ${rg}">${REGION_NAME[rg]}</span></div><div class="grid">`;
      for (const [id, c] of cities) {
        const lock = c.rank > G.rank && !G.free;
        const n = G.routes.filter(r => r.city === id).length;
        h += `<div class="card ${lock ? 'lock' : ''} ${selCity === id ? 'done' : ''}" data-city="${id}" style="cursor:pointer"><h5>${lock ? iconImg('lock', 's') : iconImg(G.stamps[id] ? 'check' : 'globe', 's')}${c.name}</h5><div class="meta">需要 ${'●'.repeat(c.demand)}${'○'.repeat(5 - c.demand)}${c.resort ? '・リゾート' : ''}${n ? `・${n}社就航中` : ''}</div>${lock ? `<div class="meta">ランク${c.rank}で解放</div>` : ''}</div>`;
      }
      h += '</div>';
    }
    if (selCity) h = routeCityPanel(selCity) + h;
  } else if (tab === 'list') {
    if (!G.routes.length) h = '<p>まだ路線がありません。「新しい路線」から開こう！</p>';
    h += '<div class="list">';
    for (const r of G.routes) {
      const al = AIRLINES[r.airline], c = CITIES[r.city], P = PLANES[r.type];
      const lf = r.seats ? Math.round((r.pax / r.seats) * 100) : Math.round(loadFactor(r) * 100);
      const otp = r.flights ? Math.round(r.ontime / r.flights * 100) : 100;
      h += `<div class="li"><div style="width:10px;height:44px;background:${al.tail};border:2px solid var(--ink);border-radius:3px"></div><div class="grow"><b>${c.name}</b> <span class="tag ${c.region}">${REGION_NAME[c.region]}</span><div class="sub">${al.name}・${P.name}・搭乗率${lf}%・定時率${otp}%・のべ${fmtNum(r.pax)}人</div></div>
        <div style="display:flex;align-items:center;gap:4px"><button class="pbtn sm" data-f="-1" data-r="${r.id}">－</button><b style="min-width:52px;text-align:center">1日${r.freq}便</b><button class="pbtn sm" data-f="1" data-r="${r.id}">＋</button>
        <button class="pbtn sm ${r.active ? '' : 'green'}" data-t="${r.id}">${r.active ? '運休' : '再開'}</button></div></div>`;
    }
    h += '</div><div class="sub" style="margin-top:6px">便数の上限は航空会社の好感度で増えます（最大6便）。変更は翌日のダイヤから反映されます。</div>';
  } else if (tab === 'air') {
    h += '<div class="list">';
    for (const [id, al] of Object.entries(AIRLINES)) {
      const av = airlineAvailable(id), a = G.airlines[id];
      h += `<div class="li ${av.ok ? '' : 'lock'}"><div style="width:44px;height:44px;border:3px solid var(--ink);border-radius:6px;background:linear-gradient(135deg,${al.body} 50%,${al.tail} 50%)"></div><div class="grow"><b>${al.name}</b> <span class="sub">${al.code}</span><div class="sub">${al.desc}</div><div class="sub">機材：${al.fleet.map(f => PLANES[f].name).join('、')}</div>${av.ok ? '' : `<div class="sub" style="color:var(--bad)">${av.why}</div>`}</div>
      <div style="width:110px"><div class="sub">好感度 ${Math.round(a.rel)}</div><div class="bar"><i style="width:${a.rel}%;background:var(--pink)"></i></div><div class="sub">最大${maxFreq(id)}便/日</div></div></div>`;
    }
    h += '</div>';
  } else if (tab === 'fee') {
    h += `<p>空港使用料（着陸料・乗客の使用料）を決めます。高くすると1人あたりの収入は増えますが、乗るお客さんが減ります。</p><div class="seg" id="feeSeg">${[[0.8, 'やすい'], [1, 'ふつう'], [1.2, 'たかい'], [1.4, 'すごく高い']].map(([v, n]) => `<button data-v="${v}" class="${G.feeLevel === v ? 'on' : ''}">${n}<br><span class="sub">×${v}</span></button>`).join('')}</div>`;
  }
  openModal('路線', h, { icon: 'globe', tabs, tab, onTab: t => openRoutes(t), id: 'routes', silent: !!UI.modalOpen });
  const body = $('#mBody');
  body.onclick = e => {
    const card = e.target.closest('[data-city]');
    if (card && !card.classList.contains('lock')) { UI.routeCity = card.dataset.city; Sound.se('click'); openRoutes('new', card.dataset.city); body.scrollTop = 0; return; }
    const f = e.target.closest('[data-f]');
    if (f) { const r = G.routes.find(x => x.id === f.dataset.r); r.freq = clamp(r.freq + +f.dataset.f, 1, maxFreq(r.airline)); Sound.se('click'); openRoutes('list'); return; }
    const tg = e.target.closest('[data-t]');
    if (tg && tab === 'list') { const r = G.routes.find(x => x.id === tg.dataset.t); r.active = !r.active; Sound.se('click'); openRoutes('list'); return; }
    const op = e.target.closest('[data-open]');
    if (op) { const [al, city] = op.dataset.open.split('|'); const fq = +($('#frq') ? $('#frq').value : 1); const r = openRoute(al, city, fq); if (r) { UI.routeCity = null; openRoutes('list'); } return; }
    const fee = e.target.closest('#feeSeg button');
    if (fee) { G.feeLevel = +fee.dataset.v; Sound.se('click'); openRoutes('fee'); }
  };
}
function routeCityPanel(cityId) {
  const c = CITIES[cityId];
  const als = Object.entries(AIRLINES).filter(([, a]) => a.cities.includes(cityId));
  let h = `<div class="card" style="background:#fff8d8;margin-bottom:8px"><h5>${iconImg('globe')}${c.name} <span class="tag ${c.region}">${REGION_NAME[c.region]}</span></h5><div class="list">`;
  for (const [id, al] of als) {
    const chk = routeCheck(id, cityId);
    const t = chk.type || bestPlaneFor(id, cityId);
    const P = t ? PLANES[t] : null;
    let est = '';
    if (P) {
      const tmp = { airline: id, city: cityId, type: t, freq: 1 };
      const lf = loadFactor(tmp), pax = Math.round((P.seats || 0) * lf);
      const per = P.fee * G.feeLevel + pax * 2 * REGION_PFC[c.region] * G.feeLevel + (P.cargo ? P.cargo * 16000 : pax * 1500);
      est = `<div class="sub">${P.name}（${P.cargo ? '貨物' + P.cargo + 't' : P.seats + '席'}）・1便あたり 約${fmtYenShort(per)}の収入見込み</div>`;
    }
    const done = G.routes.some(r => r.airline === id && r.city === cityId);
    h += `<div class="li ${chk.ok ? '' : 'lock'}"><div style="width:12px;height:40px;background:${al.tail};border:2px solid var(--ink);border-radius:3px"></div><div class="grow"><b>${al.name}</b>${est}${chk.ok ? '' : `<div class="sub" style="color:var(--bad)">${done ? '就航中' : chk.why}</div>`}</div>
      ${chk.ok ? `<div style="text-align:right"><div class="sub">就航費 ${fmtYen(chk.cost)}</div><label class="sub">1日 <select id="frq">${Array.from({ length: maxFreq(id) }, (_, i) => `<option value="${i + 1}" ${i === 0 ? 'selected' : ''}>${i + 1}</option>`).join('')}</select> 便</label><br><button class="pbtn sm green" data-open="${id}|${cityId}">${iconImg('plane', 's')}就航する</button></div>` : ''}</div>`;
  }
  if (!als.length) h += '<div class="sub">この都市へ飛ぶ航空会社がありません</div>';
  h += '</div></div>';
  return h;
}

// ---- 開発 ----
function openResearch() {
  let h = `<div class="kv" style="margin-bottom:8px"><span class="k">開発ポイント（飛行機が発着するとたまる）</span><span class="v">${iconImg('flask', 's')} ${devPoints()} pt</span></div><div class="grid">`;
  for (const r of RESEARCH) {
    const done = G.research[r.id], c = canResearch(r);
    const lock = r.rank > G.rank && !G.free;
    h += `<div class="card ${done ? 'done' : lock ? 'lock' : ''}"><h5>${iconImg(r.icon)}${r.name}</h5><div>${r.desc}</div>
      <div class="meta">${done ? '✔ 完了' : lock ? `ランク${r.rank}で解放` : `${r.dev}pt ・ ${fmtYen(r.cost)}`}</div>
      ${!done && !lock ? `<button class="pbtn sm ${c.ok ? 'blue' : ''}" data-r="${r.id}" ${c.ok ? '' : 'disabled'} style="margin-top:4px">開発する</button>` : ''}</div>`;
  }
  h += '</div>';
  openModal('開発', h, { icon: 'flask', id: 'research', silent: UI.modalOpen === 'research' });
  $('#mBody').onclick = e => { const b = e.target.closest('[data-r]'); if (!b) return; if (doResearch(b.dataset.r)) { const st = $('#mBody').scrollTop; openResearch(); $('#mBody').scrollTop = st; } };
}
// ---- 発着案内 ----
function openBoard() {
  const rows = RT.todayFlights.slice().sort((a, b) => a.depT - b.depT);
  const stName = fl => {
    if (fl.status === 'cancel') return ['欠航', 'st-bad'];
    if (fl.status === 'departed') return ['出発済み', ''];
    if (fl.boarding) return ['搭乗中', 'st-now'];
    if (fl.status === 'parked' || fl.status === 'landed') return ['到着', 'st-ok'];
    if (fl.status === 'hold') return ['上空待機', 'st-bad'];
    if (fl.status === 'approach') return ['まもなく到着', 'st-now'];
    return [G.min > fl.arrT + 10 ? '遅れ' : '予定', G.min > fl.arrT + 10 ? 'st-bad' : ''];
  };
  let h = `<div class="sub" style="margin-bottom:6px">今日のフライト ${rows.length}便 ・ 天気：${(WEATHER[G.weather] || {}).name}・ 予報：${G.forecast.slice(0, hasKind('radar') ? 2 : 1).map(w => WEATHER[w].name).join(' → ')}</div>`;
  h += `<table class="fb"><tr><th>到着</th><th>出発</th><th>便名</th><th>行き先</th><th>機材</th><th>搭乗口</th><th>状況</th></tr>`;
  for (const fl of rows) {
    const [s, cls] = stName(fl);
    const g = G.blds[fl.gate];
    h += `<tr><td>${fmtTime(fl.arrT)}</td><td>${fmtTime(fl.depT)}</td><td>${fl.code}</td><td>${CITIES[fl.city].name}</td><td>${PLANES[fl.type].name}</td><td>${g ? (B[g.id].bus ? 'バス' : g.num) : '-'}</td><td class="${cls}">${s}${fl.why && fl.status === 'cancel' ? `<br><span style="font-size:10px">${fl.why}</span>` : ''}</td></tr>`;
  }
  if (!rows.length) h += '<tr><td colspan="7">今日のフライトはありません（路線を開こう）</td></tr>';
  h += '</table>';
  openModal('発着案内', h, { icon: 'board', id: 'board', silent: UI.modalOpen === 'board' });
}
// ---- 統計 ----
function openStats(tab) {
  tab = tab || 'sum';
  const tabs = [{ id: 'sum', name: 'まとめ' }, { id: 'graph', name: 'グラフ' }, { id: 'hint', name: 'お客さんの声' }];
  let h = '';
  const t = G.stat.today, last = RT.lastDay;
  const INC = { landing: '着陸料', pfc: '旅客の使用料', food: '飲食', shop: 'ショップ', svc: 'サービス・娯楽', park: '駐車場・レンタカー', hotel: '宿泊', cargo: '貨物', fuel: '燃料', other: 'そのほか' };
  if (tab === 'sum') {
    const incT = Object.values(t.income).reduce((a, b) => a + b, 0);
    h += `<div class="grid"><div class="card"><h5>${iconImg('people', 's')}今日</h5><div class="kv"><span class="k">到着した人</span><span class="v">${fmtNum(t.paxArr)}</span><span class="k">出発した人</span><span class="v">${fmtNum(t.paxDep)}</span><span class="k">見学の人</span><span class="v">${fmtNum(t.visitors)}</span><span class="k">発着便</span><span class="v">${t.flights}</span><span class="k">定時運航</span><span class="v">${t.ontime}/${t.ontime + t.late}</span><span class="k">欠航・ダイバート</span><span class="v">${t.cancel + t.divert}</span><span class="k">乗りおくれ</span><span class="v">${Math.round(t.missed)}</span><span class="k">満足度</span><span class="v">${t.satW ? Math.round(t.sat / t.satW) : '-'}</span></div></div>
      <div class="card"><h5>${iconImg('money', 's')}今日の収入</h5><div class="kv">${Object.entries(t.income).filter(([, v]) => v > 0).map(([k, v]) => `<span class="k">${INC[k] || k}</span><span class="v">${fmtYen(v)}</span>`).join('') || '<span class="k">まだありません</span><span></span>'}<span class="k"><b>合計</b></span><span class="v"><b>${fmtYen(incT)}</b></span><span class="k">維持費（毎日0時）</span><span class="v" style="color:var(--bad)">-${fmtYen(dailyUpkeep())}</span></div></div>
      <div class="card"><h5>${iconImg('star', 's')}空港</h5><div class="kv"><span class="k">評価</span><span class="v">${G.rating.toFixed(1)}</span><span class="k">空港ポイント</span><span class="v">${fmtNum(G.points)}</span><span class="k">次のランクまで</span><span class="v">${G.rank < 10 ? fmtNum(RANKS[G.rank].pts - G.points) : '-'}</span><span class="k">累計の乗客</span><span class="v">${fmtNum(G.totalPax)}</span><span class="k">路線</span><span class="v">${G.routes.length}</span><span class="k">建物</span><span class="v">${Object.keys(G.blds).length}</span><span class="k">組み合わせ</span><span class="v">${Object.keys(G.combos).length}/${COMBOS.length}</span></div></div></div>`;
    if (last) h += `<div class="sec">${iconImg('clock', 's')}きのう</div><div class="kv"><span class="k">乗客</span><span class="v">${fmtNum(last.pax)}</span><span class="k">収入</span><span class="v">${fmtYen(last.inc)}</span><span class="k">支出</span><span class="v">${fmtYen(last.exp)}</span><span class="k">利益</span><span class="v" style="color:${last.inc - last.exp >= 0 ? 'var(--good)' : 'var(--bad)'}">${fmtYen(last.inc - last.exp)}</span></div>`;
    const top = Object.values(G.blds).filter(b => b.salesTotal).sort((a, b) => b.salesTotal - a.salesTotal).slice(0, 5);
    if (top.length) h += `<div class="sec">${iconImg('star', 's')}売上ランキング（これまで）</div><div class="kv">${top.map((b, i) => `<span class="k">${i + 1}. ${B[b.id].name}${b.lv > 1 ? ' Lv' + b.lv : ''}</span><span class="v">${fmtYen(b.salesTotal)}</span>`).join('')}</div>`;
  } else if (tab === 'graph') {
    h += `<div class="sec">乗客数</div><canvas class="chart" id="ch1" width="800" height="150"></canvas><div class="sec">収入と支出</div><canvas class="chart" id="ch2" width="800" height="150"></canvas><div class="sec">満足度</div><canvas class="chart" id="ch3" width="800" height="150"></canvas>`;
  } else {
    const un = Object.assign({}, last ? last.unmet : {});
    for (const [k, v] of Object.entries(t.unmet)) un[k] = (un[k] || 0) + v;
    const voices = [];
    const NM = { food: ['food', 'おなかがすいた…飲食店をふやして！'], shop: ['shopping', 'おみやげを買いたかったな'], toilet: ['toilet', 'トイレが見つからない！'], rest: ['zzz', 'すわって休めるところがほしい'], fun: ['note', 'ひまだなぁ…楽しい場所がほしい'] };
    for (const [k, v] of Object.entries(un).sort((a, b) => b[1] - a[1])) if (v > 2 && NM[k]) voices.push([NM[k][0], NM[k][1], Math.round(v)]);
    if (t.missed + (last ? last.missed : 0) > 3) voices.push(['anger', '乗りおくれちゃった！列が長すぎる／搭乗口が遠い', Math.round(t.missed + (last ? last.missed : 0))]);
    if (t.noIntl > 0) voices.push(['passport', '国際線なのに審査場がない！', Math.round(t.noIntl)]);
    if (!Object.values(G.blds).some(b => b.id === 'info') && G.routes.some(r => CITIES[r.city].region !== 'dom')) voices.push(['info', '案内所があると助かるのに', 0]);
    const waitBad = Object.values(G.blds).filter(b => People.fac.get(b.uid) && People.fac.get(b.uid).queue.length > 8);
    for (const b of waitBad.slice(0, 3)) voices.push(['anger', `${B[b.id].name}の列が長すぎる！（数を増やすかレベルアップを）`, People.fac.get(b.uid).queue.length]);
    for (const [uid, ws] of RT.warnings) { const b = G.blds[uid]; if (b) voices.push(['sweat', `${B[b.id].name}：${ws[0]}`, 0]); }
    if (!voices.length) voices.push(['heart', 'とっても快適な空港です！', 0]);
    h += '<div class="list">' + voices.slice(0, 14).map(([ic, tx, n]) => `<div class="li">${iconImg(ic)}<div class="grow">${tx}</div>${n ? `<span class="sub">${n}人</span>` : ''}</div>`).join('') + '</div>';
  }
  openModal('統計', h, { icon: 'chart', tabs, tab, onTab: t2 => openStats(t2), id: 'stats', silent: UI.modalOpen === 'stats' });
  if (tab === 'graph') {
    const hs = G.hist.slice(-30);
    drawChart($('#ch1'), [hs.map(x => x.pax)], ['#3a7bd5'], v => fmtNum(v));
    drawChart($('#ch2'), [hs.map(x => x.inc), hs.map(x => x.exp)], ['#3fae5a', '#e5484d'], v => fmtYenShort(v));
    drawChart($('#ch3'), [hs.map(x => x.sat)], ['#f0b830'], v => Math.round(v), 100);
  }
}
function drawChart(cv, series, cols, fmt, fixedMax) {
  if (!cv) return;
  const ctx = cv.getContext('2d'), w = cv.width, h = cv.height;
  ctx.clearRect(0, 0, w, h); ctx.fillStyle = '#fffdf6'; ctx.fillRect(0, 0, w, h);
  const n = Math.max(...series.map(s => s.length));
  if (n < 1) { ctx.fillStyle = '#888'; ctx.font = '16px sans-serif'; ctx.fillText('データがまだありません（1日たつと表示されます）', 20, h / 2); return; }
  const max = fixedMax || Math.max(1, ...series.flat()) * 1.1;
  ctx.strokeStyle = '#e8d6ae'; ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) { const y = 10 + (h - 30) * i / 4; ctx.beginPath(); ctx.moveTo(60, y); ctx.lineTo(w - 10, y); ctx.stroke(); ctx.fillStyle = '#888'; ctx.font = '12px sans-serif'; ctx.fillText(fmt(max * (1 - i / 4)), 4, y + 4); }
  series.forEach((s, k) => {
    ctx.strokeStyle = cols[k]; ctx.lineWidth = 4; ctx.beginPath();
    s.forEach((v, i) => { const x = 60 + (w - 75) * (n === 1 ? 0.5 : i / (n - 1)), y = 10 + (h - 30) * (1 - v / max); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
    ctx.stroke();
    ctx.fillStyle = cols[k];
    s.forEach((v, i) => { const x = 60 + (w - 75) * (n === 1 ? 0.5 : i / (n - 1)), y = 10 + (h - 30) * (1 - v / max); ctx.fillRect(x - 4, y - 4, 8, 8); });
  });
}
// ---- 図鑑 ----
function openZukan(tab) {
  tab = tab || 'plane';
  const tabs = [{ id: 'plane', name: '飛行機' }, { id: 'pax', name: 'お客さん' }, { id: 'combo', name: '組み合わせ' }, { id: 'stamp', name: '都市スタンプ' }, { id: 'ach', name: '実績' }];
  let h = '';
  if (tab === 'plane') {
    const seenT = new Set(Object.keys(G.seenPlanes).map(k => k.split(':')[0]));
    h += `<div class="sub">見た機材 ${seenT.size}/${Object.keys(PLANES).length}・見た塗装 ${Object.keys(G.seenPlanes).length}</div><div class="grid">`;
    for (const [id, P] of Object.entries(PLANES)) {
      const seen = seenT.has(id);
      const livs = Object.keys(G.seenPlanes).filter(k => k.startsWith(id + ':')).map(k => AIRLINES[k.split(':')[1]]);
      h += `<div class="card ${seen ? '' : 'lock'}"><h5>${iconImg('plane', 's')}${seen ? P.name : '？？？'}</h5><div class="meta">${seen ? `${P.cargo ? '貨物' + P.cargo + 't' : P.seats + '席'}・${['', '小型', '中型', '大型'][P.cls]}` : `ランク${P.rank}ごろ登場`}</div>${seen ? `<div>${P.desc}</div><div style="display:flex;gap:3px;margin-top:4px">${livs.map(a => `<span title="${a.name}" style="width:16px;height:16px;border:2px solid var(--ink);border-radius:3px;background:linear-gradient(135deg,${a.body} 50%,${a.tail} 50%)"></span>`).join('')}</div>` : ''}</div>`;
    }
    h += '</div>';
  } else if (tab === 'pax') {
    h += '<div class="grid">';
    for (const [id, P] of Object.entries(PAX)) {
      const seen = G.seenPax[id];
      const v = (SPR.variants[id] || [0])[0];
      h += `<div class="card ${seen ? '' : 'lock'}" style="display:flex;gap:8px"><img src="${spriteURL(v)}" style="width:40px;height:50px;image-rendering:pixelated;${seen ? '' : 'filter:brightness(0)'}"><div><h5>${seen ? P.name : '？？？'}</h5><div class="meta">${seen ? P.desc : 'まだ来ていない'}</div></div></div>`;
    }
    h += '</div>';
  } else if (tab === 'combo') {
    h += `<div class="sub">近く（4マス以内）に特定のお店を並べると「組み合わせ」が発見されます。発見 ${Object.keys(G.combos).length}/${COMBOS.length}</div><div class="grid">`;
    for (const c of COMBOS) {
      const got = G.combos[c.id];
      const ids = Array.isArray(c.need[0]) ? c.need[0] : c.need;
      const hint = got ? ids.map(i => B[i].name).join('＋') : ids.map((i, k) => k === 0 ? B[i].name : '？？？').join('＋');
      h += `<div class="card ${got ? 'done' : 'lock'}"><h5>${iconImg(got ? 'note' : 'lock', 's')}${got ? c.name : '？？？'}</h5><div class="meta">${hint}${Array.isArray(c.need[0]) ? `（${c.need[1]}種類）` : ''}</div>${got ? `<div>${c.desc}</div>` : ''}</div>`;
    }
    h += '</div>';
  } else if (tab === 'stamp') {
    h += `<div class="sub" style="margin-bottom:8px">就航した都市のスタンプ ${Object.keys(G.stamps).length}/${Object.keys(CITIES).length}</div><div class="stamps">`;
    for (const [id, c] of Object.entries(CITIES)) h += `<div class="stamp ${G.stamps[id] ? 'got' : ''}">${G.stamps[id] ? `${iconImg(c.region === 'space' ? 'rocket' : 'plane2', 's')}<b>${c.name}</b><span style="font-size:9px">${dateOf(G.stamps[id] - 1).year}年目</span>` : '？'}</div>`;
    h += '</div>';
  } else {
    h += `<div class="sub">実績 ${Object.keys(G.ach).length}/${ACHIEVEMENTS.length}</div><div class="grid">`;
    for (const a of ACHIEVEMENTS) { const got = G.ach[a.id]; h += `<div class="card ${got ? 'done' : 'lock'}"><h5>${iconImg(got ? a.icon : 'lock', 's')}${a.name}</h5><div class="meta">${a.desc}</div></div>`; }
    h += '</div>';
  }
  openModal('図鑑', h, { icon: 'book', tabs, tab, onTab: t => openZukan(t), id: 'zukan', silent: UI.modalOpen === 'zukan' });
}
// ---- 目標 ----
function openMissions() {
  Story.unseenDone = 0;
  const ch = Story.chapter();
  let h = '';
  if (ch) {
    h += `<div class="card" style="background:#fff8d8"><h5>${iconImg('mission')}第${G.story.ch + 1}章「${ch.title}」</h5><div class="meta">${ch.desc}</div><div style="margin-top:6px">`;
    for (const o of ch.obj) { const ok = Story.objDone(o); h += `<div style="display:flex;gap:6px;align-items:center">${iconImg(ok ? 'check' : 'star', 's')}<span style="${ok ? 'color:#888;text-decoration:line-through' : ''}">${o.t}</span>${o.p && !ok ? `<span class="sub">（${o.p()}）</span>` : ''}</div>`; }
    h += '</div></div>';
  } else h += `<div class="card done"><h5>${iconImg('heart')}すべての章をクリア！</h5><div class="meta">これからも自由に空港を大きくしよう。</div></div>`;
  h += `<div class="sec">${iconImg('star', 's')}ランク</div><div class="list">`;
  RANKS.forEach((r, i) => { h += `<div class="li ${i + 1 > G.rank ? 'lock' : 'sel'}"><span class="rankb">ランク${i + 1}</span><div class="grow">${r.name}</div><span class="sub">${fmtNum(r.pts)}pt</span></div>`; });
  h += '</div>';
  h += `<div class="sec">${iconImg('info', 's')}あそびかたのヒント</div><div class="sub" style="line-height:1.8">
  ・飛行機の流れ：<b>滑走路 →（誘導路）→ 駐機場</b>。駐機場の近く（7マス以内）のターミナルに<b>搭乗口</b>を置こう。<br>
  ・出発する人の流れ：<b>入口（バス停など）→ 歩道 → チェックイン → 保安検査 →（お店）→ 搭乗口</b>。<br>
  ・到着した人：<b>搭乗口 → 手荷物受取所 → 入口</b>。国際線は出国審査・入国審査も必要です。<br>
  ・お店は人の通り道の近くに。いろいろなお店を近くに並べると「組み合わせ」が見つかるかも。<br>
  ・カメラ：ドラッグで移動、ホイール／ピンチでズーム、Q/E で回転。建物は R で回転、右クリックでキャンセル。</div>`;
  openModal('目標', h, { icon: 'mission', id: 'missions' });
}
// ---- メニュー ----
function openMenu() {
  const o = Game.opts;
  const h = `<div class="sec">${iconImg('sound', 's')}音</div>
    <div class="kv"><span class="k">BGM</span><input type="range" min="0" max="100" value="${Math.round(Sound.vol.bgm * 100)}" id="vBgm" class="slider"><span class="k">効果音</span><input type="range" min="0" max="100" value="${Math.round(Sound.vol.se * 100)}" id="vSe" class="slider"></div>
    <div class="sec">${iconImg('camera', 's')}画面</div>
    <div class="sub">ドットの大きさ</div><div class="seg" id="sQ">${[['low', '大きい（軽い）'], ['mid', 'ふつう'], ['high', '小さい（きれい）']].map(([v, n]) => `<button data-v="${v}" class="${R.opts.quality === v ? 'on' : ''}">${n}</button>`).join('')}</div>
    <div class="sub" style="margin-top:6px">ジオラマぼかし</div><div class="seg" id="sT">${[[0, 'なし'], [0.5, '弱'], [0.8, 'ふつう'], [1.2, '強']].map(([v, n]) => `<button data-v="${v}" class="${R.opts.tilt === v ? 'on' : ''}">${n}</button>`).join('')}</div>
    <div class="sub" style="margin-top:6px">ふちどり線</div><div class="seg" id="sO"><button data-v="1" class="${R.opts.outline ? 'on' : ''}">あり</button><button data-v="0" class="${R.opts.outline ? '' : 'on'}">なし</button></div>
    <div class="sub" style="margin-top:6px">夜（飛行機のない時間）を早送り</div><div class="seg" id="sN"><button data-v="1" class="${o.nightSkip ? 'on' : ''}">する</button><button data-v="0" class="${o.nightSkip ? '' : 'on'}">しない</button></div>
    <div class="sec">${iconImg('save', 's')}セーブ</div>
    <div class="sub">自動で毎日セーブされます（スロット${Game.slot + 1}）。</div>
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px"><button class="pbtn sm blue" id="mSave">${iconImg('save', 's')}いまセーブ</button><button class="pbtn sm" id="mExport">引きつぎコードを作る</button><button class="pbtn sm" id="mImport">引きつぎコードを入力</button>${Cloud.available() ? '<button class="pbtn sm" id="mCloud">クラウドに保存</button>' : ''}</div>
    <div class="sec">${iconImg('flag', 's')}空港の名前</div><input type="text" id="mName" maxlength="16" value="${esc(G.name)}">
    <div style="display:flex;gap:6px;margin-top:12px"><button class="pbtn" id="mTitleBtn">タイトルへ</button></div>`;
  openModal('メニュー', h, { icon: 'gear', narrow: true, id: 'menu', pause: true });
  $('#vBgm').oninput = e => { Sound.setVol('bgm', e.target.value / 100); saveOpts(); };
  $('#vSe').oninput = e => { Sound.setVol('se', e.target.value / 100); saveOpts(); };
  const seg = (id, f) => $(id).onclick = e => { const b = e.target.closest('button'); if (!b) return; f(b.dataset.v); saveOpts(); Sound.se('click'); openMenu(); };
  seg('#sQ', v => setQuality(v)); seg('#sT', v => R.opts.tilt = +v); seg('#sO', v => R.opts.outline = +v); seg('#sN', v => Game.opts.nightSkip = v === '1');
  $('#mSave').onclick = () => { saveGame(); toast('セーブしました', 'good', 'save'); };
  $('#mExport').onclick = () => { const code = exportCode(); openModal('引きつぎコード', `<p class="sub">このコードをコピーして、別の端末で「引きつぎコードを入力」に貼りつけてください。</p><textarea style="width:100%;height:180px;font-size:11px;user-select:text;-webkit-user-select:text" readonly onclick="this.select()">${code}</textarea>`, { narrow: true }); };
  $('#mImport').onclick = () => {
    openModal('引きつぎコードを入力', `<textarea id="impT" style="width:100%;height:160px;font-size:11px;user-select:text;-webkit-user-select:text"></textarea><button class="pbtn blue" id="impGo" style="margin-top:6px">読みこむ</button>`, { narrow: true });
    $('#impGo').onclick = () => { if (importCode($('#impT').value.trim())) { closeModal(); toast('読みこみました！', 'good'); } else toast('コードが正しくありません', 'bad'); };
  };
  const cl = $('#mCloud'); if (cl) cl.onclick = () => Cloud.save();
  $('#mName').onchange = e => { G.name = e.target.value.trim().slice(0, 16) || G.name; updateHUD(true); };
  $('#mTitleBtn').onclick = () => { saveGame(); closeModal(); location.reload(); };
}

// ---------- 写真モード ----------
function togglePhoto() {
  UI.photo = !UI.photo;
  ['#topbar', '#toolbar', '#mission', '#toasts', '#buildPanel', '#buildBar', '#info', '#labels', '#popups'].forEach(s => $(s).style.visibility = UI.photo ? 'hidden' : '');
  $('#side').querySelectorAll('button').forEach(b => { if (b.id !== 'bPhoto') b.style.visibility = UI.photo ? 'hidden' : ''; });
  if (UI.photo) { Sound.se('shutter'); toast('写真モード：もう一度カメラボタンでもどる'); $('#toasts').style.visibility = ''; setTimeout(() => { if (UI.photo) $('#toasts').style.visibility = 'hidden'; }, 2500); }
}
