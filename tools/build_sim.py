#!/usr/bin/env python3
"""sim/src から「そらのみなと」を組み立てる。
  sim/index.html      … GitHub Pages 用（three.js を CDN から読み込み）
  sim/gas/index.html  … Google Apps Script 用（three.js を埋め込み）
使い方: python3 tools/build_sim.py path/to/three.min.js   （three@0.160.0 の build/three.min.js）
"""
import sys, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
src = root / 'sim' / 'src'
css = (src / 'style.css').read_text(encoding='utf-8')
body = (src / 'body.html').read_text(encoding='utf-8')
js = '\n'.join((p.read_text(encoding='utf-8')) for p in sorted((src / 'js').glob('*.js')))
assert '</script' not in js.lower()
head = '''<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="theme-color" content="#0c1430">
<title>そらのみなと ～ドット空港経営記～</title>
<style>
''' + css + '''
</style>
</head>
<body>
''' + body
game = "<script>\n(function(){\n'use strict';\n" + js + "\n})();\n</script>\n</body>\n</html>\n"
cdn = '<script src="https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js"></script>\n'
(root / 'sim' / 'index.html').write_text(head + cdn + game, encoding='utf-8')
if len(sys.argv) > 1:
    three = pathlib.Path(sys.argv[1]).read_text(encoding='utf-8')
    first = three.index('\n')
    if three[:first].startswith('console.warn('):
        three = 'void 0,\n' + three[first + 1:]
    assert '</script' not in three.lower()
    out = head + '<script>\n/* three.js r160 (MIT License) */\n' + three + '\n</script>\n' + game
    (root / 'sim' / 'gas' / 'index.html').write_text(out, encoding='utf-8')
    print('sim/gas/index.html', len(out.encode()) // 1024, 'KB')
print('sim/index.html', len((head + cdn + game).encode()) // 1024, 'KB')
