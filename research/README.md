# Research corpus

Reference material behind the platform's product and architecture decisions, produced by
a multi-agent research pass (recon → gap analysis → adversarial verification →
competing blueprints → synthesis).

## Reading order

Start with `00-MASTER-STRATEGY.md`. Everything else is supporting detail.

| File | Contents |
|---|---|
| `00-MASTER-STRATEGY.md` | Synthesized strategy: parity checklist, differentiation stack, architecture, pricing, roadmap, risk register |
| `00-critique.md` | Completeness critic — what the research missed, asserted without evidence, or may have gotten wrong |
| `01-vista-social-full-audit.md` | Forensic feature and pricing audit of the primary benchmark |
| `02-vista-social-deep-modules.md` | Implementation mechanics: publishing pipeline, permissions, inbox data model, listening internals |
| `03-competitors-enterprise.md` | Sprout, Hootsuite, Sprinklr, Emplifi, Brandwatch, Khoros, Meltwater, Dash |
| `04-competitors-smb.md` | Buffer, Later, Publer, Metricool, Agorapulse, Sendible, Cloud Campaign and peers |
| `05-competitors-dev-oss.md` | API-first and open-source layer; the real cost and timeline of production API access |
| `06-platform-apis-tier1.md` | Engineering spec: Meta, X, LinkedIn, TikTok, YouTube, Pinterest |
| `07-platform-apis-tier2.md` | Long-tail networks, review sites, messaging channels |
| `08-platform-apis-regional.md` | Regionally dominant networks worldwide + localization, payments, tax |
| `09-ai-frontier.md` | Generative media, agentic patterns, AI-search visibility, model economics |
| `10-commerce-creator-influencer.md` | Social commerce, influencer/UGC, employee advocacy, paid amplification |
| `11-compliance-security-global.md` | Privacy law, certifications, token vault design, platform policy limits |
| `12-analytics-listening-gtm.md` | Listening data sources, attribution, market sizing, pricing and distribution |
| `blueprint-a/b/c.md` | Three competing architecture proposals, synthesized in the master doc |

## Caveats

Research reflects the state of the market and platform APIs at the time it was gathered.
Platform APIs in this category change frequently and often without much notice —
treat capability and rate-limit claims as needing re-verification before they become
load-bearing in an implementation. Where a fact could not be confirmed, the dossiers
mark it `UNVERIFIED`; that marking should be respected rather than smoothed over.
