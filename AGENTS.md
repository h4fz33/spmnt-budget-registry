# Agent Working Agreement

These instructions apply to development work in this repository.

## Required Context

Before implementation changes, read:

1. [`BLUEPRINT.md`](./BLUEPRINT.md)
2. [`CONTEXT-MAP.md`](./CONTEXT-MAP.md) and the relevant domain glossary
3. Relevant records in [`docs/adr/`](./docs/adr/)
4. [`DEVELOPMENT-CHECKLIST.md`](./DEVELOPMENT-CHECKLIST.md)
5. Recent notes in [`docs/progress/sessions/`](./docs/progress/sessions/)

## Claiming Work

- Work from a stable checklist task ID whose dependencies are complete.
- Mark the task `[ACTIVE]` and add an Active Work row before editing implementation files.
- Do not claim or edit through another active task without coordination.
- Create a new task ID for discovered work that expands the accepted scope.

## Completion and Handoff

- Meet the task's stated acceptance condition and the applicable Definition of Done checks.
- Run verification proportional to financial, authorization, and migration risk.
- Record changed files, commands/results, decisions, blockers, and one exact next action in a session note made from [`docs/progress/SESSION-TEMPLATE.md`](./docs/progress/SESSION-TEMPLATE.md).
- Update task status and release the Active Work row before ending the session.
- Never mark a task `[DONE]` without durable verification evidence.

