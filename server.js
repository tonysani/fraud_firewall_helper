import express from "express";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json({ limit: "1mb" }));

function buildPrompt({ description, factsText, trafficType, ruleType, routeFilter }) {
  const trafficSection = trafficType
    ? "TRAFFIC TYPE: " + trafficType.label + " (" + trafficType.population + ")" + (routeFilter ? "\nSPECIFIC ROUTE/OPERATOR: " + routeFilter : "")
    : "TRAFFIC TYPE: Not specified";

  const ruleTypeSection = ruleType
    ? "RULE TYPE: " + ruleType.label + " (" + ruleType.output + ")"
    : "RULE TYPE: Not specified";

  let ruleTypeInstructions = "";
  if (ruleType && ruleType.id === "detect_blacklist_block") {
    ruleTypeInstructions = [
      "",
      "DETECT, BLACKLIST & BLOCK pattern requires these rules:",
      "1. DETECTION RULE (PRE-VERIFICATION, state: Searching Blacklist):",
      "   - Evaluates the detection conditions (velocity, behaviour, patterns)",
      "   - Action: Anumber Blacklist",
      "   - Should include population_conditions (traffic filter) AND detection_conditions (fraud logic)",
      "   - arguments should include: { comments: 'summary of detection', category: 'FraudType', review: true }",
      "",
      "2. BLOCKING RULE (POST-VERIFICATION, state: Active):",
      "   - Checks if caller is already blacklisted by the detection rule",
      "   - population_conditions: CALLING_PARTY_BLACKLISTED = true AND CALLING_PARTY_BLACKLIST_SOURCE = RVS AND CALLING_PARTY_BLACKLIST_CATEGORY = [category from rule 1]",
      "   - Action: Release",
      "",
      "3. OPTIONAL REMOVAL RULE (PRE-VERIFICATION, state: Searching Blacklist):",
      "   - Auto-removes false positives (e.g. redial behaviour, low B-ratio)",
      "   - population_conditions: CALLING_PARTY_BLACKLIST_SOURCE = RVS AND CALLING_PARTY_BLACKLIST_REVIEW = true",
      "   - detection_conditions: criteria suggesting legitimate user (e.g. BLACKLISTED_REDIAL_2 = 1 or CALLING_PARTY_BLACKLIST_RATIO < 0.85)",
      "   - Action: Remove Blacklist",
    ].join("\n");
  } else if (ruleType && ruleType.id === "detect_block") {
    ruleTypeInstructions = [
      "",
      "DETECT & BLOCK pattern requires:",
      "1. SINGLE RULE (POST-VERIFICATION, state: Active):",
      "   - Combines population filter and detection conditions",
      "   - Action: Release",
      "   - Should include population_conditions (traffic filter) AND detection_conditions (fraud logic)",
    ].join("\n");
  }

  return [
    "You are a telecom fraud detection expert designing real-time firewall rules for the Six Degrees RVS platform.",
    "",
    "The analyst has provided:",
    trafficSection,
    ruleTypeSection,
    'FRAUD DESCRIPTION: "' + description + '"',
    ruleTypeInstructions,
    "",
    "AVAILABLE FACTS (parameters/KPIs for rule conditions):",
    factsText,
    "",
    "IMPORTANT RULES FOR CONDITION GENERATION:",
    "- Use ONLY facts from the list above. Do not invent facts that don't exist.",
    "- population_conditions define WHICH traffic the rule applies to (route, operator, direction, country, number type)",
    "- detection_conditions define WHAT behaviour triggers the rule (velocity, ratios, duration, counts)",
    "- Conditions use AND logic. Format: FACT_NAME operator value AND FACT_NAME operator value",
    "- Valid operators: =, !=, >, >=, <, <=, =~ (regex match), !~ (regex not match)",
    "- String values should not be quoted in the condition text",
    "- For Georgian numbers use: CALLING_PARTY_NUMBER =~ ^995[0-9]*$",
    "- For non-Georgian: CALLING_PARTY_NUMBER !~ ^995[0-9]*$",
    "- Valid actions: Anumber Blacklist, Release, Continue, Send Blockchain, Remove Blacklist",
    "- Valid stages: PRE or POST",
    "- Valid states: New, Initialised, Lookup Blacklist, Searching Blacklist, Calling Srism, Active",
    "",
    "Respond ONLY with valid JSON (no markdown, no backticks, no explanation outside the JSON):",
    "{",
    '  "analysis": "Brief explanation of the fraud pattern and detection strategy (2-3 sentences)",',
    '  "fraud_type": "Name of the fraud type (e.g. Simboxing, FlashCalls, Wangiri, IRSF, CLI Spoofing)",',
    '  "risk_level": "HIGH" | "MEDIUM" | "LOW",',
    '  "rules": [',
    "    {",
    '      "name": "Rule name",',
    '      "description": "What the rule does and why",',
    '      "stage": "PRE" | "POST",',
    '      "state": "Searching Blacklist" | "Active" | etc,',
    '      "action": "Anumber Blacklist" | "Release" | "Remove Blacklist" | "Continue",',
    '      "population_conditions": "FACT = value AND FACT = value (traffic filter)",',
    '      "detection_conditions": "FACT > value AND FACT < value (fraud detection logic)",',
    '      "notes": "Tuning advice, thresholds to adjust, deployment notes"',
    "    }",
    "  ],",
    '  "recommended_facts": [',
    '    { "name": "FACT_NAME", "relevance": "Why this fact is used", "priority": "PRIMARY" | "SECONDARY" }',
    "  ],",
    '  "considerations": ["Deployment notes, false positive risks, tuning advice"],',
    '  "related_fraud_types": ["Related fraud types to also watch for"]',
    "}",
  ].join("\n");
}

// ── API: Analyze fraud description -> rule recommendations ──
app.post("/api/analyze", async (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY not configured" });
  }

  const { description, factsText, trafficType, ruleType, routeFilter } = req.body;
  if (!description) {
    return res.status(400).json({ error: "Missing description" });
  }

  const prompt = buildPrompt({ description, factsText, trafficType, ruleType, routeFilter });

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Anthropic API error:", response.status, err);
      return res.status(response.status).json({
        error: "Anthropic API error " + response.status,
        detail: err,
      });
    }

    const data = await response.json();
    const text = (data.content || []).map(function (b) { return b.text || ""; }).join("");
    const clean = text
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .trim();

    try {
      const parsed = JSON.parse(clean);
      return res.json(parsed);
    } catch (parseErr) {
      console.error("JSON parse error:", parseErr.message);
      console.error("Raw output:", clean.substring(0, 500));
      return res.status(500).json({
        error: "Failed to parse AI response",
        raw: clean.substring(0, 500),
      });
    }
  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// ── Health check ──
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    hasApiKey: !!process.env.ANTHROPIC_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

// ── Serve static files (Vite build output) ──
app.use(express.static(path.join(__dirname, "dist")));

// SPA fallback
app.use(function (req, res) {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(PORT, function () {
  console.log("Fraud Firewall Helper running on port " + PORT);
  console.log("  API key configured: " + !!process.env.ANTHROPIC_API_KEY);
});
