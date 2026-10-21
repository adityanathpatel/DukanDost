/**
 * Validates uploaded invoice image file types and size constraints.
 */
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB limit
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export interface FileValidationResult {
  valid: boolean;
  isValid: boolean;
  error?: string;
}

export function validateInvoiceImageFile(file: File): FileValidationResult {
  if (!file) {
    return {
      valid: false,
      isValid: false,
      error: 'कृपया एक बिल या इनवॉइस छवि चुनें (Please select an invoice image file)',
    };
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      isValid: false,
      error: `फ़ाइल प्रारूप अमान्य है (${file.type || 'unknown'})। केवल JPG, PNG या WebP छवियां समर्थित हैं।`,
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeInMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      isValid: false,
      error: `फ़ाइल बहुत बड़ी है (${sizeInMb} MB)। अधिकतम अनुमत आकार 10 MB है।`,
    };
  }

  return { valid: true, isValid: true };
}

