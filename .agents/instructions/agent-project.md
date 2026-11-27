---
id: project
title: "Project instructions"
load_when: "anything specific to this project: its own rules, conventions, exceptions and its reading of shared doctrine"
triggers: ["bit[aá]cora", "session[- ]?log", "git:promote", "promot(e|ion)", "promoci[oó]n", "feature[- ]?map"]
paths: [".context/bitacora.md"]
---

# Project instructions

> Section `project` of the project instructions: the project-owned overlay. Every other file in `.agents/instructions/` is shared doctrine that `bun sync` keeps in step with the boilerplate; this one holds what is true only for this repository, and no sync ever touches it. A rule here may narrow a shared rule for this project and must say which one; it never silently contradicts a Critical Rule.

<!-- Add one `##` heading per topic. Name the source of truth for any value that changes (Critical Rule #17); keep values themselves in `.agents/project.yaml` or the tracker. -->

## Session log: `bitacora.md`

Append one entry to `.context/bitacora.md` ONLY when a session completes a tracked story, resolves a critical bug or ships a deploy. Never for trivial work, text edits or exploratory sessions.

<!-- binds-in-section: the L0 memory section carries the trigger on every session; this section holds the mechanics -->

- **Append blind**: add a block with the shape `## <date> - <short title>` then `- What: ...`, `- Why: ...`, `- Next: ...`. NEVER read the whole file before writing.
- **Verify the last entry**: only with `tail -n 10 .context/bitacora.md`.
- **Rotate** when the file passes 50 entries: `mv` it to `.context/bitacora-<range>.md` and restart `bitacora.md` with its header plus the last ~15 entries, never empty.

## Project rules (each narrows a shared Critical Rule)

<!-- binds-in-section: project-owned narrowings of Rules 4, 11, 12 and 14; the L0 binding sentence of each rule stays in AGENTS.md -->

### Communication mode: caveman (narrows Rule 11)

When `~/.claude/skills/caveman/` or the caveman plugin is installed, reply in caveman level `full`: drop articles, fillers and pleasantries, fragments are fine, technical terms stay exact. Revert to plain prose when the user asks ("normal mode", "habla normal", "stop caveman" or a clear equivalent). Code, commits, PR bodies and security warnings are always full sentences. Not installed: this heading is a no-op.

### Escuadra is written in Spanish (narrows Rule 12)

Interface text, commit messages, PR descriptions, issues, comments and chat replies are written in Spanish from Spain (never voseo). Identifiers and branch type prefixes follow the code that is already there.

### UI stories: no hard stop on a missing screen row (narrows Rule 14)

A UI story whose screen has no row in `.context/design/master-design-plan.md`, or no plan at all, does NOT stop the work. Build against the current live UI and the `DESIGN.md` tokens, then add the screen's row as part of the story. Hard-stop only when the screen is genuinely novel (no analog in the live UI AND no mockup). Hand-authoring a mockup outside a design skill stays forbidden.

### Promotion to the release branch (narrows Rule 4)

Whatever `git_strategy.policy.direct_push_to_protected` resolves to, a promotion runs through `bun run git:promote`: dry run first, `--yes` only after the user confirms. Never promote without a finished green CI run, never with a placeholder identity, never a code commit without its `(#PR)`. `docs/workflows/promotion.md` owns the mechanics.

## Jira setup: story text fields

Acceptance criteria, scope, out of scope and business rules live in their own Jira fields, declared in `.agents/jira-required.yaml`. On a new Jira site create each one as a **Paragraph** field: a short text field cuts at 255 characters and real Gherkin never fits. Check one by writing a long scenario and reading it back.

## Working rules

Each one comes from a mistake already paid for.

<!-- binds-in-section: project-owned working agreements; they narrow Rules 4, 13 and 16 for this repository -->

- **Ask before every merge**, even with checks green. Commit and push follow the cadence agreed in the session.
- **Batch promotions**: PRs accumulate on the source branch; each push to the release branch is a production deployment.
- **Verify a deploy by its status**, not by searching the built page for text: the build rewrites CSS and JS.
- **Check the commit exists** (`git log`) before `git reset --soft HEAD~1`: a failed pre-commit leaves no commit.
- **Stop the dev server** when the validation that needed it is done.
- **Search the repo and the tracker before proposing** work or a measurement: it may already exist, with real numbers.
- **One subagent per wave**, not several in parallel, unless the user asks: token cost.
- **Every piece of real work has a ticket under an epic.** Read the new key from the creation response, never from a search, and never re-run the create.
- **Comment on every ticket reviewed** with the findings, even when its status does not change; read the code before proposing a ticket.
- **Never propose spending money without asking**: offer the free path first.

## Browser support (read by `modern-web-guidance`)

<!-- binds-in-section: project-owned browser-support policy the modern-web-guidance skill asks for; no shared rule carries it -->

- The baseline target is the `browserslist` key of `package.json`.
- Use **Baseline Widely available** features without a fallback.
- Use **Baseline Newly available** features only behind feature detection, with a page that still works without them.
- No polyfills. A feature that is not Baseline at all is not used in shipped UI.

## Feature map sync

Update the business feature map ONLY when an entire epic closes or a major new capability ships. Never for bugs, refactors or UI tweaks. Refresh the whole map through `/project-context` mode `features`.

<!-- binds-in-section: project-owned trigger for the feature map; no shared rule carries it -->

## Git Strategy (this repository)

`git-flow-master` reads the strategy and its policy from the `git_strategy:` block of `.agents/project.yaml`; an exception this project accepts on purpose (a host rule it bypasses, a divergence it keeps) is written here, with its reason, by the people who decided it.

- Pull requests go against `main`. There is no `staging` branch and no promotion step until the project has a deployment.
- There is no issue tracker yet, so the working rules about tickets and epics do not apply.

## Project context skills

The `<aspect>-context` skills this project created (`/project-context context-skill`), one row each. The prompt hook routes a prompt that matches a row's Triggers to that skill's `SKILL.md`, and `bun run docs:check` counts a skill listed here as rostered. This file survives `bun sync`, so a row here keeps routing after every update; the shared skills section does not. Triggers are backticked, case-insensitive regexes separated by commas; write a `|` inside one as `\|`. The optional `Unless` column lists backticked section ids or project-skill slugs: when one of those rows fires on the same prompt, this row does not route, unless the prompt names this skill or a `ROUTE-SCOPE:` line names its id. Use it for a broad row, such as a persona skill, that must stay off coding prompts. Add the column to the header too, or no reader sees it.

<!-- project-skills:start -->
| Skill | Load when | Triggers | Loaded by | Unless |
| --- | --- | --- | --- | --- |
| `escuadra-context` | building or changing a screen, game rules, mock data or browser tests of Escuadra | `escuadra`, `data-testid`, `trivia` | main |  |
<!-- project-skills:end -->
