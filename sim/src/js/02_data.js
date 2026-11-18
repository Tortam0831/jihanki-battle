// ============================================================
//  ゲームデータ（建物・飛行機・航空会社・都市・開発・組み合わせ…）
// ============================================================
const FLOOR = { NONE: 0, TAXI: 1, RUNWAY: 2, APRON: 3, TERM: 4, WALK: 5, ROAD: 6, LOT: 7 };
const TER = { GRASS: 0, WATER: 1, SAND: 2 };

const CATS = [
  { id: 'air', name: '滑走路・空側', icon: 'runway' },
  { id: 'term', name: 'ターミナル', icon: 'checkin' },
  { id: 'food', name: '飲食', icon: 'ramen' },
  { id: 'shop', name: 'ショップ', icon: 'gift' },
  { id: 'svc', name: 'サービス・娯楽', icon: 'sofa' },
  { id: 'land', name: '陸側・交通', icon: 'bus' },
  { id: 'deco', name: 'かざり', icon: 'tree' },
];

// zone: air=芝生の上(空側) / term=ターミナル床の上 / land=芝生の上(陸側) / any=芝生かターミナル床 / paint=床ぬり
// kind: 役割。need: 満たす欲求(food/shop/toilet/rest/fun)
const B = {};
function defB(id, o) { o.id = id; o.w = o.w || 1; o.h = o.h || 1; o.upkeep = o.upkeep || 0; o.rank = o.rank || 1; o.beauty = o.beauty || 0; B[id] = o; }

// ---- 空側 ----
defB('taxiway', { cat: 'air', name: '誘導路', paint: FLOOR.TAXI, cost: 4000, icon: 'taxiway', desc: '飛行機が通る道。滑走路と駐機場をつなごう。ドラッグで四角くぬれます。' });
defB('runway_s', { cat: 'air', name: '短い滑走路', kind: 'runway', zone: 'air', w: 12, h: 2, cls: 1, cost: 1200000, upkeep: 6000, icon: 'runway', desc: '小型機（プロペラ機など）が使える滑走路。' });
defB('runway_m', { cat: 'air', name: 'ふつうの滑走路', kind: 'runway', zone: 'air', w: 18, h: 2, cls: 2, cost: 4500000, upkeep: 16000, rank: 3, icon: 'runway', desc: 'ジェット機（中型まで）が使える滑走路。' });
defB('runway_l', { cat: 'air', name: '長い滑走路', kind: 'runway', zone: 'air', w: 24, h: 3, cls: 3, cost: 12000000, upkeep: 38000, rank: 6, icon: 'runway', desc: '大型機・ジャンボ機も使える長い滑走路。' });
defB('stand_s', { cat: 'air', name: '小型駐機場', kind: 'stand', zone: 'air', w: 3, h: 3, cls: 1, cost: 250000, upkeep: 1500, icon: 'stand', desc: '小型機がとまる場所。近く(7マス以内)にターミナルの搭乗口が必要。' });
defB('stand_m', { cat: 'air', name: '中型駐機場', kind: 'stand', zone: 'air', w: 4, h: 4, cls: 2, cost: 700000, upkeep: 4000, rank: 3, icon: 'stand', desc: '中型ジェット機までとまれる。' });
defB('stand_l', { cat: 'air', name: '大型駐機場', kind: 'stand', zone: 'air', w: 5, h: 5, cls: 3, cost: 1800000, upkeep: 9000, rank: 6, icon: 'stand', desc: '大型機・ジャンボ機もとまれる。' });
defB('tower', { cat: 'air', name: '管制塔', kind: 'tower', zone: 'air', w: 2, h: 2, cost: 600000, upkeep: 5000, unique: true, icon: 'tower', desc: '空港に必ず1つ必要。これがないと飛行機が飛べません。' });
defB('fire', { cat: 'air', name: '消防署', kind: 'fire', zone: 'air', w: 3, h: 2, cost: 800000, upkeep: 5000, rank: 2, unique: true, icon: 'fire', desc: '安全のための施設。ジェット機の路線を開くのに必要。評価もアップ。' });
defB('fuel', { cat: 'air', name: '給油施設', kind: 'fuel', zone: 'air', w: 3, h: 2, cost: 900000, upkeep: 4000, rank: 2, unique: true, icon: 'fuel', desc: '飛行機の折り返し時間が20%短くなり、燃料の売上も入る。' });
defB('hangar', { cat: 'air', name: '格納庫', kind: 'hangar', zone: 'air', w: 4, h: 4, cost: 2000000, upkeep: 7000, rank: 4, icon: 'hangar', desc: '整備のおかげで機材トラブルの遅れが減り、航空会社の好感度が上がりやすくなる。' });
defB('cargo', { cat: 'air', name: '貨物ターミナル', kind: 'cargo', zone: 'air', w: 4, h: 3, cost: 2500000, upkeep: 8000, rank: 4, icon: 'cargo', desc: '貨物便の路線が開けるようになる。' });
defB('snow', { cat: 'air', name: '除雪車庫', kind: 'snow', zone: 'air', w: 2, h: 2, cost: 700000, upkeep: 2500, rank: 3, unique: true, icon: 'snow', desc: '雪の日でも遅れが出にくくなる。' });
defB('radar', { cat: 'air', name: '気象レーダー', kind: 'radar', zone: 'air', w: 2, h: 2, cost: 1200000, upkeep: 3000, rank: 4, unique: true, icon: 'radar', desc: '天気予報が2日先までわかる。霧や台風の影響が少し軽くなる。' });
defB('ils', { cat: 'air', name: 'ILS（計器着陸装置）', kind: 'ils', zone: 'air', w: 1, h: 2, cost: 1500000, upkeep: 3000, rank: 3, unique: true, icon: 'ils', desc: '霧の日でも飛行機が着陸できるようになる。' });
defB('windsock', { cat: 'air', name: '吹き流し', kind: 'decor', zone: 'air', w: 1, h: 1, cost: 20000, beauty: 1, icon: 'windsock', desc: '風向きがわかる。飛行機マニアがよろこぶ。' });
defB('heliport', { cat: 'air', name: 'ヘリポート', kind: 'heliport', zone: 'air', w: 3, h: 3, cost: 1600000, upkeep: 4000, rank: 4, unique: true, icon: 'heli', desc: '遊覧ヘリが飛ぶ。見学のお客さんが増え、毎日の遊覧収入が入る。' });

// ---- ターミナル ----
defB('tfloor', { cat: 'term', name: 'ターミナル床', paint: FLOOR.TERM, cost: 3000, icon: 'checkin', desc: 'ターミナルの建物。ここにカウンターやお店を置ける。外側には自動でガラスの壁ができます。' });
defB('checkin', { cat: 'term', name: 'チェックインカウンター', kind: 'checkin', zone: 'term', w: 3, h: 1, cap: 3, svc: 3, cost: 120000, upkeep: 1200, icon: 'checkin', desc: '出発する人が最初に寄る場所。列が長いと不満がたまる。' });
defB('kiosk', { cat: 'term', name: '自動チェックイン機', kind: 'checkin', zone: 'term', w: 1, h: 1, cap: 1, svc: 2, cost: 90000, upkeep: 400, rank: 3, icon: 'kiosk', desc: 'すばやくチェックインできる機械。' });
defB('security', { cat: 'term', name: '保安検査場', kind: 'security', zone: 'term', w: 2, h: 2, cap: 3, svc: 2.2, cost: 250000, upkeep: 2500, icon: 'security', desc: '手荷物の検査。チェックインのあとに通る。' });
defB('gate', { cat: 'term', name: '搭乗口', kind: 'gate', zone: 'term', w: 2, h: 1, cost: 100000, upkeep: 800, icon: 'gate', desc: '飛行機に乗る場所。7マス以内の駐機場と自動でつながる。' });
defB('busgate', { cat: 'term', name: 'バスラウンジ', kind: 'gate', zone: 'term', w: 3, h: 2, bus: true, cost: 320000, upkeep: 2500, rank: 3, icon: 'busgate', desc: '遠くの駐機場までバスで送る搭乗口。距離に関係なくつながる（少し満足度が下がる）。' });
defB('baggage', { cat: 'term', name: '手荷物受取所', kind: 'baggage', zone: 'term', w: 3, h: 2, cap: 14, svc: 6, cost: 200000, upkeep: 1500, icon: 'baggage', desc: '到着した人が荷物を受け取る。' });
defB('emig', { cat: 'term', name: '出国審査場', kind: 'emig', zone: 'term', w: 2, h: 2, cap: 2, svc: 3, cost: 400000, upkeep: 3000, rank: 4, icon: 'passport', desc: '国際線に乗る人が通る。国際線には必須。' });
defB('immig', { cat: 'term', name: '入国審査・税関', kind: 'immig', zone: 'term', w: 3, h: 2, cap: 3, svc: 4, cost: 500000, upkeep: 3500, rank: 4, icon: 'customs', desc: '国際線で着いた人が通る。国際線には必須。' });
defB('info', { cat: 'term', name: '案内所', kind: 'aura', zone: 'term', w: 2, h: 1, cost: 80000, upkeep: 600, aura: 6, icon: 'info', desc: 'まわりの人の満足度が少し上がる。海外のお客さんに特に効く。' });
defB('toilet', { cat: 'term', name: 'トイレ', kind: 'svc', need: 'toilet', zone: 'term', w: 2, h: 2, cap: 4, svc: 3, price: 0, cost: 60000, upkeep: 500, icon: 'toilet', desc: 'みんなが使う大事な場所。足りないと大不満！' });
defB('nursing', { cat: 'term', name: 'ベビールーム', kind: 'aura', zone: 'term', w: 2, h: 1, cost: 100000, upkeep: 500, rank: 2, aura: 5, likes: ['family', 'kid'], icon: 'nursing', desc: '家族づれの満足度が上がる。' });
defB('firstaid', { cat: 'term', name: '救護室', kind: 'aura', zone: 'term', w: 2, h: 1, cost: 150000, upkeep: 800, rank: 3, aura: 4, likes: ['elder'], icon: 'firstaid', desc: 'お年寄りが安心。急病人イベントにも対応。' });
defB('bench', { cat: 'term', name: '待合いす', kind: 'svc', need: 'rest', zone: 'any', w: 2, h: 1, cap: 4, svc: 14, price: 0, cost: 15000, upkeep: 50, beauty: 0.5, icon: 'bench', desc: 'ひと休みできる。搭乗口の近くにあると便利。' });
defB('plant', { cat: 'term', name: '観葉植物', kind: 'decor', zone: 'term', w: 1, h: 1, cost: 8000, beauty: 2, icon: 'plant', desc: 'まわりがきれいになる。' });
defB('fids', { cat: 'term', name: '発着案内板', kind: 'aura', zone: 'term', w: 1, h: 1, cost: 40000, upkeep: 200, aura: 3, icon: 'board', desc: '出発時刻がわかって安心。まわりの満足度アップ。' });
defB('karakuri', { cat: 'term', name: 'からくり時計', kind: 'decor', zone: 'term', w: 2, h: 2, cost: 800000, upkeep: 500, rank: 5, beauty: 8, icon: 'clock', desc: '毎時ちょうどに人形が動く。見ると楽しい。' });

// ---- 飲食 ----
const FOODS = [
  ['conbini', 'コンビニ', 2, 2, 150000, 600, 4, 3, 1, 'store', ['food', 'shop']],
  ['cafe', 'カフェ', 2, 2, 200000, 700, 6, 12, 1, 'cafe', ['food', 'rest']],
  ['ramen', 'ラーメン屋', 2, 2, 250000, 1000, 6, 14, 1, 'ramen', ['food']],
  ['soba', '立ち食いそば', 2, 1, 120000, 500, 4, 6, 1, 'soba', ['food']],
  ['bakery', 'パン屋', 2, 2, 220000, 600, 4, 5, 2, 'bread', ['food']],
  ['bento', '空弁売り場', 2, 1, 140000, 1100, 3, 3, 2, 'bento', ['food', 'shop']],
  ['burger', 'ハンバーガー', 2, 2, 280000, 800, 8, 10, 2, 'burger', ['food']],
  ['curry', 'カレー屋', 2, 2, 260000, 900, 6, 12, 3, 'curry', ['food']],
  ['sushi', '回転寿司', 3, 2, 450000, 1800, 8, 18, 3, 'sushi', ['food']],
  ['sweets', 'スイーツ店', 2, 2, 300000, 700, 6, 10, 3, 'cake', ['food', 'fun']],
  ['chinese', '中華料理', 3, 2, 400000, 1400, 8, 16, 4, 'dumpling', ['food']],
  ['izakaya', '居酒屋', 3, 2, 420000, 2200, 8, 25, 4, 'beer', ['food', 'fun']],
  ['restaurant', '洋食レストラン', 3, 2, 600000, 2500, 8, 22, 5, 'fork', ['food']],
  ['steak', 'ステーキハウス', 3, 2, 800000, 3500, 8, 25, 6, 'steak', ['food']],
  ['foodcourt', 'フードコート', 4, 3, 1500000, 1000, 24, 14, 6, 'food', ['food', 'rest']],
  ['kaiseki', '料亭「雲の上」', 3, 3, 3000000, 8000, 8, 35, 8, 'sushi', ['food']],
];
for (const [id, name, w, h, cost, price, cap, svc, rank, icon, needs] of FOODS)
  defB(id, { cat: 'food', name, kind: 'svc', need: needs[0], need2: needs[1], zone: 'term', w, h, cost, price, cap, svc, rank, icon, upkeep: Math.round(cost * 0.006 / 100) * 100, inside: true, desc: `売上：1人 約${fmtNum(price)}円` });

// ---- ショップ ----
const SHOPS = [
  ['souvenir', 'おみやげ屋', 2, 2, 200000, 1500, 1, 'gift'],
  ['book', '本屋', 2, 2, 180000, 900, 2, 'book'],
  ['wagashi', '和菓子屋', 2, 2, 220000, 1200, 2, 'dango'],
  ['goods', '航空グッズ店', 2, 2, 260000, 1600, 3, 'plane2'],
  ['zakka', '雑貨屋', 2, 2, 240000, 1300, 3, 'star'],
  ['flower', '花屋', 2, 1, 150000, 1000, 3, 'flower'],
  ['pharmacy', 'ドラッグストア', 2, 2, 280000, 1200, 4, 'pill'],
  ['toy', 'おもちゃ屋', 2, 2, 300000, 1800, 4, 'bear'],
  ['apparel', 'アパレル', 3, 2, 450000, 3000, 5, 'shirt'],
  ['electronics', '家電ショップ', 3, 2, 600000, 4000, 5, 'tv'],
  ['dutyfree', '免税店', 3, 3, 1200000, 6000, 5, 'perfume'],
  ['brand', 'ブランドブティック', 3, 2, 2000000, 12000, 7, 'handbag'],
];
for (const [id, name, w, h, cost, price, rank, icon] of SHOPS)
  defB(id, { cat: 'shop', name, kind: 'svc', need: 'shop', zone: 'term', w, h, cost, price, cap: w * h, svc: 6, rank, icon, upkeep: Math.round(cost * 0.006 / 100) * 100, inside: true, intlOnly: id === 'dutyfree', rich: id === 'brand', desc: `売上：1人 約${fmtNum(price)}円` + (id === 'dutyfree' ? '（国際線の人だけ）' : '') });

// ---- サービス・娯楽 ----
defB('atm', { cat: 'svc', name: 'ATM', kind: 'aura', zone: 'term', w: 1, h: 1, cost: 60000, upkeep: 200, aura: 2, icon: 'atm', desc: 'お金をおろせるので、まわりのお店の売上が5%アップ。' });
defB('exchange', { cat: 'svc', name: '両替所', kind: 'svc', need: 'shop', zone: 'term', w: 2, h: 1, cap: 2, svc: 3, price: 300, cost: 150000, upkeep: 800, rank: 4, intlOnly: true, icon: 'coin', inside: false, desc: '海外のお客さんが使う。手数料収入。' });
defB('lounge', { cat: 'svc', name: 'ラウンジ', kind: 'svc', need: 'rest', zone: 'term', w: 3, h: 3, cap: 12, svc: 30, price: 2500, cost: 900000, upkeep: 5000, rank: 3, inside: true, likes: ['biz', 'vip', 'celeb'], icon: 'sofa', desc: 'ビジネス客やVIPがくつろぐ。' });
defB('footbath', { cat: 'svc', name: '足湯', kind: 'svc', need: 'rest', need2: 'fun', zone: 'term', w: 2, h: 2, cap: 6, svc: 15, price: 300, cost: 350000, upkeep: 1500, rank: 3, icon: 'onsen', desc: '足だけ温泉。とってもいやされる。' });
defB('game', { cat: 'svc', name: 'ゲームコーナー', kind: 'svc', need: 'fun', zone: 'term', w: 2, h: 2, cap: 6, svc: 12, price: 500, cost: 400000, upkeep: 2000, rank: 3, inside: true, likes: ['kid', 'student'], icon: 'game', desc: '子どもや学生に大人気。' });
defB('massage', { cat: 'svc', name: 'マッサージ', kind: 'svc', need: 'rest', zone: 'term', w: 2, h: 2, cap: 3, svc: 20, price: 2000, cost: 350000, upkeep: 1500, rank: 4, inside: true, likes: ['biz', 'elder'], icon: 'sofa', desc: '旅のつかれをほぐす。' });
defB('gallery', { cat: 'svc', name: '空のギャラリー', kind: 'svc', need: 'fun', zone: 'term', w: 3, h: 2, cap: 10, svc: 15, price: 500, cost: 600000, upkeep: 2000, rank: 4, beauty: 4, inside: true, likes: ['maniac', 'elder'], icon: 'picture', desc: '空や飛行機の絵を飾った美術館。' });
defB('aquarium', { cat: 'svc', name: '大水槽', kind: 'svc', need: 'fun', zone: 'term', w: 3, h: 2, cap: 12, svc: 8, price: 0, cost: 1000000, upkeep: 3000, rank: 5, beauty: 10, likes: ['kid', 'family', 'couple'], icon: 'fish', desc: '魚が泳ぐ大きな水槽。見るだけで幸せ。' });
defB('capsule', { cat: 'svc', name: 'カプセルホテル', kind: 'svc', need: 'rest', zone: 'term', w: 3, h: 2, cap: 8, svc: 45, price: 3500, cost: 900000, upkeep: 3500, rank: 5, inside: true, likes: ['backpack', 'biz'], icon: 'bed', desc: 'ひと眠りできる。早朝・深夜便の人に人気。' });
defB('cinema', { cat: 'svc', name: 'ミニシアター', kind: 'svc', need: 'fun', zone: 'term', w: 3, h: 3, cap: 16, svc: 40, price: 1500, cost: 1500000, upkeep: 5000, rank: 6, inside: true, likes: ['couple', 'student'], icon: 'film', desc: '待ち時間に映画を。' });
defB('planetarium', { cat: 'svc', name: 'プラネタリウム', kind: 'svc', need: 'fun', zone: 'term', w: 3, h: 3, cap: 20, svc: 30, price: 1200, cost: 2500000, upkeep: 6000, rank: 8, beauty: 6, inside: true, likes: ['couple', 'kid', 'family'], icon: 'moon', desc: '空の港ならではの星空体験。' });

// ---- 陸側・交通 ----
defB('walk', { cat: 'land', name: '歩道', paint: FLOOR.WALK, cost: 1500, icon: 'people', desc: '人が歩く道。バス停や駐車場とターミナルをつなごう。' });
defB('road', { cat: 'land', name: '道路', paint: FLOOR.ROAD, cost: 3000, icon: 'road', desc: '車が走る道（かざり）。にぎやかになる。' });
defB('busstop', { cat: 'land', name: 'バス停', kind: 'access', zone: 'land', w: 2, h: 1, cost: 120000, upkeep: 500, access: 40, icon: 'bus', desc: 'お客さんが来る入口。前に歩道かターミナル床が必要。' });
defB('taxistand', { cat: 'land', name: 'タクシー乗り場', kind: 'access', zone: 'land', w: 2, h: 1, cost: 150000, upkeep: 600, access: 30, likes: ['biz', 'vip', 'elder'], icon: 'taxi', desc: '入口。ビジネス客やお年寄りがよろこぶ。' });
defB('parking', { cat: 'land', name: '駐車場', kind: 'access', zone: 'land', w: 4, h: 3, cost: 300000, upkeep: 800, access: 60, park: 400, rank: 2, icon: 'parking', desc: '入口。駐車料金の収入もある。' });
defB('rentacar', { cat: 'land', name: 'レンタカー', kind: 'access', zone: 'land', w: 3, h: 2, cost: 400000, upkeep: 1200, access: 25, park: 1500, rank: 3, likes: ['tourist', 'family'], icon: 'key', desc: '入口。観光客に人気。貸出収入あり。' });
defB('parkingtower', { cat: 'land', name: '立体駐車場', kind: 'access', zone: 'land', w: 4, h: 4, cost: 1500000, upkeep: 3500, access: 200, park: 500, rank: 5, icon: 'parking', desc: 'たくさん車がとめられる入口。' });
defB('station', { cat: 'land', name: '空港駅', kind: 'access', zone: 'land', w: 6, h: 3, cost: 5000000, upkeep: 10000, access: 400, rank: 5, unique: true, icon: 'train', desc: '電車が来る大きな入口。たくさんの人が来られる。' });
defB('deck', { cat: 'land', name: '展望デッキ', kind: 'svc', need: 'fun', zone: 'land', w: 4, h: 3, cap: 20, svc: 20, price: 300, cost: 700000, upkeep: 2500, rank: 2, visitor: true, likes: ['maniac', 'kid', 'family'], icon: 'binocular', desc: '飛行機を見られる展望台。見学のお客さんが来る。滑走路の近くだとさらに人気。' });
defB('hotel', { cat: 'land', name: '空港ホテル', kind: 'hotel', zone: 'land', w: 4, h: 3, cost: 3000000, upkeep: 8000, rank: 4, income: 1, icon: 'bed', desc: '毎日、乗客数に応じた宿泊収入が入る。' });
defB('onsen', { cat: 'land', name: '温泉旅館', kind: 'hotel', zone: 'land', w: 4, h: 4, cost: 5000000, upkeep: 10000, rank: 6, income: 2, beauty: 5, icon: 'onsen', desc: '観光客の楽しみ。毎日の宿泊収入が大きい。' });
defB('solar', { cat: 'land', name: 'ソーラーパネル', kind: 'solar', zone: 'land', w: 3, h: 3, cost: 500000, upkeep: 0, rank: 3, icon: 'sun', desc: '電気代が浮いて、毎日の維持費が3,000円へる（晴れの日は5,000円）。' });
defB('park', { cat: 'land', name: '公園', kind: 'decor', zone: 'land', w: 4, h: 4, cost: 600000, upkeep: 1000, rank: 2, beauty: 8, visitor: true, icon: 'tree', desc: 'きれいな公園。見学のお客さんが増える。' });
defB('shrine', { cat: 'land', name: 'そらまる神社', kind: 'decor', zone: 'land', w: 3, h: 3, cost: 1000000, upkeep: 500, rank: 5, beauty: 6, unique: true, icon: 'mascot', desc: '空の安全を祈る神社。たまに「いいこと」が起きる。' });

// ---- かざり ----
defB('tree', { cat: 'deco', name: '木', kind: 'decor', zone: 'land', cost: 5000, beauty: 1.5, icon: 'tree', desc: 'まわりがきれいに。季節で色が変わる。' });
defB('sakura', { cat: 'deco', name: '桜の木', kind: 'decor', zone: 'land', cost: 20000, beauty: 3, icon: 'sakura', desc: '春に満開。春は美しさ2倍。' });
defB('pine', { cat: 'deco', name: '松の木', kind: 'decor', zone: 'land', cost: 8000, beauty: 1.5, icon: 'pine', desc: '一年中みどり。' });
defB('palm', { cat: 'deco', name: 'ヤシの木', kind: 'decor', zone: 'land', cost: 15000, beauty: 2.5, rank: 3, icon: 'palm', desc: '南国気分。' });
defB('bush', { cat: 'deco', name: '植えこみ', kind: 'decor', zone: 'land', cost: 3000, beauty: 1, icon: 'bush', desc: '小さな植えこみ。' });
defB('flowerbed', { cat: 'deco', name: '花だん', kind: 'decor', zone: 'any', w: 2, h: 1, cost: 20000, beauty: 3, icon: 'flower', desc: 'お花がいっぱい。' });
defB('fountain', { cat: 'deco', name: '噴水', kind: 'decor', zone: 'any', w: 2, h: 2, cost: 150000, upkeep: 300, beauty: 8, icon: 'fountain', desc: 'まわりがぐっときれいになる。' });
defB('statue', { cat: 'deco', name: '飛行機の像', kind: 'decor', zone: 'any', w: 2, h: 2, cost: 300000, beauty: 10, rank: 4, icon: 'statue', desc: '空港のシンボル。' });
defB('lamp', { cat: 'deco', name: '街灯', kind: 'decor', zone: 'land', cost: 10000, beauty: 1, lamp: true, icon: 'lamp', desc: '夜にあかりがともる。' });
defB('flag', { cat: 'deco', name: '旗', kind: 'decor', zone: 'land', cost: 10000, beauty: 1, icon: 'flag', desc: '風になびく旗。' });
defB('benchout', { cat: 'deco', name: '外のベンチ', kind: 'decor', zone: 'land', w: 2, h: 1, cost: 12000, beauty: 0.5, icon: 'bench', desc: '見学のお客さんがすわる。' });
defB('pond', { cat: 'deco', name: '池', kind: 'decor', zone: 'land', w: 3, h: 3, cost: 80000, beauty: 5, icon: 'pond', desc: '小さな池。鳥が来ることも。' });
defB('clocktower', { cat: 'deco', name: '時計台', kind: 'decor', zone: 'land', w: 2, h: 2, cost: 400000, beauty: 8, rank: 5, icon: 'clock', desc: 'まちのシンボル。' });
defB('snowman', { cat: 'deco', name: '雪だるま', kind: 'decor', zone: 'land', cost: 1000, beauty: 2, winter: true, icon: 'snow', desc: '冬だけ作れる。春になるととける。' });

// ---- 予約された（初期配置） ----
const BUILD_ORDER = Object.keys(B);

// ============================================================
//  飛行機
// ============================================================
// cls: 必要な滑走路/駐機場の大きさ  len/span: 見た目の長さ・翼幅(マス)  eng: 'prop'|'jet'|'rear'|'jet4'
const PLANES = {
  humming:  { name: 'ハミング19', cls: 1, seats: 19, len: 1.7, span: 2.0, eng: 'prop', engines: 2, turn: 30, fee: 40000, rank: 1, desc: '小さなプロペラ機。島や地方の路線で活躍。' },
  tsubame:  { name: 'ツバメ72', cls: 1, seats: 72, len: 2.5, span: 2.7, eng: 'prop', engines: 2, turn: 35, fee: 75000, rank: 2, desc: '使いやすいターボプロップ機。' },
  sparrow:  { name: 'スパロウ8', cls: 1, seats: 8, len: 1.6, span: 1.6, eng: 'rear', engines: 2, turn: 25, fee: 150000, rank: 5, vip: true, desc: 'ビジネスジェット。VIPがたくさん乗る。' },
  swallow:  { name: 'スワロー90', cls: 2, seats: 90, len: 2.9, span: 2.6, eng: 'rear', engines: 2, turn: 40, fee: 120000, rank: 3, desc: 'リージョナルジェット。速くて静か。' },
  kamome:   { name: 'カモメ170', cls: 2, seats: 170, len: 3.4, span: 3.4, eng: 'jet', engines: 2, turn: 45, fee: 200000, rank: 3, desc: 'いちばん多く飛んでいる中型ジェット。' },
  pelican:  { name: 'ペリカン220', cls: 2, seats: 220, len: 3.9, span: 3.5, eng: 'jet', engines: 2, turn: 50, fee: 260000, rank: 5, desc: '胴体が長い中型ジェット。' },
  cargo_s:  { name: 'カーゴカモメ', cls: 2, seats: 0, cargo: 40, len: 3.4, span: 3.4, eng: 'jet', engines: 2, turn: 50, fee: 220000, rank: 4, desc: '貨物専用の中型機。' },
  albatross:{ name: 'アルバトロス320', cls: 3, seats: 320, len: 4.6, span: 4.8, eng: 'jet', engines: 2, turn: 70, fee: 450000, rank: 6, wide: true, desc: '長い距離を飛べる大型機。' },
  whale:    { name: 'ホエール500', cls: 3, seats: 500, len: 5.0, span: 5.2, eng: 'jet4', engines: 4, turn: 85, fee: 750000, rank: 8, wide: true, hump: true, desc: '2階建てのジャンボ機。空の女王。' },
  cargo_l:  { name: 'カーゴホエール', cls: 3, seats: 0, cargo: 110, len: 5.0, span: 5.2, eng: 'jet4', engines: 4, turn: 90, fee: 650000, rank: 6, wide: true, hump: true, desc: '巨大な貨物機。' },
  sst:      { name: 'ファルコンSST', cls: 3, stand: 2, seats: 100, len: 4.4, span: 2.4, eng: 'sst', engines: 4, turn: 60, fee: 900000, rank: 9, desc: '音よりも速い夢の旅客機。' },
  cosmo:    { name: 'コスモライナー', cls: 3, seats: 60, len: 4.6, span: 3.0, eng: 'space', engines: 3, turn: 90, fee: 2500000, rank: 10, desc: '宇宙まで行ける往還機。' },
};

// ============================================================
//  航空会社（すべて架空）
// ============================================================
const AIRLINES = {
  soyokaze: { name: 'そよかぜエア', code: 'SY', body: '#ffffff', tail: '#4cb85c', accent: '#ffd84a', fleet: ['humming', 'tsubame'], rank: 1, cities: ['shimo', 'kita', 'sendai', 'niigata', 'kochi', 'matsuyama', 'okushiri', 'tokyo'], desc: '地元の小さな航空会社。担当はツバサさん。' },
  haruka:   { name: 'はるか航空', code: 'HR', body: '#ffffff', tail: '#3a7bd5', accent: '#e5484d', fleet: ['tsubame', 'swallow', 'kamome', 'pelican'], rank: 2, cities: ['tokyo', 'osaka', 'sapporo', 'fukuoka', 'nagoya', 'sendai', 'hiroshima', 'kagoshima', 'naha'], desc: '国内を広く飛ぶ大手。' },
  penguin:  { name: 'ペンギンエクスプレス', code: 'PG', body: '#ffffff', tail: '#2a2a36', accent: '#ffd84a', fleet: ['kamome'], rank: 3, lcc: true, cities: ['tokyo', 'osaka', 'sapporo', 'fukuoka', 'naha', 'seoul', 'taipei'], desc: '安い運賃のLCC。たくさん乗るが、お買い物は少なめ。' },
  mermaid:  { name: 'マーメイドエア', code: 'MM', body: '#ffffff', tail: '#3fd0c9', accent: '#ff7a8a', fleet: ['tsubame', 'kamome'], rank: 3, resort: true, cities: ['naha', 'ishigaki', 'miyako', 'amami', 'guam', 'honolulu'], desc: '南の島へ飛ぶリゾート航空。観光客が多い。' },
  north:    { name: 'ノースウイング', code: 'NW', body: '#ffffff', tail: '#2b3f80', accent: '#c8d0e0', fleet: ['swallow', 'kamome'], rank: 3, cities: ['sapporo', 'hakodate', 'kushiro', 'aomori', 'sendai', 'vladi'], desc: '北の空にくわしい航空会社。' },
  aozora:   { name: 'あおぞらカーゴ', code: 'AC', body: '#ffffff', tail: '#f08a24', accent: '#2a2a36', fleet: ['cargo_s', 'cargo_l'], rank: 4, cargo: true, cities: ['tokyo', 'osaka', 'shanghai', 'hongkong', 'singapore', 'la'], desc: '荷物を運ぶ貨物航空会社。' },
  sakura:   { name: 'サクラ・インターナショナル', code: 'SK', body: '#ffffff', tail: '#f07aa8', accent: '#b03060', fleet: ['kamome', 'pelican', 'albatross', 'whale'], rank: 4, cities: ['seoul', 'taipei', 'shanghai', 'hongkong', 'bangkok', 'singapore', 'manila', 'hanoi', 'honolulu', 'sydney', 'paris'], desc: 'アジアを結ぶ国際線の大手。' },
  eagle:    { name: 'ゴールデンイーグル航空', code: 'GE', body: '#f8f4ec', tail: '#c0302a', accent: '#e8b830', fleet: ['albatross', 'whale'], rank: 6, cities: ['la', 'newyork', 'vancouver', 'honolulu', 'dubai', 'london'], desc: '太平洋をまたぐ大きな航空会社。' },
  aurora:   { name: 'オーロラ・ノルディック', code: 'AN', body: '#ffffff', tail: '#7a4fc0', accent: '#5ce0a0', fleet: ['pelican', 'albatross'], rank: 7, cities: ['helsinki', 'london', 'paris', 'dubai'], desc: 'ヨーロッパへの直行便。' },
  koala:    { name: 'コアラ・パシフィック', code: 'KP', body: '#ffffff', tail: '#7a8a90', accent: '#a8d840', fleet: ['albatross'], rank: 7, resort: true, cities: ['sydney', 'cairns', 'auckland', 'guam'], desc: '南半球の航空会社。' },
  falcon:   { name: 'ロイヤルファルコン', code: 'RF', body: '#2a1a22', tail: '#8a1f2f', accent: '#e8c050', fleet: ['sparrow', 'sst'], rank: 8, lux: true, needRating: 4.3, cities: ['tokyo', 'singapore', 'dubai', 'london', 'newyork', 'paris'], desc: '超高級航空会社。評価★4.3以上の空港にしか来ない。' },
  cosmo:    { name: 'コスモライン', code: 'CL', body: '#e8eef8', tail: '#1a1a3a', accent: '#40e0ff', fleet: ['cosmo'], rank: 10, space: true, needRating: 4.5, cities: ['moon', 'orbit'], desc: '宇宙への定期便！' },
};

// ============================================================
//  都市（就航先）  region: dom=国内 / asia=アジア / long=長距離 / space
// ============================================================
const CITIES = {
  shimo:    { name: '下島', region: 'dom', demand: 2, rank: 1, island: true, x: 0.2, y: 0.5 },
  okushiri: { name: '奥尻', region: 'dom', demand: 1, rank: 1, island: true },
  kita:     { name: '北の町', region: 'dom', demand: 2, rank: 1 },
  tokyo:    { name: '東京', region: 'dom', demand: 5, rank: 1 },
  sendai:   { name: '仙台', region: 'dom', demand: 3, rank: 1 },
  niigata:  { name: '新潟', region: 'dom', demand: 2, rank: 2 },
  kochi:    { name: '高知', region: 'dom', demand: 2, rank: 2 },
  matsuyama:{ name: '松山', region: 'dom', demand: 2, rank: 2 },
  osaka:    { name: '大阪', region: 'dom', demand: 5, rank: 2 },
  nagoya:   { name: '名古屋', region: 'dom', demand: 4, rank: 3 },
  sapporo:  { name: '札幌', region: 'dom', demand: 4, rank: 3 },
  fukuoka:  { name: '福岡', region: 'dom', demand: 4, rank: 3 },
  hiroshima:{ name: '広島', region: 'dom', demand: 3, rank: 3 },
  kagoshima:{ name: '鹿児島', region: 'dom', demand: 3, rank: 3 },
  hakodate: { name: '函館', region: 'dom', demand: 3, rank: 3 },
  kushiro:  { name: '釧路', region: 'dom', demand: 2, rank: 3 },
  aomori:   { name: '青森', region: 'dom', demand: 2, rank: 3 },
  naha:     { name: '那覇', region: 'dom', demand: 5, rank: 3, resort: true },
  ishigaki: { name: '石垣', region: 'dom', demand: 3, rank: 3, resort: true },
  miyako:   { name: '宮古島', region: 'dom', demand: 3, rank: 4, resort: true },
  amami:    { name: '奄美', region: 'dom', demand: 2, rank: 4, resort: true },
  seoul:    { name: 'ソウル', region: 'asia', demand: 5, rank: 4 },
  taipei:   { name: '台北', region: 'asia', demand: 5, rank: 4 },
  vladi:    { name: 'ウラジオストク', region: 'asia', demand: 2, rank: 5 },
  shanghai: { name: '上海', region: 'asia', demand: 5, rank: 5 },
  hongkong: { name: '香港', region: 'asia', demand: 4, rank: 5 },
  guam:     { name: 'グアム', region: 'asia', demand: 3, rank: 5, resort: true },
  manila:   { name: 'マニラ', region: 'asia', demand: 3, rank: 5 },
  bangkok:  { name: 'バンコク', region: 'asia', demand: 4, rank: 6 },
  hanoi:    { name: 'ハノイ', region: 'asia', demand: 3, rank: 6 },
  singapore:{ name: 'シンガポール', region: 'asia', demand: 5, rank: 6 },
  honolulu: { name: 'ホノルル', region: 'long', demand: 5, rank: 6, resort: true },
  sydney:   { name: 'シドニー', region: 'long', demand: 4, rank: 7 },
  cairns:   { name: 'ケアンズ', region: 'long', demand: 3, rank: 7, resort: true },
  auckland: { name: 'オークランド', region: 'long', demand: 3, rank: 7 },
  la:       { name: 'ロサンゼルス', region: 'long', demand: 5, rank: 7 },
  vancouver:{ name: 'バンクーバー', region: 'long', demand: 4, rank: 7 },
  dubai:    { name: 'ドバイ', region: 'long', demand: 4, rank: 8 },
  helsinki: { name: 'ヘルシンキ', region: 'long', demand: 3, rank: 8 },
  london:   { name: 'ロンドン', region: 'long', demand: 5, rank: 8 },
  paris:    { name: 'パリ', region: 'long', demand: 5, rank: 8 },
  newyork:  { name: 'ニューヨーク', region: 'long', demand: 5, rank: 9 },
  moon:     { name: '月面ステーション', region: 'space', demand: 5, rank: 10 },
  orbit:    { name: '宇宙ホテル「ほしぞら」', region: 'space', demand: 4, rank: 10 },
};
const REGION_NAME = { dom: '国内線', asia: '国際線（近距離）', long: '国際線（長距離）', space: '宇宙線' };
// 地域ごとの最低機材クラス
const REGION_CLS = { dom: 1, asia: 2, long: 3, space: 3 };
// 乗客1人あたりの空港使用料
const REGION_PFC = { dom: 350, asia: 1200, long: 2200, space: 10000 };

// ============================================================
//  乗客タイプ
// ============================================================
// needs: 各欲求の確率   money: お買い物の量
const PAX = {
  biz:      { name: 'ビジネスマン', speed: 1.15, money: 1.3, needs: { food: .55, shop: .25, toilet: .4, rest: .5, fun: .05 }, desc: '時間に正確。ラウンジとタクシーが好き。' },
  worker:   { name: '会社員', speed: 1.05, money: 1.0, needs: { food: .6, shop: .45, toilet: .45, rest: .3, fun: .1 }, desc: 'おみやげを買って帰りたい。' },
  family:   { name: '家族づれ', speed: .9, money: 1.2, needs: { food: .7, shop: .6, toilet: .6, rest: .3, fun: .35 }, desc: 'ベビールームがあると安心。' },
  kid:      { name: '子ども', speed: 1.1, money: .4, needs: { food: .5, shop: .3, toilet: .6, rest: .1, fun: .8 }, desc: 'ゲームと飛行機が大好き。' },
  student:  { name: '学生', speed: 1.1, money: .6, needs: { food: .6, shop: .4, toilet: .4, rest: .2, fun: .5 }, desc: '安くておいしいものが好き。' },
  elder:    { name: 'お年寄り', speed: .7, money: 1.1, needs: { food: .5, shop: .5, toilet: .7, rest: .7, fun: .2 }, desc: 'いすがたくさんあるとうれしい。' },
  tourist:  { name: '観光客', speed: .95, money: 1.3, needs: { food: .75, shop: .8, toilet: .5, rest: .2, fun: .4 }, desc: 'おみやげをたくさん買う。' },
  backpack: { name: 'バックパッカー', speed: 1.0, money: .5, needs: { food: .6, shop: .2, toilet: .5, rest: .5, fun: .3 }, desc: '節約旅行。カプセルホテルが好き。' },
  foreign:  { name: '海外からの旅行者', speed: 1.0, money: 1.6, needs: { food: .75, shop: .85, toilet: .5, rest: .3, fun: .35 }, desc: '免税店と和食が大好き。' },
  couple:   { name: '新婚さん', speed: .95, money: 1.5, needs: { food: .7, shop: .7, toilet: .4, rest: .2, fun: .5 }, desc: 'すてきな場所が好き。' },
  vip:      { name: 'VIP', speed: 1.0, money: 4.0, needs: { food: .6, shop: .6, toilet: .3, rest: .9, fun: .1 }, desc: 'お金持ち。ラウンジがないと不満。' },
  maniac:   { name: '飛行機マニア', speed: 1.1, money: 1.0, needs: { food: .4, shop: .6, toilet: .3, rest: .1, fun: .9 }, desc: '展望デッキと航空グッズ店が好き。' },
  celeb:    { name: '有名人', speed: 1.0, money: 3.0, needs: { food: .5, shop: .7, toilet: .3, rest: .8, fun: .2 }, desc: 'ときどきお忍びでやってくる。' },
};
const MIX = {
  dom:    { biz: 25, worker: 18, family: 12, kid: 8, student: 8, elder: 10, tourist: 12, maniac: 3, couple: 4 },
  resort: { tourist: 28, family: 18, kid: 14, couple: 14, worker: 6, elder: 8, student: 6, backpack: 4, maniac: 2 },
  island: { elder: 22, worker: 18, family: 14, kid: 8, biz: 10, tourist: 16, student: 8, maniac: 4 },
  lcc:    { student: 20, worker: 18, tourist: 18, backpack: 14, family: 10, kid: 6, couple: 6, biz: 8 },
  asia:   { foreign: 35, biz: 18, tourist: 18, worker: 8, couple: 8, family: 6, kid: 3, backpack: 4 },
  long:   { foreign: 38, biz: 22, tourist: 14, couple: 10, family: 6, kid: 3, vip: 3, backpack: 4 },
  lux:    { vip: 45, biz: 30, celeb: 5, couple: 20 },
  space:  { vip: 30, couple: 20, maniac: 25, foreign: 15, celeb: 10 },
};

// ============================================================
//  空港ランク
// ============================================================
const RANKS = [
  { name: 'ちいさな飛行場', pts: 0 },
  { name: '町の空港', pts: 500 },
  { name: '地方空港', pts: 2500 },
  { name: '国際空港', pts: 8000 },
  { name: 'にぎわい空港', pts: 18000 },
  { name: '地域の玄関口', pts: 35000 },
  { name: 'アジアのハブ', pts: 60000 },
  { name: '世界の空港', pts: 100000 },
  { name: 'あこがれの空港', pts: 160000 },
  { name: '伝説のそらのみなと', pts: 250000 },
];
const LAND_COST = [0, 0, 0, 0, 800000, 1500000, 2500000, 4000000, 6000000, 9000000, 13000000, 18000000, 24000000, 30000000, 38000000, 46000000, 55000000, 65000000, 75000000, 90000000, 100000000, 120000000, 140000000, 160000000];

// ============================================================
//  開発（研究）
// ============================================================
const RESEARCH = [
  { id: 'wifi', name: '無料Wi-Fi', icon: 'wifi', dev: 10, cost: 300000, rank: 1, desc: 'みんなの満足度 +4' },
  { id: 'fidsplus', name: 'アナウンス放送', icon: 'sound', dev: 8, cost: 150000, rank: 1, desc: '搭乗に乗りおくれる人が減る。チャイムが鳴る♪' },
  { id: 'autock', name: 'スマートチェックイン', icon: 'kiosk', dev: 20, cost: 600000, rank: 2, desc: 'チェックインの速さ +30%' },
  { id: 'nightops', name: '夜間照明システム', icon: 'lamp', dev: 25, cost: 1500000, rank: 2, desc: '22時〜24時、5時〜6時も飛行機が飛べる。夜景も美しく。' },
  { id: 'promo', name: '空港PRキャンペーン', icon: 'star', dev: 15, cost: 800000, rank: 2, desc: '乗客の需要 +10%' },
  { id: 'pointcard', name: 'そらポイントカード', icon: 'coin', dev: 20, cost: 700000, rank: 2, desc: 'お店の売上 +10%' },
  { id: 'clean', name: 'おそうじロボ', icon: 'gear', dev: 18, cost: 500000, rank: 2, desc: '美しさ +15%。ロボットがターミナルを走る。' },
  { id: 'smartsec', name: 'スマート保安検査', icon: 'security', dev: 30, cost: 1200000, rank: 3, desc: '保安検査の速さ +30%' },
  { id: 'mascot', name: 'マスコット「ソラまる」', icon: 'mascot', dev: 30, cost: 1000000, rank: 3, desc: 'ソラまるがターミナルを歩き回る。近くの人の満足度アップ。' },
  { id: 'gourmet', name: 'ご当地グルメフェア', icon: 'ramen', dev: 30, cost: 1200000, rank: 3, desc: '飲食店の売上 +15%' },
  { id: 'eco', name: '省エネ設備', icon: 'sun', dev: 35, cost: 2000000, rank: 3, desc: '維持費 -15%' },
  { id: 'reno1', name: '施設改装 I', icon: 'up', dev: 25, cost: 1000000, rank: 3, desc: '施設をLv3までレベルアップできる。' },
  { id: 'ontime', name: '定時運航プログラム', icon: 'clock', dev: 35, cost: 1500000, rank: 4, desc: '航空会社の好感度が上がりやすくなる。' },
  { id: 'multi', name: '多言語案内', icon: 'globe', dev: 40, cost: 1500000, rank: 4, desc: '海外のお客さんの満足度 +8' },
  { id: 'autobag', name: '手荷物自動仕分け', icon: 'baggage', dev: 40, cost: 2000000, rank: 4, desc: '手荷物受取の速さ +40%、到着客の満足度アップ。' },
  { id: 'snowtech', name: '除雪技術', icon: 'snow', dev: 30, cost: 1000000, rank: 4, desc: '雪の影響がさらに減る。' },
  { id: 'airshow', name: '航空祭の開催', icon: 'plane2', dev: 50, cost: 3000000, rank: 4, desc: '毎年秋に「航空祭」イベント。見学客が大集合！' },
  { id: 'reno2', name: '施設改装 II', icon: 'up', dev: 60, cost: 4000000, rank: 5, desc: '施設をLv5までレベルアップできる。' },
  { id: 'facegate', name: '顔認証ゲート', icon: 'camera', dev: 60, cost: 4000000, rank: 5, desc: '保安検査・出国審査・搭乗がさらに速く。' },
  { id: 'lightup', name: '夜景ライトアップ', icon: 'moon', dev: 40, cost: 2500000, rank: 5, desc: '夜の美しさ2倍。夜の見学客が増える。' },
  { id: 'dutyplus', name: '免税ショッピング拡大', icon: 'perfume', dev: 60, cost: 5000000, rank: 6, desc: '免税店・ブランド店の売上 +25%' },
  { id: 'hubnet', name: '乗り継ぎネットワーク', icon: 'globe', dev: 80, cost: 8000000, rank: 6, desc: '路線が多いほど需要アップ（1路線につき+1%、最大+30%）' },
  { id: 'firstlounge', name: 'ファーストクラスラウンジ', icon: 'sofa', dev: 70, cost: 6000000, rank: 7, desc: 'ラウンジの売上2倍、VIPの満足度アップ。' },
  { id: 'ecoplus', name: '再生可能エネルギー', icon: 'sun', dev: 90, cost: 10000000, rank: 7, desc: '維持費 さらに -15%' },
  { id: 'aitower', name: 'AI管制システム', icon: 'tower', dev: 100, cost: 15000000, rank: 8, desc: '滑走路の使用間隔が短くなり、たくさん発着できる。' },
  { id: 'spaceport', name: '宇宙港計画', icon: 'rocket', dev: 150, cost: 50000000, rank: 10, desc: '宇宙への路線を開くための研究。' },
];
const RESEARCH_BY = {}; RESEARCH.forEach(r => RESEARCH_BY[r.id] = r);

// ============================================================
//  組み合わせ（となり合わせボーナス）  半径4マス以内
// ============================================================
const COMBOS = [
  { id: 'bookcafe', name: 'ブックカフェ', need: ['book', 'cafe'], bonus: 0.25, desc: '本屋とカフェが近い。売上+25%' },
  { id: 'washoku', name: '和食横丁', need: [['ramen', 'soba', 'sushi', 'izakaya', 'kaiseki'], 3], bonus: 0.3, desc: '和食のお店が3つ集まる。売上+30%、海外客大よろこび' },
  { id: 'omiyage', name: 'おみやげ通り', need: ['souvenir', 'wagashi'], bonus: 0.25, desc: 'おみやげ屋と和菓子屋。売上+25%' },
  { id: 'luxury', name: 'ラグジュアリーモール', need: ['dutyfree', 'brand'], bonus: 0.35, desc: '免税店とブランド店。売上+35%' },
  { id: 'ikoi', name: 'いこいの広場', need: ['bench', 'plant', 'fountain'], bonus: 0.2, desc: 'いす・植物・噴水。休けいの満足度アップ' },
  { id: 'yuge', name: '湯けむり茶屋', need: ['footbath', 'wagashi'], bonus: 0.3, desc: '足湯と和菓子。売上+30%' },
  { id: 'kids', name: 'キッズパラダイス', need: ['game', 'toy'], bonus: 0.3, desc: 'ゲームとおもちゃ。子どもが大はしゃぎ' },
  { id: 'inbound', name: 'インバウンド窓口', need: ['info', 'exchange'], bonus: 0.2, desc: '案内所と両替所。海外客の満足度アップ' },
  { id: 'omotenashi', name: 'おもてなしフロア', need: ['lounge', 'restaurant'], bonus: 0.25, desc: 'ラウンジとレストラン。VIP大満足' },
  { id: 'museum', name: 'ヒコーキ博物館', need: ['goods', 'gallery'], bonus: 0.3, desc: 'グッズ店とギャラリー。マニアが集まる' },
  { id: 'morning', name: 'モーニングセット', need: ['bakery', 'cafe'], bonus: 0.25, desc: 'パン屋とカフェ。朝の売上が特に好調' },
  { id: 'bkyu', name: 'B級グルメ街', need: [['burger', 'curry', 'chinese', 'ramen'], 3], bonus: 0.25, desc: '気軽なごはん屋が3つ。売上+25%' },
  { id: 'garden', name: 'フラワーガーデン', need: ['flower', 'flowerbed'], bonus: 0.2, desc: '花屋と花だん。美しさアップ' },
  { id: 'sushiaqua', name: 'おすし水族館', need: ['aquarium', 'sushi'], bonus: 0.3, desc: '水槽を見ながらおすし…？ 売上+30%' },
  { id: 'resort', name: 'リゾートステイ', need: ['hotel', 'onsen'], bonus: 0.3, desc: 'ホテルと温泉旅館。宿泊収入+30%' },
  { id: 'oyasumi', name: 'おやすみスポット', need: ['massage', 'capsule'], bonus: 0.25, desc: 'マッサージとカプセルホテル。売上+25%' },
  { id: 'hashigo', name: 'はしご酒', need: ['izakaya', 'ramen'], bonus: 0.2, desc: '居酒屋のあとはラーメン。売上+20%' },
  { id: 'dream', name: '夢見るシアター', need: ['cinema', 'planetarium'], bonus: 0.3, desc: '映画と星空。売上+30%' },
  { id: 'health', name: 'すこやかコーナー', need: ['pharmacy', 'firstaid'], bonus: 0.2, desc: 'ドラッグストアと救護室。お年寄り安心' },
  { id: 'sweetcafe', name: 'スイーツタイム', need: ['sweets', 'cafe'], bonus: 0.2, desc: 'スイーツとカフェ。売上+20%' },
  { id: 'souvenir2', name: '空の市場', need: ['bento', 'souvenir', 'conbini'], bonus: 0.2, desc: '空弁・おみやげ・コンビニ。売上+20%' },
  { id: 'sakuranami', name: '桜並木', need: [['sakura'], 4], bonus: 0.2, desc: '桜の木が4本。春の美しさがすごい' },
];

// ============================================================
//  実績
// ============================================================
const ACHIEVEMENTS = [
  { id: 'first', name: 'はじめてのお客さん', desc: '最初の便をむかえた', icon: 'plane' },
  { id: 'pax100', name: '100人のえがお', desc: '1日の乗客 100人', icon: 'people' },
  { id: 'pax1000', name: 'にぎわいターミナル', desc: '1日の乗客 1,000人', icon: 'people' },
  { id: 'pax5000', name: '人の波', desc: '1日の乗客 5,000人', icon: 'people' },
  { id: 'pax10000', name: '空の大都会', desc: '1日の乗客 10,000人', icon: 'people' },
  { id: 'total1m', name: 'ミリオンフライヤー', desc: '累計乗客 100万人', icon: 'star' },
  { id: 'routes5', name: '路線網', desc: '路線を5つ開いた', icon: 'globe' },
  { id: 'routes15', name: 'ネットワーク空港', desc: '路線を15つ開いた', icon: 'globe' },
  { id: 'routes30', name: '世界とつながる', desc: '路線を30開いた', icon: 'globe' },
  { id: 'intl', name: 'はじめての国際線', desc: '国際線を開いた', icon: 'passport' },
  { id: 'long', name: '海をこえて', desc: '長距離国際線を開いた', icon: 'plane2' },
  { id: 'space', name: '宇宙へ', desc: '宇宙線を開いた', icon: 'rocket' },
  { id: 'star3', name: '★3つ', desc: '評価★3.0', icon: 'star' },
  { id: 'star4', name: '★4つ', desc: '評価★4.0', icon: 'star' },
  { id: 'star5', name: '最高の空港', desc: '評価★4.8', icon: 'star' },
  { id: 'money10m', name: 'お金持ち空港', desc: '所持金 1,000万円', icon: 'money' },
  { id: 'money100m', name: '億万長者', desc: '所持金 1億円', icon: 'money' },
  { id: 'money1b', name: '大富豪', desc: '所持金 10億円', icon: 'money' },
  { id: 'combo1', name: 'ひらめき', desc: '組み合わせを1つ発見', icon: 'note' },
  { id: 'combo10', name: 'くみあわせ名人', desc: '組み合わせを10個発見', icon: 'note' },
  { id: 'comboall', name: 'くみあわせ博士', desc: '組み合わせをすべて発見', icon: 'note' },
  { id: 'runway3', name: '3本の滑走路', desc: '滑走路を3本持つ', icon: 'runway' },
  { id: 'jumbo', name: '空の女王', desc: 'ホエール500がやってきた', icon: 'plane' },
  { id: 'sst', name: '音速の翼', desc: 'ファルコンSSTがやってきた', icon: 'plane2' },
  { id: 'land', name: '土地もち', desc: '土地を全部買った', icon: 'flag' },
  { id: 'research', name: '研究熱心', desc: '開発を15こ完了', icon: 'flask' },
  { id: 'research_all', name: '未来の空港', desc: '開発をすべて完了', icon: 'flask' },
  { id: 'year3', name: '3年目の春', desc: '3年目をむかえた', icon: 'sakura' },
  { id: 'typhoon', name: '台風をのりこえて', desc: '台風の日を経験した', icon: 'sweat' },
  { id: 'airshow', name: '航空祭', desc: '航空祭を開いた', icon: 'plane2' },
  { id: 'rank10', name: '伝説の空港長', desc: 'ランク10に到達', icon: 'star' },
  { id: 'ending', name: 'そらのみなと', desc: 'エンディングを見た', icon: 'heart' },
];

// 天気
const WEATHER = {
  sun: { name: '晴れ', icon: 'sun' },
  cloud: { name: 'くもり', icon: 'cloud' },
  rain: { name: '雨', icon: 'rain' },
  snow: { name: '雪', icon: 'snow' },
  fog: { name: '霧', icon: 'fog' },
  typhoon: { name: '台風', icon: 'anger' },
};
