// RFC 9309-style matching, the same rules Searchiz applies: the most specific
// user-agent group wins, then the longest matching path rule, and Allow wins
// a tie. No matching rule means access is allowed (not that a page is indexed).

function splitOnce(text, separator) {
  const index = text.indexOf(separator);
  return index === -1 ? [text] : [text.slice(0, index), text.slice(index + separator.length)];
}

export function parseRobots(text) {
  const groups = [];
  let current = null;
  for (const line of String(text ?? "").split(/\r?\n/)) {
    const [name, value] = splitOnce(splitOnce(line, "#")[0], ":").map((part) => part.trim());
    if (value === undefined) continue;
    const key = name.toLowerCase();
    if (key === "user-agent") {
      if (current === null || current.rules.length > 0) {
        current = { agents: [], rules: [] };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
    } else if ((key === "allow" || key === "disallow") && current && value !== "") {
      current.rules.push([key, value]);
    }
  }
  return groups;
}

export function effectiveRules(groups, agent) {
  const name = agent.toLowerCase();
  const scored = groups.map((group) => {
    const scores = group.agents.map((item) => (item === "*" ? 0 : name.includes(item) ? item.length : null)).filter((score) => score !== null);
    return [group, scores.length ? Math.max(...scores) : null];
  });
  const best = Math.max(...scored.map(([, score]) => (score === null ? -Infinity : score)));
  if (best === -Infinity) return [];
  return scored.filter(([, score]) => score === best).flatMap(([group]) => group.rules);
}

function escape(text) {
  return text.replace(/[.*+?^${}()|[\]\\/-]/g, "\\$&");
}

export function isAllowed(robots, agent, path = "/") {
  const groups = Array.isArray(robots) ? robots : parseRobots(robots);
  let winner = null;
  let winnerKey = null;
  for (const [kind, pattern] of effectiveRules(groups, agent)) {
    const anchored = pattern.endsWith("$");
    const value = anchored ? pattern.slice(0, -1) : pattern;
    const expression = new RegExp(`^${escape(value).replaceAll("\\*", ".*")}${anchored ? "$" : ""}`);
    if (!expression.test(path)) continue;
    const key = [Buffer.byteLength(pattern.replace(/[*$]/g, "")), kind === "allow" ? 1 : 0];
    if (winnerKey === null || key[0] > winnerKey[0] || (key[0] === winnerKey[0] && key[1] > winnerKey[1])) {
      winner = kind;
      winnerKey = key;
    }
  }
  return winner === null || winner === "allow";
}
