# 🛡 Fraud Firewall Helper

**Real-time telecom fraud detection rule designer and intelligence platform.**

Built by [Orillion Solutions](https://orillion.co.uk) for fraud intelligence teams managing real-time voice fraud firewalls.

---

## Features

| Section | Status | Description |
|---------|--------|-------------|
| **Scan Transactions** | 🟡 Coming Soon | AI-powered anomaly detection across live CDR/signalling data |
| **Current Rules** | ✅ Live | Review, search, and understand existing firewall rules with visual condition breakdowns |
| **FACT Explorer** | ✅ Live | Search 120+ fraud detection parameters with natural language synonyms |
| **AI Rule Designer** | ✅ Live | Describe fraud in plain English → get recommended FACTS and rule designs |

## Tech Stack

- **Frontend:** React 18 + Vite
- **Styling:** CSS Variables (dark theme, no framework dependency)
- **AI:** Anthropic Claude API (Sonnet) for rule design
- **Hosting:** Railway
- **Database:** Railway PostgreSQL *(future — for rules storage & transaction scanning)*

---

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Local Development

```bash
# Clone
git clone https://github.com/tonysani/fraud_firewall_helper.git
cd fraud_firewall_helper

# Install
npm install

# Run dev server
npm run dev
```

Opens at `http://localhost:3000`

### Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_ANTHROPIC_API_KEY` | For AI Designer | Anthropic API key |
| `DATABASE_URL` | Future | Railway PostgreSQL connection string |

---

## Deploy to Railway

### Option 1: GitHub Integration (Recommended)

1. Push code to `https://github.com/tonysani/fraud_firewall_helper`
2. In Railway dashboard → **New Project** → **Deploy from GitHub Repo**
3. Select the repo
4. Railway auto-detects Vite and deploys
5. Add environment variables in Railway dashboard

### Option 2: Railway CLI

```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

### Build Configuration

Railway uses the `railway.json` config:
- **Build:** `npm install && npm run build`
- **Start:** `npx serve dist -s -l $PORT`

---

## Project Structure

```
fraud-firewall-helper/
├── public/
│   └── shield.svg          # Favicon
├── src/
│   ├── components/
│   │   ├── ConditionChip.jsx   # Visual condition display
│   │   └── Sidebar.jsx         # Navigation sidebar
│   ├── data/
│   │   ├── facts.js            # FACTS database (120+ parameters)
│   │   └── rules.js            # Sample firewall rules
│   ├── pages/
│   │   ├── ScanTransactions.jsx  # Future: AI anomaly detection
│   │   ├── CurrentRules.jsx      # Rule review & visual breakdown
│   │   ├── FactExplorer.jsx      # Searchable FACT catalogue
│   │   └── AIDesigner.jsx        # NL → rule design with Claude
│   ├── styles/
│   │   └── global.css          # CSS variables & base styles
│   ├── utils/
│   │   └── helpers.js          # Colors, operators, search, parsing
│   ├── App.jsx                 # Root component
│   └── main.jsx                # Entry point
├── index.html
├── package.json
├── vite.config.js
├── railway.json                # Railway deployment config
└── .env.example
```

---

## FACTS Database

The platform includes 120+ real-time fraud detection parameters organised into categories:

| Category | Examples | Use Case |
|----------|----------|----------|
| **Velocity** | ANUM_CALLS_24H, B_RATIO_24H, NUM_CLUSTERS_24H | Call volume & pattern detection |
| **Lists** | CALLING_PARTY_BLACKLISTED, WHITELIST_SOURCE | Known number management |
| **CDR** | CDR_IMEIS_3D, CDR_HOT_CELL_PCT_1D | Historical behaviour analysis |
| **Signalling** | ATI_RESULT, SRISM_RESULT | Network verification |
| **IPRN** | BNUM_IPRN_MATCH, CALLS_TO_IPRN_24H | Premium rate fraud detection |
| **Identity** | CALLING_PARTY_COUNTRY_CODE, CALLED_PARTY_COUNTRY | Geographic analysis |

### Natural Language Search

The FACT Explorer supports synonym-based search:
- **"wangiri"** → velocity facts, B-ratio, clusters
- **"sim box"** → IMEI counts, hot cells, CGI diversity
- **"CLI spoof"** → HOME_EQ_TRANSIT, ATI results, numbering plan
- **"burst"** → sub-second velocity (1s, 2s, 5s), duplicates

---

## Roadmap

- [ ] Railway PostgreSQL for persistent rule storage
- [ ] Transaction scanning with CDR import
- [ ] AI anomaly detection scoring engine
- [ ] Rule performance analytics (hit rates, false positives)
- [ ] Multi-operator support (Silknet, MTN, Ethio Telecom)
- [ ] Export rules to firewall API format
- [ ] User authentication & role-based access

---

## License

Proprietary — Orillion Solutions / Fraud Intelligence Limited
