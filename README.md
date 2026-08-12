# SMM — Global AI Social Media Management Platform

An AI-native platform for creating, scheduling, publishing, and managing social media
presence across every network that matters — worldwide.

The goal is full functional parity with [Vista Social](https://vistasocial.com), then a
decisive step beyond it: genuinely global network coverage (including the regional
platforms Western tools ignore), an agentic AI layer that owns outcomes rather than
tasks, and measurement that closes the loop from post to revenue.

## Status

**Pre-implementation.** The repository currently holds foundations and an in-progress
research corpus. No product code has been written yet — architecture decisions are
deliberately being made *after* the research lands, not before.

| Phase | State |
|---|---|
| Market + technical research | In progress |
| Scope & architecture sign-off | Pending |
| Platform foundations | Not started |
| Product modules | Not started |

## Repository layout

```
research/    Market, competitive, platform-API, compliance and GTM research.
             Written by a multi-agent research pass; the master synthesis is
             00-MASTER-STRATEGY.md.
```

Further directories are added once the architecture is agreed.

## Why the research comes first

Two constraints dominate this product and both are external:

1. **Platform API access is the real bottleneck.** Meta Tech Provider status, X API
   pricing tiers, the TikTok Content Posting API, and the LinkedIn Marketing Developer
   Platform all gate production access behind review processes measured in weeks to
   months — and several prohibit capabilities users assume exist. Some networks cannot
   be auto-published to at all, which forces a reminder-based fallback path that has to
   be designed in, not bolted on.

2. **Platform terms constrain the data model.** Several networks cap how long their data
   may be cached, which directly shapes what the analytics architecture can store and
   for how long.

Designing around these from day one is cheaper than discovering them after building.

## Contributing

Development happens on feature branches. See `research/` for the strategy and
architecture rationale behind any given module.
