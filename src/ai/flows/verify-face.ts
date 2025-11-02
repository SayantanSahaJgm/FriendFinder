// Lightweight stub for face verification flow used in development.
// Replace this with your production AI/ML verification implementation.

export interface VerifyFaceResult {
  isFaceDetected: boolean;
  confidence?: number;
  reason?: string;
}

export async function verifyFace({ photoDataUri }: { photoDataUri: string }): Promise<VerifyFaceResult> {
  // Development stub: do a very simple heuristic check
  // If photoDataUri is present, assume face detected with high confidence.
  // In production you should call your real ML model or API here.
  if (!photoDataUri || photoDataUri.length < 100) {
    return { isFaceDetected: false, confidence: 0, reason: 'no-image' };
  }

  return { isFaceDetected: true, confidence: 0.9 };
}

export default verifyFace;
