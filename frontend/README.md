# PPE Safety AI - Frontend Dashboard

A modern, responsive, high-performance web dashboard for the **Construction PPE Detection & Reasoning API** powered by RT-DETR-L.

## Features

- **Real-Time Detection Visualization**: Accurate Canvas overlay rendering bounding boxes for 11 PPE classes, with dynamic scaling to image display dimensions.
- **Strict Evidence-Based Reasoning**: Dedicated interface for natural-language questioning about detected safety gear and personnel.
- **Safety Guardrail Preservation**: Prominently highlights the backend's conservative "Insufficient information" refusal-to-guess behavior.
- **Live Backend Health Monitor**: Real-time heartbeat checking `GET /` with live status indicators and latency stats.
- **Detection Summary & Table**: Complete breakdown of total detections, workers, compliant PPE, and non-compliance alerts, with confidence tags.
- **Zero Agentic Frameworks**: Fast, lightweight, deterministic logic without LangChain, CrewAI, or extraneous wrappers.

---

## Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **UI Library**: [React 18](https://react.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)

---

## Getting Started

### 1. Prerequisites

- Node.js 18+ (tested on Node v22.18)
- Python virtual environment with FastAPI backend installed (`.venv`)

### 2. Environment Configuration

Create a `.env.local` file in `frontend/` (copied from `.env.local.example`):

```bash
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

> For production deployment, set `NEXT_PUBLIC_API_URL` to your hosted FastAPI endpoint:
> ```bash
> NEXT_PUBLIC_API_URL=https://your-deployed-fastapi-url
> ```

### 3. Start the FastAPI Backend

From the repository root (`RAP_TASK`):

```powershell
# Windows PowerShell
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Verify backend health at `http://127.0.0.1:8000/docs`.

### 4. Start the Frontend Development Server

From the `frontend/` directory:

```bash
# Install dependencies (if not already done)
npm install

# Start Next.js dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Demo Script for Evaluators

1. **Check Connection**: Notice the **● API Connected** status pill in the top header.
2. **Select / Upload Image**: Click to upload your own construction-site image, or click **"👷 Worker with Helmet & Vest"** to load a pre-configured sample.
3. **Run Detection**: Click the amber **"Run Detection"** button.
   - View localized bounding boxes on the canvas.
   - Review the 4 Metric Cards (Total, People, PPE, Non-Compliance).
   - Inspect the Detection Results table with exact confidence percentages.
4. **Test Counting Reasoning**: Click the sample question chip:
   > *"How many helmets are there?"*
   - Observe the returned answer (e.g., *"I detected 1 helmet."*) and cited evidence bounding boxes.
5. **Test Presence Reasoning**: Click:
   > *"Are there any goggles?"*
   - Observe structured presence reporting.
6. **Test Conservative Guardrail**: Click:
   > *"Is anyone without a helmet?"*
   - Observe the prominent amber **"Insufficient information"** safety banner explaining that the AI refuses to assume without hard detector evidence.
7. **Test Unsupported Query**: Click:
   > *"What is the weather today?"*
   - Observe the clear notice stating that the question cannot be answered from the PPE detector.

---

## Production Build

```bash
npm run build
npm run start
```
