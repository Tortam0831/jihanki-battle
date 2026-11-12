/**
 * 自販機の裏の戦い — Google Apps Script 公開用
 * ・doGet で「index」という名前のHTMLファイルを表示します。
 * ・net_ で始まる関数はオンライン対戦の中継です（CacheService を使うので設定不要）。
 */
function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('自販機の裏の戦い')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

var ROOM_TTL = 3600;   // 部屋の情報を残す秒数
var MAX_HUMANS = 7;

function cache_() { return CacheService.getScriptCache(); }
function getMeta_(code) { var s = cache_().get('m:' + code); return s ? JSON.parse(s) : null; }
function putMeta_(m) { cache_().put('m:' + m.code, JSON.stringify(m), ROOM_TTL); }
function cleanName_(s) { return String(s || 'ななし').replace(/[<>&"'`\\]/g, '').slice(0, 8) || 'ななし'; }
function withLock_(fn) {
  var lock = LockService.getScriptLock();
  lock.waitLock(8000);
  try { return fn(); } finally { lock.releaseLock(); }
}
function beat_(code, pid) { cache_().put('hb:' + code + ':' + pid, String(Date.now()), ROOM_TTL); }

/** 部屋を作る */
function net_create(name, skin, settings) {
  return withLock_(function () {
    var code = null;
    for (var i = 0; i < 40; i++) {
      var c = String(1000 + Math.floor(Math.random() * 9000));
      if (!cache_().get('m:' + c)) { code = c; break; }
    }
    if (!code) return { err: '部屋を作れませんでした。もう一度ためしてね' };
    var pid = Utilities.getUuid().slice(0, 8);
    var m = { code: code, host: pid, players: [{ pid: pid, name: cleanName_(name), skin: skin }],
              settings: settings, started: false, closed: false, gameId: 0 };
    putMeta_(m); beat_(code, pid);
    return { code: code, pid: pid, meta: m };
  });
}

/** 部屋に入る */
function net_join(code, name, skin) {
  code = String(code || '').replace(/\D/g, '').slice(0, 4);
  return withLock_(function () {
    var m = getMeta_(code);
    if (!m || m.closed) return { err: '部屋が見つかりません（番号を確認してね）' };
    if (m.started) return { err: 'もうゲームが始まっています。終わるまで待ってね' };
    var limit = Math.min(MAX_HUMANS, (m.settings && m.settings.players) || MAX_HUMANS);
    if (m.players.length >= limit) return { err: '満員です' };
    var pid = Utilities.getUuid().slice(0, 8);
    m.players.push({ pid: pid, name: cleanName_(name), skin: skin });
    putMeta_(m); beat_(code, pid);
    return { code: code, pid: pid, meta: m };
  });
}

/** ロビーの様子を見る（ホストは設定の更新と、いなくなった人の整理もする） */
function net_lobby(code, pid, settings) {
  var m = getMeta_(code);
  if (!m || m.closed) return { err: '部屋がなくなりました' };
  beat_(code, pid);
  if (pid === m.host) {
    var keys = m.players.map(function (p) { return 'hb:' + code + ':' + p.pid; });
    var hb = cache_().getAll(keys), now = Date.now();
    var alive = m.players.filter(function (p) {
      var t = Number(hb['hb:' + code + ':' + p.pid] || 0);
      return p.pid === m.host || m.started || now - t < 10000;
    });
    if (alive.length !== m.players.length || settings) {
      m = withLock_(function () {
        var mm = getMeta_(code); if (!mm) return m;
        var ids = alive.map(function (p) { return p.pid; });
        if (!mm.started) mm.players = mm.players.filter(function (p) { return ids.indexOf(p.pid) >= 0; });
        if (settings && !mm.started) mm.settings = settings;
        putMeta_(mm); return mm;
      });
    }
  }
  return m;
}

/** ゲーム開始（ホストのみ） */
function net_start(code, pid, settings) {
  return withLock_(function () {
    var m = getMeta_(code);
    if (!m || m.host !== pid) return { err: 'ホストだけがスタートできます' };
    m.settings = settings; m.started = true; m.gameId = (m.gameId || 0) + 1;
    cache_().remove('s:' + code);
    putMeta_(m); return m;
  });
}

/** ロビーに戻る（ホストのみ） */
function net_relobby(code, pid) {
  return withLock_(function () {
    var m = getMeta_(code);
    if (!m || m.host !== pid) return { err: 'ホストではありません' };
    m.started = false; putMeta_(m); return m;
  });
}

/** 部屋から出る */
function net_leave(code, pid) {
  return withLock_(function () {
    var m = getMeta_(code);
    if (!m) return { ok: true };
    if (m.host === pid) m.closed = true;
    else m.players = m.players.filter(function (p) { return p.pid !== pid; });
    putMeta_(m); return { ok: true };
  });
}

/** ホスト：ゲームの状態を置いて、みんなの入力をもらう */
function net_host(code, snap, pids) {
  var c = cache_();
  c.put('s:' + code, snap, 600);
  var keys = (pids || []).map(function (p) { return 'i:' + code + ':' + p; });
  var got = keys.length ? c.getAll(keys) : {};
  var out = {};
  (pids || []).forEach(function (p) { var v = got['i:' + code + ':' + p]; if (v) out[p] = v; });
  return out;
}

/** ゲスト：自分の入力を置いて、ゲームの状態をもらう */
function net_guest(code, pid, input) {
  var c = cache_();
  c.put('i:' + code + ':' + pid, input, 600);
  return c.get('s:' + code) || '';
}
