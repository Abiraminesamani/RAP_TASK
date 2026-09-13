# Constrained Object Detection & Reasoning API

A construction-site PPE detection and reasoning API built using **RT-DETR**, **FastAPI**, and a lightweight handwritten reasoning router.

The system detects PPE and PPE violations from images and answers natural-language questions using structured detection results with an explicit confidence-based guardrail.

---

## 1. Problem Statement

Construction sites require workers to use personal protective equipment (PPE) such as helmets, gloves, vests, boots, and goggles.

The objective of this project is to build a constrained object-detection system that:

1. Detects PPE-related objects and non-compliance conditions.
2. Exposes the detector through a FastAPI endpoint.
3. Accepts natural-language questions about an image.
4. Uses a handwritten intent-routing layer to decide whether object detection is required.
5. Reasons over structured detector outputs such as classes, bounding boxes, confidence scores, and counts.
6. Explicitly returns an insufficient-information response instead of guessing when the detector does not provide reliable evidence.

---

## 2. Solution Overview

The system contains two API endpoints:

### `/detect`

Accepts an image and returns detected:

- Object/class name
- Bounding box
- Confidence score
- Total detection count

### `/reason`

Accepts:

- An image
- A natural-language question

The handwritten router first determines whether the question is related to visual information.

If visual reasoning is required:

```text
Image
  ↓
RT-DETR
  ↓
Structured detections
  ↓
Confidence filtering
  ↓
Reasoning layer
  ↓
Natural-language answer
