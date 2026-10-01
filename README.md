# searchiz-bots

Check which AI crawlers a site lets in: OpenAI, Anthropic, Perplexity, Google,
Microsoft, Apple and others, by purpose.

```sh
npx searchiz-bots example.com
npx searchiz-bots --robots ./robots.txt --json
```

```
crawler            owner         purpose   robots   cdn
OAI-SearchBot      OpenAI        search    allowed  reachable
ChatGPT-User       OpenAI        agent     allowed  not tested
GPTBot             OpenAI        training  blocked  possibly_blocked
...
```

Prefer a browser? The same check runs at
[searchiz.com/tools/ai-bot-checker](https://searchiz.com/tools/ai-bot-checker).

## What it tells you

- **search**: crawlers that read the pages AI answers cite (OAI-SearchBot,
  Claude-SearchBot, PerplexityBot, Googlebot, bingbot, Applebot). Blocking
  them can keep your pages out of those answers.
- **agent**: fetches made when a person asks an assistant to open a page
  (ChatGPT-User, Claude-User, Perplexity-User, DuckAssistBot).
- **training**: crawlers that only collect training data (GPTBot, ClaudeBot,
  Google-Extended, Applebot-Extended, CCBot and others). Blocking them does not
  block the search crawlers.

`robots` follows RFC 9309 matching: the most specific user-agent group, then
the longest matching rule, with Allow winning a tie. The rules are the ones the
Searchiz app uses; `test/vectors.json` holds 234 cases recorded from the app,
and the tests check that this package gives the same answer for every one.

`cdn` asks for your home page as a browser and under four crawler names. A
refusal only under a crawler's name suggests a CDN or firewall rule. The probe
comes from your address, not the crawler's verified addresses, so it is a
possible block, not proof. When the browser request fails too, nothing is
reported.

Allowing a crawler makes a page eligible to be read. It does not guarantee a
citation or a recommendation.

## Use as a library

```js
import { checkRobots, checkDomain, isAllowed } from "searchiz-bots";

isAllowed("User-agent: GPTBot\nDisallow: /", "OAI-SearchBot", "/"); // true
const result = await checkDomain("example.com");
```

## Privacy

No telemetry. The only requests go to the domain you name.

## Scope

This is a free tool, not a product: no support promise and no roadmap.
Bug reports about wrong results are welcome as issues.

Open source tells you what could be wrong. Searchiz tells you whether AI
actually recommends you, and fixes it: [run a free scan](https://searchiz.com).

## License

MIT
