# Implementation Plan: Jira Backlog Multi-Agent Execution Strategy

## Task Type

- [x] Fullstack (→ Parallel Mobile + Web streams)
- [x] Planning & Orchestration (→ planner, loop-operator, DevFleet)

## Overview

Analysis of the TLA (Tracy's library app) Jira backlog and decomposition into a multi-agent execution strategy. The backlog contains 20 open issues across Mobile, Web, and cross-platform work. This plan maps each ticket to ECC agents, defines parallel work streams, and provides a dependency-ordered execution sequence.

---

## Jira Backlog Summary

| Key | Summary | Platform | Priority | Agent Route |
|-----|---------|----------|----------|-------------|
| TLA-1 | Implement Google SSO Authentication (Web & Mobile) | Fullstack | High | planner → tdd-guide → security-reviewer → code-reviewer |
| TLA-2 | [Web] Develop Library Tiling Dashboard | Web | High | planner → tdd-guide → code-reviewer |
| TLA-3 | [Web] Implement Quick Filters and Advanced Search | Web | — | planner → tdd-guide → code-reviewer |
| TLA-4 | [Mobile] Refine List View UI and Pull-to-Refresh | Mobile | High | planner → tdd-guide → code-reviewer |
| TLA-6 | Implement Book Details and Commentary View | Fullstack | — | planner → tdd-guide → code-reviewer |
| TLA-7 | Infrastructure Decision: Local Raspberry Pi vs VPS | Infra | — | architect |
| TLA-8 | Fix back button label (show "Home" not "(tabs)") | Mobile | — | tdd-guide → code-reviewer |
| TLA-9 | Improve cover image reliability and coverage | Fullstack | — | planner → tdd-guide → code-reviewer |
| TLA-10 | Improve UX – visual design and polish | Fullstack | — | planner → tdd-guide → code-reviewer |
| TLA-11 | Implement Google Sign-In (SSO) | Fullstack | — | planner → tdd-guide → security-reviewer → code-reviewer |
| TLA-12 | Persist auth state with AsyncStorage | Mobile | — | tdd-guide → code-reviewer |
| TLA-13 | Advanced search (author, year range, filters) | Fullstack | — | planner → tdd-guide → code-reviewer |
| TLA-14 | Web app P0 – tile page and basic flows | Web | — | planner → tdd-guide → code-reviewer |
| TLA-15 | Web app – advanced search and parity | Web | — | planner → tdd-guide → code-reviewer |
| TLA-16 | "Books I want to read" (if separate list) | Fullstack | — | planner → architect → tdd-guide |
| TLA-17 | Back button / header consistency | Mobile | — | tdd-guide → code-reviewer |
| TLA-18 | Error and empty states | Fullstack | — | tdd-guide → code-reviewer |
| TLA-19 | Accessibility pass | Fullstack | — | tdd-guide → code-reviewer |
| TLA-20 | App Check (Apple App Attest) for production | Mobile | — | planner → security-reviewer → tdd-guide |
| TLA-21 | Import books from Goodreads library export | Fullstack | — | planner → tdd-guide → code-reviewer |
| TLA-22 | [AGENT-TEST] Add App Version to Settings Screen | Mobile | Epic | tdd-guide → code-reviewer |

---

## Multi-Agent Execution Strategy

### Agent Mapping

| Agent | Role | When to Use |
|-------|------|-------------|
| **planner** | Break down requirements, create implementation plan | Complex features (TLA-1, TLA-2, TLA-6, TLA-14, etc.) |
| **tdd-guide** | Write tests first, implement, refactor | All implementation work |
| **code-reviewer** | Quality and maintainability | After every implementation |
| **security-reviewer** | Auth, PII, App Check | TLA-1, TLA-11, TLA-19 |
| **architect** | System design, infra decisions | TLA-7, TLA-16 |
| **loop-operator** | Autonomous backlog processing | Run `/loop-start sequential` for batch execution |
| **e2e-runner** | Critical user flows | After TLA-2, TLA-14, TLA-1 |

### Orchestration Patterns

1. **Sequential (default)**: `/orchestrate feature "TLA-X description"`
   - planner → tdd-guide → code-reviewer → security-reviewer (if auth/PII)

2. **Parallel streams** (Mobile vs Web):
   - **Stream A (Mobile)**: TLA-4, TLA-8, TLA-12, TLA-19, TLA-21
   - **Stream B (Web)**: TLA-2, TLA-3, TLA-14, TLA-15
   - Use dmux or DevFleet for parallel worktrees

3. **DevFleet** (when available):
   ```
   mcp__devfleet__plan_project(prompt="TLA backlog: Google SSO, tiling dashboard, ...")
   → dispatch_mission for each independent mission
   ```

4. **Loop-operator** (autonomous backlog):
   - `/loop-start sequential --mode safe`
   - Processes tickets in dependency order with quality gates

---

## Dependency DAG & Execution Order

### Phase 1: Foundation (blocking)

| Order | Key | Summary | Rationale |
|-------|-----|---------|------------|
| 1 | TLA-1 / TLA-11 | Google SSO | Auth blocks user-scoped data |
| 2 | TLA-12 | Persist auth state | Session persistence |
| 3 | TLA-8 | Fix back button label | Quick UX fix |
| 4 | TLA-17 | Back button / header consistency | Broader nav/header polish |

### Phase 2: Core UI (parallelizable)

| Order | Key | Summary | Stream |
|-------|-----|---------|--------|
| 5 | TLA-2 | [Web] Library Tiling Dashboard | Web |
| 6 | TLA-4 | [Mobile] Refine List View + Pull-to-Refresh | Mobile |
| 7 | TLA-6 | Book Details and Commentary View | Fullstack |
| 8 | TLA-14 | Web app P0 – tile page and basic flows | Web |

### Phase 3: Search & Filters

| Order | Key | Summary | Stream |
|-------|-----|---------|--------|
| 9 | TLA-13 | Advanced search (author, year range) | Fullstack |
| 10 | TLA-3 | [Web] Quick Filters and Advanced Search | Web |
| 11 | TLA-15 | Web app – advanced search and parity | Web |

### Phase 4: Polish & Reliability

| Order | Key | Summary |
|-------|-----|---------|
| 12 | TLA-9 | Improve cover image reliability |
| 13 | TLA-10 | Improve UX – visual design and polish |
| 14 | TLA-18 | Error and empty states |
| 15 | TLA-19 | Accessibility pass |

### Phase 5: Enhancement & Infra

| Order | Key | Summary |
|-------|-----|---------|
| 16 | TLA-16 | "Books I want to read" (product decision first) |
| 17 | TLA-20 | App Check (Apple App Attest) |
| 18 | TLA-21 | Import books from Goodreads |
| 19 | TLA-7 | Infrastructure Decision: Raspberry Pi vs VPS |
| 20 | TLA-22 | [AGENT-TEST] App Version to Settings |

---

## Implementation Steps

### Step 1: Create feature branches per ticket

For each ticket, create branch: `feat/TLA-X-short-description` (per ECC Git protocol).

### Step 2: Route to planner for complex tickets

Tickets requiring planner: TLA-1, TLA-2, TLA-6, TLA-9, TLA-10, TLA-11, TLA-13, TLA-14, TLA-15, TLA-16, TLA-19, TLA-20.

Invoke: `mcp_task(subagent_type="planner", prompt="Create implementation plan for TLA-X: <summary>")`

### Step 3: TDD workflow for each implementation

1. RED: Write failing test
2. GREEN: Minimal implementation
3. REFACTOR: Improve, verify 80%+ coverage

### Step 4: Mandatory code review

Before PR: `mcp_task(subagent_type="code-reviewer", ...)` per ECC rules.

### Step 5: Security review for auth/PII

TLA-1, TLA-11, TLA-19: `mcp_task(subagent_type="security-reviewer", ...)`.

### Step 6: Loop-operator for batch processing

```
/loop-start sequential --mode safe
```

Process backlog in dependency order with checkpoints.

---

## Key Files

| File | Operation | Description |
|------|-----------|-------------|
| `mobile-app/components/AuthProvider.tsx` | Modify | Google SSO, auth state |
| `mobile-app/app/(tabs)/index.tsx` | Modify | List view, pull-to-refresh (TLA-4) |
| `mobile-app/app/_layout.tsx` | Modify | Back button, header titles (TLA-8) |
| `web-app/src/App.jsx` | Modify | Landing, Google Sign-In (TLA-1) |
| `web-app/src/**/*` | Create/Modify | Tiling dashboard, filters (TLA-2, TLA-3, TLA-14, TLA-15) |
| `mobile-app/app/book/[id].tsx` | Modify | Book details, commentary (TLA-6) |
| `mobile-app/lib/firebase.ts` | Modify | App Check (TLA-19) |
| `docs/jira-issue-DoD.md` | Reference | Definition of done per issue |

---

## Risks and Mitigation

| Risk | Mitigation |
|------|-------------|
| Parallel streams cause merge conflicts | Use separate worktrees (DevFleet) or sequential processing |
| Auth changes break existing flows | TDD + integration tests; security-reviewer before merge |
| Web and mobile drift on search/filters | Document parity in TLA-15; shared Data Connect schema |
| Loop stalls with no progress | loop-operator escalation: pause, reduce scope, verify |
| Goodreads import rate limits | Batch + rate limiting per docs/jira-issue-DoD.md #14 |

---

## Codex/Gemini Note

The `/multi-plan` command specification assumes `~/.claude/bin/codeagent-wrapper` for parallel Codex (backend) and Gemini (frontend) analysis. **This wrapper is not installed** on the current system. This plan was synthesized by Claude using:

- Jira backlog via Atlassian MCP (`searchJiraIssuesUsingJql`)
- ECC agents (planner, tdd-guide, code-reviewer, security-reviewer, loop-operator)
- Orchestration patterns from `/orchestrate`, `/loop-start`, DevFleet
- docs/jira-issue-DoD.md for acceptance criteria

To enable Codex/Gemini analysis in future planning, install the codeagent-wrapper and configure Codex/Gemini backends.

---

## SESSION_ID (for /ccg:execute use)

- CODEX_SESSION: (N/A — codeagent-wrapper not installed)
- GEMINI_SESSION: (N/A — codeagent-wrapper not installed)

---

## Next Steps

1. **Review this plan** — Adjust ordering, agent mapping, or scope as needed.
2. **Execute a single ticket** — e.g. `/orchestrate feature "TLA-8: Fix back button label"`
3. **Start loop** — `/loop-start sequential --mode safe` for autonomous backlog processing.
4. **Use DevFleet** — If available: `plan_project` with backlog summary, then `dispatch_mission` for parallel work.
