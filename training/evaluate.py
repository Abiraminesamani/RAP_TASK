from pathlib import Path

import torch
from ultralytics import RTDETR


# Repository root
ROOT = Path(__file__).resolve().parents[1]

MODEL = ROOT / "models" / "best.pt"
DATA = ROOT / "construction-ppe.yaml"

DEVICE = 0 if torch.cuda.is_available() else "cpu"


def main():
    print(f"Model: {MODEL}")
    print(f"Dataset config: {DATA}")
    print(f"Device: {DEVICE}")

    if not MODEL.exists():
        raise FileNotFoundError(
            f"Model weights not found: {MODEL}"
        )

    if not DATA.exists():
        raise FileNotFoundError(
            f"Dataset configuration not found: {DATA}"
        )

    model = RTDETR(str(MODEL))

    results = model.val(
        data=str(DATA),
        split="test",
        imgsz=640,
        batch=4,
        device=DEVICE,
        plots=True
    )

    print("\nTest evaluation completed.")
    print(f"Precision: {results.box.mp:.4f}")
    print(f"Recall: {results.box.mr:.4f}")
    print(f"mAP@50: {results.box.map50:.4f}")
    print(f"mAP@50-95: {results.box.map:.4f}")


if __name__ == "__main__":
    main()
