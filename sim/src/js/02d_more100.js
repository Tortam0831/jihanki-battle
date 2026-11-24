// ============================================================
//  追加データ その3（100個）
//  建物30・機材4・航空会社4・都市20・お客さん6・開発10・組み合わせ10・実績10・イベント4（13c）・つぶやき2（13c）
// ============================================================

// ---------- 建物：飲食 8 ----------
const MORE3_FOODS = [
  ['kushikatsu', '串カツ屋', 2, 2, 260000, 1300, 6, 12, 3, 'beer', ['food', 'fun']],
  ['monja', 'もんじゃ焼き', 2, 2, 270000, 1200, 6, 15, 3, 'food', ['food']],
  ['tantan', '担々麺の店', 2, 2, 250000, 1000, 6, 12, 2, 'ramen', ['food']],
  ['bagel', 'ベーグルカフェ', 2, 1, 180000, 600, 3, 4, 2, 'bread', ['food', 'rest']],
  ['dimsum', '飲茶（点心）', 3, 2, 480000, 1900, 8, 18, 4, 'dumpling', ['food']],
  ['gelato', 'ジェラート', 1, 1, 120000, 500, 2, 3, 2, 'icecream', ['food', 'fun']],
  ['steakbento', '牛たん弁当', 2, 1, 200000, 1500, 3, 3, 3, 'bento', ['food', 'shop']],
  ['skybar', 'スカイバー', 3, 2, 900000, 3500, 8, 25, 6, 'beer', ['food', 'rest']],
];
for (const [id, name, w, h, cost, price, cap, svc, rank, icon, needs] of MORE3_FOODS)
  defB(id, { cat: 'food', name, kind: 'svc', need: needs[0], need2: needs[1], zone: 'term', w, h, cost, price, cap, svc, rank, icon, upkeep: Math.round(cost * 0.006 / 100) * 100, inside: true, desc: `売上：1人 約${fmtNum(price)}円` });
B.skybar.likes = ['biz', 'couple', 'musician']; B.steakbento.likes = ['biz', 'foodie'];

// ---------- 建物：ショップ 8 ----------
const MORE3_SHOPS = [
  ['pottery', '焼き物の店', 2, 2, 380000, 3200, 4, 'gift'],
  ['kendama', 'けん玉・こま店', 2, 1, 160000, 900, 2, 'ball'],
  ['fishingshop', '釣り具店', 2, 2, 300000, 2600, 3, 'fish'],
  ['tea2', '紅茶専門店', 2, 1, 220000, 1700, 3, 'cafe'],
  ['bookstore2', '旅の本とガイドブック', 2, 2, 200000, 1100, 2, 'book'],
  ['plushie', 'ぬいぐるみ店', 2, 2, 260000, 1800, 3, 'bear'],
  ['umbrella', '傘と雨具の店', 2, 1, 140000, 1500, 2, 'rain'],
  ['luxwatch2', '高級万年筆の店', 2, 1, 900000, 9000, 7, 'star'],
];
for (const [id, name, w, h, cost, price, rank, icon] of MORE3_SHOPS)
  defB(id, { cat: 'shop', name, kind: 'svc', need: 'shop', zone: 'term', w, h, cost, price, cap: Math.max(2, w * h), svc: 6, rank, icon, upkeep: Math.round(cost * 0.006 / 100) * 100, inside: true, rich: id === 'luxwatch2', desc: `売上：1人 約${fmtNum(price)}円` + (id === 'umbrella' ? '。雨の日は売上2倍。' : '') });
B.fishingshop.likes = ['fisher']; B.kendama.likes = ['kid', 'foreign']; B.plushie.likes = ['kid', 'couple', 'family'];

// ---------- 建物：サービス 5 ----------
defB('sleeppod', { cat: 'svc', name: '仮眠ポッド', kind: 'svc', need: 'rest', zone: 'term', w: 2, h: 1, cap: 2, svc: 25, price: 1500, cost: 300000, upkeep: 1000, rank: 3, inside: true, likes: ['biz', 'backpack', 'medic'], icon: 'zzz', desc: '横になって少しだけ眠れるカプセル。' });
defB('workspace', { cat: 'svc', name: 'コワーキングスペース', kind: 'svc', need: 'rest', zone: 'term', w: 3, h: 2, cap: 8, svc: 30, price: 1000, cost: 500000, upkeep: 1800, rank: 4, inside: true, likes: ['biz', 'student', 'reporter', 'scientist'], icon: 'board', desc: 'パソコンで仕事ができる。ビジネス客がよろこぶ。' });
defB('petroom', { cat: 'svc', name: 'ペットホテル', kind: 'svc', need: 'rest', zone: 'term', w: 2, h: 2, cap: 4, svc: 12, price: 2000, cost: 350000, upkeep: 1400, rank: 3, inside: true, likes: ['petowner'], icon: 'heart', desc: '旅行のあいだ、ペットをあずかる。' });
defB('prayerhall', { cat: 'svc', name: '展望ロビー', kind: 'svc', need: 'fun', need2: 'rest', zone: 'term', w: 4, h: 2, cap: 16, svc: 15, price: 0, cost: 700000, upkeep: 1500, rank: 4, beauty: 4, likes: ['maniac', 'kid', 'elder', 'photog'], icon: 'binocular', desc: 'ターミナルの中から飛行機が見える大きな窓。無料。' });
defB('infodesk2', { cat: 'svc', name: '多言語案内カウンター', kind: 'aura', zone: 'term', w: 2, h: 1, cost: 200000, upkeep: 900, rank: 4, aura: 7, likes: ['foreign', 'abroad', 'diplomat'], icon: 'info', desc: 'いろいろな言葉で案内できる。海外のお客さんの満足度アップ。' });

// ---------- 建物：空側 3 ----------
defB('cargo2', { cat: 'air', name: '大型貨物上屋', kind: 'cargo', zone: 'air', w: 5, h: 3, cost: 3000000, upkeep: 8000, rank: 6, icon: 'cargo', desc: '貨物ターミナルと同じ効果。大きな荷物もたくさん扱える。' });
defB('rescue', { cat: 'air', name: '救難ヘリ基地', kind: 'decor', zone: 'air', w: 3, h: 3, cost: 1200000, upkeep: 3000, rank: 5, beauty: 1, icon: 'heli', desc: '海や山で困った人を助けに行くヘリの基地。空港の安心感アップ（評価 +0.05）。' });
defB('glidepath', { cat: 'air', name: '進入灯', kind: 'decor', zone: 'air', w: 1, h: 3, cost: 150000, upkeep: 500, rank: 3, lamp: true, icon: 'lamp', desc: '滑走路の手前に置く、夜に光る進入灯。本物らしさアップ。' });

// ---------- 建物：陸側 3 ----------
defB('ferryport', { cat: 'land', name: '船着き場', kind: 'access', zone: 'land', w: 4, h: 2, cost: 1500000, upkeep: 4000, access: 70, rank: 5, unique: true, icon: 'fish', desc: '港から船で来る人の入口。' });
defB('campsite', { cat: 'land', name: 'キャンプ場', kind: 'svc', need: 'fun', zone: 'land', w: 4, h: 3, cap: 16, svc: 25, price: 1500, cost: 1200000, upkeep: 3000, rank: 4, visitor: true, beauty: 3, likes: ['hiker', 'family', 'fisher'], icon: 'leaf', desc: '空港のとなりで飛行機を見ながらキャンプ。' });
defB('aviationpark', { cat: 'land', name: 'ヒコーキの丘公園', kind: 'decor', zone: 'land', w: 4, h: 4, cost: 900000, upkeep: 1500, rank: 3, beauty: 10, visitor: true, icon: 'binocular', desc: '滑走路を見わたせる丘。見学のお客さんが増える。' });

// ---------- 建物：かざり 3 ----------
defB('lavender', { cat: 'deco', name: 'ラベンダー畑', kind: 'decor', zone: 'land', w: 2, h: 2, cost: 45000, beauty: 4, seasonBoost: 1, icon: 'flower', desc: '夏は美しさ2倍。' });
defB('snowlantern', { cat: 'deco', name: '雪灯籠', kind: 'decor', zone: 'any', cost: 40000, beauty: 2.5, seasonBoost: 3, lamp: true, icon: 'lantern', desc: '冬は美しさ2倍。夜にあかりがともる。' });
defB('planestatue', { cat: 'deco', name: '名機のモニュメント', kind: 'decor', zone: 'any', w: 3, h: 3, cost: 1500000, beauty: 14, rank: 7, icon: 'plane2', desc: '昔の名機を台の上にかざったモニュメント。' });
for (const id of Object.keys(B)) if (!BUILD_ORDER.includes(id)) BUILD_ORDER.push(id);

// ---------- 機材 4（実在機・メーカー名は変えてある） ----------
Object.assign(PLANES, {
  do228:   { name: 'ドルニエ 228', maker: 'ドルニエ', cls: 1, seats: 19, lenM: 16.6, spanM: 17.0, dia: 1.9, eng: 'prop', engines: 2, wing: 'high', tail: 'conv', gear: 'fixed', tip: 'none', vapp: 85, turn: 20, fee: 38000, rank: 1, desc: '四角い胴体の小さなプロペラ機。島の短い滑走路が得意。' },
  e195e2:  { name: 'エンブラエル E195-E2', maker: 'エンブラエル', cls: 2, seats: 132, lenM: 41.5, spanM: 35.1, dia: 3.0, eng: 'jet', engines: 2, wing: 'low', tail: 'conv', gear: 'retract', tip: 'raked', vapp: 132, turn: 38, fee: 175000, rank: 4, desc: '細長い胴体の新しいリージョナルジェット。' },
  b752:    { name: 'ボーリング 757-200', maker: 'ボーリング', cls: 2, seats: 200, lenM: 47.3, spanM: 38.1, dia: 3.76, eng: 'jet', engines: 2, wing: 'low', tail: 'conv', gear: 'retract', tip: 'blended', vapp: 135, turn: 45, fee: 280000, rank: 5, desc: '長い脚と細い胴体が特徴の、力持ちの単通路機。' },
  a339:    { name: 'エアブロー A330-900neo', maker: 'エアブロー', cls: 3, seats: 300, lenM: 63.7, spanM: 64.0, dia: 5.64, eng: 'jet', engines: 2, wing: 'low', tail: 'conv', gear: 'retract', tip: 'sharklet', vapp: 137, turn: 60, fee: 490000, rank: 6, wide: true, desc: 'A330の新しい型。長くなった翼が目印。' },
});
for (const P of Object.values(PLANES)) { P.len = P.lenM / TILE_M; P.span = P.spanM / TILE_M; }

// ---------- 都市 20 ----------
Object.assign(CITIES, {
  monbetsu:    { name: '紋別', region: 'dom', demand: 1, rank: 2 },
  odate:       { name: '大館能代', region: 'dom', demand: 1, rank: 2 },
  fukushima:   { name: '福島', region: 'dom', demand: 2, rank: 2 },
  iwami:       { name: '石見', region: 'dom', demand: 1, rank: 2 },
  kitakyushu:  { name: '北九州', region: 'dom', demand: 3, rank: 3 },
  tokunoshima: { name: '徳之島', region: 'dom', demand: 1, rank: 2, island: true },
  qingdao:     { name: '青島', region: 'asia', demand: 3, rank: 5 },
  dalian:      { name: '大連', region: 'asia', demand: 3, rank: 5 },
  cheongju:    { name: '清州', region: 'asia', demand: 2, rank: 4 },
  kathmandu:   { name: 'カトマンズ', region: 'asia', demand: 2, rank: 7 },
  siemreap:    { name: 'シェムリアップ', region: 'asia', demand: 2, rank: 6, resort: true },
  male:        { name: 'マレ（モルディブ）', region: 'asia', demand: 2, rank: 7, resort: true },
  tashkent:    { name: 'タシケント', region: 'asia', demand: 2, rank: 7 },
  nairobi:     { name: 'ナイロビ', region: 'long', demand: 2, rank: 9 },
  cairo:       { name: 'カイロ', region: 'long', demand: 3, rank: 8 },
  madrid:      { name: 'マドリード', region: 'long', demand: 3, rank: 8 },
  munich:      { name: 'ミュンヘン', region: 'long', demand: 3, rank: 8 },
  boston:      { name: 'ボストン', region: 'long', demand: 3, rank: 8 },
  toronto:     { name: 'トロント', region: 'long', demand: 3, rank: 8 },
  lima:        { name: 'リマ', region: 'long', demand: 2, rank: 9 },
});
AIRLINES.soyokaze.fleet.unshift('do228'); AIRLINES.soyokaze.cities.push('tokunoshima', 'iwami');
AIRLINES.north.cities.push('monbetsu', 'odate'); AIRLINES.haruka.cities.push('fukushima', 'kitakyushu');
AIRLINES.haruka.fleet.push('b752'); AIRLINES.sakura.cities.push('qingdao', 'dalian', 'kathmandu');
AIRLINES.eagle.cities.push('boston', 'toronto'); AIRLINES.aurora.cities.push('madrid', 'munich');

// ---------- 航空会社 4（すべて架空） ----------
Object.assign(AIRLINES, {
  yukiguni: { name: 'ゆきぐにエア', code: 'YK', body: '#ffffff', tail: '#8fdcf4', accent: '#3a7bd5', fleet: ['do228', 'atr42', 'e195e2'], rank: 2, cities: ['monbetsu', 'odate', 'hanamaki', 'shonai', 'akita', 'yamagata', 'fukushima'], desc: '雪国の町をむすぶ、白い機体の航空会社。' },
  kanmon:   { name: 'かんもんエクスプレス', code: 'KM', body: '#ffffff', tail: '#3e8a3c', accent: '#ffd84a', fleet: ['e195e2', 'a320', 'b752'], rank: 4, lcc: true, cities: ['kitakyushu', 'tokyo', 'osaka', 'naha', 'cheongju', 'qingdao', 'dalian'], desc: '九州の玄関口から近くのアジアへ飛ぶLCC。' },
  himalaya: { name: 'ヒマラヤ・シルクロード航空', code: 'HS', body: '#fff8f0', tail: '#d8a020', accent: '#9a2f4a', fleet: ['b752', 'a339', 'a321xlr'], rank: 7, cities: ['kathmandu', 'tashkent', 'delhi', 'colombo', 'male', 'ulaanbaatar'], desc: '山と砂漠の国々をめぐる航空会社。' },
  savanna:  { name: 'サバンナ・ワールド航空', code: 'SV', body: '#ffffff', tail: '#c0702a', accent: '#2a2a36', fleet: ['a339', 'b78x', 'b779'], rank: 9, cities: ['nairobi', 'cairo', 'lima', 'saopaulo', 'madrid', 'munich', 'boston', 'toronto'], desc: '世界のはしからはしまで飛ぶ長距離の航空会社。' },
});

// ---------- お客さん 6 ----------
Object.assign(PAX, {
  fisher:    { name: '釣り人', speed: 0.95, money: 1.0, needs: { food: .6, shop: .5, toilet: .5, rest: .4, fun: .2 }, desc: '大きな竿ケースを持って島へ。釣り具店があるとうれしい。' },
  chef:      { name: '料理人', speed: 1.05, money: 1.4, needs: { food: .9, shop: .6, toilet: .3, rest: .3, fun: .1 }, desc: '食材の買いつけ旅行。おいしいお店にきびしい。' },
  reporter:  { name: '記者', speed: 1.2, money: 1.1, needs: { food: .5, shop: .2, toilet: .4, rest: .6, fun: .2 }, desc: '取材でいそがしい。コワーキングスペースが好き。' },
  scientist: { name: '研究者', speed: 1.0, money: 1.2, needs: { food: .5, shop: .3, toilet: .3, rest: .6, fun: .3 }, desc: '学会に向かう途中。本屋と静かな場所が好き。' },
  monk:      { name: 'お坊さん', speed: 0.9, money: 0.8, needs: { food: .5, shop: .2, toilet: .4, rest: .7, fun: .1 }, desc: '修行の旅。静かな庭があると心がやすらぐ。' },
  dancer:    { name: 'ダンサー', speed: 1.15, money: 1.2, needs: { food: .5, shop: .6, toilet: .3, rest: .3, fun: .8 }, desc: '公演ツアー中。カラオケで歌うのも好き。' },
});
MIX.island.fisher = 5; MIX.resort.fisher = 2; MIX.asia.chef = 3; MIX.dom.chef = 1; MIX.dom.reporter = 2; MIX.long.reporter = 2;
MIX.long.scientist = 3; MIX.asia.scientist = 2; MIX.dom.monk = 1; MIX.asia.monk = 2; MIX.lcc.dancer = 2; MIX.long.dancer = 1;
Object.assign(PAX_LOOKS, {
  fisher:    { hair: ['cap'], top: ['#6a7a5a', '#f39a3c', '#3a5080'], bottom: ['#5a4a3a', '#4a4a58'], acc: ['board', 'bigpack'] },
  chef:      { hair: ['short', 'bun'], top: ['#ffffff'], bottom: ['#2a2a36', '#4a4a58'], acc: ['bag', 'suitcase'], hat: 0.6 },
  reporter:  { hair: ['short', 'long'], top: ['#4a4a58', '#a0683c', '#3a5080'], bottom: ['#2a2a36', '#3a4a7a'], acc: ['camera', 'briefcase'], glasses: 'normal' },
  scientist: { hair: ['short', 'bald', 'long'], hairc: ['#b0b0b8', '#2a1e1a', '#a06a3a'], top: ['#ffffff', '#e8e8f0'], bottom: ['#3a4a7a', '#4a4a58'], acc: ['briefcase', 'bag'], glasses: 'normal' },
  monk:      { hair: ['bald'], top: ['#2a2a36', '#a0683c', '#f39a3c'], bottom: ['#2a2a36', '#a0683c'], acc: ['bag', 'none'] },
  dancer:    { hair: ['pony', 'long', 'short'], hairc: ['#2a1e1a', '#c04030', '#e8d080', '#9a62d0'], top: ['#ff4080', '#40e0ff', '#ffd84a'], bottom: ['#2a2a36', '#ffffff'], skirt: 0.4, acc: ['bigpack', 'suitcase'] },
});

// ---------- 開発 10 ----------
RESEARCH.push(
  { id: 'rapidexit', name: '高速脱出誘導路の設計', icon: 'runway', dev: 45, cost: 3000000, rank: 4, desc: '着陸した飛行機が早く滑走路を出られる（滑走路の使用時間 -15%）。発着をたくさんさばける' },
  { id: 'aman', name: '到着管理システム（AMAN）', icon: 'tower', dev: 55, cost: 4000000, rank: 5, desc: '管制塔が着陸の順番をもっと上手に決める（待機経路での待ち時間を短く）' },
  { id: 'fasttug', name: '電動トーイングカー', icon: 'cargo', dev: 30, cost: 1500000, rank: 3, desc: 'プッシュバックが速くなる（+30%）' },
  { id: 'rainshop', name: '雨の日フェア', icon: 'rain', dev: 20, cost: 800000, rank: 2, desc: '雨・雪の日のお店の売上 +15%' },
  { id: 'chefsel', name: '有名シェフのお店', icon: 'fork', dev: 40, cost: 2500000, rank: 5, desc: 'レストラン系の売上 +10%（ステーキ・料亭・スカイバーなど）' },
  { id: 'kidsmenu', name: 'お子さまメニュー', icon: 'onigiri', dev: 20, cost: 800000, rank: 2, desc: '子どもの満足度 +4' },
  { id: 'quietzone', name: '静かなエリア', icon: 'zzz', dev: 25, cost: 1200000, rank: 3, desc: 'お年寄り・研究者・お坊さんの満足度 +4' },
  { id: 'nightlight', name: 'ライトアップ演出', icon: 'moon', dev: 30, cost: 2000000, rank: 4, desc: '夜の見学客 +25%' },
  { id: 'airportmap', name: '空港アプリの地図', icon: 'globe', dev: 30, cost: 1500000, rank: 3, desc: '迷わなくなる。海外のお客さん・お年寄りの満足度 +3' },
  { id: 'groundsys', name: '地上走行支援システム', icon: 'taxiway', dev: 50, cost: 3500000, rank: 5, desc: '誘導路を走る速さ +15%' },
);
for (const r of RESEARCH) RESEARCH_BY[r.id] = r;

// ---------- 組み合わせ 10 ----------
COMBOS.push(
  { id: 'osakafood', name: 'なにわの味', need: ['kushikatsu', 'takoyaki'], bonus: 0.3, desc: '串カツとたこ焼き。売上+30%' },
  { id: 'tsukishima', name: '下町グルメ', need: ['monja', 'okonomi'], bonus: 0.25, desc: 'もんじゃとお好み焼き。売上+25%' },
  { id: 'chinatown', name: '中華街', need: [['dimsum', 'chinese', 'tantan', 'gyoza'], 3], bonus: 0.35, desc: '中華のお店が3つ。売上+35%' },
  { id: 'cafebreak', name: 'ひと休みカフェ', need: ['bagel', 'tea2'], bonus: 0.25, desc: 'ベーグルと紅茶。売上+25%' },
  { id: 'nightview', name: '夜景ラウンジ', need: ['skybar', 'prayerhall'], bonus: 0.3, desc: 'スカイバーと展望ロビー。夜に大人気' },
  { id: 'craftstreet', name: '職人通り', need: [['pottery', 'craft', 'kimono', 'kendama'], 3], bonus: 0.3, desc: '日本の手しごとが3つ。海外のお客さんが大よろこび' },
  { id: 'kidsheaven', name: 'こどもの国', need: ['plushie', 'toy', 'kidsroom'], bonus: 0.3, desc: 'ぬいぐるみ・おもちゃ・キッズルーム' },
  { id: 'anglers', name: '釣り人の港', need: ['fishingshop', 'fishmarket'], bonus: 0.3, desc: '釣り具と海産物。売上+30%' },
  { id: 'officehub', name: 'ビジネスハブ', need: ['workspace', 'sleeppod', 'charging'], bonus: 0.25, desc: '働く・眠る・充電する。ビジネス客が大満足' },
  { id: 'sendaiset', name: 'みやげの定番', need: ['steakbento', 'souvenir'], bonus: 0.25, desc: '牛たん弁当とおみやげ屋。売上+25%' },
);

// ---------- 実績 10 ----------
ACHIEVEMENTS.push(
  { id: 'cloud1', name: 'クラウドの相棒', desc: 'セーブコードを発行した', icon: 'save', c: () => !!(G.cloud && G.cloud.key) },
  { id: 'land20', name: '大地主', desc: '土地を20区画持った', icon: 'flag', c: () => G.sectors.reduce((a, v) => a + v, 0) >= 20 },
  { id: 'land50', name: '島ぜんぶが空港', desc: '土地を50区画持った', icon: 'flag', c: () => G.sectors.reduce((a, v) => a + v, 0) >= 50 },
  { id: 'nohold', name: '完璧な管制', desc: '1日10便以上で、上空待機0回の日', icon: 'tower', c: () => RT.lastDay && RT.lastDay.flights >= 10 && (RT.lastDay.holds || 0) === 0 },
  { id: 'oneway10', name: '交通整理', desc: '一方通行の矢印を10マスぬった', icon: 'taxiway', c: () => !!G.oneway && G.oneway.reduce((a, v) => a + (v ? 1 : 0), 0) >= 10 },
  { id: 'autotaxi', name: 'おまかせ誘導路', desc: '誘導路の自動接続を使った', icon: 'taxiway', c: () => !!G.flags.autoTaxi },
  { id: 'speed16', name: '時間の旅人', desc: '16倍速で遊んだ', icon: 'clock', c: () => Game.speed >= 16 },
  { id: 'stand30', name: '翼の森', desc: '駐機場を30か所にした', icon: 'stand', c: () => countKind('stand') >= 30 },
  { id: 'world', name: '世界の果てまで', desc: 'ナイロビ・リマ・マレのどれかへ路線を開いた', icon: 'globe', c: () => G.routes.some(r => ['nairobi', 'lima', 'male'].includes(r.city)) },
  { id: 'paxtype40', name: '人種のるつぼ', desc: '40種類のお客さんが来た', icon: 'people', c: () => Object.keys(G.seenPax).length >= 40 },
);
