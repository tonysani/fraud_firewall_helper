import express from "express";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

app.use(express.json({ limit: "1mb" }));

app.post("/api/analyze", async (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "ANTHROPIC_API_KEY not configured" });

  const { description, factsText } = req.body;
  if (!description) return res.status(400).json({ error: "Missing description" });

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
        messages: [{
          role: "user",
          content: You are a telecom fraud detection expert helping design real-time firewall rules.\n\nAvailable FACTS (parameters/KPIs that can be used in rule conditions):\n + factsText + \n\nThe fraud analyst describes what they want to detect:\n" + description + "\n\nRespond ONLY with valid JSON (no markdown, no backticks, no explanation outside the JSON). Structure:\n{\n  "analysis": "Brief explanation of the fraud pattern (2-3 sentences)",\n  "fraud_type": "Name of the fraud type",\n  "risk_level": "HIGH" | "MEDIUM" | "LOW",\n  "recommended_facts": [{"name": "FACT_NAME", "relevance": "Why this fact is relevant", "priority": "PRIMARY|SECONDARY|SUPPORTING"}],\n  "rule_options": [{"name": "Rule name", "description": "What the rule does", "action": "Anumber Blacklist|Release|Continue|Send Blockchain|Monitor", "aggressiveness": "Conservative|Moderate|Aggressive", "conditions_text": "FACT1 > value AND FACT2 = value", "notes": "Tuning advice and deployment notes"}],\n  "considerations": ["Deployment notes and warnings"],\n  "related_fraud_types": ["Related fraud types to watch for"]\n}
        }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(response.status).json({ error: "Anthropic API error: " + response.status, detail: err });
    }

    const data = await response.json();
    const text = (data.content || []).map(b => b.text || "").join("");
    const clean = text.replace(/`json\s*/g, "").replace(/`\s*/g, "").trim();
    const parsed = JSON.parse(clean);
    return res.json(parsed);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", hasApiKey: !!process.env.ANTHROPIC_API_KEY });
});

app.use(express.static(path.join(__dirname, "dist")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(PORT, () => {
  console.log("Fraud Firewall Helper running on port " + PORT);
});
