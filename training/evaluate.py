
from ultralytics import RTDETR

MODEL = "../models/best.pt"
DATA = "construction-ppe.yaml"

model = RTDETR(MODEL)

results = model.val(
    data=DATA,
    split="test",
    imgsz=640,
    batch=4,
    device=0,
    plots=True
)

print("Test evaluation completed.")
print(results)
