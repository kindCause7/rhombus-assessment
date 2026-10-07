# Rhombus API endpoint inventory

Endpoints below were identified from browser network traffic while exercising the Rhombus customer UI. They are not inferred from implementation source code.

## Connection requirements

```text
Base URL: https://api.rhombusai.com
Authorization: Bearer <access token>
X-Org-Id: <organization ID>
Content-Type: application/json       # POST requests
```

Do not commit access tokens, organization IDs, cloud credentials, captured HAR files, or complete request payloads containing customer data.

## Run the API tests

The fixture opens the authenticated Dashboard only to obtain the current short-lived `Authorization` and `X-Org-Id` headers. Test requests are then sent directly to `api.rhombusai.com` through Playwright's `APIRequestContext`.

```bash
yarn ui:auth   # required when ui-tests/.auth/user.json is absent or expired
yarn test:api
```

Current coverage:

- authenticated profile response;
- unauthenticated profile rejection;
- project creation followed by independent project-list verification;
- execution-history pagination and lifecycle integrity.

The execution-history tests deliberately avoid mutable values such as exact project names, execution counts, timestamps, and generated identifiers. They instead verify durable invariants: valid pagination, positive and unique execution IDs, project ownership, chronological lifecycle events, non-negative durations, and internally consistent success records.

The project-creation test uses a unique name and leaves the project available as evidence because a project-delete endpoint has not been captured. Remove these `api-project-*` projects manually after reviewing the run.

## Endpoint tree

```text
https://api.rhombusai.com
└── /api
    ├── /accounts
    │   ├── /orgs
    │   │   └── GET                         200  List organizations available to the user
    │   ├── /transformations/allowed
    │   │   └── GET                         200  List permitted transformation capabilities
    │   └── /users
    │       ├── /credits
    │       │   └── GET                     200  Current credit information
    │       ├── /current-org-role
    │       │   └── GET                     200  Current user's organization role
    │       ├── /privacy-consent
    │       │   └── GET                     200  Current privacy-consent state
    │       ├── /profile
    │       │   └── GET                     200  Current authenticated profile
    │       ├── /project-limit
    │       │   └── GET                     200  Project allowance
    │       ├── /schedule-limit
    │       │   └── GET                     200  Schedule allowance
    │       ├── /subscription
    │       │   └── GET                     200  Subscription details
    │       └── /upload-size-limit
    │           └── GET                     200  Upload-size allowance
    │
    ├── /background_jobs/jobs/{jobId}
    │   ├── GET ?compact=pipeline_progress  200  Read compact pipeline-job progress
    │   └── GET /?compact=pipeline_progress 200  Equivalent captured URL with trailing slash
    │
    ├── /dataset
    │   ├── /projects
    │   │   ├── /add
    │   │   │   └── POST                    201  Create a project
    │   │   ├── /all
    │   │   │   ├── GET ?limit=20&offset=0  200  Paginated project list
    │   │   │   └── GET ?limit=1000&offset=0
    │   │   │                                  200  Larger project list used by workflow UI
    │   │   └── /{projectId}/context
    │   │       └── GET                     200  Project context
    │   │
    │   └── /analyzer/v2
    │       ├── /pipeline
    │       │   ├── /executions/all
    │       │   │   └── GET ?page=1&page_size=100
    │       │   │                                  200  Manual and scheduled execution history
    │       │   └── /schedules/all
    │       │       └── GET ?page=1&page_size=5
    │       │                                      200  Schedules across projects
    │       │
    │       └── /projects/{projectId}
    │           ├── /chat
    │           │   ├── /artifacts
    │           │   │   └── GET                 200  AI Builder artifacts
    │           │   └── /history
    │           │       └── GET ?limit=50&structured=true
    │           │                                  200  Structured AI Builder history
    │           ├── /datasets
    │           │   ├── GET                     200  Project datasets
    │           │   └── /dynamic-columns
    │           │       └── POST                200  Resolve columns using the current graph
    │           ├── /nodes
    │           │   └── GET                     200  Persisted pipeline graph and node settings
    │           └── /pipeline
    │               ├── /process
    │               │   └── POST                200  Start a pipeline execution
    │               ├── /schedule
    │               │   └── POST                200  Create a schedule from a pipeline snapshot
    │               └── /schedules
    │                   └── GET                 200  Schedules for one project
    │
    └── /internal-ops/config/
        └── POST                                403  Protected internal operation; exclude from
                                                       normal customer API coverage
```

## Important mutation payloads

### Create project

```http
POST /api/dataset/projects/add
```

The endpoint creates persistent data. A corresponding project-delete request has not yet been captured, so tests must use unique names and document cleanup.

### Execute pipeline

```http
POST /api/dataset/analyzer/v2/projects/{projectId}/pipeline/process
```

The request contains the current pipeline nodes, edges, transformation parameters, runtime names, and output destination settings. Tests should obtain this graph from the project rather than hard-code generated runtime IDs.

Expected outcome chain:

```text
POST pipeline/process
└── background job/execution reference
    ├── GET /api/background_jobs/jobs/{jobId}?compact=pipeline_progress
    └── GET /api/dataset/analyzer/v2/pipeline/executions/all?page=1&page_size=100
```

### Create schedule

```http
POST /api/dataset/analyzer/v2/projects/{projectId}/pipeline/schedule
```

Observed top-level payload shape:

```json
{
  "frequency": "custom",
  "notify_on_failure": true,
  "custom_cron": "* * * * *",
  "pipeline_nodes": ["<current pipeline graph snapshot>"]
}
```

Expected outcome chain:

```text
POST pipeline/schedule
├── GET /api/dataset/analyzer/v2/projects/{projectId}/pipeline/schedules
└── GET /api/dataset/analyzer/v2/pipeline/executions/all?page=1&page_size=100
    └── execution with trigger=scheduled and a terminal status
```

## Negative-test candidates

```text
GET /api/accounts/users/profile
└── omit Authorization
    └── expect 401 or 403 and an authentication-related response

GET /api/dataset/projects/{invalidOrInaccessibleProjectId}/context
└── use valid authentication
    └── expect 403 or 404 and no project data

POST /api/dataset/analyzer/v2/projects/{projectId}/pipeline/schedule
└── send an invalid cron expression or omit pipeline_nodes
    └── expect a 4xx validation response and no persisted schedule
```

## Not yet captured

No customer-facing `PUT` or `PATCH` request has been observed. Delete/disconnect requests for projects, schedules, sources, and destinations have also not been captured. Do not invent these routes; capture them from the browser before adding tests.
