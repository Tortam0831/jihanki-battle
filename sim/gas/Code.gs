/**
 * そらのみなと ～ドット空港経営記～ — Google Apps Script 公開用
 * ・doGet で「index」という名前のHTMLファイルを表示します。
 * ・cloudSave / cloudLoad はクラウド保存（別の端末への引きつぎ）です。
 *   スクリプトプロパティに保存するので、特別な設定はいりません。
 */
function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('そらのみなと ～ドット空港経営記～')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

var CHUNK = 2500;          // 1つのプロパティに入れる文字数（日本語でも9KBをこえないように）
var KEEP_DAYS = 30;        // 何日間保存しておくか
var MAX_SAVES = 12;        // 保存しておく数（古いものから消す）

function props_() { return PropertiesService.getScriptProperties(); }
function newKey_() {
  var c = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', s = '';
  for (var i = 0; i < 6; i++) s += c.charAt(Math.floor(Math.random() * c.length));
  return s;
}
function index_() { var s = props_().getProperty('idx'); return s ? JSON.parse(s) : []; }
function removeSave_(p, key) {
  var n = Number(p.getProperty('s:' + key + ':n') || 0);
  for (var i = 0; i < n; i++) p.deleteProperty('s:' + key + ':' + i);
  p.deleteProperty('s:' + key + ':n');
}

/** セーブデータを保存して、6文字のコードを返す */
function cloudSave(data) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    if (typeof data !== 'string' || data.length > 400000) return { err: 'データが大きすぎます' };
    var p = props_();
    var idx = index_(), now = Date.now();
    // 古いものを消す
    idx = idx.filter(function (e) {
      var old = now - e.t > KEEP_DAYS * 86400000;
      if (old) removeSave_(p, e.k);
      return !old;
    });
    while (idx.length >= MAX_SAVES) { var e = idx.shift(); removeSave_(p, e.k); }
    var key = newKey_();
    var n = Math.ceil(data.length / CHUNK);
    for (var i = 0; i < n; i++) p.setProperty('s:' + key + ':' + i, data.substr(i * CHUNK, CHUNK));
    p.setProperty('s:' + key + ':n', String(n));
    idx.push({ k: key, t: now });
    p.setProperty('idx', JSON.stringify(idx));
    return key;
  } catch (err) {
    return { err: String(err) };
  } finally {
    lock.releaseLock();
  }
}

/** コードからセーブデータを読みこむ */
function cloudLoad(key) {
  key = String(key || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  var p = props_();
  var n = Number(p.getProperty('s:' + key + ':n') || 0);
  if (!n) return { err: 'not found' };
  var out = '';
  for (var i = 0; i < n; i++) out += p.getProperty('s:' + key + ':' + i) || '';
  return out;
}
