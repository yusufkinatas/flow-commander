# Repeatable Level-Design Process

This playbook turns the process used for *The Exacting Muster* into a reusable method for building a puzzle campaign. It is designed for deterministic route, inventory, and state-order puzzles, but the roles and gates apply to most authored puzzle games.

The central rule is simple:

> Automation proves that a level works under the production rules. A separate reviewer decides whether the level is worth playing.

Neither half replaces the other. A solvable level can still be obscure, repetitive, decorative, or tedious; an elegant-looking level can still be impossible or depend on behavior that Planning and Execution simulate differently. Multiple winning routes are allowed: open fields, symmetric traversal orders, and equivalent geometric variations are not defects.

The Pack 5 artifacts are useful worked examples:

- [Research and applied principles](docs/PUZZLE_CAMPAIGN_RESEARCH.md)
- [Mechanic candidate roster](docs/PACK5_MECHANIC_ROSTER.md)
- [Frozen campaign specification](docs/PACK5_CAMPAIGN_SPEC.md)
- [Designer/reviewer record](docs/PACK5_REVIEW_RECORD.md)
- [Automated level report](docs/PACK5_LEVEL_REPORT.md)
- [Campaign validator](tests/validate-pack5.mjs)

Pack 6 is the worked example for a three-mechanic campaign with parallel designers and independent sub-agent review:

- [Applied campaign research](docs/PACK6_CAMPAIGN_RESEARCH.md)
- [Three-mechanic candidate roster](docs/PACK6_MECHANIC_ROSTER.md)
- [Frozen campaign specification and ownership ledger](docs/PACK6_CAMPAIGN_SPEC.md)
- [Designer/reviewer and revision record](docs/PACK6_REVIEW_RECORD.md)
- [Automated campaign report](docs/PACK6_LEVEL_REPORT.md)
- [Mechanic contract validator](tests/validate-pack6-mechanics.mjs) and [campaign validator](tests/validate-pack6.mjs)

## Non-negotiable outcomes

Before production begins, agree on these outcomes:

1. Set the campaign's new-mechanic count explicitly: zero, one, or several. Do not let new rules appear accidentally during map authoring.
2. Give every level one sentence of purpose, one primary learning claim, and one campaign role.
3. Freeze the campaign roster, mechanic matrix, cadence, and exact complexity distribution before authoring maps.
4. Require every accepted level to parse, solve, and replay through production rules.
5. Prove that every level has at least one valid winning route. Stop after the first deterministic witness; do not enumerate or score the number of alternatives.
6. When a designer declares a reference route, require it to win independently. It is an example and may differ from the solver's first witness.
7. Prove rule behavior and required events with production code; have the reviewer judge whether featured mechanics are meaningfully used.
8. Keep the Level Designer and Game Design Reviewer separate. Reviewers judge and record; they do not silently fix the map.
9. Resubmit every changed level until its reviewer explicitly approves it.
10. Treat first-witness solver metrics as diagnostic evidence, not as a route-count requirement or a single score for human difficulty.
11. Preserve rejected candidates, revisions, exemptions, and known calibration risks in written records.

This project does not use a numerical solution contract. One, ten, or hundreds of winning routes are equally acceptable. Validation exists to prevent impossible levels, not to collapse maps into corridors. A reviewer may still reject a confusing or trivial layout, but the mere existence of another winning route is never a failure.

### Campaign parameters

Write these at the top of the frozen specification so this playbook adapts to the project instead of silently inheriting Pack 5's brief:

| Parameter | Example choices |
|---|---|
| Level count and arc shape | `10`, `25`, or another explicit structure |
| New-mechanic count | `0`, `1`, or a named ordered set |
| Solvability contract | at least one winning route; alternatives unrestricted and uncounted |
| Human-playtest policy | required, optional, or prohibited for this run |
| Complexity budget | exact count at every rating |
| Solver budget | node/time limits and required evidence |

With zero new mechanics, skip candidate selection and mechanic implementation, but still audit and sequence the existing grammar. With one, run Phases 1–2 once. With several, write a separate rule contract, implementation gate, and introduction order for each; do not introduce them as one undifferentiated feature bundle.

## Roles and separation of responsibility

### Lead Designer / Campaign Curator

The Lead owns the whole learning journey rather than any single map.

- Defines the game promise, campaign scope, technical constraints, and acceptance gates.
- Runs mechanic selection and keeps the rejection record.
- Freezes the campaign roster, curve, roles, complexity budget, and mechanic matrix.
- Assigns non-overlapping level ranges when several designers work in parallel.
- Resolves cross-level duplication and campaign-order problems.
- Confirms that every reviewer is independent from the designer of the level being reviewed.
- Integrates approved levels, runs the campaign-wide audit, and records residual risks.

The Lead may author a level, but must not be that level's final reviewer.

### Level Designer

The Level Designer owns a level's design claim and implementation.

- Authors the smallest map that expresses the assigned learning purpose.
- Declares an optional reference winning route before review, or records the solver witness.
- Supplies metadata, briefing, hint, thesis, mechanics, dependency depth, and cognitive-load estimate.
- Runs parser, first-witness solver, replay, event, and immutability checks before requesting review.
- Explains why each branch and interactive tile exists.
- Revises the level in response to actionable feedback and resubmits it.

Designers do not approve their own work.

### Game Design Reviewer

The Reviewer owns the quality judgment, not the implementation.

- Reads the frozen campaign slot before judging the map.
- Inspects the solver witness and any declared reference route.
- Evaluates teaching clarity, fairness, novelty, elegance, pacing, copy, and curve placement.
- Checks that the mechanic's idea—not merely its tile—supports the level's thesis.
- Returns exactly `APPROVED` or `CHANGES REQUIRED`, with a concrete reason.
- Treats optional ablation only as diagnostic context, never as a route-count gate.
- Makes no file edits to the level under review.

The same reviewer may review several levels, but should actively compare them for repeated masks, decision structures, and lessons.

### Solver and validation suite

Automation is an evidence-producing part of the process, not a creative role. It must call the same parser, state reducer, trace, and simulation code used by the shipped game. A second, test-only interpretation of the rules can agree with itself while disagreeing with the product.

### Fresh-player playtesters

Fresh-player testing happens after deterministic acceptance, unless a project constraint explicitly forbids it. Playtesters calibrate comprehension, delight, perceived difficulty, and hint quality. They do not replace deterministic solvability and replay checks.

## Required artifacts

Use project-specific names, but keep these responsibilities separate:

| Artifact | Created | Source of truth for |
|---|---|---|
| `CAMPAIGN_RESEARCH.md` | Before mechanic selection | External findings translated into project rules |
| `MECHANIC_ROSTER.md` | Before implementation, when adding mechanics | Candidate comparison, finalists, selections, rejection reasons, exact rules |
| `CAMPAIGN_SPEC.md` | Before map authoring | Level count, roles, curve, complexity budget, mechanic matrix, per-level purposes |
| Level source files | During authoring | Maps, optional reference routes, and metadata |
| `REVIEW_RECORD.md` | Throughout authoring | Initial decisions, requested changes, responses, final approvals |
| `LEVEL_REPORT.md` | At integration | Per-level solver evidence, aggregate figures, outliers, limitations |
| Automated validators | Before and during authoring | Executable acceptance contract |

Do not use a single mutable spreadsheet as the only record of both intentions and results. The frozen specification says what the campaign is supposed to be; the report says what was actually measured.

## Phase 0 — Audit the existing game and research the design space

Before inventing mechanics, establish the game's actual design grammar.

### Audit checklist

- What is the one-sentence player promise?
- What actions, topology, state, resources, and failure modes already exist?
- Which information is visible in Planning, and what happens in Execution?
- Which reducer and solver define production truth?
- Which mechanics were recently taught and should not be blurred by overlap?
- Which route contracts must remain intact: adjacency, no revisits, deterministic order, or another movement invariant?
- Which UI, input, accessibility, audio, and level-editor surfaces must support a new rule?
- Which symbols and subsystems are out of scope for this campaign?
- What node limits and test times are acceptable for exhaustive validation?

### Research rule

Research is useful only when it changes a project decision. For every important finding, write an applied rule and a way to inspect it.

| Finding | Applied project rule | Evidence |
|---|---|---|
| Teach an idea before testing combinations | Early levels isolate the new rule | Mechanic matrix and reviewer inspection |
| Difficulty needs recovery | Start each arc below the previous peak | Frozen curve plus campaign assertion |
| Solver effort is not human difficulty | Store authored load separately | Report both metrics and flag disagreement |

**Exit gate:** the Lead can explain the existing design grammar, production rule path, new-campaign boundaries, and research-derived curation rules without referring to an unwritten assumption.

## Phase 1 — Select new mechanics from a real candidate roster (conditional)

If the campaign adds no mechanics, record that decision and skip to Phase 3. Otherwise, generate a deliberately broad roster of mechanically distinct candidates. Twelve is a strong minimum for a one-mechanic brief; sixteen worked well for Pack 5 because it forced comparison beyond the first attractive idea. For a multi-mechanic brief, judge the selected rules both individually and as a set, including their teaching order and interaction cost.

Score each candidate from 1–5 on:

- **Fit:** Does it create decisions inside the existing core action and topology?
- **Novelty:** Does it ask a new question rather than rename an existing dependency?
- **Clarity:** Can the player predict it from the board, state display, preview, and one short rule?
- **Engineering:** Can production planning, execution, solver, editor, and accessibility support it without a risky new subsystem? A high score means lower integration risk.

Scores are a comparison aid, not an automatic vote. Apply hard vetoes when a candidate:

- breaks planning/execution fidelity;
- hides essential state or arithmetic;
- duplicates an existing mechanic under new art or nouns;
- violates route topology or input assumptions;
- is inert under existing rules;
- needs a much larger state space than the campaign can safely validate; or
- expands the game into another genre.

Select finalists, compare their design affordances and integration risks in prose, choose the required number, and record a specific rejection reason for every other candidate. A rejection log prevents superficially renamed ideas from returning later.

### Candidate roster template

```md
| Candidate | Fit | Novelty | Clarity | Engineering | Decision |
|---|---:|---:|---:|---:|---|
| [Name] | [1–5] | [1–5] | [1–5] | [1–5] | Selected / rejected because… |
```

For every selected mechanic, write:

```md
## Selected rule: [Mechanic]

Rule sentence: [One precise sentence]

- Counts / consumes / changes: […]
- Does not count / consume / change: […]
- Success behavior and event: […]
- Under-strength or invalid behavior: […]
- Over-strength or alternate invalid behavior: […]
- Planning preview: […]
- Execution presentation: […]
- Map symbols and accessible labels: […]
- Solver-state impact: […]

Design affordances:
- [New ordering consequence]
- [Interaction with familiar mechanic]
- [Second interaction]
```

**Exit gate:** every selected mechanic has an exact, previewable, deterministic rule; the candidate roster has explicit dispositions; interactions and introduction order are defined when several rules are selected; and the Lead can state why each winner adds decisions without breaking the game's core grammar.

## Phase 2 — Implement and freeze each mechanic contract (conditional)

Skip this phase when `new-mechanic count = 0`. Otherwise, build each selected mechanic as a vertical slice before depending on it in dozens of levels. For several mechanics, pass the gate independently for each one and then add focused interaction tests before map production.

### Integration surfaces

- Parser and legal tile definitions
- Production state reducer and fresh events
- Solver state and first-witness search
- Planning preview and invalid-route explanation
- Execution replay and audiovisual event mapping
- Board rendering and non-color state cues
- Rules, legend, accessible names, and status text
- Keyboard, pointer, and touch behavior where relevant
- Level Designer brushes and export normalization
- Documentation and automated tests

### Mechanic contract tests

Adapt the exact cases to the rule, but normally prove:

- every variant or threshold is registered;
- values below, at, and above a requirement behave correctly;
- counted and excluded resources are explicit;
- successful entry changes only the intended state;
- failed entry emits no success event;
- inputs and prior event history are not mutated;
- a successful transition emits one correctly shaped fresh event;
- repeated trace runs are identical;
- trace and execution simulation are deeply equal; and
- the level editor preserves every authored symbol.

Do not invent a special execution outcome. Execution should present the result already computed by the shared production reducer during planning.

**Exit gate:** the rule sentence, implementation, preview, execution, editor, accessibility text, and tests all describe the same behavior. Freeze semantics before campaign map production; later semantic changes reopen every level's proof and review.

## Phase 3 — Freeze the campaign specification before maps

Choose the campaign shape first. Otherwise the easiest maps to author will quietly define the curriculum.

### Recommended cadence

The proven 25-level shape uses five arcs of five roles:

1. **Introduce:** isolate one readable fact.
2. **Reinforce:** practice it with a small choice.
3. **Twist:** invert an assumption or expose a consequence.
4. **Combine:** couple it with one familiar system.
5. **Synthesize:** require the arc's ideas in a compact peak.

Open the next arc below the preceding synthesis peak. In a 25-level campaign, Levels 6, 11, 16, and 21 are deliberate recovery points. A breather must reduce cognitive work, not merely shorten the route.

This cadence is a strong default, not a law. If another shape better fits the game, freeze that shape just as explicitly.

### Freeze an exact complexity budget

Use a small authored scale that describes expected cognitive work rather than route length:

- **1:** direct demonstration, almost no search;
- **2:** light puzzle;
- **3:** moderate puzzle;
- **4:** difficult realization;
- **5:** major head-scratcher centered on a strong aha.

Record the exact number of levels at every rating. Pack 5 used:

| Complexity | 1 | 2 | 3 | 4 | 5 |
|---|---:|---:|---:|---:|---:|
| Count | 3 | 7 | 6 | 5 | 4 |

That yields exactly four complexity-5 peaks, five complexity-4 challenges, and sixteen levels in the 1–3 teaching/reinforcement range. It also prevents late production pressure from turning every remaining slot into a capstone. Do not change the budget informally; amend the specification and review the entire curve.

### Create the mechanic matrix

Write all level slots before drawing any maps:

```md
| ID | Role | Working title | Difficulty | Complexity | Expected learning | Required mechanics | Purpose |
|---:|---|---|---:|---:|---|---|---|
| 1 | Introduce | […] | 1.0 | 1 | […] | [new mechanic] | [one sentence] |
```

Each row must define:

- one primary learning or realization;
- one campaign role;
- a one-sentence purpose or thesis;
- required mechanics and explicitly forbidden out-of-scope systems;
- an authored difficulty position and complexity rating; and
- enough separation from neighboring rows to avoid rehashes.

Early levels should teach each new mechanic with at most one familiar dependency. When several are selected, introduce them in the frozen order before requiring their combination. Later appearances must add an interaction, force a previously optional observation, or provide intentional spaced recall. “Same decision, different wall shape” is not a new slot.

### Curve checks

- Each arc ends at its local authored-difficulty peak.
- Each later arc opens below the preceding peak.
- Maximum-load levels do not form an exhausting cluster; Pack 5 allowed no more than two consecutively.
- A concept is not tested before a readable introduction.
- High-load slots are earned by dependencies and realizations, not by corridor length.
- The finale has a focused thesis rather than every mechanic at once.

**Exit gate:** IDs, roles, learning claims, required mechanics, difficulty values, exact complexity counts, breathers, and arc peaks are frozen. No level map exists merely because someone happened to invent it first.

## Phase 4 — Make the acceptance contract executable

Write or extend validators before bulk authoring. A future change should fail loudly when it violates a frozen campaign decision.

### Per-level automated gates

1. The production parser accepts a rectangular map with legal symbols and required start/goal entities.
2. The production solver finds at least one winning route below a declared node limit and stops at that first witness.
3. The solver witness wins when replayed through the production trace.
4. Any declared reference route reconstructs a valid path and wins independently; it need not match the solver witness.
5. Repeated traces of the same route are deterministic.
6. Trace and execution simulation are event-for-event identical.
7. Analysis and replay do not mutate level data or input state.
8. A documented winning trace emits every event implied by the declared mechanic matrix.

The validator must not exhaustively enumerate alternatives, compare the witness with every possible route, or fail because it finds a second solution. If the node limit is reached before a witness is found, the result is inconclusive and the level does not pass until the search is improved or a production-rule reference route is verified directly.

### Campaign-level automated gates

- Exact level count and contiguous IDs
- Exact role cadence and arc membership
- Exact authored difficulty and complexity arrays, or equivalent assertions
- Exact complexity distribution
- Required mechanic variants represented across the campaign
- Forbidden tile families absent
- Each arc ending at a local peak
- Each new arc opening below the prior peak
- Peak-clustering limit
- All levels included in whole-game replay tests

### Mechanic evidence without route-count gates

Automation should prove that mechanic rules behave correctly and that a documented winning trace exercises the interactions claimed by the level. It must not use total solution count, exact route-set comparison, or individual-tile ablation as an acceptance gate. Those checks reward walls and corridors even when open or symmetric layouts express the same puzzle cleanly.

Targeted ablation may still be used as optional diagnostic evidence when a designer wants to understand a tile's role. Its result goes to the reviewer; it never fails a level merely because another winning route exists or because neutralizing a tile preserves solvability. The reviewer decides whether a mechanic is meaningful by inspecting the level's thesis, player decisions, event trace, and plausible counter-histories.

## Phase 5 — Run the per-level design and review loop

Every level follows the same loop. Several designers may work on disjoint ranges in parallel, but approval remains level-specific.

### Step 1: Claim the frozen slot

The Designer copies the slot's role, expected learning, required mechanics, target complexity, and neighbors. If the slot seems wrong, escalate to the Lead; do not silently redesign the curriculum inside the map.

### Step 2: Write a micro-brief

```md
Level: [ID — Title]
Role: [Introduce / Reinforce / Twist / Combine / Synthesize]
Thesis: [One sentence]
Player realization: [What the player should infer]
Required interactions: […]
Forbidden or already-overused structures: […]
Target complexity / dependency depth: […]
Counter-histories the map must reject: […]
```

A **counter-history** is a plausible resource or ordering history that would bypass a level's central idea if a particular constraint were absent. Counter-histories concern the puzzle's logic, not harmless geometric variations such as drawing the same rectangle clockwise or counterclockwise.

### Step 3: Author the smallest expressive map

- Start from the decisions, not the decorative shape.
- Prefer compact branches whose outcomes fail for different readable reasons.
- Use open fields, loops, and symmetric traversal where they improve expression; equivalent winning geometry is allowed.
- Couple systems through a shared resource, access dependency, or ordering consequence.
- Keep the whole relevant state mentally inspectable.
- Remove travel that adds no decision, recall beat, or presentation value.
- Vary topology as well as tile vocabulary.

### Step 4: Declare intent and metadata

At minimum, store:

```js
{
  id,
  name,
  map,
  referenceRoute, // optional known winner; legacy `intendedRoute` has the same non-exclusive meaning
  arc,
  role,
  mechanics,
  thesis,
  difficulty,
  cognitiveLoad,
  dependencyDepth,
  briefing,
  tip,
}
```

A reference route is one documented way to demonstrate the design claim. It is not the only permitted route, and it does not need to match the solver's first witness.

### Step 5: Run the Designer self-check

Before review, the Designer verifies:

- [ ] The level fulfills the frozen slot rather than a more convenient idea.
- [ ] Every featured mechanic supports the level's thesis on at least one documented winning route.
- [ ] Every interactive tile has a named purpose; equivalent geometric alternatives do not need separate justification.
- [ ] Required events occur in a documented winning trace.
- [ ] No unannounced mechanic appears inside a dense puzzle.
- [ ] The briefing states the objective without giving away the route.
- [ ] The tip asks a useful reasoning question rather than states the answer.
- [ ] The parser, first-witness solver, reference-route, replay, event, and immutability gates pass.
- [ ] The map is not a reskin of an earlier topology or decision sequence.
- [ ] Route length is proportional to the reasoning, not masking a shallow puzzle.

### Step 6: Submit an evidence packet

```md
## Designer handoff — Level [ID]

- Slot / thesis: […]
- Intended realization: […]
- Reference winning route, if authored: `[…]`
- Key decision points: […]
- Counter-histories and what rejects them: […]
- Required event evidence: […]
- Solver: [winning witness found, nodes before witness, branches, dead ends, length, turns]
- Mechanic evidence: [events on the witness/reference trace; optional diagnostic ablation]
- Authored complexity / dependency depth: […]
- Known concern: […]
```

### Step 7: Independent reviewer verdict

The Reviewer checks the level against both its slot and the full campaign. The response uses this form:

```md
## Review — Level [ID]

Verdict: APPROVED | CHANGES REQUIRED

- Purpose and expected learning: PASS / issue
- Teaching clarity and fairness: PASS / issue
- Novelty versus neighboring levels: PASS / issue
- Cause-and-effect and copy: PASS / issue
- Curve placement and authored complexity: PASS / issue
- Solvability and reference-route evidence: PASS / issue
- Mechanic meaning and event evidence: PASS / issue
- Planning/execution parity: PASS / issue

Required changes:
1. [Actionable problem, why it matters, and acceptance condition]

Final justification if approved: [One or two sentences]
```

Reviewers should return a decision, not brainstorm indefinitely. `CHANGES REQUIRED` must identify an observable defect and a success condition, while leaving the Designer room to solve it.

### Step 8: Revise and resubmit

The Designer records the important response, reruns every affected automated gate, and sends the level back to a separate Reviewer. A previous approval is void after a material map, reference route, rule, metadata, or hint change.

```md
| ID | Initial decision | Important response | Final decision and justification |
|---:|---|---|---|
| […] | CHANGES REQUIRED | [What changed] | **APPROVED.** [Why it now earns the slot] |
```

### Step 9: Freeze the approved level

After approval, only integration fixes that preserve the map and design claim may bypass a new design review. Any change to decisions, interactive tiles, reference route, complexity, or teaching copy reopens the loop.

## Common failure modes and revision rules

| Failure | Evidence | Required response |
|---|---|---|
| Duplicate lesson or topology | Same decisions in the same order with new walls or nouns | Rebuild the decision structure; do not merely rotate or reskin it |
| Decorative mechanic | The documented winning trace never exercises it, or the reviewer cannot connect it to the thesis | Delete it or give it a clear teaching, decision, or presentation purpose |
| Serial checklist | The route collects keys/resources in an obvious corridor | Couple choices through shared resources, access, or competing order constraints |
| Length masquerading as difficulty | Long solution, few meaningful branches, shallow dependency | Compress corridors and retain only decision-bearing space |
| Alternative winning geometry | Solver finds a route other than the reference route | No automatic change; alternatives are valid unless review shows they bypass the level's central idea |
| Mechanic appears but its idea is unnecessary | Required event fires, yet the route works without the conceptual constraint | Redesign around a counter-history; event presence alone is insufficient |
| Ambiguous teaching example | Several explanations fit the first successful route | Isolate the rule and remove unrelated interactions |
| Hint gives away the solution | Copy names the correct branch, resource, or order | Replace it with a question that directs attention to relevant state |
| Peak built from “everything at once” | Many unrelated systems with no central thesis | Remove systems until one synthesis insight dominates |
| Breather is only shorter | Route length drops but tracking or dependency remains high | Reduce decisions, state ledgers, or interaction novelty |
| High authored load, small search tree | Reviewer finds a compact but non-obvious realization | May remain; flag “concept > search” for playtest calibration |
| Slow first-witness search, modest concept | Search order explores much geometry before finding one simple idea | Improve solver heuristics or flag “topology > search”; do not wall off valid space merely to lower the metric |

When revising a weak level, prioritize correctness and teaching before metric tuning:

1. rule and preview fidelity;
2. solvability and reference-route replay;
3. mechanic behavior, meaning, and counter-histories;
4. purpose, legibility, and fairness;
5. novelty and topology;
6. compression and copy;
7. final curve calibration.

## Phase 6 — Audit the integrated campaign

Individual approvals do not prove that the campaign works as a sequence. The Lead performs a fresh integration audit after all maps are present.

### Structural audit

- [ ] Exact level count and contiguous IDs
- [ ] Frozen role cadence preserved
- [ ] Exact complexity distribution preserved
- [ ] Every arc ends at its intended local peak
- [ ] Every new arc opens below the previous peak
- [ ] Breathers reduce cognitive load in substance
- [ ] No excessive run of maximum-load levels
- [ ] All variants of every new mechanic are taught and later recalled, when applicable
- [ ] No out-of-scope tile family slipped into the campaign
- [ ] Every level retains a substantive thesis and valid metadata

### Solvability and replay audit

- [ ] The solver finds a winning witness for every level below the production node limit
- [ ] No validator counts alternatives or rejects a level for multiple winning routes
- [ ] Every solver witness wins through the production reducer
- [ ] Every declared reference route wins through the production reducer
- [ ] Trace and simulation are deeply equal
- [ ] Repeated runs are deterministic and inputs remain immutable
- [ ] Every declared interaction emits the required event
- [ ] Every declared mechanic event occurs on a documented winning trace
- [ ] Whole-game flow tests include the new campaign

### Cross-level editorial audit

- [ ] Each level adds a new application, contrast, or deliberate recall
- [ ] No duplicate masks or equivalent decision chains survived range-based parallel authoring
- [ ] Briefings use consistent terminology
- [ ] Tips direct attention without revealing answers
- [ ] The finale synthesizes the campaign's thesis instead of inventorying every mechanic
- [ ] Solver anomalies have written interpretation rather than silent score changes

If an integrated audit changes a level, send that level through review again.

## Phase 7 — Publish the quality report

Keep raw measurements next to authored estimates so future maintainers can see disagreements.

### Per-level report template

```md
| ID | Level | Solvable | Witness length | Nodes before witness | Dependency | Complexity | Difficulty | Flag |
|---:|---|---|---:|---:|---:|---:|---:|---|
| […] | […] | yes | […] | […] | […] | […] | […] | — |
```

Useful measures include:

- whether a winning witness was found within the node budget;
- witness path length and turns;
- expanded nodes, branch nodes, and dead ends before the witness;
- number of meaningful interactions;
- authored dependency depth;
- authored cognitive complexity;
- campaign difficulty position; and
- optional diagnostic observations that do not depend on counting routes.

Report totals and maxima, not only per-level rows. Explicitly flag cases where conceptual difficulty exceeds solver search, or geometry inflates search beyond the actual idea.

### Limitations statement

Every report should say what its evidence does **not** prove. A suitable default is:

> A winning witness proves that the level is possible under production rules. It does not prove uniqueness, completeness, fresh-player comprehension, enjoyment, or perceived difficulty. First-witness solver nodes are topology- and traversal-order-sensitive, while authored complexity and dependency estimates remain hypotheses until observed with players.

If manual or browser playtesting was prohibited, say so directly and carry human calibration as a residual risk.

## Phase 8 — Fresh-player calibration

When allowed, observe players who have not seen the maps, routes, or review discussion. Capture behavior rather than coaching them toward the intended answer.

Record:

- first interpretation of the new mechanic;
- first failed assumption and whether feedback corrects it;
- time and retries before the key realization;
- branches explored and state information consulted;
- whether the player can explain why the winning route works;
- hint use and whether the hint reveals too much;
- fatigue across peaks and recovery after breathers; and
- accessibility or input barriers unrelated to the intended puzzle.

Revise the campaign order, copy, or maps when evidence shows a conceptual leap, repeated confusion, or misplaced peak. Then rerun deterministic solvability, replay/event checks, report generation, and independent review for every affected level.

## Parallel sub-agent workflow

The process scales well to multiple people or agents if ownership is explicit.

1. The Lead alone freezes the roster and specification.
2. Assign Designers disjoint level ranges, ideally aligned to arcs but small enough to compare across boundaries.
3. Require each Designer to deliver source plus a self-check evidence packet.
4. Assign each range to a different Reviewer; never let an author review their own range.
5. Reviewers make no edits. They send verdicts and evidence back to the Lead and Designer.
6. Designers revise only their assigned files and resubmit.
7. The Lead runs one fresh campaign-wide audit to catch duplicate patterns across ranges.
8. A final independent audit reads the current files, not cached earlier versions.

Parallelism shortens authoring time, but it increases the risk of duplicate structures and inconsistent terminology. Frozen slots, non-overlapping file ownership, a shared review rubric, and the final cross-level audit are mandatory safeguards.

### Operational ledger

Keep one shared ledger so ownership and approval state never depend on chat history:

```md
| Level / range | Designer | Reviewer | Owned files | Revision | Status | Evidence packet | Approval reference |
|---|---|---|---|---:|---|---|---|
| 01–05 | agent-a | agent-c | `levels/01-*` … | 2 | In review | `reviews/01-05-r2.md` | — |
```

Allowed statuses should be small and explicit: `ASSIGNED`, `DESIGNING`, `SELF-CHECKED`, `IN REVIEW`, `CHANGES REQUIRED`, or `APPROVED`. Change file ownership only through the Lead, and increment the revision whenever a reviewed map or its reference route changes.

### Copy-ready Designer assignment

```md
You are the Level Designer for [IDs/range]. Read the frozen campaign specification and current production rules. Edit only [owned files]. For every slot, author a fair level that fulfills its stated purpose; open fields, loops, symmetric shapes, and multiple winning routes are allowed. Record an optional reference winning route and the key realization; run parser, first-winning-witness, replay/parity, event, and immutability checks; then submit the evidence-packet template. Never enumerate, minimize, or reject alternative winning routes. Do not approve your own work or modify another range. If the frozen slot conflicts with the game, stop and report the conflict to the Lead instead of redefining it.
```

### Copy-ready Reviewer assignment

```md
You are the independent Game Design Reviewer for [IDs/range]. Do not edit level files. Compare each current revision with its frozen slot, optional reference route, solver/replay evidence, meaningful mechanic use, neighboring levels, and campaign curve. Multiple winning routes are allowed and are not a defect by themselves. Return exactly APPROVED or CHANGES REQUIRED per level, followed by a concise evidence-based reason and specific revision requests. Approval applies only to the reviewed revision; any later map, reference route, rule, or metadata change requires resubmission.
```

## Release checklist

### Campaign definition

- [ ] Existing game grammar and technical constraints documented
- [ ] New-mechanic count and introduction order frozen (`0`, `1`, or named set)
- [ ] When adding mechanics, a broad candidate roster is scored and dispositioned
- [ ] Every selected mechanic has an exact rule contract
- [ ] Campaign roster and curve frozen before map authoring
- [ ] Exact complexity budget sums to the level count
- [ ] Every slot has a role, realization, required mechanics, and purpose

### Mechanic implementation

- [ ] Parser, reducer, solver, preview, execution, renderer, editor, and accessibility agree
- [ ] Boundary, success, failure, exclusion, event, immutability, and parity tests pass
- [ ] No execution-only mechanical surprise exists

### Every level

- [ ] Parses and yields at least one winning witness within the node limit
- [ ] Does not count or reject alternative winning routes
- [ ] Any declared reference route wins independently
- [ ] Trace wins and equals execution replay
- [ ] Declared events occur
- [ ] A documented winning trace demonstrates declared mechanic events; the reviewer accepts their purpose
- [ ] Designer self-check is complete
- [ ] Separate Reviewer explicitly approved the current revision

### Integrated campaign

- [ ] Count, IDs, cadence, curve, peaks, breathers, and complexity distribution match the frozen spec
- [ ] Required variants and interactions are covered
- [ ] No duplicate decision structures or gratuitous tiles remain
- [ ] Whole-game tests pass
- [ ] Quality report includes every level, aggregate figures, outliers, and limitations
- [ ] Human calibration completed, or its absence is recorded as a residual risk

## Definition of done

A campaign is done only when:

1. every selected new mechanic, if any, is implemented consistently across every production surface;
2. every frozen campaign slot is filled by an independently approved level;
3. first-winning-witness, reference-route, replay, event, and immutability gates pass without counting alternatives;
4. the exact curve and complexity budget survive integration;
5. the research, roster, specification, review record, and solver report agree with the shipped data;
6. known human-calibration limits are explicit; and
7. the final changes are committed in focused, reviewable units.

Good commit boundaries are each mechanic vertical slice and its tests, followed by the approved campaign, reports, and campaign validators. For a zero-new-mechanic campaign, begin with the frozen specification and validation infrastructure. If any commit changes production rule semantics, rerun every downstream level proof before calling the work complete.
