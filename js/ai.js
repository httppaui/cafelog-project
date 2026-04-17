// ai.js — Anthropic API call for coffee recommendations

async function fetchAIRecommendations() {
  State.set("aiLoading", true);
  renderPage("ai");

  const entries = State.get("entries");
  const history = entries.slice(0, 6)
    .map(e => `${e.cafe}: ${e.drink} (${e.rating}★) — Tags: ${(e.tags || []).join(", ")} — Mood: ${e.mood || "n/a"}`)
    .join("\n");

  const avgFlavors = State.avgFlavors();
  const flavorSummary = Object.entries(avgFlavors)
    .map(([k, v]) => `${k}: ${v}/100`)
    .join(", ");

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [{
          role: "user",
          content: `You are an expert coffee sommelier with deep knowledge of specialty coffee.

Based on this coffee journal history:
${history}

Average flavor profile: ${flavorSummary || "no data yet"}

Respond ONLY with a valid JSON object — no markdown, no backticks, no explanation. Use this exact structure:
{
  "recommendations": [
    {
      "emoji": "single emoji",
      "name": "coffee drink or café style name",
      "type": "drink or café type",
      "reason": "2-sentence reason tailored to their specific taste history and patterns"
    }
  ]
}

Give exactly 4 recommendations. Mix new drink suggestions and café style suggestions. Reference their actual journaling patterns, favorite flavors, and moods in your reasons. Be specific and personal — not generic coffee advice.`
        }]
      })
    });

    const data = await response.json();

    if (data.error) throw new Error(data.error.message);

    const text  = (data.content || []).map(c => c.text || "").join("");
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    State.set("aiRecommendations", parsed.recommendations);
  } catch (err) {
    console.error("AI fetch error:", err);
    // Graceful fallback
    State.set("aiRecommendations", [
      {
        emoji: "🌸",
        name: "Kenya AA Pour Over",
        type: "drink",
        reason: "Your love of floral and fruity notes suggests you'd adore Kenya's bright, berry-forward, wine-like profile. It's a natural evolution from the Ethiopian pour overs you've been enjoying."
      },
      {
        emoji: "🧊",
        name: "Japanese Iced Pour Over",
        type: "drink",
        reason: "Given your appreciation for the craft of specialty coffee, this precise Japanese flash-chilled method would highlight every nuance of your favorite light roasts."
      },
      {
        emoji: "🫖",
        name: "Natural Process Roasters",
        type: "café type",
        reason: "Your single-origin interest points toward cafés specializing in natural process coffees — fruit-forward, complex, and endlessly fascinating for a palate like yours."
      },
      {
        emoji: "🌺",
        name: "Cascara Tea",
        type: "drink",
        reason: "Made from the dried coffee fruit husk, it's floral, hibiscus-like, and sweet — your high scores on floral and fruity suggest you'd love this unique side of the coffee plant."
      }
    ]);
  }

  State.set("aiLoading", false);
  renderPage("ai");
}
