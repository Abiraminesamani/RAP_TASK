
# Model Evaluation

## Test Set Results

The final RT-DETR-L model was evaluated on the held-out test split.

| Metric | Test Result |
|---|---:|
| Precision | 0.6241 |
| Recall | 0.5745 |
| mAP@50 | 0.5752 |
| mAP@50-95 | 0.2929 |

## Interpretation

The model achieves moderate overall detection performance on the held-out test set.

The validation results were stronger than the final test results, indicating some generalization limitations.

Aggregate metrics do not represent uniform performance across all classes. Rare non-compliance classes have fewer examples and are more difficult to detect reliably.

Observed failure modes include:

1. Small PPE objects
2. Occlusion
3. Blur and low image quality
4. Class confusion and overlapping detections
5. Rare non-compliance classes and class imbalance

The reasoning layer therefore applies a confidence threshold and does not treat absence of a detection as proof of absence.
