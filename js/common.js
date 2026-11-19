/*
 * ホームとゲーム一覧の両方で使う道具。
 * 2つのページに同じ関数を書くと、片方だけ直して食い違うので、ここに1つだけ置く。
 */

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

// SVG の要素を作る。SVG は HTML と名前空間が違うので createElementNS を使う。
const SVG_NS = "http://www.w3.org/2000/svg";
function svgEl(tag, attrs = {}, children = []) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key === "text") node.textContent = value;
    else node.setAttribute(key, value);
  }
  for (const child of children) {
    if (child) node.append(child);
  }
  return node;
}

// data-profile="項目名" の要素に PROFILE の値を入れる。
function renderProfile(profile) {
  document.querySelectorAll("[data-profile]").forEach((node) => {
    node.textContent = profile[node.dataset.profile];
  });
  document.querySelectorAll("[data-profile-link]").forEach((node) => {
    node.href = profile[node.dataset.profileLink];
  });
}
