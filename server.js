import express from "express";
import { fileURLToPath } from "url";
import path from "path";

var __dirname = path.dirname(fileURLToPath(import.meta.url));
var app = express();
var PORT = process.env.PORT || 3001;

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

app.use(express.json({ limit: "1mb" }));

function buildPrompt(description, factsText) {
  var lines = [];
  lines.push("You are a telecom fraud detection expert helping design real-time firewall rules.");
  lines.push("");
  lines.push("Available FACTS (parameters/KPIs that can be used in rule conditions):");
  lines.push(factsText);
  lines.push("");
  lines.push("The fraud analyst describes what they want to detect:");
  lines.push('"' + description + '"');
  lines.push("");
  lines.push("Respond ONLY with valid JSON (no markdown, no backticks, no explanation outside the JSON). Use this exact structure:");
  lines.push('{');
  lines.push('  "analysis": "Brief explanation of the fraud pattern in 2-3 sentences",');
  lines.push('  "fraud_type": "Name of the fraud type",');
  lines.push('  "risk_level": "HIGH or MEDIUM or LOW",');
  lines.push('  "recommended_facts": [{"name": "FACT_NAME", "relevance": "Why relevant", "priority": "PRIMARY or SECONDARY or SUPPORTING"}],');
  lines.push('  "rule_options": [{"name": "Rule name", "description": "What it does", "action": "Anumber Blacklist or Release or Continue or Send Blockchain or Monitor", "aggressiveness": "Conservative or Moderate or Aggressive", "conditions_text": "FACT1 > value AND FACT2 = value", "notes": "Tuning advice"}],');
  lines.push('  "considerations": ["Deployment notes"],');
  lines.push('  "related_fraud_types": ["Related types"]');
  lines.push('}');
  return lines.join("\n");
}

app.post("/api/analyze", async function(req, res) {
  var apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "ANTHROPIC_API_KEY not configured. Add it in Railway Variables." });
  var description = req.body.description;
  var factsText = req.body.factsText;
  if (!description) return res.status(400).json({ error: "Missing description" });
  try {
    var prompt = buildPrompt(description, factsText || "");
    console.log("Calling Anthropic API...");
    var response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 4000, messages: [{ role: "user", content: prompt }] }),
    });
    if (!response.ok) {
      var errText = await response.text();
      console.log("Anthropic error: " + response.status + " " + errText);
      return res.status(response.status).json({ error: "Anthropic API error " + response.status, detail: errText });
    }
    var data = await response.json();
    console.log("Anthropic response blocks: " + data.content.length);
    var text = (data.content || []).map(function(b) { return b.text || ""; }).join("");
    if (!text || text.length < 10) {
      console.log("Empty or too short response: " + text);
      return res.status(500).json({ error: "AI returned empty response", raw: text });
    }
    var clean = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    console.log("Cleaned response length: " + clean.length);
    try {
      var parsed = JSON.parse(clean);
      console.log("Successfully parsed JSON");
      return res.json(parsed);
    } catch (parseErr) {
      console.log("JSON parse failed: " + parseErr.message);
      console.log("First 300 chars: " + clean.substring(0, 300));
      return res.status(500).json({ error: "Failed to parse AI response: " + parseErr.message, raw: clean.substring(0, 500) });
    }
  } catch (err) {
    console.log("Server error: " + err.message);
    return res.status(500).json({ error: err.message });
  }
});

app.get("/api/health", function(req, res) {
  res.json({ status: "ok", hasApiKey: !!process.env.ANTHROPIC_API_KEY });
});

app.use(express.static(path.join(__dirname, "dist")));

app.use(function(req, res) {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(PORT, function() {
  console.log("Fraud Firewall Helper running on port " + PORT);
  console.log("API key configured: " + !!process.env.ANTHROPIC_API_KEY);
});