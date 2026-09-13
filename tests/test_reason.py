from app.main import route_question, deterministic_reasoning


def test_visual_question_is_routed_to_visual():
    result = route_question("How many helmets are there?")
    assert result == "visual"


def test_ppe_presence_question_is_visual():
    result = route_question("Are there any gloves?")
    assert result == "visual"


def test_unsupported_question_is_rejected():
    result = route_question("What is the weather today?")
    assert result == "unsupported"


def test_helmet_count_reasoning():
    detections = [
        {
            "class": "helmet",
            "confidence": 0.91,
            "bbox": [10, 10, 100, 100]
        },
        {
            "class": "helmet",
            "confidence": 0.84,
            "bbox": [120, 20, 210, 110]
        },
        {
            "class": "Person",
            "confidence": 0.96,
            "bbox": [0, 0, 300, 400]
        }
    ]

    result = deterministic_reasoning(
        "How many helmets are there?",
        detections
    )

    assert "2" in result["answer"]
    assert len(result["evidence"]) == 2


def test_low_confidence_detection_is_not_used():
    detections = [
        {
            "class": "helmet",
            "confidence": 0.30,
            "bbox": [10, 10, 100, 100]
        }
    ]

    result = deterministic_reasoning(
        "How many helmets are there?",
        detections
    )

    assert result["evidence"] == []


def test_no_helmet_requires_explicit_evidence():
    detections = [
        {
            "class": "helmet",
            "confidence": 0.95,
            "bbox": [10, 10, 100, 100]
        }
    ]

    result = deterministic_reasoning(
        "Is anyone without a helmet?",
        detections
    )

    assert "Insufficient information" in result["answer"]
    assert result["evidence"] == []


def test_explicit_no_helmet_detection_is_reported():
    detections = [
        {
            "class": "no_helmet",
            "confidence": 0.88,
            "bbox": [10, 10, 100, 100]
        }
    ]

    result = deterministic_reasoning(
        "Is anyone without a helmet?",
        detections
    )

    assert "Yes" in result["answer"]
    assert len(result["evidence"]) == 1
