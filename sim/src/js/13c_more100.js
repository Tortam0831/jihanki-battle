// ============================================================
//  追加その3：建物モデル・イベント4・つぶやき2・開発の効果
// ============================================================
const MORE3_SHOPC = {
  kushikatsu: ['#5a3a24', '#e5484d', ['#d8a050', '#ffd84a']], monja: ['#e8d8b8', '#2f4f9a', ['#a0683c', '#4cb85c']],
  tantan: ['#fff0e8', '#c02838', ['#e5484d', '#ffd84a']], bagel: ['#f4e8d0', '#7a4c2c', ['#d8a050', '#ffffff']],
  dimsum: ['#fff8f0', '#c02838', ['#ffffff', '#4cb85c']], gelato: ['#f0fff4', '#3fc9b8', ['#f59ac0', '#ffd84a']],
  steakbento: ['#ffffff', '#7a2030', ['#a0683c', '#ffffff']], skybar: ['#1a1a2a', '#c9a0ff', ['#2a2a40', '#c9a0ff']],
  pottery: ['#e8d8c0', '#7a4c2c', ['#a0683c', '#3a5080', '#e8e0d0']], kendama: ['#fff8e0', '#e5484d', ['#e5484d', '#4a8fe0', '#ffd84a']],
  fishingshop: ['#e8f4f8', '#2f6a9a', ['#4cb85c', '#f39a3c', '#2a2a36']], tea2: ['#f8f0e0', '#2e5a3a', ['#a0683c', '#ffffff']],
  bookstore2: ['#f4f2ee', '#3a5080', ['#e5484d', '#ffd84a', '#4cb85c']], plushie: ['#fff0f8', '#ff80c0', ['#a0683c', '#ffd84a', '#f59ac0']],
  umbrella: ['#f0f8ff', '#4a8fe0', ['#e5484d', '#4a8fe0', '#ffd84a']], luxwatch2: ['#1a1a22', '#d8a020', ['#2a2a36', '#d8a020']],
};
for (const [id, [wall, awn, cols]] of Object.entries(MORE3_SHOPC)) {
  const def = B[id];
  shopModel(id, {
    wall, awn, stripe: !['skybar', 'luxwatch2', 'tea2'].includes(id), sign: awn, icon: def.icon,
    signGlow: id === 'skybar' ? '#c9a0ff' : undefined, floor: id === 'skybar' ? '#2a2a40' : '#efe6d6',
    props: (mb, w, d) => {
      if (def.cat === 'food') {
        if (d >= 2) tables(mb, w, d, w >= 3 ? 4 : 2, id === 'skybar' ? '#3a3a50' : '#ffffff', cols[0], -0.15);
        else { mb.box(0, 0, 0.05, w - 0.3, 0.6, 0.35, cols[0]); mb.box(0, 0.6, 0.05, w - 0.35, 0.05, 0.38, '#d8d8d8'); }
        if (id === 'skybar') for (let i = 0; i < 3; i++) mb.box(-0.8 + i * 0.8, 0.9, -d / 2 + 0.2, 0.06, 0.2, 0.06, '#ffe8a0', { glow: '#ffd060' });
        if (id === 'kushikatsu') mb.box(0, 0.62, -d / 2 + 0.3, 0.6, 0.05, 0.2, '#ff8040', { glow: '#ff6020' });
      } else if (id === 'luxwatch2') {
        mb.box(0, 0, -0.1, w - 0.4, 0.6, 0.4, '#2a2a36'); mb.box(0, 0.6, -0.1, w - 0.45, 0.18, 0.38, '#f0f8ff', { glow: '#ffffff' });
      } else shelves(mb, w, d, cols);
    }
  });
}
MODELS.sleeppod = (mb, w) => { for (let i = 0; i < 2; i++) { mb.box(-0.45 + i * 0.9, 0, -0.1, 0.8, 0.55, 0.7, '#f4f2ee'); mb.cyl(-0.45 + i * 0.9, 0.12, 0.25, 0.22, 0.22, 0.03, '#203040', 10, { glow: '#80c8ff' }); } mb.icon('zzz', 0, 0.9, -0.3, 0.3, 0); };
MODELS.workspace = (mb, w, d) => { booth(mb, w, d, { wall: '#e8e4dc', floor: '#d8d4cc', awn: '#3a5080', sign: '#3a5080', icon: 'board', noCounter: true }); for (let i = 0; i < 3; i++) { mb.box(-0.9 + i * 0.9, 0, -0.1, 0.7, 0.42, 0.45, '#a0683c'); mb.box(-0.9 + i * 0.9, 0.42, -0.2, 0.3, 0.2, 0.03, '#203040', { glow: '#80c8ff' }); } };
MODELS.petroom = (mb, w, d) => { booth(mb, w, d, { wall: '#fff8e8', floor: '#f0e0c8', awn: '#f39a3c', sign: '#f39a3c', icon: 'heart', noCounter: true }); for (let i = 0; i < 2; i++) { mb.box(-0.4 + i * 0.8, 0, -0.3, 0.6, 0.45, 0.5, '#ffffff'); mb.box(-0.4 + i * 0.8, 0.05, -0.04, 0.5, 0.35, 0.02, '#9a9aa6'); } };
MODELS.prayerhall = (mb, w, d) => { mb.box(0, 0, 0, w - 0.04, 0.05, d - 0.04, '#d8d4cc'); mb.box(0, 0, -d / 2 + 0.08, w - 0.04, 1.4, 0.1, '#8fc8e8', { glow: '#ffe8a0' }); for (let i = 0; i < 4; i++) mb.box(-1.3 + i * 0.87, 0, 0.3, 0.6, 0.25, 0.3, '#3a5080'); mb.icon('binocular', 0, 1.2, -d / 2 + 0.15, 0.32, 0); };
MODELS.infodesk2 = (mb, w) => { mb.box(0, 0, -0.1, w - 0.2, 0.6, 0.45, '#ffffff'); mb.box(0, 0.6, -0.1, w - 0.1, 0.05, 0.5, '#3fae5a'); mb.box(0, 0.9, -0.35, 1.2, 0.35, 0.05, '#203040', { glow: '#80ffa0' }); mb.icon('info', 0, 1.3, -0.35, 0.3, 0); };
MODELS.cargo2 = (mb, w, d) => { mb.box(0, 0, -0.3, w - 0.1, 1.5, d - 0.7, '#c8ccd8'); mb.box(0, 1.5, -0.3, w, 0.1, d - 0.6, '#f08a24'); for (let i = 0; i < 4; i++) mb.box(-1.5 + i, 0, d / 2 - 0.66, 0.8, 1.1, 0.04, '#7a7a86'); for (let i = 0; i < 3; i++) mb.box(-1.2 + i * 1.2, 0, d / 2 - 0.25, 0.8, 0.5, 0.4, ['#e5484d', '#4a8fe0', '#ffd84a'][i]); mb.icon('cargo', 0, 1.2, d / 2 - 0.62, 0.34, 0); };
MODELS.rescue = (mb, w, d) => { mb.box(0, 0, 0, w - 0.1, 0.05, d - 0.1, '#5a5a66'); mb.cyl(0, 0.05, 0, 1.1, 1.1, 0.02, '#f4f2ee', 16); mb.cyl(0, 0.06, 0, 0.9, 0.9, 0.02, '#5a5a66', 16); mb.box(0, 0.08, 0, 0.12, 0.01, 0.8, '#f4f2ee'); mb.box(0, 0.08, 0, 0.6, 0.01, 0.12, '#f4f2ee'); mb.box(-0.2, 0.1, 0.1, 0.35, 0.35, 0.9, '#e5484d'); mb.box(-0.2, 0.47, 0.1, 1.4, 0.03, 0.08, '#2a2a36'); mb.box(-0.2, 0.3, -0.55, 0.08, 0.2, 0.4, '#e5484d'); };
MODELS.glidepath = (mb, w, d) => { for (let i = 0; i < 3; i++) { mb.box(0, 0, -d / 2 + 0.5 + i, 0.06, 0.4, 0.06, '#9a9aa6'); mb.box(0, 0.4, -d / 2 + 0.5 + i, 0.8, 0.06, 0.1, '#5a5a66'); for (let k = 0; k < 3; k++) mb.box(-0.3 + k * 0.3, 0.46, -d / 2 + 0.5 + i, 0.08, 0.06, 0.08, '#fff8e0', { glow: '#fff0a0' }); } };
MODELS.ferryport = (mb, w, d) => { mb.box(0, 0, 0.3, w - 0.1, 0.1, d - 0.7, '#a0683c'); mb.box(0, 0, -0.6, w - 0.4, 0.8, 0.6, '#f4f2ee'); mb.box(0, 0.8, -0.6, w - 0.3, 0.08, 0.7, '#3a7bd5'); for (let i = 0; i < 4; i++) mb.cyl(-1.5 + i, 0, d / 2 - 0.15, 0.06, 0.06, 0.4, '#5a3a24', 6); mb.icon('fish', 0, 0.6, -0.29, 0.3, 0); };
MODELS.campsite = (mb, w, d) => { mb.box(0, 0, 0, w - 0.1, 0.04, d - 0.1, '#6ab85a'); for (const [x, z, c] of [[-1.2, -0.6, '#f39a3c'], [0, -0.7, '#4a8fe0'], [1.2, -0.5, '#4cb85c']]) { mb.box(x, 0.04, z, 0.7, 0.45, 0.6, c); mb.box(x, 0.49, z, 0.1, 0.1, 0.62, c); } mb.cyl(0, 0.04, 0.6, 0.25, 0.25, 0.08, '#5a5a66', 8); mb.box(0, 0.12, 0.6, 0.15, 0.1, 0.15, '#ff8040', { glow: '#ff6020' }); treeShape(mb, -1.5, 0.9, 'pine', 1, 0.8); treeShape(mb, 1.5, 0.9, 'round', 1, 0.8); };
MODELS.aviationpark = (mb, w, d) => { mb.box(0, 0, 0, w - 0.1, 0.35, d - 0.1, '#5fae4a'); mb.box(0, 0.35, 0, w - 1.0, 0.3, d - 1.0, '#6ab85a'); mb.box(0, 0.65, 0, 1.4, 0.04, 1.4, '#c8b090'); mb.box(-0.4, 0.69, 0, 0.8, 0.2, 0.2, '#a0683c'); mb.box(0.6, 0.69, 0.3, 0.06, 0.6, 0.06, '#3a3a48'); mb.box(0.6, 1.29, 0.3, 0.2, 0.15, 0.2, '#3a3a48'); treeShape(mb, -1.4, -1.4, 'round', 1, 0.8); treeShape(mb, 1.4, 1.3, 'sakura', 0, 0.8); };
MODELS.lavender = (mb, w, d) => { mb.box(0, 0, 0, w - 0.1, 0.05, d - 0.1, '#4a7a3a'); for (let r = 0; r < 4; r++) mb.box(0, 0.05, -d / 2 + 0.3 + r * (d - 0.6) / 3, w - 0.3, 0.22, 0.25, '#9a62d0'); };
MODELS.snowlantern = (mb) => { mb.box(0, 0, 0, 0.5, 0.35, 0.5, '#ffffff'); mb.box(0, 0.35, 0, 0.35, 0.3, 0.35, '#f4f8ff'); mb.box(0, 0.42, 0.18, 0.15, 0.15, 0.01, '#ffd060', { glow: '#ffc040' }); mb.box(0, 0.65, 0, 0.5, 0.12, 0.5, '#ffffff'); };
MODELS.planestatue = (mb, w, d) => {
  mb.box(0, 0, 0, w - 0.4, 0.3, d - 0.4, '#9a9aa6'); mb.box(0, 0.3, 0, 0.2, 1.0, 0.2, '#7a7a86');
  mb.box(0, 1.3, 0, 0.28, 0.28, 2.2, '#d8d0b8'); mb.box(0, 1.38, 0.1, 2.4, 0.05, 0.45, '#d8d0b8'); mb.box(0, 1.5, -1.0, 0.04, 0.4, 0.3, '#e5484d'); mb.box(0, 1.35, -0.95, 0.9, 0.04, 0.25, '#d8d0b8');
  mb.box(0, 1.3, 1.12, 0.05, 0.7, 0.04, '#3a3a44');
};

// ---------- イベント 4 ----------
EVENTS.push(
  { id: 'setsubun', name: '節分', when: d => d.month === 2 && d.part === 0, desc: '福は内！ 空港に豆まきの声', visitors: 1.2 },
  { id: 'hinamatsuri', name: 'ひなまつり', when: d => d.month === 3 && d.part === 0, desc: '家族づれのお客さんが増える', demand: 1.05, visitors: 1.2 },
);
RANDOM_EVENTS.push(
  { id: 'foodtv', name: 'グルメ番組のロケ', p: 0.03, minRank: 3, desc: '今日は飲食店の売上 +25%', apply: () => { G.flags.foodtv = true; } },
  { id: 'spotterday', name: '撮影会', p: 0.03, minRank: 2, desc: '飛行機ファンが大集合！ 見学客が増える', visitors: 1.7 },
);
// ---------- つぶやき 2 ----------
VOICES.push(
  { t: '管制塔の人たち、いい仕事してるね', c: p => p.kind === 'visit' || p.type === 'maniac' },
  { t: '大物が釣れるといいなぁ', c: p => p.type === 'fisher' },
);

// ---------- 開発・建物の効果 ----------
{
  const E = Extra;
  const _price = E.priceMul, _rate = E.ratingAdd, _vis = E.visitorMul, _mood = E.moodStart, _daily = E.daily;
  E.priceMul = (b, p) => {
    const def = B[b.id]; let k = _price(b, p);
    const wet = G.weather === 'rain' || G.weather === 'snow' || G.weather === 'typhoon';
    if (G.research.rainshop && wet && (def.cat === 'shop' || def.cat === 'food')) k *= 1.15;
    if (b.id === 'umbrella' && wet) k *= 2;
    if (G.research.chefsel && ['steak', 'kaiseki', 'restaurant', 'skybar', 'yakiniku', 'unagi', 'tempura'].includes(b.id)) k *= 1.1;
    if (G.flags.foodtv && def.cat === 'food') k *= 1.25;
    if (p && p.type === 'chef' && def.cat === 'food') k *= 1.2;
    return k;
  };
  E.ratingAdd = () => _rate() + (hasKindId('rescue') ? 0.05 : 0);
  E.visitorMul = () => _vis() * (G.research.nightlight && ((G.min % 1440) > 18 * 60) ? 1.25 : 1);
  E.moodStart = p => {
    let m = _mood(p);
    if (G.research.kidsmenu && p.type === 'kid') m += 4;
    if (G.research.quietzone && ['elder', 'scientist', 'monk'].includes(p.type)) m += 4;
    if (G.research.airportmap && ['foreign', 'elder', 'abroad'].includes(p.type)) m += 3;
    return m;
  };
  E.daily = () => { _daily(); G.flags.foodtv = false; };
}
function hasKindId(id) { for (const b of Object.values(G.blds)) if (b.id === id) return true; return false; }
