# Prerequisites and Groundwork

This repository currently contains **foundation documents only**. No application code has been written.

## What Exists Now

- Complete Product Development Blueprint (`BLUEPRINT.md`) — full text preserved.
- Agent instructions (`AGENTS.md` and `.agents/RULES.md`).
- README with product overview and master feature checklist (all Not Started).
- PRD guidance and this prerequisites file.

## What Coding Agents Must Do First

1. Read all foundation documents listed above.
2. Begin with **EPIC-001 — Project Foundation and Architecture**.
3. Establish the MERN structure, environment configuration, linting, testing, and documentation patterns.
4. Do not skip ahead to product features until the foundation is solid and documented.

## Expected Outcomes of EPIC-001

- Clear separation of frontend, backend, shared utilities, configuration, and tests.
- Environment variables for local, test, staging, and production (secrets never committed).
- Reusable UI patterns, API conventions, error handling, and validation approach.
- Health checks, linting, formatting, and reliable build/test commands.
- README updated so a new developer can install, configure, and run the project.

## Technology

Proposed stack: **MERN** (MongoDB, Express.js, React, Node.js).

File storage must support private object storage for verification documents and protected academic files.

## Important Constraints

- Inspect existing work before changing anything (once code exists).
- Preserve working features.
- Follow the Definition of Done and status lifecycle strictly.
- Update the feature checklist in the README after every meaningful change.

## Next Action for Agents

Start EPIC-001. Create a GitHub issue using the template in the Blueprint. Implement the foundation. Report the result and update documentation.
