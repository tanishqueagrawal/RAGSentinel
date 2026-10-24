# RAGSentinel — floating desktop + browser evaluator

RAGSentinel is a local Windows prototype for the AI-04 problem statement: **RAG Evaluation Pipeline — Retriever and Generator Tested Apart**. It now supports live evidence searches, optional connection to a user's own RAG API, a labelled JSONL benchmark workflow, aggregate version-regression comparison, and per-label confusion matrices.

## What's implemented

- Draggable always-on-top Electron bubble and compact panel.
- Chrome/Edge Manifest V3 bubble for regular webpages.
- Local FastAPI service with parallel live web-search variants and transparent risk flags.
- Optional target RAG endpoint call, with retriever context checks and generator/context-overlap diagnostics shown separately.
- Optional OpenAI-compatible judge; not required for the basic flow and requires the user's own key.
- Benchmark JSONL schema validation, target-endpoint benchmark runner, per-label TP/FP/FN/TN + precision/recall/F1, and aggregate version comparison endpoint.
- Unit tests for core heuristic evaluation.

## Start on Windows

1. Extract the ZIP and open its root folder in VS Code.
2. Double-click `start.bat`. It creates `backend\\.venv`, installs backend requirements, checks whether port 8765 is already healthy, and starts the desktop app. First-time Electron install requires internet access.
3. The API health endpoint is `http://127.0.0.1:8765/health`; interactive API docs are at `http://127.0.0.1:8765/docs`.
4. To enable the browser bubble, open `chrome://extensions` or `edge://extensions`, enable Developer mode, choose **Load unpacked**, and select this project's `browser-extension` folder.

## Connect an actual RAG system (important for AI-04)

The default demo checks live web evidence; that alone is **not** a complete retriever/generator evaluation. To test your own RAG API:

1. Copy `.env.example` to `.env` in the project root.
2. Set `RAG_ENDPOINT_URL` to your RAG service's HTTP POST endpoint.
3. If needed, set `RAG_ENDPOINT_API_KEY` (sent as a Bearer token).
4. `RAG_REQUEST_TEMPLATE` defaults to `{"question": "{{question}}"}`. Change it if your API expects another JSON body, keeping `{{question}}` where the question should go.
5. The endpoint should return JSON with an answer field such as `answer`, `response`, `output`, or `text`, and retrieved chunks under `retrieved_contexts`, `contexts`, `documents`, `retrieved_documents`, or `sources`. Each chunk can be a string or an object with `text`, `content`, `page_content`, `snippet`, or `document`.
6. Restart the backend after editing `.env`. The panel will show retriever and generator diagnosis separately.

Example compatible response:

```json
{
  "answer": "RAG retrieves documents and uses them as context for generation.",
  "retrieved_contexts": [
    {"text": "A retriever selects relevant documents to provide context to a language model."}
  ]
}
```

## Benchmark workflow

The starter dataset at `backend/benchmark/demo_dataset.jsonl` has only five clearly marked demo rows. It is a schema example, **not** the required 150+ independently hand-labelled benchmark.

- `GET /api/benchmark/schema` — required JSONL fields and label examples.
- `POST /api/benchmark/validate` — validate dataset schema and count pairs.
- `POST /api/benchmark/run` — run questions against the configured target RAG endpoint with up to 10 concurrent requests; reports latency, throughput, heuristic predicted labels, and per-label confusion counts against dataset labels.
- `POST /api/benchmark/score` — score pre-populated `predicted_labels` against `labels`; reports per-label confusion matrices and, when both arrays exist, annotator agreement / Cohen's kappa.
- `POST /api/compare` — compare aggregate metrics for baseline and candidate versions; flags drops exceeding a configurable threshold.

Use the API docs to try these endpoints. Example validation request:

```json
{"dataset_path":"backend/benchmark/demo_dataset.jsonl","limit":200,"version_name":"baseline-v1"}
```

A valid Phase 2 submission still needs 150+ question-answer pairs labelled independently by two annotators, documented adjudication, and a reported agreement statistic. The built-in label predictions are intentionally heuristic; do not present them as ground truth or claim that the full Phase 2 requirement is complete until the benchmark is populated and validated.

## Limits and safety

- Search-provider availability/rate limits can change; provider errors are now returned in the diagnostic output.
- Risk/relevance/grounding scores are heuristic signals, not calibrated probabilities, truth guarantees, or semantic entailment.
- The generic RAG API adapter supports common field names; unusual API schemas may require a small adapter change.
- Do not put API keys into screenshots or commit `.env` to GitHub. Keep `.env` local.
- The ZIP contains source code, not a signed standalone installer.
