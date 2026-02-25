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
  lines.push("\"" + description + "\"");
  lines.push("");
  lines.push("Respond ONLY with valid JSON (no markdown, no backticks, no explanation outside the JSON). Use this structure: { analysis (string), fraud_type (string), risk_level (HIGH or MEDIUM or LOW), recommended_facts (array of objects with name, relevance, priority), rule_options (array of objects with name, description, action, aggressiveness, conditions_text, notes), considerations (array of strings), related_fraud_types (array of strings) }");
  return lines.join("\n");
}

app.post("/api/analyze", async function(req, res) {
  var apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "ANTHROPIC_API_KEY not configured" });
  var description = req.body.description;
  var factsText = req.body.factsText;
  if (!description) return res.status(400).json({ error: "Missing description" });
  try {
    var prompt = buildPrompt(description, factsText || "");
    var response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 4000, messages: [{ role: "user", content: prompt }] }),
    });
    if (!response.ok) {
      var errText = await response.text();
      return res.status(response.status).json({ error: "Anthropic API error: " + response.status, detail: errText });
    }
    var data = await response.json();
    var text = (data.content || []).map(function(b) { return b.text || ""; }).join("");
    var clean = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    var parsed = JSON.parse(clean);
    return res.json(parsed);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.get("/api/health", function(req, res) {
  res.json({ status: "ok", hasApiKey: !!process.env.ANTHROPIC_API_KEY });
});

app.use(express.static(path.join(__dirname, "dist")));

app.get("*", function(req, res) {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(PORT, function() {
  console.log("Fraud Firewall Helper running on port " + PORT);
});
