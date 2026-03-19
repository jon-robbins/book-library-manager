# Sequential Loop Runbook: TLA Jira Backlog

**Pattern:** `sequential`  
**Mode:** `safe`  
**Source:** `.claude/plan/jira-backlog-multi-agent-strategy.md`

---

## Pre-Loop Checklist

- [x] Tests pass (`cd mobile-app && npm test`)
- [x] `ECC_HOOK_PROFILE` not disabled (use `standard` or `strict` for safe mode)
- [ ] TLA-8 committed and PR created (current branch: `feat/TLA-8-back-button-title`)

---

## Stop Conditions

| Condition | Action |
|-----------|--------|
| All 20 tickets completed | Loop ends |
| 3 consecutive failures on same ticket | Pause, escalate to loop-operator |
| Merge conflict blocking queue | Pause, resolve manually |
| User intervention | `/loop-status` or manual stop |

---

## Execution Queue (Dependency Order)

| # | Key | Summary | Agent Route | Branch |
|---|-----|---------|-------------|--------|
| 1 | TLA-1 / TLA-11 | Google SSO | planner → tdd-guide → security-reviewer → code-reviewer | feat/TLA-1-google-sso |
| 2 | TLA-12 | Persist auth state | tdd-guide → code-reviewer | feat/TLA-12-auth-persist |
| 3 | TLA-8 | Fix back button label | tdd-guide → code-reviewer | feat/TLA-8-back-button-title |
| 4 | TLA-17 | Back button / header consistency | tdd-guide → code-reviewer | feat/TLA-17-header-consistency |
| 5 | TLA-2 | [Web] Library Tiling Dashboard | planner → tdd-guide → code-reviewer | feat/TLA-2-tiling-dashboard |
| 6 | TLA-4 | [Mobile] Refine List View + Pull-to-Refresh | planner → tdd-guide → code-reviewer | feat/TLA-4-list-pull-refresh |
| 7 | TLA-6 | Book Details and Commentary View | planner → tdd-guide → code-reviewer | feat/TLA-6-book-details |
| 8 | TLA-14 | Web app P0 – tile page and basic flows | planner → tdd-guide → code-reviewer | feat/TLA-14-web-p0 |
| 9 | TLA-13 | Advanced search (author, year range) | planner → tdd-guide → code-reviewer | feat/TLA-13-advanced-search |
| 10 | TLA-3 | [Web] Quick Filters and Advanced Search | planner → tdd-guide → code-reviewer | feat/TLA-3-quick-filters |
| 11 | TLA-15 | Web app – advanced search and parity | planner → tdd-guide → code-reviewer | feat/TLA-15-web-search-parity |
| 12 | TLA-9 | Improve cover image reliability | planner → tdd-guide → code-reviewer | feat/TLA-9-cover-reliability |
| 13 | TLA-10 | Improve UX – visual design and polish | planner → tdd-guide → code-reviewer | feat/TLA-10-ux-polish |
| 14 | TLA-18 | Error and empty states | tdd-guide → code-reviewer | feat/TLA-18-error-states |
| 15 | TLA-19 | Accessibility pass | tdd-guide → code-reviewer | feat/TLA-19-accessibility |
| 16 | TLA-16 | "Books I want to read" | planner → architect → tdd-guide | feat/TLA-16-want-to-read |
| 17 | TLA-20 | App Check (Apple App Attest) | planner → security-reviewer → tdd-guide | feat/TLA-20-app-check |
| 18 | TLA-21 | Import books from Goodreads | planner → tdd-guide → code-reviewer | feat/TLA-21-goodreads-import |
| 19 | TLA-7 | Infrastructure Decision: Raspberry Pi vs VPS | architect | feat/TLA-7-infra-decision |
| 20 | TLA-22 | [AGENT-TEST] App Version to Settings | tdd-guide → code-reviewer | feat/TLA-22-app-version |

---

## Per-Ticket Workflow (Safe Mode)

1. **Checkout:** `git checkout main && git pull origin main`
2. **Branch:** `git checkout -b feat/TLA-X-short-description`
3. **Plan:** Complex tickets → `mcp_task(subagent_type="planner", prompt="Create implementation plan for TLA-X: <summary>")`
4. **Implement:** `mcp_task(subagent_type="tdd-guide", ...)` — RED → GREEN → REFACTOR
5. **Review:** `mcp_task(subagent_type="code-reviewer", ...)` — address CRITICAL/HIGH
6. **Security:** Auth/PII tickets → `mcp_task(subagent_type="security-reviewer", ...)`
7. **Verify:** `cd mobile-app && npm test && npm run lint` (or web-app equivalent)
8. **Checkpoint:** Commit, push, create PR
9. **Next:** Proceed to next ticket in queue

---

## Quality Gates (Safe Mode)

- Tests must pass before each checkpoint
- Code review must pass before merge
- Security review required for TLA-1, TLA-11, TLA-19, TLA-20
- No merge to `main` without PR approval

---

## Current State (as of loop start)

- **Branch:** `feat/TLA-8-back-button-title`
- **TLA-8:** Implemented (headerBackTitle: "Home" on scan, book/[id], add/index)
- **Next:** Commit TLA-8, create PR, then start TLA-17 (or TLA-1 if auth-first)
