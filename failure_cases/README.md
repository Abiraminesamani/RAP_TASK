
# Failure Case Analysis

## 1. Small PPE Objects

### Observation
Small helmets, gloves, goggles or boots can be difficult to detect when they occupy only a small number of pixels.

### Root Cause
Object detection performance decreases when the target occupies a very small region of the image.

### Impact
Small PPE objects may be missed or receive low confidence.

### Possible Mitigation
Higher-resolution inference, additional small-object training examples, and targeted augmentation.

---

## 2. Occlusion

### Observation
PPE objects can be partially hidden by people, equipment or other objects.

### Root Cause
The detector receives incomplete visual information.

### Impact
The model may miss PPE or produce inaccurate bounding boxes.

### Possible Mitigation
Increase training examples containing occluded PPE and use augmentation that represents realistic occlusion.

---

## 3. Blur and Image Quality

### Observation
Motion blur or low-resolution images can reduce detection quality.

### Root Cause
Important visual features such as helmet edges and glove boundaries become less distinguishable.

### Impact
Lower confidence or missed detections.

### Possible Mitigation
Include blurred/low-quality samples during training and use appropriate image preprocessing.

---

## 4. Class Confusion / Overlapping Detections

### Observation
Some predictions contain overlapping or visually ambiguous classes such as `none` together with PPE detections.

### Root Cause
Similar visual regions and limited examples for some classes can make classification difficult.

### Impact
False positives or incorrect class assignments.

### Possible Mitigation
Improve class balance, inspect confusing training examples, and tune confidence/NMS behavior.

---

## 5. Rare Non-Compliance Classes

### Observation
Classes such as `no_boots`, `no_gloves` and `no_goggle` have substantially fewer validation instances than major classes such as Person and helmet.

### Root Cause
Class imbalance and limited examples.

### Impact
The detector performs considerably worse on rare non-compliance classes.

### Possible Mitigation
Collect additional examples for rare classes, rebalance the dataset, and perform targeted augmentation.

---

## Important Reasoning Limitation

The reasoning layer does not assume that absence of a detection means absence of the object.

For example:

"If no helmet was detected" does NOT automatically mean:

"Everyone is without a helmet."

Similarly:

"If a helmet was detected" does NOT automatically prove:

"Every person is wearing a helmet."

The reasoning layer therefore returns "Insufficient information" when the detector does not provide sufficiently reliable evidence.
