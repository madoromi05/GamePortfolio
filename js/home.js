/*
 * ホーム：data/stats.json（GitHub Actions が週1回作る）を読んで、
 * GitHub の草・AtCoder のレート・ブログの最新記事を表示する。
 * グラフは外部ライブラリを使わず、SVG を直接組み立てて描く。
 * el() / svgEl() / renderProfile() は common.js にある。
 */

const STATS_URL = "data/stats.json";
const MONTH_LABELS = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];

/* ---------- 共通 ---------- */

// 横にスクロールする枠は、最新（右端）が見える位置から始める。
function scrollToLatest(container) {
  container.scrollLeft = container.scrollWidth;
}

// 表示中のデータがサンプルなら、パネルの見出しに印を付ける。
function markSample(panelId, source) {
  if (!source?.sample) return;
  document.querySelector(`#${panelId} .panel__title`).append(el("span", { class: "sample-badge", text: "サンプル" }));
}

function showEmpty(container, message) {
  container.replaceChildren(el("p", { class: "panel__empty", text: message }));
}

/* ---------- GitHub の草 ---------- */

const CELL_SIZE = 11;
const CELL_GAP = 3;
const CELL_STEP = CELL_SIZE + CELL_GAP;
const DAYS_PER_WEEK = 7;
const CALENDAR_LEFT = 28;   // 曜日ラベルの幅
const CALENDAR_TOP = 18;    // 月ラベルの高さ
const WEEKDAY_LABELS = { 1: "月", 3: "水", 5: "金" };

function createCalendar(weeks) {
  const width = CALENDAR_LEFT + weeks.length * CELL_STEP;
  const height = CALENDAR_TOP + DAYS_PER_WEEK * CELL_STEP;
  const svg = svgEl("svg", { viewBox: `0 0 ${width} ${height}`, class: "contrib__svg", role: "img", "aria-label": "過去1年のコントリビューション" });

  for (const [row, label] of Object.entries(WEEKDAY_LABELS)) {
    svg.append(svgEl("text", { x: 0, y: CALENDAR_TOP + row * CELL_STEP + CELL_SIZE - 1, class: "chart-label", text: label }));
  }

  let previousMonth = null;
  weeks.forEach((week, column) => {
    const x = CALENDAR_LEFT + column * CELL_STEP;

    // 週の最初の日で月が変わったら、上に月の名前を出す。
    const month = new Date(week[0].date).getUTCMonth();
    if (month !== previousMonth && column > 0) {
      svg.append(svgEl("text", { x, y: CALENDAR_TOP - 6, class: "chart-label", text: MONTH_LABELS[month] }));
    }
    previousMonth = month;

    for (const day of week) {
      const row = new Date(day.date).getUTCDay(); // 日曜 = 0
      svg.append(
        svgEl("rect", { x, y: CALENDAR_TOP + row * CELL_STEP, width: CELL_SIZE, height: CELL_SIZE, rx: 2, class: `contrib__cell contrib__cell--${day.level}` }, [
          svgEl("title", { text: `${day.date}：${day.count} 件` }),
        ])
      );
    }
  });
  return svg;
}

function renderGitHub(github) {
  const container = document.getElementById("github-calendar");
  if (!github) return showEmpty(container, "データがまだありません。");
  markSample("github", github);
  document.getElementById("github-summary").textContent = `過去1年のコントリビューション：${github.total.toLocaleString()} 件`;
  container.replaceChildren(createCalendar(github.weeks));
  scrollToLatest(container);
}

/* ---------- AtCoder のレート ---------- */

// AtCoder の色の段（下限のレート）。
const RATING_COLORS = [
  { min: 0, name: "gray", color: "#808080" },
  { min: 400, name: "brown", color: "#804000" },
  { min: 800, name: "green", color: "#008000" },
  { min: 1200, name: "cyan", color: "#00c0c0" },
  { min: 1600, name: "blue", color: "#0000ff" },
  { min: 2000, name: "yellow", color: "#c0c000" },
  { min: 2400, name: "orange", color: "#ff8000" },
  { min: 2800, name: "red", color: "#ff0000" },
];
const RATING_STEP = 400;
const CHART_WIDTH = 720;
const CHART_HEIGHT = 220;
const CHART_PADDING = { top: 12, right: 16, bottom: 28, left: 44 };

function ratingColor(rating) {
  return RATING_COLORS.findLast((band) => rating >= band.min).color;
}

function createRatingChart(contests) {
  const plotWidth = CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right;
  const plotHeight = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom;
  const maxRating = Math.max(...contests.map((c) => c.rating));
  const yMax = (Math.floor(maxRating / RATING_STEP) + 1) * RATING_STEP; // 最高レートの1つ上の段まで描く

  const times = contests.map((c) => new Date(c.date).getTime());
  const tMin = Math.min(...times);
  const tSpan = Math.max(...times) - tMin || 1; // 1回だけのときに 0 で割らないように

  const xOf = (time) => CHART_PADDING.left + ((time - tMin) / tSpan) * plotWidth;
  const yOf = (rating) => CHART_PADDING.top + plotHeight - (rating / yMax) * plotHeight;

  const svg = svgEl("svg", { viewBox: `0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`, class: "rating__svg", role: "img", "aria-label": "AtCoder のレートの推移" });

  // 背景の色の帯と、400 ごとの目盛り
  for (const band of RATING_COLORS.filter((b) => b.min < yMax)) {
    const top = yOf(Math.min(band.min + RATING_STEP, yMax));
    svg.append(svgEl("rect", { x: CHART_PADDING.left, y: top, width: plotWidth, height: yOf(band.min) - top, fill: band.color, class: "rating__band" }));
    svg.append(svgEl("text", { x: CHART_PADDING.left - 6, y: yOf(band.min) + 4, class: "chart-label", "text-anchor": "end", text: band.min }));
  }

  // 最初と最後の日付
  const first = contests[0];
  const last = contests[contests.length - 1];
  svg.append(svgEl("text", { x: CHART_PADDING.left, y: CHART_HEIGHT - 8, class: "chart-label", text: first.date }));
  svg.append(svgEl("text", { x: CHART_PADDING.left + plotWidth, y: CHART_HEIGHT - 8, class: "chart-label", "text-anchor": "end", text: last.date }));

  // 折れ線と、コンテストごとの点（点の色はその時のレートの色）
  const points = contests.map((c, i) => `${xOf(times[i])},${yOf(c.rating)}`).join(" ");
  svg.append(svgEl("polyline", { points, class: "rating__line" }));
  contests.forEach((c, i) => {
    svg.append(
      svgEl("circle", { cx: xOf(times[i]), cy: yOf(c.rating), r: 4, fill: ratingColor(c.rating), class: "rating__point" }, [
        svgEl("title", { text: `${c.date} ${c.name}：${c.rating}` }),
      ])
    );
  });
  return svg;
}

function createRatingStats(contests) {
  const current = contests[contests.length - 1].rating;
  const highest = Math.max(...contests.map((c) => c.rating));
  // 色はレートの横の小さな印で示す（濃い緑などは暗い背景の上の文字だと読みにくいため）。
  const item = (label, value, unit, color) =>
    el("div", {}, [
      el("dt", { text: label }),
      el("dd", {}, [
        color ? el("span", { class: "stats__swatch", style: `background: ${color}` }) : null,
        document.createTextNode(value),
        unit ? el("small", { text: unit }) : null,
      ]),
    ]);
  return el("dl", { class: "stats" }, [
    item("現在のレート", current, "", ratingColor(current)),
    item("最高レート", highest, "", ratingColor(highest)),
    item("参加回数（Rated）", contests.length, "回"),
  ]);
}

function renderAtCoder(atcoder) {
  const container = document.getElementById("atcoder-chart");
  if (!atcoder) return showEmpty(container, "データがまだありません。");
  markSample("atcoder", atcoder);
  if (atcoder.contests.length === 0) return showEmpty(container, "まだ Rated のコンテストに参加していません。");
  document.getElementById("atcoder-stats").replaceChildren(createRatingStats(atcoder.contests));
  container.replaceChildren(createRatingChart(atcoder.contests));
  scrollToLatest(container);
}

/* ---------- ブログの最新記事 ---------- */

function renderBlog(blog) {
  const list = document.getElementById("blog-posts");
  if (!blog || blog.posts.length === 0) return showEmpty(list, "記事がまだありません。");
  markSample("blog", blog);
  list.replaceChildren(
    ...blog.posts.map((post) =>
      el("li", {}, [
        el("time", { datetime: post.date, text: post.date.replaceAll("-", ".") }),
        el("a", { href: post.url, target: "_blank", rel: "noopener", text: post.title }),
      ])
    )
  );
}

/* ---------- ゲーム一覧への入口 ---------- */

function renderGamesEntry(works) {
  document.getElementById("games-count").textContent = `${works.length} 作品`;
  document.getElementById("games-thumbs").append(...works.map((work) => el("img", { src: work.cover, alt: "", loading: "lazy" })));
}

/* ---------- 起動 ---------- */

async function loadStats() {
  // ファイルを直接ダブルクリックで開くと（file://）、ブラウザが fetch を止める。
  // 確認するときは VS Code の Live Server などで開く。
  const response = await fetch(STATS_URL, { cache: "no-cache" });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

async function render() {
  renderProfile(PROFILE);
  renderGamesEntry(WORKS);
  try {
    const stats = await loadStats();
    renderGitHub(stats.github);
    renderAtCoder(stats.atcoder);
    renderBlog(stats.blog);
  } catch (error) {
    console.error(error);
    for (const id of ["github-calendar", "atcoder-chart", "blog-posts"]) {
      showEmpty(document.getElementById(id), "データを読み込めませんでした。");
    }
  }
}

render();
