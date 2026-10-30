# Agent Rules for PharmaLink UNILAG

These rules supplement AGENTS.md and the Blueprint.

## Code Quality

- Prefer clear, maintainable code over clever shortcuts.
- Use consistent naming and structure once EPIC-001 establishes patterns.
- Always validate inputs and check permissions on the server.
- Handle errors explicitly. Never swallow failures silently.
- Write tests for business logic, permissions, and critical paths.

## UI/UX

- Compact, information-dense layouts.
- Clear hierarchy.
- Responsive from mobile to desktop.
- Accessible contrast, labels, and focus states.
- Real loading, empty, and error states.

## Security

- Never commit secrets.
- Hash passwords with a modern algorithm.
- Private storage for verification documents and protected files.
- Server-side authorization for every protected action.
- Rate limiting and abuse controls where relevant.

## Documentation

- Update README after meaningful changes.
- Keep the feature checklist accurate.
- Document environment variables without exposing values.
- Use plain English for user-facing explanations.

## What Not To Do

- Do not introduce direct messaging.
- Do not create fake success states or hard-coded counts.
- Do not mark features complete without tests and acceptance criteria.
- Do not expand scope beyond the current issue without explicit instruction.
- Do not rewrite large parts of the codebase without a clear, justified reason.
