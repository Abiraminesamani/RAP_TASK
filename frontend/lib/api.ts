/**
 * API client for Construction PPE Detection & Reasoning API
 */

export interface Detection {
  class: string;
  confidence: number;
  bbox: [number, number, number, number]; // [x1, y1, x2, y2]
}

export interface DetectResponse {
  success: boolean;
  image_width: number;
  image_height: number;
  detections: Detection[];
  count: number;
}

export interface ReasonResponse {
  success: boolean;
  question: string;
  intent: string; // e.g. "visual" | "unsupported"
  answer: string;
  detections_used: Detection[];
  reasoning_source: string; // e.g. "deterministic_fallback" | "confidence_guardrail" | "handwritten_router" | "llm"
}

export interface HealthResponse {
  message: string;
  status: string;
  model: string;
  device: string;
  llm_enabled: boolean;
}

export function getApiBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
  return url.replace(/\/+$/, "");
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorDetail = `Request failed with status ${res.status}`;
    try {
      const errorJson = await res.json();
      if (errorJson.detail) {
        if (typeof errorJson.detail === "string") {
          errorDetail = errorJson.detail;
        } else if (Array.isArray(errorJson.detail)) {
          errorDetail = errorJson.detail
            .map((item: { msg?: string }) => item.msg || JSON.stringify(item))
            .join(", ");
        } else {
          errorDetail = JSON.stringify(errorJson.detail);
        }
      }
    } catch {
      // Body wasn't JSON
      if (res.status === 404) {
        errorDetail = "Endpoint not found on the backend API server.";
      } else if (res.status === 500) {
        errorDetail = "Internal server error occurred while processing the request.";
      }
    }
    throw new Error(errorDetail);
  }

  return res.json() as Promise<T>;
}

/**
 * Check backend connection status via GET /
 */
export async function checkApiHealth(): Promise<HealthResponse> {
  const baseUrl = getApiBaseUrl();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const res = await fetch(`${baseUrl}/`, {
      method: "GET",
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
    });
    clearTimeout(timeoutId);
    return await handleResponse<HealthResponse>(res);
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("API health check timed out (server did not respond in 6s)");
    }
    if (err instanceof Error) {
      throw err;
    }
    throw new Error("Unable to connect to backend server");
  }
}

/**
 * Call POST /detect with an image file
 */
export async function detectPPE(file: File): Promise<DetectResponse> {
  const baseUrl = getApiBaseUrl();
  const formData = new FormData();
  formData.append("file", file, file.name);

  try {
    const res = await fetch(`${baseUrl}/detect`, {
      method: "POST",
      body: formData,
      // Note: do NOT set Content-Type header so the browser sets multipart boundary
    });
    return await handleResponse<DetectResponse>(res);
  } catch (err: unknown) {
    if (err instanceof TypeError && err.message.includes("Failed to fetch")) {
      throw new Error(
        `Failed to reach API server at ${baseUrl}. Ensure FastAPI is running and CORS is enabled.`
      );
    }
    if (err instanceof Error) {
      throw err;
    }
    throw new Error("Unknown error during object detection");
  }
}

/**
 * Call POST /reason with an image file and question string
 */
export async function reasonPPE(file: File, question: string): Promise<ReasonResponse> {
  const baseUrl = getApiBaseUrl();
  const formData = new FormData();
  formData.append("question", question);
  formData.append("file", file, file.name);

  try {
    const res = await fetch(`${baseUrl}/reason`, {
      method: "POST",
      body: formData,
    });
    return await handleResponse<ReasonResponse>(res);
  } catch (err: unknown) {
    if (err instanceof TypeError && err.message.includes("Failed to fetch")) {
      throw new Error(
        `Failed to reach API server at ${baseUrl}. Ensure FastAPI is running.`
      );
    }
    if (err instanceof Error) {
      throw err;
    }
    throw new Error("Unknown error during reasoning");
  }
}
