export type FaceDetectionRequest = { photoDataUri: string };

export interface FaceDetectionResult {
  faceDetected: boolean;
  confidence: number;
  reason?: string;
}

/**
 * Detect face in image using browser's built-in face detection API
 * Falls back to simple brightness/content check if API not available
 */
export async function detectFace(req: FaceDetectionRequest): Promise<FaceDetectionResult> {
  try {
    // Convert data URI to blob
    const response = await fetch(req.photoDataUri);
    const blob = await response.blob();
    
    // Try using browser's Face Detection API if available
    if ('FaceDetector' in window) {
      try {
        const faceDetector = new (window as any).FaceDetector({
          maxDetectedFaces: 5,
          fastMode: true
        });
        
        // Create ImageBitmap from blob
        const imageBitmap = await createImageBitmap(blob);
        const faces = await faceDetector.detect(imageBitmap);
        
        if (faces && faces.length > 0) {
          // Calculate confidence based on bounding box size (larger face = higher confidence)
          const face = faces[0];
          const area = face.boundingBox.width * face.boundingBox.height;
          const imageArea = imageBitmap.width * imageBitmap.height;
          const confidence = Math.min(0.95, 0.5 + (area / imageArea) * 2);
          
          return { 
            faceDetected: true, 
            confidence,
            reason: 'Face detected using browser API'
          };
        }
        
        return { 
          faceDetected: false, 
          confidence: 0,
          reason: 'No face detected by browser API'
        };
      } catch (apiError) {
        console.warn('Face Detection API failed, using fallback:', apiError);
      }
    }
    
    // Fallback: Use simple heuristics
    const img = new Image();
    img.src = req.photoDataUri;
    
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      setTimeout(reject, 5000); // Timeout after 5s
    });
    
    // Create canvas for analysis
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      return { faceDetected: false, confidence: 0 };
    }
    
    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Simple heuristics: check for skin-tone pixels and variation
    let skinTonePixels = 0;
    let brightPixels = 0;
    let darkPixels = 0;
    const sampleSize = Math.min(10000, data.length / 4); // Sample pixels
    const step = Math.max(1, Math.floor((data.length / 4) / sampleSize));
    
    for (let i = 0; i < data.length; i += (4 * step)) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Check for skin-tone range (simplified)
      if (r > 95 && g > 40 && b > 20 &&
          r > g && r > b &&
          Math.abs(r - g) > 15) {
        skinTonePixels++;
      }
      
      const brightness = (r + g + b) / 3;
      if (brightness > 200) brightPixels++;
      if (brightness < 55) darkPixels++;
    }
    
    const skinToneRatio = skinTonePixels / sampleSize;
    const brightRatio = brightPixels / sampleSize;
    const darkRatio = darkPixels / sampleSize;
    
    // Detect face if we have reasonable skin tone distribution
    // and image is not too dark/bright (not just black/white screen)
    const hasSufficientSkinTone = skinToneRatio > 0.08;
    const notTooBright = brightRatio < 0.8;
    const notTooDark = darkRatio < 0.8;
    const hasVariation = notTooBright && notTooDark;
    
    if (!hasVariation) {
      if (!notTooBright) {
        return { 
          faceDetected: false, 
          confidence: 0,
          reason: 'Screen too bright - please adjust lighting'
        };
      }
      if (!notTooDark) {
        return { 
          faceDetected: false, 
          confidence: 0,
          reason: 'Screen too dark - please ensure proper lighting'
        };
      }
    }
    
    const faceDetected = hasSufficientSkinTone && hasVariation;
    const confidence = faceDetected ? Math.min(0.85, skinToneRatio * 5) : 0;
    
    return { 
      faceDetected, 
      confidence,
      reason: faceDetected 
        ? 'Face detected using heuristic analysis' 
        : 'No face detected - please position your face in view'
    };
    
  } catch (error) {
    console.error('Face detection error:', error);
    // On error, return false to avoid false positives
    return { 
      faceDetected: false, 
      confidence: 0,
      reason: `Error during detection: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}
