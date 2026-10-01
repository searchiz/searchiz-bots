#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { checkDomain, checkRobots } from "../src/index.js";

const args = process.argv.slice(2);
const json = args.includes("--json");
const fileIndex = args.indexOf("--robots");
const target = args.find((arg, index) => !arg.startsWith("--") && (fileIndex === -1 || index !== fileIndex + 1));

if (args.includes("--help") || (!target && fileIndex === -1)) {
  console.log(`Usage: searchiz-bots <domain> [--json]
       searchiz-bots --robots <robots.txt file> [--json]

Shows which AI crawlers robots.txt (and, for a domain, the CDN) lets in.
Nothing is sent anywhere except requests to the domain you name.`);
  process.exit(target || fileIndex !== -1 ? 0 : 1);
}

const result = fileIndex !== -1 ? checkRobots(readFileSync(args[fileIndex + 1], "utf8")) : await checkDomain(target);
if (json) {
  console.log(JSON.stringify(result, null, 2));
} else if (result.error) {
  console.error(result.error === "invalid" ? "Enter a domain such as example.com." : "The site could not be read, so nothing can be said about its crawler access.");
  process.exit(2);
} else {
  if (!result.robotsFound) console.log("No robots.txt found: every crawler is allowed by default.\n");
  if (result.cloudflareManaged) console.log("Cloudflare manages part of this robots.txt; its AI crawler settings may also apply.\n");
  const rows = result.bots.map((bot) => [bot.name, bot.owner, bot.kind, bot.robots, bot.cdn ?? (result.host ? "not tested" : "")]);
  const widths = [0, 1, 2, 3].map((column) => Math.max(...rows.map((row) => row[column].length), 8));
  for (const row of [["crawler", "owner", "purpose", "robots", "cdn"], ...rows]) {
    console.log(row.map((cell, column) => (column < 4 ? cell.padEnd(widths[column]) : cell)).join("  "));
  }
  if (result.host) console.log("\nCDN: probed from your address under the crawler's name; a refusal is only a possible block.");
  console.log("\nSee whether AI answers actually recommend you: https://searchiz.com");
}
