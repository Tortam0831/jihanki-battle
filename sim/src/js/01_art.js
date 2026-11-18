// ============================================================
//  ドット絵生成（アイコン・地面タイル・人物スプライト・顔グラ）
// ============================================================
const PAL = {
  k: '#2b2134', w: '#ffffff', r: '#e5484d', o: '#f39a3c', y: '#ffd84a', g: '#4cb85c', G: '#2e7d4a',
  b: '#4a8fe0', B: '#2f4f9a', c: '#8fdcf4', p: '#f59ac0', P: '#9a62d0', n: '#a0683c', N: '#6b4226',
  s: '#f6c89f', l: '#d4d4dc', d: '#8a8a9a', D: '#4a4a58', m: '#fff1c8', e: '#e8c890', R: '#a02838',
  Y: '#d8a020', t: '#3fc9b8', v: '#c9a0ff', u: '#ffb0a0', x: '#ff7090', z: '#5a3a8a'
};

// ---- 12x12 アイコン（足りない行・列は自動で中央寄せ） ----
const ICONS = {
  plane: [
    '.....kk.....', '....kbbk....', '....kwwk....', '...kkwwkk...', '.kkwwwwwwkk.', 'kwwwwwwwwwwk',
    'kkkkkwwkkkkk', '....kwwk....', '....kwwk....', '...kwwwwk...', '...kkkkkk...'],
  runway: [
    'kkkkkkkkkkkk', 'kDDDDDDDDDDk', 'kwDDDDDDDDwk', 'kwDwwDwwDDwk', 'kwDDDDDDDDwk', 'kDDDDDDDDDDk', 'kkkkkkkkkkkk'],
  taxiway: [
    'gggggggggggg', 'GDDDDDDDDDDG', 'GDDDDDDDDDDG', 'Gyyyyyyyyyyy', 'GDDDDDDDDDDG', 'GDDDDDDDDDDG', 'gggggggggggg'],
  stand: [
    'kkkkkkkkkkkk', 'kllllyyllllk', 'kllllyyllllk', 'kllllyyllllk', 'kllkkkkkkllk', 'klkwwwwwwklk',
    'kllkkwwkkllk', 'kllllwwllllk', 'kllllyyllllk', 'kllllyyllllk', 'kllllyyllllk', 'kkkkkkkkkkkk'],
  tower: [
    '..kkkkkkkk..', '.kcccccccck.', '.kcbccbccck.', 'kkkkkkkkkkkk', '...kllllk...', '...kllllk...',
    '...klddlk...', '...kllllk...', '...kllllk...', '..kllllllk..', '.kddddddddk.', '.kkkkkkkkkk.'],
  fire: [
    '.....kk.....', '....kok.....', '...kook.k...', '...koyok.ok.', '..koyyookok.', '..koyyyyook.',
    '.koyywyyyok.', '.koywwwyyok.', '.koyywwyyok.', '..koyyyyok..', '...kkkkkk...'],
  fuel: [
    '..kkkkkk....', '..krrrrrk...', '..krwwwrkk..', '..krwwwrk.k.', '..krrrrrk.k.', '..krrrrrk.k.',
    '..krrrrrk.k.', '..krrrrrkkk.', '..krrrrrk...', '.kkkkkkkkk..', '.kDDDDDDDk..', '.kkkkkkkkk..'],
  hangar: [
    '...kkkkkk...', '.kkllllllkk.', 'kllllllllllk', 'klddddddddlk', 'kldkkkkkkdlk', 'kldkDDDDkdlk',
    'kldkDDDDkdlk', 'kldkDDDDkdlk', 'kkkkkkkkkkkk'],
  cargo: [
    'kkkkkkkkkkkk', 'konnonnoonnk', 'konnonnoonnk', 'kkkkkkkkkkkk', 'koonnnnnnook', 'koonkkkknook',
    'koonnnnnnook', 'kkkkkkkkkkkk'],
  snow: [
    '.....b......', '..b..c..b...', '...c.c.c....', '....ccc.....', 'bcccccccccb.', '....ccc.....',
    '...c.c.c....', '..b..c..b...', '.....b......'],
  radar: [
    '..kkkkkkk...', '.kllllllk...', 'kllkkkllk...', 'klk...klk...', 'kk.....kk...', '....kk......',
    '....kk......', '...kddk.....', '..kddddk....', '..kkkkkk....'],
  ils: [
    'k.k.k.k.k.k.', 'r.r.r.r.r.r.', 'k.k.k.k.k.k.', 'kkkkkkkkkkk.', 'kddddddddk..', 'kkkkkkkkkk..'],
  windsock: [
    '.k..........', '.kkkkkk.....', '.kroworwk...', '.kroworwrk..', '.kkkkkkkkk..', '.k..........',
    '.k..........', '.k..........', '.k..........', 'kkk.........'],
  heli: [
    'kkkkkkkkkkk.', '.....k......', '..kkkkkk....', '.kccbbbbkkkk', '.kcbbbbbk..k', '..kbbbbk....',
    '..k....k....', '.kkkkkkkk...'],
  checkin: [
    'kkkkkkkkkkkk', 'kbbbbbbbbbbk', 'kbwwbbbwwwbk', 'kkkkkkkkkkkk', 'kmmmmmmmmmmk', 'kmmkkmmkkmmk',
    'kmmkkmmkkmmk', 'kmmmmmmmmmmk', 'kkkkkkkkkkkk'],
  kiosk: [
    '..kkkkkkk...', '..kcccccck..', '..kcbbbbck..', '..kcbwwbck..', '..kcccccck..', '..kkkkkkkk..',
    '...kllllk...', '...kllllk...', '...kddddk...', '..kkkkkkkk..'],
  security: [
    '.kkkkkkkkkk.', '.kddddddddk.', '.kd.....rdk.', '.kd......dk.', '.kd..ss..dk.', '.kd.ssss.dk.',
    '.kd..ss..dk.', '.kd.ssss.dk.', '.kd.s..s.dk.', 'kkkkkkkkkkkk'],
  gate: [
    'kkkkkkkkkkkk', 'kyyyyyyyyyyk', 'kykkykkkkkyk', 'kyykykykkkyk', 'kykkykkkkkyk', 'kyyyyyyyyyyk',
    'kkkkkkkkkkkk', '..kk....kk..', '..kk....kk..'],
  busgate: [
    '.kkkkkkkkkk.', 'kbbbbbbbbbbk', 'kbccbccbccbk', 'kbccbccbccbk', 'kbbbbbbbbbbk', 'kbbbbbbbbbbk',
    'kkkkkkkkkkkk', '.kDk....kDk.'],
  baggage: [
    '...kkkkkk...', '...k....k...', '.kkkkkkkkkk.', '.knnnnnnnnk.', '.knNNNNNNnk.', '.knnnnnnnnk.',
    '.knNNNNNNnk.', '.knnnnnnnnk.', '.kkkkkkkkkk.', '..kk....kk..'],
  passport: [
    '.kkkkkkkkk..', '.kBBBBBBBBk.', '.kBBByyBBBk.', '.kBByBByBBk.', '.kByBBBByBk.', '.kBByBByBBk.',
    '.kBBByyBBBk.', '.kBBBBBBBBk.', '.kBByyyyBBk.', '.kBBBBBBBBk.', '.kkkkkkkkkk.'],
  customs: [
    '....kkkk....', '...kYYYYk...', '..kYYkkYYk..', '..kYk..kYk..', 'kkkkkkkkkkkk', 'kBBBBBBBBBBk',
    'kBBByyyyBBBk', 'kBBBBBBBBBBk', 'kkkkkkkkkkkk'],
  info: [
    '...kkkkkk...', '..kbbbbbbk..', '.kbbbwwbbbk.', '.kbbbbbbbbk.', '.kbbbwwbbbk.', '.kbbbwwbbbk.',
    '.kbbbwwbbbk.', '.kbbbwwbbbk.', '..kbbbbbbk..', '...kkkkkk...'],
  toilet: [
    'kkkkkkkkkkkk', 'kbbbbkkrrrrk', 'kbwwbkkrwwrk', 'kbwwbkkrwwrk', 'kwwwwkkwwwwk', 'kbwwbkkwwwwk',
    'kbwwbkrwwwwk', 'kbwbwkkrwwrk', 'kbwbwkkrwrrk', 'kkkkkkkkkkkk'],
  nursing: [
    '....kkkk....', '....kwwk....', '...kkkkkk...', '..kwwwwwwk..', '..kwppppwk..', '..kwppppwk..',
    '..kwwwwwwk..', '..kwppppwk..', '..kwwwwwwk..', '...kkkkkk...'],
  firstaid: [
    '.kkkkkkkkkk.', '.kwwwwwwwwk.', '.kwwwrrwwwk.', '.kwwwrrwwwk.', '.kwrrrrrrwk.', '.kwrrrrrrwk.',
    '.kwwwrrwwwk.', '.kwwwrrwwwk.', '.kwwwwwwwwk.', '.kkkkkkkkkk.'],
  atm: [
    'kkkkkkkkkkkk', 'kddddddddddk', 'kdcccccccdk.', 'kdcgggggcdk.', 'kdcccccccdk.', 'kddddddddddk',
    'kdkkkkkkkkdk', 'kddddddddddk', 'kkkkkkkkkkkk'],
  coin: [
    '...kkkkkk...', '..kYyyyyYk..', '.kYyyYYyyYk.', '.kyyYkkYyyk.', '.kyyYkkYyyk.', '.kyyYkkYyyk.',
    '.kYyyYYyyYk.', '..kYyyyyYk..', '...kkkkkk...'],
  sofa: [
    '..kkkkkkkk..', '.kPPPPPPPPk.', '.kPvvvvvvPk.', 'kkPvvvvvvPkk', 'kPkkkkkkkkPk', 'kPvvvvvvvvPk',
    'kPPPPPPPPPPk', 'kkkkkkkkkkkk', '.kk......kk.'],
  binocular: [
    '..kkk..kkk..', '.kDDDkkDDDk.', '.kDDDkkDDDk.', 'kDDDDkkDDDDk', 'kDccDkkDccDk', 'kDccDkkDccDk',
    'kDDDDk.kDDDk', '.kkkk...kkk.'],
  onsen: [
    '..k...k...k.', '.k...k...k..', '..k...k...k.', '.k...k...k..', '............', 'kkkkkkkkkkkk',
    'kcccccccccck', 'kcbcccbcccck', 'kcccccccccck', '.kkkkkkkkkk.'],
  game: [
    '..kkkkkkkk..', '.kDDDDDDDDk.', 'kDDwDDDDrDDk', 'kDwwwDDrDrDk', 'kDDwDDDDrDDk', 'kDDDDDDDDDDk',
    'kDDkkDDkkDDk', '.kk..kk..kk.'],
  film: [
    'kkkkkkkkkkkk', 'kwkwkwkwkwkk', 'kkkkkkkkkkkk', 'kcccckcccckk', 'kcbbckcbbcck', 'kcccckcccckk',
    'kkkkkkkkkkkk', 'kwkwkwkwkwkk', 'kkkkkkkkkkkk'],
  picture: [
    'kkkkkkkkkkkk', 'kYYYYYYYYYYk', 'kYccccccccYk', 'kYcccccyccYk', 'kYcgcccccgYk', 'kYggcgcgggYk',
    'kYgggggGggYk', 'kYYYYYYYYYYk', 'kkkkkkkkkkkk'],
  fish: [
    '............', '....kkkk....', '..kkooook.k.', '.kowkoooookk', 'koooooooooyk', '.kooooooookk',
    '..kkooook.k.', '....kkkk....'],
  bed: [
    'k...........', 'kkkk........', 'kwwkkkkkkkkk', 'kwwkbbbbbbbk', 'kkkkbbbbbbbk', 'kbbbbbbbbbbk',
    'kkkkkkkkkkkk', 'k..........k'],
  store: [
    'kkkkkkkkkkkk', 'kgggggggggk.', 'kgwgwgwgwgk.', 'kkkkkkkkkkkk', 'kmcccmmcccmk', 'kmcccmmcccmk',
    'kmmmmmmmmmmk', 'kmmmkkkkmmmk', 'kmmmkllkmmmk', 'kkkkkkkkkkkk'],
  cafe: [
    '...k..k.....', '..k..k......', '...k..k.....', '.kkkkkkkk...', '.kwwwwwwkkk.', '.kwnnnnwk.k.',
    '.kwwwwwwkkk.', '..kwwwwk....', 'kkkkkkkkkk..'],
  ramen: [
    '..kk..kk....', '...k...k....', '...k...k....', 'kkkkkkkkkkkk', 'kyymyymyyyyk', 'krrrrrrrrrrk',
    '.krwrrrrwrk.', '..krrrrrrk..', '...kkkkkk...'],
  sushi: [
    '............', '..kkkkkkkk..', '.krrrrrrrrk.', '.kruuruuurk.', 'kkkkkkkkkkkk', 'kwwwwwwwwwwk',
    'kwwwwwwwwwwk', 'kkkkkkkkkkkk'],
  soba: [
    '..kk...kk...', '...k....k...', 'kkkkkkkkkkkk', 'keeeeeeeeeek', 'kNNNNNNNNNNk', '.kNgNNNNNNk.',
    '..kNNNNNNk..', '...kkkkkk...'],
  burger: [
    '...kkkkkk...', '..keeeeeek..', '.keeyeeyeek.', '.kkkkkkkkkk.', '.kgggggggk..', '.kNNNNNNNNk.',
    '.kyyyyyyyyk.', '.keeeeeeeek.', '..kkkkkkkk..'],
  curry: [
    '............', '.kkkkkkkkkk.', 'kwwwwooooowk', 'kwwwoooonowk', 'kwwwooooowwk', '.kwwwwwwwwk.',
    '..kkkkkkkk..'],
  bread: [
    '...kkkkkk...', '..keeeeeek..', '.kennennenk.', 'kennennennek', 'keeeeeeeeeek', 'knnnnnnnnnnk',
    '.kkkkkkkkkk.'],
  bento: [
    'kkkkkkkkkkkk', 'krrrrrrrrrrk', 'kkkkkkkkkkkk', 'kwwwwkgguuk.', 'kwwrwkgguuk.', 'kwwwwkyyyyk.',
    'kkkkkkkkkkkk'],
  cake: [
    '.....r......', '.....k......', '...kkkkk....', '..kwwwwwkk..', '.kpppppppk..', '.kwwwwwwwk..',
    '.kpppppppk..', '.keeeeeeek..', '.kkkkkkkkk..'],
  dumpling: [
    '............', '..kk..kk....', '.kwwkkwwk...', 'kwwwwwwwwk..', 'kwwwwwwwwk..', '.kkkkkkkk...',
    '..kddddddk..', '...kkkkkk...'],
  fork: [
    'k.k.k..kk...', 'k.k.k.kllk..', 'kkkkk.kllk..', '.klk..kllk..', '.klk...klk..', '.klk...klk..',
    '.klk...klk..', '.klk...klk..', '.kkk...kkk..'],
  steak: [
    '............', '..kkkkkkk...', '.kNNNNNNNk..', 'kNnNNNNnNNk.', 'kNNNNnNNNNk.', '.kNNNNNNNk..',
    'kkkkkkkkkkkk', 'kddddddddddk', 'kkkkkkkkkkkk'],
  beer: [
    '..kkkkkk....', '.kwwwwwwk...', '.kyyyyyykkk.', '.kyyyyyyk.k.', '.kyyyyyyk.k.', '.kyyyyyykkk.',
    '.kyyyyyyk...', '.kkkkkkkk...'],
  gift: [
    '...kk.kk....', '..krrkrrk...', 'kkkkkkkkkkk.', 'kbbbbrbbbbk.', 'kkkkkkkkkkk.', '.kbbbrbbbk..',
    '.kbbbrbbbk..', '.kbbbrbbbk..', '.kkkkkkkkk..'],
  book: [
    '.kkkkk.kkkk.', 'krrrrrkbbbbk', 'krwwrrkbwwbk', 'krrrrrkbbbbk', 'krrrrrkbbbbk', 'krrrrrkbbbbk',
    'krrrrrkbbbbk', 'kkkkkkkkkkkk'],
  dango: [
    '.........k..', '......kkk...', '.....kpk....', '....kpppk...', '...kkwwk....', '..kwwwwk....',
    '..kkggk.....', '.kgggk......', 'kkkk........', 'k...........'],
  star: [
    '.....k......', '....kyk.....', '....kyk.....', 'kkkkkyykkkk.', '.kyyyyyyyk..', '..kyyyyyk...',
    '..kyykyyk...', '.kyk...kyk..', '.kk.....kk..'],
  plane2: [
    '..........k.', '.........kbk', 'k......kkwk.', 'kk...kkwwk..', 'kwkkkwwwk...', '.kwwwwwk....',
    '..kwwwwkk...', '...kwk.kwk..', '....k...kk..'],
  bear: [
    '.kk....kk...', 'knnk..knnk..', 'knnnnnnnnk..', 'knknnnnknk..', 'knnnnnnnnk..', 'knnnkknnnk..',
    '.knnnnnnk...', 'knnnnnnnnk..', '.kkkkkkkk...'],
  flower: [
    '...kk.kk....', '..kppkppk...', '...kpypk....', '..kppkppk...', '...kkgkk....', '.....gk.....',
    '...kggk.....', '..kkkkkkk...', '..knnnnnk...', '...kkkkk....'],
  pill: [
    '............', '...kkkk.....', '..kwwwrk....', '.kwwwrrrk...', '.kwwkrrrrk..', '..kkkrrrrk..',
    '....krrrk...', '.....kkk....'],
  shirt: [
    '..kkk..kkk..', '.kbbbkkbbbk.', 'kbbbbwwbbbbk', 'kkkbbbbbbkkk', '..kbbbbbbk..', '..kbbbbbbk..',
    '..kbbbbbbk..', '..kkkkkkkk..'],
  tv: [
    '...k...k....', '....k.k.....', 'kkkkkkkkkkkk', 'kDDDDDDDDDDk', 'kDccccccccDk', 'kDcbccccbcDk',
    'kDccccccccDk', 'kDDDDDDDDDDk', 'kkkkkkkkkkkk', '...kk..kk...'],
  perfume: [
    '....kkk.....', '....kYk.....', '...kkkkk....', '..kpvvvvk...', '.kpvwvvvvk..', '.kvvvvvvvk..',
    '.kvvvvvvvk..', '..kkkkkkk...'],
  handbag: [
    '...kkkkk....', '..k.....k...', '.kkkkkkkkk..', 'kRRRRRRRRRk.', 'kRRRYYRRRRk.', 'kRRRRRRRRRk.',
    'kRRRRRRRRRk.', '.kkkkkkkkk..'],
  parking: [
    'kkkkkkkkkkkk', 'kbbbbbbbbbbk', 'kbbwwwwwbbbk', 'kbbwbbbwwbbk', 'kbbwwwwwbbbk', 'kbbwbbbbbbbk',
    'kbbwbbbbbbbk', 'kbbbbbbbbbbk', 'kkkkkkkkkkkk'],
  road: [
    'gggggggggggg', 'kDDDDDDDDDDk', 'kDDDDDDDDDDk', 'kDwwDDwwDDwk', 'kDDDDDDDDDDk', 'kDDDDDDDDDDk', 'gggggggggggg'],
  cloud: [
    '............', '....kkkk....', '..kkwwwwk...', '.kwwwwwwwkk.', 'kwwwwwwwwwwk', 'kwwwwwwwwwwk', '.kllllllllk.', '..kkkkkkkk..'],
  rain: [
    '...kkkkk....', '.kkwwwwwkk..', 'kwwwwwwwwwk.', 'kllllllllk..', '.kkkkkkkk...', '..b..b..b...', '.b..b..b....', '..b..b..b...'],
  fog: [
    '............', 'llllllll....', '............', '..llllllllll', '............', 'llllllllll..', '............', '...lllllllll'],
  bus: [
    '.kkkkkkkkkk.', 'kggggggggggk', 'kgccgccgccck', 'kgccgccgccck',
    'kggggggggggk', 'kwwwwwwwwwwk', 'kkkkkkkkkkkk', '.kDk....kDk.'],
  train: [
    '..kkkkkkkk..', '.kbbbbbbbbk.', '.kbccbbccbk.', '.kbccbbccbk.', '.kbbbbbbbbk.', '.kwwwwwwwwk.',
    '.kbybbbbybk.', '.kkkkkkkkkk.', '..kk....kk..', 'kkkkkkkkkkkk'],
  taxi: [
    '....kkk.....', '....kyk.....', '..kkkkkkk...', '.kycccccyk..', 'kyyyyyyyyyk.', 'kyyyyyyyyyk.',
    'kkkkkkkkkkk.', '.kDk...kDk..'],
  key: [
    '..kkkk......', '.kyyyyk.....', 'kyykkyyk....', 'kyk..kyk....', 'kyykkyykkkkk', '.kyyyykyyyyk',
    '..kkkk.kykyk', '.......k.k.k'],
  sun: [
    '.....y......', '..y..y..y...', '...kkkkk....', '..kyyyyyk...', 'yykyyyyykyy.', '..kyyyyyk...',
    '...kkkkk....', '..y..y..y...', '.....y......'],
  tree: [
    '....kkkk....', '..kkggggkk..', '.kgggGgggGk.', 'kggGgggggggk', 'kgggggGgggGk', '.kgGggggggk.',
    '..kkkGGkkk..', '....kNNk....', '....kNNk....', '...kkkkkk...'],
  sakura: [
    '....kkkk....', '..kkppppkk..', '.kppwpppwpk.', 'kpppppxpppp.', 'kpwppppppwk.', '.kppxpppppk.',
    '..kkkNNkkk..', '....kNNk....', '....kNNk....', '...kkkkkk...'],
  fountain: [
    '.....c......', '....cwc.....', '...c.c.c....', '..c..c..c...', '....klk.....', 'kkkkkkkkkkkk',
    'kllccccccllk', 'klcccbcccclk', 'kkkkkkkkkkkk'],
  statue: [
    '..........k.', '.k.......kwk', 'kwkkk..kkwk.', 'kwwwwkkwwk..', '.kwwwwwwk...', '..kkwwwk....',
    '....kdk.....', '...kdddk....', '..kdddddk...', '.kkkkkkkkk..'],
  bench: [
    'kkkkkkkkkkkk', 'knnnnnnnnnnk', 'kkkkkkkkkkkk', 'knnnnnnnnnnk', 'kkkkkkkkkkkk', '.kk......kk.',
    '.kk......kk.'],
  lamp: [
    '....kkkk....', '...kyyyyk...', '...kkkkkk...', '.....kk.....', '.....kk.....', '.....kk.....',
    '.....kk.....', '.....kk.....', '....kkkk....', '...kkkkkk...'],
  flag: [
    '.kk.........', '.krrrrrrk...', '.krrwwrrrk..', '.krwwwwrrk..', '.krrwwrrrk..', '.krrrrrrk...',
    '.kk.........', '.kk.........', '.kk.........', 'kkkk........'],
  plant: [
    '..k..k..k...', '.kgk.kgkgk..', '.kggkgggk...', '..kgggggk...', '...kgGgk....', '..kkkkkkk...',
    '..knnnnnk...', '...knnnk....', '...kkkkk....'],
  clock: [
    '...kkkkk....', '..kwwwwwk...', '.kwwwkwwwk..', '.kwwwkwwwk..', '.kwwwkkkwk..', '.kwwwwwwwk..',
    '..kwwwwwk...', '...kkkkk....'],
  bush: [
    '............', '...kkkkk....', '..kgggggkk..', '.kggGggggGk.', 'kgggggGggggk', 'kgGggggggGgk',
    'kkkkkkkkkkkk'],
  pond: [
    '...kkkkkk...', '.kkcccccckk.', 'kccbccccbcck', 'kcccccccccck', '.kkcccccckk.', '...kkkkkk...'],
  palm: [
    '.kggk.kggk..', 'kgggkkgggk..', '..kgkkgk....', '.kggkkggk...', '....kNk.....', '....kNk.....',
    '....kNk.....', '...kNNk.....', '..kkkkkk....'],
  pine: [
    '.....kk.....', '....kGGk....', '...kGgGGk...', '..kGGGgGGk..', '...kGGGGk...', '..kGgGGGGk..',
    '.kGGGGGgGGk.', '....kNNk....', '...kkkkkk...'],
  money: [
    '....kkk.....', '...kYyYk....', '..kkkkkkk...', '.kgggggggk..', 'kggggYggggk.', 'kgggYyYgggk.',
    'kggggYggggk.', '.kgggggggk..', '..kkkkkkk...'],
  heart: [
    '.kkk..kkk...', 'kxxxkkxxxk..', 'kxwxxxxxxk..', 'kxxxxxxxxk..', '.kxxxxxxk...', '..kxxxxk....',
    '...kxxk.....', '....kk......'],
  anger: [
    '.kk....kk...', 'krrk..krrk..', 'krrrkkrrrk..', '.krr..rrk...', '.krr..rrk...', 'krrrkkrrrk..',
    'krrk..krrk..', '.kk....kk...'],
  sweat: [
    '....k.......', '...kck......', '..kccck.....', '..kccck.....', '.kcwccck....', '.kcwccck....',
    '.kccccck....', '..kkkkk.....'],
  note: [
    '....kkkkkk..', '....kbbbbk..', '....kkkkbk..', '....k...bk..', '....k...bk..', '..kkk..kkk..',
    '.kbbk.kbbk..', '.kkk..kkk...'],
  zzz: [
    'kkkkk.......', '...k........', '..k.........', 'kkkkk.kkkk..', '.........k..', '.......kk...',
    '.......kkkk.'],
  food: [
    '.k.k.......', '.k.k.kk....', '.kkk.kok...', '..k..kook..', '..k..kook..', '..k...kk...',
    '..k...kk...', '..k...kk...'],
  shopping: [
    '...kkkk.....', '..k....k....', '.kkkkkkkkk..', '.kppppppppk.', '.kppwwppppk.', '.kppppppppk.',
    '.kppppppppk.', '.kkkkkkkkkk.'],
  check: [
    '..........kk', '.........kgk', '........kgk.', 'kk.....kgk..', 'kgk...kgk...', '.kgk.kgk....',
    '..kgkgk.....', '...kgk......', '....k.......'],
  lock: [
    '...kkkkk....', '..kdddddk...', '..kd...dk...', '..kd...dk...', '.kkkkkkkkk..', '.kYYYYYYYk..',
    '.kYYYkYYYk..', '.kYYYkYYYk..', '.kYYYYYYYk..', '.kkkkkkkkk..'],
  gear: [
    '....kkkk....', '..k.kddk.k..', '.kdkddddkdk.', '..kddkkddk..', 'kkddk..kddkk', 'kdddk..kdddk',
    'kkddk..kddkk', '..kddkkddk..', '.kdkddddkdk.', '..k.kddk.k..', '....kkkk....'],
  chart: [
    'k...........', 'k.......kk..', 'k.......kgk.', 'k...kk..kgk.', 'k...kbk.kgk.', 'k.kkkbk.kgk.',
    'k.krkbk.kgk.', 'k.krkbk.kgk.', 'kkkkkkkkkkkk'],
  mission: [
    '.kk.........', '.kyyyyyk....', '.kyyyyyyyk..', '.kyykyyyyk..', '.kyyyyyyk...', '.kyyyyk.....',
    '.kk.........', '.kk.........', 'kkkk........'],
  flask: [
    '...kkkk.....', '....kk......', '....kk......', '...kccck....', '..kccccck...', '.kcgcgcgck..',
    'kcgggggggck.', 'kgggwgggggk.', 'kkkkkkkkkkk.'],
  globe: [
    '...kkkkk....', '..kbbgbbbk..', '.kbggggbbbk.', 'kbbggbbbgbk.', 'kbbbbbbggbk.', 'kbbbbgbgggk.',
    '.kbbggbbbk..', '..kbbbbbk...', '...kkkkk....'],
  board: [
    'kkkkkkkkkkkk', 'kDDDDDDDDDDk', 'kDyyyDDyyyDk', 'kDDDDDDDDDDk', 'kDggDDgggDDk', 'kDDDDDDDDDDk',
    'kDyyDDyyyyDk', 'kDDDDDDDDDDk', 'kkkkkkkkkkkk', '....kkkk....'],
  dozer: [
    '....kkkk....', '....kyyk....', '..kkkyykkkk.', '..kyyyyyyyk.', 'k.kyyyyyyyk.', 'kkkkkkkkkkk.',
    'kdkDkDkDkDk.', 'kk.kkkkkkk..'],
  camera: [
    '...kkk......', 'kkkkkkkkkk..', 'kddddddddk..', 'kdkkkkdddk..', 'kdkccckddk..', 'kdkcbckddk..',
    'kdkccckddk..', 'kddkkkdddk..', 'kkkkkkkkkk..'],
  sound: [
    '....k...k...', '...kk.k..k..', 'kkkdk..k..k.', 'kddddk.k..k.', 'kddddk.k..k.', 'kkkdk..k..k.',
    '...kk.k..k..', '....k...k...'],
  save: [
    'kkkkkkkkkk..', 'kbbwwwwbbbk.', 'kbbwwwwbbbbk', 'kbbbbbbbbbbk', 'kbkkkkkkkkbk', 'kbkwwwwwwkbk',
    'kbkwwwwwwkbk', 'kkkkkkkkkkkk'],
  move: [
    '.....k......', '....kyk.....', '...kyyyk....', '.k..kyk..k..', 'kykkkykkkyk.', 'kyyyyyyyyyk.',
    'kykkkykkkyk.', '.k..kyk..k..', '...kyyyk....', '....kyk.....', '.....k......'],
  rotate: [
    '...kkkk.....', '..kbbbbk.k..', '.kbk..kbkbk.', '.kbk...kbbk.', '.kbk..kbbbk.', '.kbk...kkkk.',
    '.kbk........', '..kbbbbk....', '...kkkk.....'],
  up: [
    '.....kk.....', '....kggk....', '...kggggk...', '..kggggggk..', '.kkkggggkkk.', '...kggggk...',
    '...kggggk...', '...kkkkkk...'],
  trash: [
    '....kkkk....', '.kkkkkkkkkk.', '.kddddddddk.', '..kdkdkdkk..', '..kdkdkdkk..', '..kdkdkdkk..',
    '..kdkdkdkk..', '...kkkkkk...'],
  rocket: [
    '.....kk.....', '....kwwk....', '...kwccwk...', '...kwwwwk...', '...kwrrwk...', '..kkwwwwkk..',
    '.krkwwwwkrk.', '.kk.kook.kk.', '....kyyk....', '.....kk.....'],
  moon: [
    '...kkkk.....', '..kyyyk.....', '.kyyyk......', '.kyyk.......', '.kyyk.......', '.kyyyk......',
    '..kyyyykk...', '...kkkkk....'],
  bag: [
    '...kkkk.....', '..k....k....', '.kkkkkkkkk..', '.kbbbbbbbk..', '.kbbbbbbbk..', '.kbkkkkkbk..',
    '.kbbbbbbbk..', '.kbbbbbbbk..', '.kkkkkkkkk..', '..k.....k...'],
  people: [
    '..kk...kk...', '.kssk.kssk..', '.kssk.kssk..', '..kk...kk...', '.kbbk.krrk..', 'kbbbbkrrrrk.',
    'kbbbbkrrrrk.', '.kBk...kRk..', '.kBk...kRk..'],
  thermo: [
    '....kk......', '...kwwk.....', '...kwrk.....', '...kwrk.....', '...kwrk.....', '..kwrrrk....',
    '..krrrrk....', '...kkkk.....'],
  wifi: [
    '..kkkkkkk...', '.k.......k..', 'k..kkkkk..k.', '..k.....k...', '....kkk.....', '...k...k....',
    '.....k......', '....kkk.....'],
  mascot: [
    '....kkkk....', '..kkwwwwkk..', '.kwwwwwwwwk.', 'kbwkwwwwkwbk', 'kbwwwyywwwbk', 'kbbwwwwwwbbk',
    '.kbwwwwwwbk.', '..kkwwwwkk..', '...kk..kk...'],
};

function iconRows(name) {
  const rows = (ICONS[name] || ICONS.star).map(r => (r + '............').slice(0, 12));
  const pad = 12 - rows.length, top = Math.floor(pad / 2);
  const out = [];
  for (let i = 0; i < top; i++) out.push('............');
  out.push(...rows);
  while (out.length < 12) out.push('............');
  return out.slice(0, 12);
}
function drawIcon(ctx, name, ox, oy, scale) {
  scale = scale || 1;
  const rows = iconRows(name);
  for (let y = 0; y < 12; y++) for (let x = 0; x < 12; x++) {
    const ch = rows[y][x];
    if (ch === '.' || !PAL[ch]) continue;
    ctx.fillStyle = PAL[ch];
    ctx.fillRect(ox + x * scale, oy + y * scale, scale, scale);
  }
}
const _iconURL = {};
function iconURL(name, scale) {
  scale = scale || 3;
  const key = name + '@' + scale;
  if (_iconURL[key]) return _iconURL[key];
  const c = document.createElement('canvas'); c.width = c.height = 12 * scale;
  drawIcon(c.getContext('2d'), name, 0, 0, scale);
  return (_iconURL[key] = c.toDataURL());
}
function iconImg(name, cls) { return `<img class="pxi ${cls || ''}" src="${iconURL(name)}" alt="">`; }

// アイコンアトラス（3D用：看板・ふきだし） 16x16 セル × 16列
const ICON_LIST = Object.keys(ICONS);
const ICON_INDEX = {}; ICON_LIST.forEach((n, i) => ICON_INDEX[n] = i);
function makeIconAtlas() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 256;
  const ctx = c.getContext('2d');
  ICON_LIST.forEach((n, i) => {
    const cx = (i % 16) * 16, cy = Math.floor(i / 16) * 16;
    drawIcon(ctx, n, cx + 2, cy + 2, 1);
  });
  return c;
}
// ふきだし付き（白い丸に中身）
function makeBubbleAtlas() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 256;
  const ctx = c.getContext('2d');
  ICON_LIST.forEach((n, i) => {
    const cx = (i % 16) * 16, cy = Math.floor(i / 16) * 16;
    ctx.fillStyle = PAL.k; ctx.fillRect(cx + 1, cy + 0, 14, 14); ctx.fillRect(cx + 6, cy + 14, 3, 2);
    ctx.fillStyle = '#fff'; ctx.fillRect(cx + 2, cy + 1, 12, 12); ctx.fillRect(cx + 7, cy + 13, 1, 1);
    ctx.save(); ctx.translate(cx + 2, cy + 1);
    const rows = iconRows(n);
    for (let y = 0; y < 12; y++) for (let x = 0; x < 12; x++) {
      const ch = rows[y][x]; if (ch === '.' || !PAL[ch]) continue;
      ctx.fillStyle = PAL[ch]; ctx.fillRect(x, y, 1, 1);
    }
    ctx.restore();
  });
  return c;
}

// ============================================================
//  地面タイルアトラス（16px × 16列）
// ============================================================
const TILE = {
  GRASS: 0, SAND: 4, DIRT: 5, ROCK: 6, SEABED: 7, TFLOOR: 8, TFLOOR2: 9, WALK: 10, PLAZA: 11, APRON: 12, LOCK: 13,
  TAXI: 16, ROAD: 32, SIDE_GRASS: 48, SIDE_DIRT: 49, SIDE_ROCK: 50, SIDE_SAND: 51, PARK: 52, SNOWGRASS: 53
};
const SEASON_GRASS = [
  ['#7cc46a', '#6db55e', '#8fd27a', '#5ea452'],    // 春
  ['#58b04f', '#4a9e45', '#68c05a', '#3e8a3c'],    // 夏
  ['#b8b25a', '#a89f4c', '#c9c46c', '#968c40'],    // 秋
  ['#eef4fa', '#dde8f2', '#ffffff', '#c8d8e8'],    // 冬
];
function px(ctx, x, y, col) { ctx.fillStyle = col; ctx.fillRect(x, y, 1, 1); }
function tileXY(t) { return [(t % 16) * 16, Math.floor(t / 16) * 16]; }
function drawGrassTiles(ctx, season) {
  const pal = SEASON_GRASS[season];
  for (let v = 0; v < 4; v++) {
    const [ox, oy] = tileXY(TILE.GRASS + v);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const h = hash2(x + v * 31, y, 7);
      let col = pal[0];
      if (h < 0.18) col = pal[1]; else if (h < 0.26) col = pal[2]; else if (h > 0.95) col = pal[3];
      px(ctx, ox + x, oy + y, col);
    }
    // 草の房・季節の点
    for (let k = 0; k < 5; k++) {
      const x = Math.floor(hash2(v, k, 3) * 14) + 1, y = Math.floor(hash2(k, v, 9) * 13) + 2;
      if (season === 3) { px(ctx, ox + x, oy + y, '#c0d4e6'); continue; }
      px(ctx, ox + x, oy + y, pal[3]); px(ctx, ox + x, oy + y - 1, pal[2]);
    }
    const dots = season === 0 ? ['#ffd0e4', '#ffffff', '#ffe066'] : season === 2 ? ['#e0702c', '#d84c2c', '#f0b040'] : season === 1 ? ['#ffffff', '#ffe066'] : ['#ffffff'];
    const nd = season === 1 ? 1 : season === 3 ? 3 : 3;
    for (let k = 0; k < nd; k++) {
      if (hash2(v, k, 77) < 0.45) continue;
      const x = Math.floor(hash2(v, k, 12) * 14) + 1, y = Math.floor(hash2(k, v, 15) * 14) + 1;
      px(ctx, ox + x, oy + y, dots[k % dots.length]);
    }
  }
  // 側面（草つき土）
  const [sx, sy] = tileXY(TILE.SIDE_GRASS);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const h = hash2(x, y, 41);
    let col = y < 3 + (hash2(x, 0, 5) < 0.4 ? 1 : 0) ? pal[y === 0 ? 2 : 1] : (h < 0.2 ? '#7a5434' : h < 0.3 ? '#9a6c44' : '#8a603c');
    if (y > 9 && h > 0.85) col = '#6a4a30';
    px(ctx, sx + x, sy + y, col);
  }
}
function drawAsphalt(ctx, ox, oy, base, dark, light, seed) {
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const h = hash2(x, y, seed);
    px(ctx, ox + x, oy + y, h < 0.12 ? dark : h > 0.93 ? light : base);
  }
}
function makeTileAtlas(season) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 256;
  const ctx = c.getContext('2d');
  drawGrassTiles(ctx, season);
  // 砂
  let [ox, oy] = tileXY(TILE.SAND);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const h = hash2(x, y, 2); px(ctx, ox + x, oy + y, h < .15 ? '#e2c98c' : h > .9 ? '#fff0c0' : '#f0dca0'); }
  [ox, oy] = tileXY(TILE.DIRT);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const h = hash2(x, y, 3); px(ctx, ox + x, oy + y, h < .2 ? '#7a5434' : h > .9 ? '#a87a50' : '#8a603c'); }
  [ox, oy] = tileXY(TILE.ROCK);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const h = hash2(x, y, 4); px(ctx, ox + x, oy + y, h < .2 ? '#5a5466' : h > .85 ? '#8a8496' : '#6e687a'); }
  [ox, oy] = tileXY(TILE.SEABED);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const h = hash2(x, y, 5); px(ctx, ox + x, oy + y, h < .2 ? '#c8b080' : '#d8c090'); }
  // ターミナル床（つやのあるタイル）
  for (const [t, a, b2] of [[TILE.TFLOOR, '#ece6da', '#ddd4c4'], [TILE.TFLOOR2, '#e4dccc', '#d2c8b4']]) {
    [ox, oy] = tileXY(t);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      let col = ((x >> 3) + (y >> 3)) % 2 ? a : b2;
      if (x % 8 === 0 || y % 8 === 0) col = '#c4b8a4';
      if ((x % 8 === 2 && y % 8 === 2)) col = '#fffaf0';
      px(ctx, ox + x, oy + y, col);
    }
  }
  // 歩道（レンガ）
  [ox, oy] = tileXY(TILE.WALK);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const row = y >> 2, off = (row % 2) * 4;
    let col = ((x + off) % 8 === 0 || y % 4 === 0) ? '#a89480' : (hash2(x, y, 8) < .2 ? '#cbb69c' : '#d8c4a8');
    px(ctx, ox + x, oy + y, col);
  }
  [ox, oy] = tileXY(TILE.PLAZA);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    let col = (x % 4 === 0 || y % 4 === 0) ? '#b8b0a4' : '#d8d2c6';
    px(ctx, ox + x, oy + y, col);
  }
  [ox, oy] = tileXY(TILE.APRON);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const h = hash2(x, y, 9);
    let col = h < .1 ? '#a8a8ae' : h > .95 ? '#d0d0d6' : '#bcbcc2';
    if (x === 0 || y === 0) col = '#9c9ca4';
    px(ctx, ox + x, oy + y, col);
  }
  [ox, oy] = tileXY(TILE.PARK);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const h = hash2(x, y, 19);
    let col = h < .1 ? '#4e4e58' : '#5a5a64';
    if (x === 1 && y > 2 && y < 14) col = '#f0f0f0';
    px(ctx, ox + x, oy + y, col);
  }
  // 誘導路（16パターン：N,E,S,W のつながり）
  for (let m = 0; m < 16; m++) {
    [ox, oy] = tileXY(TILE.TAXI + m);
    drawAsphalt(ctx, ox, oy, '#5f6170', '#525463', '#6e7080', 11);
    const Y = '#f2c230';
    const c0 = 7;
    if (m === 0) { ctx.fillStyle = Y; ctx.fillRect(ox + 6, oy + 6, 4, 4); }
    ctx.fillStyle = Y;
    if (m & 1) ctx.fillRect(ox + c0, oy + 0, 2, 9);     // 上(N = -y)
    if (m & 2) ctx.fillRect(ox + c0, oy + c0, 9, 2);    // 右(E)
    if (m & 4) ctx.fillRect(ox + c0, oy + c0, 2, 9);    // 下(S)
    if (m & 8) ctx.fillRect(ox + 0, oy + c0, 9, 2);     // 左(W)
    // 縁取り（つながっていない辺に白線）
    ctx.fillStyle = '#c8c8d0';
    if (!(m & 1)) ctx.fillRect(ox, oy, 16, 1);
    if (!(m & 2)) ctx.fillRect(ox + 15, oy, 1, 16);
    if (!(m & 4)) ctx.fillRect(ox, oy + 15, 16, 1);
    if (!(m & 8)) ctx.fillRect(ox, oy, 1, 16);
  }
  // 道路
  for (let m = 0; m < 16; m++) {
    [ox, oy] = tileXY(TILE.ROAD + m);
    drawAsphalt(ctx, ox, oy, '#4c4c56', '#42424a', '#5a5a64', 13);
    ctx.fillStyle = '#f4f4f4';
    const horiz = (m & 2) || (m & 8), vert = (m & 1) || (m & 4);
    if (horiz && !vert) { ctx.fillRect(ox + 1, oy + 7, 5, 1); ctx.fillRect(ox + 10, oy + 7, 5, 1); }
    else if (vert && !horiz) { ctx.fillRect(ox + 7, oy + 1, 1, 5); ctx.fillRect(ox + 7, oy + 10, 1, 5); }
    ctx.fillStyle = '#9c9ca4';
    if (!(m & 1)) ctx.fillRect(ox, oy, 16, 1);
    if (!(m & 2)) ctx.fillRect(ox + 15, oy, 1, 16);
    if (!(m & 4)) ctx.fillRect(ox, oy + 15, 16, 1);
    if (!(m & 8)) ctx.fillRect(ox, oy, 1, 16);
  }
  // 側面
  [ox, oy] = tileXY(TILE.SIDE_DIRT);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const h = hash2(x, y, 21); px(ctx, ox + x, oy + y, (y % 6 === 0 && h > .3) ? '#6a4a30' : h < .2 ? '#7a5434' : '#8a603c'); }
  [ox, oy] = tileXY(TILE.SIDE_ROCK);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const h = hash2(x, y, 22); px(ctx, ox + x, oy + y, (y % 5 === 0) ? '#4a4456' : h < .3 ? '#5e5870' : '#6e687e'); }
  [ox, oy] = tileXY(TILE.SIDE_SAND);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const h = hash2(x, y, 23); px(ctx, ox + x, oy + y, h < .2 ? '#d8bc80' : '#e8d098'); }
  return c;
}

// ============================================================
//  人物スプライト（16x20 セル、正面4コマ＋背面4コマ）
// ============================================================
const SPR_W = 16, SPR_H = 20, SPR_COLS = 32;
const SKIN = ['#f8d4b0', '#f0c09a', '#e0a878', '#c08860', '#8a5a3a'];
const HAIR = ['#2a1e1a', '#4a3020', '#6a4428', '#a06a3a', '#d8b060', '#e8e0d0', '#b0b0b8', '#c04030', '#3a3a5a'];
const CLOTH = ['#e5484d', '#4a8fe0', '#4cb85c', '#f39a3c', '#9a62d0', '#f59ac0', '#ffd84a', '#3fc9b8', '#ffffff', '#4a4a58', '#2f4f9a', '#a0683c', '#e8c890', '#8a8a9a'];

const PAX_LOOKS = {
  biz:      { hair: ['short'], top: ['#3a4060', '#2a2a36', '#4a4a58', '#5a5048'], bottom: ['#2a2a36', '#3a4060'], acc: ['briefcase', 'suitcase'], tie: true },
  worker:   { hair: ['short', 'long', 'bun'], top: ['#ffffff', '#e8c890', '#f59ac0', '#8fdcf4', '#d4d4dc'], bottom: ['#2a2a36', '#8a8a9a', '#a0683c'], skirt: 0.5, acc: ['suitcase', 'bag'] },
  family:   { hair: ['short', 'long', 'pony'], top: CLOTH, bottom: ['#3a4a7a', '#4a4a58', '#a0683c', '#e8c890'], acc: ['suitcase', 'bag', 'none'] },
  kid:      { hair: ['short', 'pony', 'cap'], top: ['#e5484d', '#ffd84a', '#4cb85c', '#4a8fe0', '#f59ac0', '#f39a3c'], bottom: ['#3a4a7a', '#e5484d', '#4a8fe0'], acc: ['backpack', 'none'], child: true, skirt: 0.3 },
  student:  { hair: ['short', 'long', 'pony'], top: ['#2a2a40', '#ffffff', '#3a5080'], bottom: ['#2a2a40', '#3a4a7a'], skirt: 0.4, acc: ['backpack'] },
  elder:    { hair: ['bald', 'short', 'bun'], hairc: ['#e8e0d0', '#b0b0b8', '#d0d0d0'], top: ['#a0683c', '#6a7a5a', '#8a6a9a', '#c0a080'], bottom: ['#6a6a70', '#5a4a3a'], acc: ['cane', 'bag'] },
  tourist:  { hair: ['short', 'long', 'cap'], top: ['#ff7090', '#ffd84a', '#3fc9b8', '#ffffff', '#f39a3c'], bottom: ['#3a4a7a', '#e8c890', '#ffffff'], acc: ['camera', 'suitcase'] },
  backpack: { hair: ['short', 'cap', 'pony'], top: ['#4cb85c', '#a0683c', '#f39a3c', '#6a7a5a'], bottom: ['#5a4a3a', '#3a4a7a'], acc: ['bigpack'] },
  foreign:  { hair: ['short', 'long'], hairc: ['#d8b060', '#e8d080', '#a06a3a', '#c04030', '#2a1e1a'], skin: [0, 1, 3, 4], top: CLOTH, bottom: ['#3a4a7a', '#e8c890', '#4a4a58'], acc: ['suitcase', 'backpack', 'camera'] },
  couple:   { hair: ['short', 'long'], top: ['#ffffff', '#ffb0c0', '#c9a0ff', '#8fdcf4'], bottom: ['#ffffff', '#3a4a7a', '#f59ac0'], skirt: 0.5, acc: ['suitcase'], hat: 0.2 },
  vip:      { hair: ['short'], top: ['#1a1a22', '#3a1a2a'], bottom: ['#1a1a22'], acc: ['briefcase'], glasses: 'sun' },
  maniac:   { hair: ['short', 'cap'], top: ['#4a8fe0', '#ffffff', '#6a7a5a'], bottom: ['#3a4a7a', '#6a6a70'], acc: ['camera', 'backpack'], glasses: 'normal' },
  celeb:    { hair: ['long', 'short'], hairc: ['#e8d080', '#c04030', '#f59ac0'], top: ['#ff4080', '#ffd84a', '#ffffff'], bottom: ['#1a1a22', '#ffffff'], acc: ['bag'], glasses: 'sun' },
  pilot:    { hair: ['pilot'], top: ['#22305a'], bottom: ['#22305a'], acc: ['suitcase'], tie: true, stripes: true },
  ca:       { hair: ['bun'], top: ['#3a5aa0', '#c03040', '#3a8a6a'], bottom: ['#2a3050'], skirt: 1, acc: ['suitcase'], scarf: true },
  staff:    { hair: ['cap'], hairc: ['#2a1e1a'], top: ['#f39a3c'], bottom: ['#4a4a58'], acc: ['none'] },
  student_trip: { hair: ['short', 'long'], top: ['#2a2a40'], bottom: ['#2a2a40'], skirt: 0.5, acc: ['backpack'], cap2: '#ffd84a' },
};

function drawPerson(ctx, ox, oy, L, back, frame) {
  const P = (x, y, c) => { if (c) { ctx.fillStyle = c; ctx.fillRect(ox + x, oy + y, 1, 1); } };
  const R = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(ox + x, oy + y, w, h); };
  const child = L.child;
  const step = frame === 1 ? 1 : frame === 3 ? -1 : 0;
  const bob = (frame === 1 || frame === 3) ? 0 : 0;
  // 縦の基準
  const top = child ? 6 : 2;
  const headY = top + bob, headH = 6;
  const torsoY = headY + headH, torsoH = child ? 4 : 5;
  const legY = torsoY + torsoH, legH = 19 - legY;
  const tw = child ? 6 : 8, tx = 8 - tw / 2;
  // 後ろの荷物
  if (L.acc === 'bigpack' && !back) { R(tx - 1, torsoY - 1, 1, torsoH + 1, '#5a4030'); R(tx + tw, torsoY - 1, 1, torsoH + 1, '#5a4030'); }
  // 脚
  const pc = L.bottom, skin = L.skin;
  const legL = (L.skirt ? skin : pc), shoe = '#2a2028';
  const ll = step === 1 ? 0 : step === -1 ? 1 : 0, rl = step === -1 ? 0 : step === 1 ? 1 : 0;
  const lx = child ? 6 : 5;
  R(lx, legY, 2 + (child ? 0 : 1), legH - ll, legL); R(lx, 19 - ll, 3 - (child ? 1 : 0), 1, shoe);
  R(lx + (child ? 2 : 3), legY, child ? 2 : 3, legH - rl, legL); R(lx + (child ? 2 : 3), 19 - rl, child ? 2 : 3, 1, shoe);
  if (L.skirt) R(tx, legY, tw, child ? 2 : 3, pc);
  else if (!child) R(7, legY, 2, 1, pc);
  // 胴
  R(tx, torsoY, tw, torsoH, L.top);
  R(tx, torsoY + torsoH - 1, tw, 1, shade(L.top, -0.12));
  // 腕（振り）
  const armA = step === 1 ? 1 : 0, armB = step === -1 ? 1 : 0;
  R(tx - 1, torsoY + armA, 1, torsoH - 1, shade(L.top, -0.1)); P(tx - 1, torsoY + torsoH - 1 + armA, skin);
  R(tx + tw, torsoY + armB, 1, torsoH - 1, shade(L.top, -0.1)); P(tx + tw, torsoY + torsoH - 1 + armB, skin);
  if (!back) {
    if (L.tie) { P(7, torsoY, '#ffffff'); P(8, torsoY, '#ffffff'); P(8, torsoY + 1, '#c03040'); P(8, torsoY + 2, '#c03040'); }
    if (L.scarf) { R(7, torsoY, 2, 1, '#ffd84a'); P(8, torsoY + 1, '#ffd84a'); }
    if (L.stripes) { P(tx, torsoY + torsoH - 2, '#ffd84a'); P(tx + tw - 1, torsoY + torsoH - 2, '#ffd84a'); }
    if (L.acc === 'camera') { R(7, torsoY + 1, 3, 2, '#2a2a36'); P(8, torsoY + 1, '#8fdcf4'); }
    if (L.acc === 'backpack' || L.acc === 'bigpack') { P(tx, torsoY, '#5a4030'); P(tx + tw - 1, torsoY, '#5a4030'); }
  } else {
    if (L.acc === 'backpack') R(tx + 1, torsoY, tw - 2, torsoH - 1, '#e5484d');
    if (L.acc === 'bigpack') { R(tx, torsoY - 2, tw, torsoH + 1, '#7a5a3a'); R(tx, torsoY - 2, tw, 1, '#a07a50'); }
  }
  // 頭
  const hx = child ? 5 : 5, hw = 6;
  R(hx, headY, hw, headH, skin);
  const hc = L.hairc;
  const hs = L.hairStyle;
  if (hs === 'bald') { P(hx, headY + 2, hc); P(hx + hw - 1, headY + 2, hc); P(hx, headY + 3, hc); P(hx + hw - 1, headY + 3, hc); }
  else if (hs === 'pilot' || hs === 'cap') {
    const capc = hs === 'pilot' ? '#22305a' : (L.capc || '#e5484d');
    R(hx - (hs === 'pilot' ? 1 : 0), headY - 1, hw + (hs === 'pilot' ? 2 : 0), 2, capc);
    if (hs === 'pilot') P(8, headY - 1, '#ffd84a');
    if (!back) R(hx, headY + 1, hw + 1, 1, shade(capc, -0.2)); else R(hx, headY + 1, hw, 2, hc);
    P(hx, headY + 2, hc); P(hx + hw - 1, headY + 2, hc);
  } else {
    R(hx, headY - 1, hw, 2, hc);
    P(hx, headY + 1, hc); P(hx + hw - 1, headY + 1, hc);
    if (hs === 'long') { R(hx - 1, headY, 1, 6, hc); R(hx + hw, headY, 1, 6, hc); }
    if (hs === 'bun') { R(7, headY - 2, 2, 1, hc); }
    if (hs === 'pony' && back) { R(7, headY + 3, 2, 3, hc); }
    if (hs === 'pony' && !back) { P(hx + hw, headY + 1, hc); }
  }
  if (back) {
    if (hs !== 'bald') R(hx, headY, hw, hs === 'cap' || hs === 'pilot' ? 3 : 4, hc);
    else R(hx, headY + 2, hw, 2, hc);
  } else {
    // 顔
    const ey = headY + 3;
    P(hx + 1, ey, '#2a2028'); P(hx + 4, ey, '#2a2028');
    if (L.glasses === 'sun') { R(hx, ey, 6, 1, '#1a1a22'); }
    else if (L.glasses === 'normal') { P(hx + 1, ey - 1, '#4a4a58'); P(hx + 4, ey - 1, '#4a4a58'); P(hx + 2, ey, '#4a4a58'); P(hx + 3, ey, '#4a4a58'); }
    if (child) { P(hx, ey + 1, '#ff9aa0'); P(hx + 5, ey + 1, '#ff9aa0'); }
    P(hx + 2, ey + 2, shade(skin, -0.25)); P(hx + 3, ey + 2, shade(skin, -0.25));
  }
  if (L.cap2) { R(hx, headY - 1, hw, 2, L.cap2); }
  if (L.hat) { R(hx - 1, headY - 1, hw + 2, 1, '#f0e0b0'); R(hx, headY - 2, hw, 1, '#f0e0b0'); P(hx + 1, headY - 1, '#e5484d'); }
  // 手荷物
  if (L.acc === 'suitcase') { R(12, legY + 1, 3, legH - 1, L.case); R(13, legY - 1, 1, 2, '#2a2028'); P(12, 19, '#2a2028'); P(14, 19, '#2a2028'); }
  if (L.acc === 'briefcase') { R(12, torsoY + torsoH, 3, 3, '#5a3a24'); P(13, torsoY + torsoH - 1, '#2a2028'); }
  if (L.acc === 'bag') { R(back ? 2 : 12, torsoY + 2, 2, 3, L.case); P(back ? 3 : 12, torsoY, '#2a2028'); P(back ? 3 : 12, torsoY + 1, '#2a2028'); }
  if (L.acc === 'cane') { R(12, torsoY + torsoH - 1, 1, 19 - (torsoY + torsoH) + 2, '#7a5434'); }
}
function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  if (f < 0) { r *= 1 + f; g *= 1 + f; b *= 1 + f; } else { r += (255 - r) * f; g += (255 - g) * f; b += (255 - b) * f; }
  return '#' + ((1 << 24) | (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(b)).toString(16).slice(1);
}
function outlineCanvas(ctx, x0, y0, w, h, col) {
  const img = ctx.getImageData(x0, y0, w, h), d = img.data, out = new Uint8ClampedArray(d);
  const [r, g, b] = [parseInt(col.slice(1, 3), 16), parseInt(col.slice(3, 5), 16), parseInt(col.slice(5, 7), 16)];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4;
    if (d[i + 3] > 0) continue;
    let n = false;
    for (const [dx, dy] of DIRS4) { const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < w && yy < h && d[((yy * w) + xx) * 4 + 3] > 0) { n = true; break; } }
    if (n) { out[i] = r; out[i + 1] = g; out[i + 2] = b; out[i + 3] = 255; }
  }
  img.data.set(out); ctx.putImageData(img, x0, y0);
}

// 人物アトラス生成：type → [variant番号...]
const SPR = { atlas: null, variants: {}, count: 0, mascot: -1 };
function makePersonAtlas() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 512;
  const ctx = c.getContext('2d');
  const rng = mulberry32(12345);
  const rp = a => a[Math.floor(rng() * a.length)];
  let v = 0;
  const addVariant = (L) => {
    for (let f = 0; f < 8; f++) {
      const cell = v * 8 + f, cx = (cell % SPR_COLS) * SPR_W, cy = Math.floor(cell / SPR_COLS) * SPR_H;
      if (L.mascot) drawMascot(ctx, cx, cy, f >= 4, f % 4);
      else drawPerson(ctx, cx, cy, L, f >= 4, f % 4);
      outlineCanvas(ctx, cx, cy, SPR_W, SPR_H, '#2b2134');
    }
    return v++;
  };
  for (const [type, def] of Object.entries(PAX_LOOKS)) {
    const n = (type === 'pilot' || type === 'staff') ? 2 : type === 'vip' || type === 'celeb' ? 2 : type === 'ca' ? 3 : 5;
    SPR.variants[type] = [];
    for (let i = 0; i < n; i++) {
      const L = {
        child: !!def.child, skin: SKIN[def.skin ? rp(def.skin) : Math.floor(rng() * 3)],
        hairStyle: rp(def.hair), hairc: def.hairc ? rp(def.hairc) : rp(HAIR.slice(0, 5)),
        top: rp(def.top), bottom: rp(def.bottom), skirt: rng() < (def.skirt || 0),
        acc: rp(def.acc), tie: def.tie, stripes: def.stripes, scarf: def.scarf, glasses: def.glasses,
        case: rp(['#e5484d', '#4a8fe0', '#ffd84a', '#3fc9b8', '#9a62d0', '#4a4a58', '#f59ac0']),
        capc: rp(['#e5484d', '#4a8fe0', '#ffd84a', '#4cb85c', '#ffffff']), cap2: def.cap2, hat: rng() < (def.hat || 0)
      };
      if (type === 'staff') L.capc = '#f39a3c';
      if (type === 'ca') L.top = def.top[i % def.top.length];
      SPR.variants[type].push(addVariant(L));
    }
  }
  SPR.mascot = addVariant({ mascot: true });
  SPR.variants.mascot = [SPR.mascot];
  SPR.count = v;
  SPR.atlas = c;
  return c;
}
function drawMascot(ctx, ox, oy, back, frame) {
  const R = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(ox + x, oy + y, w, h); };
  const b = frame === 1 || frame === 3 ? 1 : 0;
  R(3, 6 + b, 10, 10, '#ffffff');
  R(2, 8 + b, 1, 6, '#ffffff'); R(13, 8 + b, 1, 6, '#ffffff');
  R(4, 5 + b, 8, 1, '#ffffff');
  // 翼
  const wf = frame % 2 ? -1 : 0;
  R(0, 10 + b + wf, 3, 2, '#4a8fe0'); R(13, 10 + b + wf, 3, 2, '#4a8fe0');
  // しっぽ
  R(7, 3 + b, 2, 2, '#4a8fe0');
  if (!back) {
    R(5, 9 + b, 1, 2, '#2a2028'); R(10, 9 + b, 1, 2, '#2a2028');
    R(7, 11 + b, 2, 1, '#ffd84a');
    R(4, 12 + b, 1, 1, '#ff9aa0'); R(11, 12 + b, 1, 1, '#ff9aa0');
  } else { R(5, 8 + b, 6, 2, '#4a8fe0'); }
  R(5, 16, 2, 2, '#f39a3c'); R(9, 16, 2, 2, '#f39a3c');
}

// ============================================================
//  顔グラフィック（32x32）
// ============================================================
const PORTRAITS = {
  jii:    { name: 'ソラジイ', skin: '#f6c89f', hair: '#f0f0f0', style: 'bald', mustache: '#f0f0f0', cap: '#22305a', capGold: true, eyes: 'smile', bg: '#bfe0ff', cloth: '#6a5040' },
  mayor:  { name: 'ミナト町長', skin: '#f0c09a', hair: '#2a2a36', style: 'slick', glasses: true, cloth: '#3a4060', tie: '#e5484d', bg: '#ffe0b0' },
  tsubasa:{ name: 'ツバサ', skin: '#f8d4b0', hair: '#a0582a', style: 'pony', cloth: '#4cb85c', scarf: '#ffd84a', eyes: 'big', bg: '#d8f8d0', cap: '#4cb85c' },
  kumoi:  { name: 'クモイ', skin: '#f0c8a8', hair: '#6a5a8a', style: 'swept', cloth: '#5a3a8a', tie: '#ffd84a', eyes: 'sharp', bg: '#e8d8ff' },
  hibari: { name: 'ヒバリ', skin: '#f8d4b0', hair: '#2a1e1a', style: 'bob', cloth: '#2f4f9a', scarf: '#e5484d', eyes: 'big', bg: '#ffe0ec' },
  soramaru: { name: 'ソラまる', mascot: true, bg: '#d8f0ff' },
};
const _portraitCache = {};
function portraitURL(id, expr) {
  const key = id + ':' + (expr || 'n');
  if (_portraitCache[key]) return _portraitCache[key];
  const c = document.createElement('canvas'); c.width = 32; c.height = 32;
  const ctx = c.getContext('2d');
  drawPortrait(ctx, PORTRAITS[id] || PORTRAITS.jii, expr || 'n');
  const big = document.createElement('canvas'); big.width = big.height = 96;
  const b = big.getContext('2d'); b.imageSmoothingEnabled = false; b.drawImage(c, 0, 0, 96, 96);
  return (_portraitCache[key] = big.toDataURL());
}
function drawPortrait(ctx, P, expr) {
  const R = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
  R(0, 0, 32, 32, P.bg);
  for (let y = 0; y < 32; y += 4) R(0, y, 32, 1, shade(P.bg, -0.04));
  if (P.mascot) {
    R(7, 9, 18, 17, '#ffffff'); R(5, 12, 2, 11, '#ffffff'); R(25, 12, 2, 11, '#ffffff'); R(9, 7, 14, 2, '#ffffff');
    R(1, 16, 4, 4, '#4a8fe0'); R(27, 16, 4, 4, '#4a8fe0'); R(14, 4, 4, 3, '#4a8fe0');
    const happy = expr === 'h';
    if (happy) { R(10, 15, 3, 1, '#2a2028'); R(19, 15, 3, 1, '#2a2028'); R(9, 14, 1, 1, '#2a2028'); R(13, 14, 1, 1, '#2a2028'); R(18, 14, 1, 1, '#2a2028'); R(22, 14, 1, 1, '#2a2028'); }
    else { R(11, 13, 2, 3, '#2a2028'); R(19, 13, 2, 3, '#2a2028'); R(11, 13, 1, 1, '#fff'); R(19, 13, 1, 1, '#fff'); }
    R(14, 18, 4, 2, '#ffd84a'); R(8, 19, 2, 1, '#ff9aa0'); R(22, 19, 2, 1, '#ff9aa0');
    R(11, 26, 3, 2, '#f39a3c'); R(18, 26, 3, 2, '#f39a3c');
    outlineCanvas(ctx, 0, 0, 32, 32, '#2b2134');
    return;
  }
  // 体
  R(5, 25, 22, 7, P.cloth); R(13, 25, 6, 3, P.skin);
  if (P.tie) { R(15, 26, 2, 6, P.tie); R(12, 25, 3, 2, '#ffffff'); R(17, 25, 3, 2, '#ffffff'); }
  if (P.scarf) { R(12, 25, 8, 2, P.scarf); R(15, 27, 3, 2, P.scarf); }
  // 顔
  R(9, 9, 14, 15, P.skin); R(8, 11, 1, 11, P.skin); R(23, 11, 1, 11, P.skin);
  R(10, 24, 12, 1, P.skin);
  R(7, 15, 1, 3, shade(P.skin, -0.1)); R(24, 15, 1, 3, shade(P.skin, -0.1));
  // 髪
  const h = P.hair;
  if (P.style === 'bald') { R(8, 11, 2, 6, h); R(22, 11, 2, 6, h); R(7, 13, 1, 4, h); R(24, 13, 1, 4, h); }
  if (P.style === 'slick') { R(8, 6, 16, 5, h); R(8, 11, 2, 4, h); R(22, 11, 2, 4, h); R(10, 9, 5, 2, shade(h, 0.2)); }
  if (P.style === 'pony') { R(8, 5, 16, 6, h); R(7, 8, 2, 10, h); R(23, 8, 2, 10, h); R(24, 6, 4, 8, h); R(26, 12, 3, 7, h); R(10, 10, 4, 2, h); }
  if (P.style === 'swept') { R(8, 5, 16, 5, h); R(7, 7, 2, 8, h); R(22, 7, 3, 7, h); R(18, 9, 6, 3, h); R(11, 6, 8, 1, shade(h, 0.25)); }
  if (P.style === 'bob') { R(7, 6, 18, 6, h); R(7, 11, 3, 10, h); R(22, 11, 3, 10, h); R(10, 11, 5, 2, h); }
  if (P.cap) {
    R(8, 4, 16, 5, P.cap); R(7, 8, 18, 2, shade(P.cap, -0.25));
    if (P.capGold) { R(14, 5, 4, 3, '#ffd84a'); R(8, 9, 16, 1, '#ffd84a'); }
  }
  // 目
  const ey = 15, ec = '#2a2028';
  const e = expr === 'h' ? 'smile' : expr === 's' ? 'surprise' : expr === 'a' ? 'angry' : (P.eyes || 'normal');
  if (e === 'smile') { R(11, ey, 3, 1, ec); R(18, ey, 3, 1, ec); R(10, ey + 1, 1, 1, ec); R(14, ey + 1, 1, 1, ec); R(17, ey + 1, 1, 1, ec); R(21, ey + 1, 1, 1, ec); }
  else if (e === 'surprise') { R(11, ey - 1, 3, 3, ec); R(18, ey - 1, 3, 3, ec); R(12, ey, 1, 1, '#fff'); R(19, ey, 1, 1, '#fff'); }
  else if (e === 'big') { R(11, ey - 1, 3, 4, ec); R(18, ey - 1, 3, 4, ec); R(11, ey - 1, 1, 1, '#fff'); R(18, ey - 1, 1, 1, '#fff'); }
  else if (e === 'sharp' || e === 'angry') { R(11, ey, 3, 2, ec); R(18, ey, 3, 2, ec); R(10, ey - 2, 4, 1, ec); R(18, ey - 2, 4, 1, ec); if (e === 'angry') { R(13, ey - 3, 1, 1, ec); R(18, ey - 3, 1, 1, ec); } }
  else { R(11, ey, 2, 3, ec); R(19, ey, 2, 3, ec); R(11, ey, 1, 1, '#fff'); R(19, ey, 1, 1, '#fff'); }
  if (P.glasses) { R(10, ey - 1, 5, 1, '#4a4a58'); R(17, ey - 1, 5, 1, '#4a4a58'); R(10, ey + 3, 5, 1, '#4a4a58'); R(17, ey + 3, 5, 1, '#4a4a58'); R(10, ey - 1, 1, 4, '#4a4a58'); R(14, ey - 1, 1, 4, '#4a4a58'); R(17, ey - 1, 1, 4, '#4a4a58'); R(21, ey - 1, 1, 4, '#4a4a58'); R(15, ey, 2, 1, '#4a4a58'); }
  // 鼻・口
  R(15, 18, 2, 1, shade(P.skin, -0.2));
  if (P.mustache) { R(11, 20, 10, 2, P.mustache); R(10, 21, 2, 1, P.mustache); R(20, 21, 2, 1, P.mustache); }
  else if (expr === 'h') { R(13, 21, 6, 1, '#a0383c'); R(14, 22, 4, 1, '#e06070'); }
  else if (expr === 's') { R(14, 20, 4, 3, '#a0383c'); }
  else if (expr === 'a') { R(13, 22, 6, 1, '#a0383c'); }
  else R(14, 21, 4, 1, '#a0383c');
  R(10, 19, 2, 1, '#ffb0b0'); R(20, 19, 2, 1, '#ffb0b0');
  outlineCanvas(ctx, 0, 0, 32, 32, '#2b2134');
}

// ============================================================
//  滑走路テクスチャ（滑走路ごとに生成）
// ============================================================
function makeRunwayTexture(len, wid, num) {
  const S = 16;
  const c = document.createElement('canvas'); c.width = len * S; c.height = wid * S;
  const ctx = c.getContext('2d');
  for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) {
    const h = hash2(x, y, 31);
    px(ctx, x, y, h < .1 ? '#3e3e48' : h > .95 ? '#5a5a66' : '#474752');
  }
  ctx.fillStyle = '#f4f4f4';
  // 端の白線
  ctx.fillRect(0, 1, c.width, 1); ctx.fillRect(0, c.height - 2, c.width, 1);
  // 中心線（破線）
  const cy = Math.floor(c.height / 2) - 1;
  for (let x = 40; x < c.width - 40; x += 16) ctx.fillRect(x, cy, 9, 2);
  // 末端のしましま
  for (const e of [0, 1]) {
    const x0 = e ? c.width - 14 : 4;
    for (let y = 4; y < c.height - 4; y += 4) ctx.fillRect(x0, y, 10, 2);
    // 接地帯
    const tz = e ? c.width - 52 : 36;
    ctx.fillRect(tz, cy - 6, 12, 2); ctx.fillRect(tz, cy + 6, 12, 2);
  }
  // 番号
  ctx.save();
  ctx.font = 'bold 9px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.translate(26, c.height / 2); ctx.rotate(Math.PI / 2); ctx.fillText(String(num).padStart(2, '0'), 0, 0); ctx.restore();
  ctx.save(); ctx.font = 'bold 9px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.translate(c.width - 26, c.height / 2); ctx.rotate(-Math.PI / 2); ctx.fillText(String((num + 18) % 36 || 36).padStart(2, '0'), 0, 0); ctx.restore();
  return c;
}
function makeStandTexture(sz, num) {
  const S = 16;
  const c = document.createElement('canvas'); c.width = sz * S; c.height = sz * S;
  const ctx = c.getContext('2d');
  for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) {
    const h = hash2(x, y, 33);
    let col = h < .1 ? '#a4a4ac' : h > .95 ? '#cacad2' : '#b8b8c0';
    if (x % 32 === 0 || y % 32 === 0) col = '#a0a0a8';
    px(ctx, x, y, col);
  }
  ctx.fillStyle = '#f2c230';
  const cx = c.width / 2;
  ctx.fillRect(cx - 1, 6, 2, c.height - 6);           // 誘導線
  ctx.fillRect(cx - 10, c.height * 0.3, 20, 2);        // 停止線
  ctx.fillStyle = '#e5484d';
  ctx.fillRect(2, 2, c.width - 4, 1); ctx.fillRect(2, 2, 1, c.height - 4); ctx.fillRect(c.width - 3, 2, 1, c.height - 4);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(String(num), cx + 12, c.height - 10);
  return c;
}
