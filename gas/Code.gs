/**
 * 自販機の裏の戦い — Google Apps Script 公開用
 * 「index」という名前のHTMLファイルを表示します。
 */
function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('自販機の裏の戦い')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
