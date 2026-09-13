
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from ultralytics import RTDETR
from PIL import Image
from pathlib import Path
from openai import OpenAI
import io
import os
import json
import torch


# ============================================================
# APP CONFIGURATION
# ============================================================

app = FastAPI(
    title="Construction PPE Detection & Reasoning API",
    description=(
        "RT-DETR based construction PPE detection with "
        "handwritten reasoning"
    ),
    version="2.0.0"
)


# ============================================================
# MODEL CONFIGURATION
# ============================================================

MODEL_PATH = (
    Path(__file__).resolve().parent.parent
    / "models"
    / "best.pt"
)

if not MODEL_PATH.exists():
    raise FileNotFoundError(
        f"Model weights not found at: {MODEL_PATH}"
    )

model = RTDETR(str(MODEL_PATH))

# GPU if available, otherwise CPU
DEVICE = 0 if torch.cuda.is_available() else "cpu"

# Confidence threshold for reasoning
REASONING_CONFIDENCE = 0.50


# ============================================================
# LLM CONFIGURATION
# ============================================================

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

llm_client = (
    OpenAI(api_key=OPENAI_API_KEY)
    if OPENAI_API_KEY
    else None
)

LLM_MODEL = "gpt-5.6-luna"


# ============================================================
# DETECTION FUNCTION
# ============================================================

def run_detection(image):
    """
    Run RT-DETR and return structured detections.
    """

    results = model.predict(
        source=image,
        imgsz=640,
        conf=0.25,
        device=DEVICE,
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


# ============================================================
# HANDWRITTEN INTENT ROUTER
# ============================================================

def route_question(question):
    """
    Single handwritten decision layer.

    Determines whether the question requires
    image/object detection.
    """

    q = question.lower().strip()

    visual_keywords = [

        # Counting
        "how many",
        "count",
        "number of",

        # Presence
        "is there",
        "are there",
        "do you see",
        "does the image",
        "visible",

        # PPE / objects
        "wearing",
        "helmet",
        "vest",
        "glove",
        "boot",
        "goggle",
        "person",
        "people",
        "worker",

        # Object reasoning
        "most common",
        "common object",
        "which object",
        "what objects",
        "what object",
        "most frequent"
    ]

    if any(keyword in q for keyword in visual_keywords):
        return "visual"

    return "unsupported"


# ============================================================
# FIND TARGET CLASS
# ============================================================

def find_class(question):

    q = question.lower()

    # Person
    if (
        "person" in q
        or "people" in q
        or "worker" in q
    ):
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


# ============================================================
# RELIABLE DETECTIONS
# ============================================================

def get_reliable_detections(detections):

    return [
        detection
        for detection in detections
        if detection["confidence"] >= REASONING_CONFIDENCE
    ]


# ============================================================
# DETERMINISTIC FALLBACK REASONING
# ============================================================

def deterministic_reasoning(question, detections):
    """
    Safe fallback reasoning.

    This is used when:
    - OpenAI is unavailable
    - OpenAI quota is exhausted
    - LLM call fails

    It reasons only from detector output.
    """

    q = question.lower().strip()

    reliable = get_reliable_detections(detections)

    # --------------------------------------------------------
    # NO RELIABLE DETECTIONS
    # --------------------------------------------------------

    if not reliable:

        return {
            "answer": (
                "Insufficient information: no sufficiently "
                "confident detections were available."
            ),
            "evidence": [],
            "source": "deterministic_guardrail"
        }


    # --------------------------------------------------------
    # PPE VIOLATION QUESTIONS
    # --------------------------------------------------------

    violation_classes = [
        "no_helmet",
        "no_goggle",
        "no_gloves",
        "no_boots"
    ]

    for violation_class in violation_classes:

        readable = violation_class.replace("_", " ")

        if (
            violation_class == "no_helmet"
            and "helmet" in q
            and (
                "without" in q
                or "no helmet" in q
                or "no-helmet" in q
                or "not wearing" in q
            )
        ):

            matching = [
                d for d in reliable
                if d["class"] == violation_class
            ]

            if matching:

                return {
                    "answer": (
                        f"Yes. I detected {len(matching)} "
                        f"{readable} instance(s)."
                    ),
                    "evidence": matching,
                    "source": "deterministic_fallback"
                }

            return {
                "answer": (
                    "Insufficient information: I did not find "
                    "a sufficiently confident explicit "
                    "no-helmet detection, so I will not assume "
                    "that everyone is wearing a helmet."
                ),
                "evidence": [],
                "source": "deterministic_guardrail"
            }


    # --------------------------------------------------------
    # COUNT QUESTIONS
    # --------------------------------------------------------

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
                    "Insufficient information: I can count "
                    "supported PPE and person classes, but "
                    "I could not determine which object you "
                    "are asking about."
                ),
                "evidence": [],
                "source": "deterministic_fallback"
            }

        matching = [
            d for d in reliable
            if d["class"] == target_class
        ]

        # IMPORTANT:
        # No detection is NOT proof of zero objects.
        if not matching:

            return {
                "answer": (
                    "Insufficient information: no sufficiently "
                    "confident detection was found for the "
                    "requested class."
                ),
                "evidence": [],
                "source": "deterministic_guardrail"
            }

        readable_name = target_class.replace("_", " ")

        return {
            "answer": (
                f"I detected {len(matching)} "
                f"{readable_name}."
            ),
            "evidence": matching,
            "source": "deterministic_fallback"
        }


    # --------------------------------------------------------
    # PRESENCE QUESTIONS
    # --------------------------------------------------------

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
                    "Insufficient information: the requested "
                    "object is not a supported detection class."
                ),
                "evidence": [],
                "source": "deterministic_fallback"
            }

        matching = [
            d for d in reliable
            if d["class"] == target_class
        ]

        readable_name = target_class.replace("_", " ")

        if matching:

            return {
                "answer": (
                    f"Yes. I detected {len(matching)} "
                    f"{readable_name}."
                ),
                "evidence": matching,
                "source": "deterministic_fallback"
            }

        return {
            "answer": (
                f"I cannot confidently determine whether "
                f"a {readable_name} is present because no "
                f"sufficiently confident detection was found."
            ),
            "evidence": [],
            "source": "deterministic_guardrail"
        }


    # --------------------------------------------------------
    # MOST COMMON OBJECT
    # --------------------------------------------------------

    if (
        "most common" in q
        or "most frequent" in q
        or "common object" in q
        or "which object" in q
    ):

        counts = {}

        for detection in reliable:

            class_name = detection["class"]

            counts[class_name] = (
                counts.get(class_name, 0) + 1
            )

        if not counts:

            return {
                "answer": "Insufficient information.",
                "evidence": [],
                "source": "deterministic_guardrail"
            }

        most_common_class = max(
            counts,
            key=counts.get
        )

        most_common_count = counts[most_common_class]

        return {
            "answer": (
                f"The most common detected object is "
                f"{most_common_class} with "
                f"{most_common_count} detection(s)."
            ),
            "evidence": reliable,
            "source": "deterministic_fallback"
        }


    # --------------------------------------------------------
    # GENERAL FALLBACK
    # --------------------------------------------------------

    return {
        "answer": (
            "Insufficient information: I cannot reliably "
            "answer that question from the detector's "
            "structured outputs."
        ),
        "evidence": [],
        "source": "deterministic_guardrail"
    }


# ============================================================
# LLM REASONING
# ============================================================

def reason_with_llm(question, detections):
    """
    Try LLM reasoning first.

    If OpenAI is unavailable or the request fails,
    safely fall back to deterministic reasoning.
    """

    # --------------------------------------------------------
    # LLM NOT AVAILABLE
    # --------------------------------------------------------

    if llm_client is None:

        return deterministic_reasoning(
            question,
            detections
        )


    # --------------------------------------------------------
    # STRUCTURED EVIDENCE
    # --------------------------------------------------------

    evidence = [
        {
            "class": detection["class"],
            "confidence": detection["confidence"],
            "bbox": detection["bbox"]
        }
        for detection in detections
    ]


    # --------------------------------------------------------
    # PROMPT
    # --------------------------------------------------------

    prompt = f"""
You are the reasoning layer of a construction PPE
object detection system.

Answer ONLY from the detector evidence below.

User question:
{question}

Detector evidence:
{json.dumps(evidence, indent=2)}

Rules:

1. Never invent detections.

2. Never claim an object is present unless it appears
   in the detector evidence.

3. Never infer that an object is absent because it was
   not detected.

4. PPE violation classes such as no_helmet, no_goggle,
   no_gloves and no_boots require explicit detector
   evidence.

5. If the evidence is insufficient, answer:
   "Insufficient information."

6. For "how many" questions, count the matching
   detections.

7. For "most common" questions, count detector classes
   and identify the class with the highest count.

8. Keep the answer concise and in plain English.
"""


    # --------------------------------------------------------
    # CALL OPENAI
    # --------------------------------------------------------

    try:

        response = llm_client.responses.create(
            model=LLM_MODEL,
            input=prompt,
            max_output_tokens=120
        )

        answer = response.output_text.strip()

        if answer:

            return {
                "answer": answer,
                "evidence": detections,
                "source": "llm"
            }

    except Exception:
        # OpenAI quota / network / API errors
        # are handled safely by fallback reasoning.
        pass


    # --------------------------------------------------------
    # FALLBACK
    # --------------------------------------------------------

    return deterministic_reasoning(
        question,
        detections
    )


# ============================================================
# ROOT ENDPOINT
# ============================================================

@app.get("/")
def root():

    return {
        "message": "Construction PPE Detection & Reasoning API",
        "status": "running",
        "model": "RT-DETR",
        "device": str(DEVICE),
        "llm_enabled": llm_client is not None
    }


# ============================================================
# DETECTION ENDPOINT
# ============================================================

@app.post("/detect")
async def detect(
    file: UploadFile = File(...)
):

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


# ============================================================
# REASONING ENDPOINT
# ============================================================

@app.post("/reason")
async def reason(
    question: str = Form(...),
    file: UploadFile = File(...)
):

    if (
        not file.content_type
        or not file.content_type.startswith("image/")
    ):

        raise HTTPException(
            status_code=400,
            detail="Please upload an image file."
        )


    try:

        # ====================================================
        # STEP 1: HANDWRITTEN ROUTING
        # ====================================================

        intent = route_question(question)


        # ====================================================
        # STEP 2: UNSUPPORTED QUESTION
        # ====================================================

        if intent == "unsupported":

            return {
                "success": True,
                "question": question,
                "intent": intent,
                "answer": (
                    "Insufficient information: this question "
                    "cannot be answered from the PPE detector."
                ),
                "detections_used": [],
                "reasoning_source": "handwritten_router"
            }


        # ====================================================
        # STEP 3: READ IMAGE
        # ====================================================

        contents = await file.read()

        image = Image.open(
            io.BytesIO(contents)
        ).convert("RGB")


        # ====================================================
        # STEP 4: RT-DETR
        # ====================================================

        detections = run_detection(image)


        # ====================================================
        # STEP 5: CONFIDENCE GUARDRAIL
        # ====================================================

        reliable_detections = get_reliable_detections(
            detections
        )

        if not reliable_detections:

            return {
                "success": True,
                "question": question,
                "intent": intent,
                "answer": (
                    "Insufficient information: no sufficiently "
                    "confident detections were available to "
                    "answer the question."
                ),
                "detections_used": [],
                "reasoning_source": "confidence_guardrail"
            }


        # ====================================================
        # STEP 6: LLM + SAFE FALLBACK
        # ====================================================

        reasoning = reason_with_llm(
            question,
            reliable_detections
        )


        # ====================================================
        # STEP 7: FINAL RESPONSE
        # ====================================================

        return {
            "success": True,
            "question": question,
            "intent": intent,
            "answer": reasoning["answer"],
            "detections_used": reasoning["evidence"],
            "reasoning_source": reasoning["source"]
        }


    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=str(error)
        )
