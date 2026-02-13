# Candidate Status Summary HTTP Route

This document provides details on the HTTP route for fetching the candidate status summary.

## Endpoint

-   **URL:** `/admin/company/<int:business_unit_id>/dashboard/candidate_status_summary`
-   **Method:** `POST`

## Description

This endpoint provides a summary of candidate statuses for a given set of companies within a specified date range. The response is a list of statuses, where each status has a list of companies and their respective counts for that status.

## Request Body

The request body must be a JSON object with the following properties:

-   `company_ids` (array of integers, required): A list of company IDs to include in the summary.
-   `month` (string, optional): The month for which to fetch the summary, in `YYYY-MM` format.
-   `start_date` (string, optional): The start date for the summary, in `YYYY-MM-DD` format.
-   `end_date` (string, optional): The end date for the summary, in `YYYY-MM-DD` format.

**Note:** You must provide either `month` or both `start_date` and `end_date`.

### Example Request Body

```json
{
    "company_ids": [10, 11],
    "month": "2025-10"
}
```

## Responses

### Success Response

-   **Status Code:** `200 OK`
-   **Content:** A JSON object with the summary data.

#### Example Success Response

```json
{
    "success": true,
    "data": [
        {
            "status_name": "screening_in_progress",
            "companies": [
                {
                    "id": 10,
                    "count": 10
                },
                {
                    "id": 11,
                    "count": 5
                }
            ]
        },
        {
            "status_name": "hired",
            "companies": [
                {
                    "id": 10,
                    "count": 2
                }
            ]
        }
    ]
}
```

### Error Responses

-   **Status Code:** `400 Bad Request`
    -   If the request body is not a valid JSON.
    -   If `company_ids` is missing.
    -   If date parameters are missing or invalid.

#### Example Error Response

```json
{
    "success": false,
    "error": "'company_ids' is required"
}
```

-   **Status Code:** `500 Internal Server Error`
    -   If there is an unexpected error on the server.

#### Example Error Response

```json
{
    "success": false,
    "error": "Failed to fetch candidate status summary",
    "details": "..."
}
```
