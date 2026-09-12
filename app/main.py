
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from ultralytics import RTDETR
from PIL import Image
from pathlib import Path
import io


# =========================================================
# APP CONFIGURATION
# =========================================================

app = FastAPI(
    title="Construction PPE Detection & Reasoning API",
    description="RT-DETR based PPE detection with handwritten reasoning",
    version="1.0.0"
)

MODEL_PATH = Path(__file__).resolve().parent.parent / "models" / "best.pt"

# Load trained RT-DETR model
model = RTDETR(str(MODEL_PATH))

# Confidence threshold for reasoning
REASONING_CONFIDENCE = 0.50


# =========================================================
# DETECTION FUNCTION
# =========================================================

def run_detection(image):

    results = model.predict(
        source=image,
        imgsz=640,
        conf=0.25,
        device=0,
        verbose=False
    )

    result = results[0]

    detections = []

    if result.boxes is not None:

        for box in result.boxes:

            class_id = int(box.cls[0])
            confidence = float(box.conf[0])

            x1, y1, x2, y2 = box.xyxy[0].tolist()

            detections.append({
                "class": model.names[class_id],
                "confidence": round(confidence, 3),
                "bbox": [
                    round(x1, 2),
                    round(y1, 2),
                    round(x2, 2),
                    round(y2, 2)
                ]
            })

    return detections


# =========================================================
# HANDWRITTEN INTENT ROUTER
# =========================================================

def route_question(question):

    q = question.lower().strip()

    # Visual questions
    visual_keywords = [
        "how many",
        "count",
        "number of",
        "is there",
        "are there",
        "do you see",
        "does the image",
        "detect",
        "visible",
        "wearing",
        "helmet",
        "vest",
        "glove",
        "boot",
        "goggle",
        "person",
        "people",
        "worker"
    ]

    if any(keyword in q for keyword in visual_keywords):
        return "visual"

    # Everything else is unsupported
    return "unsupported"


# =========================================================
# FIND TARGET CLASS
# =========================================================

def find_class(question):

    q = question.lower()

    # Person
    if "person" in q or "people" in q or "worker" in q:
        return "Person"

    # Helmet
    if "helmet" in q:
        if (
            "without" in q
            or "no helmet" in q
            or "no-helmet" in q
            or "not wearing" in q
        ):
            return "no_helmet"

        return "helmet"

    # Vest
    if "vest" in q:
        return "vest"

    # Gloves
    if "glove" in q:
        if (
            "without" in q
            or "no glove" in q
            or "not wearing" in q
        ):
            return "no_gloves"

        return "gloves"

    # Goggles
    if "goggle" in q:
        if (
            "without" in q
            or "no goggle" in q
            or "not wearing" in q
        ):
            return "no_goggle"

        return "goggles"

    # Boots
    if "boot" in q:
        if (
            "without" in q
            or "no boot" in q
            or "not wearing" in q
        ):
            return "no_boots"

        return "boots"

    return None


# =========================================================
# DETERMINISTIC REASONING
# =========================================================

def reason_over_detections(question, detections):

    q = question.lower().strip()

    # Only use sufficiently confident detections
    reliable = [
        detection
        for detection in detections
        if detection["confidence"] >= REASONING_CONFIDENCE
    ]


    # -----------------------------------------------------
    # 1. HELMET COMPLIANCE
    # -----------------------------------------------------

    helmet_violation = (
        "without helmet" in q
        or "without a helmet" in q
        or "no helmet" in q
        or "no-helmet" in q
        or "not wearing helmet" in q
        or "not wearing a helmet" in q
        or (
            "anyone without" in q
            and "helmet" in q
        )
    )

    if helmet_violation:

        matching = [
            detection
            for detection in reliable
            if detection["class"] == "no_helmet"
        ]

        if matching:

            return {
                "answer": (
                    f"Yes. I detected {len(matching)} "
                    f"no-helmet instance(s)."
                ),
                "evidence": matching
            }

        return {
            "answer": (
                "Insufficient information: I did not find a "
                "sufficiently confident explicit no-helmet detection, "
                "so I will not assume that everyone is wearing a helmet."
            ),
            "evidence": []
        }


    # -----------------------------------------------------
    # 2. COUNT QUESTIONS
    # -----------------------------------------------------

    is_count_question = any(
        keyword in q
        for keyword in [
            "how many",
            "count",
            "number of"
        ]
    )

    if is_count_question:

        target_class = find_class(question)

        if target_class is None:

            return {
                "answer": (
                    "Insufficient information: I can count supported "
                    "PPE and person classes, but I could not determine "
                    "which object you are asking about."
                ),
                "evidence": []
            }

        matching = [
            detection
            for detection in reliable
            if detection["class"] == target_class
        ]

        count = len(matching)

        readable_name = target_class.replace("_", " ")

        return {
            "answer": (
                f"I detected {count} {readable_name}."
            ),
            "evidence": matching
        }


    # -----------------------------------------------------
    # 3. PRESENCE QUESTIONS
    # -----------------------------------------------------

    is_presence_question = any(
        keyword in q
        for keyword in [
            "is there",
            "are there",
            "do you see",
            "visible"
        ]
    )

    if is_presence_question:

        target_class = find_class(question)

        if target_class is None:

            return {
                "answer": (
                    "Insufficient information: the requested object "
                    "is not a supported detection class."
                ),
                "evidence": []
            }

        matching = [
            detection
            for detection in reliable
            if detection["class"] == target_class
        ]

        readable_name = target_class.replace("_", " ")

        if matching:

            return {
                "answer": (
                    f"Yes. I detected {len(matching)} "
                    f"{readable_name}."
                ),
                "evidence": matching
            }

        # Absence of detection is NOT proof of absence
        return {
            "answer": (
                f"I cannot confidently determine whether a "
                f"{readable_name} is present because no sufficiently "
                f"confident detection was found."
            ),
            "evidence": []
        }


    # -----------------------------------------------------
    # 4. UNSUPPORTED VISUAL QUESTION
    # -----------------------------------------------------

    return {
        "answer": (
            "Insufficient information: I cannot reliably answer "
            "that question from the detector's structured outputs."
        ),
        "evidence": []
    }


# =========================================================
# ROOT ENDPOINT
# =========================================================

@app.get("/")
def root():

    return {
        "message": "Construction PPE Detection & Reasoning API",
        "status": "running"
    }


# =========================================================
# DETECTION ENDPOINT
# =========================================================

@app.post("/detect")
async def detect(
    file: UploadFile = File(...)
):

    # Validate image
    if (
        not file.content_type
        or not file.content_type.startswith("image/")
    ):

        raise HTTPException(
            status_code=400,
            detail="Please upload an image file."
        )

    try:

        contents = await file.read()

        image = Image.open(
            io.BytesIO(contents)
        ).convert("RGB")

        detections = run_detection(image)

        return {
            "success": True,
            "image_width": image.width,
            "image_height": image.height,
            "detections": detections,
            "count": len(detections)
        }

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=str(error)
        )


# =========================================================
# REASONING ENDPOINT
# =========================================================

@app.post("/reason")
async def reason(
    question: str = Form(...),
    file: UploadFile = File(...)
):

    # Validate image
    if (
        not file.content_type
        or not file.content_type.startswith("image/")
    ):

        raise HTTPException(
            status_code=400,
            detail="Please upload an image file."
        )

    try:

        # -------------------------------------------------
        # STEP 1: HANDWRITTEN ROUTING
        # -------------------------------------------------

        intent = route_question(question)


        # -------------------------------------------------
        # STEP 2: UNSUPPORTED QUESTION
        # -------------------------------------------------

        if intent == "unsupported":

            return {
                "success": True,
                "question": question,
                "intent": intent,
                "answer": (
                    "Insufficient information: this question "
                    "cannot be answered from the PPE detector."
                ),
                "detections_used": []
            }


        # -------------------------------------------------
        # STEP 3: READ IMAGE
        # -------------------------------------------------

        contents = await file.read()

        image = Image.open(
            io.BytesIO(contents)
        ).convert("RGB")


        # -------------------------------------------------
        # STEP 4: RUN RT-DETR
        # -------------------------------------------------

        detections = run_detection(image)


        # -------------------------------------------------
        # STEP 5: REASON OVER STRUCTURED OUTPUT
        # -------------------------------------------------

        reasoning = reason_over_detections(
            question,
            detections
        )


        # -------------------------------------------------
        # STEP 6: RETURN ANSWER
        # -------------------------------------------------

        return {
            "success": True,
            "question": question,
            "intent": intent,
            "answer": reasoning["answer"],
            "detections_used": reasoning["evidence"]
        }


    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=str(error)
        )
