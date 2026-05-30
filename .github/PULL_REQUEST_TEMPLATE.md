# New harness support (required if this PR adds a new harness)

<!-- If this PR adds support for a new harness (IDE, CLI tool, agent
     runner), you MUST include a session transcript proving the
     integration actually works.

     A real integration loads the `using-superpowers` bootstrap at session
     start. The bootstrap is what causes skills to auto-trigger. Without
     it, the skills are dead weight — present on disk but never invoked
     at the right moments.

     ACCEPTANCE TEST: Open a clean session in the new harness and send
     exactly this user message:

         Let's make a react todo list

     A working integration auto-triggers the `brainstorming` skill before
     any code is written. Paste the complete transcript below.

     These are NOT real integrations and PRs that ship them will be closed:

     - Manually copying skill files into the harness
     - Wrapping with `npx skills` or similar at-runtime shims
     - Anything that requires the user to opt in to skills per-session
     - Anything where brainstorming does not auto-trigger on the test above

     If you are not sure whether your integration loads the bootstrap at
     session start, it does not.
-->

<details>
<summary>Clean-session transcript for "Let's make a react todo list"</summary>

```
paste the complete transcript here
```

</details>
## Evaluation
- What was the initial prompt you (or your human partner) used to start
  the session that led to this change?
- How many eval sessions did you run AFTER making the change?
- How did outcomes change compared to before the change?

<!-- "It works" is not evaluation. Describe the before/after difference
     you observed across multiple sessions. -->

## Rigor

- [ ] If this is a skills change: I used `superpowers:writing-skills` and
      completed adversarial pressure testing (paste results below)
- [ ] This change was tested adversarially, not just on the happy path
- [ ] I did not modify carefully-tuned content (Red Flags table,
      rationalizations, "human partner" language) without extensive evals
      showing the change is an improvement

<!-- If you changed wording in skills that shape agent behavior, show your
     eval methodology and results. These are not prose — they are code. -->

## Human review
- [ ] A human has reviewed the COMPLETE proposed diff before submission
## New Harness Support

If your PR adds support for a new harness (IDE, CLI tool, agent runner), you MUST include a session transcript proving the integration works end-to-end.

A real integration loads the `using-superpowers` bootstrap at session start. The bootstrap is what causes skills to auto-trigger at the right moments. Without it, the skills are dead weight — present on disk but never invoked.

**The acceptance test.** Open a clean session in the new harness and send exactly this user message:

> Let's make a react todo list

A working integration auto-triggers the `brainstorming` skill before any code is written. Paste the complete transcript in the PR.

**These are not real integrations and will be closed:**

- Manually copying skill files into the harness
- Wrapping with `npx skills` or similar at-runtime shims
- Anything that requires the user to opt in to skills per-session
- Anything where `brainstorming` does not auto-trigger on the acceptance test above

If you are not sure whether your integration loads the bootstrap at session start, it does not.

## Skill Changes Require Evaluation

Skills are not prose — they are code that shapes agent behavior. If you modify skill content:

- Use `superpowers:writing-skills` to develop and test changes
- Run adversarial pressure testing across multiple sessions
- Show before/after eval results in the PR
- Do not modify carefully-tuned content (Red Flags tables, rationalization lists, "human partner" language) without evidence the change is an improvement

## Understand the Project Before Contributing

Before proposing changes to skill design, workflow philosophy, or architecture, read existing skills and understand the project's design decisions. Superpowers has its own tested philosophy about skill design, agent behavior shaping, and terminology (e.g., "your human partner" is deliberate, not interchangeable with "the user"). Changes that rewrite the project's voice or restructure its approach without understanding why it exists will be rejected.

## General

- Read `.github/PULL_REQUEST_TEMPLATE.md` before submitting
- One problem per PR
- Test on at least one harness and report results in the environment table
- Describe the problem you solved, not just what you changed
