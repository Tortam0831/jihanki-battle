/**
 * そらのみなと ～ドット空港経営記～ — Google Apps Script 公開用
 * ・doGet で「index」という名前のHTMLファイルを表示します。
 * ・cloudSave / cloudLoad はクラウド保存（5けたのコード）です。
 *   - コードは最初に1回だけ発行され、そのあとはずっと同じコードに上書き保存されます。
 *   - セーブデータはスクリプトの持ち主の Google ドライブの「そらのみなと_セーブ」フォルダに保存します。
 *     （はじめてデプロイするとき、ドライブへのアクセスの許可を求められます）
 *   - 90日間だれも保存しなかったコードは自動で消えます。
 */
function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('そらのみなと ～ドット空港経営記～')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

var FOLDER_NAME = 'そらのみなと_セーブ';
var KEEP_DAYS = 90;

function props_() { return PropertiesService.getScriptProperties(); }
function folder_() {
  var it = DriveApp.getFoldersByName(FOLDER_NAME);
  return it.hasNext() ? it.next() : DriveApp.createFolder(FOLDER_NAME);
}
function cleanKey_(k) { return String(k || '').replace(/[^0-9]/g, '').slice(0, 5); }
function newKey_(p) {
  for (var n = 0; n < 50; n++) {
    var k = String(10000 + Math.floor(Math.random() * 90000));
    if (!p.getProperty('f:' + k)) return k;
  }
  throw new Error('コードを作れませんでした');
}
function newToken_() {
  var c = 'abcdefghijkmnpqrstuvwxyz23456789', s = '';
  for (var i = 0; i < 20; i++) s += c.charAt(Math.floor(Math.random() * c.length));
  return s;
}
// 長いあいだ使われていないセーブを消す（たまに）
function cleanup_(p) {
  if (Math.random() > 0.1) return;
  var all = p.getProperties(), now = Date.now();
  for (var k in all) {
    if (k.indexOf('t:') !== 0) continue;
    if (now - Number(all[k]) < KEEP_DAYS * 86400000) continue;
    var key = k.slice(2);
    try { DriveApp.getFileById(all['f:' + key]).setTrashed(true); } catch (e) { }
    p.deleteProperty('f:' + key); p.deleteProperty('k:' + key); p.deleteProperty('t:' + key);
  }
}

/**
 * セーブする。key と token があれば同じコードに上書き、なければ新しい5けたのコードを発行。
 * 返り値：{ key, token } または { err }
 */
function cloudSave(data, key, token) {
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    if (typeof data !== 'string' || data.length > 3000000) return { err: 'データが大きすぎます' };
    var p = props_();
    key = cleanKey_(key);
    var fid = key ? p.getProperty('f:' + key) : null;
    if (fid) {
      if (p.getProperty('k:' + key) !== String(token || '')) return { err: 'このコードは別のセーブで使われています' };
      try {
        DriveApp.getFileById(fid).setContent(data);
      } catch (e) {
        fid = folder_().createFile('sora_' + key + '.txt', data, MimeType.PLAIN_TEXT).getId();
        p.setProperty('f:' + key, fid);
      }
      p.setProperty('t:' + key, String(Date.now()));
      return { key: key, token: token };
    }
    cleanup_(p);
    var nk = newKey_(p), tok = newToken_();
    var f = folder_().createFile('sora_' + nk + '.txt', data, MimeType.PLAIN_TEXT);
    p.setProperty('f:' + nk, f.getId());
    p.setProperty('k:' + nk, tok);
    p.setProperty('t:' + nk, String(Date.now()));
    return { key: nk, token: tok };
  } catch (err) {
    return { err: String(err) };
  } finally {
    lock.releaseLock();
  }
}

/** 5けたのコードからセーブデータを読みこむ */
function cloudLoad(key) {
  key = cleanKey_(key);
  var p = props_();
  var fid = p.getProperty('f:' + key);
  if (!fid) return { err: 'not found' };
  try { return DriveApp.getFileById(fid).getBlob().getDataAsString('UTF-8'); }
  catch (e) { return { err: 'not found' }; }
}
