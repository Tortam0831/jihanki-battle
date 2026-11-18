// ============================================================
//  会話・ストーリー・目標・ヒント
// ============================================================
const Dialog = {
  q: [], cur: null, i: 0, typing: false, onDone: null, active: false,
  show(lines, onDone) {
    if (this.active) { this.q.push([lines, onDone]); return; }
    this.lines = lines; this.i = 0; this.onDone = onDone; this.active = true;
    $('#dialog').classList.remove('hidden');
    Game.dialogPause = true;
    this.render();
  },
  render() {
    const L = this.lines[this.i];
    const P = PORTRAITS[L.who] || PORTRAITS.jii;
    $('#dPor').src = portraitURL(L.who, L.e);
    $('#dWho').textContent = L.who === 'boss' ? G.boss : P.name;
    if (L.who === 'boss') $('#dPor').src = portraitURL('hibari', L.e);
    const text = L.t.replace(/\{name\}/g, G.name).replace(/\{boss\}/g, G.boss);
    this.full = text; this.n = 0; this.typing = true;
    $('#dCh').innerHTML = ''; $('#dNx').style.display = 'none';
    clearInterval(this.tm);
    this.tm = setInterval(() => {
      this.n += 2;
      $('#dTxt').textContent = this.full.slice(0, this.n);
      if (this.n % 6 === 0) Sound.se('talk');
      if (this.n >= this.full.length) this.finishType();
    }, 30);
  },
  finishType() {
    clearInterval(this.tm); this.typing = false; $('#dTxt').textContent = this.full;
    const L = this.lines[this.i];
    if (L.ch) {
      $('#dCh').innerHTML = L.ch.map((c, k) => `<button class="pbtn sm ${k === 0 ? 'blue' : ''}" data-k="${k}">${c.t}</button>`).join('');
      $('#dCh').onclick = e => { const b = e.target.closest('button'); if (!b) return; e.stopPropagation(); const c = L.ch[+b.dataset.k]; if (c.f) c.f(); this.advance(); };
    } else $('#dNx').style.display = '';
  },
  click() {
    if (!this.active) return;
    if (this.typing) { this.finishType(); return; }
    if (this.lines[this.i].ch) return;
    this.advance();
  },
  advance() {
    Sound.se('click');
    this.i++;
    if (this.i >= this.lines.length) {
      this.active = false; $('#dialog').classList.add('hidden'); Game.dialogPause = false;
      const f = this.onDone; this.onDone = null; if (f) f();
      if (this.q.length) { const [l, d] = this.q.shift(); this.show(l, d); }
      return;
    }
    this.render();
  }
};

// ---------- 判定の道具 ----------
const has = id => Object.values(G.blds).some(b => b.id === id);
const cnt = id => Object.values(G.blds).filter(b => b.id === id).length;
const cntKind = k => Object.values(G.blds).filter(b => B[b.id].kind === k).length;
const paxBest = () => Math.max(G.stat.today.paxArr + G.stat.today.paxDep, RT.lastDay ? RT.lastDay.pax : 0);
function busConnected() {
  const ck = Object.values(G.blds).find(b => B[b.id].kind === 'checkin');
  if (!ck) return false;
  const f = getField(ck);
  return accessPoints().some(ap => accessTiles(ap).some(i => f[i] >= 0));
}
function standOk() {
  const rws = Object.values(G.blds).filter(b => B[b.id].kind === 'runway');
  return Object.values(G.blds).some(b => B[b.id].kind === 'stand' && rws.some(r => standReachable(b, r)));
}
function gateLinked() { return Object.values(G.blds).some(b => B[b.id].kind === 'stand' && b.gate); }

const CHAPTERS = [
  {
    title: '草原の飛行場', desc: 'まずは小さな飛行機が来られる空港を作ろう。', reward: 1000000,
    obj: [
      { t: '短い滑走路を建てる（建設→滑走路・空側）', c: () => cntKind('runway') > 0 },
      { t: '管制塔を建てる', c: () => has('tower') },
      { t: '小型駐機場を建てて、誘導路で滑走路とつなぐ', c: () => standOk() },
      { t: 'ターミナル床をぬって、チェックイン・保安検査・搭乗口を置く', c: () => cntKind('checkin') && cntKind('security') && cntKind('gate') },
      { t: '搭乗口と駐機場をつなぐ（7マス以内）', c: () => gateLinked() },
      { t: '歩道でバス停とターミナルをつなぐ', c: () => busConnected() },
      { t: '路線を開く（路線→下島 など）', c: () => G.routes.length > 0 },
      { t: '最初の飛行機をむかえる', c: () => !!G.flags.firstFlight },
    ],
    start: [
      { who: 'mayor', t: 'やあやあ、よく来てくれた！ わたしはミナト町長。きみが新しい空港長の {boss} くんだね。', e: 'h' },
      { who: 'mayor', t: 'この島に「空の玄関口」を作るのが、町のみんなの夢なんだ。今はまだ草っぱらだけどね…はっはっは。' },
      { who: 'jii', t: 'ふぉっふぉっ。わしはソラジイ。むかしパイロットをしておった。空港づくりのことなら何でも聞くとよい。', e: 'h' },
      { who: 'jii', t: 'まずは【建設】ボタンから「短い滑走路」を建てるんじゃ。小さなプロペラ機なら、それで降りられる。' },
      { who: 'jii', t: '画面はドラッグで動かせるし、ホイールやピンチで近づける。Q・Eキーか右の矢印ボタンでぐるっと回せるぞ。' },
    ],
    end: [
      { who: 'tsubasa', t: 'ついた〜！ そよかぜエアのツバサです！ 一番乗りさせてもらいました！', e: 'h' },
      { who: 'tsubasa', t: '島のみんな、空港ができるのをずっと待ってたんですよ。これからよろしくお願いします！' },
      { who: 'mayor', t: 'すばらしい！ 町からのお祝いだ、空港の発展に使ってくれたまえ！', e: 'h' },
      { who: 'jii', t: 'お客さんは「入口→チェックイン→保安検査→お店→搭乗口」と歩く。トイレやごはんの店もふやしていこうのう。' },
    ]
  },
  {
    title: '町の空港へ', desc: 'お客さんがもっと来たくなる空港にしよう。', reward: 3000000,
    obj: [
      { t: 'トイレを置く', c: () => has('toilet') },
      { t: '飲食店を2つ置く', c: () => Object.values(G.blds).filter(b => B[b.id].cat === 'food').length >= 2, p: () => Object.values(G.blds).filter(b => B[b.id].cat === 'food').length + '/2' },
      { t: '路線を3つにする', c: () => G.routes.length >= 3, p: () => G.routes.length + '/3' },
      { t: '1日の乗客 100人', c: () => paxBest() >= 100, p: () => paxBest() + '/100' },
      { t: '評価 ★3.0', c: () => G.rating >= 3 },
      { t: 'ランク2「町の空港」になる', c: () => G.rank >= 2 },
    ],
    start: [
      { who: 'jii', t: 'ふむ、ちゃんと飛行機が来るようになったのう。次はお客さんが「また来たい」と思う空港にするんじゃ。' },
      { who: 'hibari', t: 'はじめまして、案内係のヒバリです！ お客さんの声は【統計】の「お客さんの声」で見られますよ。', e: 'h' },
      { who: 'hibari', t: 'トイレがないと、みなさんすごく困っちゃいます…！ あと、ごはんが食べられるお店もほしいです！' },
    ],
    end: [
      { who: 'mayor', t: '町の人たちが「空港ができて便利になった」と喜んでいるよ！ これは町からの気持ちだ！', e: 'h' },
      { who: 'jii', t: '次は大きなジェット機じゃな。消防署を建てると、ジェット機の路線が開けるようになる。' },
    ]
  },
  {
    title: 'にぎわいの空港', desc: 'ジェット機が来る、本格的な空港へ。', reward: 8000000,
    obj: [
      { t: '消防署を建てる', c: () => has('fire') },
      { t: 'ふつうの滑走路を建てる（ランク3）', c: () => has('runway_m') || has('runway_l') },
      { t: '組み合わせを2つ見つける', c: () => Object.keys(G.combos).length >= 2, p: () => Object.keys(G.combos).length + '/2' },
      { t: '開発を3つ完了する', c: () => Object.keys(G.research).length >= 3, p: () => Object.keys(G.research).length + '/3' },
      { t: 'ランク3「地方空港」になる', c: () => G.rank >= 3 },
    ],
    start: [
      { who: 'tsubasa', t: '{boss}さん！ うちの会社、評判がよくて飛行機をふやすことになりました！ これも空港のおかげです！', e: 'h' },
      { who: 'jii', t: 'お店は「となり同士」が大事じゃ。本屋とカフェ、おみやげ屋と和菓子屋…近くに置くと思わぬ相乗効果があるぞい。' },
      { who: 'jii', t: '【開発】では空港の技術を研究できる。飛行機が発着するたびに開発ポイントがたまるんじゃ。' },
    ],
    end: [
      { who: 'kumoi', t: '…ほう。ここが最近うわさの空港か。思ったより悪くないじゃないか。', e: 'n' },
      { who: 'kumoi', t: 'わたしはクモイ。となりの島の「クモイ国際空港」の空港長だ。まあ、うちには遠くおよばないがね。', e: 'a' },
      { who: 'jii', t: 'ふぉっふぉ、ライバル登場じゃのう。負けてはおれんぞ！' },
      { who: 'mayor', t: 'よーし、次は国際線だ！ 世界とつながる空港にしよう！ これは準備金だ！', e: 'h' },
    ]
  },
  {
    title: '世界への扉', desc: '国際線を開いて、海外のお客さんを迎えよう。', reward: 20000000,
    obj: [
      { t: '出国審査場と入国審査・税関を建てる', c: () => has('emig') && has('immig') },
      { t: '国際線を開く', c: () => G.routes.some(r => CITIES[r.city].region === 'asia' || CITIES[r.city].region === 'long') },
      { t: '1日の乗客 1,000人', c: () => paxBest() >= 1000, p: () => fmtNum(paxBest()) + '/1,000' },
      { t: '評価 ★3.5（クモイ空港に勝つ！）', c: () => G.rating >= 3.5 },
      { t: 'ランク4「国際空港」になる', c: () => G.rank >= 4 },
    ],
    start: [
      { who: 'kumoi', t: '国際線を開くつもりらしいな。ふん、海外のお客さまは目が肥えているぞ。評価★3.5もない空港には来てくれまい。', e: 'a' },
      { who: 'hibari', t: '国際線には出国審査場と入国審査・税関がいります！ 案内所や両替所があると、海外の方がとっても喜びますよ。' },
    ],
    end: [
      { who: 'kumoi', t: '…評価★3.5だと!? くっ…今回はわたしの負けだ。だが次は負けないぞ！', e: 's' },
      { who: 'tsubasa', t: 'すごーい！ 世界中の飛行機がここに来るなんて、夢みたい！', e: 'h' },
      { who: 'mayor', t: 'ついに国際空港だ！ 町の誇りだよ！ さあ、ボーナスだ！', e: 'h' },
    ]
  },
  {
    title: 'ハブ空港をめざして', desc: '大型機が行き来する、地域の玄関口へ。', reward: 50000000,
    obj: [
      { t: '長い滑走路を建てる（ランク6）', c: () => has('runway_l') },
      { t: '大型機をむかえる（ボーイング787 など）', c: () => Object.keys(G.seenPlanes).some(k => PLANES[k.split(':')[0]].cls === 3) },
      { t: '路線を15にする', c: () => G.routes.length >= 15, p: () => G.routes.length + '/15' },
      { t: '評価 ★4.0', c: () => G.rating >= 4 },
      { t: 'ランク6「地域の玄関口」になる', c: () => G.rank >= 6 },
    ],
    start: [
      { who: 'jii', t: 'いよいよ大きな飛行機の出番じゃ。長い滑走路と大型駐機場がいるぞ。' },
      { who: 'jii', t: 'わしが若いころ、こういう空港を夢見ておったんじゃ…。ほれ、ぼうっとしとらんで、土地を買って広げるんじゃ！', e: 'h' },
    ],
    end: [
      { who: 'kumoi', t: '大型機まで来るようになったか…。正直に言おう。きみの空港は、すばらしい。', e: 'n' },
      { who: 'kumoi', t: 'だが、うちには超高級航空会社「ロイヤルファルコン」が来ている。評価★4.3以上でなければ相手にもされないぞ。', e: 'a' },
      { who: 'mayor', t: 'ハブ空港の仲間入りだ！ 本当によくやってくれた！', e: 'h' },
    ]
  },
  {
    title: 'あこがれの空港', desc: '世界中の人があこがれる空港へ。', reward: 100000000,
    obj: [
      { t: '長距離国際線を3つ開く', c: () => G.routes.filter(r => CITIES[r.city].region === 'long').length >= 3, p: () => G.routes.filter(r => CITIES[r.city].region === 'long').length + '/3' },
      { t: '1日の乗客 5,000人', c: () => paxBest() >= 5000, p: () => fmtNum(paxBest()) + '/5,000' },
      { t: '組み合わせを10個見つける', c: () => Object.keys(G.combos).length >= 10, p: () => Object.keys(G.combos).length + '/10' },
      { t: 'ランク8「世界の空港」になる', c: () => G.rank >= 8 },
    ],
    start: [
      { who: 'tsubasa', t: '{boss}さん、聞きました!? 世界の空港ランキングに、この空港がのったんですって！', e: 'h' },
      { who: 'hibari', t: '世界中からお客さんがいらっしゃいます！ 免税店やラウンジ、もっと充実させましょう！' },
    ],
    end: [
      { who: 'kumoi', t: '…まいった。完敗だよ。きみは本物の空港長だ。', e: 'n' },
      { who: 'kumoi', t: 'じつは、宇宙へ飛ぶ「コスモライン」という会社が、就航先をさがしているらしい。きみの空港なら…きっと。', e: 'h' },
      { who: 'jii', t: '宇宙じゃと!? ふぉっふぉっ…長生きはするもんじゃのう！', e: 'h' },
    ]
  },
  {
    title: 'そらのみなと', desc: '空の、そして宇宙の玄関口へ。', reward: 0,
    obj: [
      { t: 'ランク10「伝説のそらのみなと」になる', c: () => G.rank >= 10 },
      { t: '開発「宇宙港計画」を完了する', c: () => !!G.research.spaceport },
      { t: '宇宙線を開く（コスモライン）', c: () => G.routes.some(r => CITIES[r.city].region === 'space') },
      { t: '宇宙へ飛び立つ便を見送る', c: () => !!G.flags.spaceLaunch },
    ],
    start: [
      { who: 'mayor', t: '{boss}くん。きみが来てから、この島は本当に変わった。', e: 'n' },
      { who: 'mayor', t: '最後のお願いだ。この空港を、宇宙まで届く「そらのみなと」にしてくれないか。', e: 'h' },
    ],
    end: []
  },
];

const Story = {
  unseenDone: 0, lastObjDone: {},
  chapter() { return CHAPTERS[G.story.ch] || null; },
  objDone(o) { try { return !!o.c(); } catch (e) { return false; } },
  start() {
    if (G.free) { $('#mission').classList.add('hidden'); return; }
    const ch = this.chapter();
    if (ch && !G.story.started) { G.story.started = true; Dialog.show(ch.start); }
    this.renderTracker();
  },
  check() {
    if (G.free) return;
    const ch = this.chapter(); if (!ch) return;
    let all = true;
    ch.obj.forEach((o, i) => {
      const ok = this.objDone(o);
      const key = G.story.ch + ':' + i;
      if (ok && !G.story.done[key]) { G.story.done[key] = 1; this.unseenDone++; toast('目標クリア：' + o.t.replace(/（.*）/, ''), 'gold', 'check'); Sound.se('coin'); }
      if (!ok) all = false;
    });
    this.renderTracker();
    if (all && !this.busy) {
      this.busy = true;
      const reward = ch.reward;
      const after = () => {
        if (reward && !G.free) { earn(reward, 'other'); toast(`ごほうび ${fmtYen(reward)}！`, 'gold', 'money'); Sound.se('money'); }
        G.story.ch++; G.story.started = false; this.busy = false;
        const nx = this.chapter();
        if (nx) setTimeout(() => { G.story.started = true; Dialog.show([{ who: 'hibari', t: `第${G.story.ch + 1}章「${nx.title}」のはじまりです！`, e: 'h' }].concat(nx.start)); this.renderTracker(); }, 800);
        else this.renderTracker();
      };
      if (G.story.ch === CHAPTERS.length - 1) { this.ending(after); }
      else { Sound.se('levelup'); Dialog.show([{ who: 'hibari', t: `第${G.story.ch + 1}章「${ch.title}」クリア！`, e: 'h' }].concat(ch.end), after); }
    }
  },
  renderTracker() {
    const box = $('#mission');
    if (G.free || UI.photo) { box.classList.add('hidden'); return; }
    const ch = this.chapter();
    if (!ch) { box.classList.add('hidden'); return; }
    box.classList.remove('hidden');
    const html = `<h4>${iconImg('mission', 's')}第${G.story.ch + 1}章 ${ch.title}</h4><div class="obs">` + ch.obj.map(o => { const ok = this.objDone(o); return `<div class="ob ${ok ? 'done' : ''}"><span class="cb"></span><span>${o.t}${o.p && !ok ? ` <span class="sub">${o.p()}</span>` : ''}</span></div>`; }).join('') + '</div>';
    if (box.innerHTML !== html) box.innerHTML = html;
  },
  ending(after) {
    unlockAch('ending');
    Bus.emit('fireworks'); setTimeout(() => Bus.emit('fireworks'), 1500);
    Sound.bgm('ending');
    Dialog.show([
      { who: 'hibari', t: '宇宙行きのコスモライナー、無事に飛び立ちました…！', e: 'h' },
      { who: 'tsubasa', t: 'はじめてこの島に飛んできた日のこと、今でも覚えてます。あのときは草っぱらだったのに…！', e: 'h' },
      { who: 'kumoi', t: '空と宇宙をつなぐ港、か。…おめでとう、{boss}。きみは伝説の空港長だ。', e: 'h' },
      { who: 'mayor', t: '{boss}くん。この島に来てくれて、本当にありがとう。', e: 'h' },
      { who: 'jii', t: 'ふぉっふぉっ。空はどこまでもつながっておる。これからも、この「そらのみなと」をたのんだぞ。', e: 'h' },
      { who: 'soramaru', t: 'ソラまる〜！（ありがとう、空港長！）', e: 'h' },
    ], () => { showCredits(after); });
  }
};
function showCredits(after) {
  const el = document.createElement('div');
  el.id = 'credits';
  el.innerHTML = `<div class="roll"><h2>そらのみなと</h2><div>～ドット空港経営記～</div><br><h2>空港長</h2><div>${esc(G.boss)}</div><h2>空港</h2><div>${esc(G.name)}</div><br>
  <div>路線 ${G.routes.length} ・ 累計の乗客 ${fmtNum(G.totalPax)}人</div><div>組み合わせ ${Object.keys(G.combos).length} ・ 実績 ${Object.keys(G.ach).length}</div><div>${dateOf(G.day).year}年目 ${dateOf(G.day).month}月</div>
  <h2>出演</h2><div>ソラジイ</div><div>ミナト町長</div><div>ツバサ（そよかぜエア）</div><div>クモイ（クモイ国際空港）</div><div>ヒバリ（案内係）</div><div>ソラまる</div><div>そして、たくさんのお客さんたち</div>
  <h2>つくった人</h2><div>あなた と Claude</div><br><br><h2>Thank you for playing!</h2><div>このあとも空港づくりを続けられます</div><br><br><br></div>`;
  document.body.appendChild(el);
  const close = () => { el.remove(); Sound.bgm('day'); if (after) after(); };
  el.addEventListener('click', () => { if (el.dataset.ok) close(); });
  setTimeout(() => { el.dataset.ok = 1; }, 3000);
  setTimeout(() => { if (document.body.contains(el)) close(); }, 42000);
}

// ---------- ヒント（1回だけ） ----------
const HINTS = [
  { id: 'warn', c: () => RT.warnings.size > 0 && G.day >= 0 && Object.keys(G.blds).length > 4, d: [{ who: 'hibari', t: '赤いマークがついている建物は、なにか困っています！ タップすると理由がわかりますよ。' }] },
  { id: 'queue', c: () => Object.values(G.blds).some(b => B[b.id].kind === 'checkin' && People.fac.get(b.uid) && People.fac.get(b.uid).queue.length > 10), d: [{ who: 'hibari', t: 'チェックインの列がすごく長いです！ カウンターを増やすか、レベルアップするといいですよ。', e: 's' }] },
  { id: 'queue2', c: () => Object.values(G.blds).some(b => B[b.id].kind === 'security' && People.fac.get(b.uid) && People.fac.get(b.uid).queue.length > 10), d: [{ who: 'hibari', t: '保安検査の列が長すぎます！ このままだと飛行機に乗りおくれる人が出ちゃいます。保安検査場をもう1つ置きましょう！', e: 's' }] },
  { id: 'missed', c: () => G.stat.today.missed > 10, d: [{ who: 'jii', t: '乗りおくれたお客さんが出てしまったのう。列が長くないか、搭乗口が遠すぎないか、見直してみるんじゃ。' }] },
  { id: 'toilet', c: () => (G.stat.today.unmet.toilet || 0) > 5, d: [{ who: 'hibari', t: 'トイレをさがしているお客さんがいます…！ トイレを置いてあげてください！', e: 's' }] },
  { id: 'cancel', c: () => G.stat.today.cancel > 0, d: [{ who: 'jii', t: '欠航が出てしまったか。【発着】で理由を見てみるんじゃ。滑走路・駐機場・搭乗口がちゃんとつながっておるかの？' }] },
  { id: 'combo', c: () => Object.keys(G.combos).length > 0, d: [{ who: 'jii', t: '組み合わせを見つけたな！ 近くにあるお店同士は、売上がアップするんじゃ。【図鑑】で確認できるぞ。', e: 'h' }] },
  { id: 'night', c: () => (G.min % 1440) > 21 * 60 && G.routes.length > 0 && G.day > 0, d: [{ who: 'jii', t: '夜はふつう飛行機は飛ばん。開発の「夜間照明システム」があれば、夜おそくまで飛べるようになるぞ。夜景もきれいじゃ。' }] },
  { id: 'money', c: () => G.money < 0 && !G.free, d: [{ who: 'mayor', t: 'お、お金がマイナスになっているぞ！ 維持費が高い建物を見直すか、路線をふやして収入をアップしよう！', e: 's' }] },
  { id: 'fog', c: () => G.weather === 'fog' && G.routes.length > 0, d: [{ who: 'jii', t: '霧が出ておるのう。ILS（計器着陸装置）があれば、霧の日でも着陸できるんじゃが…。' }] },
  { id: 'snow', c: () => G.weather === 'snow' && G.routes.length > 0, d: [{ who: 'jii', t: '雪じゃ！ 除雪車庫がないと、飛行機の準備に時間がかかってしまうぞ。' }] },
  { id: 'typhoon', c: () => G.forecast[0] === 'typhoon', d: [{ who: 'hibari', t: '明日は台風の予報です…！ 全便欠航になってしまうかも。', e: 's' }] },
  { id: 'land', c: () => G.rank >= 2 && Object.keys(G.blds).length > 25, d: [{ who: 'jii', t: '土地がせまくなってきたら【土地】ボタンじゃ。となりの土地を買って、空港を広げられるぞ。' }] },
  { id: 'deck', c: () => G.rank >= 2 && !has('deck'), d: [{ who: 'tsubasa', t: 'そうだ！ 展望デッキを作ると、飛行機を見に来るお客さんが増えますよ！ 滑走路の近くがおすすめです！', e: 'h' }] },
];
function checkHints() {
  if (G.free || Dialog.active) return;
  G.hints = G.hints || {};
  for (const h of HINTS) {
    if (G.hints[h.id]) continue;
    let ok = false; try { ok = h.c(); } catch (e) { }
    if (ok) { G.hints[h.id] = 1; Dialog.show(h.d); return; }
  }
}

// ---------- ストーリーのイベント ----------
function initStoryEvents() {
  Bus.on('rankUp', (r, old) => {
    Sound.se('levelup');
    const unlocks = [];
    for (const d of Object.values(B)) if (d.rank === r && !d.fixed) unlocks.push(d.name);
    const als = Object.values(AIRLINES).filter(a => a.rank === r).map(a => a.name);
    const cs = Object.values(CITIES).filter(c => c.rank === r).map(c => c.name);
    const ps = Object.values(PLANES).filter(p => p.rank === r).map(p => p.name + (r > 1 ? '' : ''));
    const rs = RESEARCH.filter(x => x.rank === r).map(x => x.name);
    const sec = (t, a) => a.length ? `<div class="sec">${t}</div><div>${a.join('、')}</div>` : '';
    openModal('ランクアップ！', `<div style="text-align:center"><div style="font-size:15px">空港ランクが上がりました！</div><div style="font-size:34px;margin:6px 0;color:var(--blue2)">ランク${r}</div><div style="font-size:20px">「${RANKS[r - 1].name}」</div></div>
      ${sec('新しい建物', unlocks)}${sec('新しい航空会社', als)}${sec('新しい就航先', cs)}${sec('新しい機材（路線の画面で機材を変えられます）', ps)}${sec('新しい開発', rs)}
      <div style="text-align:center;margin-top:10px"><button class="pbtn gold" onclick="document.getElementById('mClose').click()">やったー！</button></div>`, { icon: 'star', narrow: true, pause: true });
    if (r === 2 && !G.free) Dialog.show([{ who: 'jii', t: 'ランクが上がると、新しい建物や航空会社が解放されるんじゃ。どんどん大きくしていこう！', e: 'h' }]);
  });
  Bus.on('combo', c => { Sound.se('combo'); toast(`組み合わせ発見！「${c.name}」${c.desc}`, 'gold', 'note'); G.points += 40; });
  Bus.on('ach', a => { Sound.se('coin'); toast(`実績「${a.name}」を達成！`, 'gold', a.icon); });
  Bus.on('research', r => toast(`開発完了：${r.name}`, 'good', r.icon));
  Bus.on('routeOpened', r => toast(`${CITIES[r.city].name}行きの路線が開きました！（${AIRLINES[r.airline].name}）`, 'good', 'globe'));
  Bus.on('cancel', (fl, why) => toast(`${fl.code} ${CITIES[fl.city].name}便 欠航：${why}`, 'bad', 'anger'));
  Bus.on('divert', fl => toast(`${fl.code} 着陸できず他の空港へ…`, 'bad', 'anger'));
  Bus.on('holdNoStand', fl => { toast(`${fl.code} 空いている駐機場がなく上空で待機中…（駐機場・搭乗口を増やそう）`, 'bad', 'plane'); if (!G.free) { G.hints = G.hints || {}; if (!G.hints.hold) { G.hints.hold = 1; Dialog.show([{ who: 'jii', t: '飛行機が空の上でぐるぐる回っておる！ 駐機場がいっぱいなんじゃ。駐機場と搭乗口を増やすか、便数を見直すんじゃ。大きな機材は大型駐機場にしか入れんぞ。' }]); } } });
  Bus.on('goAround', fl => toast(`${fl.code} 滑走路が空いていないため着陸やり直し（ゴーアラウンド）`, '', 'plane'));
  Bus.on('firstFlight', fl => { Sound.se('levelup'); toast('はじめての飛行機が到着しました！', 'gold', 'plane'); });
  Bus.on('event', ev => { toast(`今日は「${ev.name}」！ ${ev.desc}`, 'gold', 'star'); if (Sound.cur !== 'event' && (ev.visitors || 0) >= 2) Sound.bgm('event'); });
  Bus.on('departed', fl => { if (fl.type === 'cosmo') { G.flags.spaceLaunch = true; Sound.bgm('space'); } });
  Bus.on('monthReport', rep => {
    if (G.free) return;
    toast(`先月のまとめ：乗客${fmtNum(rep.pax)}人・利益${fmtYen(rep.inc - rep.exp)}`, rep.inc >= rep.exp ? 'good' : 'bad', 'chart');
  });
  Bus.on('newDay', () => {
    const d = dateOf(G.day);
    if (d.part === 0 && d.month % 3 === 0) toast(`${d.seasonName}になりました`, '', ['sakura', 'sun', 'tree', 'snow'][d.season]);
    if (G.weather !== 'sun' && G.weather !== 'cloud') toast(`今日の天気：${WEATHER[G.weather].name}`, G.weather === 'typhoon' ? 'bad' : '', WEATHER[G.weather].icon);
  });
}
