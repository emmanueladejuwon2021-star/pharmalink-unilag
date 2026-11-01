# PharmaLink UNILAG

**Where UNILAG Pharmacy Links.**

PharmaLink UNILAG is a private academic and social network for verified University of Lagos (UNILAG) Faculty of Pharmacy students (200L–500L). It provides a trusted space for students to connect across levels, discuss academic matters, discover and share useful materials, ask questions, and receive relevant official updates from PANS and authorized representatives.

**Primary users:** Verified 200L, 300L, 400L, and 500L Pharmacy students; PANS executives and level representatives; platform administrators and moderators.

**Access boundary:** The private community is strictly for eligible, verified UNILAG Faculty of Pharmacy students. Unverified visitors cannot browse private posts, member profiles, or Materials Vault content.

## Product Vision

PharmaLink UNILAG is a private, trusted academic and social network where verified Pharmacy students at the University of Lagos can connect across levels, discuss academic matters, discover useful materials, ask questions, share experience, and receive relevant official updates.

### Core Product Pillars

- **Community:** Focused student network with profiles, posts, replies, likes, follows, and discovery.
- **Academic knowledge:** Searchable Materials Vault for notes, past questions, lab resources, summaries, and other permitted learning materials.
- **Trust and governance:** Student verification, role-based access, moderation, reporting, and accountable official communication.
- **Continuity:** Useful academic knowledge remains discoverable as students progress through levels and sessions.
- **Engagement:** Quizzes, challenges, points, badges, and leaderboards that reward useful participation.

## Main Product Areas

- Private student community
- Social feed and content discovery
- Discussions (posts and replies)
- Materials Vault
- Official PANS communication
- Quizzes, challenges, and gamification
- Administration and moderation

## Proposed Technology

MERN stack (MongoDB, Express.js, React, Node.js).

## Project Status

**This repository currently contains the foundational groundwork only.** No application code has been written yet. This is the preparation layer for coding agents (Jules, Claude, etc.) to begin implementation.

All 24 epics from the Product Development Blueprint are **Not Started**.

## How to Use This Repository

1. Read `BLUEPRINT.md` — the complete engineering roadmap (full text preserved from the source document).
2. Read `AGENTS.md` and `.agents/` for mandatory instructions for coding agents.
3. Read `docs/PRD_GUIDE.md` for the product requirements guidance.
4. Follow the dependency map and recommended build order in the Blueprint.
5. Create GitHub issues using the template in the Blueprint before implementing any feature.
6. Update this README's feature checklist after each completed piece of work.

## Setup & Installation

PharmaLink UNILAG is built with a modular MERN architecture organized into workspaces:
- `backend`: Express.js REST API with Mongoose, Helmet, and Jest tests.
- `frontend`: React 18 with Vite, Lucide icons, responsive compact UI, and Vitest tests.
- `shared`: Domain validation rules (UNILAG email, matric, level checks) and constants.

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0
- MongoDB instance (optional for static health check; required for full persistent database operations)

### Environment Configuration
Copy `.env.example` to `.env` in the root directory:
```bash
cp .env.example .env
```
Key configuration values:
- `PORT`: Backend server port (default: 5000)
- `CLIENT_URL`: Client frontend URL for CORS (default: http://localhost:3000)
- `MONGODB_URI`: MongoDB connection string (default: mongodb://localhost:27017/pharmalink_dev)
- `JWT_SECRET`: Secret token phrase for authentication

### Installation
Install dependencies across all workspaces:
```bash
npm install
```

### Running the Application
To run both backend and frontend concurrently in development mode:
```bash
npm run dev
```
Or run each service individually:
- Backend: `npm run dev --workspace=backend` (Runs on `http://localhost:5000`)
- Frontend: `npm run dev --workspace=frontend` (Runs on `http://localhost:3000`)

### Running Tests
Execute test suites across all workspaces:
```bash
npm test
```
- Backend tests: `npm run test:backend`
- Frontend tests: `npm run test:frontend`
- Shared module tests: `npm test --workspace=shared`

### Health Check
Verify API status by querying:
`GET /api/health`

### Authentication Endpoints (EPIC-002)
- `POST /api/auth/register` — Register student account (requires valid UNILAG email, 9-digit matric number, level 200L–500L, and 8+ char password)
- `POST /api/auth/login` — Sign in with UNILAG email/matric number and password
- `GET /api/auth/me` — Retrieve active authenticated session (requires `Bearer` token)
- `POST /api/auth/change-password` — Change password for authenticated session

### Student Verification Endpoints (EPIC-003)
- `POST /api/verification/submit` — Submit student proof document (Faculty ID, UNILAG ID, Course Form, Exam Slip)
- `GET /api/verification/status` — Retrieve current verification submission status for logged-in student
- `GET /api/verification/admin/requests` — View student submission queue (PANS executives and platform admins)
- `POST /api/verification/admin/review/:id` — Review, approve, or reject student verification submission

### Academic Structure Endpoints (EPIC-004)
- `GET /api/academic/current-period` — Live UNILAG academic session (e.g. 2025/2026) and semester, computed from the university calendar
- `GET /api/academic/courses?level=300L&search=...` — Faculty of Pharmacy course catalogue (requires sign-in)
- `POST /api/academic/courses` — Add a course to the catalogue (admins and moderators only; duplicate codes rejected)
- `PATCH /api/academic/courses/:id` — Update or deactivate a course (admins and moderators only)
- `GET /api/academic/my-period` — The signed-in student's academic record (level, session, semester, progression history)
- `PUT /api/academic/my-period` — Student updates their own session and semester
- `POST /api/academic/admin/promote/:userId` — Promote a student one level with full progression history (admins, moderators, PANS executives)

### User Profile Endpoints (EPIC-005)
- `GET /api/profiles/me` — The signed-in student's full profile (identity, bio, interests, expected graduation year, completeness score) plus their academic session/semester
- `PATCH /api/profiles/me` — Update your own bio, interest areas, graduation year, and profile visibility (server-validated; identity fields such as email or matric number cannot be changed here)
- `GET /api/profiles?level=300L&search=name` — Member directory for verified students only (unverified accounts receive 403)
- `GET /api/profiles/:id` — View one student profile; owners always see their own, other profiles require verified status

Matric numbers are shown masked (e.g. `190••••23`) on all profile responses so the private community never leaks full student identifiers.

## Master Feature Checklist

All features start as **Not Started**. Status must be updated honestly as work progresses (Not Started → In Progress → Implemented → Tested → Verified in Production). A feature is never marked Implemented based on placeholders or mock data.

### Critical Priority

- [x] **EPIC-001** — Project Foundation and Architecture (Tested)
- [x] **EPIC-002** — Authentication and Account Security (Tested)
- [x] **EPIC-003** — Student Verification System (Tested)
- [x] **EPIC-004** — Academic Structure and Session Management (Tested)
- [ ] **EPIC-006** — Social Feed and Content Discovery
- [ ] **EPIC-007** — Post Creation and Management
- [ ] **EPIC-008** — Comments and Discussions
- [ ] **EPIC-011** — Materials Vault
- [ ] **EPIC-012** — File Storage and Document Processing
- [ ] **EPIC-016** — Administration Dashboard
- [ ] **EPIC-017** — Moderation and Reporting
- [ ] **EPIC-024** — Production Infrastructure and Quality Assurance

### High Priority

- [x] **EPIC-005** — User Profiles and Identity (Tested)
- [ ] **EPIC-009** — Likes, Re-Links and Bookmarks
- [ ] **EPIC-010** — Following and Social Connections
- [ ] **EPIC-013** — Global Search and Discovery
- [ ] **EPIC-014** — Notifications
- [ ] **EPIC-015** — Official PANS Communication
- [ ] **EPIC-022** — Analytics and Reporting

### Medium Priority

- [ ] **EPIC-018** — Points, Badges and Gamification
- [ ] **EPIC-019** — Daily Dose Quiz System
- [ ] **EPIC-020** — Side Quests and Challenges
- [ ] **EPIC-021** — Leaderboards
- [ ] **EPIC-023** — Help, Support and Feedback

See `BLUEPRINT.md` for full objectives, features, acceptance criteria, and dependencies for every epic.

## Explicit Product Boundaries

- For UNILAG Faculty of Pharmacy students (200L–500L) only.
- No direct messages. Discussions are public via posts and replies.
- No paid materials or marketplace.
- Private community not browseable by unverified users.
- Do not imply official UNILAG/Faculty endorsement unless actually granted.
- Official information must be clearly attributed.
- No anonymous questions in original scope.

## Documentation

- [BLUEPRINT.md](BLUEPRINT.md) — Complete Product Development Blueprint (full source text preserved).
- [AGENTS.md](AGENTS.md) — Mandatory instructions for coding agents.
- [docs/PRD_GUIDE.md](docs/PRD_GUIDE.md) — Product Requirements Document guide.
- [docs/PREREQUISITES.md](docs/PREREQUISITES.md) — Prerequisites and setup expectations.
- [.agents/](.agents/) — Additional agent rules and context.

## Recommended Next Steps for Coding Agents

1. Begin with **EPIC-001** (Project Foundation and Architecture).
2. Follow the mandatory instructions in AGENTS.md and section 10 of the Blueprint.
3. Inspect this repository fully before making any changes.
4. Create testable GitHub issues before implementing features.
5. Update the feature checklist in this README after each verified change.
6. Never mark a feature complete until acceptance criteria and tests pass.

---

*This groundwork was prepared so that any coding agent can begin building PharmaLink UNILAG from a clear, complete, and consistent foundation. The full Blueprint text has been preserved without omission.*
