/*
 * GitHub Actions から週1回実行し、ホームに表示するデータを data/stats.json に保存する。
 *
 * サイトから直接取りに行かないのは、AtCoder とはてなブログがブラウザからの読み込みを許可していないため（CORS）。
 * サーバー側（Actions）で取ってファイルにしておけば、この制限を受けない。
 *
 * 1つの取得に失敗しても、ほかの取得は続ける。失敗したものは前回のデータをそのまま残す。
 * 実行: node scripts/fetch-stats.mjs   （Node.js 20 以上。fetch が標準で使える）
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";

const GITHUB_USER = "madoromi05";
const ATCODER_USER = "madoromi05";
const BLOG_RSS_URL = "https://madoromi-game.hatenablog.com/rss";
const OUTPUT_PATH = "data/stats.json";
const BLOG_POST_COUNT = 3;
const TIME_ZONE = "Asia/Tokyo";
const USER_AGENT = `portfolio-stats (https://github.com/${GITHUB_USER})`;

/* ---------- AtCoder：レートの履歴 ---------- */

async function fetchAtCoder() {
  const response = await fetch(`https://atcoder.jp/users/${ATCODER_USER}/history/json`, {
    headers: { "User-Agent": USER_AGENT },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const history = await response.json();
  // レートが変わるのは Rated のコンテストだけなので、それだけを残す。
  const contests = history
    .filter((contest) => contest.IsRated)
    .map((contest) => ({
      date: contest.EndTime.slice(0, "YYYY-MM-DD".length),
      rating: contest.NewRating,
      name: contest.ContestName,
    }));
  return { contests };
}

/* ---------- はてなブログ：最新記事 ---------- */

// RSS（XML）から1つのタグの中身を取り出す。外部ライブラリを使わないため、正規表現で読む。
// はてなブログの RSS は形が決まっているのでこれで足りるが、どんな XML でも読めるわけではない。
function readTag(xml, tag) {
  const match = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
  if (!match) return "";
  return match[1]
    .replace(/^<!\[CDATA\[|\]\]>$/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .trim();
}

// "Sun, 16 Nov 2026 12:00:00 +0900" のような日時を、日本時間の "2026-11-16" にする。
function toJapanDate(rfc822) {
  return new Date(rfc822).toLocaleDateString("sv-SE", { timeZone: TIME_ZONE });
}

async function fetchBlog() {
  const response = await fetch(BLOG_RSS_URL, { headers: { "User-Agent": USER_AGENT } });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const xml = await response.text();
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, BLOG_POST_COUNT);
  const posts = items.map(([, item]) => ({
    title: readTag(item, "title"),
    url: readTag(item, "link"),
    date: toJapanDate(readTag(item, "pubDate")),
  }));
  return { posts };
}

/* ---------- まとめて保存 ---------- */

async function readPrevious() {
  try {
    return JSON.parse(await readFile(OUTPUT_PATH, "utf8"));
  } catch {
    return {};
  }
}

// 取得に成功したら新しいデータを、失敗したら前回のデータを返す。
async function update(name, fetcher, previous) {
  try {
    const data = await fetcher();
    console.log(`${name}: 取得しました`);
    return { ...data, fetchedAt: new Date().toISOString() };
  } catch (error) {
    // ::warning:: で始めると、Actions の画面に警告として表示される。
    console.log(`::warning::${name} の取得に失敗したので前回のデータを残します: ${error.message}`);
    return previous[name] ?? null;
  }
}

async function main() {
  const previous = await readPrevious();
  const stats = {
    atcoder: await update("atcoder", fetchAtCoder, previous),
    blog: await update("blog", fetchBlog, previous),
  };
  await mkdir(dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(stats, null, 2)}\n`);
}

main();
