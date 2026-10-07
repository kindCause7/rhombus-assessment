# Rhombus test submission

## 1. Setup and how to run

### Shared setup

Requirements:

- Node.js and Yarn
- Playwright Chromium or an installed Chrome executable
- A Rhombus account
- Real Amazon S3 and Google Cloud Storage test resources for the full UI journey

Install dependencies and the Playwright browser:

```bash
yarn install
yarn playwright install chromium
```

Keep secrets in the ignored root `.env` file. Do not commit cloud credentials, bearer tokens, Playwright state, reports, traces, or videos containing customer data.

Capture an authenticated Rhombus browser session:

```bash
yarn ui:auth
```

Complete the Auth0 login in the browser. The state is written to the ignored `ui-tests/.auth/user.json` file.

### UI test suite

Place `datasets/baseline.csv` at the configured S3 object key. Configure the S3 bucket policy with the read-only Rhombus principals shown by the connection screen, and grant the GCS service account `storage.objects.create` on the destination bucket.

Configure `.env`:

```dotenv
RHOMBUS_BASE_URL=https://rhombusai.com
RHOMBUS_STORAGE_STATE=ui-tests/.auth/user.json
RHOMBUS_S3_BUCKET=your-source-bucket
RHOMBUS_S3_REGION=us-east-1
RHOMBUS_S3_OBJECT_KEY=baseline.csv
RHOMBUS_S3_PREFIX=
RHOMBUS_GCS_BUCKET=your-output-bucket
RHOMBUS_GCS_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"..."}
RHOMBUS_SCHEDULE_CRON=* * * * *
RHOMBUS_SCHEDULE_TIMEOUT_MS=60000
RHOMBUS_PROJECT_PREFIX=ui-etl
```

Run the suite:

```bash
yarn test:ui          # smoke test and full journey
yarn test:ui:smoke    # authenticated shell only
yarn test:ui:journey  # S3 → AI cleaning → GCS → schedule journey
yarn test:ui:headed   # visible browser
```

The full journey creates persistent projects and schedules. Remove them manually after reviewing the run.

More detail: [`ui-tests/README.md`](ui-tests/README.md).

### API test suite

The API fixture opens the authenticated Dashboard to capture its short-lived `Authorization` and `X-Org-Id` headers. It then sends requests directly to `https://api.rhombusai.com` with Playwright's `APIRequestContext`.

```bash
yarn ui:auth   # repeat when the saved session has expired
yarn test:api
```

The API suite covers authenticated and unauthenticated profile access, project creation, and execution-history invariants. Project creation leaves uniquely named `api-project-*` resources because a delete endpoint was not identified. It can return `403` when the account has reached its project limit.

If Playwright Chromium is unavailable but Chrome is installed, provide its path:

```bash
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/google-chrome yarn test:api
```

More detail and the identified endpoint tree: [`api-tests/README.md`](api-tests/README.md).

### Data-validation suite

Data-validation testing was intentionally skipped for this submission. There are no data-validation tests to run.

## 2. Observations summary

Data-drift validation was skipped, so no drift cases were evaluated.

| Change | Pipeline stopped? | Chatbot fix worked? | Severity | Observation |
|---|---:|---:|---|---|

### Top three findings

_Not assessed because data-validation testing was skipped._

## 3. Usability feedback

I like the concept of creating a drag and drop interface that can connect a variety of data sources. I am not sure if this is a fully unique concept however, and would also like to know how this platform distinguishes itself from various other offerings that provide similar no-code agent building platforms.

There were some usability issues that I noticed while interacting with the platform that are detailed below
- Unable to access the main landing chat interface after navigating to the "Dashboard", and returning to "New Project" simply asks to specify a new project name. This seems quite unintuitive
no autosave on dashboard
- Occasionally, when constructing a node there would be a "tag is empty" warning despite entering tag
- The dropdown for the selection of the AWS region should provide a scroll interface instead of the "hover"-based scrolling which could get quite frustrating
- When opening the AI builder chat sessions across multiple instances/tabs, the chat generation triggered on one page does not show on another. Perhaps could use some streaming protocol (e.g. WebSockets).
- It seems limiting that the pipelines appear to only be capable of running on a single fixed dataset, where the dataset needs to be manually specified rather than using a "glob".
- As revealed during the UI-testing, pipeline scheduling appears to fail. On the client-side "Next run:" is followed by an empty string which appears to suggest scheduling failure.
- When selecting a dataset or modifying the pipeline, I don't think it should trigger the pipeline as it does now, and the pipeline should only be triggered when the user explicitly triggers it through the "run" button.

## 4. Demo video link

**[Watch the demo video](demo.mp4)**