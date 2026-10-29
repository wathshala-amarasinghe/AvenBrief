const rules = [
  {
    category: "Gaming",
    sourceLabels: ["gaming", "video games", "esports"],
    titleTerms: ["gaming", "video game", "esports", "xbox", "playstation", "nintendo"],
    tieBreak: 4,
  },
  {
    category: "Technology",
    sourceLabels: [
      "technology",
      "science",
      "internet",
      "cybersecurity",
      "artificial intelligence",
    ],
    titleTerms: [
      "artificial intelligence",
      "ai-powered",
      "cyber",
      "technology",
      "software",
      "robot",
      "internet",
      "digital",
    ],
    tieBreak: 3,
  },
  {
    category: "Climate",
    sourceLabels: [
      "environment",
      "climate change",
      "energy",
      "conservation",
      "pollution",
    ],
    titleTerms: [
      "climate",
      "environment",
      "renewable",
      "clean energy",
      "pollution",
      "emissions",
      "wildlife",
    ],
    tieBreak: 2,
  },
  {
    category: "Finance",
    sourceLabels: [
      "economics & business",
      "economics",
      "business",
      "finance",
      "markets",
      "trade",
    ],
    titleTerms: [
      "economy",
      "economic",
      "finance",
      "financial",
      "market",
      "banking",
      "business",
      "trade",
    ],
    tieBreak: 1,
  },
];

function normalise(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

/**
 * Publisher categories carry more weight than title keywords. World is the
 * safe fallback when the feed does not provide a confident topical match.
 * @param {{title?: string, categories?: string[]}} input
 * @returns {string}
 */
export function suggestRssCategory({ title = "", categories = [] } = {}) {
  const normalisedTitle = normalise(title);
  const sourceCategories = new Set(
    Array.isArray(categories) ? categories.map(normalise).filter(Boolean) : [],
  );

  let best = { category: "World", score: 0, tieBreak: 0 };

  for (const rule of rules) {
    const sourceMatches = rule.sourceLabels.filter((label) =>
      sourceCategories.has(label),
    ).length;
    const titleMatches = rule.titleTerms.filter((term) =>
      normalisedTitle.includes(term),
    ).length;
    const score = sourceMatches * 100 + titleMatches * 10;

    if (
      score > best.score ||
      (score > 0 && score === best.score && rule.tieBreak > best.tieBreak)
    ) {
      best = { category: rule.category, score, tieBreak: rule.tieBreak };
    }
  }

  return best.category;
}
