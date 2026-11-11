# 自販機の裏の戦い

学校の自動販売機の裏で、虫たちが硬貨を奪い合う3D物理アクション陣取りゲーム（Three.js・HTML 1ファイル）。

## モード
- **個人戦（陣取り）**：4匹で硬貨を自分の陣地（ふせん）に集める
- **チーム戦（サッカー）**：2対2。相手のゴールに硬貨を入れると得点

## 操作
- PC: WASD／矢印キーで移動、スペースでタックル、Pで一時停止
- iPad: 画面をドラッグで移動、右下ボタンでタックル

## ファイル
- `index.html` … GitHub Pages 用（three.js を CDN から読み込み）
- `gas/` … Google Apps Script 用（three.js 埋め込み・外部読み込みなし）
  - `Code.gs` と `index.html`（GAS上のファイル名は `index`）
- `tools/build_gas.py` … `index.html` から `gas/index.html` を作るスクリプト
  - `python3 tools/build_gas.py node_modules/three/build/three.min.js`（three@0.160.0）
