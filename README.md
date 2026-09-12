
# Construction PPE Detection & Reasoning API

An RT-DETR-L based object detection and reasoning API for construction-site PPE monitoring.

## 1. Problem

Construction safety monitoring requires identifying workers and their personal protective equipment (PPE).

This project detects PPE objects and provides a natural-language reasoning endpoint that answers questions using the detector's structured outputs.

## 2. Model

Model: RT-DETR-L

Training:

- Epochs: 30
- Image size: 640
- Batch size: 4
- GPU: NVIDIA Tesla T4
- Early stopping patience: 8

## 3. Dataset

Dataset: Construction-PPE

The dataset contains PPE and non-compliance classes including:

- helmet
- gloves
- vest
- boots
- goggles
- none
- Person
- no_helmet
- no_goggle
- no_gloves
- no_boots

Dataset configuration is included as:

`construction-ppe.yaml`

## 4. Architecture

```text
                 Input Image
                      |
                      v
                  RT-DETR-L
                      |
                      v
             Structured Detections
                      |
             +--------+--------+
             |                 |
             v                 v
          /detect           /reason
                               |
                               v
                    Handwritten Intent Router
                               |
                               v
                    RT-DETR Structured Output
                               |
                               v
                    Deterministic Reasoning
                               |
                               v
                     Confidence Guardrail
                               |
                               v
                       Natural Language
