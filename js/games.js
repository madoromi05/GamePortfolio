/*
 * ゲーム一覧ページ：data.js の WORKS を読み取って画面を組み立てる。
 * 表示の形を変えたいときはこのファイル、文章や作品を変えたいときは data.js を直す。
 * el() と renderProfile() は common.js にある。
 */

const YOUTUBE_EMBED_BASE = "https://www.youtube-nocookie.com/embed/";
const YOUTUBE_THUMBNAIL_BASE = "https://i.ytimg.com/vi/";
const YOUTUBE_THUMBNAIL_FILE = "hqdefault.jpg";	// どの動画にも必ずある大きさ。maxresdefault は HD の動画にしか無い
const PRODUCTION_SOLO = "個人制作";

function productionBadge(production) {
  const kind = production === PRODUCTION_SOLO ? "solo" : "team";
  return el("span", { class: `badge badge--${kind}`, text: production });
}

/* ---------- 表紙 ---------- */

function createCover(work) {
  const frame = el("div", { class: "cover" }, [
    el("img", { src: work.cover, alt: `${work.title} のスクリーンショット`, loading: "lazy" }),
  ]);
  if (!work.youtubeId) frame.append(el("span", { class: "cover__pending", text: "プレイ動画 準備中" }));
  return frame;
}

/* ---------- 動画（クリックされるまで YouTube を読み込まない） ---------- */

function createVideo(work) {
  if (!work.youtubeId) return null;

  const frame = el("div", { class: "video" });
  const thumbnail = el("img", { src: `${YOUTUBE_THUMBNAIL_BASE}${work.youtubeId}/${YOUTUBE_THUMBNAIL_FILE}`, alt: "", loading: "lazy" });	// 何の動画かは再生ボタンの aria-label で読み上げる
  const playButton = el("button", { class: "video__play", type: "button", "aria-label": `${work.title} のプレイ動画を再生` }, [
    el("span", { class: "video__icon", "aria-hidden": "true" }),
  ]);
  playButton.addEventListener("click", () => {
    const player = el("iframe", {
      src: `${YOUTUBE_EMBED_BASE}${work.youtubeId}?autoplay=1&rel=0`,
      title: `${work.title} プレイ動画`,
      allow: "autoplay; encrypted-media; picture-in-picture; fullscreen",
      allowfullscreen: "",
    });
    frame.replaceChildren(player);
  });
  frame.append(thumbnail, playButton);
  return frame;
}

/* ---------- 作品の各パーツ ---------- */

function createLinks(work) {
  const links = el("div", { class: "links" });
  if (work.githubUrl) {
    links.append(el("a", { class: "button button--primary", href: work.githubUrl, target: "_blank", rel: "noopener", text: "GitHub でコードを見る" }));
  } else {
    links.append(el("span", { class: "button button--disabled", text: "コード公開準備中" }));
  }
  return links;
}

function createMeta(meta) {
  const list = el("dl", { class: "meta" });
  for (const [label, value] of meta) {
    list.append(el("div", {}, [el("dt", { text: label }), el("dd", { text: value })]));
  }
  return list;
}

function createTags(tags) {
  return el("ul", { class: "tags" }, tags.map((tag) => el("li", { text: tag })));
}

function createMetrics(rows) {
  const head = el("tr", {}, ["項目", "最適化前", "最適化後", "変化"].map((label) => el("th", { scope: "col", text: label })));
  const body = rows.map(([label, before, after, change]) =>
    el("tr", {}, [
      el("th", { scope: "row", text: label }),
      el("td", { text: before }),
      el("td", { class: "metrics__after", text: after }),
      el("td", { class: "metrics__change", text: change }),
    ])
  );
  return el("table", { class: "metrics" }, [el("thead", {}, [head]), el("tbody", {}, body)]);
}

function createHighlight(highlight) {
  return el("article", { class: "highlight" }, [
    el("h4", { text: highlight.heading }),
    el("p", { text: highlight.body }),
    highlight.list ? el("ul", { class: "highlight__list" }, highlight.list.map((item) => el("li", { text: item }))) : null,
    highlight.metrics ? createMetrics(highlight.metrics) : null,
  ]);
}

function createGallery(images) {
  if (images.length === 0) return null;
  return el("div", { class: "gallery" }, images.map((image) => el("img", { src: image.src, alt: image.alt, loading: "lazy" })));
}

/* ---------- 作品1つぶんのセクション ---------- */

function createWorkSection(work, index) {
  const number = String(index + 1).padStart(2, "0");
  const info = el("div", { class: "work__info" }, [
    el("p", { class: "work__number", text: `WORK ${number}` }),
    el("h3", { class: "work__title", text: work.title }),
    el("p", { class: "work__genre" }, [productionBadge(work.production), document.createTextNode(work.genre)]),
    el("p", { class: "work__summary", text: work.summary }),
    createLinks(work),
    createMeta(work.meta),
  ]);

  return el("section", { class: "work", id: work.id }, [
    el("div", { class: "work__main" }, [
      el("div", { class: "work__media" }, [createCover(work), createVideo(work)]),
      info,
    ]),
    el("div", { class: "highlights" }, work.highlights.map(createHighlight)),
    work.note ? el("p", { class: "work__note", text: `※ ${work.note}` }) : null,
    createGallery(work.gallery),
  ]);
}

/* ---------- 作品一覧（ファーストビューの目次） ---------- */

function createIndexCard(work) {
  return el("a", { class: "index-card", href: `#${work.id}` }, [
    el("img", { src: work.cover, alt: "", loading: "lazy" }),
    el("div", { class: "index-card__body" }, [
      productionBadge(work.production),
      el("strong", { text: work.title }),
      el("span", { text: work.tags.join(" / ") }),
    ]),
  ]);
}

/* ---------- 起動 ---------- */

function render() {
  renderProfile(PROFILE);
  document.getElementById("work-index").append(...WORKS.map(createIndexCard));
  document.getElementById("work-list").append(...WORKS.map(createWorkSection));
}

render();
