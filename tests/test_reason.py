def test_count_question():
    question = "How many helmets are there?"
    assert "helmet" in question.lower()


def test_unsupported_question():
    question = "What is the weather?"
    supported_keywords = [
        "how many",
        "count",
        "is there",
        "are there",
        "helmet",
        "vest",
        "glove",
        "boot",
        "goggle",
        "person",
        "worker",
    ]

    assert not any(k in question.lower() for k in supported_keywords)
