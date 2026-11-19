/*
 * data.js の内容（PROFILE / WORKS）を読み取って画面を組み立てる。
 * 表示の形を変えたいときはこのファイル、文章や作品を変えたいときは data.js を直す。
 */

const YOUTUBE_EMBED_BASE = "https://www.youtube-nocookie.com/embed/";
const PRODUCTION_SOLO = "個人制作";

/* ---------- 小さな道具 ---------- */

// 要素を1つ作る。文字は textContent で入れるので、HTML として解釈されない。
function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key === "text") node.textContent = value;
    else node.setAttribute(key, value);
  }
  for (const child of children) {
    if (child) node.append(child);
  }
  return node;
}

function productionBadge(production) {
  const kind = production === PRODUCTION_SOLO ? "solo" : "team";
  return el("span", { class: `badge badge--${kind}`, text: production });
}

/* ---------- 動画（クリックされるまで YouTube を読み込まない） ---------- */

function createVideo(work) {
  const frame = el("div", { class: "video" });
  const cover = el("img", { src: work.cover, alt: `${work.title} のスクリーンショット`, loading: "lazy" });

  if (!work.youtubeId) {
    frame.append(cover, el("span", { class: "video__pending", text: "プレイ動画 準備中" }));
    return frame;
  }

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
  frame.append(cover, playButton);
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
    el("div", { class: "work__main" }, [createVideo(work), info]),
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

/* ---------- プロフィール ---------- */

function renderProfile(profile) {
  document.querySelectorAll("[data-profile]").forEach((node) => {
    node.textContent = profile[node.dataset.profile];
  });
  document.querySelectorAll("[data-profile-link]").forEach((node) => {
    node.href = profile[node.dataset.profileLink];
  });
}

/* ---------- 起動 ---------- */

function render() {
  renderProfile(PROFILE);
  document.getElementById("work-index").append(...WORKS.map(createIndexCard));
  document.getElementById("work-list").append(...WORKS.map(createWorkSection));
}

render();
