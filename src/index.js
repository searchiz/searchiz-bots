import { BOTS, CDN_PROBES } from "./bots.js";
import { isAllowed, parseRobots } from "./robots.js";

export { BOTS, CDN_PROBES, isAllowed, parseRobots };

const BROWSER = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36";

// Rules only, from robots.txt text.
export function checkRobots(text, path = "/") {
  const groups = parseRobots(text);
  return {
    robotsFound: String(text ?? "").trim() !== "",
    cloudflareManaged: String(text ?? "").includes("BEGIN Cloudflare Managed"),
    bots: BOTS.map((bot) => ({ ...bot, robots: isAllowed(groups, bot.name, path) ? "allowed" : "blocked", cdn: null }))
  };
}

export function normalizeHost(input) {
  let text = String(input ?? "").trim().toLowerCase();
  if (!/^https?:\/\//.test(text)) text = `https://${text}`;
  try {
    const host = new URL(text).hostname.replace(/^www\./, "");
    return /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(host) ? host : null;
  } catch {
    return null;
  }
}

async function status(url, userAgent, fetchImpl) {
  try {
    const response = await fetchImpl(url, { headers: { "User-Agent": userAgent }, redirect: "follow", signal: AbortSignal.timeout(15000) });
    return response.status;
  } catch {
    return null;
  }
}

// A domain: its robots.txt, and whether the home page refuses a request under
// a crawler's name while a browser gets through. The probe comes from your
// address, not the crawler's, so a refusal is only a possible block.
export async function checkDomain(input, { fetchImpl = fetch } = {}) {
  const host = normalizeHost(input);
  if (!host) return { error: "invalid" };
  const origin = `https://${host}`;
  let robots;
  try {
    const response = await fetchImpl(`${origin}/robots.txt`, { headers: { "User-Agent": BROWSER }, signal: AbortSignal.timeout(15000) });
    if (response.status === 404) robots = "";
    else if (response.ok) robots = await response.text();
    else return { host, error: "unreachable" };
  } catch {
    return { host, error: "unreachable" };
  }
  const result = checkRobots(robots);
  const browser = await status(`${origin}/`, BROWSER, fetchImpl);
  const probes = Object.fromEntries(await Promise.all(CDN_PROBES.map(async (name) => [name, await status(`${origin}/`, `Mozilla/5.0 (compatible; ${name}/1.0)`, fetchImpl)])));
  for (const bot of result.bots) {
    const probe = probes[bot.name];
    if (probe === undefined || probe === null || browser === null || browser >= 400) continue;
    bot.cdn = probe >= 400 ? "possibly_blocked" : "reachable";
  }
  return { host, ...result };
}
