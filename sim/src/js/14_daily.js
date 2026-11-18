// ============================================================
//  一日のまとめ・銀行（借入）
// ============================================================
const INC_NAMES = { landing: '着陸料', pfc: '旅客の使用料', food: '飲食', shop: 'ショップ', svc: 'サービス・娯楽', park: '駐車場・レンタカー', hotel: '宿泊', cargo: '貨物', fuel: '燃料', other: 'そのほか' };
const EXP_NAMES = { upkeep: '維持費・人件費', build: '建設', land: '土地', research: '開発', route: '路線の開設', interest: '借入の利息', other: 'そのほか' };

// ---------- 銀行 ----------
const LOAN_LIMIT = [0, 3e6, 5e6, 8e6, 15e6, 25e6, 40e6, 60e6, 90e6, 130e6, 200e6];
const LOAN_RATE = 0.005;   // 1日あたり 0.5%
const Bank = {
  loan() { return G.loan || 0; },
  limit() { return LOAN_LIMIT[clamp(G.rank || 1, 1, 10)] * (G.research && G.research.credit ? 1.5 : 1); },
  room() { return Math.max(0, this.limit() - this.loan()); },
  interest() { return Math.ceil(this.loan() * LOAN_RATE); },
  borrow(a) {
    a = Math.min(a, this.room()); if (a <= 0) { toast('これ以上は借りられません（ランクが上がると増えます）', 'bad'); Sound.se('error'); return false; }
    G.loan = this.loan() + a; G.money += a;
    G.stat.today.borrowed = (G.stat.today.borrowed || 0) + a;
    G.loanLog = (G.loanLog || []).concat([[G.day, a]]).slice(-8);
    Sound.se('coin'); toast(`${fmtYen(a)} 借りました`, 'gold', 'money');
    return true;
  },
  repay(a) {
    a = Math.min(a, this.loan(), Math.max(0, G.money));
    if (a <= 0) { toast(this.loan() ? 'お金が足りません' : '借入はありません', 'bad'); Sound.se('error'); return false; }
    G.loan = this.loan() - a; G.money -= a;
    if (G.loan < 1) { G.loan = 0; G.flags.repaidAll = true; }
    G.stat.today.repaid = (G.stat.today.repaid || 0) + a;
    G.loanLog = (G.loanLog || []).concat([[G.day, -a]]).slice(-8);
    Sound.se('money'); toast(`${fmtYen(a)} 返しました`, 'good', 'money');
    if (!G.loan) toast('借入をすべて返しました！', 'gold', 'star');
    return true;
  },
  daily() {
    const i = this.interest();
    if (i > 0) spend(i, 'interest');
    // 残高がマイナスのまま：信用が下がって利息が上がらないよう、自動で少し借りる
    if (G.money < 0 && this.room() > 0 && !G.free) {
      const a = Math.min(this.room(), Math.ceil(-G.money / 1e5) * 1e5);
      G.loan = this.loan() + a; G.money += a;
      G.loanLog = (G.loanLog || []).concat([[G.day, a]]).slice(-8);
      RT.autoLoan = a;
    }
  }
};
function openBank() {
  const L = Bank.loan(), lim = Bank.limit(), room = Bank.room();
  const amts = [1e6, 3e6, 1e7, 3e7].filter(a => a <= Math.max(lim, 1e6));
  const pct = lim ? Math.round(L / lim * 100) : 0;
  let h = `<div class="bankTop"><div class="card"><h5>${iconImg('money', 's')}借入残高</h5><div class="big ${L ? 'neg' : ''}">${fmtYen(L)}</div><div class="bar"><i style="width:${pct}%;background:${pct > 80 ? 'var(--bad)' : 'var(--warn,#f2c230)'}"></i></div><div class="meta">上限 ${fmtYen(lim)}（ランク${G.rank}）・あと ${fmtYen(room)} 借りられます</div></div>
    <div class="card"><h5>${iconImg('clock', 's')}利息</h5><div class="kv"><span class="k">利率</span><span class="v">1日 ${(LOAN_RATE * 100).toFixed(1)}%</span><span class="k">次の0時に払う利息</span><span class="v" style="color:var(--bad)">-${fmtYen(Bank.interest())}</span><span class="k">今の所持金</span><span class="v">${fmtYen(G.money)}</span></div><div class="meta">利息は毎日0時に「一日のまとめ」の支出に入ります。いつでも返せます。</div></div></div>
    <div class="sec">${iconImg('money', 's')}借りる</div><div class="btnrow">${amts.map(a => `<button class="pbtn sm blue" data-b="${a}" ${room < 1 ? 'disabled' : ''}>${fmtYenShort(a)}</button>`).join('')}<button class="pbtn sm" data-b="max" ${room < 1 ? 'disabled' : ''}>上限まで（${fmtYenShort(room)}）</button></div>
    <div class="sec">${iconImg('check', 's')}返す</div><div class="btnrow">${amts.map(a => `<button class="pbtn sm green" data-r="${a}" ${L < 1 ? 'disabled' : ''}>${fmtYenShort(a)}</button>`).join('')}<button class="pbtn sm" data-r="all" ${L < 1 ? 'disabled' : ''}>全部返す</button></div>
    <p class="sub" style="margin-top:8px">💡 大きな滑走路や駐機場を早めに作りたいときに。借りたお金で便を増やせば、利息より多くかせげます。ランクが上がると借りられる額が増えます。</p>`;
  if (G.loanLog && G.loanLog.length) h += `<div class="sec">${iconImg('board', 's')}最近の取引</div><div class="kv">${G.loanLog.slice().reverse().map(([d, a]) => { const dd = dateOf(d); return `<span class="k">${dd.year}年目 ${dd.month}月${dd.partName}</span><span class="v" style="color:${a > 0 ? 'var(--bad)' : 'var(--good)'}">${a > 0 ? '借入 ' : '返済 '}${fmtYen(Math.abs(a))}</span>`; }).join('')}</div>`;
  openModal('銀行', h, { icon: 'money', narrow: true, id: 'bank', silent: UI.modalOpen === 'bank' });
  $('#mBody').onclick = e => {
    const b = e.target.closest('button'); if (!b || b.disabled) return;
    let ok = false;
    if (b.dataset.b) ok = Bank.borrow(b.dataset.b === 'max' ? Bank.room() : +b.dataset.b);
    if (b.dataset.r) ok = Bank.repay(b.dataset.r === 'all' ? Bank.loan() : +b.dataset.r);
    if (ok) { updateHUD(true); openBank(); }
  };
}

// ---------- 一日のまとめ ----------
const DayReport = {
  pending: null,
  tick() {
    if (!this.pending || Game.demo || !Game.started) return;
    if (UI.modalOpen || (typeof Dialog !== 'undefined' && Dialog.active) || UI.photo) return;
    const d = this.pending; this.pending = null;
    if (Game.opts.dayReport === false) { toast(`きのうの利益 ${fmtYen(d.inc - d.exp)}`, d.inc - d.exp >= 0 ? 'good' : 'bad', 'money'); return; }
    openDayReport(d);
  }
};
Bus.on('dayClosed', d => { if (!Game.demo) DayReport.pending = d; });

function dayIssues(d) {
  const out = [];
  const NM = { food: ['food', 'おなかをすかせた人がいた → 飲食店をふやそう'], shop: ['shopping', 'おみやげを買えなかった人がいた → ショップを'], toilet: ['toilet', 'トイレが見つからない人がいた → トイレを近くに'], rest: ['zzz', '休む場所がなかった → ベンチやラウンジを'], fun: ['note', 'ひまな人がいた → 楽しい施設を'] };
  for (const [k, v] of Object.entries(d.unmet || {}).sort((a, b) => b[1] - a[1])) if (v > 3 && NM[k]) out.push([NM[k][0], NM[k][1], Math.round(v)]);
  if (d.missed > 2) out.push(['anger', '乗りおくれた人がいた → 列が長い・搭乗口が遠いかも', Math.round(d.missed)]);
  if (d.cancel > 0) out.push(['sweat', '欠航・ダイバートがあった → 駐機場が足りないか、天気のせい', d.cancel]);
  if (d.late > d.ontime && d.flights > 2) out.push(['clock', '遅れた便が多い → 駐機場・搭乗口・保安検査を増やそう', d.late]);
  if (RT.warnings) for (const [uid, ws] of RT.warnings) { const b = G.blds[uid]; if (b && out.length < 6) out.push(['sweat', `${B[b.id].name}：${ws[0]}`, 0, uid]); }
  if (G.money < 0) out.push(['money', 'お金がマイナス → 銀行で借りるか、建設をひかえよう', 0]);
  return out.slice(0, 6);
}
function openDayReport(d) {
  const dd = dateOf(d.day), prof = d.inc - d.exp;
  const prev = G.hist.length > 1 ? G.hist[G.hist.length - 2] : null;
  const dp = prev ? prof - (prev.inc - prev.exp) : null;
  const incs = Object.entries(d.income || {}).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  const exps = Object.entries(d.expense || {}).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  const maxV = Math.max(1, ...incs.map(e => e[1]), ...exps.map(e => e[1]));
  const row = (n, v, col) => `<div class="drow"><span class="dn">${n}</span><span class="dbar"><i style="width:${Math.max(2, v / maxV * 100)}%;background:${col}"></i></span><span class="dv">${fmtYen(v)}</span></div>`;
  const otp = d.ontime + d.late ? Math.round(d.ontime / (d.ontime + d.late) * 100) + '%' : '-';
  const r0 = d.rating0 != null ? d.rating0 : d.rating, r1 = d.rating != null ? d.rating : G.rating;
  let h = `<div class="dHead"><div class="sub">${dd.year}年目 ${dd.seasonName} ${dd.month}月${dd.partName}（${d.day + 1}日目）</div>
    <div class="dProfit ${prof >= 0 ? 'pos' : 'neg'}">${prof >= 0 ? '＋' : ''}${fmtYen(prof)}</div>
    <div class="sub">今日のもうけ ${dp != null ? `<b style="color:${dp >= 0 ? 'var(--good)' : 'var(--bad)'}">${dp >= 0 ? '▲' : '▼'} きのうより ${fmtYen(Math.abs(dp))}</b>` : ''}</div></div>
    <div class="grid2"><div class="card"><h5>${iconImg('money', 's')}収入 ${fmtYen(d.inc)}</h5>${incs.map(([k, v]) => row(INC_NAMES[k] || k, v, 'var(--good)')).join('') || '<div class="sub">なし</div>'}</div>
    <div class="card"><h5>${iconImg('dozer', 's')}支出 ${fmtYen(d.exp)}</h5>${exps.map(([k, v]) => row(EXP_NAMES[k] || k, v, 'var(--bad)')).join('') || '<div class="sub">なし</div>'}</div></div>
    <div class="dStats">
      <div>${iconImg('plane2', 's')}<b>${d.flights}</b><span>便</span></div>
      <div>${iconImg('people', 's')}<b>${fmtNum((d.paxArr || 0) + (d.paxDep || 0))}</b><span>乗客</span></div>
      <div>${iconImg('clock', 's')}<b>${otp}</b><span>定時運航</span></div>
      <div>${iconImg('camera', 's')}<b>${fmtNum(d.visitors || 0)}</b><span>見学</span></div>
      <div>${iconImg('heart', 's')}<b>${Math.round(d.sat || 0)}</b><span>満足度</span></div>
      <div>${iconImg('star', 's')}<b>${r1.toFixed(1)}</b><span>評価 ${r1 > r0 ? '<i style="color:var(--good)">▲</i>' : r1 < r0 ? '<i style="color:var(--bad)">▼</i>' : ''}</span></div>
    </div>`;
  if (d.top && d.top.length) h += `<div class="sec">${iconImg('star', 's')}今日の売上トップ</div><div class="kv">${d.top.map(([id, lv, v], i) => `<span class="k">${['🥇', '🥈', '🥉'][i]} ${B[id] ? B[id].name : id}${lv > 1 ? ' Lv' + lv : ''}</span><span class="v">${fmtYen(v)}</span>`).join('')}</div>`;
  const iss = dayIssues(d);
  h += `<div class="sec">${iconImg('info', 's')}${iss.length ? '気になること' : 'よかったこと'}</div><div class="list">${iss.length ? iss.map(([ic, tx, n, uid]) => `<div class="li ${uid ? 'jump' : ''}" ${uid ? `data-uid="${uid}"` : ''}>${iconImg(ic)}<div class="grow">${tx}</div>${n ? `<span class="sub">${n}</span>` : ''}${uid ? '<span class="sub">見に行く▶</span>' : ''}</div>`).join('') : `<div class="li">${iconImg('heart')}<div class="grow">大きな問題はありませんでした！この調子！</div></div>`}</div>`;
  const loan = Bank.loan();
  const fw = G.forecast && G.forecast[0] && WEATHER[G.forecast[0]];
  h += `<div class="kv" style="margin-top:8px"><span class="k">所持金</span><span class="v">${fmtYen(G.money)}</span>${loan ? `<span class="k">借入残高（利息 1日 ${fmtYen(Bank.interest())}）</span><span class="v" style="color:var(--bad)">${fmtYen(loan)}</span>` : ''}${RT.autoLoan ? `<span class="k">お金が足りないので自動で借りた額</span><span class="v" style="color:var(--bad)">${fmtYen(RT.autoLoan)}</span>` : ''}${fw ? `<span class="k">あしたの天気</span><span class="v">${fw.name}</span>` : ''}</div>`;
  RT.autoLoan = 0;
  h += `<div class="dFoot"><label class="sub"><input type="checkbox" id="drShow" ${Game.opts.dayReport === false ? '' : 'checked'}> 毎日表示する</label><span class="grow"></span>${loan || G.money < 0 ? `<button class="pbtn sm" id="drBank">${iconImg('money', 's')}銀行</button>` : ''}<button class="pbtn blue" id="drNext">つぎの日へ ▶</button></div>`;
  openModal('一日のまとめ', h, { icon: 'chart', id: 'day', pause: true });
  Sound.se('chime2');
  $('#drNext').onclick = () => closeModal();
  const bk = $('#drBank'); if (bk) bk.onclick = () => openBank();
  $('#drShow').onchange = e => { Game.opts.dayReport = e.target.checked; saveOpts(); };
  $('#mBody').onclick = e => { const li = e.target.closest('.li.jump'); if (!li) return; const b = G.blds[+li.dataset.uid]; if (!b) return; closeModal(); const c = bCenter(b); Cam.tx = c.x; Cam.tz = c.z; showInfo({ type: 'bld', obj: b }); };
}
