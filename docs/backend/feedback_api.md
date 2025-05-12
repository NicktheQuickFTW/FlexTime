# FlexTime Feedback System API

This document describes the Feedback System API for the FlexTime scheduling application.

## Overview

The Feedback System implements specialized feedback loops that:
1. Learn from scheduler performance by analyzing outcomes
2. Implement automatic constraint reweighting based on historical performance
3. Integrate with the memory system for long-term knowledge retention

## API Endpoints

### Submit Feedback

**Endpoint:** `POST /api/feedback/submit`

**Description:** Submit feedback for a schedule

**Request Body:**
```json
{
  "scheduleId": "string",
  "userSatisfaction": 0.85,
  "constraintViolations": 0,
  "completionRate": 1.0,
  "resourceUtilization": 0.75,
  "comments": "The schedule worked well for our tournament."
}
```

**Parameters:**
- `scheduleId` (required): ID of the schedule being evaluated
- `userSatisfaction` (required): Satisfaction score between 0 and 1
- `constraintViolations` (optional): Number of constraint violations (default: 0)
- `completionRate` (optional): Percentage of schedule completed (default: 1.0)
- `resourceUtilization` (optional): Resource utilization ratio between 0 and 1 (default: 0.5)
- `comments` (optional): Free-form feedback comments

**Response:**
```json
{
  "success": true,
  "message": "Feedback processed successfully",
  "reweightingApplied": false,
  "insights": "Schedule performed well with high user satisfaction and no constraint violations."
}
```

### Get Constraint Weights

**Endpoint:** `GET /api/feedback/weights`

**Description:** Get current constraint weights used by the scheduler

**Response:**
```json
{
  "success": true,
  "weights": {
    "timePreference": 1.2,
    "locationPreference": 0.8,
    "taskPriority": 1.5,
    "resourceAvailability": 1.1,
    "deadlineProximity": 0.9
  }
}
```

### Trigger Analysis

**Endpoint:** `POST /api/feedback/analyze`

**Description:** Trigger periodic analysis of feedback data (typically used by administrators or for debugging)

**Response:**
```json
{
  "success": true,
  "results": {
    "status": "completed",
    "analysisResults": {
      "insights": "Detected pattern of resource conflicts in afternoon slots",
      "recommendations": "Consider adjusting resource allocation for peak periods"
    },
    "updatedWeights": {
      "timePreference": 1.25,
      "locationPreference": 0.85,
      "taskPriority": 1.55,
      "resourceAvailability": 1.2,
      "deadlineProximity": 0.9
    }
  }
}
```

## Feedback Integration

When integrating with the FlexTime scheduling system, follow these guidelines:

1. **Submit feedback after schedule completion**
   - Collect user feedback after a schedule has been executed
   - Use a standardized form to gather consistent metrics

2. **Use constraint weights for scheduling**
   - When creating new schedules, fetch the latest constraint weights
   - Pass these weights to the scheduling API to benefit from learning

3. **Schedule periodic analysis**
   - For large deployments, consider scheduling regular analysis (e.g., nightly)
   - This ensures weights are regularly updated based on the latest feedback

## Error Handling

The API returns standard HTTP status codes:
- `200 OK`: Request succeeded
- `400 Bad Request`: Invalid request parameters
- `404 Not Found`: Requested resource not found
- `500 Internal Server Error`: Server-side error

Error responses include:
```json
{
  "success": false,
  "message": "Error message describing the issue"
}
```