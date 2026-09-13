# Constrained Object Detection & Reasoning API

A construction-site PPE detection and reasoning system built with **RT-DETR-L** and **FastAPI**.

The system detects workers, PPE equipment, and explicit PPE non-compliance categories from construction-site images. It also provides a natural-language reasoning endpoint that answers questions using structured detector evidence while avoiding unsupported guesses.

---

## 1. Problem

Construction sites require workers to use appropriate personal protective equipment (PPE), including helmets, gloves, vests, boots, and goggles.

Manual PPE inspection is time-consuming and can be difficult to scale. This project builds a computer-vision API that:

1. Detects PPE-related objects in an image.
2. Returns structured detections with class, confidence, and bounding-box coordinates.
3. Accepts natural-language questions about the image.
4. Routes questions through a handwritten intent layer.
5. Uses detector evidence to produce a plain-language answer.
6. Explicitly returns insufficient information when the detector evidence is not strong enough.

---

## 2. Solution Overview

```text
                    Input Image
                         |
                         v
                  +-------------+
                  |   FastAPI   |
                  +------+------+
                         |
                         v
                  +-------------+
                  |  RT-DETR-L  |
                  |   Detector  |
                  +------+------+
                         |
                         v
              Structured Detections
          class / confidence / bbox
                         |
             +-----------+-----------+
             |                       |
             v                       v
        /detect endpoint       /reason endpoint
                                     |
                                     v
                           Handwritten Intent Router
                                     |
                         +-----------+-----------+
                         |                       |
                     Unsupported              Visual
                         |                       |
                         v                       v
                     Reject              Detector Evidence
                                                 |
                                                 v
                                      Confidence Filtering
                                                 |
                                                 v
                                           Reasoning Layer
                                                 |
                                                 v
                                       Plain-language Answer

The reasoning layer is a single handwritten decision layer. No LangChain, LangGraph, CrewAI, AutoGen, or similar agentic framework is used.

3. Dataset
Construction-PPE Dataset

The project uses the Ultralytics Construction-PPE dataset.

Official dataset documentation:

https://docs.ultralytics.com/datasets/detect/construction-ppe

Dataset size:

Split	Images
Train	1,132
Validation	143
Test	141
Total	1,416

The dataset provides YOLO-format bounding-box annotations.

The predefined train/validation/test split was retained rather than reshuffling the dataset. The test split was kept separate from training and used for final held-out evaluation.

Classes

The dataset contains 11 classes:

0   helmet
1   gloves
2   vest
3   boots
4   goggles
5   none
6   Person
7   no_helmet
8   no_goggle
9   no_gloves
10  no_boots

The no_* classes provide explicit PPE non-compliance categories and are particularly useful for evidence-based reasoning.

4. Model

The detector uses RT-DETR-L fine-tuned using the Ultralytics implementation.

Training Configuration
Model:              RT-DETR-L
Pretrained model:   rtdetr-l.pt
Epochs:             30
Image size:        640 × 640
Batch size:         4
Workers:            2
Patience:           8
GPU:                NVIDIA Tesla T4
Ultralytics:        8.4.149

The final trained checkpoint is:

models/best.pt
5. Evaluation

The final model was evaluated on the held-out test split.

Metric	Test Result
Precision	62.41%
Recall	57.45%
mAP@50	57.52%
mAP@50–95	29.29%
Interpretation

The model provides moderate overall detection performance.

The aggregate metrics do not imply uniform performance across all classes. Rare non-compliance classes are more difficult to detect because of limited examples and class imbalance.

Observed failure behavior includes:

Small PPE objects
Occlusion
Blur / low image quality
Class confusion
Overlapping or duplicate detections
Rare non-compliance classes

The reasoning layer therefore applies an evidence confidence threshold instead of blindly using every raw detection.

More details are available in:

METRICS.md
failure_cases/README.md
6. Failure Cases

Five major failure modes were identified:

1. Small PPE Objects

Small helmets, gloves, goggles, or boots contain limited visual information.

Root cause: Small visual regions provide fewer pixels and less discriminative information.

Possible improvement: Higher-resolution training and additional small-object examples.

2. Occlusion

PPE can be partially hidden by people, equipment, or other objects.

Root cause: Only partial visual evidence may be available.

Possible improvement: More occluded training examples and realistic augmentation.

3. Blur / Low Image Quality

Motion blur and poor image quality can reduce detection accuracy.

Root cause: Important visual features are lost.

Possible improvement: Training with degraded images and targeted image-quality augmentation.

4. Class Confusion / Overlapping Detections

Some predictions can overlap or contain low-confidence duplicates.

Root cause: Similar visual appearance and ambiguous regions.

Possible improvement: Class-specific error analysis, confidence/NMS tuning, and improved class balance.

5. Rare Non-compliance Classes

Classes such as no_helmet, no_goggle, no_gloves, and no_boots are harder to detect reliably.

Root cause: Fewer examples and class imbalance.

Possible improvement: Collect more examples and apply targeted augmentation.

Detailed analysis:

failure_cases/README.md
7. Reasoning Layer

The /reason endpoint accepts an image and a natural-language question.

The reasoning pipeline is:

Natural-language question
          |
          v
Handwritten Intent Router
          |
      +---+---+
      |       |
      v       v
Unsupported  Visual
      |       |
      v       v
    Reject   RT-DETR
              |
              v
      Structured detections
              |
              v
      Confidence filtering
              |
              v
          Reasoning
              |
              v
      Plain-language answer
Intent Routing

The router determines whether the question can be answered from the PPE detector.

Example:

"How many helmets are there?"

→ visual question → detector is called.

Example:

"What is the weather today?"

→ unsupported question → detector is not called.

8. Confidence Guardrail

The reasoning layer uses a confidence threshold of:

0.50

Only sufficiently confident detections are treated as reliable evidence.

The system also avoids treating the absence of a detection as proof of absence.

For example:

Question:
Is anyone without a helmet?

If no sufficiently confident no_helmet detection exists, the system returns:

Insufficient information: I did not find a sufficiently confident
explicit no-helmet detection, so I will not assume that everyone
is wearing a helmet.

This prevents the system from making unsupported PPE compliance claims.

9. Optional LLM Reasoning

The application contains an optional LLM reasoning path that operates on structured detector output rather than raw image reasoning.

The intended flow is:

Question
   ↓
Handwritten Router
   ↓
RT-DETR
   ↓
Structured detections
   ↓
Confidence filtering
   ↓
LLM reasoning
   ↓
Answer

If the LLM is unavailable or an API call fails, the application uses deterministic evidence-based reasoning as a fallback.

During local validation, the deterministic fallback path was used because the configured OpenAI API account had exhausted its available quota.

No agentic framework is used.

10. API

The project exposes two main endpoints.

/detect

Detect objects in an image.

Request
POST /detect
Content-Type: multipart/form-data

file = construction_site.jpg
Response
{
  "success": true,
  "image_width": 553,
  "image_height": 523,
  "detections": [
    {
      "class": "Person",
      "confidence": 0.917,
      "bbox": [175.05, 45.55, 552.9, 522.53]
    },
    {
      "class": "vest",
      "confidence": 0.910,
      "bbox": [261.69, 245.51, 551.34, 522.63]
    },
    {
      "class": "helmet",
      "confidence": 0.865,
      "bbox": [295.36, 72.89, 493.37, 195.27]
    },
    {
      "class": "goggles",
      "confidence": 0.640,
      "bbox": [326.12, 173.12, 440.53, 212.67]
    }
  ],
  "count": 6
}
/reason

Answer a natural-language question about the image.

Request
POST /reason
Content-Type: multipart/form-data

file = construction_site.jpg
question = How many helmets are there?
Response
{
  "success": true,
  "question": "How many helmets are there?",
  "intent": "visual",
  "answer": "I detected 1 helmet.",
  "detections_used": [
    {
      "class": "helmet",
      "confidence": 0.865,
      "bbox": [295.36, 72.89, 493.37, 195.27]
    }
  ],
  "reasoning_source": "deterministic_fallback"
}
Another example

Question:

Are there any goggles?

Response:

Yes. I detected 1 pair of goggles.
11. Installation
Clone the repository
git clone https://github.com/Abiraminesamani/RAP_TASK.git
cd RAP_TASK
Create a virtual environment

Windows PowerShell:

python -m venv .venv
.\.venv\Scripts\Activate.ps1
Install dependencies
pip install -r requirements.txt
12. Dataset Setup

Download the official Construction-PPE dataset from the Ultralytics dataset source.

Dataset documentation:

https://docs.ultralytics.com/datasets/detect/construction-ppe

The dataset should provide the following structure:

construction-ppe/
├── images/
│   ├── train/
│   ├── val/
│   └── test/
├── labels/
│   ├── train/
│   ├── val/
│   └── test/
└── data.yaml

The repository's dataset configuration should be updated to point to the local dataset directory before training/evaluation.

13. Training

Training code is available at:

training/train.py

Run:

python training/train.py

The training configuration reproduces the submitted model setup:

RT-DETR-L
30 epochs
640 × 640
batch size 4
NVIDIA Tesla T4
patience 8

The resulting best checkpoint is saved as:

models/best.pt
14. Evaluation

Evaluation code is available at:

training/evaluate.py

Run:

python training/evaluate.py

The evaluation script evaluates the final model on the held-out test split.

The submitted test results are:

Precision:   62.41%
Recall:      57.45%
mAP@50:      57.52%
mAP@50-95:   29.29%
15. Running the API

Start the FastAPI server:

python -m uvicorn app.main:app --host 127.0.0.1 --port 8000

Open Swagger:

http://127.0.0.1:8000/docs

The Swagger interface can be used to upload an image and test both endpoints interactively.

16. Testing

Automated tests are provided in:

tests/test_reason.py

Run:

$env:PYTHONPATH="."
python -m pytest -q tests/test_reason.py

Current result:

7 passed

The tests cover:

Visual question routing
PPE presence routing
Unsupported-question rejection
Helmet counting
Low-confidence evidence filtering
Insufficient-information behavior
Explicit no_helmet reasoning
17. Project Structure
RAP_TASK/
│
├── app/
│   ├── __init__.py
│   └── main.py
│
├── models/
│   └── best.pt
│
├── training/
│   ├── train.py
│   └── evaluate.py
│
├── tests/
│   └── test_reason.py
│
├── failure_cases/
│   └── README.md
│
├── construction-ppe.yaml
├── README.md
├── MEMO.md
├── METRICS.md
├── requirements.txt
├── Dockerfile
└── .gitignore
18. Docker

A Dockerfile is included for containerized deployment.

Build:

docker build -t ppe-reasoning-api .

Run:

docker run -p 8000:8000 ppe-reasoning-api

Then open:

http://localhost:8000/docs
19. Limitations

The current system has several limitations:

Small PPE objects can be difficult to detect.
Occlusion can hide important PPE features.
Blur and poor image quality reduce detection reliability.
Rare non-compliance classes have limited examples.
Some visually or semantically related classes can be confused.
A missing detection does not necessarily mean the object is absent.
The reasoning layer intentionally refuses to make unsupported conclusions.
20. Future Improvements

Potential improvements include:

Collecting more diverse construction-site images.
Increasing representation of rare no_* classes.
Higher-resolution training.
Targeted augmentation for blur and occlusion.
Improved person-to-PPE spatial association.
More detailed per-class confusion analysis.
Better production logging and monitoring.
Cloud/server deployment.
More extensive end-to-end testing.
21. Reproducibility Summary
Dataset:
Ultralytics Construction-PPE

Images:
1,416

Split:
1,132 train / 143 validation / 141 test

Model:
RT-DETR-L

Epochs:
30

Image size:
640 × 640

Batch:
4

GPU:
NVIDIA Tesla T4

Ultralytics:
8.4.149

Final checkpoint:
models/best.pt

Test mAP@50:
57.52%

Test mAP@50-95:
29.29%

Test Precision:
62.41%

Test Recall:
57.45%

The exact wall-clock training duration was not retained from the original Colab training session, so no estimated training time is reported.

22. Repository

GitHub:

https://github.com/Abiraminesamani/RAP_TASK