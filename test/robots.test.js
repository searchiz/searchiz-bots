import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { BOTS, checkDomain, checkRobots, isAllowed } from "../src/index.js";

const vectors = JSON.parse(readFileSync(new URL("./vectors.json", import.meta.url), "utf8"));

test("matches the Searchiz app on every recorded case", () => {
  for (const item of vectors.cases) {
    assert.equal(isAllowed(item.robots, item.agent, item.path), item.allowed, `${item.agent} ${item.path}\n${item.robots}`);
  }
});

test("lists the same crawlers as the app", () => {
  assert.deepEqual(BOTS.map((bot) => bot.name), vectors.bots.map((bot) => bot.name));
});

test("blocking GPTBot does not block OpenAI's search crawler", () => {
  const rows = Object.fromEntries(checkRobots("User-agent: GPTBot\nDisallow: /").bots.map((bot) => [bot.name, bot.robots]));
  assert.equal(rows.GPTBot, "blocked");
  assert.equal(rows["OAI-SearchBot"], "allowed");
});

test("a CDN refusal under a crawler's name is a possible block, never when browsers fail too", async () => {
  const fake = (blocked, browserStatus = 200) => async (url, options) => {
    if (url.endsWith("/robots.txt")) return { status: 404, ok: false, text: async () => "" };
    const agent = options.headers["User-Agent"];
    return { status: blocked.some((name) => agent.includes(name)) ? 403 : browserStatus, ok: true };
  };
  const result = await checkDomain("www.Example.com", { fetchImpl: fake(["GPTBot"]) });
  const rows = Object.fromEntries(result.bots.map((bot) => [bot.name, bot]));
  assert.equal(result.host, "example.com");
  assert.equal(rows.GPTBot.cdn, "possibly_blocked");
  assert.equal(rows["OAI-SearchBot"].cdn, "reachable");
  assert.equal(rows.Googlebot.cdn, null);
  const down = await checkDomain("example.com", { fetchImpl: fake(["GPTBot"], 503) });
  assert.ok(down.bots.every((bot) => bot.cdn === null));
});

test("the CLI reads a robots.txt file", async () => {
  const { execFileSync } = await import("node:child_process");
  const output = execFileSync(process.execPath, ["bin/searchiz-bots.js", "--robots", "examples/blocks-training-only.txt", "--json"], { encoding: "utf8" });
  const rows = Object.fromEntries(JSON.parse(output).bots.map((bot) => [bot.name, bot.robots]));
  assert.equal(rows.GPTBot, "blocked");
  assert.equal(rows["Claude-SearchBot"], "allowed");
});
