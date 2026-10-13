/**
 * Client-side Barcode & QR Auto-Detection Utility
 * Uses native BarcodeDetector API with @zxing/browser fallback, plus OCR regex fallback.
 */

export interface DetectedBarcodeResult {
  code: string;
  format: string;
  source: "native_detector" | "zxing" | "ocr_digits";
}

/**
 * Scan an image file or object URL for 1D/2D barcodes.
 */
export async function scanBarcodeFromImage(
  imageSource: File | string
): Promise<DetectedBarcodeResult | null> {
  if (typeof window === "undefined") return null;

  let imageUrl: string;
  let isCreatedBlob = false;

  if (typeof imageSource === "string") {
    imageUrl = imageSource;
  } else {
    imageUrl = URL.createObjectURL(imageSource);
    isCreatedBlob = true;
  }

  try {
    // 1. Try Native Browser BarcodeDetector (Chrome, Edge, Android Chrome, Opera)
    if ("BarcodeDetector" in window) {
      try {
        const supportedFormats = await (window as any).BarcodeDetector.getSupportedFormats();
        const formatsToUse = [
          "ean_13",
          "ean_8",
          "upc_a",
          "upc_e",
          "code_128",
          "code_39",
          "qr_code",
          "data_matrix",
        ].filter((f) => supportedFormats.includes(f));

        const detector = new (window as any).BarcodeDetector({
          formats: formatsToUse.length > 0 ? formatsToUse : ["ean_13", "upc_a", "code_128", "qr_code"],
        });

        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = imageUrl;
        await img.decode();

        const barcodes = await detector.detect(img);
        if (barcodes && barcodes.length > 0) {
          const first = barcodes[0];
          return {
            code: first.rawValue,
            format: first.format || "EAN-13",
            source: "native_detector",
          };
        }
      } catch (nativeErr) {
        console.debug("Native BarcodeDetector non-fatal notice:", nativeErr);
      }
    }

    // 2. Try ZXing Browser Multi-Format Reader Fallback
    try {
      const { BrowserMultiFormatReader } = await import("@zxing/browser");
      const reader = new BrowserMultiFormatReader();
      const zxingResult = await reader.decodeFromImageUrl(imageUrl);
      if (zxingResult && zxingResult.getText()) {
        return {
          code: zxingResult.getText(),
          format: zxingResult.getBarcodeFormat() ? String(zxingResult.getBarcodeFormat()) : "1D_BARCODE",
          source: "zxing",
        };
      }
    } catch (zxingErr) {
      // ZXing unable to find barcode pattern in this frame
      console.debug("ZXing scan notice:", zxingErr);
    }

    return null;
  } catch (err) {
    console.debug("Barcode scan error:", err);
    return null;
  } finally {
    if (isCreatedBlob) {
      URL.revokeObjectURL(imageUrl);
    }
  }
}

/**
 * Fallback: Extract candidate barcode from OCR detection texts
 * Looks for standard 13-digit EAN (especially 890 Indian prefix), 12-digit UPC, or 8-digit EAN.
 */
export function extractBarcodeFromOcrDetections(
  detections: Array<{ label?: string; category?: string }>
): DetectedBarcodeResult | null {
  for (const det of detections) {
    const text = `${det.category || ""} ${det.label || ""}`;

    // 1. Look for explicit "Barcode:" or "EAN:" or "EAN-13:" or "GTIN:" prefixes
    const prefixMatch = text.match(/(?:barcode|ean|gtin|upc)[:#\s]+([0-9\s]{8,18})/i);
    if (prefixMatch) {
      const clean = prefixMatch[1].replace(/\s+/g, "");
      if (clean.length >= 8 && clean.length <= 14) {
        return {
          code: clean,
          format: clean.startsWith("890") ? "EAN-13 (GS1 India)" : "EAN / GTIN",
          source: "ocr_digits",
        };
      }
    }

    // 2. Look for Indian GS1 (starts with 890 and is 13 digits, with optional spaces e.g. "890 1030 018507")
    const indianGs1Match = text.match(/\b(890[\s\d]{9,14})\b/);
    if (indianGs1Match) {
      const clean = indianGs1Match[1].replace(/\s+/g, "");
      if (clean.length === 13) {
        return {
          code: clean,
          format: "EAN-13 (GS1 India)",
          source: "ocr_digits",
        };
      }
    }

    // 3. Look for standard EAN-13 spaced patterns (e.g., "5 449000 000996" or "5449000000996")
    const eanPatternMatch = text.match(/\b(\d\s*\d{6}\s*\d{6})\b/);
    if (eanPatternMatch) {
      const clean = eanPatternMatch[1].replace(/\s+/g, "");
      if (clean.length === 13) {
        return {
          code: clean,
          format: clean.startsWith("890") ? "EAN-13 (GS1 India)" : "EAN-13",
          source: "ocr_digits",
        };
      }
    }

    // 4. Look for standard 12-14 digit standalone numbers
    const generalMatch = text.match(/\b(\d{12,14})\b/);
    if (generalMatch) {
      return {
        code: generalMatch[1],
        format: generalMatch[1].startsWith("890") ? "EAN-13 (GS1 India)" : "EAN / UPC",
        source: "ocr_digits",
      };
    }
  }

  return null;
}
