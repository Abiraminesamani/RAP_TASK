
from ultralytics import RTDETR

MODEL = "rtdetr-l.pt"
DATA = "construction-ppe.yaml"

model = RTDETR(MODEL)

model.train(
    data=DATA,
    epochs=30,
    imgsz=640,
    batch=4,
    device=0,
    workers=2,
    project="runs",
    name="ppe_rtdetr",
    patience=8
)
