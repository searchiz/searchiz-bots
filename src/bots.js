// AI crawlers by purpose. Search crawlers read the pages AI answers cite;
// agents fetch a page when a person asks; training crawlers only collect
// training data. Blocking a training crawler does not block search.
export const BOTS = [
  { name: "OAI-SearchBot", owner: "OpenAI", kind: "search" },
  { name: "ChatGPT-User", owner: "OpenAI", kind: "agent" },
  { name: "GPTBot", owner: "OpenAI", kind: "training" },
  { name: "Claude-SearchBot", owner: "Anthropic", kind: "search" },
  { name: "Claude-User", owner: "Anthropic", kind: "agent" },
  { name: "ClaudeBot", owner: "Anthropic", kind: "training" },
  { name: "PerplexityBot", owner: "Perplexity", kind: "search" },
  { name: "Perplexity-User", owner: "Perplexity", kind: "agent" },
  { name: "Googlebot", owner: "Google", kind: "search" },
  { name: "Google-Extended", owner: "Google", kind: "training" },
  { name: "bingbot", owner: "Microsoft", kind: "search" },
  { name: "Applebot", owner: "Apple", kind: "search" },
  { name: "Applebot-Extended", owner: "Apple", kind: "training" },
  { name: "DuckAssistBot", owner: "DuckDuckGo", kind: "agent" },
  { name: "Meta-ExternalAgent", owner: "Meta", kind: "training" },
  { name: "Amazonbot", owner: "Amazon", kind: "training" },
  { name: "CCBot", owner: "Common Crawl", kind: "training" },
  { name: "Bytespider", owner: "ByteDance", kind: "training" }
];

// Crawler names used in the CDN probe; the others share their rules.
export const CDN_PROBES = ["OAI-SearchBot", "GPTBot", "ClaudeBot", "PerplexityBot"];
