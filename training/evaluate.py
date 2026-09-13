from pathlib import Path

from ultralytics import RTDETR


ROOT = Path(__file__).resolve().parents[1]

MODEL = ROOT / "models" / "best.pt"
DATA = ROOT / "construction-ppe.yaml"


def main():
    if not MODEL.exists():
        raise FileNotFoundError(f"Model not found: {MODEL}")

    if not DATA.exists():
        raise FileNotFoundError(f"Dataset configuration not found: {DATA}")

    model = RTDETR(str(MODEL))

    results = model.val(
        data=str(DATA),
        split="test",
        imgsz=640,
        batch=4,
        device=0,
        plots=True,
    )

    print("\nTest Set Results")
    print(f"Precision: {results.box.mp:.4f}")
    print(f"Recall: {results.box.mr:.4f}")
    print(f"mAP@50: {results.box.map50:.4f}")
    print(f"mAP@50-95: {results.box.map:.4f}")


if __name__ == "__main__":
    main()