/*
 * GitHub Actions から週1回実行し、ホームに表示するデータを data/stats.json に保存する。
 *
 * なぜサイトから直接取りに行かないか:
 *   - GitHub の草は、公式の取得方法（GraphQL API）に鍵が要る。サイトの JS に鍵を書くと誰でも見られる。
 *   - AtCoder とはてなブログは、ブラウザからの読み込みを許可していない（CORS）。
 * サーバー側（Actions）で取ってファイルにしておけば、どちらの問題も起きない。
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

// GitHub が返す草の濃さ（文字）を 0〜4 の段階に直す。
const CONTRIBUTION_LEVELS = {
  NONE: 0,
  FIRST_QUARTILE: 1,
  SECOND_QUARTILE: 2,
  THIRD_QUARTILE: 3,
  FOURTH_QUARTILE: 4,
};

/* ---------- GitHub：過去1年の草 ---------- */

const GITHUB_QUERY = `
  query ($login: String!) {
    user(login: $login) {
      contributionsCollection {
        contributionCalendar {
          totalContributions
          weeks { contributionDays { date contributionCount contributionLevel } }
        }
      }
    }
  }`;

async function fetchGitHub() {
  // STATS_TOKEN（自分で作った鍵）があればそれを、無ければ Actions が最初から持っている鍵を使う。
  const token = process.env.STATS_TOKEN || process.env.GITHUB_TOKEN;
  if (!token) throw new Error("鍵（GITHUB_TOKEN）がありません");

  const response = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: { Authorization: `bearer ${token}`, "Content-Type": "application/json", "User-Agent": USER_AGENT },
    body: JSON.stringify({ query: GITHUB_QUERY, variables: { login: GITHUB_USER } }),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const json = await response.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));

  const calendar = json.data.user.contributionsCollection.contributionCalendar;
  return {
    total: calendar.totalContributions,
    weeks: calendar.weeks.map((week) =>
      week.contributionDays.map((day) => ({
        date: day.date,
        count: day.contributionCount,
        level: CONTRIBUTION_LEVELS[day.contributionLevel],
      }))
    ),
  };
}

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
    github: await update("github", fetchGitHub, previous),
    atcoder: await update("atcoder", fetchAtCoder, previous),
    blog: await update("blog", fetchBlog, previous),
  };
  await mkdir(dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(stats, null, 2)}\n`);
}

main();
