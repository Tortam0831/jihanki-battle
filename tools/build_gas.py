#!/usr/bin/env python3
"""index.html から GAS 用の gas/index.html を作る（three.js を埋め込み、外部読み込みなし）。
使い方: python3 tools/build_gas.py path/to/three.min.js   （three@0.160.0 の build/three.min.js）
"""
import re, sys, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
src = (root/'index.html').read_text(encoding='utf-8')
three = pathlib.Path(sys.argv[1]).read_text(encoding='utf-8')
first = three.index('\n')
assert three[:first].startswith('console.warn(')
three = 'void 0,\n' + three[first+1:]          # 非推奨の警告だけ消す
assert '</script' not in three.lower()
old = "<script type=\"module\">\nimport * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';\n"
assert src.count(old) == 1
s = src.replace(old, '<script>\n/* three.js r160 (MIT License) */\n' + three + '\n</script>\n<script>\n(function(){\n\'use strict\';\nconst THREE = window.THREE;\n')
tail = 'requestAnimationFrame(loop);\n</script>\n</body>'
assert s.count(tail) == 1
s = s.replace(tail, 'requestAnimationFrame(loop);\n})();\n</script>\n</body>')
s = s.replace('（3D表示に必要なThree.jsをネットから読み込んでいます）', '（ブラウザが3D表示（WebGL）に対応していない可能性があります）')
assert 'jsdelivr' not in s
(root/'gas'/'index.html').write_text(s, encoding='utf-8')
print('gas/index.html', len(s.encode())//1024, 'KB')
