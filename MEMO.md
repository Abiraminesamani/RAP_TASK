# Constrained Object Detection & Reasoning API — Technical Memo

## 1. Domain and Dataset

**Domain:** Construction-site PPE safety monitoring.

The system detects workers and PPE/non-compliance categories from construction-site images and exposes the detector through a FastAPI service. I selected this domain because PPE compliance is a practical computer-vision safety problem and the dataset contains explicit non-compliance classes such as `no_helmet`, `no_goggle`, `no_gloves`, and `no_boots`.

**Dataset:** Ultralytics Construction-PPE dataset.

**Source:** Ultralytics official Construction-PPE dataset:
https://docs.ultralytics.com/datasets/detect/construction-ppe

The dataset contains **1,416 images** with predefined splits:

- Train: **1,132 images**
- Validation: **143 images**
- Test: **141 images**

The dataset provides YOLO-format bounding-box annotations, where each object is represented by a class label and normalized bounding-box coordinates. I used the provided annotations without relabeling the dataset.

I retained the provided train/validation/test split instead of reshuffling the data. The test split was kept separate from training and used only for final held-out evaluation.

**Classes (11):**

`helmet`, `gloves`, `vest`, `boots`, `goggles`, `none`, `Person`,
`no_helmet`, `no_goggle`, `no_gloves`, `no_boots`.

The explicit `no_*` classes provide non-COCO safety/compliance targets and enable evidence-based reasoning about detected non-compliance.

---

## 2. Model and Training

I fine-tuned a pretrained **RT-DETR-L** detector using the Ultralytics implementation.

**Training configuration:**

- Model: `rtdetr-l.pt`
- Epochs: **30**
- Image size: **640 × 640**
- Batch size: **4**
- Device: **NVIDIA Tesla T4 GPU**
- Workers: **2**
- Early stopping patience: **8**
- Framework: **Ultralytics 8.4.149**
- Training environment: **Google Colab**
- Python environment: Python 3.x with CUDA-enabled PyTorch

The final checkpoint is stored in the repository at:

`models/best.pt`

The exact wall-clock training duration was not retained from the Colab training session, so I do not report an invented value. The training configuration and hardware are documented above and the complete training procedure is provided in `training/train.py`.

---

## 3. Evaluation

The final model was evaluated on the **held-out test split** rather than reporting only training or validation performance.

| Metric | Test Result |
|---|---:|
| Precision | **62.41%** |
| Recall | **57.45%** |
| mAP@50 | **57.52%** |
| mAP@50–95 | **29.29%** |

These results indicate moderate overall detection performance on the held-out test set.

The metrics do not imply uniform performance across all classes. Rare non-compliance classes are substantially harder to detect because they have fewer examples. The model also showed confusion and overlap behavior in some images, including low-confidence duplicate detections and confusion involving the `none` and `no_*` categories.

Therefore, the downstream reasoning layer does not treat every raw detection as equally reliable. It filters detections using a confidence threshold before using them as reasoning evidence.

The held-out test results are the primary results reported for the submitted model.

---

## 4. Failure Cases and Root Causes

Five representative failure modes were identified from model evaluation and prediction inspection.

### 1. Small PPE objects

**Observation:** Helmets, gloves, goggles, or boots may occupy only a small region of the image.

**Root cause:** Small visual regions contain fewer pixels and less discriminative information, making localization and classification harder.

**Mitigation:** Train at higher image resolution, collect more small-object examples, and apply targeted augmentation.

### 2. Occlusion

**Observation:** PPE can be partially hidden by people, construction equipment, or other objects.

**Root cause:** The detector may receive only partial visual evidence for the object.

**Mitigation:** Include more realistically occluded training examples and use augmentation that improves robustness to partial visibility.

### 3. Blur / low image quality

**Observation:** Motion blur and low-quality images can produce weak or incorrect detections.

**Root cause:** Blur removes visual features needed for accurate object localization and classification.

**Mitigation:** Include blurred and degraded examples during training and improve robustness using targeted image-quality augmentation.

### 4. Class confusion / overlapping detections

**Observation:** Some predictions contain overlapping or low-confidence duplicate detections, and visually or semantically related classes can be confused.

**Root cause:** Similar visual appearance, overlapping objects, and ambiguous image regions can make classification difficult.

**Mitigation:** Perform class-specific error analysis, improve class balance, and tune confidence/NMS behavior where appropriate.

### 5. Rare non-compliance classes

**Observation:** Classes such as `no_boots`, `no_gloves`, `no_goggle`, and `no_helmet` are harder to detect reliably.

**Root cause:** These classes have fewer examples and represent relatively specific visual conditions, creating class imbalance and limited training evidence.

**Mitigation:** Collect additional examples for rare classes, rebalance the dataset where possible, and use targeted augmentation.

Detailed failure-case analysis is provided in:

`failure_cases/README.md`

---

## 5. Reasoning Layer

The second endpoint implements a **single handwritten decision layer** without LangChain, LangGraph, CrewAI, AutoGen, or another agentic framework.

The reasoning pipeline is:

**Natural-language question → handwritten intent router → detector if required → confidence filtering → structured evidence → reasoning → plain-language answer**

The handwritten router first determines whether the question is related to information that can be answered from the PPE detector.

For visual questions, the application calls the RT-DETR detector and converts the result into structured evidence containing:

- detected class
- confidence score
- bounding box

A reasoning confidence threshold of **0.50** is applied before detections are used as reliable evidence.

For example, a question such as:

`How many helmets are there?`

is routed to the visual path, the detector is executed, and reliable `helmet` detections are counted.

For an unrelated question such as:

`What is the weather today?`

the router returns `unsupported` and the detector is not called.

An optional LLM reasoning path is implemented to reason over the structured detector output. The LLM is constrained to use detector evidence rather than inventing visual information. If the LLM is unavailable or an API failure occurs, the application falls back to deterministic evidence-based reasoning.

During local validation, the deterministic fallback path was used because the configured OpenAI API account had exhausted its available quota. The fallback still enforces the same evidence-based confidence guardrails.

### Insufficient-information example

Question:

`Is anyone without a helmet?`

If the detector does not produce a sufficiently confident explicit `no_helmet` detection, the system returns:

> Insufficient information: I did not find a sufficiently confident explicit no-helmet detection, so I will not assume that everyone is wearing a helmet.

This is intentional. The system does **not** treat the absence of a `no_helmet` detection as proof that everyone is wearing a helmet.

This prevents the reasoning layer from making an unsupported safety/compliance claim.

---

## 6. API Usage

The application provides two FastAPI endpoints: `/detect` for object detection and `/reason` for natural-language reasoning over image evidence.

### 6.1 Detection Endpoint

**POST `/detect`**

The endpoint accepts an image using multipart form data.

Example request:

```text
POST /detect

Content-Type: multipart/form-data

file = construction_site.jpg
Example response:

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

The response contains the image dimensions, detected class names, confidence scores, bounding boxes, and total number of raw detections.

6.2 Reasoning Endpoint

POST /reason

The endpoint accepts an image and a natural-language question.

Example request:

POST /reason

Content-Type: multipart/form-data

file = construction_site.jpg
question = How many helmets are there?

Example response:

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

Another example:

Question:
Are there any goggles?

Example response:

{
  "success": true,
  "question": "Are there any goggles?",
  "intent": "visual",
  "answer": "Yes. I detected 1 pair of goggles.",
  "detections_used": [
    {
      "class": "goggles",
      "confidence": 0.640,
      "bbox": [326.12, 173.12, 440.53, 212.67]
    }
  ],
  "reasoning_source": "deterministic_fallback"
}

For an unsupported question such as:

What is the weather today?

the handwritten router rejects the request before detector execution and returns an insufficient/unsupported response.

7. Running the API

Create and activate the Python virtual environment, install the dependencies, and start the FastAPI application.

Example:

python -m venv .venv

Windows PowerShell:

.\.venv\Scripts\Activate.ps1

Install dependencies:

pip install -r requirements.txt

Start the API:

python -m uvicorn app.main:app --host 127.0.0.1 --port 8000

Interactive Swagger documentation is available at:

http://127.0.0.1:8000/docs

The same API can also be run using the included Dockerfile.

8. Reproducibility

The repository contains the source code required to reproduce the main workflow:

training/train.py — RT-DETR training
training/evaluate.py — test-set evaluation
app/main.py — FastAPI detection and reasoning API
tests/test_reason.py — automated reasoning tests
models/best.pt — final trained checkpoint
requirements.txt — Python dependencies
construction-ppe.yaml — dataset configuration
failure_cases/README.md — failure analysis
Dockerfile — containerization support

The final submitted model corresponds to:

RT-DETR-L
30 epochs
640 × 640 image size
Batch size = 4
NVIDIA Tesla T4
Ultralytics 8.4.149

The model was trained using the predefined Construction-PPE train/validation/test split. The test set was not used for training and was reserved for final evaluation.

9. Limitations and Future Improvements

The current system has several limitations:

Small PPE objects can be difficult to detect.
Occlusion can hide important PPE features.
Blur and poor image quality reduce detection reliability.
Rare non-compliance classes have limited training examples.
Some visually or semantically related classes can be confused.
A missing detection does not necessarily mean the object is absent.
The reasoning layer is intentionally conservative when detector evidence is insufficient.

Potential future improvements include:

Collecting more diverse construction-site images.
Increasing representation of rare no_* classes.
Training at higher image resolution.
Applying targeted augmentation for blur, occlusion, and small objects.
Improving person-to-PPE association using spatial relationships.
Performing more detailed per-class confusion analysis.
Adding production monitoring, logging, and deployment infrastructure.

