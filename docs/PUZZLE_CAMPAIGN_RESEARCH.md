# Puzzle campaign research and applied principles

Date: 2026-07-18

This note turns current practitioner guidance, accessibility standards, and solver research into concrete rules for Flow Commander's 25-level fifth campaign. Automated metrics are treated as curation evidence rather than a substitute for human review.

## Findings

### Teach one idea, then expose its consequences

Patrick Traynor's 2024 GDC talk on *Patrick's Parabox* frames levels as demonstrations of a puzzle system. Its learning-curve workflow is explicitly editorial: insert, modify, delete, reorder, or make a level optional when playtesting reveals a conceptual leap. Jolie Menzel's puzzle-design workshop lists the number of steps, time between feedback, new information, and new applications of known information as separate difficulty dials. Together these support a teach/reinforce/twist/combine cadence rather than introducing a rule inside an already dense puzzle.

Applied rule: Levels 1–4 isolate the new mechanic with at most one familiar dependency. Every later appearance must add a new interaction, force a previously optional observation, or serve as deliberate recall; cosmetic rehashes are rejected.

Sources:

- [Patrick Traynor, “System-Centric Puzzle Design in Patrick's Parabox,” GDC 2024](https://www.gdcvault.com/play/1034415/System-Centric-Puzzle-Design-in) and [official slides](https://media.gdcvault.com/gdc2024/Slides/GDC%2Bslide%2Bpresentations/Traynor_Patrick_SystemCentricPuzzle.pdf)
- [Jolie Menzel, “Level Design Workshop: Solving Puzzle Design,” GDC 2016 slides](https://media.gdcvault.com/gdc2016/Presentations/Menzel_Jolie_Level%20Design%20Workshop.pdf)

### Order the mechanic matrix, not just a scalar difficulty score

Nathan Fouts recommends tracking which mechanics a player has seen and inspecting the campaign's difficulty flow with dedicated tools. His slides separate cognitive puzzle difficulty from execution skill and argue for a pronounced drop after a boss when a new mechanic begins. This project has no dexterity challenge, so the relevant load is route search, dependency depth, state tracking, and interaction novelty.

Applied rule: every level records introduced, practiced, and combined mechanics. A concept may be tested only after a readable introduction. Each five-level arc ends in a synthesis peak; the following arc opens below that peak. No more than two peak levels appear consecutively, and levels 6, 11, 16, and 21 reset the cognitive load before rebuilding it.

Sources:

- [Nathan Fouts, “Set this Game in Order: Organizing Hundreds of Levels and Mechanics,” GDC 2018](https://www.gdcvault.com/play/1025182/Level-Design-Workshop-Set-this) and [official slides](https://media.gdcvault.com/gdc2018/presentations/Fouts_Nathan_SetThisGame.pdf)
- [Ahmed Khalifa, Dan Gopstein, and Julian Togelius, “ELIMINATION from Design to Analysis,” 2019](https://arxiv.org/abs/1905.06379) — player traces corroborated the intended sawtooth-shaped curve.

### Space practice and make every level earn its place

Matt Rix's *Trainyard* case study recommends progressive disclosure, immediate practice after instruction, recurring use of learned skills, and easier puzzles after hard clusters. It also argues that every puzzle should have a purpose and that the full state should remain small enough for the player to hold mentally. Learning research distinguishes spacing, which permits recovery from cognitive effort, from interleaving, which helps learners discriminate between similar ideas.

Applied rule: each level has a one-sentence thesis and one campaign role. Breathers genuinely reduce cognitive load instead of merely shortening the route; later review alternates Formation Checkpoints with familiar dependencies so the player learns when exact-count reasoning differs from ordinary “at least enough” resource checks.

Sources:

- [Matt Rix, “Level Design Case Studies: Trainyard,” GDC 2012 official slides](https://media.gdcvault.com/gdc2012/slides/Design%20Track/Rix_Matt_Level_Design_Casestudies.pdf)
- [Ouhao Chen, Fred Paas, and John Sweller, “Spacing and interleaving effects require distinct theoretical bases,” *Educational Psychology Review*, 2021](https://link.springer.com/article/10.1007/s10648-021-09613-w)

### Measure several kinds of difficulty

Solver cost is useful but is not human difficulty. Chen, White, and Sturtevant found that an uncertainty/entropy measure largely reproduced the instructional order of Witness puzzles and correlated with player ratings. Kristensen, Valdivia, and Burelli show why completion rate alone is too coarse: action distributions reveal how players progress and how move limits shape challenge.

Applied rule: Pack 5 reports path length, turns, expanded nodes, dead ends, branch nodes, search ratio, solution count, mechanic count, dependency depth, and an authored cognitive-load estimate. Ordering decisions use the whole profile. An outlier in any metric receives manual review; an apparently hard level with a low conceptual load may be a breather, while a short route with a hidden dependency may still be a peak.

Sources:

- [Eugene You Chen Chen, Adam White, and Nathan Sturtevant, “Entropy as a Measure of Puzzle Difficulty,” AIIDE 2023](https://doi.org/10.1609/aiide.v19i1.27499)
- [Jeppe Theiss Kristensen, Arturo Valdivia, and Paolo Burelli, “Statistical Modelling of Level Difficulty in Puzzle Games,” IEEE CoG 2021](https://ieee-cog.org/2021/assets/papers/paper_205.pdf)
- [Héctor Valenzuela et al., “Evaluating human-like puzzle difficulty from search behavior,” *Entertainment Computing*, 2025](https://doi.org/10.1016/j.entcom.2025.100925) — search exploration correlated with human movement and perceived difficulty, but remains a calibration signal rather than a substitute for players.

### Prove correctness and uniqueness, then review the intended reasoning

Ishihata and Tokumasu use an exact solver as a building block for generating uniquely solvable Nagareru instances. Exact uniqueness is valuable for a campaign whose promise is “one true route,” but uniqueness alone does not prove that a solution is legible, interesting, or robust against accidental shortcuts.

Applied rule: every accepted level must parse, solve, have exactly one solution under production rules, replay through the same reducer used by planning/execution, and match its declared intended route. Validation also checks mechanic necessity by removing or bypassing the featured interaction where meaningful. The reviewer separately rejects guessy forks, invisible state changes, accidental alternate routes, gratuitous length, and solutions that technically use a tile without requiring its idea.

Source:

- [Masakazu Ishihata and Fumiya Tokumasu, “Solving and Generating Nagareru Puzzles,” SEA 2022](https://doi.org/10.4230/LIPIcs.SEA.2022.2)

### Preserve player agency and reduce avoidable cognitive barriers

Microsoft's Xbox Accessibility Guidelines describe difficulty as a relationship between player ability and barriers, not an intrinsic number. They recommend reviewable objectives and progress, on-demand interactive tutorials and hints, and multiple channels for important cues rather than color or audio alone.

Applied rule: Pack 5 remains untimed and fully rewindable, keeps Nudge available, states each mission and mechanic in plain text, labels every symbolic tile, and uses shape/text/animation alongside color and sound. The new mechanic must have an unambiguous tile silhouette and planning preview. A player can inspect the complete plan before committing, and execution never contains a mechanical surprise that was absent from the preview.

Sources:

- [Xbox Accessibility Guideline 108: Game difficulty options](https://learn.microsoft.com/en-us/xbox/accessibility/xbox-accessibility-guidelines/108)
- [Xbox Accessibility Guideline 109: Objective clarity](https://learn.microsoft.com/en-us/xbox/accessibility/xbox-accessibility-guidelines/109)
- [Xbox Accessibility Guideline 103: Additional channels for visual and audio cues](https://learn.microsoft.com/en-us/xbox/accessibility/xbox-accessibility-guidelines/103)

## Pack 5 curation contract

1. Ship exactly 25 static campaign levels with contiguous IDs and one deterministically reproducible solution each.
2. Structure five arcs of five levels: introduce, reinforce, twist, combine, synthesize.
3. Start each new arc below the preceding synthesis peak; preserve a sawtooth curve with deliberate breathers.
4. Introduce no more than one genuinely new rule at once; use familiar mechanics to reveal its interactions.
5. Require every declared featured mechanic in the intended solution and reject decorative mechanic placement.
6. Keep state changes previewable, reversible during planning, text-labelled, and mechanically identical in execution.
7. Use solver metrics to find anomalies and prove correctness; use an independent reviewer to judge clarity, novelty, elegance, and cognitive load.
8. Retain a rejection log so superficially different but structurally duplicate levels do not return later.
9. Preserve the authored distribution exactly: four complexity-5 peaks, five complexity-4 challenges, and sixteen levels across complexity 1–3, with deliberate recovery space between difficult clusters.
