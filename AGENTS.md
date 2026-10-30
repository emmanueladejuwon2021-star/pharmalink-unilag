# Mandatory Instructions for Coding Agents

This file and the `.agents/` directory contain the rules that **must** be followed by any coding agent (Jules, Claude, Cursor, Antigravity, or others) working on PharmaLink UNILAG.

## Before You Do Anything

1. Read `BLUEPRINT.md` in full. It is the engineering roadmap and contains the complete product scope.
2. Read this `AGENTS.md` and all files in `.agents/`.
3. Read `docs/PRD_GUIDE.md` and `docs/PREREQUISITES.md`.
4. Inspect the entire repository and report the current state before making any changes.
5. Do not assume a feature is missing. Search the codebase first.

## Mandatory Implementation Rules (from Blueprint Section 10)

- Read the PRD, this blueprint, the issue, and the existing code before editing anything.
- Inspect the repository and report the current state of the relevant feature before implementing it.
- Do not assume a feature is missing just because it is not immediately visible. Search the codebase and test existing behaviour first.
- Implement the complete issue scope, including frontend, backend, database, permissions, validation, error handling, and tests where applicable.
- Do not use mock data, hard-coded counters, fake success messages, or placeholder interactions as a substitute for working functionality.
- Keep the UI compact and consistently responsive across phone, tablet, laptop, and desktop screens.
- Reuse the existing design system and components where sensible. Avoid unnecessary redesign of unrelated pages.
- Preserve existing working features and avoid breaking changes. If a change is necessary, explain why and test affected flows.
- Prevent duplicate records and repeated rewards/actions where uniqueness is required.
- Update the README in clear, non-technical English so a normal user can understand what the app does and how to run it.
- Maintain a complete PRD feature checklist in the README. List every feature from the master PRD and mark its actual status; do not omit features because they are not yet implemented.
- Do not mark a feature complete until its acceptance criteria and tests pass.
- At the end, provide a concise implementation report: what changed, files affected, database/API changes, tests run and results, known limitations, and remaining work.

## Engineering Principles (apply to every epic)

- Build real functionality only. No decorative buttons or fake counters.
- Frontend and backend must agree. Persistent data lives in the backend/database.
- Protect access on the server, not just by hiding UI.
- Preserve existing work. Inspect before changing.
- Responsive on every screen.
- Compact UI always.
- Accessible interactions.
- Validate all input on client and server.
- Handle every state (loading, empty, success, errors).
- Prevent duplication and race conditions.
- Test what is built.
- Keep documentation current.

## Definition of Done

A feature is complete only when all applicable conditions in Blueprint Section 4 are met. Placeholders do not count.

## Status Lifecycle

Use exactly these statuses in the README checklist and GitHub:

- Not Started
- In Progress
- Implemented
- Tested
- Verified in Production

## Product Boundaries (do not violate)

- UNILAG Pharmacy students (200L–500L) only.
- No direct messages.
- No paid materials.
- Private community not public.
- No false endorsement claims.
- Clear source attribution for official content.
- No anonymous questions.

## Recommended Build Order

Follow the dependency map in Blueprint Section 7. Start with EPIC-001.

## Issue Structure

Use the template in Blueprint Section 9 for every GitHub issue. One testable unit of work per issue.

## Final Reminder

The goal is one coherent product, not 24 disconnected demos. Identity, academic structure, posts, materials, search, notifications, moderation, and engagement must work together.

Report honestly. Update the checklist. Do not claim completion prematurely.
