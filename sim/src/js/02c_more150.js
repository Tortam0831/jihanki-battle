// ============================================================
//  追加データ その2（150個）
//  建物40・機材6・航空会社6・都市25・お客さん8・開発12・組み合わせ15・実績20・イベント8・つぶやき10
// ============================================================

// ---------- 建物：飲食 10 ----------
const MORE2_FOODS = [
  ['yakitori', '焼き鳥屋', 2, 2, 240000, 1300, 6, 14, 3, 'beer', ['food', 'fun']],
  ['tempura', '天ぷら屋', 2, 2, 320000, 1800, 6, 16, 4, 'fork', ['food']],
  ['kaisendon', '海鮮丼の店', 2, 2, 380000, 2200, 6, 14, 4, 'sushi', ['food']],
  ['hotdog', 'ホットドッグ屋台', 1, 1, 90000, 500, 2, 3, 1, 'burger', ['food']],
  ['taiyaki', 'たい焼き屋', 1, 1, 100000, 300, 2, 3, 1, 'cake', ['food']],
  ['tapioca', 'タピオカドリンク', 1, 1, 120000, 550, 2, 3, 2, 'cafe', ['food', 'fun']],
  ['gyoza', '餃子専門店', 2, 2, 250000, 900, 6, 10, 3, 'dumpling', ['food']],
  ['pancake', 'パンケーキカフェ', 2, 2, 300000, 1200, 6, 15, 3, 'cake', ['food', 'rest']],
  ['kebab', 'ケバブスタンド', 1, 1, 110000, 700, 2, 4, 2, 'food', ['food']],
  ['soupcurry', 'スープカレー', 2, 2, 280000, 1300, 6, 14, 3, 'curry', ['food']],
];
for (const [id, name, w, h, cost, price, cap, svc, rank, icon, needs] of MORE2_FOODS)
  defB(id, { cat: 'food', name, kind: 'svc', need: needs[0], need2: needs[1], zone: 'term', w, h, cost, price, cap, svc, rank, icon, upkeep: Math.round(cost * 0.006 / 100) * 100, inside: true, desc: `売上：1人 約${fmtNum(price)}円` + (w * h === 1 ? '。1マスで置ける小さな屋台。' : '') });

// ---------- 建物：ショップ 10 ----------
const MORE2_SHOPS = [
  ['kimono', '和小物・着物の店', 2, 2, 420000, 3200, 4, 'shirt'],
  ['gamestore', 'ゲームショップ', 2, 2, 380000, 2600, 3, 'game'],
  ['anime', 'アニメグッズ店', 2, 2, 350000, 2200, 3, 'mascot'],
  ['outdoor', 'アウトドア用品店', 3, 2, 450000, 2800, 4, 'leaf'],
  ['perfumeshop', '香水の店', 2, 1, 400000, 4200, 5, 'perfume'],
  ['simcounter', 'Wi-Fi・SIMカウンター', 2, 1, 160000, 1500, 3, 'wifi'],
  ['chocolate', 'チョコレート専門店', 2, 1, 260000, 1900, 3, 'cake'],
  ['fishmarket', '海産物の店', 2, 2, 300000, 2400, 3, 'fish'],
  ['craft', '伝統工芸の店', 2, 2, 360000, 3000, 4, 'star'],
  ['sneaker', 'スニーカーショップ', 2, 2, 420000, 3400, 5, 'ball'],
];
for (const [id, name, w, h, cost, price, rank, icon] of MORE2_SHOPS)
  defB(id, { cat: 'shop', name, kind: 'svc', need: 'shop', zone: 'term', w, h, cost, price, cap: Math.max(2, w * h), svc: 6, rank, icon, upkeep: Math.round(cost * 0.006 / 100) * 100, inside: true, desc: `売上：1人 約${fmtNum(price)}円` + (id === 'simcounter' ? '。海外のお客さんに人気。' : '') });
B.simcounter.likes = ['foreign', 'abroad', 'backpack']; B.fishmarket.likes = ['tourist', 'foodie']; B.anime.likes = ['student', 'cosplay', 'gamer', 'foreign']; B.gamestore.likes = ['kid', 'student', 'gamer'];
B.outdoor.likes = ['hiker', 'golfer', 'skier']; B.kimono.likes = ['foreign', 'tourist', 'couple']; B.craft.likes = ['foreign', 'elder', 'ohenro'];

// ---------- 建物：サービス 8 ----------
defB('charging', { cat: 'svc', name: '充電スタンド', kind: 'aura', zone: 'term', w: 1, h: 1, cost: 50000, upkeep: 200, aura: 3, likes: ['biz', 'student', 'gamer'], icon: 'wifi', desc: 'スマホを充電できる。まわりの人の満足度が少し上がる。' });
defB('barber', { cat: 'svc', name: '理容室', kind: 'svc', need: 'rest', zone: 'term', w: 2, h: 2, cap: 3, svc: 18, price: 1800, cost: 300000, upkeep: 1200, rank: 3, inside: true, likes: ['biz', 'elder', 'diplomat'], icon: 'sofa', desc: '出張前にさっぱり。' });
defB('nailsalon', { cat: 'svc', name: 'ネイルサロン', kind: 'svc', need: 'fun', zone: 'term', w: 2, h: 1, cap: 2, svc: 15, price: 2800, cost: 280000, upkeep: 1100, rank: 4, inside: true, likes: ['couple', 'idol', 'cosplay'], icon: 'cosme', desc: '旅の前におしゃれを。' });
defB('clinic', { cat: 'svc', name: '空港クリニック', kind: 'svc', need: 'rest', zone: 'term', w: 2, h: 2, cap: 3, svc: 15, price: 1500, cost: 500000, upkeep: 2500, rank: 4, inside: true, likes: ['elder', 'babyc', 'medic'], icon: 'firstaid', desc: '旅先での急な病気も安心。お年寄りの満足度アップ。' });
defB('karaoke', { cat: 'svc', name: 'カラオケボックス', kind: 'svc', need: 'fun', zone: 'term', w: 3, h: 2, cap: 8, svc: 25, price: 1200, cost: 500000, upkeep: 2000, rank: 4, inside: true, likes: ['student', 'idol', 'cosplay'], icon: 'note', desc: '待ち時間に1曲。' });
defB('flightsim', { cat: 'svc', name: 'フライトシミュレーター', kind: 'svc', need: 'fun', zone: 'term', w: 2, h: 2, cap: 2, svc: 14, price: 3000, cost: 1200000, upkeep: 4000, rank: 6, inside: true, likes: ['maniac', 'kid', 'gamer'], icon: 'plane2', desc: '本物そっくりの操縦席でパイロット気分。' });
defB('spa', { cat: 'svc', name: '天然温泉スパ', kind: 'svc', need: 'rest', need2: 'fun', zone: 'term', w: 3, h: 3, cap: 12, svc: 40, price: 2500, cost: 2500000, upkeep: 7000, rank: 6, beauty: 3, inside: true, likes: ['elder', 'foreign', 'golfer', 'skier'], icon: 'onsen', desc: '空港の中で温泉。長旅のつかれが吹き飛ぶ。' });
defB('nursery', { cat: 'svc', name: '一時保育ルーム', kind: 'svc', need: 'fun', zone: 'term', w: 2, h: 2, cap: 6, svc: 20, price: 800, cost: 350000, upkeep: 1600, rank: 3, likes: ['babyc', 'family', 'kid'], icon: 'balloon', desc: 'あずけている間に、おとなはゆっくり買い物。' });

// ---------- 建物：空側 4 ----------
defB('apronlight', { cat: 'air', name: 'エプロン照明塔', kind: 'decor', zone: 'air', w: 1, h: 1, cost: 60000, upkeep: 300, beauty: 0.5, lamp: true, rank: 2, icon: 'lamp', desc: '駐機場を明るく照らす背の高いライト。夜の空港がぐっと本物らしく。' });
defB('blastfence', { cat: 'air', name: 'ブラストフェンス', kind: 'decor', zone: 'air', w: 3, h: 1, cost: 80000, upkeep: 200, rank: 3, icon: 'flag', desc: 'ジェットエンジンの風を上にそらす壁。滑走路の端に置くと本物らしい。' });
defB('mro', { cat: 'air', name: '大型整備工場', kind: 'hangar', zone: 'air', w: 5, h: 4, cost: 3500000, upkeep: 9000, rank: 6, icon: 'hangar', desc: '格納庫と同じ効果。大型機も入れる大きな整備場。' });
defB('wxstation', { cat: 'air', name: '気象観測所', kind: 'radar', zone: 'air', w: 2, h: 1, cost: 900000, upkeep: 2500, rank: 5, icon: 'thermo', desc: '気象レーダーと同じく、天気予報が2日先までわかる。小さくて置きやすい。' });

// ---------- 建物：陸側 4 ----------
defB('bizhotel', { cat: 'land', name: 'ビジネスホテル', kind: 'hotel', zone: 'land', w: 3, h: 2, cost: 1600000, upkeep: 4500, rank: 3, income: 0.55, icon: 'bed', desc: '小さめのホテル。毎日、乗客数に応じた宿泊収入。' });
defB('resorthotel', { cat: 'land', name: 'リゾートホテル', kind: 'hotel', zone: 'land', w: 5, h: 4, cost: 7000000, upkeep: 14000, rank: 7, income: 1.8, beauty: 4, icon: 'palm', desc: 'プール付きの高級ホテル。宿泊収入がとても多い。' });
defB('cyclestand', { cat: 'land', name: 'レンタサイクル', kind: 'access', zone: 'land', w: 2, h: 1, cost: 80000, upkeep: 300, access: 15, icon: 'ball', likes: ['student', 'backpack', 'abroad'], desc: '小さな入口。自転車で来る人がいる。' });
defB('ropeway', { cat: 'land', name: 'ロープウェイ乗り場', kind: 'access', zone: 'land', w: 4, h: 3, cost: 6000000, upkeep: 9000, access: 160, rank: 7, unique: true, beauty: 5, icon: 'ferris', desc: '山の上の町とつながるロープウェイ。景色もよい入口。' });

// ---------- 建物：かざり 4 ----------
defB('tulip', { cat: 'deco', name: 'チューリップ畑', kind: 'decor', zone: 'land', w: 2, h: 1, cost: 30000, beauty: 3, seasonBoost: 0, icon: 'flower', desc: '春は美しさ2倍。' });
defB('cosmos', { cat: 'deco', name: 'コスモス畑', kind: 'decor', zone: 'land', w: 2, h: 2, cost: 40000, beauty: 4, seasonBoost: 2, icon: 'flower', desc: '秋は美しさ2倍。' });
defB('torii', { cat: 'deco', name: '鳥居', kind: 'decor', zone: 'any', w: 1, h: 1, cost: 150000, beauty: 5, rank: 3, icon: 'flag', desc: '空の旅の安全を願って。海外のお客さんの撮影スポット。' });
defB('windmill', { cat: 'deco', name: '風車', kind: 'decor', zone: 'land', w: 2, h: 2, cost: 400000, beauty: 7, rank: 4, icon: 'windsock', desc: 'くるくる回る大きな風車。' });
for (const id of Object.keys(B)) if (!BUILD_ORDER.includes(id)) BUILD_ORDER.push(id);

// ---------- 機材 6（実在機・メーカー名は変えてある） ----------
Object.assign(PLANES, {
  saab340: { name: 'サーブ 340B', maker: 'サーブ', cls: 1, seats: 36, lenM: 19.7, spanM: 21.4, dia: 2.3, eng: 'prop', engines: 2, wing: 'low', tail: 'conv', gear: 'retract', tip: 'none', vapp: 100, turn: 22, fee: 45000, rank: 1, desc: '低い翼のかわいい小型プロペラ機。島の路線で活躍。' },
  a319:    { name: 'エアブロー A319neo', maker: 'エアブロー', cls: 2, seats: 140, lenM: 33.8, spanM: 35.8, dia: 3.95, eng: 'jet', engines: 2, wing: 'low', tail: 'conv', gear: 'retract', tip: 'sharklet', vapp: 132, turn: 38, fee: 170000, rank: 3, desc: 'A320を短くした型。ずんぐりした胴体が目印。' },
  c919:    { name: 'コマック C919', maker: 'コマック', cls: 2, seats: 158, lenM: 38.9, spanM: 35.8, dia: 3.96, eng: 'jet', engines: 2, wing: 'low', tail: 'conv', gear: 'retract', tip: 'blended', vapp: 136, turn: 40, fee: 185000, rank: 5, desc: '中国生まれの新しい小型ジェット機。' },
  a321xlr: { name: 'エアブロー A321XLR', maker: 'エアブロー', cls: 2, seats: 200, lenM: 44.5, spanM: 35.8, dia: 3.95, eng: 'jet', engines: 2, wing: 'low', tail: 'conv', gear: 'retract', tip: 'sharklet', vapp: 142, turn: 45, fee: 290000, rank: 6, desc: '細い胴体なのに長い距離を飛べる。遠くのアジアの都市へ。' },
  b744:    { name: 'ボーリング 747-400', maker: 'ボーリング', cls: 3, seats: 416, lenM: 70.7, spanM: 64.4, dia: 6.5, eng: 'jet', engines: 4, wing: 'low', tail: 'conv', gear: 'retract', tip: 'blended', vapp: 150, turn: 85, fee: 680000, rank: 7, wide: true, hump: true, desc: '「ジャンボ」の愛称で親しまれた4発機。2階席のこぶが目印。' },
  b779:    { name: 'ボーリング 777-9', maker: 'ボーリング', cls: 3, seats: 420, lenM: 76.7, spanM: 71.8, dia: 6.2, eng: 'jet', engines: 2, wing: 'low', tail: 'conv', gear: 'retract', tip: 'raked', vapp: 150, turn: 75, fee: 720000, rank: 9, wide: true, bigEng: true, desc: '翼の先が折りたためる、最新の大型双発機。' },
});
for (const P of Object.values(PLANES)) { P.len = P.lenM / TILE_M; P.span = P.spanM / TILE_M; }

// ---------- 都市 25 ----------
Object.assign(CITIES, {
  memanbetsu: { name: '女満別', region: 'dom', demand: 2, rank: 2 },
  hanamaki:   { name: '花巻', region: 'dom', demand: 2, rank: 2 },
  shonai:     { name: '庄内', region: 'dom', demand: 2, rank: 2 },
  noto:       { name: '能登', region: 'dom', demand: 1, rank: 2 },
  tottori:    { name: '鳥取', region: 'dom', demand: 2, rank: 2 },
  yonago:     { name: '米子', region: 'dom', demand: 2, rank: 3 },
  saga:       { name: '佐賀', region: 'dom', demand: 2, rank: 3 },
  oita:       { name: '大分', region: 'dom', demand: 3, rank: 3, resort: true },
  tsushima:   { name: '対馬', region: 'dom', demand: 1, rank: 1, island: true },
  tanegashima:{ name: '種子島', region: 'dom', demand: 1, rank: 2, island: true },
  chengdu:    { name: '成都', region: 'asia', demand: 4, rank: 6 },
  xian:       { name: '西安', region: 'asia', demand: 3, rank: 6 },
  phuket:     { name: 'プーケット', region: 'asia', demand: 3, rank: 6, resort: true },
  bali:       { name: 'バリ島', region: 'asia', demand: 4, rank: 6, resort: true },
  hochiminh:  { name: 'ホーチミン', region: 'asia', demand: 4, rank: 5 },
  colombo:    { name: 'コロンボ', region: 'asia', demand: 2, rank: 7 },
  ulaanbaatar:{ name: 'ウランバートル', region: 'asia', demand: 2, rank: 6 },
  macau:      { name: 'マカオ', region: 'asia', demand: 3, rank: 5 },
  doha:       { name: 'ドーハ', region: 'long', demand: 3, rank: 7 },
  istanbul:   { name: 'イスタンブール', region: 'long', demand: 4, rank: 8 },
  saopaulo:   { name: 'サンパウロ', region: 'long', demand: 3, rank: 9 },
  mexico:     { name: 'メキシコシティ', region: 'long', demand: 3, rank: 8 },
  amsterdam:  { name: 'アムステルダム', region: 'long', demand: 4, rank: 8 },
  zurich:     { name: 'チューリッヒ', region: 'long', demand: 3, rank: 8 },
  chicago:    { name: 'シカゴ', region: 'long', demand: 4, rank: 8 },
});
AIRLINES.soyokaze.fleet.unshift('saab340'); AIRLINES.soyokaze.cities.push('tsushima', 'tanegashima');
AIRLINES.haruka.fleet.push('a319'); AIRLINES.haruka.cities.push('hanamaki', 'yonago', 'oita', 'saga');
AIRLINES.north.cities.push('memanbetsu', 'shonai');
AIRLINES.penguin.fleet.push('a319'); AIRLINES.penguin.cities.push('macau', 'hochiminh');
AIRLINES.sakura.fleet.push('a321xlr', 'b744'); AIRLINES.sakura.cities.push('chengdu', 'hochiminh', 'colombo');
AIRLINES.eagle.fleet.push('b744', 'b779'); AIRLINES.eagle.cities.push('chicago', 'mexico');
AIRLINES.aurora.cities.push('amsterdam', 'zurich');

// ---------- 航空会社 6（すべて架空） ----------
Object.assign(AIRLINES, {
  shimakaze: { name: 'しまかぜエア', code: 'SM', body: '#ffffff', tail: '#3fc9b8', accent: '#ffd84a', fleet: ['saab340', 'atr42', 'humming'], rank: 1, cities: ['shimo', 'okushiri', 'tsushima', 'tanegashima', 'goto', 'yakushima', 'noto'], desc: '小さな島と島をむすぶ、プロペラ機の航空会社。' },
  hanabi:    { name: 'はなびエア', code: 'HB', body: '#1e2050', tail: '#ff6a3c', accent: '#ffd84a', fleet: ['a319', 'a320', 'pelican'], rank: 3, lcc: true, cities: ['tokyo', 'osaka', 'fukuoka', 'sapporo', 'naha', 'tottori', 'oita', 'macau'], desc: '夜空に咲く花火のような塗装のLCC。' },
  panda:     { name: 'パンダエアライン', code: 'PD', body: '#ffffff', tail: '#2a2a36', accent: '#4cb85c', fleet: ['c919', 'a321xlr', 'a330'], rank: 5, cities: ['beijing', 'shanghai', 'chengdu', 'xian', 'ulaanbaatar', 'hongkong'], desc: '尾翼のパンダが人気の航空会社。' },
  oasis:     { name: 'オアシス航空', code: 'OA', body: '#f8f4ec', tail: '#8a1f4f', accent: '#d8a020', fleet: ['a35k', 'b779', 'b744'], rank: 7, cities: ['doha', 'dubai', 'istanbul', 'london', 'paris'], desc: '砂漠の国の豪華な航空会社。' },
  ginga:     { name: 'ぎんがエアウェイズ', code: 'GW', body: '#f0f4ff', tail: '#3a2a7a', accent: '#c9a0ff', fleet: ['b744', 'b779', 'a35k'], rank: 8, cities: ['newyork', 'chicago', 'saopaulo', 'mexico', 'amsterdam', 'zurich', 'sanfran'], desc: '世界中へ飛ぶ大手。ジャンボの最後の使い手。' },
  tropica:   { name: 'トロピカーナ航空', code: 'TR', body: '#ffffff', tail: '#f59ac0', accent: '#3fc9b8', fleet: ['a321xlr', 'a330', 'albatross'], rank: 6, resort: true, cities: ['bali', 'phuket', 'cebu', 'danang', 'guam', 'honolulu', 'cairns'], desc: '南の島のリゾートへ。' },
});

// ---------- お客さん 8 ----------
Object.assign(PAX, {
  golfer:  { name: 'ゴルファー', speed: 1.0, money: 1.6, needs: { food: .6, shop: .4, toilet: .4, rest: .6, fun: .1 }, desc: 'ゴルフバッグをかついで、リゾートへ。' },
  skier:   { name: 'スキーヤー', speed: 1.05, money: 1.2, needs: { food: .7, shop: .4, toilet: .5, rest: .5, fun: .3 }, desc: '冬になると北の空港へ。温泉スパが好き。' },
  cosplay: { name: 'コスプレイヤー', speed: 1.0, money: 1.1, needs: { food: .5, shop: .7, toilet: .5, rest: .2, fun: .8 }, desc: 'イベントに向かう途中。アニメグッズ店に寄りたい。' },
  foodie:  { name: 'グルメ旅行者', speed: 0.95, money: 1.5, needs: { food: 1.0, shop: .6, toilet: .4, rest: .3, fun: .2 }, desc: '空港のごはんも旅の楽しみ。飲食店が多いと大喜び。' },
  gamer:   { name: 'ゲーマー', speed: 1.0, money: 0.9, needs: { food: .6, shop: .5, toilet: .4, rest: .3, fun: .8 }, desc: '充電スタンドとゲームショップがあればごきげん。' },
  medic:   { name: '医療チーム', speed: 1.2, money: 1.0, needs: { food: .6, shop: .1, toilet: .4, rest: .6, fun: .05 }, desc: '急ぎの出張。待たせないで！' },
  ohenro:  { name: 'お遍路さん', speed: 0.85, money: 0.9, needs: { food: .6, shop: .5, toilet: .6, rest: .7, fun: .1 }, desc: '四国八十八か所めぐりの人。白い服とすげ笠。' },
  musician:{ name: 'ミュージシャン', speed: 1.0, money: 1.3, needs: { food: .6, shop: .4, toilet: .4, rest: .5, fun: .6 }, desc: 'ツアー中のバンド。カラオケに寄りたい。' },
});
MIX.resort.golfer = 6; MIX.lux.golfer = 8; MIX.dom.skier = 2; MIX.dom.foodie = 4; MIX.asia.foodie = 6; MIX.lcc.cosplay = 4; MIX.lcc.gamer = 5;
MIX.dom.medic = 1; MIX.island.medic = 3; MIX.island.ohenro = 3; MIX.dom.ohenro = 1; MIX.dom.musician = 1; MIX.long.musician = 2; MIX.asia.cosplay = 2;
Object.assign(PAX_LOOKS, {
  golfer:  { hair: ['cap', 'short'], top: ['#ffffff', '#4cb85c', '#8fdcf4'], bottom: ['#e8c890', '#ffffff', '#3a4a7a'], acc: ['bigpack'], glasses: 'sun' },
  skier:   { hair: ['cap'], top: ['#e5484d', '#4a8fe0', '#ffd84a', '#9a62d0'], bottom: ['#2a2a36', '#3a4a7a'], acc: ['board'] },
  cosplay: { hair: ['long', 'pony'], hairc: ['#40e0ff', '#ff80c0', '#ffd84a', '#c9a0ff', '#ffffff'], top: ['#2a2a36', '#ff80c0', '#ffffff', '#e5484d'], bottom: ['#2a2a36', '#ffffff'], skirt: 0.8, acc: ['bag', 'suitcase'] },
  foodie:  { hair: ['short', 'long', 'bun'], top: ['#f39a3c', '#ffd84a', '#e5484d'], bottom: ['#3a4a7a', '#a0683c'], acc: ['bag', 'camera'] },
  gamer:   { hair: ['short', 'cap'], top: ['#2a2a36', '#4a4a58', '#3a5080'], bottom: ['#2a2a36', '#4a4a58'], acc: ['backpack'], glasses: 'normal' },
  medic:   { hair: ['short', 'bun'], top: ['#ffffff'], bottom: ['#3a8a8a', '#ffffff'], acc: ['briefcase', 'suitcase'] },
  ohenro:  { hair: ['bald', 'short'], hairc: ['#e8e0d0', '#b0b0b8'], top: ['#ffffff'], bottom: ['#ffffff'], acc: ['cane'], hat: 1 },
  musician:{ hair: ['long', 'short'], hairc: ['#2a1e1a', '#c04030', '#e8d080'], top: ['#1a1a22', '#e5484d'], bottom: ['#1a1a22', '#3a4a7a'], acc: ['bigpack', 'suitcase'], glasses: 'sun' },
});

// ---------- 開発 12 ----------
RESEARCH.push(
  { id: 'mobileck', name: 'スマホチェックイン', icon: 'checkin', dev: 20, cost: 800000, rank: 2, desc: 'チェックインの時間 -20%' },
  { id: 'queuemgmt', name: '行列マネジメント', icon: 'security', dev: 30, cost: 1400000, rank: 3, desc: '保安検査の時間 -15%' },
  { id: 'quickbag', name: '手荷物スピード返却', icon: 'baggage', dev: 30, cost: 1500000, rank: 3, desc: '手荷物受取の時間 -20%' },
  { id: 'localfest', name: 'ご当地グルメフェア', icon: 'food', dev: 35, cost: 1800000, rank: 4, desc: '飲食店の売上 +8%' },
  { id: 'premium', name: '人気ブランドの誘致', icon: 'handbag', dev: 45, cost: 3000000, rank: 5, desc: 'ショップの売上 +8%' },
  { id: 'loyalty', name: '空港アプリ', icon: 'wifi', dev: 40, cost: 2500000, rank: 4, desc: 'お店・サービスの売上 +5%、満足度 +2' },
  { id: 'greenroof', name: '屋上緑化', icon: 'leaf', dev: 35, cost: 2500000, rank: 4, desc: '維持費 -5%、評価 +0.05' },
  { id: 'noisecut', name: '騒音対策', icon: 'sound', dev: 40, cost: 3000000, rank: 5, desc: 'ご近所の評判がよくなる。評価 +0.1' },
  { id: 'slotplus', name: '発着枠の拡大', icon: 'runway', dev: 60, cost: 5000000, rank: 6, desc: '到着の間隔をさらにつめられる（-8%）' },
  { id: 'salesrep', name: '航空会社への営業', icon: 'globe', dev: 35, cost: 2000000, rank: 3, desc: '毎日、すべての航空会社の好感度が少し上がる' },
  { id: 'tourbus', name: '空港見学ツアー', icon: 'bus', dev: 30, cost: 1500000, rank: 3, desc: '見学のお客さん +20%' },
  { id: 'credit', name: '銀行との信頼関係', icon: 'money', dev: 25, cost: 1000000, rank: 2, desc: '銀行から借りられる上限が1.5倍に' },
);
for (const r of RESEARCH) RESEARCH_BY[r.id] = r;

// ---------- 組み合わせ 15 ----------
COMBOS.push(
  { id: 'yakitoriyoko', name: '焼き鳥横丁', need: ['yakitori', 'izakaya'], bonus: 0.3, desc: '焼き鳥屋と居酒屋。売上+30%' },
  { id: 'tensoba', name: '天ぷらそば', need: ['tempura', 'soba'], bonus: 0.25, desc: '天ぷら屋と立ち食いそば。売上+25%' },
  { id: 'seafood', name: '港の海鮮市場', need: ['kaisendon', 'fishmarket'], bonus: 0.35, desc: '海鮮丼と海産物の店。グルメ旅行者が大よろこび' },
  { id: 'streetfood', name: '屋台村', need: [['hotdog', 'kebab', 'takoyaki', 'taiyaki', 'juice'], 3], bonus: 0.3, desc: '小さな屋台が3つ。売上+30%' },
  { id: 'cafestreet', name: 'カフェ通り', need: [['tapioca', 'pancake', 'cafe', 'matcha'], 3], bonus: 0.3, desc: 'カフェが3つ。売上+30%' },
  { id: 'gyozast', name: '餃子スタジアム', need: ['gyoza', 'chinese'], bonus: 0.25, desc: '餃子と中華料理。売上+25%' },
  { id: 'otaku', name: 'オタクの聖地', need: ['anime', 'gamestore'], bonus: 0.35, desc: 'アニメとゲーム。海外のお客さんにも大人気' },
  { id: 'wanokokoro', name: '和のこころ', need: ['kimono', 'craft'], bonus: 0.3, desc: '着物と伝統工芸。売上+30%' },
  { id: 'sweetgift', name: '甘いおみやげ', need: ['chocolate', 'wagashi'], bonus: 0.25, desc: 'チョコと和菓子。売上+25%' },
  { id: 'outdoorlife', name: 'アウトドア派', need: ['outdoor', 'sports'], bonus: 0.25, desc: 'アウトドアとスポーツ用品。売上+25%' },
  { id: 'beautyday', name: 'ビューティーデー', need: ['nailsalon', 'cosme'], bonus: 0.3, desc: 'ネイルとコスメ。売上+30%' },
  { id: 'relaxspa', name: '癒やしの湯', need: ['spa', 'massage'], bonus: 0.3, desc: '温泉スパとマッサージ。売上+30%' },
  { id: 'kidsparadise', name: '子どもの楽園', need: ['nursery', 'kidsroom'], bonus: 0.25, desc: '保育ルームとキッズルーム。家族づれ大満足' },
  { id: 'karaokegame', name: '歌とゲームの館', need: ['karaoke', 'game'], bonus: 0.25, desc: 'カラオケとゲームコーナー。学生に大人気' },
  { id: 'flowerroad', name: '花畑ロード', need: [['tulip', 'cosmos', 'sunflower', 'flowerbed'], 3], bonus: 0.2, desc: '花畑が3種類。美しさアップ' },
);

// ---------- 実績 20 ----------
const newTypes = ['saab340', 'a319', 'c919', 'a321xlr', 'b744', 'b779'];
const seenType = t => Object.keys(G.seenPlanes).some(k => k.split(':')[0] === t);
ACHIEVEMENTS.push(
  { id: 'loan1', name: 'はじめての借入', desc: '銀行からお金を借りた', icon: 'money', c: () => (G.loanLog || []).some(l => l[1] > 0) },
  { id: 'loanfree', name: '借金ゼロ', desc: '借りたお金をすべて返した', icon: 'check', c: () => !!G.flags.repaidAll },
  { id: 'profit1m', name: '黒字経営', desc: '1日の利益100万円', icon: 'money', c: () => RT.lastDay && RT.lastDay.inc - RT.lastDay.exp >= 1e6 },
  { id: 'profit10m', name: '大もうけ', desc: '1日の利益1,000万円', icon: 'money', c: () => RT.lastDay && RT.lastDay.inc - RT.lastDay.exp >= 1e7 },
  { id: 'daypax1k', name: 'にぎわう一日', desc: '1日の乗客1,000人', icon: 'people', c: () => RT.lastDay && RT.lastDay.pax >= 1000 },
  { id: 'daypax5k', name: '人の波', desc: '1日の乗客5,000人', icon: 'people', c: () => RT.lastDay && RT.lastDay.pax >= 5000 },
  { id: 'flights20', name: 'ひっきりなし', desc: '1日20便', icon: 'plane2', c: () => RT.lastDay && RT.lastDay.flights >= 20 },
  { id: 'flights50', name: '管制官もびっくり', desc: '1日50便', icon: 'tower', c: () => RT.lastDay && RT.lastDay.flights >= 50 },
  { id: 'moved10', name: '模様がえ名人', desc: '建物を10回動かした・回した', icon: 'move', c: () => (G.flags.moves || 0) >= 10 },
  { id: 'airline15', name: '航空会社の集まる空港', desc: '15社と路線を結んだ', icon: 'globe', c: () => new Set(G.routes.map(r => r.airline)).size >= 15 },
  { id: 'city60', name: '世界地図', desc: '60都市のスタンプを集めた', icon: 'flag', c: () => Object.keys(G.stamps).length >= 60 },
  { id: 'seen744', name: '空の女王', desc: '747-400（ジャンボ）がやってきた', icon: 'plane', c: () => seenType('b744') },
  { id: 'seen779', name: '最新鋭機', desc: '777-9がやってきた', icon: 'plane', c: () => seenType('b779') },
  { id: 'newtype', name: 'ニューフェイス', desc: '新しく増えた6機種をすべて見た', icon: 'star', c: () => newTypes.every(seenType) },
  { id: 'pushback100', name: 'トーイングカーの相棒', desc: 'プッシュバック100回', icon: 'cargo', c: () => (G.flags.pushbacks || 0) >= 100 },
  { id: 'report30', name: 'こつこつ経営', desc: '30日間、空港を運営した', icon: 'chart', c: () => G.day >= 30 },
  { id: 'decor100', name: '花と緑の空港', desc: 'かざりを100個置いた', icon: 'flower', c: () => Object.values(G.blds).filter(b => B[b.id].cat === 'deco').length >= 100 },
  { id: 'food20', name: 'グルメ空港', desc: '飲食店を20軒にした', icon: 'food', c: () => Object.values(G.blds).filter(b => B[b.id].cat === 'food').length >= 20 },
  { id: 'shop20', name: 'お買い物天国', desc: 'ショップを20軒にした', icon: 'shopping', c: () => Object.values(G.blds).filter(b => B[b.id].cat === 'shop').length >= 20 },
  { id: 'runway2', name: '2本の滑走路', desc: '滑走路を2本にした', icon: 'runway', c: () => countKind('runway') >= 2 },
);
