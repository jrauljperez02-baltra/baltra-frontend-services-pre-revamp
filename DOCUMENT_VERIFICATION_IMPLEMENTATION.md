# Document Verification Implementation

This document describes the implementation of the document verification feature that allows HR users to view the verification status of candidate documents (RFC, INE, CURP, NSS) in the candidate popup modals.

## Overview

The document verification feature is available for companies with `group_id = 1` and provides a comprehensive view of candidate document verification status including:

- RFC (Federal Taxpayer Registry)
- INE (National Electoral Institute ID) - Front and Back images
- CURP (Unique Population Registry Code)
- NSS (Social Security Number) - Asynchronous verification

## Backend Implementation

### 1. Database Structure

The existing `candidate_media` table stores all verification documents with these key fields:

- `media_subtype`: Document type (RFC, INE, CURP, NSS)
- `verified`: Boolean verification status
- `verification_result`: JSON with detailed verification data
- `string_submission`: Text content for RFC/CURP/NSS
- `s3_url`: Image URLs for INE documents

### 2. API Endpoint

**Route**: `GET /api/v1/screening/company/{business_unit_id}/candidates/{candidate_id}/document-verification`

**Description**: Returns document verification status for candidates with `group_id = 1`

**Response Structure**:

```json
{
    "success": true,
    "data": {
        "candidate_id": 2800,
        "group_id": 1,
        "documents": {
            "RFC": {
                "media_id": 86,
                "media_subtype": "RFC",
                "verified": true,
                "status": "verified",
                "status_message": "Verificado",
                "string_submission": "GUSC940812GY9",
                "upload_timestamp": "2025-08-28T18:48:37.166263"
            },
            "INE": [
                {
                    "media_id": 84,
                    "status": "verified",
                    "s3_url": "https://...",
                    "file_name": "ine_front.jpg"
                },
                {
                    "media_id": 85,
                    "status": "verified",
                    "s3_url": "https://...",
                    "file_name": "ine_back.jpg"
                }
            ],
            "CURP": {
                "status": "verified",
                "string_submission": "GUSC940812HNLRNL09"
            },
            "NSS": {
                "status": "pending",
                "status_message": "Verificación en proceso",
                "verification_result": {
                    "verificationId": "1909db26-2bed-4828-04c3-08dddb74824a"
                }
            }
        },
        "overall_status": {
            "status": "verified",
            "message": "Documentos verificados exitosamente",
            "verified_count": 3,
            "pending_count": 1,
            "total_required": 4
        }
    }
}
```

### 3. Service Layer

**File**: `Amigo_Chamba/app/dashboards_folder/utils/screening/candidates_service.py`

**Key Methods**:

- `get_candidate_document_verification(candidate_id)`: Main method to fetch verification data
- `_calculate_overall_verification_status(documents)`: Calculates overall status

**Business Logic**:

- Only processes candidates with `group_id = 1`
- NSS status is tracked but doesn't affect overall verification (async nature)
- Critical documents: RFC, INE (2 images), CURP
- Overall status is "verified" when RFC, INE, and CURP are all verified

## Frontend Implementation

### 1. TypeScript Types

**File**: `screening/lib/api.ts`

**New Interfaces**:

- `DocumentVerification`: Individual document verification data
- `DocumentVerificationData`: Complete verification response
- `getCandidateDocumentVerification()`: API client function

### 2. Components

#### Document Verification Dialog

**File**: `screening/components/candidate-document-verification-dialog.tsx`

**Features**:

- Comprehensive document status display
- Individual document cards with status indicators
- Support for viewing/downloading documents
- Special handling for NSS pending status
- Overall verification summary

#### Updated Candidate Modals

**Files**:

- `screening/components/candidate-profile-popup.tsx` (Screening tab)
- `screening/components/candidate-details-modal.tsx` (Interview tab)

**Changes**:

- Added new "Verificación de Documentos" tab
- Integrated document verification dialog
- Maintained backward compatibility

### 3. UI Features

- **Status Indicators**: Color-coded badges (green=verified, yellow=pending, red=rejected)
- **Document Icons**: Different icons for each document type
- **Document Preview**: View and download functionality for images/files
- **Responsive Design**: Works on mobile and desktop
- **Error Handling**: Graceful fallbacks for missing data

## Status Logic

### Document Status Types

1. **Verified**: `verified = true` in database
2. **Pending**: Only for NSS with `verificationId` in result
3. **Rejected**: `verified = false` or missing document

### Overall Status Calculation

- **Verified**: RFC + INE + CURP all verified (NSS not required)
- **Pending**: Any critical document pending verification
- **Rejected**: Any critical document verification failed

### NSS Special Handling

- NSS verification is asynchronous via webhook
- Pending status shown when `verificationId` exists
- NSS failure doesn't prevent overall verification success
- Used for HR review purposes

## Group ID Filtering

The feature is restricted to companies with `group_id = 1`:

- **Backend**: API endpoint checks `candidate.company_group_id = 1`
- **Database**: Uses existing `company_group_id` field in candidates table
- **Response**: Returns 404 for candidates not in group 1
- **Frontend**: Gracefully handles unavailable verification with user-friendly message

### Error Handling for Non-Enabled Companies

When accessing document verification for companies without `group_id = 1`:

1. **API Response**: Returns 404 with error message
2. **Frontend Detection**: Catches 404 and TypeError: Failed to fetch errors
3. **User Message**: Shows "Verificación de documentos no habilitada en esta compañía"
4. **UI State**: Clean, informative interface instead of error state

## Security & Performance

- **Access Control**: Company-scoped API with candidate ID validation
- **Data Privacy**: Only returns verification status, not sensitive details
- **Error Handling**: Comprehensive error handling and logging
- **Backwards Compatibility**: No breaking changes to existing functionality

## Testing

**File**: `Amigo_Chamba/test_new_document_verification.py`

**New Test**: `test_candidate_document_verification_api()`

- Tests API endpoint functionality
- Validates response structure
- Handles error cases appropriately

## Usage

1. Navigate to candidate in Screening or Interview tabs
2. Click on candidate name to open details modal
3. Select "Verificación de Documentos" tab
4. Click "Ver Verificación de Documentos" button
5. Review document status and details in the verification dialog

The feature seamlessly integrates with existing candidate management workflow while providing comprehensive document verification insights for HR teams.
