# Model Evaluation

## Held-Out Test Set

The final RT-DETR-L model was evaluated on the **held-out Construction-PPE test split** containing 141 images.

| Metric | Test Result |
|---|---:|
| Precision | 62.41% |
| Recall | 57.45% |
| mAP@50 | 57.52% |
| mAP@50-95 | 29.29% |

These held-out test results are the primary performance numbers reported for the project.

---

## Validation Results

The validation split produced:

| Metric | Validation Result |
|---|---:|
| Precision | 64.0% |
| Recall | 63.6% |
| mAP@50 | 63.6% |
| mAP@50-95 | 30.4% |

The stronger validation performance compared with the held-out test set indicates some generalization limitations.

---

## Class-Level Validation Behavior

The validation results showed stronger performance for common classes:

| Class | Validation mAP@50 |
|---|---:|
| Person | 93.8% |
| goggles | 89.8% |
| vest | 86.6% |
| gloves | 85.3% |
| helmet | 85.1% |
| boots | 82.7% |
| none | 61.0% |
| no_helmet | 56.3% |
| no_goggle | 28.4% |
| no_gloves | 25.6% |

The `no_boots` class was particularly weak because of the very small number of validation examples.

These class-level results show why aggregate mAP should not be interpreted as uniform performance across all PPE classes.

---

## Confusion Behavior

The main confusion behavior observed during evaluation was concentrated around:

- `none`
- `no_helmet`
- `no_goggle`
- `no_gloves`
- `no_boots`

Common causes include:

1. Small PPE regions
2. Partial occlusion
3. Blur and low image quality
4. Overlapping objects
5. Class imbalance
6. Visual ambiguity between PPE presence and non-compliance

The rare non-compliance classes are substantially harder than common PPE classes.

---

## Failure Modes

### 1. Small PPE Objects

Small helmets, gloves, goggles, or boots can be missed because they occupy only a small region of the image.

**Root cause:** insufficient visual resolution after resizing.

**Mitigation:** higher input resolution, additional small-object examples, and targeted augmentation.

### 2. Occlusion

Partially hidden PPE can be missed.

**Root cause:** incomplete visual evidence.

**Mitigation:** realistic occlusion examples and augmentation.

### 3. Blur / Low Image Quality

Blurred images can produce lower-confidence or missed detections.

**Root cause:** important visual features are lost.

**Mitigation:** include low-quality training samples and blur augmentation.

### 4. Class Confusion / Overlapping Detections

Overlapping or visually similar objects can produce incorrect or duplicate-looking detections.

**Root cause:** similar visual regions and spatial overlap.

**Mitigation:** inspect confusing samples, improve class balance, and tune confidence/NMS behavior.

### 5. Rare Non-Compliance Classes

`no_helmet`, `no_goggle`, `no_gloves`, and `no_boots` are harder to detect.

**Root cause:** class imbalance and limited examples.

**Mitigation:** collect additional examples, rebalance the dataset, and use targeted augmentation.

---

## Confidence Guardrail

The reasoning layer uses a confidence threshold of:

```text
0.50
