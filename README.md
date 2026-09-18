# meps

What Americans actually take, and what for — US prescription drug use by medical
condition, from AHRQ's Medical Expenditure Panel Survey.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1573+ live data sources.

MEPS surveys the whole US civilian non-institutionalized population: every payer,
every age, commercially insured and uninsured alike. It is the only source in
this catalog that links a prescription to the **condition it was written for**,
which is what makes "what do people take for depression" answerable at all.

## Tools

| Tool | Answers |
|---|---|
| `meps_drugs_for_condition` | Which drugs Americans take for a condition, ranked by people treated |
| `meps_conditions_for_drug` | What a drug is actually prescribed for — the off-label question |
| `meps_drug_use` | One drug's national volume, total spend and out-of-pocket share |
| `meps_top_drugs` | The most-used prescription drugs in the US for a year |

Conditions are taken in plain words — `"depression"`, `"high cholesterol"`,
`"type 2 diabetes"` — or as a CCSR code such as `MBD002`. Drug names are MEPS's
cleaned **generic** names, so `atorvastatin`, not `Lipitor`.

## These are survey estimates, and the sample is always in the response

Every respondent carries a weight projecting them onto roughly 18,000 Americans.
A cell backed by three people therefore produces a confident-looking
"55,000 people" that means almost nothing. So:

- every row carries **`sample_persons`** — the real respondents behind it;
- `reliable: false` marks anything under **60** respondents, which is AHRQ's own
  publication floor;
- rows default to a minimum of **60** respondents — the same floor — so the
  default answer contains nothing AHRQ would decline to publish. Lower it with
  `min_sample` to see less-common drugs; those come back `reliable: false`.

Treat the numbers as *rough magnitude and ranking*, not as counts. Ranking the
top few drugs for a common condition is what this data is good for. Precise
totals, small subgroups and year-over-year differences of a few percent are not.

## Two things that would otherwise mislead

**Fewer than half of prescriptions carry a condition.** 47.5% of fills in 2024
are linked to any diagnosis; the rest are not attributed to one. So a condition
total is a subset of prescribing, not a census of it, and an empty result can
mean "not captured" rather than "not prescribed". Every response states the
year's actual coverage rather than implying completeness.

**One fill can be linked to several conditions.** That is correct for "is this
drug used for this condition" and wrong for money: the condition tables carry no
expenditure at all, because summing spend across conditions would invent
national spending that was never spent. Money lives only in `meps_drug_use` and
`meps_top_drugs`, where each fill is counted once.

**Some "drugs" are therapeutic classes.** MEPS substitutes a class name for the
product where naming it would identify a respondent — `INTERLEUKIN INHIBITORS`,
`ANTINEOPLASTICS`, `ANTIDIABETIC AGENTS`. In 2024 that is 49 of 554 names, but
those 49 carry **31.9% of all recorded spending**, so a ranking by cost is
dominated by classes rather than products. `meps_drug_use` and `meps_top_drugs`
say so in every response. A plural or category-sounding name is a class.

## Data sources

- MEPS public use files, three per year, from
  <https://meps.ahrq.gov/data_files/pufs/> — Prescribed Medicines, the Appendix
  to Event Files (the condition link), and Medical Conditions. Free, no
  credential. The file numbers per year come from AHRQ's own index at
  <https://meps.ahrq.gov/data_files/search_pufs.json>; they are not derivable
  (2024 is HC-254A / HC-254I / HC-255), so they are looked up, never guessed.
- Condition category labels from the HCUP CCSR reference file,
  <https://hcup-us.ahrq.gov/toolssoftware/ccsr/dxccsr.jsp>.

Years 2019 onward. Earlier files code conditions with CCS rather than CCSR and
are not comparable.

`.github/workflows/meps-refresh.yml` checks AHRQ's index on the 3rd of each month
and loads any year that has all three files and is not already held. AHRQ
publishes a year roughly annually without pre-announcing it, so the check does
nothing 11 months out of 12 — that is cheaper than noticing a release late.

**MEPStrends is not the source.** AHRQ's own pre-computed estimates at
`meps.ahrq.gov/mepstrends/` sit behind HTTP Basic auth (`WWW-Authenticate: Basic
realm="Secured Data Tools"`), so the estimates here are computed from the public
files rather than read from theirs.

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "meps": {
      "url": "https://gateway.pipeworx.io/meps/mcp"
    }
  }
}
```

### What this endpoint actually serves

`tools/list` at `https://gateway.pipeworx.io/meps/mcp` returns the tools in the table
above **plus the shared Pipeworx meta-tools** — `ask_pipeworx`,
`discover_tools`, `search_within`, `remember`/`recall` and the rest of the
gateway-wide set. So the tool count you see is larger than this table: a
single-pack endpoint currently lists roughly 30 shared tools alongside the
pack's own. The connection's `initialize` response states its exact scope, and
is the authoritative answer for a given day.

This is deliberate, not multiplexing by accident. The meta-tools are what let a
scoped connection answer a question this pack does not cover — via
`ask_pipeworx`, which routes across the whole catalog — without you adding a
second MCP server. There is currently no way to mount a pack endpoint without
them; if the extra schemas cost you more context than the routing is worth,
connect to the full gateway once rather than to several pack endpoints.

Or connect to the full Pipeworx gateway to get every pack's tools listed
directly, instead of just this one's:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

Both URLs reach the same gateway and the same 1573+ data sources. The
only difference is which pack's tools are listed **directly**; `ask_pipeworx`
reaches all of them from either one.

## No MCP client? Call it over HTTP

```bash
curl -X POST https://gateway.pipeworx.io/v1/tools/meps_drugs_for_condition \
  -H 'Content-Type: application/json' \
  -d '{"condition":"depression"}'
```

No account needed for the first calls. Inspect any tool: `GET https://gateway.pipeworx.io/v1/tools/meps_drugs_for_condition`. Find one: `POST https://gateway.pipeworx.io/v1/tools/search_packs` with `{"query":"..."}`.

## Standalone (no gateway account)

This package also runs as a local stdio MCP server — no Pipeworx account, no
gateway round-trip:

```json
{
  "mcpServers": {
    "meps": {
      "command": "npx",
      "args": ["-y", "@pipeworx/mcp-meps"]
    }
  }
}
```

Or run it directly to confirm it starts:

```bash
npx -y @pipeworx/mcp-meps
```

It speaks MCP over stdin/stdout and answers `initialize`/`tools/list`/`tools/call`
for **only** this pack's tools — none of the shared meta-tools the gateway
connection above adds. Same source, same tools, no ask_pipeworx routing.

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English —
this works on the pack endpoint above as well as on the full gateway:

```
ask_pipeworx({ question: "your question about Meps data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
