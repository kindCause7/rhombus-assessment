# Software Engineer Intern (LLM Observability & Quality Assurance) | Rhombus AI

## Take-Home Exercise

**Deadline:** 1 week from receiving the exercise

**System Under Test:** Rhombus AI

**Web Application:** https://rhombusai.com/

## UI test suite

The Playwright suite is documented in [`ui-tests/README.md`](ui-tests/README.md). After configuring the ignored `.env` and capturing authentication with `yarn ui:auth`, run:

```bash
yarn test:ui
```

The suite separates a safe authenticated-shell smoke test from a serial, modular customer journey covering project creation, Amazon S3 connection, AI-only pipeline construction, Google Cloud Storage output, scheduling, and the first successful scheduled execution. It uses no fixed sleeps and asserts persisted, user-visible outcomes.

## Purpose

Test Rhombus AI the way a customer uses it: as a scheduled ETL pipeline from a cloud source to a cloud destination. Build the pipeline, then break its input on purpose and find out how the platform responds.

We are evaluating your judgement, test quality and how clearly you report what you find. We are not grading the platform. A clear, reproducible write-up of something that goes wrong is a strong result.

## The Scenario

### 1. Build the pipeline

- **Sign up** for Rhombus AI (https://rhombusai.com/).
- **Connect Amazon S3** as the source and upload a messy CSV of your choice (duplicates, missing values, inconsistent formatting, invalid entries).
- **Build a cleaning pipeline using the AI builder only.** No manual transformations.
- **Set Google Cloud Storage** as the destination.
- **Schedule the pipeline** at a regular interval. Wait for one successful scheduled run as your baseline.

### 2. Schema drift

A change to the structure of the data. Before the next scheduled run, change the source file to drop a column, rename a column, change a data type and add a new column. Test each change on its own, then all together, and find out:

- Does Rhombus AI stop the pipeline, warn, or carry on? If it carries on, what reaches GCS?
- Do the logs explain the problem clearly?
- When you give the error to the chatbot, does it diagnose it correctly, and does its fix actually work?
- What happens to the schedule afterwards?

### 3. Semantic drift

A change to the meaning of the data while the structure stays the same, for example dollars becoming cents or month/day dates becoming day/month. Introduce at least two cases. Does Rhombus AI notice? Does your data validation catch it?

## Deliverables

One GitHub repository containing:

- **`/ui-tests/`:** Playwright or Cypress tests automating the pipeline journey (S3 connection, AI-built pipeline, GCS destination, schedule). Runnable from the command line, no fixed sleeps, with assertions on real outcomes.
- **`/api-tests/`:** at least two tests that call the backend directly (find the requests in the browser's network tab). At least one negative test, such as invalid credentials or an unauthenticated request. Assert on status codes and response contents.
- **`/data-validation/`:** a script comparing the GCS output with the S3 input. Check schema, row counts, that cleaning rules were applied, determinism, and your semantic drift cases. Run it on the baseline and every drifted run.
- **`/datasets/`:** the baseline file and every drifted version.
- **`/observations/`:** one Markdown file per drift case (e.g. `schema-rename-column.md`), covering what you changed, what you expected, what happened, what the logs and chatbot said, and whether the fix worked. Detailed enough to reproduce. Put screenshots and log excerpts in `/observations/evidence/` and link to them.
- **`README.md`**, with:
    1. **Setup and how to run** each test suite.
    2. **Observations summary:** a table with one row per drift case (change, pipeline stopped?, chatbot fix worked?, severity) linking to its file in `/observations/`, plus your top three findings in a few lines.
    3. **Usability feedback.** One or two paragraphs: what you found most helpful or enjoyable, what was frustrating or difficult, and how we could make the platform more useful and efficient for you.
    4. **Demo video link.** A short walkthrough of your UI tests, API tests and data validation.

## Optional Bonus: Observability Dashboard

Build a live HTML dashboard and host it (GitHub Pages, Vercel, or similar). Track across all your test runs:

- **Pipeline health by scenario**: success/failure rate for baseline, each drift type, and combined drifts.
- **Output consistency**: For each pipeline configuration, run the same input 3 times. Does the output match every time, or does it vary? If variance, document it with side-by-side diffs.
- **Capability heat map**: Which drift types does Rhombus AI handle cleanly? Which break? (E.g. "column rename: handled; column drop: breaks; semantic drift: missed").
- **Time & resource tracking**: Pipeline execution time for baseline vs. each drift scenario.

Present it as a single-page interactive dashboard viewable in a browser at a public link (include the link in your README).

## Final Notes

There is no expectation of perfection. We are looking at judgement, clarity and trade-offs. Quality over quantity.

## Resources

- Platform documentation: https://doc.rhombusai.com/
- You can also ask the AI builder directly for help with the platform.