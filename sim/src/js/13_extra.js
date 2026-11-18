// ============================================================
//  追加の建物モデル・イベント12・いろいろな挙動
// ============================================================

// ---------- 建物モデル ----------
const MORE_SHOPC = {
  takoyaki: ['#f4e0b0', '#e5484d', ['#a0683c', '#ffd84a']], okonomi: ['#a0683c', '#2a1e1a', ['#a0683c', '#4cb85c']],
  tonkatsu: ['#e8d8b8', '#7a4c2c', ['#d8a050', '#4cb85c']], gyudon: ['#ffffff', '#f39a3c', ['#a0683c', '#ffffff']],
  yakiniku: ['#3a2a22', '#c02838', ['#2a2a36', '#ff8040']], pizza: ['#fff4e0', '#3e8a3c', ['#e5484d', '#ffd84a']],
  pasta: ['#fff8f0', '#c02838', ['#ffd84a', '#e5484d']], crepe: ['#ffe8f0', '#f59ac0', ['#ffffff', '#f59ac0']],
  matcha: ['#e8dcc0', '#3e8a3c', ['#4cb85c', '#a0683c']], juice: ['#ffffff', '#f39a3c', ['#ffd84a', '#4cb85c']],
  donut: ['#fff0e0', '#ff7090', ['#f59ac0', '#a0683c']], unagi: ['#5a3a24', '#2a1e1a', ['#a0683c', '#ffd84a']],
  icecream: ['#e8f8ff', '#8fdcf4', ['#f59ac0', '#ffffff']], onigiri: ['#ffffff', '#2a2a36', ['#ffffff', '#2e7d4a']],
  cosme: ['#fff0f4', '#ff7090', ['#f59ac0', '#ffffff', '#e5484d']], watchshop: ['#2a2a30', '#d8a020', ['#d8a020', '#c0c0c8']],
  luggageshop: ['#f4f2ee', '#3a7bd5', ['#e5484d', '#4a8fe0', '#ffd84a']], sports: ['#ffffff', '#e5484d', ['#4a8fe0', '#e5484d', '#ffffff']],
  camerashop: ['#e8e8f0', '#2a2a36', ['#2a2a36', '#c0c0c8']], localgoods: ['#e8d8b8', '#a0683c', ['#e5484d', '#4cb85c', '#ffd84a']],
  sakeshop: ['#d8c4a0', '#2a1e1a', ['#ffffff', '#4a8fe0', '#a0683c']], teashop: ['#e8dcc0', '#3e8a3c', ['#4cb85c', '#a0683c']],
  charashop: ['#fff8d8', '#ff7090', ['#ffd84a', '#4a8fe0', '#f59ac0']], stationery: ['#ffffff', '#4a8fe0', ['#e5484d', '#ffd84a', '#4cb85c']],
  eyewear: ['#f4f2ee', '#4a4a58', ['#2a2a36', '#c0c0c8']], jewelry: ['#1a1a22', '#d8a020', ['#c9a0ff', '#ffffff', '#d8a020']],
};
for (const [id, [wall, awn, cols]] of Object.entries(MORE_SHOPC)) {
  const def = B[id];
  shopModel(id, {
    wall, awn, stripe: !['watchshop', 'jewelry', 'unagi', 'yakiniku', 'camerashop'].includes(id), sign: awn, icon: def.icon,
    floor: id === 'jewelry' || id === 'watchshop' ? '#3a3a44' : '#efe6d6', counter: id === 'jewelry' ? '#d8a020' : WOOD,
    signGlow: id === 'jewelry' ? '#ffe080' : undefined,
    props: (mb, w, d) => {
      if (def.cat === 'food') {
        if (d >= 2) tables(mb, w, d, w >= 3 ? 4 : 2, '#ffffff', cols[0], -0.15);
        else { mb.box(0, 0, 0.05, w - 0.3, 0.6, 0.35, cols[0]); mb.box(0, 0.6, 0.05, w - 0.35, 0.05, 0.38, '#d8d8d8'); }
        if (id === 'yakiniku' || id === 'takoyaki' || id === 'okonomi') mb.box(-w / 2 + 0.45, 0.4, -d / 2 + 0.35, 0.5, 0.05, 0.25, '#ff8040', { glow: '#ff6020' });
        if (id === 'icecream' || id === 'juice') mb.box(0, 0.6, -0.1, w * 0.6, 0.2, 0.25, '#e8f8ff', { glow: '#ffffff' });
      } else if (id === 'jewelry' || id === 'watchshop') {
        for (let i = 0; i < 2; i++) { mb.box(-0.5 + i, 0, -0.1, 0.6, 0.6, 0.5, cols[2]); mb.box(-0.5 + i, 0.6, -0.1, 0.55, 0.2, 0.45, '#f0f8ff', { glow: '#ffffff' }); mb.box(-0.5 + i, 0.62, -0.1, 0.1, 0.08, 0.1, cols[i]); }
      } else shelves(mb, w, d, cols);
    }
  });
}
MODELS.kidsroom = (mb, w, d) => {
  mb.box(0, 0, 0, w - 0.04, 0.05, d - 0.04, '#ffe080');
  for (const [x, z] of [[-w / 2 + 0.06, 0], [w / 2 - 0.06, 0]]) mb.box(x, 0, z, 0.08, 0.5, d - 0.04, '#ff7090');
  mb.box(0, 0, -d / 2 + 0.06, w - 0.04, 0.5, 0.08, '#4a8fe0');
  mb.box(-0.8, 0.05, -0.2, 0.6, 0.5, 0.6, '#e5484d'); mb.box(-0.8, 0.55, -0.2, 0.3, 0.3, 0.3, '#ffd84a');
  for (let i = 0; i < 4; i++) mb.cyl(0.3 + (i % 2) * 0.4, 0.05, -0.3 + Math.floor(i / 2) * 0.5, 0.14, 0.14, 0.14, ['#4cb85c', '#4a8fe0', '#ff7090', '#ffd84a'][i], 8);
  mb.box(0.9, 0.05, 0.3, 0.4, 0.3, 0.8, '#3fc9b8'); mb.icon('balloon', 0, 0.75, -d / 2 + 0.11, 0.36, 0);
};
MODELS.prayer = (mb, w, d) => { mb.box(0, 0, -0.1, w - 0.1, 1.2, d - 0.3, '#e8f0e8'); mb.box(0, 1.2, -0.1, w - 0.05, 0.06, d - 0.25, '#3e8a3c'); mb.box(0, 0, d / 2 - 0.22, 0.5, 1.0, 0.06, '#c8d8c8'); mb.icon('heart', 0, 0.75, d / 2 - 0.18, 0.32, 0); };
MODELS.shower = (mb, w, d) => { booth(mb, w, d, { wall: '#e0f0f8', floor: '#d8e8f0', awn: '#4a8fe0', sign: '#4a8fe0', icon: 'onsen', noCounter: true }); for (let i = 0; i < 2; i++) { mb.box(-0.4 + i * 0.8, 0, -0.2, 0.6, 1.0, 0.7, '#ffffff'); mb.box(-0.4 + i * 0.8, 0.9, -0.2, 0.1, 0.1, 0.1, '#c0c0c8'); } };
MODELS.library = (mb, w, d) => { booth(mb, w, d, { wall: '#a0683c', floor: '#c8a878', awn: '#3e6a4a', sign: '#3e6a4a', icon: 'book', noCounter: true }); shelves(mb, w, 0.6, ['#e5484d', '#4a8fe0', '#4cb85c', '#ffd84a']); for (let i = 0; i < 3; i++) { mb.box(-0.9 + i * 0.9, 0, 0.45, 0.4, 0.25, 0.35, '#7a4c2c'); } };
MODELS.vr = (mb, w, d) => { booth(mb, w, d, { wall: '#2a2040', floor: '#3a3060', awn: '#40e0ff', sign: '#2a2040', signIn: '#80f0ff', signGlow: '#40e0ff', icon: 'game', noCounter: true }); for (let i = 0; i < 2; i++) { mb.box(-0.4 + i * 0.8, 0, -0.1, 0.5, 0.45, 0.6, '#4a4a58'); mb.box(-0.4 + i * 0.8, 0.45, -0.3, 0.5, 0.35, 0.08, '#203040', { glow: '#40e0ff' }); } };
MODELS.photostudio = (mb, w, d) => { booth(mb, w, d, { wall: '#ffffff', floor: '#e8e0f0', awn: '#c9a0ff', sign: '#9a62d0', icon: 'camera', noCounter: true }); mb.box(0, 0.2, -d / 2 + 0.2, w - 0.5, 0.9, 0.05, '#8fdcf4'); mb.box(0, 0.4, -d / 2 + 0.24, 0.9, 0.2, 0.02, '#ffffff'); mb.box(0, 0, 0.4, 0.1, 0.8, 0.1, '#2a2a36'); mb.box(0, 0.8, 0.4, 0.25, 0.2, 0.2, '#2a2a36'); };
MODELS.luggage = (mb, w) => { mb.box(0, 0, -0.2, w - 0.2, 0.6, 0.45, '#e8e4dc'); mb.box(0, 0.6, -0.2, w - 0.1, 0.05, 0.5, '#3a7bd5'); for (let i = 0; i < 4; i++) mb.box(-0.6 + i * 0.4, 0, -0.42, 0.3, 0.5, 0.15, ['#e5484d', '#4a8fe0', '#ffd84a', '#3fc9b8'][i]); mb.icon('suitcase', 0, 0.95, -0.4, 0.3, 0); };
MODELS.postoffice = (mb, w) => { mb.box(0, 0, -0.2, w - 0.2, 0.6, 0.45, '#ffffff'); mb.box(0, 0.6, -0.2, w - 0.1, 0.05, 0.5, '#e5484d'); mb.box(0.7, 0, 0.25, 0.25, 0.7, 0.25, '#e5484d'); mb.box(0.7, 0.7, 0.25, 0.3, 0.06, 0.3, '#c02838'); mb.icon('mail', -0.3, 0.95, -0.4, 0.32, 0); };
MODELS.deicer = (mb, w, d) => { mb.box(0, 0, -0.3, w - 0.2, 0.15, d - 0.8, '#7a8a9a'); mb.box(-0.6, 0, 0.3, 0.7, 0.5, 0.9, '#f39a3c'); mb.box(-0.6, 0.5, 0.3, 0.1, 0.8, 0.1, '#ffd84a'); mb.box(-0.6, 1.3, 0.1, 0.12, 0.12, 0.6, '#ffd84a'); mb.cyl(0.7, 0, -0.3, 0.4, 0.4, 0.9, '#f39a3c', 8); mb.icon('snow', 0.7, 0.6, 0.11, 0.3, 0); };
MODELS.cateringfac = (mb, w, d) => { mb.box(0, 0, -0.3, w - 0.1, 1.3, d - 0.7, '#f4f2ee'); mb.box(0, 1.3, -0.3, w, 0.1, d - 0.6, '#3a7bd5'); for (let i = 0; i < 3; i++) mb.box(-1.2 + i * 1.2, 0, 0.86, 0.8, 0.9, 0.04, '#9a9aa6'); mb.box(0.8, 0, 1.1, 0.5, 0.8, 0.6, '#f4f2ee'); mb.icon('bento', 0, 1.1, 0.86, 0.34, 0); };
MODELS.gsebase = (mb, w, d) => { mb.box(0, 0, 0, w - 0.1, 0.05, d - 0.1, '#5a5a64'); mb.box(-1, 0, -0.5, 1.6, 1.0, 1.2, '#d8d8e0'); mb.box(-1, 1.0, -0.5, 1.7, 0.08, 1.3, '#ffd84a'); car(mb, 0.6, -0.5, '#ffd84a', 0); car(mb, 1.2, -0.5, '#f39a3c', 0); car(mb, 0.9, 0.6, '#ffd84a', 1); mb.icon('cargo', -1, 0.75, 0.11, 0.3, 0); };
MODELS.training = (mb, w, d) => { mb.box(0, 0, -0.2, w - 0.2, 1.3, d - 0.6, '#e8e4dc'); mb.box(0, 1.3, -0.2, w - 0.1, 0.1, d - 0.5, '#2f4f9a'); for (let i = 0; i < 3; i++) mb.box(-0.9 + i * 0.9, 0.3, d / 2 - 0.49, 0.5, 0.4, 0.02, '#8fc8e8', { glow: '#ffe8a0' }); mb.cyl(0.8, 1.4, -0.5, 0.45, 0.45, 0.5, '#f4f2ee', 10); mb.icon('plane2', -0.6, 1.0, d / 2 - 0.48, 0.34, 0); };
MODELS.busterminal = (mb, w, d) => { mb.box(0, 0, -0.2, w - 0.1, 0.06, d - 0.2, '#c8c8d0'); for (let i = 0; i < 4; i++) mb.box(-w / 2 + 0.4 + i * (w - 0.8) / 3, 0, -0.5, 0.08, 1.2, 0.08, '#9a9aa6'); mb.box(0, 1.2, -0.3, w, 0.08, d - 0.3, '#4cb85c'); for (let i = 0; i < 3; i++) mb.box(-1.2 + i * 1.2, 0, -0.55, 0.8, 0.28, 0.25, '#a0683c'); mb.icon('bus', 1.6, 1.0, d / 2 - 0.2, 0.3, 0); };
MODELS.monorail = (mb, w, d) => {
  mb.box(0, 0, 0.3, w - 0.2, 1.5, d - 1.2, '#e8e4dc'); mb.box(0, 1.5, 0.3, w, 0.1, d - 1.1, '#3a7bd5'); mb.box(0, 0.1, d / 2 - 0.51, 1.6, 1.1, 0.02, '#8fc8e8', { glow: '#ffe8a0' });
  for (let i = 0; i < 4; i++) mb.box(-w / 2 + 0.4 + i * (w - 0.8) / 3, 0, -1.1, 0.25, 1.9, 0.25, '#c8c8d0');
  mb.box(0, 1.9, -1.1, w, 0.25, 0.4, '#d8d8e0'); mb.box(0.3, 2.15, -1.1, 2.6, 0.5, 0.36, '#f4f2ee'); mb.box(0.3, 2.35, -1.1, 2.62, 0.16, 0.38, '#3a4a5a', { glow: '#ffe8a0' }); mb.box(0.3, 2.2, -1.1, 2.62, 0.05, 0.38, '#3a7bd5');
  mb.icon('train', 0, 1.25, d / 2 - 0.49, 0.36, 0);
};
MODELS.outlet = (mb, w, d) => {
  mb.box(0, 0, 0, w - 0.1, 0.05, d - 0.1, '#d8d2c6');
  const cs = ['#e5484d', '#4a8fe0', '#ffd84a', '#4cb85c', '#9a62d0'];
  for (let i = 0; i < 5; i++) { mb.box(-w / 2 + 0.55 + i * (w - 1.1) / 4, 0, -d / 2 + 0.7, 0.9, 1.2, 1.1, '#f4f2ee'); mb.box(-w / 2 + 0.55 + i * (w - 1.1) / 4, 1.0, -d / 2 + 1.27, 0.9, 0.2, 0.08, cs[i]); mb.box(-w / 2 + 0.55 + i * (w - 1.1) / 4, 0.1, -d / 2 + 1.26, 0.6, 0.7, 0.02, '#8fc8e8', { glow: '#ffe8a0' }); }
  mb.cyl(0, 0.05, 0.8, 0.6, 0.6, 0.2, '#c8c8d0', 10); mb.cyl(0, 0.08, 0.8, 0.5, 0.5, 0.18, '#5cc8e0', 10, { glow: '#80e0ff' });
  for (const x of [-1.6, 1.6]) treeShape(mb, x, 1.1, 'round', 1, 0.8);
  mb.box(0, 1.25, -d / 2 + 0.7, 2.0, 0.5, 0.1, '#2a2a36'); mb.icon('shopping', 0, 1.5, -d / 2 + 0.77, 0.4, 0);
};
MODELS.museum = (mb, w, d) => {
  mb.box(0, 0, -0.4, w - 0.2, 1.4, d - 1.0, '#e8e4dc');
  for (let k = 0; k < 4; k++) { const ww = (w - 0.2) * Math.cos(k / 4 * Math.PI / 2.4); mb.box(0, 1.4 + k * 0.25, -0.4, ww, 0.25, d - 1.0, k % 2 ? '#c8ccd8' : '#d8d8e0'); }
  mb.box(0, 0.1, d / 2 - 0.9, 2.0, 1.1, 0.02, '#8fc8e8', { glow: '#ffe8a0' });
  // 外に展示されたプロペラ機
  mb.box(1.6, 0.4, 0.95, 0.25, 0.25, 1.3, '#d8d0b8'); mb.box(1.6, 0.6, 0.85, 1.8, 0.04, 0.3, '#d8d0b8'); mb.box(1.6, 0.4, 0.3, 0.04, 0.4, 0.2, '#e5484d'); mb.box(1.6, 0.3, 1.62, 0.05, 0.6, 0.04, '#3a3a44');
  mb.box(1.6, 0, 0.95, 0.06, 0.4, 0.06, '#7a7a80');
  mb.box(-0.8, 1.6, d / 2 - 0.88, 2.0, 0.4, 0.06, '#2f4f9a'); mb.icon('plane2', -0.8, 1.8, d / 2 - 0.84, 0.34, 0);
};
MODELS.ferris = (mb, w, d) => {
  mb.box(0, 0, 0, w - 0.2, 0.1, d - 0.2, '#c8c8d0');
  mb.box(-0.5, 0, 0, 0.1, 2.0, 0.1, '#9a9aa6'); mb.box(0.5, 0, 0, 0.1, 2.0, 0.1, '#9a9aa6');
  const cs = ['#e5484d', '#4a8fe0', '#ffd84a', '#4cb85c', '#9a62d0', '#f59ac0', '#3fc9b8', '#f39a3c'];
  for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; mb.box(0, 2.1 + Math.sin(a) * 1.25, Math.cos(a) * 1.25, 0.04, 0.12, 0.12, '#d8d8e0', { glow: i % 2 ? '#ff80c0' : '#80d0ff' }); }
  for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; mb.box(0, 1.85 + Math.sin(a) * 1.35, Math.cos(a) * 1.35, 0.3, 0.3, 0.3, cs[i]); }
  mb.box(0, 2.0, 0, 0.12, 0.2, 0.2, '#4a4a58');
};
MODELS.maple = (mb, w, d, o) => { const s = o.season || 0; const c = ['#7ac060', '#4aa040', '#e0302c', '#8a6a5a'][s]; mb.box(0, 0, 0, 0.14, 0.5, 0.14, '#6b4226'); mb.box(0, 0.45, 0, 0.75, 0.45, 0.75, c); mb.box(0.05, 0.85, 0.05, 0.5, 0.3, 0.5, shade(c, 0.15)); };
MODELS.ginkgo = (mb, w, d, o) => { const s = o.season || 0; const c = ['#8ad060', '#5ab04a', '#ffd030', '#8a7a5a'][s]; mb.box(0, 0, 0, 0.14, 0.6, 0.14, '#6b4226'); mb.box(0, 0.5, 0, 0.6, 0.4, 0.6, c); mb.box(0, 0.88, 0, 0.42, 0.35, 0.42, shade(c, 0.15)); mb.box(0, 1.2, 0, 0.24, 0.2, 0.24, c); };
MODELS.bamboo = (mb) => { for (const [x, z, h] of [[-0.2, -0.15, 1.6], [0.15, 0.1, 1.9], [0.25, -0.25, 1.4], [-0.1, 0.25, 1.7]]) { mb.box(x, 0, z, 0.07, h, 0.07, '#4cb85c'); mb.box(x + 0.08, h - 0.4, z, 0.25, 0.08, 0.18, '#3e8a3c'); } };
MODELS.hedge = (mb, w) => { mb.box(0, 0, 0, w - 0.1, 0.45, 0.5, '#3e8a3c'); mb.box(0, 0.45, 0, w - 0.2, 0.08, 0.4, '#4cb85c'); };
MODELS.gardenrock = (mb) => { mb.box(0, 0, 0, 0.6, 0.35, 0.5, '#8a8478'); mb.box(0.1, 0.35, -0.05, 0.35, 0.2, 0.3, '#9a9488'); mb.box(-0.25, 0, 0.25, 0.25, 0.15, 0.2, '#7a7468'); };
MODELS.stonelantern = (mb) => { mb.box(0, 0, 0, 0.4, 0.12, 0.4, '#9a9488'); mb.box(0, 0.12, 0, 0.14, 0.5, 0.14, '#9a9488'); mb.box(0, 0.62, 0, 0.36, 0.08, 0.36, '#8a8478'); mb.box(0, 0.7, 0, 0.26, 0.24, 0.26, '#c8c0a8', { glow: '#ffd080' }); mb.box(0, 0.94, 0, 0.46, 0.1, 0.46, '#8a8478'); mb.box(0, 1.04, 0, 0.1, 0.1, 0.1, '#8a8478'); };
MODELS.xmastree = (mb) => { mb.box(0, 0, 0, 0.3, 0.2, 0.3, '#e5484d'); for (let k = 0; k < 4; k++) mb.box(0, 0.2 + k * 0.32, 0, 0.9 - k * 0.2, 0.34, 0.9 - k * 0.2, '#2e7d4a'); const lc = ['#ffd84a', '#e5484d', '#4a8fe0', '#ffffff']; for (let i = 0; i < 10; i++) { const a = i * 2.4, r = 0.42 - (i / 10) * 0.3; mb.box(Math.cos(a) * r, 0.3 + i * 0.11, Math.sin(a) * r, 0.07, 0.07, 0.07, lc[i % 4], { glow: lc[i % 4] }); } mb.box(0, 1.5, 0, 0.16, 0.16, 0.16, '#ffd84a', { glow: '#ffe060' }); };
MODELS.koinobori = (mb) => { mb.cyl(0, 0, 0, 0.04, 0.05, 2.2, '#d8d8e0', 5); const cs = ['#2a2a36', '#e5484d', '#4a8fe0']; cs.forEach((c, i) => { const y = 1.85 - i * 0.4; for (let k = 0; k < 4; k++) mb.box(0.18 + k * 0.17, y - k * 0.02, 0, 0.18, 0.22 - k * 0.03, 0.12, k === 0 ? c : k % 2 ? '#ffffff' : c); mb.box(0.12, y + 0.04, 0.065, 0.05, 0.05, 0.01, '#ffffff'); }); mb.box(0, 2.2, 0, 0.12, 0.12, 0.12, '#ffd84a'); };
MODELS.sunflower = (mb, w, d) => { mb.box(0, 0, 0, w - 0.1, 0.05, d - 0.1, '#5a3a24'); for (let i = 0; i < 9; i++) { const x = -0.6 + (i % 3) * 0.6, z = -0.6 + Math.floor(i / 3) * 0.6; mb.box(x, 0.05, z, 0.05, 0.7, 0.05, '#4cb85c'); mb.box(x, 0.75, z + 0.03, 0.3, 0.3, 0.05, '#ffd84a'); mb.box(x, 0.82, z + 0.06, 0.12, 0.12, 0.02, '#7a4c2c'); } };
MODELS.rocketstatue = (mb) => { mb.box(0, 0, 0, 1.4, 0.4, 1.4, '#c8c0b0'); mb.cyl(0, 0.4, 0, 0.3, 0.3, 2.0, '#f4f2ee', 10); mb.cyl(0, 2.4, 0, 0.02, 0.3, 0.6, '#e5484d', 10); for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; mb.box(Math.cos(a) * 0.35, 0.4, Math.sin(a) * 0.35, 0.12 + Math.abs(Math.cos(a)) * 0.2, 0.6, 0.12 + Math.abs(Math.sin(a)) * 0.2, '#e5484d'); } mb.box(0, 1.6, 0.3, 0.16, 0.16, 0.02, '#203040', { glow: '#80d0ff' }); };

// ---------- イベント 12 ----------
EVENTS.push(
  { id: 'tsuyu', name: '梅雨入り', when: d => d.month === 6 && d.part === 0, desc: '雨の日が多くなる季節。屋内の施設が人気', visitors: 0.7 },
  { id: 'koyo', name: '紅葉シーズン', when: d => d.month === 11 && d.part === 0, desc: 'もみじ・イチョウがきれい。見学客が増える', visitors: 1.6 },
  { id: 'hatsuhi', name: '初日の出フライト', when: d => d.month === 1 && d.part === 0 && d.year > 1, desc: '初日の出を見る特別便！ ごほうびの収入が入る', apply: () => earn(800000 * G.rank, 'other') },
  { id: 'valentine', name: 'バレンタイン', when: d => d.month === 2 && d.part === 1, desc: 'スイーツ店が大にぎわい', visitors: 1.2 },
  { id: 'tanabata', name: '七夕まつり', when: d => d.month === 7 && d.part === 0, desc: '笹かざりで空港が華やか。見学客が増える', visitors: 1.5 },
  { id: 'silverweek', name: 'シルバーウィーク', when: d => d.month === 9 && d.part === 1, desc: '秋の大型連休。旅行のお客さんがいっぱい', demand: 1.15 },
);
RANDOM_EVENTS.push(
  { id: 'conference', name: '国際学会', p: 0.04, minRank: 4, desc: 'ビジネスのお客さんがたくさん来る', apply: () => { G.flags.bizBoost = true; } },
  { id: 'sportstour', name: 'プロ野球チームの遠征', p: 0.04, minRank: 2, desc: '選手団がやってくる！ ファンの見学客も', visitors: 1.5, apply: () => { G.flags.athlete = true; } },
  { id: 'live', name: 'アイドルのライブ', p: 0.04, minRank: 3, desc: 'ファンの見学客が大集合！', visitors: 2.2, apply: () => { G.flags.idol = true; } },
  { id: 'ambassador', name: '大使の来訪', p: 0.03, minRank: 5, desc: '外交官のお客さんが来る。ラウンジがあると評価アップ', apply: () => { G.flags.diplomat = true; } },
  { id: 'rarejet', name: 'めずらしい機体の飛来', p: 0.04, minRank: 3, desc: '特別塗装機がやってくる！ マニアとカメラマンが集まる', visitors: 1.8 },
  { id: 'cleanday', name: '空港クリーンデー', p: 0.04, desc: 'みんなでおそうじ。今日は美しさアップ', apply: () => { G.flags.clean = true; } },
);

// ---------- 研究・建物の効果（ほかのファイルから呼ばれる） ----------
const Extra = {
  turnMul() { let k = 1; if (hasKind('gse')) k *= 0.9; if (G.research.turnfast) k *= 0.9; return k; },
  gapMul() { return G.research.cdm ? 0.85 : 1; },
  holdLimit() { return G.research.sms ? 140 : 100; },
  priceMul(b, p) {
    const def = B[b.id]; let k = 1;
    if (G.research.signage && def.cat === 'shop') k *= 1.05;
    if (G.research.localfood && def.cat === 'food') k *= 1.1;
    if (G.research.nightshop && (G.min % 1440) >= 20 * 60) k *= 1.3;
    if (G.flags.event === 'valentine' && ['sweets', 'crepe', 'donut', 'icecream'].includes(b.id)) k *= 1.6;
    return k;
  },
  moodStart(p) {
    let m = 0;
    if (G.research.wifi6) m += 3;
    if (G.research.barrierfree && (p.type === 'elder' || p.type === 'babyc')) m += 6;
    if (G.research.kidsfriendly && (p.type === 'kid' || p.type === 'family' || p.type === 'babyc')) m += 5;
    return m;
  },
  visitorMul() { let k = 1; if (G.research.tourism) k *= 1.3; for (const b of Object.values(G.blds)) if (b.id === 'outlet' || b.id === 'museum' || b.id === 'ferris') k += 0.15; return k; },
  cargoMul() { return G.research.cargoauto ? 1.25 : 1; },
  upkeepMul() { return G.research.hydrogen ? 0.9 : 1; },
  ratingAdd() { return (G.research.carbon ? 0.1 : 0); },
  accessMul(b) { return G.research.maglev && (b.id === 'station' || b.id === 'monorail') ? 2 : 1; },
  daily() {
    if (hasKind('training')) { G.dev = (G.dev || 0) + 8; for (const a of Object.values(G.airlines)) a.rel = Math.min(100, a.rel + 0.3); }
  },
  onLanded(fl) {
    if (!fl.cargo && hasKind('catering')) earn(PLANES[fl.type].seats * 90, 'svc');
  },
  extraPax(fl) {
    if (G.flags.athlete && Math.random() < 0.15) return 'athlete';
    if (G.flags.idol && Math.random() < 0.02) return 'idol';
    if (G.flags.diplomat && Math.random() < 0.05) return 'diplomat';
    if (G.flags.bizBoost && Math.random() < 0.25) return 'biz';
    return null;
  },
};

// ---------- 挙動 ----------
// 接地のタイヤスモーク
Bus.on('touchdown', pl => {
  const s = Math.sin(pl.hdg), c = Math.cos(pl.hdg), L = pl.P.len;
  for (const sx of [-1, 1]) {
    const lx = sx * 0.3, lz = -L * 0.05;
    burst(pl.x + c * lx + s * lz, 0.08, pl.z - s * lx + c * lz, '#e8e8ec', 14, 0.6, 1.4, -0.2);
  }
});
// 飛行機雲
function contrail(pl) {
  if (pl.y < 9 || pl.P.eng === 'prop' || Math.random() > 0.7) return;
  const s = Math.sin(pl.hdg), c = Math.cos(pl.hdg), L = pl.P.len, xs = pl.P.engines === 4 ? [-0.7, -0.35, 0.35, 0.7] : [-0.4, 0.4];
  for (const f of xs) { const lx = f * pl.P.span * 0.5, lz = -L * 0.2; burst(pl.x + c * lx + s * lz, pl.y, pl.z - s * lx + c * lz, '#ffffff', 1, 0.05, 5, -0.02); }
}
// ウォーターサリュート（新しい路線の初便を放水アーチでおむかえ）
const Salute = { list: [] };
Bus.on('taxiIn', pl => {
  const fl = pl.fl, route = G.routes.find(r => r.id === fl.rid);
  if (!route || route.saluted || !hasKind('fire') || (route.flights || 0) > 0) return;
  route.saluted = true; G.flags.salute = true;
  const p0 = pl.path[Math.min(2, pl.path.length - 1)]; if (!p0) return;
  const trucks = [];
  for (const sd of [-1, 1]) {
    const m = vehicleMesh('fire'); m.scale.setScalar(0.55);
    const dir = Math.atan2(p0.x - pl.x, p0.z - pl.z);
    const px = p0.x + Math.cos(dir) * sd * 2.2, pz = p0.z - Math.sin(dir) * sd * 2.2;
    m.position.set(px, 0, pz); m.rotation.y = dir; R.scene.add(m); trucks.push({ m, x: px, z: pz, sd, dir });
  }
  Salute.list.push({ trucks, t: 0, cx: p0.x, cz: p0.z });
  toast(`${CITIES[fl.city].name}線の初便をウォーターサリュートでおむかえ！`, 'gold', 'fountain');
});
function updateSalute(dtReal) {
  for (const s of Salute.list) {
    s.t += dtReal;
    for (const t of s.trucks) if (s.t < 9) { burst(t.x, 0.7, t.z, '#cfefff', 3, 0, 1.6, 2.2); aimWater(t, s); }
    if (s.t > 12) { for (const t of s.trucks) R.scene.remove(t.m); s.done = true; }
  }
  Salute.list = Salute.list.filter(s => !s.done);
}
function aimWater(t, s) {
  // 直前に出した粒に、反対側のトラックへ向かう速度を与える（アーチ）
  const n = 3;
  for (let k = 0; k < n; k++) {
    const i = (FX.cur - k + FX.max) % FX.max;
    const dx = s.cx - t.x, dz = s.cz - t.z;
    FX.vel[i * 3] = dx * 0.65 + rnd(-0.1, 0.1); FX.vel[i * 3 + 1] = 3.0 + rnd(-0.2, 0.2); FX.vel[i * 3 + 2] = dz * 0.65 + rnd(-0.1, 0.1);
  }
}
// 除氷作業（雪の日の出発前）
function startDeice(pl) {
  if (G.weather !== 'snow') return;
  let t = 8; if (hasKind('deice')) t *= 0.5; if (G.research.deicing) t *= 0.5;
  pl.deiceT = t; G.flags.deiced = true;
  const m = vehicleMesh('fuel'); m.scale.setScalar(0.62); R.scene.add(m); pl.deicer = m;
}
function updateDeice(pl, dt) {
  if (!pl.deicer) return false;
  pl.deiceT -= dt;
  const s = Math.sin(pl.hdg), c = Math.cos(pl.hdg), lx = pl.P.span * 0.35, lz = -pl.P.len * 0.05;
  const x = pl.x + c * lx + s * lz, z = pl.z - s * lx + c * lz;
  pl.deicer.position.set(x, 0, z); pl.deicer.rotation.y = pl.hdg;
  if (Math.random() < 0.8) burst(x - c * 0.4, 0.8, z + s * 0.4, '#ffa040', 3, 0.8, 0.8, 2);
  if (pl.deiceT <= 0) { R.scene.remove(pl.deicer); pl.deicer = null; return false; }
  return true;
}
// 地上スタッフのお見送り（手をふる）
Bus.on('departed', fl => {
  const st = G.blds[fl.stand]; if (!st || fl.cargo) return;
  const c = bCenter(st), [fx, fy] = frontDir(st.rot), [w, h] = dims(B[st.id], st.rot);
  for (let k = 0; k < 3; k++) {
    const x = c.x + fx * (h / 2 - 0.3) * (fy ? 1 : 0) + fx * (w / 2 - 0.3) * (fx ? 1 : 0) + (fy ? (k - 1) * 0.5 : 0);
    const z = c.z + fy * (h / 2 - 0.3) * (fy ? 1 : 0) + fy * (w / 2 - 0.3) * (fx ? 1 : 0) + (fx ? (k - 1) * 0.5 : 0);
    const p = newPerson('staff', 'wave', x, z);
    p.w = 0; p.state = 'wave'; p.wait = 14; p.face = 1;
  }
});
// 鳥の群れ
const Birds = { flocks: [] };
function updateBirds(dtReal) {
  const d = dateOf(G.day);
  const want = (G.flags.event === 'birds' || G.flags.birds ? 3 : (d.season === 0 || d.season === 2) ? 1 : 0.4) * (RT.nightF > 0.7 ? 0 : 1);
  if (Birds.flocks.length < Math.round(want) && Math.random() < dtReal * 0.05) {
    const g = new THREE.Group(), n = rndi(6, 14), mat = new THREE.MeshBasicMaterial({ color: '#3a3a44', fog: false });
    const geo = new THREE.BoxGeometry(0.22, 0.03, 0.08);
    const birds = [];
    for (let i = 0; i < n; i++) { const m = new THREE.Mesh(geo, mat); m.position.set(rnd(-2, 2), rnd(-0.4, 0.4), rnd(-2, 2)); g.add(m); birds.push(m); }
    const side = Math.random() < 0.5 ? -1 : 1;
    g.position.set(side < 0 ? -30 : W + 30, rnd(5, 9), rnd(0, H));
    R.scene.add(g);
    Birds.flocks.push({ g, birds, v: side * rnd(3, 5), t: 0 });
  }
  for (const f of Birds.flocks) {
    f.t += dtReal;
    f.g.position.x -= f.v * dtReal; f.g.position.z += Math.sin(f.t * 0.5) * dtReal;
    f.birds.forEach((b, i) => { b.scale.x = 0.5 + Math.abs(Math.sin(f.t * 8 + i)) * 0.8; });
    if (f.g.position.x < -40 || f.g.position.x > W + 40) { R.scene.remove(f.g); f.done = true; }
  }
  Birds.flocks = Birds.flocks.filter(f => !f.done);
}
// 吹き流しは風の向きへ
function updateWindsocks() {
  const a = (G.windDir ? Math.PI : 0) + Math.sin(RT.time * 0.7) * 0.15;
  for (const b of Object.values(G.blds)) if (b.id === 'windsock' && b.mesh) b.mesh.rotation.y = a;
}
// バス停にバスが来る
const BusArr = { list: [], t: 0 };
function updateBusArrivals(dt) {
  BusArr.t -= dt;
  if (BusArr.t <= 0) {
    BusArr.t = 25;
    const stops = Object.values(G.blds).filter(b => (b.id === 'busstop' || b.id === 'busterminal') && b.mesh);
    if (stops.length && RT.persons.length > 3 && RT.nightF < 0.8) {
      const b = pick(stops), c = bCenter(b), [fx, fy] = frontDir(b.rot);
      const m = vehicleMesh('bus', b.id === 'busterminal' ? '#3a7bd5' : '#4cb85c'); m.scale.setScalar(0.8);
      const x = c.x - fx * 1.2 + (fy ? 0 : 0), z = c.z - fy * 1.2;
      m.position.set(x, 0, z); m.rotation.y = Math.atan2(fy, -fx) + Math.PI / 2 * 0 + (fy ? Math.PI / 2 : 0);
      R.scene.add(m); BusArr.list.push({ m, t: 0 });
    }
  }
  for (const a of BusArr.list) { a.t += dt; a.m.visible = true; if (a.t > 8) { R.scene.remove(a.m); a.done = true; } }
  BusArr.list = BusArr.list.filter(a => !a.done);
}
// 展望デッキのカメラ・子どもの歓声
function updateSpotters() {
  const busy = RT.planes.some(p => p.state === 'takeoff' || p.state === 'roll' || (p.state === 'approach' && p.phase === 'final' && p.y < 2));
  if (!busy || Math.random() > 0.2) return;
  for (const p of RT.persons) {
    if (p.state !== 'service' && p.state !== 'gatewait') continue;
    const b = G.blds[p.facUid];
    const atDeck = b && (b.id === 'deck' || b.id === 'museum');
    if (!atDeck && !(p.state === 'gatewait' && (p.type === 'kid' || p.type === 'maniac' || p.type === 'photog'))) continue;
    if (Math.random() < 0.15) bubble(p, p.type === 'photog' || p.type === 'maniac' || p.type === 'tourist' ? 'camera' : p.type === 'kid' ? 'plane' : 'note', 1.2);
  }
}
// 家族はいっしょに歩く（子どもがついていく）
function addFollower(leader) {
  const kid = newPerson(leader.type === 'babyc' ? 'kid' : 'kid', 'follow', leader.x + 0.2, leader.z + 0.2);
  kid.w = 0; kid.state = 'follow'; kid.leader = leader; kid.fl = leader.fl;
  kid.ox = rnd(-0.3, 0.3); kid.oz = rnd(-0.3, 0.3);
  return kid;
}
function updateFollower(p, dt) {
  const L = p.leader;
  if (!L || L.gone) { p.gone = true; return; }
  p.hidden = L.hidden;
  const tx = L.x + p.ox * 0.9 - (L.mvx ? Math.sign(L.mvx) * 0.2 : 0), tz = L.z + p.oz * 0.9 - (L.mvz ? Math.sign(L.mvz) * 0.2 : 0);
  const dx = tx - p.x, dz = tz - p.z, d = Math.hypot(dx, dz);
  if (d > 4) { p.x = tx; p.z = tz; }
  else if (d > 0.08) { const st = Math.min(d, L.spd * 1.25 * dt); p.x += dx / d * st; p.z += dz / d * st; p.moving = true; p.mvx = dx; p.mvz = dz; }
  else p.moving = false;
  p.tile = idx(clamp(Math.floor(p.x), 0, W - 1), clamp(Math.floor(p.z), 0, H - 1));
  if (L.bub === 'heart' && !p.bub && Math.random() < 0.3) bubble(p, 'note', 1);
}
// つぶやき
function personVoice(p) {
  if (p.voiceT && RT.time - p.voiceT < 6 && p.voice) return p.voice;
  const opts = VOICES.filter(v => { try { return v.c(p); } catch (e) { return false; } });
  p.voice = opts.length ? pick(opts).t : 'ふんふ〜ん♪'; p.voiceT = RT.time;
  return p.voice;
}
// 実績のチェック（追加分）
function extraAchievements() {
  for (const a of ACHIEVEMENTS) if (a.c && !G.ach[a.id]) { let ok = false; try { ok = a.c(); } catch (e) { } if (ok) unlockAch(a.id); }
}
function updateExtras(dt, dtReal) {
  updateSalute(dtReal); updateBirds(dtReal); updateWindsocks(); updateBusArrivals(dt); updateSpotters();
}
