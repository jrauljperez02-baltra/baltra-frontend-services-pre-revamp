# Admin Dashboard HTTP Routes

SOLID-aligned endpoints to power the Admin Dashboard without modifying legacy handlers. Supports month or date range filters.

Base URL (staging): `https://staging.backend.baltra.ai/api/v1`
Base URL (prod): `https://backend.baltra.ai/api/v1`

Identifier note:

- `business_unit_id` en estas rutas corresponde al store (`business_units.business_unit_id`).

Scope options (super admin):

- Por defecto (sin params): filtra solo por el `business_unit_id` de la ruta.
- `scope=all`: agrega datos de todas las companies del mismo `group_id` del store dado.
- `company_ids=1,2,3` o `company_ids=[1,2,3]`: usa esa lista explícita (tiene prioridad sobre `scope`).

Examples (scope):

- Solo store 7: `/admin/company/7/dashboard/funnel?month=2025-09`
- Todo el grupo del store 7: `/admin/company/7/dashboard/funnel?month=2025-09&scope=all`
- Lista explícita: `/admin/company/7/dashboard/funnel?month=2025-09&company_ids=7,8,9`

## Redirección a Dashboard (UI)

`GET /admin/dashboard/redirect?business_unit_id={id}[&scope=all|...][&company_ids=...]`

- Devuelve `{ success: true, url: "https://<UI>/dashboard?business_unit_id=..." }` para navegar a la UI.
- Requiere `business_unit_id` explícito; el front ya trae al usuario autenticado y decide el store.
- Forward de `scope` y `company_ids` en la URL para que la UI mantenga el mismo alcance.
- Base de la UI configurable con `ADMIN_DASHBOARD_UI_BASE` (fallback `NEXT_PUBLIC_BASE_URL`).

Ejemplos:

```
GET /api/v1/admin/dashboard/redirect?business_unit_id=15
GET /api/v1/admin/dashboard/redirect?business_unit_id=15&scope=all
GET /api/v1/admin/dashboard/redirect?business_unit_id=15&company_ids=12,13,14
```

Date filters (choose one):

- `month=YYYY-MM` (e.g., 2025-09)
- or `start_date` and `end_date` in `YYYY-MM-DD` or `DD-MM-YYYY` (end_date inclusive)

## Funnel

`GET /admin/company/{business_unit_id}/dashboard/funnel?month=2025-09`

Response:

```
{ "success": true, "data": [ { "state": "screening_in_progress", "count": 120 }, { "state": "hired", "count": 42 }, { "state": "onboarding", "count": 17 } ] }
```

Notes:

- Usa el último estado por candidato dentro de la ventana de fechas (de `candidate_funnel_logs`).
- Incluye el nuevo estado `onboarding` como último bucket del funnel.

Example cURL:

```
curl -sS "https://staging.backend.baltra.ai/api/v1/admin/company/1/dashboard/funnel?month=2025-09"
```

## Time to Hire

`GET /admin/company/{business_unit_id}/dashboard/time-to-hire?start_date=2025-09-01&end_date=2025-09-30`

Response:

```
{ "success": true, "data": { "samples": 38, "avg_hours": 72.5, "median_hours": 68.0 } }
```

Notes:

- Calcula horas entre el primer `screening_in_progress` y el primer `hired` por candidato.
- Filtra por `hired.changed_at` dentro de la ventana.

Example cURL:

```
curl -sS "https://staging.backend.baltra.ai/api/v1/admin/company/1/dashboard/time-to-hire?month=2025-09"
```

## Hires by Role

`GET /admin/company/{business_unit_id}/dashboard/hires-by-role?month=2025-09`

Response:

```
{ "success": true, "data": [ { "role_name": "Cajero", "count": 12 }, { "role_name": "Colaborador", "count": 9 } ] }
```

Notes:

- Cuenta candidatos que alcanzaron `hired` en la ventana, agrupado por `Roles.role_name` actual.

Example cURL:

```
curl -sS "https://staging.backend.baltra.ai/api/v1/admin/company/1/dashboard/hires-by-role?start_date=01-09-2025&end_date=30-09-2025"
```

## Sources

`GET /admin/company/{business_unit_id}/dashboard/sources?month=2025-09`

Response:

```
{ "success": true, "data": [ { "source": "facebook_ads", "count": 22 }, { "source": "organico", "count": 15 } ] }
```

Notes:

- Agrupa por `candidates.source` usando `candidates.created_at` como filtro de fecha.
- Ajusta si tu métrica de lead source en el dashboard “Generación de leads” usa otra ventana/criterio.

Example cURL:

```
curl -sS "https://staging.backend.baltra.ai/api/v1/admin/company/1/dashboard/sources?month=2025-09"
```

---

## Endpoints Nuevos Implementados (Admin Panel)

Todas aceptan también `scope` y/o `company_ids` como en la sección de alcance.

- Candidate Origins (Evaluados)
    - `GET /admin/company/{business_unit_id}/dashboard/origins-evaluated?month=YYYY-MM`
    - Data: `[ { source, evaluated } ]` (evaluados = `EligibilityEvaluationLog` en ventana)

- Screening Questions
    - `GET /admin/company/{business_unit_id}/dashboard/screening/questions?month=YYYY-MM`
    - Data: `items` con `{ id, short_title, full_question, response_type, total_responses, step_index }` y `meta.total_initial_responses`

- Rejection Reasons
    - `GET /admin/company/{business_unit_id}/dashboard/rejections?month=YYYY-MM&source=chat|manual`
    - Data: `[ { reason, count } ]`; `chat` = `screening_rejected_reason`, `manual` = `rejected_reason`

- Onboarding Summary
    - `GET /admin/company/{business_unit_id}/dashboard/onboarding/summary?month=YYYY-MM`
    - Data: `{ employees_in_onboarding, checklist1_completion, checklist1_employees, checklist2_completion, checklist2_employees, average_satisfaction }`

- Onboarding Checklists
    - `GET /admin/company/{business_unit_id}/dashboard/onboarding/checklists?month=YYYY-MM[&checklist=1|2]`
    - Data: `{ checklist, items: [ { item, completion } ] }` o `{ checklist_1: [...], checklist_2: [...] }`

- Onboarding Satisfaction
    - `GET /admin/company/{business_unit_id}/dashboard/onboarding/satisfaction?month=YYYY-MM`
    - Data: `{ average, change, samples }` (change=0.0 placeholder)

- Documents Summary
    - `GET /admin/company/{business_unit_id}/dashboard/documents/summary?month=YYYY-MM`
    - Data: `{ items: [ { subtype, total, verified } ] }`

- Documents by Type
    - `GET /admin/company/{business_unit_id}/dashboard/documents/types?month=YYYY-MM`
    - Data: `[ { type, total, verified, waiting } ]`

- Stores (listado por grupo con métricas básicas)
    - `GET /admin/company/{business_unit_id}/stores?month=YYYY-MM[&search=...]`
    - Data: `[ { business_unit_id, name, address, hires, active_recruitment, conversion_rate } ]`
    - Notas: lista las sucursales (`business_units`) del mismo grupo del store dado y calcula métricas en la ventana de fechas.

## Candidate Origins (Evaluados)

`GET /admin/company/{business_unit_id}/dashboard/origins-evaluated?month=2025-09`

Status: planned (no implementado aún en la API actual)

Response:

```
{ "success": true, "data": [ { "source": "ads", "evaluated": 24156, "percentage": 75.3 }, { "source": "organic", "evaluated": 7920, "percentage": 24.7 } ] }
```

Notes:

- Cuenta candidatos con estado `evaluated` (o equivalente) dentro de la ventana, agrupado por `source`.
- `percentage` es opcional; puede calcularse en frontend.

Example cURL:

```
curl -sS "https://staging.backend.baltra.ai/api/v1/admin/company/1/dashboard/origins-evaluated?month=2025-09"
```

## Screening Questions

`GET /admin/company/{business_unit_id}/dashboard/screening/questions?month=2025-09`

Status: planned (no implementado aún en la API actual)

Response:

```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "short_title": "Presentación inicial y vacantes disponibles",
            "full_question": "...texto completo...",
            "response_type": "interactive",
            "total_responses": 32076,
            "step_index": 1,
            "editable": false,
            "options": [
                ["yes-button", "Sí"],
                ["no-button", "No"]
            ]
        }
    ],
    "meta": { "total_initial_responses": 32076 }
}
```

Notes:

- `total_initial_responses` sirve para calcular tasa de finalización por paso.
- `step_index` para ordenar el flujo.
- `editable` es `true` si la pregunta es de tipo `interactive`, `location` o `location_critical` y la plantilla de mensaje asociada no es global (`business_unit_id != 9999`).
- `options` contiene las opciones de `button_keys` si la pregunta es de tipo `interactive` y el `interactive_type` de la plantilla es `button`.

Example cURL:

```
curl -sS "https://staging.backend.baltra.ai/api/v1/admin/company/1/dashboard/screening/questions?month=2025-09"
```

## Screening Questions

`GET /admin/company/{business_unit_id}/dashboard/screening/questions?month=2025-09[&include_churn=true][&group=true]`

Response (when include_churn=true):

```
{
  "success": true,
  "data": {
    "items": [ { "id": 1, "short_title": "...", "full_question": "...", "response_type": "...", "total_responses": 32076, "step_index": 1 } ],
    "churn_by_question": { "Presentación inicial y vacantes": 120, "¿En qué comuna vives?": 85 }
  },
  "meta": { "total_initial_responses": 32076, "month": "2025-09", "scope_company_ids": [1] }
}
```

Response (default, include_churn omitted/false):

```
{ "success": true, "data": [ { "id": 1, "short_title": "...", "full_question": "...", "response_type": "...", "total_responses": 32076, "step_index": 1 } ], "meta": { "total_initial_responses": 32076 } }
```

Notes:

- Para tipos `interactive`, `location`, `location_critical` el texto proviene de `message_templates.text` (preferencia por plantilla de la empresa y fallback global) usando `keyword = screening_questions.question`.
- El texto de churn se trunca a 100 caracteres.
- `group=true` agrupa resultados por texto de pregunta y tipo, consolidando múltiple sets.
- `include_percent=true` añade `percent_of_initial` por paso.

Example cURL:

```
curl -sS "https://staging.backend.baltra.ai/api/v1/admin/company/1/dashboard/screening/questions?month=2025-09&include_churn=true"
```

## Rejection Reasons

Status: planned (no implementado aún en la API actual)

Unificado con parámetro `source` o bien separados en dos endpoints.

- Unificado: `GET /admin/company/{business_unit_id}/dashboard/rejections?month=2025-09[&source=chat|manual]`
- Separados: `GET /admin/company/{business_unit_id}/dashboard/rejections/chat?...` y `.../rejections/manual?...`

Response:

```
{ "success": true, "data": [ { "reason": "distancia", "count": 700, "percentage": 70.0 } ] }
```

Notes:

- Origen "chat" proviene de reglas automáticas del bot (pipeline de screening).
- Origen "manual" proviene de etiquetas/razones asignadas por reclutadores.

Example cURL:

```
curl -sS "https://staging.backend.baltra.ai/api/v1/admin/company/1/dashboard/rejections?month=2025-09&source=chat"
```

## Onboarding Summary

Status: planned (no implementado aún en la API actual)

`GET /admin/company/{business_unit_id}/dashboard/onboarding/summary?month=2025-09`

Response:

```
{
  "success": true,
  "data": {
    "employees_in_onboarding": 758,
    "change_from_last_week": 23,
    "checklist1_completion": 87,
    "checklist1_employees": 658,
    "checklist2_completion": 74,
    "checklist2_employees": 561,
    "average_satisfaction": 4.2,
    "satisfaction_change": 0.2
  }
}
```

## Onboarding Checklists

Status: planned (no implementado aún en la API actual)

`GET /admin/company/{business_unit_id}/dashboard/onboarding/checklists?month=2025-09[&checklist=1|2]`

Response:

```
{ "success": true, "data": { "checklist": 1, "items": [ { "item": "Conocí al jefe de RH...", "completion": 94 } ] } }
```

Notes:

- Si no se especifica `checklist`, devolver ambas listas.

## Satisfaction (Onboarding)

Status: planned (no implementado aún en la API actual)

`GET /admin/company/{business_unit_id}/dashboard/onboarding/satisfaction?month=2025-09`

Response:

```
{ "success": true, "data": { "average": 4.2, "change": 0.2, "samples": 523 } }
```

## Documents Summary

Status: planned (no implementado aún en la API actual)

`GET /admin/company/{business_unit_id}/dashboard/documents/summary?month=2025-09`

Response:

```
{
  "success": true,
  "data": {
    "total_hired": 2847,
    "waiting": 423,
    "verified": 2156,
    "rejected": 268,
    "verification_rate": 75.7,
    "failure_rate": 9.4
  }
}
```

## Documents by Type

`GET /admin/company/{business_unit_id}/dashboard/documents/types?month=2025-09`

Response:

```
{
  "success": true,
  "data": [
    { "type": "RFC", "waiting": 398, "verified": 2089, "rejected": 360, "total": 2847 }
  ]
}
```

## Stores (listado con métricas)

`GET /admin/company/{business_unit_id}/stores?search=...&active=true|false|all&month=2025-09`

Response:

```
{
  "success": true,
  "data": [
    {
      "id": "store-1160",
      "name": "1160 Girasoles Escobedo",
      "location": "Avenida ...",
      "hires": 27,
      "active_recruitment": 8,
      "conversion_rate": 32.4,
      "is_active": true
    }
  ],
  "meta": { "total": 33 }
}
```

## Toggle Store Active

`PATCH /admin/company/{business_unit_id}/stores/{store_id}`

Body:

```
{ "is_active": true }
```

Response:

```
{ "success": true }
```

## Store Dashboard Summary

`GET /admin/company/{business_unit_id}/stores/{store_id}/dashboard/summary?month=2025-09`

Response:

```
{
  "success": true,
  "data": {
    "funnel": { },
    "time_to_hire": { "avg_hours": 72.5, "median_hours": 68.0 },
    "hires_by_role": [ { "role_name": "Cajero", "count": 12 } ]
  }
}
```

---

# APIs faltantes para completar el Admin Panel

Basado en los componentes actuales del frontend, faltan implementar/confirmar en backend:

- Candidate Origins (Evaluados): `GET /admin/company/{business_unit_id}/dashboard/origins-evaluated`
- Screening Questions: `GET /admin/company/{business_unit_id}/dashboard/screening/questions`
- Rejection Reasons (chat/manual): `GET /admin/company/{business_unit_id}/dashboard/rejections` (o endpoints separados)
- Onboarding Summary: `GET /admin/company/{business_unit_id}/dashboard/onboarding/summary`
- Onboarding Checklists: `GET /admin/company/{business_unit_id}/dashboard/onboarding/checklists`
- Satisfaction (Onboarding): `GET /admin/company/{business_unit_id}/dashboard/onboarding/satisfaction`
- Documents Summary: `GET /admin/company/{business_unit_id}/dashboard/documents/summary`
- Documents by Type: `GET /admin/company/{business_unit_id}/dashboard/documents/types`
- Stores list + métricas: `GET /admin/company/{business_unit_id}/stores`
- Toggle store active: `PATCH /admin/company/{business_unit_id}/stores/{store_id}`
- Store summary agregado: `GET /admin/company/{business_unit_id}/stores/{store_id}/dashboard/summary`

Notas generales:

- Todos los endpoints deben aceptar filtros de fecha (`month` o `start_date`/`end_date`).
- Estandarizar el envoltorio `{ success, data, meta? }` y códigos de error.
- Alinear nombres de estados del funnel con los que usa la BD, y documentarlos en el contrato.

---

## 7) Edición de Preguntas de Screening

### 7.2 Editar una Pregunta de Screening

- Ruta: `PUT /admin/screening/questions/<question_id>`
- Función: Actualiza los campos de un `ScreeningQuestions`. Para preguntas de tipo `text`, el campo `full_question` actualiza `ScreeningQuestions.question`. Para preguntas de tipo `interactive`, `location` o `location_critical`, el campo `full_question` actualiza `MessageTemplates.text`.
- Body (JSON):

```json
{
    "full_question": "Nuevo texto de la pregunta",
    "position": 1,
    "response_type": "interactive"
}
```

- Respuesta (200 OK):

```json
{
    "success": true,
    "message": "Question updated successfully"
}
```

### 7.3 Editar una Plantilla de Mensaje (Opciones y Texto)

- Ruta: `PUT /admin/screening/message-templates/<template_id>`
- Función: Actualiza los campos de un `MessageTemplates`.
- Body (JSON):

```json
{
    "text": "Nuevo texto de la pregunta interactiva",
    "options": [
        ["nueva_opcion_1", "Nueva Opción A"],
        ["nueva_opcion_2", "Nueva Opción B"]
    ]
}
```

- Respuesta (200 OK):

```json
{
    "success": true,
    "data": {
        "id": 456,
        "keyword": "keyword_de_la_pregunta",
        "text": "Nuevo texto de la pregunta interactiva",
        "business_unit_id": null,
        "options": [
            ["nueva_opcion_1", "Nueva Opción A"],
            ["nueva_opcion_2", "Nueva Opción B"]
        ]
    }
}
```
