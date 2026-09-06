export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Detection {
  label: string;
  status: "Passed" | "Failed" | "Pending" | string;
  category?: "Manufacture Date" | "Expire Date" | "Consumer Info" | "MRP" | "Net Weight" | string;
  box: BoundingBox;
  estimated_font_size_mm?: number;
}

export interface AnalysisResult {
  filename: string;
  original_width: number;
  original_height: number;
  detections: Detection[];
  image_url?: string;
  product_name?: string;
  manufacturer?: string;
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://legal-metrology-backend-dhto.onrender.com/api/v1";

/**
 * Upload and analyze a product package image using the Python FastAPI OCR & Rule Engine.
 */
export async function analyzePackageImage(imageFile: File, packageHeightCm?: number): Promise<AnalysisResult> {
  const formData = new FormData();
  formData.append("file", imageFile);
  if (packageHeightCm) {
    formData.append("package_height_cm", packageHeightCm.toString());
  }

  const response = await fetch(`${API_BASE_URL}/analyze`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    let errorDetail = `HTTP ${response.status}: ${response.statusText}`;
    try {
      const errJson = await response.json();
      if (errJson.detail) {
        errorDetail = typeof errJson.detail === "string" ? errJson.detail : JSON.stringify(errJson.detail);
      }
    } catch {
      // ignore json parse error
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

/**
 * Check whether the FastAPI backend is running and reachable.
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const rootUrl = API_BASE_URL.replace(/\/api\/v1\/?$/, "");
    const response = await fetch(`${rootUrl}/openapi.json`, {
      method: "GET",
      signal: AbortSignal.timeout(2000),
    });
    return response.ok;
  } catch {
    return false;
  }
}
