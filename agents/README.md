# SkillProof AI specialist agents

These are product-level agent definitions for the fresher-only SkillFlow dashboard. They describe how each specialist reasons, what evidence it may use, what it must return, and when it must hand work to another agent or a human supervisor.

They are intentionally independent of the website UI and LLM provider. A backend/orchestrator can load these instructions into whichever approved model is configured for the organization.

## Fresher product flow

```text
Fresher login ───────────────┐
                             ├── backend stores identity and PM relationship
PM login ────────────────────┘
    ↓
Resume + interview evaluation
    ↓
Resume Reader Agent
    ↓
Roadmap Creator — First Day Agent
    ↓ frontend sends generated roadmap to backend
    ↓
Fresher completes task and clicks Evaluate
    ↓ frontend collects branch/PR/CI/task evidence
Work Evaluation Agent
    ↓
Question Generator Agent
    ↓ fresher answers in dashboard
Final Evaluation Agent
    ↓ frontend sends report to backend
    ↓ backend syncs report to PM dashboard

Friday 16:00 → Weekly Evaluation Agent → backend → PM dashboard
Roadmap complete → Roadmap Completion Agent → backend → PM dashboard
```

Authentication, fresher–PM relationship, persistence, and PM synchronization are backend responsibilities, not AI agents.

## Shared operating rules

All agents must:

1. Use only supplied evidence and label assumptions.
2. Evaluate work against the current roadmap task, not the complete AI Product Developer role.
3. Treat a missing skill as `not_required`, `not_demonstrated`, or `needs_learning` only when the roadmap requires it.
4. Never use commit count, lines changed, work hours, commit time, or PR count as a primary performance metric.
5. Treat the completed PR or branch as the main evaluation unit; commits are supporting evidence.
6. Separate repository, CI infrastructure, dependency, and employee-caused failures.
7. Preserve raw evidence when later answers or supervisor overrides change a recommendation.
8. Return structured JSON matching the agent's output contract.
9. Mark recommendations as requiring human review.
10. Never make hiring, promotion, salary, termination, or final appraisal decisions.

## Shared evidence envelope

Every handoff should carry:

```json
{
  "employee": { "id": "EMP-101", "name": "Rahul Mehta", "role": "AI Product Developer", "level": "Fresher" },
  "roadmap": { "id": "ROADMAP-1", "goal": "...", "current_stage": "..." },
  "task": { "id": "PAY-204", "title": "...", "objective": "...", "acceptance_criteria": [] },
  "evidence": [],
  "assumptions": [],
  "human_review_required": true
}
```

Each evidence item should identify its source (`resume`, `roadmap`, `diff`, `review`, `ci`, `employee_answer`, or `supervisor`), the claim it supports, and its confidence.

## Status vocabulary

```text
not_required
not_demonstrated
insufficient_evidence
demonstrated_with_guidance
demonstrated_independently
demonstrated_and_explainable
requires_human_review
```

Detailed instructions live in:

- [resume-reader.md](./resume-reader.md)
- [roadmap-creator.md](./roadmap-creator.md)
- [evaluation.md](./evaluation.md)
- [work-evaluation.md](./work-evaluation.md)
- [question-generator.md](./question-generator.md)
- [final-evaluation.md](./final-evaluation.md)
- [weekly-evaluation.md](./weekly-evaluation.md)
- [roadmap-completion.md](./roadmap-completion.md)
