<!-- BEGIN FLOW-NEXT -->
## Flow-Next on Pi

This repository uses Flow-Next through the local `pi-flow-next` package.
Use `/flow-next:flow <request>` to route work, `/flow-next:plan <request>`
to plan, and `/flow-next:work <id>` to implement approved work.

- Keep spec and task state in `.flow/`; use the bundled `flowctl` for
  reads and writes. Setup alone stamps setup metadata.
- Resolve the CLI from the loaded skill's plugin root. Never copy it here.
- Load the actual skill and its gated references before acting.
- Planning does not approve implementation, commits, PRs, or deployment.
- Invoking a Flow-Next workflow authorizes only its bounded scouts, workers,
  and independent reviewers. Unrelated work does not authorize delegation.
- Use Pi's `pi-subagents` primitives, translated `flow-next.*` agents,
  `flow_next_skill`, and `flow_next_ask`. There is no Claude `Task`,
  `Skill`, or `AskUserQuestion` tool on Pi.
- Use `flow_next_review` for host reviewers. They need fresh context, strict
  read tools, a different model family from every writer, and actual model
  evidence before a receipt. Never invent a reviewer or a passing result.
- Pi routing pins live in `.pi/flow-next.json` and optional
  `subagents.agentOverrides`. Scout and worker defaults inherit the session.
- Pi Plan Build is disabled only in this repository's package override.
  Do not create a second plan tracker for Flow-Next tasks.

<!-- flow-next-model-routing -->
Pi model routing is configured in `.pi/flow-next.json`.
The `reviewerModel` is an exact `provider/model-id`; `modelFamilies`
can name families for custom model IDs. A missing or same-family reviewer
stops host review. Explicit invocation pins take precedence.
<!-- /flow-next-model-routing -->
<!-- END FLOW-NEXT -->
