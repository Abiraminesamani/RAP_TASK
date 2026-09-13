# Technical Memo — Constrained Object Detection & Reasoning API

## 1. Domain and Objective

This project addresses **construction-site PPE compliance** using object detection and lightweight visual reasoning. The system detects PPE items and explicit non-compliance classes from construction images, exposes the detector through FastAPI, and answers natural-language questions using structured detection results.

The implementation uses **RT-DETR-L** fine-tuned on the Construction-PPE dataset and a single handwritten intent-routing layer. No multi-agent framework is used.

---

## 2. Dataset and Labeling

The project uses the official Ultralytics **Construction-PPE** dataset.

Source:
https://docs.ultralytics.com/datasets/detect/construction-ppe

The dataset contains **1,416 images** with YOLO-format bounding-box annotations:

| Split | Images |
|---|---:|
| Train | 1,132 |
| Validation | 143 |
| Test | 141 |

The 11 classes are:

`helmet, gloves, vest, boots, goggles, none, Person, no_helmet, no_goggle, no_gloves, no_boots`

The explicit PPE violation classes (`no_helmet`, `no_goggle`, `no_gloves`, `no_boots`) provide the required non-COCO detection component.

The predefined train/validation/test split was retained rather than creating a new random split. This preserves the dataset's held-out test set for final evaluation.

---

## 3. Model and Training

Model: **RT-DETR-L**

Training configuration:

- Epochs: 30
- Image size: 640 × 640
- Batch size: 4
- Patience: 8
- Workers: 2
- Hardware: NVIDIA Tesla T4 GPU
- Ultralytics: 8.4.149
- PyTorch: 2.11.0+cu128
- Python: 3.13.15

The best trained checkpoint is stored as:

`models/best.pt`

Training code: `training/train.py`

Evaluation code: `training/evaluate.py`

---

## 4. Held-Out Test Results

The final model was evaluated on the **141-image held-out test split**.

| Metric | Test Result |
|---|---:|
| Precision | 62.41% |
| Recall | 57.45% |
| mAP@50 | 57.52% |
| mAP@50-95 | 29.29% |

The test results are reported as the primary performance numbers rather than selecting the stronger validation result.

Performance is stronger for common classes such as `Person`, `helmet`, `vest`, `gloves`, `boots`, and `goggles`, while rare violation classes are substantially more difficult.

### Confusion behavior

The main confusion behavior occurs around `none` and the rare PPE-violation classes. Small objects, occlusion, overlapping detections, and class imbalance contribute to these errors.

The `no_boots` class is particularly difficult because it has very few validation examples.

---

## 5. Failure Cases and Root Causes

### 1. Small PPE objects
Small helmets, gloves, goggles, or boots can be missed because the object occupies a small visual region after resizing.

**Mitigation:** higher-resolution training, more small-object examples, and targeted augmentation.

### 2. Occlusion
PPE partially hidden by people or other objects can be missed because only part of the visual evidence is visible.

**Mitigation:** realistic occlusion examples and augmentation.

### 3. Blur / low image quality
Blurred or low-resolution images remove important visual features.

**Mitigation:** include low-quality examples and blur-related augmentation.

### 4. Class confusion / overlapping detections
PPE objects can overlap or have visually similar regions, producing incorrect or duplicate-looking detections.

**Mitigation:** inspect confusing examples, improve class balance, and tune confidence/NMS behavior.

### 5. Rare non-compliance classes
`no_helmet`, `no_goggle`, `no_gloves`, and `no_boots` have weaker performance due to class imbalance and limited examples.

**Mitigation:** collect more violation examples, rebalance the data, and use targeted augmentation.

Detailed analysis is available in `failure_cases/README.md`.

---

## 6. Reasoning and Routing

The `/reason` endpoint uses one **handwritten intent-routing layer**.

For example:

`How many helmets are there?`

is routed to the visual detector.

The detector produces structured evidence:

```text
class + confidence + bounding box
