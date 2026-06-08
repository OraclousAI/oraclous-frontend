---
title: Execution & scheduling — durable, scheduled agent runs
meta_description: "Oraclous runs Harnesses durably: checkpointed execution that survives restarts, scheduled wake-ups, pause/resume/cancel, and enforced timeouts plus a declared retry count."
url: /platform/execution-scheduling
diagram: run-timeline
page_type: cluster
primary_persona: Operations / automation lead
primary_query: schedule AI agents / durable agent execution
secondary_queries: [run AI agents on a schedule, recurring AI agent, what happens if an agent run crashes, AI agent retry limit]
schema: [BreadcrumbList, FAQPage, TechArticle]
primary_cta: See scheduling → /how-it-works
secondary_cta: Read the architecture → /developers
---

# How does execution work?

Oraclous runs [Harnesses](/glossary/harness) durably. Runs checkpoint their state and survive restarts; schedules fire from the Harness's own triggers so recurring Agents wake on time; and pause, resume, and cancel are first-class — with enforced timeouts and a declared retry count, so work never loops away.

[See scheduling →](/how-it-works) [Read the architecture →](/platform)

> *Hero visual (build note): a long-running Harness with checkpoint markers along its timeline, a clock/trigger icon firing a scheduled wake-up, and pause/resume/cancel controls — with a "max retries: declared count" badge.*

## How does execution work?

Two parts of Layer 3 run the work. The [Harness Runtime](/glossary/harness-runtime) executes a Harness within a request — loading its [OHM](/glossary/ohm), dispatching Actors, resolving Capabilities and credentials, enforcing the policy envelope. The [Execution Engine](/glossary/execution-engine) handles everything that lives *outside* a single request: long-running jobs, checkpoints, schedules, and task-board state.

Durable execution is the heart of it. The Execution Engine keeps a checkpointed execution context, so a run that pauses — waiting on a human, waiting on a schedule, or interrupted by a restart — can resume from where it stopped rather than starting over. Long-running and recurring work becomes something you can depend on.

> **Citable answer — How does execution work in Oraclous?** Oraclous executes every Harness durably. The Execution Engine keeps a checkpointed execution context so runs survive restarts and can pause, resume, and cancel; it registers and fires schedules from the Harness's OHM triggers so recurring Agents wake on time; and it enforces timeouts and a declared retry count, so no run loops away unbounded.

[What is a Harness? →](/glossary/harness) · [The Execution Engine →](/glossary/execution-engine) · [The Harness Runtime →](/glossary/harness-runtime)

## How does scheduling and durable execution work?

Schedules come from the Harness itself. A [Harness](/glossary/harness) declares its triggers in its [OHM](/glossary/ohm) manifest, and the Execution Engine registers those triggers and fires them on time — that is how a recurring Agent wakes on schedule rather than needing an external cron the runtime can't see or govern. The schedule is part of the governed object, not bolted on beside it.

Around every run, the Execution Engine gives you operational control:

- **Checkpointed, durable runs.** Execution state is checkpointed, so a run survives a restart and resumes from its last checkpoint instead of from the top.
- **Pause / resume / cancel.** Durable executions can be paused, resumed, or cancelled — the same machinery that lets a run wait on a human ([human-in-the-loop](/platform/human-in-the-loop)) lets you intervene on a long job.
- **Timeout enforcement.** Runs are bounded by timeouts the runtime enforces, so nothing runs forever by accident.
- **Declared retry count.** Retries are bounded by the count declared in the [policy set](/glossary/policy-set) — the declared number, and no more. No runaway loop, no surprise bill from an Agent retrying itself into the ground.

Job tracking — sync, async, and progress streaming — and task-board state round it out, so you can watch a run advance and see where it is. And because metering captures execution time as substrate-level [Metering](/platform/metering), the cost of a long or recurring run is measured, not estimated.

> *Diagram (build note): the Execution Engine in the centre — OHM triggers feeding "schedule register/fire", a durable execution context with checkpoint dots, pause/resume/cancel controls, and a "timeout + retry-count" guard — distinct from the in-request Harness Runtime.*

## Why does durable, scheduled execution matter?

Agentic work isn't always a single quick request. It runs for a while, waits on a person, wakes up tomorrow, retries a flaky tool. If your runtime forgets state on a restart, can't bound retries, or can't pause a job, those are exactly the moments operations can't trust it.

For an [operations](/solutions/operations) lead, durable, scheduled execution is what makes Agents dependable rather than experimental: recurring work that wakes on its own schedule, long runs that survive a restart, and bounded retries that won't loop away or run up cost. Reliability is a property of the substrate here — not something each Harness has to re-engineer.

## Frequently asked questions

**Q: Can agents run on a schedule?**
A: Yes. A Harness declares its triggers in its OHM manifest, and the Execution Engine registers and fires them on time — so a recurring Agent wakes on its own schedule. Because the schedule lives in the governed Harness rather than an external cron, the scheduled run is governed, metered, and audited like any other.

**Q: What happens if a run crashes?**
A: Durable execution is checkpointed, so a run that is interrupted — by a restart or a crash — resumes from its last checkpoint rather than starting over. The Execution Engine keeps a durable execution context for exactly this, which is also what lets a run pause to wait on a human or a schedule and then resume cleanly.

**Q: Are there retry limits?**
A: Yes. Retries are bounded by the declared count in the Harness's policy set — the declared number, and no more. Combined with enforced timeouts, this means a failing step can't loop away unbounded or run up surprise cost. Retry behaviour is part of the governed policy envelope, not an Agent-level guess.

**Q: Can I pause or cancel a running agent?**
A: Yes. Pause, resume, and cancel are first-class for durable executions in the Execution Engine. The same machinery that lets a run pause to wait on a human lets you intervene on a long-running job — pause it, resume it later, or cancel it outright — while its checkpointed state stays intact.

---
**Internal links:** `/glossary/harness`, `/glossary/execution-engine`, `/glossary/harness-runtime`, `/glossary/ohm`, `/glossary/policy-set` (first-use term links) · `/platform/harness-model`, `/platform/metering` (sibling capabilities) · `/platform/human-in-the-loop` (the pause-and-resume / wait-on-human link) · `/platform` (up-link / breadcrumb) · `/solutions/operations` (Solution link) · `/how-it-works` (scheduling in the lifecycle), `/developers` (architecture). Breadcrumb: Home › Platform › Execution & scheduling.
**Notes for build:** `TechArticle` + `FAQPage` + `BreadcrumbList` JSON-LD; reference the `DefinedTerm` at `/glossary/execution-engine` and `/glossary/harness-runtime` by link. Hero = durable run timeline with checkpoints + scheduled trigger + pause/resume/cancel + retry-count badge. Grounded in `execution-engine-service` + `harness-runtime-service` + §5 flows 2/3; keep claims to what the services-reference states (checkpoints, schedule register/fire per OHM triggers, pause/resume/cancel, timeout, declared retry count).
