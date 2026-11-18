// ============================================================
//  追加その2：建物モデル・イベント8・つぶやき10・開発の効果
// ============================================================

// ---------- お店のモデル ----------
const MORE2_SHOPC = {
  yakitori: ['#5a3a24', '#e5484d', ['#a0683c', '#ffd84a']], tempura: ['#e8d8b8', '#2f4f9a', ['#d8a050', '#ffffff']],
  kaisendon: ['#e8f0f8', '#2f4f9a', ['#e5484d', '#ffffff']], hotdog: ['#fff4e0', '#e5484d', ['#ffd84a', '#e5484d']],
  taiyaki: ['#f4e0b0', '#a0683c', ['#d8a050', '#ffffff']], tapioca: ['#fff0f4', '#9a62d0', ['#3a2a22', '#ffffff']],
  gyoza: ['#fff8f0', '#c02838', ['#e8d8b8', '#ffd84a']], pancake: ['#fff8e8', '#f59ac0', ['#ffffff', '#f59ac0']],
  kebab: ['#f4e8d0', '#3e8a3c', ['#a0683c', '#e5484d']], soupcurry: ['#f4e0b0', '#f39a3c', ['#f39a3c', '#4cb85c']],
  kimono: ['#f4ecdc', '#9a2f4a', ['#e5484d', '#f59ac0', '#4a8fe0']], gamestore: ['#20203a', '#40e0ff', ['#e5484d', '#4a8fe0', '#ffd84a']],
  anime: ['#fff8ff', '#ff80c0', ['#ff80c0', '#40e0ff', '#ffd84a']], outdoor: ['#e8e0cc', '#3e6a4a', ['#4cb85c', '#f39a3c', '#a0683c']],
  perfumeshop: ['#f8f0ff', '#9a62d0', ['#c9a0ff', '#ffffff', '#f59ac0']], simcounter: ['#ffffff', '#3a7bd5', ['#2a2a36', '#4a8fe0']],
  chocolate: ['#5a3a24', '#d8a020', ['#7a4c2c', '#f59ac0']], fishmarket: ['#e8f4f8', '#2f6a9a', ['#e5484d', '#8fdcf4', '#ffffff']],
  craft: ['#e8d8b8', '#7a4c2c', ['#e5484d', '#2f4f9a', '#d8a020']], sneaker: ['#ffffff', '#2a2a36', ['#e5484d', '#ffffff', '#4a8fe0']],
};
for (const [id, [wall, awn, cols]] of Object.entries(MORE2_SHOPC)) {
  const def = B[id];
  shopModel(id, {
    wall, awn, stripe: !['gamestore', 'chocolate', 'yakitori', 'simcounter'].includes(id), sign: awn, icon: def.icon,
    signGlow: id === 'gamestore' || id === 'anime' ? awn : undefined, floor: id === 'gamestore' ? '#2a2a40' : '#efe6d6',
    props: (mb, w, d) => {
      if (def.cat === 'food') {
        if (d >= 2) tables(mb, w, d, w >= 3 ? 4 : 2, '#ffffff', cols[0], -0.15);
        else { mb.box(0, 0, 0.05, w - 0.3, 0.6, 0.35, cols[0]); mb.box(0, 0.6, 0.05, w - 0.35, 0.05, 0.38, '#d8d8d8'); }
        if (id === 'yakitori' || id === 'kebab' || id === 'taiyaki') mb.box(0, 0.62, -d / 2 + 0.3, Math.min(0.6, w - 0.4), 0.05, 0.2, '#ff8040', { glow: '#ff6020' });
        if (id === 'tapioca') mb.box(0, 0.6, -0.05, w * 0.5, 0.25, 0.2, '#f8f0ff', { glow: '#ffffff' });
      } else if (id === 'perfumeshop' || id === 'simcounter') {
        mb.box(0, 0, -0.1, w - 0.4, 0.6, 0.4, cols[1]); mb.box(0, 0.6, -0.1, w - 0.45, 0.18, 0.38, '#f0f8ff', { glow: '#ffffff' });
        for (let i = 0; i < 3; i++) mb.box(-0.4 + i * 0.4, 0.62, -0.1, 0.08, 0.12, 0.08, cols[i % cols.length]);
      } else shelves(mb, w, d, cols);
    }
  });
}
// ---------- サービスのモデル ----------
MODELS.charging = (mb) => { mb.box(0, 0, 0, 0.5, 1.0, 0.3, '#3a7bd5'); mb.box(0, 0.65, 0.16, 0.36, 0.25, 0.02, '#203040', { glow: '#40e0ff' }); for (let i = 0; i < 3; i++) mb.box(-0.12 + i * 0.12, 0.3, 0.16, 0.06, 0.08, 0.02, '#ffd84a'); mb.icon('wifi', 0, 1.2, 0, 0.3, 0); };
MODELS.barber = (mb, w, d) => { booth(mb, w, d, { wall: '#ffffff', floor: '#e8e8f0', awn: '#2f4f9a', sign: '#2f4f9a', icon: 'sofa', noCounter: true, stripe: true }); for (let i = 0; i < 2; i++) { mb.box(-0.4 + i * 0.8, 0, -0.2, 0.4, 0.45, 0.45, '#e5484d'); mb.box(-0.4 + i * 0.8, 0.3, -d / 2 + 0.18, 0.5, 0.6, 0.03, '#d8f0ff', { glow: '#ffffff' }); } mb.cyl(w / 2 - 0.2, 0, d / 2 - 0.2, 0.08, 0.08, 1.0, '#e5484d', 8); mb.cyl(w / 2 - 0.2, 0.35, d / 2 - 0.2, 0.085, 0.085, 0.3, '#2f4f9a', 8); };
MODELS.nailsalon = (mb, w, d) => { booth(mb, w, d, { wall: '#fff0f4', floor: '#f8e8f0', awn: '#ff7090', sign: '#ff7090', icon: 'cosme', noCounter: true }); mb.box(0, 0, 0, w - 0.5, 0.45, 0.35, '#ffffff'); mb.box(-0.3, 0.45, 0, 0.1, 0.06, 0.1, '#e5484d'); mb.box(0.2, 0.45, 0, 0.1, 0.06, 0.1, '#c9a0ff'); };
MODELS.clinic = (mb, w, d) => { booth(mb, w, d, { wall: '#f4fbff', floor: '#e8f4f0', awn: '#3fae5a', sign: '#ffffff', signIn: '#3fae5a', icon: 'firstaid', noCounter: true }); mb.box(-0.4, 0, -0.2, 0.6, 0.4, 0.9, '#ffffff'); mb.box(-0.4, 0.4, -0.55, 0.6, 0.1, 0.2, '#8fdcf4'); mb.box(0.5, 0, 0.2, 0.4, 0.6, 0.3, '#d8e8f0'); };
MODELS.karaoke = (mb, w, d) => { booth(mb, w, d, { wall: '#2a2040', floor: '#3a3060', awn: '#ff80c0', sign: '#2a2040', signIn: '#ff80c0', signGlow: '#ff80c0', icon: 'note', noCounter: true }); for (let i = 0; i < 2; i++) { mb.box(-0.7 + i * 1.4, 0, -0.1, 1.0, 0.35, 0.5, '#9a62d0'); mb.box(-0.7 + i * 1.4, 0.4, -d / 2 + 0.18, 0.6, 0.35, 0.03, '#203040', { glow: '#ff80c0' }); } };
MODELS.flightsim = (mb, w, d) => { booth(mb, w, d, { wall: '#20283a', floor: '#2a3040', awn: '#40e0ff', sign: '#20283a', signIn: '#80f0ff', signGlow: '#40e0ff', icon: 'plane2', noCounter: true }); mb.box(0, 0.1, -0.15, 1.1, 0.7, 0.9, '#f4f2ee'); mb.box(0, 0.5, 0.31, 0.9, 0.25, 0.02, '#203040', { glow: '#80c8ff' }); mb.box(0, 0, -0.15, 0.4, 0.12, 0.4, '#4a4a58'); };
MODELS.spa = (mb, w, d) => { booth(mb, w, d, { wall: '#7a4c2c', wall2: '#a0683c', floor: '#c8b090', awn: '#2e5a8a', sign: '#2e5a8a', icon: 'onsen', noCounter: true }); mb.box(0, 0.02, 0, w - 0.9, 0.22, d - 1.0, '#9a9aa6'); mb.box(0, 0.22, 0, w - 1.0, 0.04, d - 1.1, '#5cc8e0', { glow: '#80e0ff' }); for (const x of [-w / 2 + 0.4, w / 2 - 0.4]) mb.box(x, 0, d / 2 - 0.4, 0.3, 0.5, 0.3, '#d8c8a0'); };
MODELS.nursery = (mb, w, d) => { mb.box(0, 0, 0, w - 0.04, 0.05, d - 0.04, '#ffe8c0'); for (const x of [-w / 2 + 0.06, w / 2 - 0.06]) mb.box(x, 0, 0, 0.08, 0.45, d - 0.04, '#4cb85c'); mb.box(0, 0, -d / 2 + 0.06, w - 0.04, 0.45, 0.08, '#ffd84a'); mb.box(-0.4, 0.05, -0.3, 0.5, 0.25, 0.4, '#8fdcf4'); mb.box(0.4, 0.05, -0.2, 0.35, 0.35, 0.35, '#ff7090'); mb.cyl(0, 0.05, 0.3, 0.15, 0.15, 0.15, '#e5484d', 8); mb.icon('balloon', 0, 0.75, -d / 2 + 0.11, 0.32, 0); };
// ---------- 空側・陸側・かざり ----------
MODELS.apronlight = (mb) => { mb.cyl(0, 0, 0, 0.06, 0.09, 3.2, '#9a9aa6', 5); mb.box(0, 3.2, 0, 0.7, 0.08, 0.3, '#5a5a66'); for (let i = 0; i < 3; i++) mb.box(-0.22 + i * 0.22, 3.12, 0.05, 0.18, 0.08, 0.18, '#fff8e0', { glow: '#ffe8a0' }); };
MODELS.blastfence = (mb, w) => { for (let i = 0; i < 6; i++) mb.box(-w / 2 + 0.25 + i * (w - 0.5) / 5, 0, 0, 0.06, 1.0, 0.06, '#7a7a86'); for (let k = 0; k < 4; k++) mb.box(0, 0.2 + k * 0.22, -0.06 - k * 0.04, w - 0.1, 0.14, 0.04, k % 2 ? '#c8c8d0' : '#e8e8f0'); mb.box(0, 0.95, -0.25, w - 0.1, 0.06, 0.05, '#e5484d'); };
MODELS.mro = (mb, w, d) => {
  mb.box(0, 0, 0, w - 0.1, 0.04, d - 0.1, '#7a7a86');
  for (let k = 0; k < 5; k++) { const ww = (w - 0.2) * Math.cos(k / 5 * Math.PI / 2.2); mb.box(0, 1.6 + k * 0.3, -0.3, ww, 0.3, d - 0.7, k % 2 ? '#c8ccd8' : '#d8dce4'); }
  mb.box(0, 0, -0.3, w - 0.2, 1.6, d - 0.7, '#e0e4ec'); mb.box(0, 0.05, d / 2 - 0.66, w - 0.8, 1.45, 0.04, '#5a6a7a');
  for (let i = 0; i < 6; i++) mb.box(-w / 2 + 0.6 + i * (w - 1.2) / 5, 0.05, d / 2 - 0.64, 0.04, 1.45, 0.02, '#8a9aaa');
  mb.box(0, 1.75, d / 2 - 0.62, 2.2, 0.35, 0.05, '#2f4f9a'); mb.icon('hangar', 0, 1.78, d / 2 - 0.58, 0.3, 0);
};
MODELS.wxstation = (mb, w) => { mb.box(-0.4, 0, 0, 0.7, 0.6, 0.6, '#f4f2ee'); mb.box(-0.4, 0.6, 0, 0.75, 0.05, 0.65, '#3a7bd5'); mb.box(0.5, 0, 0, 0.06, 1.6, 0.06, '#9a9aa6'); for (let i = 0; i < 3; i++) mb.cyl(0.5 + Math.cos(i * 2.1) * 0.18, 1.6, Math.sin(i * 2.1) * 0.18, 0.05, 0.05, 0.06, '#f4f2ee', 6); mb.box(0.5, 1.1, 0.05, 0.3, 0.2, 0.05, '#ffffff'); mb.icon('thermo', -0.4, 1.0, 0, 0.3, 0); };
MODELS.bizhotel = (mb, w, d) => { mb.box(0, 0, -0.1, w - 0.3, 2.6, d - 0.5, '#d8d0c4'); mb.box(0, 2.6, -0.1, w - 0.2, 0.1, d - 0.4, '#5a5a66'); for (let f = 0; f < 4; f++) for (let i = 0; i < 4; i++) mb.box(-w / 2 + 0.55 + i * (w - 1.1) / 3, 0.5 + f * 0.5, d / 2 - 0.34, 0.25, 0.25, 0.02, '#8fc8e8', { glow: '#ffe8a0' }); mb.box(0, 0, d / 2 - 0.2, 1.0, 0.5, 0.3, '#3a4a5a'); mb.icon('bed', 0, 2.3, d / 2 - 0.33, 0.3, 0); };
MODELS.resorthotel = (mb, w, d) => {
  mb.box(0, 0, 0, w - 0.06, 0.04, d - 0.06, '#e8dcc0');
  mb.box(-0.6, 0, -0.6, w - 1.6, 2.2, 1.6, '#f8f4ec'); mb.box(-0.6, 2.2, -0.6, w - 1.5, 0.12, 1.7, '#d87a4a');
  for (let f = 0; f < 3; f++) for (let i = 0; i < 5; i++) mb.box(-0.6 - (w - 2.2) / 2 + i * (w - 2.2) / 4, 0.4 + f * 0.6, 0.22, 0.3, 0.3, 0.02, '#8fc8e8', { glow: '#ffe8a0' });
  mb.box(0.3, 0.02, 1.0, 2.4, 0.12, 1.2, '#f4f2ee'); mb.box(0.3, 0.1, 1.0, 2.2, 0.04, 1.0, '#3fc9e0', { glow: '#80e0ff' });
  for (const [x, z] of [[w / 2 - 0.4, -1.2], [w / 2 - 0.4, 0.2], [-w / 2 + 0.4, 1.4]]) treeShape(mb, x, z, 'palm', 1, 0.9);
  mb.icon('palm', -0.6, 1.9, 0.24, 0.34, 0);
};
MODELS.cyclestand = (mb, w) => { mb.box(0, 0, 0, w - 0.1, 0.04, 0.7, '#c8c8d0'); mb.box(0, 0.8, -0.2, w - 0.2, 0.05, 0.5, '#4cb85c'); for (const x of [-w / 2 + 0.2, w / 2 - 0.2]) mb.box(x, 0, -0.2, 0.05, 0.8, 0.05, '#9a9aa6'); for (let i = 0; i < 4; i++) { const x = -0.6 + i * 0.4; mb.box(x, 0.02, -0.15, 0.03, 0.2, 0.2, '#2a2a36'); mb.box(x, 0.2, 0, 0.03, 0.12, 0.35, ['#e5484d', '#4a8fe0', '#ffd84a', '#ffffff'][i]); } };
MODELS.ropeway = (mb, w, d) => {
  mb.box(0, 0, 0.2, w - 0.3, 1.2, d - 0.8, '#e8e4dc'); mb.box(0, 1.2, 0.2, w - 0.2, 0.1, d - 0.7, '#c03040');
  mb.box(0, 0, -d / 2 + 0.3, 0.3, 2.6, 0.3, '#9a9aa6'); mb.box(0, 2.6, -d / 2 + 0.3, 1.6, 0.12, 0.2, '#5a5a66');
  mb.box(-0.6, 1.9, -d / 2 + 0.35, 0.55, 0.45, 0.5, '#c03040'); mb.box(-0.6, 2.0, -d / 2 + 0.1, 0.45, 0.2, 0.02, '#8fc8e8', { glow: '#ffe8a0' }); mb.box(-0.6, 2.35, -d / 2 + 0.35, 0.04, 0.3, 0.04, '#5a5a66');
  mb.icon('ferris', 0, 1.0, d / 2 - 0.39, 0.34, 0);
};
MODELS.tulip = (mb, w) => { mb.box(0, 0, 0, w - 0.1, 0.06, 0.8, '#5a3a24'); for (let i = 0; i < 12; i++) { const x = -w / 2 + 0.2 + (i % 6) * (w - 0.4) / 5, z = -0.2 + Math.floor(i / 6) * 0.4; mb.box(x, 0.06, z, 0.03, 0.22, 0.03, '#3e8a3c'); mb.box(x, 0.26, z, 0.1, 0.1, 0.1, ['#e5484d', '#ffd84a', '#f59ac0', '#ffffff'][i % 4]); } };
MODELS.cosmos = (mb, w, d) => { mb.box(0, 0, 0, w - 0.1, 0.05, d - 0.1, '#4a7a3a'); for (let i = 0; i < 20; i++) { const x = -w / 2 + 0.25 + (i % 5) * (w - 0.5) / 4, z = -d / 2 + 0.25 + Math.floor(i / 5) * (d - 0.5) / 3; mb.box(x, 0.05, z, 0.02, 0.3, 0.02, '#4cb85c'); mb.box(x, 0.33, z, 0.12, 0.04, 0.12, ['#ff80c0', '#ffffff', '#c9306a', '#ffb0d0'][i % 4]); } };
MODELS.torii = (mb) => { for (const x of [-0.35, 0.35]) mb.cyl(x, 0, 0, 0.06, 0.07, 1.3, '#d83a2a', 6); mb.box(0, 1.3, 0, 1.05, 0.1, 0.14, '#2a2a2a'); mb.box(0, 1.2, 0, 0.95, 0.08, 0.12, '#d83a2a'); mb.box(0, 1.0, 0, 0.82, 0.06, 0.08, '#d83a2a'); mb.box(0, 1.05, 0.05, 0.14, 0.14, 0.02, '#2a2a2a'); };
MODELS.windmill = (mb) => { mb.cyl(0, 0, 0, 0.45, 0.6, 1.8, '#f4ecdc', 8); mb.cyl(0, 1.8, 0, 0.5, 0.05, 0.5, '#a0683c', 8); mb.box(0, 1.6, 0.58, 0.12, 0.12, 0.12, '#5a3a24'); for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + 0.4; mb.box(Math.sin(a) * 0.55, 1.6 + Math.cos(a) * 0.55, 0.65, 0.12 + Math.abs(Math.sin(a)) * 0.9, 0.12 + Math.abs(Math.cos(a)) * 0.9, 0.02, '#f8f4ec'); } mb.box(0, 0, 0.6, 0.3, 0.5, 0.04, '#7a4c2c'); };

// ---------- イベント 8 ----------
EVENTS.push(
  { id: 'tsukimi', name: 'お月見', when: d => d.month === 9 && d.part === 2, desc: '夜の空港でお月見。見学客が増える', visitors: 1.3 },
  { id: 'koyo', name: '紅葉シーズン', when: d => d.month === 11 && d.part === 0, desc: 'もみじが色づく。観光のお客さんが増える', visitors: 1.4, demand: 1.05 },
  { id: 'graduation', name: '卒業旅行シーズン', when: d => d.month === 3 && d.part === 1, desc: '学生さんの旅行が増える', demand: 1.1, apply: () => { G.flags.schoolTrip = true; } },
  { id: 'summervac', name: '夏休み', when: d => d.month === 7 && d.part === 2, desc: '家族旅行のお客さんがいっぱい', demand: 1.15, visitors: 1.3 },
);
RANDOM_EVENTS.push(
  { id: 'golfopen', name: 'ゴルフの大会', p: 0.03, minRank: 3, desc: 'ゴルファーのお客さんがやってくる', apply: () => { G.flags.golf = true; } },
  { id: 'cosplayfes', name: 'コスプレイベント', p: 0.03, minRank: 3, desc: 'コスプレイヤーと見学客が集まる！', visitors: 1.6, apply: () => { G.flags.cosplay = true; } },
  { id: 'foodfair', name: '空弁フェア', p: 0.04, minRank: 2, desc: '今日は飲食店の売上 +20%', apply: () => { G.flags.foodfair = true; } },
  { id: 'vipjet', name: 'プライベートジェットの来訪', p: 0.03, minRank: 4, desc: '着陸料とお礼のお金が入った', apply: () => { const v = 400000 * G.rank; earn(v, 'landing'); toast(`プライベートジェットから ${fmtYen(v)}！`, 'gold', 'plane2'); } },
);

// ---------- つぶやき 10 ----------
VOICES.push(
  { t: 'ゴルフ日和だ！', c: p => p.type === 'golfer' },
  { t: 'ゲレンデが待ってる〜', c: p => p.type === 'skier' },
  { t: 'この衣装、自信作なんです！', c: p => p.type === 'cosplay' },
  { t: '空港グルメ、全部食べたい…！', c: p => p.type === 'foodie' || (p.needs && p.needs[0] === 'food' && Object.values(G.blds).filter(b => B[b.id].cat === 'food').length >= 8) },
  { t: '充電できるところないかな', c: p => p.type === 'gamer' || p.type === 'biz' },
  { t: '急いでいます、通してください！', c: p => p.type === 'medic' },
  { t: '同行二人（どうぎょうににん）…', c: p => p.type === 'ohenro' },
  { t: '今夜のライブ、楽しみ！', c: p => p.type === 'musician' || p.type === 'idol' },
  { t: 'プッシュバックって、かっこいいね', c: p => RT.planes.some(pl => pl.state === 'pushback' && Math.hypot(pl.x - p.x, pl.z - p.z) < 12) },
  { t: 'ジャンボだ！ 2階建てだよ！', c: p => RT.planes.some(pl => (pl.fl.type === 'b744' || pl.fl.type === 'whale') && pl.y < 1 && Math.hypot(pl.x - p.x, pl.z - p.z) < 14) },
);

// ---------- 開発・イベントの効果 ----------
{
  const _svc = facSvc;
  facSvc = function (b, p) {
    const def = B[b.id]; let t = _svc(b, p);
    if (def.kind === 'checkin' && G.research.mobileck) t *= 0.8;
    if (def.kind === 'security' && G.research.queuemgmt) t *= 0.85;
    if (def.kind === 'baggage' && G.research.quickbag) t *= 0.8;
    return t;
  };
  const E = Extra;
  const _price = E.priceMul, _gap = E.gapMul, _up = E.upkeepMul, _rate = E.ratingAdd, _vis = E.visitorMul, _daily = E.daily, _mood = E.moodStart, _xp = E.extraPax;
  E.priceMul = (b, p) => {
    const def = B[b.id]; let k = _price(b, p);
    if (G.research.localfest && def.cat === 'food') k *= 1.08;
    if (G.research.premium && def.cat === 'shop') k *= 1.08;
    if (G.research.loyalty) k *= 1.05;
    if (G.flags.foodfair && def.cat === 'food') k *= 1.2;
    if (p && p.type === 'foodie' && def.cat === 'food') k *= 1.3;
    return k;
  };
  E.gapMul = () => _gap() * (G.research.slotplus ? 0.92 : 1);
  E.upkeepMul = () => _up() * (G.research.greenroof ? 0.95 : 1);
  E.ratingAdd = () => _rate() + (G.research.greenroof ? 0.05 : 0) + (G.research.noisecut ? 0.1 : 0);
  E.visitorMul = () => _vis() * (G.research.tourbus ? 1.2 : 1);
  E.moodStart = p => _mood(p) + (G.research.loyalty ? 2 : 0);
  E.daily = () => {
    _daily();
    if (G.research.salesrep) for (const a of Object.values(G.airlines)) a.rel = Math.min(100, a.rel + 0.4);
    G.flags.golf = G.flags.cosplay = G.flags.foodfair = false;
  };
  E.extraPax = fl => {
    if (G.flags.golf && Math.random() < 0.15) return 'golfer';
    if (G.flags.cosplay && Math.random() < 0.12) return 'cosplay';
    const d = dateOf(G.day);
    if (d.season === 3 && CITIES[fl.city] && ['sapporo', 'asahikawa', 'obihiro', 'memanbetsu', 'kushiro'].includes(fl.city) && Math.random() < 0.2) return 'skier';
    return _xp(fl);
  };
}
// 回数の記録
Bus.on('moved', () => { G.flags.moves = (G.flags.moves || 0) + 1; });
Bus.on('departed', () => { G.flags.pushbacks = (G.flags.pushbacks || 0) + 1; });
