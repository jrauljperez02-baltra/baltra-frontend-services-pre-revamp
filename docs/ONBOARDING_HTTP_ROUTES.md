# Onboarding HTTP Routes (Screening)

These endpoints power the Onboarding tab. They follow the SOLID structure (Interfaces → Application → Domain), using a domain port (`OnboardingRepository`) with a SQLAlchemy adapter.

Base URL (staging): `https://staging.backend.baltra.ai/api/v1`
Base URL (prod): `https://backend.baltra.ai/api/v1`

## Overview

- `GET /screening/company/{business_unit_id}/candidates/{candidate_id}/onboarding/overview`

Response:

```
{
  "success": true,
  "data": {
    "candidate_id": 1234,
    "candidate": {
      "candidate_id": 1234,
      "business_unit_id": 1,
      "name": "Juan Pérez",
      "phone": "+52 55 1111 2222",
      "role_name": "Cajero"
    },
    "candidate_name": "Juan Pérez",
    "checklists": {
      "checklist_1": [ {"id": 1, "created_at": "...", "question": "...", "answer": "...", "survey": "checklist_1"} ],
      "checklist_2": [ {"id": 2, "created_at": "...", "question": "...", "answer": "...", "survey": "checklist_2"} ]
    },
    "pulse": [ {"id": 10, "created_at": "...", "question": "...", "answer": "4", "survey": "pulse"} ]
  }
}
```

Example cURL (staging):

```
curl -sS "https://staging.backend.baltra.ai/api/v1/screening/company/1/candidates/1234/onboarding/overview"
```

Optional: limit items per section to reduce payload

- `GET /screening/company/{business_unit_id}/candidates/{candidate_id}/onboarding/overview?limit_per_section=25`

Response adds root `meta` with totals; lists contain up to `limit_per_section` newest items (DESC by created_at):

```
{
  "success": true,
  "data": {
    "candidate_id": 1234,
    "candidate": { ... },
    "candidate_name": "Juan Pérez",
    "checklists": { "checklist_1": [ ... up to 25 ... ], "checklist_2": [ ... ] },
    "pulse": [ ... ],
    "meta": {
      "limit_per_section": 25,
      "totals": { "checklist_1": 42, "checklist_2": 12, "pulse": 73 }
    }
  }
}
```

Example cURL (staging):

```
curl -sS "https://staging.backend.baltra.ai/api/v1/screening/company/1/candidates/1234/onboarding/overview?limit_per_section=25"
```

## Grouped responses

- `GET /screening/company/{business_unit_id}/candidates/{candidate_id}/onboarding/responses`

Optional query:

- `?survey=checklist_1|checklist_2|pulse` to fetch only one group.
- Pagination for single list: `?survey=pulse&page=1&per_page=25`.
- When no `survey` is provided:
    - Use `?limit_per_section=25` to limit each group and also get totals per group.
    - Alternatively `?limit=25` (legacy) returns only truncated items without totals.

Response (grouped):

```
{
  "success": true,
  "data": {
    "checklist_1": [ ... ],
    "checklist_2": [ ... ],
    "pulse": [ ... ]
  },
  "meta": {
    "limit_per_section": 25,
    "totals": { "checklist_1": 42, "checklist_2": 12, "pulse": 73 }
  }
}
```

Example cURL (grouped, with totals):

```
curl -sS "https://staging.backend.baltra.ai/api/v1/screening/company/1/candidates/1234/onboarding/responses?limit_per_section=25"
```

Response (single list with pagination when `survey` provided):

```
{
  "success": true,
  "data": {
    "items": [ ... ],
    "page": 1,
    "per_page": 25,
    "total": 73
  }
}
```

Example cURL (pulse, paginated):

```
curl -sS "https://staging.backend.baltra.ai/api/v1/screening/company/1/candidates/1234/onboarding/responses?survey=pulse&page=1&per_page=25"
```

## Checklist by number

- `GET /screening/company/{business_unit_id}/candidates/{candidate_id}/onboarding/checklist/{checklist_number}`

Where `checklist_number` ∈ {1, 2}.

Optional query (pagination): `?page=1&per_page=25`.

Response:

```
{
  "success": true,
  "data": {
    "items": [ {"id": ..., "question": "...", "answer": "..."} ],
    "page": 1,
    "per_page": 25,
    "total": 40
  }
}
```

Example cURL (checklist 1, paginated):

```
curl -sS "https://staging.backend.baltra.ai/api/v1/screening/company/1/candidates/1234/onboarding/checklist/1?page=1&per_page=25"
```

## Candidate Search (autocomplete)

- `GET /screening/company/{business_unit_id}/onboarding/candidates/search?q={term}&type={name|rfc|curp}&limit=10`

Notes:

- All searches are prefix-based for performance (uses indexed prefix match):
    - `type=name`: matches case-insensitive `lower(name) LIKE lower(term)||'%'` within the given `business_unit_id`.
    - `type=rfc|curp`: matches case-insensitive `lower(string_submission) LIKE lower(term)||'%'` with `media_subtype` = `RFC`/`CURP`, scoped by `business_unit_id`.
- Only returns candidates with `funnel_state = 'hired'`.
- Results are ordered by newest candidates and limited by `limit` (max 50).
- Default behavior: if no `q` provided, returns the latest 5 hired candidates for the company (`limit` defaults to 5).

Indexing recommendations (for large datasets):

- Candidates: add B-Tree index on `(business_unit_id, name)` and optionally a functional index on `(business_unit_id, lower(name))`.
- CandidateMedia: add B-Tree index on `(business_unit_id, media_subtype, string_submission)` and optionally `(business_unit_id, media_subtype, lower(string_submission))`.
- If you need contains-search (`%term%`) instead of prefix, prefer a trigram GIN index (`pg_trgm`) and adjust queries; note the higher write overhead.

Response (minimal payload — id + name):

```
{
  "success": true,
  "data": [
    { "candidate_id": 1234, "name": "Juan Pérez" }
  ]
}
```

Example cURLs:

```
# By name (returns id + name)
curl -sS "https://staging.backend.baltra.ai/api/v1/screening/company/1/onboarding/candidates/search?q=juan&type=name&limit=10"

# By RFC (returns id + name)
curl -sS "https://staging.backend.baltra.ai/api/v1/screening/company/1/onboarding/candidates/search?q=PEJJ800101&type=rfc&limit=10"

# By CURP (returns id + name)
curl -sS "https://staging.backend.baltra.ai/api/v1/screening/company/1/onboarding/candidates/search?q=PEJJ800101HDFRRN09&type=curp&limit=10"

# Initial load (no query): returns latest 5 for the company
curl -sS "https://staging.backend.baltra.ai/api/v1/screening/company/1/onboarding/candidates/search"
```

## Architecture

- Domain: `app/domain/onboarding/ports.py` (OnboardingRepository)
- Application: `app/application/onboarding/service.py` (use cases: overview, responses, search)
- Infrastructure: `app/infrastructure/onboarding/sqlalchemy_repository.py` (SQLAlchemy adapter)
- Interfaces: `app/interfaces/http/screening/onboarding_routes.py` (Flask routes)

## Stats (Date Filters)

All endpoints accept either `month=YYYY-MM` (e.g., `2025-09`) or a date range using `start_date` and `end_date`.

Accepted date formats for range: `YYYY-MM-DD` or `DD-MM-YYYY`.

- KPIs
    - `GET BASE_URL/api/v1/screening/company/{business_unit_id}/onboarding/stats/kpis?month=2025-09`
    - or with range: `GET .../onboarding/stats/kpis?start_date=2025-09-01&end_date=2025-09-30`
    - Response:
        ```
        { "success": true, "data": { "employees_in_onboarding": 120, "checklist_1_completed": 85, "checklist_2_completed": 72, "avg_satisfaction": 4.1 } }
        ```
    - cURL:
      `curl -sS "https://staging.backend.baltra.ai/api/v1/screening/company/1/onboarding/stats/kpis?month=2025-09"`

- Checklist 1 (per question, % Yes)
    - `GET BASE_URL/api/v1/screening/company/{business_unit_id}/onboarding/stats/checklist/1?month=2025-09`
    - or: `GET .../onboarding/stats/checklist/1?start_date=01-09-2025&end_date=30-09-2025`
    - Response:
        ```
        { "success": true, "data": [ { "question": "…", "yes": 42, "total": 50, "percentage": 84.0 } ] }
        ```
    - cURL:
      `curl -sS "https://staging.backend.baltra.ai/api/v1/screening/company/1/onboarding/stats/checklist/1?month=2025-09"`

- Checklist 2 (per question, % Yes)
    - `GET BASE_URL/api/v1/screening/company/{business_unit_id}/onboarding/stats/checklist/2?month=2025-09`
    - or: `GET .../onboarding/stats/checklist/2?start_date=2025-09-01&end_date=2025-09-30`
    - Response: same shape as checklist 1
    - cURL:
      `curl -sS "https://staging.backend.baltra.ai/api/v1/screening/company/1/onboarding/stats/checklist/2?month=2025-09"`

- Weekly Pulse (average 1–5)
    - `GET BASE_URL/api/v1/screening/company/{business_unit_id}/onboarding/stats/pulse?month=2025-09`
    - or: `GET .../onboarding/stats/pulse?start_date=01-09-2025&end_date=30-09-2025`
    - Optional: split by question: add `&by_question=true` (or `&split_by=question`).
        - Response when split: `[ { "question": "¿Cómo te sientes hoy? (1-5)", "series": [ { "week": "2025-W36", "avg": 3.9, "responses": 28 }, ... ] }, ... ]`
    - Response:
        ```
        { "success": true, "data": [ { "week": "2025-W36", "avg": 3.9, "responses": 84 }, … ] }
        ```
    - cURL:
      `curl -sS "https://staging.backend.baltra.ai/api/v1/screening/company/1/onboarding/stats/pulse?month=2025-09"`

Notes on calculations:

- employees_in_onboarding: unique candidates in the company with any onboarding response within the month.
- checklist_1_completed / checklist_2_completed: unique candidates with at least one response for that checklist within the month.
- % Yes per question: counts answers considered as "Yes" (`sí`, `si`, `yes`, `true`, `1`; case-insensitive) over total answers per question within the month.
- Pulse averages: averages numeric responses for `pulse` (1–5) grouped by ISO week label (`YYYY-Www`) within the month.
