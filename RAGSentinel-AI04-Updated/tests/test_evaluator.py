import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend"))
from evaluator import evaluate

def test_no_evidence_is_flagged():
    out = evaluate("Why does retrieval fail?", [], search_errors=["timeout"])
    assert out["status"] == "NO EVIDENCE"
    assert out["metrics"]["sources_found"] == 0
    assert out["failures"][0]["type"] == "Retrieval unavailable"

def test_sources_have_domains_and_metrics():
    rows = [
        {"title":"Retrieval augmented generation overview", "url":"https://a.example/rag", "snippet":"RAG retrieves external documents to ground generation."},
        {"title":"RAG documentation", "url":"https://b.example/docs", "snippet":"Retrieval augmented generation uses retrieved context."},
    ]
    out = evaluate("What is retrieval augmented generation?", rows)
    assert out["metrics"]["sources_found"] == 2
    assert out["metrics"]["distinct_domains"] == 2
    assert 0 <= out["metrics"]["risk_index"] <= 100

def test_target_retrieval_and_generator_diagnosis():
    target = {"answer":"It retrieves documents and generates an answer.", "contexts":[{"text":"The retriever selects documents relevant to the question."}]}
    out = evaluate("How does retrieval work?", [], target=target)
    assert out["target_rag"] is True
    assert out["retriever_diagnosis"]["available"] is True
    assert out["generator_diagnosis"]["answer_found"] is True
