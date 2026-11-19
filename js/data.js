/*
 * サイトに表示する内容をすべてここに集める。
 * 作品の追加・修正・YouTube ID の差し替えは、このファイルだけを書き換えればよい。
 * 表示の仕組み（common.js・home.js・games.js）と内容（このファイル）を分けておくと、
 * 文章を直すたびに表示側のコードに触れずに済む。
 */

const PROFILE = {
  // 公開サイトなので、氏名・学校・連絡先は載せない。
  // 応募書類（ES・履歴書）にこのサイトの URL を書けば、本人との結び付けは書類側でできる。
  handle: "madoromi05",
  githubUrl: "https://github.com/madoromi05",
  atcoderUrl: "https://atcoder.jp/users/madoromi05",
  blogUrl: "https://madoromi-game.hatenablog.com/",
};

/*
 * youtubeId : 限定公開動画の ID（https://youtu.be/XXXXXXXXXXX の XXXXXXXXXXX 部分）。
 *             空文字のあいだは「動画準備中」と表示する。
 * githubUrl : 空文字のあいだは「コード公開準備中」と表示する。
 */
const WORKS = [
  {
    id: "lastdrop",
    title: "LAST DROP",
    genre: "3D FPS シューティングゲーム",
    production: "個人制作",
    summary: "銃の質感、撃ったときの手応え、そしてプログラムの処理速度にこだわって作りました。描画エンジンは DirectX11 で自作しています。",
    youtubeId: "",
    githubUrl: "",
    cover: "img/lastdrop-cover.webp",
    meta: [
      ["担当", "すべて（個人制作）"],
      ["言語", "C++"],
      ["ライブラリ", "DirectX11"],
      ["ツール", "Git / Sourcetree"],
      ["期間", "約5か月（2026年7月〜11月）"],
      ["制作人数", "1人"],
    ],
    tags: ["C++", "DirectX11", "自作エンジン"],
    highlights: [
      {
        heading: "コンポーネント指向",
        body: "機能を安全に付け外しでき、構造や依存関係が分かりやすいように、コンポーネント指向を採用しました。プレイヤーは移動・体力・持ち物・当たり判定など15個のコンポーネントを組み合わせて作っています。",
      },
      {
        heading: "グラフィック",
        body: "霧の町を表現するために、ポストプロセス、街灯、水たまりの質感にこだわりました。",
        list: ["ディファードレンダリング", "PBR", "HDR", "GPU スキニング", "CSM", "SSAO", "SSR", "TAA", "LUT"],
      },
      {
        heading: "最適化",
        body: "計測用のコードを書き、結果を CSV に書き出して、効果を数字で確かめながら進めました。描画命令を 88%、CPU の処理時間を 61% 減らしました。",
        list: ["インスタンシング", "視錐台カリング", "簡易的な PVS", "背面カリング", "LOD", "BVH", "メッシュ統合", "Hi-Z"],
        metrics: [
          ["描画命令の回数", "494 回", "60 回", "-88%"],
          ["CPU の処理時間", "1.19 ms", "0.47 ms", "-61%"],
          ["ゾンビの更新（CPU）", "0.46 ms", "0.18 ms", "-62%"],
          ["影の描画（GPU）", "0.16 ms", "0.08 ms", "-51%"],
          ["フレームレート", "648 fps", "711 fps", "+10%"],
        ],
      },
    ],
    gallery: [
      { src: "img/lastdrop-play.webp", alt: "LAST DROP のプレイ画面。夜の路地で銃を構えている" },
      { src: "img/lastdrop-fog.webp", alt: "LAST DROP の霧の町並みと街灯" },
    ],
  },
  {
    id: "bereaved-photo",
    title: "遺族写真",
    genre: "一人称ホラーゲーム",
    production: "チーム制作",
    summary: "A* を使ったランダムマップ生成の仕組みと、それを目で確かめるための可視化コードを作りました。光と音の表現にもこだわっています。",
    youtubeId: "",
    githubUrl: "https://github.com/madoromi05/2026_HorrorGame_BereavedPhoto",
    cover: "img/bereaved-cover.webp",
    meta: [
      ["担当", "プログラミング全般"],
      ["エンジン", "Unity"],
      ["ツール", "Git / Sourcetree"],
      ["期間", "約2か月（2026年6月〜7月）"],
      ["制作人数", "デザイナー2名・プログラマー1名"],
    ],
    tags: ["Unity", "C#", "HLSL", "手続き型生成"],
    highlights: [
      {
        heading: "自動マップ生成",
        body: "遊ぶたびに違うレイアウトになるマップ生成システムを設計・実装しました。2D のグリッドを作ってから 3D オブジェクトを置く、4つのフェーズのパイプラインで構成しています。Prim 法と A* を組み合わせて、複雑な迷路になるようにしています。",
      },
      {
        heading: "シェーダー",
        body: "ホラーの雰囲気を出すために、HLSL でシェーダーを作りました。",
        list: ["フレネル", "魚眼レンズ", "ガウスぼかし", "ビデオテープ風", "砂嵐"],
      },
    ],
    gallery: [
      { src: "img/bereaved-map3d.webp", alt: "自動生成されたマップを 3D で可視化した画面" },
      { src: "img/bereaved-map2d.webp", alt: "自動生成されたマップの 2D グリッド" },
      { src: "img/bereaved-play.webp", alt: "懐中電灯で暗い部屋を照らすプレイ画面" },
    ],
  },
  {
    id: "flipdash",
    title: "フリップダッシュ",
    genre: "マルチプレイ 2D アクションゲーム（1〜4人）",
    production: "個人制作",
    summary: "初めて C++（DXライブラリ）で作った作品です。マルチプレイを自分で作ってみたいと考え、C#（.NET）で UDP サーバーを作り、リアルタイムで同期して遊べる仕組みを作りました。",
    youtubeId: "",
    githubUrl: "https://github.com/madoromi05/2026_Dxlib_FlipDash",
    cover: "img/flipdash-cover.webp",
    meta: [
      ["担当", "すべて（個人制作）"],
      ["言語", "C++ / C#（サーバー）"],
      ["ライブラリ", "DXライブラリ"],
      ["ツール", "Git / Sourcetree"],
      ["期間", "約3か月（2025年1月〜3月）"],
      ["制作人数", "1人"],
    ],
    tags: ["C++", "DXライブラリ", "C# / .NET", "UDP"],
    highlights: [
      {
        heading: "通信量を減らす工夫",
        body: "同期が必要なもの（プレイヤーの座標・向き・重力の向き、敵の座標・状態、マップの形）を毎フレームすべて送ると、通信量が多くなりすぎます。そこで送る量と回数を絞りました。",
        list: [
          "マップは乱数の seed だけを配り、それぞれの端末で同じマップを作る",
          "プレイヤーと敵は、前のフレームから変わったときだけ送る",
          "受け取った側は補間して、ほかのプレイヤーが滑らかに動いて見えるようにする",
        ],
      },
    ],
    note: "GitHub の Releases から遊べますが、セキュリティ上の理由でマルチプレイは無効にしています。",
    gallery: [],
  },
  {
    id: "bleakcage",
    title: "BleakCage",
    genre: "スキルカード選択式のターン制 RPG",
    production: "チーム制作",
    summary: "初めてのチーム制作です。難易度を調整するツールや、拡張しやすく仕様変更に強い設計を意識しました。",
    youtubeId: "",
    githubUrl: "https://github.com/madoromi05/BleakCage",
    cover: "img/bleakcage-cover.webp",
    meta: [
      ["担当", "サウンド・UI 以外のプログラム"],
      ["エンジン", "Unity"],
      ["ライブラリ", "DOTween"],
      ["ツール", "Git / Sourcetree"],
      ["期間", "約6か月（2025年6月〜12月）"],
      ["制作人数", "プランナー1名・デザイナー4名・サウンド2名・プログラマー2名"],
    ],
    tags: ["Unity", "C#", "デザインパターン", "エディタ拡張"],
    highlights: [
      {
        heading: "コマンドパターン",
        body: "呼び出す側と実行する側を分けたことで、デバッグしやすくなり、カード効果を試しながら開発できました。オープン・クローズドの原則を意識し、カード効果の種類ごとにクラスを分けています。新しい効果は ICommand を実装したクラスを追加するだけで済み、既存のコマンドを変更する必要がありません。",
      },
      {
        heading: "ゲームデータ調整ツール",
        body: "カードのマスターデータを CSV でまとめて管理し、Unity エディタに置くだけで ScriptableObject アセットの作成・更新・フォルダ整理を自動で行うエディタ拡張です。チームが Excel でデータを書いていたので、エンジニア以外のメンバーも値を調整・確認できるように作りました。",
      },
    ],
    gallery: [
      { src: "img/bleakcage-battle.webp", alt: "BleakCage の戦闘画面" },
    ],
  },
];
