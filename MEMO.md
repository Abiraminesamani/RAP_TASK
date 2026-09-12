
# Construction PPE Detection & Reasoning API

## 1. Problem and Domain

This project addresses construction-site safety by detecting personal protective equipment (PPE) from images. The objective is to identify workers and PPE objects and provide a simple reasoning interface for questions about the detected objects.

The selected domain is useful because safety monitoring requires identifying both PPE presence and non-compliance cases.

## 2. Dataset

The Construction-PPE dataset was used for training and evaluation. The dataset contains multiple PPE and non-compliance classes including helmet, gloves, vest, boots, goggles, Person, no_helmet, no_goggle, no_gloves and no_boots.

The dataset provides separate training, validation and test splits.

## 3. Model and Training

RT-DETR-L was selected because it provides an end-to-end object detection architecture suitable for real-time-oriented detection.

Training configuration:

- RT-DETR-L pretrained checkpoint
- 30 epochs
- Image size: 640
- Batch size: 4
- NVIDIA Tesla T4 GPU
- Early stopping patience: 8

The final trained checkpoint is stored as:

`models/best.pt`

## 4. Evaluation

Overall validation performance:

| Metric | Result |
|---|---:|
| Precision | 0.640 |
| Recall | 0.636 |
| mAP@50 | 0.636 |
| mAP@50-95 | 0.304 |

Strong classes included Person, helmet, vest, gloves and boots.

Performance was weaker for rare non-compliance classes. This demonstrates that aggregate mAP does not fully describe model reliability.

## 5. Failure Cases

Five major failure modes were identified:

1. Small PPE objects
2. Occlusion
3. Blur and low image quality
4. Class confusion and overlapping detections
5. Rare non-compliance classes / class imbalance

The likely root causes and mitigation strategies are documented in `failure_cases/README.md`.

## 6. Reasoning Layer

The `/reason` endpoint contains a handwritten intent router.

Questions such as:

- "How many helmets are there?"
- "How many people are there?"
- "Are there safety vests?"
- "Is anyone without a helmet?"

are routed to the detector.

The reasoning layer operates on structured detector outputs rather than directly guessing from the image.

The system does not infer absence from a missing detection.

For example, if an explicit `no_helmet` detection is not found, the system can return:

"Insufficient information"

instead of claiming that everyone is wearing a helmet.

## 7. API

### `/detect`

Accepts an image and returns:

- class
- confidence
- bounding box

### `/reason`

Accepts:

- image
- natural-language question

and returns:

- detected intent
- reasoning result
- detector evidence

## 8. Insufficient Information Example

Question:

"What is the weather?"

Response:

"Insufficient information: this question cannot be answered from the PPE detector."

This prevents unsupported answers and demonstrates the confidence/knowledge boundary of the system.

## 9. Reproducibility

The repository contains:

- training script
- evaluation script
- FastAPI implementation
- requirements
- model checkpoint
- failure analysis
- API examples
