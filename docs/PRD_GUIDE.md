# Product Requirements Document Guide

This repository is built from the **PharmaLink UNILAG Product Development Blueprint**.

The Blueprint (see `../BLUEPRINT.md`) translates the master Product Requirements Document (PRD) into an actionable engineering plan with 24 epics, acceptance criteria, and verification rules.

## Relationship Between Documents

- **Master PRD** (external / product authority): Explains *what* the product is and *why* it exists.
- **This Blueprint** (`BLUEPRINT.md`): Explains *how* to divide the work, implement it, and verify completeness. It defines the full intended product scope — it is **not** a reduced MVP.

## How Coding Agents Should Use This

1. Treat `BLUEPRINT.md` as the engineering source of truth for scope, epics, and acceptance criteria.
2. If a formal master PRD exists separately, read it alongside the Blueprint.
3. Never remove features from the agreed product just because work is staged.
4. Update the master feature checklist in `README.md` to reflect reality after every change.

## Key Product Definition (from Blueprint)

PharmaLink UNILAG is a private, trusted academic and social network for verified UNILAG Faculty of Pharmacy students (200L–500L).

Primary users, core pillars, access boundary, and explicit product boundaries are fully detailed in the Blueprint (Sections 2 and 15).

## Status Tracking

Every feature must have a clear status:

- Not Started
- In Progress
- Implemented
- Tested
- Verified in Production

A feature with only a placeholder screen is **Not Started** or **In Progress**, never Implemented.
