// ============================================================
//  追加データ（建物53・機材8・航空会社8・都市30・お客さん10・開発15・組み合わせ20・実績30・つぶやき14）
// ============================================================

// ---------- 建物：飲食 14 ----------
const MORE_FOODS = [
  ['takoyaki', 'たこ焼き屋', 2, 1, 160000, 600, 4, 5, 2, 'dumpling', ['food']],
  ['okonomi', 'お好み焼き', 2, 2, 260000, 1100, 6, 15, 3, 'food', ['food']],
  ['tonkatsu', 'とんかつ屋', 2, 2, 280000, 1400, 6, 16, 3, 'fork', ['food']],
  ['gyudon', '牛丼屋', 2, 2, 220000, 600, 8, 8, 2, 'soba', ['food']],
  ['yakiniku', '焼肉店', 3, 2, 650000, 3200, 8, 28, 5, 'steak', ['food']],
  ['pizza', 'ピザ屋', 2, 2, 300000, 1200, 6, 14, 3, 'pizza', ['food']],
  ['pasta', 'パスタ屋', 2, 2, 320000, 1300, 6, 15, 4, 'fork', ['food']],
  ['crepe', 'クレープ屋', 2, 1, 180000, 600, 3, 5, 2, 'cake', ['food', 'fun']],
  ['matcha', '抹茶カフェ', 2, 2, 260000, 900, 6, 14, 3, 'cafe', ['food', 'rest']],
  ['juice', 'ジューススタンド', 1, 1, 90000, 450, 2, 3, 1, 'cafe', ['food']],
  ['donut', 'ドーナツ屋', 2, 2, 230000, 500, 6, 8, 2, 'donut', ['food']],
  ['unagi', 'うなぎ屋', 3, 2, 700000, 4200, 8, 25, 6, 'bento', ['food']],
  ['icecream', 'アイスクリーム屋', 2, 1, 170000, 450, 3, 4, 2, 'icecream', ['food', 'fun']],
  ['onigiri', 'おにぎり屋', 2, 1, 120000, 400, 3, 3, 1, 'onigiri', ['food']],
];
for (const [id, name, w, h, cost, price, cap, svc, rank, icon, needs] of MORE_FOODS)
  defB(id, { cat: 'food', name, kind: 'svc', need: needs[0], need2: needs[1], zone: 'term', w, h, cost, price, cap, svc, rank, icon, upkeep: Math.round(cost * 0.006 / 100) * 100, inside: true, desc: `売上：1人 約${fmtNum(price)}円` });

// ---------- 建物：ショップ 12 ----------
const MORE_SHOPS = [
  ['cosme', 'コスメショップ', 2, 2, 400000, 3500, 5, 'cosme'],
  ['watchshop', '時計店', 2, 2, 900000, 9000, 6, 'watch'],
  ['luggageshop', '旅行かばん店', 2, 2, 350000, 2800, 4, 'suitcase'],
  ['sports', 'スポーツ用品店', 3, 2, 420000, 2400, 4, 'ball'],
  ['camerashop', 'カメラ店', 2, 2, 500000, 4500, 5, 'camera'],
  ['localgoods', '地元の特産品店', 2, 2, 230000, 1600, 2, 'gift'],
  ['sakeshop', '地酒の店', 2, 2, 300000, 2600, 3, 'beer'],
  ['teashop', 'お茶屋', 2, 1, 180000, 1200, 2, 'cafe'],
  ['charashop', 'キャラクターショップ', 2, 2, 380000, 2000, 4, 'mascot'],
  ['stationery', '文房具店', 2, 1, 160000, 800, 2, 'book'],
  ['eyewear', 'メガネ・サングラス店', 2, 1, 280000, 3800, 5, 'binocular'],
  ['jewelry', 'ジュエリーショップ', 2, 2, 2400000, 15000, 8, 'star'],
];
for (const [id, name, w, h, cost, price, rank, icon] of MORE_SHOPS)
  defB(id, { cat: 'shop', name, kind: 'svc', need: 'shop', zone: 'term', w, h, cost, price, cap: w * h, svc: 6, rank, icon, upkeep: Math.round(cost * 0.006 / 100) * 100, inside: true, rich: id === 'jewelry' || id === 'watchshop', desc: `売上：1人 約${fmtNum(price)}円` });

// ---------- 建物：サービス 8 ----------
defB('kidsroom', { cat: 'svc', name: 'キッズルーム', kind: 'svc', need: 'fun', zone: 'term', w: 3, h: 2, cap: 10, svc: 15, price: 0, cost: 300000, upkeep: 1200, rank: 2, likes: ['kid', 'family', 'babyc'], icon: 'balloon', desc: '子どもが遊べる無料のスペース。家族づれの満足度アップ。' });
defB('prayer', { cat: 'svc', name: '礼拝室', kind: 'aura', zone: 'term', w: 2, h: 1, cost: 120000, upkeep: 300, rank: 4, aura: 4, likes: ['foreign', 'abroad', 'diplomat'], icon: 'heart', desc: 'しずかにお祈りできる部屋。海外のお客さんが安心。' });
defB('shower', { cat: 'svc', name: 'シャワールーム', kind: 'svc', need: 'rest', zone: 'term', w: 2, h: 2, cap: 4, svc: 12, price: 1200, cost: 400000, upkeep: 1500, rank: 5, inside: true, likes: ['biz', 'backpack', 'hiker', 'athlete'], icon: 'onsen', desc: '長旅のあとにさっぱり。' });
defB('library', { cat: 'svc', name: '図書コーナー', kind: 'svc', need: 'rest', need2: 'fun', zone: 'term', w: 3, h: 2, cap: 10, svc: 20, price: 0, cost: 250000, upkeep: 800, rank: 3, beauty: 2, likes: ['elder', 'student', 'abroad'], icon: 'book', desc: '静かに本が読める。無料。' });
defB('vr', { cat: 'svc', name: 'VRフライト体験', kind: 'svc', need: 'fun', zone: 'term', w: 2, h: 2, cap: 4, svc: 10, price: 1500, cost: 800000, upkeep: 3000, rank: 6, inside: true, likes: ['kid', 'maniac', 'student'], icon: 'game', desc: '操縦席からの景色をVRで体験。' });
defB('photostudio', { cat: 'svc', name: '記念写真スタジオ', kind: 'svc', need: 'fun', zone: 'term', w: 2, h: 2, cap: 3, svc: 8, price: 1000, cost: 300000, upkeep: 1000, rank: 3, inside: true, likes: ['couple', 'family', 'tourist', 'idol'], icon: 'camera', desc: '飛行機と一緒に記念撮影。' });
defB('luggage', { cat: 'svc', name: '手荷物預かり所', kind: 'svc', need: 'shop', zone: 'term', w: 2, h: 1, cap: 3, svc: 3, price: 700, cost: 150000, upkeep: 600, rank: 2, likes: ['tourist', 'backpack', 'hiker', 'surfer'], icon: 'suitcase', desc: '大きな荷物を預けられる。' });
defB('postoffice', { cat: 'svc', name: '郵便局', kind: 'svc', need: 'shop', zone: 'term', w: 2, h: 1, cap: 2, svc: 4, price: 500, cost: 200000, upkeep: 700, rank: 3, icon: 'mail', desc: 'おみやげを家に送れる。おみやげ屋の近くだと便利。' });

// ---------- 建物：空側 4 ----------
defB('deicer', { cat: 'air', name: '除氷施設', kind: 'deice', zone: 'air', w: 3, h: 2, cost: 900000, upkeep: 3000, rank: 3, unique: true, icon: 'snow', desc: '雪の日、出発前の除氷（じょひょう）作業が早く終わる。' });
defB('cateringfac', { cat: 'air', name: '機内食工場', kind: 'catering', zone: 'air', w: 4, h: 3, cost: 2200000, upkeep: 6000, rank: 4, unique: true, icon: 'bento', desc: '旅客機1便ごとに機内食の売上が入る。' });
defB('gsebase', { cat: 'air', name: '地上支援車両基地', kind: 'gse', zone: 'air', w: 4, h: 3, cost: 1600000, upkeep: 5000, rank: 4, unique: true, icon: 'cargo', desc: 'トーイングカーや給油車の基地。折り返し時間が10%短くなる。' });
defB('training', { cat: 'air', name: 'パイロット訓練センター', kind: 'training', zone: 'air', w: 3, h: 3, cost: 3000000, upkeep: 7000, rank: 5, unique: true, icon: 'plane2', desc: '開発ポイントが毎日たまる。航空会社の好感度も上がりやすい。' });

// ---------- 建物：陸側 5 ----------
defB('busterminal', { cat: 'land', name: 'バスターミナル', kind: 'access', zone: 'land', w: 4, h: 2, cost: 900000, upkeep: 2500, access: 120, rank: 3, icon: 'bus', desc: '高速バスが何台も来る大きな入口。' });
defB('monorail', { cat: 'land', name: 'モノレール駅', kind: 'access', zone: 'land', w: 5, h: 3, cost: 8000000, upkeep: 12000, access: 300, rank: 6, unique: true, icon: 'train', desc: '高架を走るモノレールの駅。とてもたくさんの人が来られる。' });
defB('outlet', { cat: 'land', name: 'アウトレットモール', kind: 'svc', need: 'shop', zone: 'land', w: 5, h: 4, cap: 30, svc: 30, price: 4000, cost: 6000000, upkeep: 12000, rank: 6, visitor: true, likes: ['tourist', 'couple', 'foreign'], icon: 'shopping', desc: '空港のとなりのショッピングモール。見学客もたくさん来る。' });
defB('museum', { cat: 'land', name: '航空博物館', kind: 'svc', need: 'fun', zone: 'land', w: 5, h: 3, cap: 30, svc: 30, price: 800, cost: 4000000, upkeep: 8000, rank: 5, visitor: true, beauty: 4, likes: ['maniac', 'kid', 'elder', 'photog'], icon: 'plane2', desc: '昔の飛行機がならぶ博物館。マニアや家族づれに大人気。' });
defB('ferris', { cat: 'land', name: '観覧車', kind: 'svc', need: 'fun', zone: 'land', w: 3, h: 3, cap: 16, svc: 15, price: 700, cost: 3000000, upkeep: 6000, rank: 5, visitor: true, beauty: 8, likes: ['couple', 'family', 'kid'], icon: 'ferris', desc: '空港を見下ろす観覧車。夜はライトアップ。' });

// ---------- 建物：かざり 10 ----------
defB('maple', { cat: 'deco', name: 'もみじ', kind: 'decor', zone: 'land', cost: 18000, beauty: 2.5, seasonBoost: 2, icon: 'leaf', desc: '秋にまっかに色づく。秋は美しさ2倍。' });
defB('ginkgo', { cat: 'deco', name: 'イチョウ', kind: 'decor', zone: 'land', cost: 15000, beauty: 2, seasonBoost: 2, icon: 'tree', desc: '秋に黄色く色づく。' });
defB('bamboo', { cat: 'deco', name: '竹やぶ', kind: 'decor', zone: 'any', cost: 12000, beauty: 2, icon: 'bamboo', desc: '和の雰囲気。ターミナルの中にも置ける。' });
defB('hedge', { cat: 'deco', name: '生け垣', kind: 'decor', zone: 'land', w: 2, h: 1, cost: 8000, beauty: 1.5, icon: 'bush', desc: '道ぞいに置くときれい。' });
defB('gardenrock', { cat: 'deco', name: '庭石', kind: 'decor', zone: 'any', cost: 30000, beauty: 2, icon: 'pond', desc: '日本庭園の石。' });
defB('stonelantern', { cat: 'deco', name: '石灯籠', kind: 'decor', zone: 'any', cost: 60000, beauty: 3, lamp: true, rank: 2, icon: 'lantern', desc: '夜にあかりがともる。' });
defB('xmastree', { cat: 'deco', name: 'クリスマスツリー', kind: 'decor', zone: 'any', cost: 120000, beauty: 4, seasonBoost: 3, lamp: true, rank: 2, icon: 'pine', desc: '冬は美しさ2倍。夜にキラキラ光る。' });
defB('koinobori', { cat: 'deco', name: 'こいのぼり', kind: 'decor', zone: 'land', cost: 50000, beauty: 3, seasonBoost: 0, icon: 'flag', desc: '春は美しさ2倍。風に泳ぐ。' });
defB('sunflower', { cat: 'deco', name: 'ひまわり畑', kind: 'decor', zone: 'land', w: 2, h: 2, cost: 40000, beauty: 4, seasonBoost: 1, icon: 'sun', desc: '夏は美しさ2倍。' });
defB('rocketstatue', { cat: 'deco', name: 'ロケットの像', kind: 'decor', zone: 'any', w: 2, h: 2, cost: 900000, beauty: 12, rank: 8, icon: 'rocket', desc: '宇宙港のシンボル。' });
for (const id of Object.keys(B)) if (!BUILD_ORDER.includes(id)) BUILD_ORDER.push(id);

// ---------- 機材 8（実在機・メーカー名は変えてある） ----------
Object.assign(PLANES, {
  atr42:  { name: 'ATR 42-600', maker: 'ATR', cls: 1, seats: 48, lenM: 22.7, spanM: 24.6, dia: 2.6, eng: 'prop', engines: 2, wing: 'high', tail: 'T', gear: 'retract', tip: 'none', vapp: 105, turn: 25, fee: 55000, rank: 2, desc: 'ATR 72を短くした小型版。離島の短い滑走路でも活躍。' },
  crj9:   { name: 'ボンバルディア CRJ900', maker: 'ボンバルディア', cls: 2, seats: 86, lenM: 36.2, spanM: 24.9, dia: 2.7, eng: 'rear', engines: 2, wing: 'low', tail: 'T', gear: 'retract', tip: 'blended', vapp: 140, turn: 35, fee: 115000, rank: 3, desc: 'エンジンが胴体の後ろについたリージョナルジェット。細長い胴体。' },
  e175:   { name: 'エンブラエル E175', maker: 'エンブラエル', cls: 2, seats: 76, lenM: 31.7, spanM: 26.0, dia: 3.0, eng: 'jet', engines: 2, wing: 'low', tail: 'conv', gear: 'retract', tip: 'blended', vapp: 128, turn: 35, fee: 105000, rank: 3, desc: 'E190より少し小さいリージョナルジェット。' },
  a220:   { name: 'エアブロー A220-300', maker: 'エアブロー', cls: 2, seats: 140, lenM: 38.7, spanM: 35.1, dia: 3.7, eng: 'jet', engines: 2, wing: 'low', tail: 'conv', gear: 'retract', tip: 'none', vapp: 134, turn: 38, fee: 170000, rank: 4, desc: '大きな窓と静かなキャビンが自慢の新しい小型機。' },
  max8:   { name: 'ボーリング 737 MAX 8', maker: 'ボーリング', cls: 2, seats: 178, lenM: 39.5, spanM: 35.9, dia: 3.76, eng: 'jet', engines: 2, wing: 'low', tail: 'conv', gear: 'retract', tip: 'split', vapp: 142, turn: 40, fee: 215000, rank: 5, desc: '737の新しい型。上下に分かれた翼端（スプリットシミター）が目印。' },
  a330:   { name: 'エアブロー A330-300', maker: 'エアブロー', cls: 3, seats: 300, lenM: 63.7, spanM: 60.3, dia: 5.64, eng: 'jet', engines: 2, wing: 'low', tail: 'conv', gear: 'retract', tip: 'fence', vapp: 137, turn: 60, fee: 470000, rank: 6, wide: true, desc: 'アジア路線でよく見かける双発ワイドボディ機。' },
  b78x:   { name: 'ボーリング 787-10', maker: 'ボーリング', cls: 3, seats: 330, lenM: 68.3, spanM: 60.1, dia: 5.77, eng: 'jet', engines: 2, wing: 'low', tail: 'conv', gear: 'retract', tip: 'raked', vapp: 147, turn: 65, fee: 520000, rank: 7, wide: true, desc: '787シリーズでいちばん長い型。' },
  a35k:   { name: 'エアブロー A350-1000', maker: 'エアブロー', cls: 3, seats: 370, lenM: 73.8, spanM: 64.8, dia: 5.96, eng: 'jet', engines: 2, wing: 'low', tail: 'conv', gear: 'retract', tip: 'curved', vapp: 145, turn: 70, fee: 620000, rank: 8, wide: true, bigEng: true, desc: 'A350の長胴型。主脚のタイヤが6つ。' },
});
for (const P of Object.values(PLANES)) { P.len = P.lenM / TILE_M; P.span = P.spanM / TILE_M; }

// ---------- 都市 30 ----------
Object.assign(CITIES, {
  asahikawa: { name: '旭川', region: 'dom', demand: 2, rank: 2 },
  obihiro:   { name: '帯広', region: 'dom', demand: 2, rank: 2 },
  wakkanai:  { name: '稚内', region: 'dom', demand: 1, rank: 2, island: true },
  akita:     { name: '秋田', region: 'dom', demand: 2, rank: 2 },
  yamagata:  { name: '山形', region: 'dom', demand: 2, rank: 2 },
  toyama:    { name: '富山', region: 'dom', demand: 2, rank: 3 },
  komatsu:   { name: '小松', region: 'dom', demand: 3, rank: 3 },
  shizuoka:  { name: '静岡', region: 'dom', demand: 2, rank: 3 },
  shirahama: { name: '南紀白浜', region: 'dom', demand: 2, rank: 3, resort: true },
  izumo:     { name: '出雲', region: 'dom', demand: 2, rank: 3 },
  okayama:   { name: '岡山', region: 'dom', demand: 3, rank: 3 },
  takamatsu: { name: '高松', region: 'dom', demand: 3, rank: 3 },
  tokushima: { name: '徳島', region: 'dom', demand: 2, rank: 2 },
  nagasaki:  { name: '長崎', region: 'dom', demand: 3, rank: 3 },
  kumamoto:  { name: '熊本', region: 'dom', demand: 3, rank: 3 },
  miyazaki:  { name: '宮崎', region: 'dom', demand: 3, rank: 3, resort: true },
  yakushima: { name: '屋久島', region: 'dom', demand: 2, rank: 2, island: true, resort: true },
  goto:      { name: '五島', region: 'dom', demand: 1, rank: 1, island: true },
  busan:     { name: '釜山', region: 'asia', demand: 4, rank: 4 },
  kaohsiung: { name: '高雄', region: 'asia', demand: 3, rank: 4 },
  beijing:   { name: '北京', region: 'asia', demand: 5, rank: 6 },
  cebu:      { name: 'セブ', region: 'asia', demand: 3, rank: 5, resort: true },
  danang:    { name: 'ダナン', region: 'asia', demand: 3, rank: 5, resort: true },
  kualalumpur:{ name: 'クアラルンプール', region: 'asia', demand: 4, rank: 6 },
  jakarta:   { name: 'ジャカルタ', region: 'asia', demand: 4, rank: 6 },
  delhi:     { name: 'デリー', region: 'asia', demand: 4, rank: 7 },
  sanfran:   { name: 'サンフランシスコ', region: 'long', demand: 4, rank: 7 },
  seattle:   { name: 'シアトル', region: 'long', demand: 3, rank: 7 },
  frankfurt: { name: 'フランクフルト', region: 'long', demand: 4, rank: 8 },
  rome:      { name: 'ローマ', region: 'long', demand: 4, rank: 8 },
});
// 既存の航空会社にも新しい都市と機材を
AIRLINES.soyokaze.cities.push('goto', 'yakushima', 'tokushima', 'akita', 'yamagata'); AIRLINES.soyokaze.fleet.unshift('atr42');
AIRLINES.haruka.cities.push('komatsu', 'okayama', 'nagasaki', 'kumamoto', 'miyazaki', 'takamatsu'); AIRLINES.haruka.fleet.push('max8');
AIRLINES.north.cities.push('asahikawa', 'obihiro', 'wakkanai'); AIRLINES.north.fleet.push('crj9');
AIRLINES.penguin.cities.push('busan', 'kaohsiung', 'cebu'); AIRLINES.penguin.fleet.push('max8');
AIRLINES.sakura.cities.push('busan', 'kaohsiung', 'beijing', 'kualalumpur', 'jakarta', 'delhi'); AIRLINES.sakura.fleet.push('a330', 'b78x');
AIRLINES.eagle.cities.push('sanfran', 'seattle');
AIRLINES.aurora.cities.push('frankfurt', 'rome');

// ---------- 航空会社 8（すべて架空） ----------
Object.assign(AIRLINES, {
  hokkai:  { name: 'ほっかいエア', code: 'HK', body: '#ffffff', tail: '#3a9ad8', accent: '#ffffff', fleet: ['atr42', 'q400', 'e175'], rank: 2, cities: ['sapporo', 'asahikawa', 'obihiro', 'wakkanai', 'hakodate', 'kushiro', 'sendai'], desc: '北海道の空をつなぐ地域航空会社。' },
  kusunoki:{ name: 'くすのきエア', code: 'KS', body: '#ffffff', tail: '#2e7d4a', accent: '#f39a3c', fleet: ['atr42', 'a220', 'max8'], rank: 3, cities: ['fukuoka', 'nagasaki', 'kumamoto', 'miyazaki', 'kagoshima', 'goto', 'yakushima', 'amami'], desc: '九州・離島の路線にくわしい。' },
  mikan:   { name: 'みかん航空', code: 'MK', body: '#ffffff', tail: '#f39a3c', accent: '#4cb85c', fleet: ['atr42', 'crj9'], rank: 2, cities: ['matsuyama', 'kochi', 'takamatsu', 'tokushima', 'izumo', 'okayama', 'osaka'], desc: '四国生まれのアットホームな航空会社。' },
  tsuru:   { name: 'つるジェット', code: 'TJ', body: '#ffffff', tail: '#e5484d', accent: '#2a2a36', fleet: ['a320', 'max8', 'a220'], rank: 4, lcc: true, cities: ['tokyo', 'osaka', 'sapporo', 'naha', 'fukuoka', 'busan', 'kaohsiung', 'danang', 'cebu'], desc: '赤い鶴がトレードマークのLCC。' },
  dragon:  { name: 'ドラゴン・アジア航空', code: 'DA', body: '#ffffff', tail: '#c0302a', accent: '#e8b830', fleet: ['a330', 'a350'], rank: 5, cities: ['beijing', 'shanghai', 'hongkong', 'taipei', 'seoul'], desc: '東アジアの大都市を結ぶ。' },
  lotus:   { name: 'ロータス航空', code: 'LT', body: '#f8f4ff', tail: '#9a62d0', accent: '#ffb0d0', fleet: ['a330', 'b78x'], rank: 6, resort: true, cities: ['bangkok', 'kualalumpur', 'jakarta', 'danang', 'cebu', 'delhi', 'singapore'], desc: '東南アジア・南アジアへ飛ぶ。' },
  pstar:   { name: 'パシフィックスター航空', code: 'PS', body: '#ffffff', tail: '#1e3a7a', accent: '#e5484d', fleet: ['b78x', 'a35k', 'b777'], rank: 7, cities: ['sanfran', 'seattle', 'la', 'vancouver', 'newyork', 'honolulu'], desc: '北米の大手。' },
  euro:    { name: 'ユーロスカイ', code: 'ES', body: '#ffffff', tail: '#2f4f9a', accent: '#ffd84a', fleet: ['a330', 'a35k'], rank: 8, cities: ['frankfurt', 'rome', 'paris', 'london', 'helsinki'], desc: 'ヨーロッパの主要都市へ直行。' },
});

// ---------- お客さん 10 ----------
Object.assign(PAX, {
  surfer:    { name: 'サーファー', speed: 1.05, money: 0.8, needs: { food: .7, shop: .3, toilet: .5, rest: .2, fun: .3 }, desc: '波を求めて南の島へ。手荷物預かり所が好き。' },
  hiker:     { name: '登山客', speed: 1.0, money: 0.8, needs: { food: .7, shop: .4, toilet: .6, rest: .5, fun: .1 }, desc: '屋久島や北の山へ。シャワーがあると喜ぶ。' },
  athlete:   { name: 'スポーツ選手団', speed: 1.15, money: 1.0, needs: { food: .8, shop: .2, toilet: .4, rest: .5, fun: .1 }, desc: '遠征中のチーム。よく食べる。' },
  idol:      { name: 'アイドル', speed: 1.1, money: 2.5, needs: { food: .4, shop: .7, toilet: .3, rest: .6, fun: .3 }, desc: 'ライブの日に来ると、ファンの見学客が増える。' },
  abroad:    { name: '留学生', speed: 1.05, money: 0.7, needs: { food: .7, shop: .5, toilet: .4, rest: .4, fun: .4 }, desc: '図書コーナーと礼拝室があるとうれしい。' },
  diplomat:  { name: '外交官', speed: 1.0, money: 3.5, needs: { food: .5, shop: .3, toilet: .3, rest: .9, fun: .1 }, desc: 'ラウンジがないと不満。' },
  photog:    { name: 'カメラマン', speed: 1.0, money: 1.2, needs: { food: .5, shop: .5, toilet: .3, rest: .1, fun: .9 }, desc: '展望デッキで飛行機を撮影するのが生きがい。' },
  babyc:     { name: '赤ちゃん連れ', speed: 0.8, money: 1.1, needs: { food: .5, shop: .5, toilet: .8, rest: .7, fun: .3 }, desc: 'ベビールームとキッズルームが必須。' },
  petowner:  { name: 'ペット連れ', speed: 0.95, money: 1.0, needs: { food: .5, shop: .5, toilet: .6, rest: .3, fun: .2 }, desc: 'わんちゃんと一緒にお出かけ。' },
  astronaut: { name: '宇宙飛行士', speed: 1.1, money: 2.0, needs: { food: .5, shop: .2, toilet: .3, rest: .5, fun: .1 }, desc: '宇宙へ向かう人。みんなのあこがれ。' },
});
MIX.dom.hiker = 3; MIX.dom.athlete = 3; MIX.dom.babyc = 4; MIX.dom.petowner = 3;
MIX.resort.surfer = 8; MIX.resort.babyc = 4; MIX.island.hiker = 6; MIX.island.petowner = 3;
MIX.lcc.surfer = 3; MIX.lcc.abroad = 5; MIX.asia.abroad = 8; MIX.asia.photog = 3; MIX.long.diplomat = 3; MIX.long.abroad = 5; MIX.long.photog = 3;
MIX.lux.diplomat = 10; MIX.space.astronaut = 20; MIX.space.photog = 8;

// ---------- 開発 15 ----------
RESEARCH.push(
  { id: 'deicing', name: '除氷液リサイクル', icon: 'snow', dev: 25, cost: 900000, rank: 3, desc: '雪の日の除氷作業が半分の時間に。' },
  { id: 'turnfast', name: 'ターンアラウンド短縮', icon: 'clock', dev: 40, cost: 2000000, rank: 4, desc: '飛行機の折り返し時間 -10%' },
  { id: 'cdm', name: '空港CDM（協調的意思決定）', icon: 'board', dev: 70, cost: 6000000, rank: 6, desc: '到着の間隔をつめられる（-15%）。たくさん発着できる。' },
  { id: 'wifi6', name: '超高速Wi-Fi', icon: 'wifi', dev: 30, cost: 1500000, rank: 4, desc: 'みんなの満足度 さらに +3' },
  { id: 'signage', name: 'デジタルサイネージ', icon: 'tv', dev: 25, cost: 1200000, rank: 3, desc: 'お店の売上 +5%' },
  { id: 'localfood', name: '地産地消メニュー', icon: 'onigiri', dev: 30, cost: 1500000, rank: 3, desc: '飲食店の売上 +10%' },
  { id: 'carbon', name: 'カーボンオフセット', icon: 'leaf', dev: 50, cost: 4000000, rank: 5, desc: '環境にやさしい空港として評価 +0.1' },
  { id: 'barrierfree', name: 'バリアフリー化', icon: 'people', dev: 30, cost: 2000000, rank: 3, desc: 'お年寄り・赤ちゃん連れの満足度 +6' },
  { id: 'kidsfriendly', name: '子育て応援空港', icon: 'balloon', dev: 30, cost: 1500000, rank: 3, desc: '子ども・家族づれの満足度 +5' },
  { id: 'nightshop', name: '深夜営業', icon: 'moon', dev: 35, cost: 2000000, rank: 4, desc: '20時以降のお店の売上 +30%' },
  { id: 'tourism', name: '観光案内の連携', icon: 'globe', dev: 40, cost: 3000000, rank: 5, desc: '見学のお客さん +30%' },
  { id: 'cargoauto', name: '貨物の自動化', icon: 'cargo', dev: 50, cost: 5000000, rank: 5, desc: '貨物の売上 +25%' },
  { id: 'sms', name: '安全管理システム', icon: 'firstaid', dev: 45, cost: 3000000, rank: 5, desc: '上空で待てる時間が長くなり、他空港へのダイバートが減る。' },
  { id: 'maglev', name: 'リニア連絡線', icon: 'train', dev: 120, cost: 30000000, rank: 9, desc: '空港駅とモノレール駅から来られる人が2倍に。' },
  { id: 'hydrogen', name: '水素エネルギー', icon: 'sun', dev: 110, cost: 20000000, rank: 9, desc: '維持費 さらに -10%' },
);
for (const r of RESEARCH) RESEARCH_BY[r.id] = r;

// ---------- 組み合わせ 20 ----------
COMBOS.push(
  { id: 'konamon', name: 'こなもん横丁', need: ['takoyaki', 'okonomi'], bonus: 0.3, desc: 'たこ焼きとお好み焼き。売上+30%' },
  { id: 'teishoku', name: 'がっつり定食通り', need: [['tonkatsu', 'gyudon', 'curry', 'ramen'], 3], bonus: 0.25, desc: 'がっつりごはんが3つ。売上+25%' },
  { id: 'italia', name: 'イタリア広場', need: ['pizza', 'pasta'], bonus: 0.3, desc: 'ピザとパスタ。売上+30%' },
  { id: 'sweetsroad', name: 'スイーツロード', need: [['crepe', 'donut', 'icecream', 'sweets'], 3], bonus: 0.3, desc: '甘いものが3つ。子どもと若い人が大よろこび' },
  { id: 'wafu', name: '和カフェ', need: ['matcha', 'wagashi'], bonus: 0.3, desc: '抹茶と和菓子。海外のお客さんにも大人気' },
  { id: 'unaju', name: '老舗の味', need: ['unagi', 'sakeshop'], bonus: 0.25, desc: 'うなぎと地酒。売上+25%' },
  { id: 'nihon', name: 'ニッポンのおみやげ', need: [['localgoods', 'teashop', 'sakeshop', 'wagashi', 'souvenir'], 4], bonus: 0.35, desc: '日本のおみやげが4種類。売上+35%' },
  { id: 'beauty', name: 'ビューティーコーナー', need: ['cosme', 'pharmacy'], bonus: 0.25, desc: 'コスメとドラッグストア。売上+25%' },
  { id: 'travelgear', name: '旅じたく', need: ['luggageshop', 'luggage'], bonus: 0.25, desc: 'かばん屋と手荷物預かり。売上+25%' },
  { id: 'luxury2', name: '高級時計ギャラリー', need: ['watchshop', 'jewelry'], bonus: 0.35, desc: '時計とジュエリー。お金持ちが集まる' },
  { id: 'camerafan', name: 'カメラ好きの聖地', need: ['camerashop', 'deck'], bonus: 0.3, desc: 'カメラ店と展望デッキ。カメラマン大満足' },
  { id: 'kidsland', name: 'キッズランド', need: ['kidsroom', 'toy', 'game'], bonus: 0.3, desc: 'キッズルーム・おもちゃ・ゲーム。家族づれ大満足' },
  { id: 'refresh', name: 'リフレッシュゾーン', need: ['shower', 'massage'], bonus: 0.25, desc: 'シャワーとマッサージ。売上+25%' },
  { id: 'quiet', name: '静かな読書室', need: ['library', 'cafe'], bonus: 0.2, desc: '図書コーナーとカフェ。売上+20%' },
  { id: 'souvenirpost', name: 'おみやげ発送', need: ['postoffice', 'souvenir'], bonus: 0.3, desc: '買ってすぐ送れる。おみやげ屋の売上+30%' },
  { id: 'aviation', name: '航空ファンの町', need: ['museum', 'goods'], bonus: 0.3, desc: '博物館と航空グッズ店。マニアが集まる' },
  { id: 'dateplan', name: 'デートコース', need: ['ferris', 'restaurant'], bonus: 0.3, desc: '観覧車とレストラン。新婚さんに大人気' },
  { id: 'japangarden', name: '日本庭園', need: ['bamboo', 'gardenrock', 'stonelantern'], bonus: 0.2, desc: '竹・庭石・石灯籠。美しさがぐっとアップ' },
  { id: 'autumn', name: '紅葉狩り', need: ['maple', 'ginkgo'], bonus: 0.2, desc: 'もみじとイチョウ。秋の見学客が増える' },
  { id: 'vrmuseum', name: 'ヒコーキ体験館', need: ['vr', 'gallery'], bonus: 0.3, desc: 'VRとギャラリー。売上+30%' },
);

// ---------- 実績 30 ----------
ACHIEVEMENTS.push(
  { id: 'plane10', name: '機材コレクター', desc: '10種類の機材がやってきた', icon: 'plane', c: () => new Set(Object.keys(G.seenPlanes).map(k => k.split(':')[0])).size >= 10 },
  { id: 'planeall', name: '空飛ぶ図鑑', desc: 'すべての機材がやってきた', icon: 'plane2', c: () => new Set(Object.keys(G.seenPlanes).map(k => k.split(':')[0])).size >= Object.keys(PLANES).length },
  { id: 'livery30', name: 'カラフルな空', desc: '30種類の塗装を見た', icon: 'star', c: () => Object.keys(G.seenPlanes).length >= 30 },
  { id: 'airline10', name: '人気者', desc: '10社と路線を結んだ', icon: 'globe', c: () => new Set(G.routes.map(r => r.airline)).size >= 10 },
  { id: 'stamp40', name: 'スタンプラリー', desc: '40都市のスタンプを集めた', icon: 'flag', c: () => Object.keys(G.stamps).length >= 40 },
  { id: 'paxall', name: 'いろんな人', desc: 'すべてのお客さんタイプが来た', icon: 'people', c: () => Object.keys(PAX).every(k => G.seenPax[k]) },
  { id: 'build100', name: '建設ラッシュ', desc: '建物を100個建てた', icon: 'hangar', c: () => Object.keys(G.blds).length >= 100 },
  { id: 'build300', name: '空港都市', desc: '建物を300個建てた', icon: 'hangar', c: () => Object.keys(G.blds).length >= 300 },
  { id: 'shop30', name: '巨大モール', desc: 'お店を30軒にした', icon: 'shopping', c: () => Object.values(G.blds).filter(b => B[b.id].cat === 'shop' || B[b.id].cat === 'food').length >= 30 },
  { id: 'gate10', name: '10番ゲート', desc: '搭乗口を10か所にした', icon: 'gate', c: () => countKind('gate') >= 10 },
  { id: 'stand20', name: 'ずらりと並ぶ翼', desc: '駐機場を20か所にした', icon: 'stand', c: () => countKind('stand') >= 20 },
  { id: 'lv5', name: 'ピカピカの店', desc: '施設をLv5にした', icon: 'up', c: () => Object.values(G.blds).some(b => b.lv >= 5) },
  { id: 'lv5x10', name: '名店ぞろい', desc: 'Lv5の施設が10軒', icon: 'up', c: () => Object.values(G.blds).filter(b => b.lv >= 5).length >= 10 },
  { id: 'beauty', name: '花の空港', desc: 'かざりを50個置いた', icon: 'flower', c: () => Object.values(G.blds).filter(b => B[b.id].cat === 'deco').length >= 50 },
  { id: 'night', name: '夜の空港', desc: '夜間照明システムを開発した', icon: 'moon', c: () => !!G.research.nightops },
  { id: 'cargo', name: '物流の拠点', desc: '貨物路線を3つ開いた', icon: 'cargo', c: () => G.routes.filter(r => PLANES[r.type].cargo).length >= 3 },
  { id: 'resort', name: '南国への入口', desc: 'リゾート路線を5つ開いた', icon: 'palm', c: () => G.routes.filter(r => CITIES[r.city].resort).length >= 5 },
  { id: 'island', name: '島をつなぐ', desc: '離島路線を4つ開いた', icon: 'pond', c: () => G.routes.filter(r => CITIES[r.city].island).length >= 4 },
  { id: 'ontime100', name: '定時の鬼', desc: '1日の定時運航率100%（10便以上）', icon: 'clock', c: () => RT.lastDay && RT.lastDay.flights >= 10 && RT.lastDay.late === 0 },
  { id: 'nomiss', name: 'だれも乗りおくれない', desc: '乗りおくれ0人の日（乗客500人以上）', icon: 'heart', c: () => RT.lastDay && RT.lastDay.pax >= 500 && RT.lastDay.missed < 0.5 },
  { id: 'sat80', name: '大満足', desc: '1日の満足度80以上', icon: 'heart', c: () => RT.lastDay && RT.lastDay.sat >= 80 },
  { id: 'visitors100', name: '見学スポット', desc: '1日の見学客100人', icon: 'binocular', c: () => RT.lastDay && RT.lastDay.visitors >= 100 },
  { id: 'income10m', name: '1日で1000万', desc: '1日の収入1,000万円', icon: 'money', c: () => RT.lastDay && RT.lastDay.inc >= 1e7 },
  { id: 'income100m', name: '1日で1億', desc: '1日の収入1億円', icon: 'money', c: () => RT.lastDay && RT.lastDay.inc >= 1e8 },
  { id: 'salute', name: 'ウォーターサリュート', desc: '新しい路線の初便を放水アーチでむかえた', icon: 'fountain', c: () => !!G.flags.salute },
  { id: 'deiced', name: '雪の日の職人', desc: '除氷作業をした', icon: 'snow', c: () => !!G.flags.deiced },
  { id: 'goaround', name: 'やり直しも大事', desc: 'ゴーアラウンドを見た', icon: 'plane2', c: () => !!G.flags.goAround },
  { id: 'event10', name: 'イベント好き', desc: 'イベントを10回経験した', icon: 'star', c: () => G.events.length >= 10 },
  { id: 'year5', name: '5年目の空港', desc: '5年目をむかえた', icon: 'sakura', c: () => dateOf(G.day).year >= 5 },
  { id: 'combo30', name: 'くみあわせ大全', desc: '組み合わせを30個発見', icon: 'note', c: () => Object.keys(G.combos).length >= 30 },
);

// ---------- お客さんのつぶやき 14 ----------
const VOICES = [
  { t: 'はやく乗らなきゃ！ 走れ〜！', c: p => p.kind === 'dep' && p.fl && G.min > p.fl.depT - 35 && p.steps[0] !== 'gate' },
  { t: '列が長いなぁ…', c: p => p.state === 'queue' && p.wait > 10 },
  { t: 'この空港、きれいで気持ちいい！', c: p => RT.beauty[p.tile] > 4 },
  { t: 'トイレどこかな…', c: p => p.needs && p.needs[0] === 'toilet' },
  { t: 'おなかすいた〜', c: p => p.needs && p.needs[0] === 'food' },
  { t: 'おみやげ、何にしよう？', c: p => p.needs && p.needs[0] === 'shop' },
  { t: '飛行機、かっこいい！', c: p => p.type === 'kid' || p.type === 'maniac' || p.type === 'photog' },
  { t: '今日はいい写真がとれそうだ', c: p => p.type === 'photog' || (p.kind === 'visit' && p.type === 'maniac') },
  { t: 'ねむい…', c: p => (G.min % 1440) < 7 * 60 || (G.min % 1440) > 21 * 60 },
  { t: 'わんちゃんも一緒に旅行だよ', c: p => p.type === 'petowner' },
  { t: '宇宙、楽しみだなぁ', c: p => p.type === 'astronaut' || (p.fl && CITIES[p.fl.city].region === 'space') },
  { t: '久しぶりの里帰りです', c: p => p.kind === 'arr' && (p.type === 'elder' || p.type === 'family') },
  { t: '波が待ってるぜ！', c: p => p.type === 'surfer' },
  { t: 'いい旅だった〜', c: p => p.kind === 'arr' && p.mood > 60 },
];
