/**
 * Enhanced Face Liveness Detection with Anti-Spoofing
 * Prevents fake photos, videos, and ensures real human presence
 */

export interface LivenessDetectionResult {
  isLive: boolean;
  confidence: number;
  reason: string;
  metrics: {
    hasMotion: boolean;
    hasBlinking: boolean;
    hasDepth: boolean;
    texture: string;
  };
}

export interface LivenessCheckRequest {
  frames: string[]; // Array of frame data URIs (minimum 3 frames)
  timestamp: number;
}

/**
 * Advanced liveness detection with multiple checks
 */
export async function detectLiveness(req: LivenessCheckRequest): Promise<LivenessDetectionResult> {
  try {
    if (!req.frames || req.frames.length < 3) {
      return {
        isLive: false,
        confidence: 0,
        reason: 'Insufficient frames for liveness detection',
        metrics: { hasMotion: false, hasBlinking: false, hasDepth: false, texture: 'unknown' }
      };
    }

    // 1. Motion Detection - Check for movement between frames
    const hasMotion = await detectMotionBetweenFrames(req.frames);

    // 2. Texture Analysis - Detect if it's a photo vs real face
    const textureAnalysis = await analyzeTexture(req.frames[req.frames.length - 1]);

    // 3. Depth/3D Detection - Check for depth cues (shadows, highlights)
    const hasDepth = await detectDepthCues(req.frames[req.frames.length - 1]);

    // 4. Blink Detection - Check for eye movement
    const hasBlinking = await detectBlinking(req.frames);

    // Calculate confidence based on checks passed
    let confidence = 0;
    let passedChecks = 0;

    if (hasMotion) {
      confidence += 0.3;
      passedChecks++;
    }
    if (textureAnalysis.isReal) {
      confidence += 0.3;
      passedChecks++;
    }
    if (hasDepth) {
      confidence += 0.2;
      passedChecks++;
    }
    if (hasBlinking) {
      confidence += 0.2;
      passedChecks++;
    }

    const isLive = passedChecks >= 2 && confidence >= 0.5;

    return {
      isLive,
      confidence,
      reason: isLive 
        ? `Live face detected (${passedChecks}/4 checks passed)` 
        : `Not a live face - failed checks: ${getFailedChecks(hasMotion, textureAnalysis.isReal, hasDepth, hasBlinking)}`,
      metrics: {
        hasMotion,
        hasBlinking,
        hasDepth,
        texture: textureAnalysis.type
      }
    };
  } catch (error) {
    console.error('Liveness detection error:', error);
    return {
      isLive: false,
      confidence: 0,
      reason: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      metrics: { hasMotion: false, hasBlinking: false, hasDepth: false, texture: 'error' }
    };
  }
}

/**
 * Detect motion between consecutive frames
 */
async function detectMotionBetweenFrames(frames: string[]): Promise<boolean> {
  try {
    if (frames.length < 2) return false;

    const frame1 = await loadImageData(frames[0]);
    const frame2 = await loadImageData(frames[frames.length - 1]);

    if (!frame1 || !frame2 || frame1.data.length !== frame2.data.length) {
      return false;
    }

    let totalDifference = 0;
    const sampleStep = 40; // Sample every 40th pixel for performance

    for (let i = 0; i < frame1.data.length; i += (4 * sampleStep)) {
      const diff = Math.abs(frame1.data[i] - frame2.data[i]) +
                   Math.abs(frame1.data[i + 1] - frame2.data[i + 1]) +
                   Math.abs(frame1.data[i + 2] - frame2.data[i + 2]);
      totalDifference += diff;
    }

    const avgDifference = totalDifference / (frame1.data.length / (4 * sampleStep));
    
    // If average pixel difference > 15, there's motion
    return avgDifference > 15;
  } catch (error) {
    console.error('Motion detection error:', error);
    return false;
  }
}

/**
 * Analyze texture to detect photo vs real face
 */
async function analyzeTexture(frame: string): Promise<{ isReal: boolean; type: string }> {
  try {
    const imageData = await loadImageData(frame);
    if (!imageData) return { isReal: false, type: 'unknown' };

    const data = imageData.data;
    let edgeCount = 0;
    let noiseCount = 0;
    const sampleSize = Math.min(5000, data.length / 4);
    const step = Math.max(1, Math.floor((data.length / 4) / sampleSize));

    // Detect edges and noise patterns
    for (let i = 0; i < data.length - (4 * step); i += (4 * step)) {
      const current = (data[i] + data[i + 1] + data[i + 2]) / 3;
      const next = (data[i + 4 * step] + data[i + 1 + 4 * step] + data[i + 2 + 4 * step]) / 3;
      
      const edgeDiff = Math.abs(current - next);
      if (edgeDiff > 30) edgeCount++;
      if (edgeDiff > 5 && edgeDiff < 15) noiseCount++;
    }

    const edgeRatio = edgeCount / sampleSize;
    const noiseRatio = noiseCount / sampleSize;

    // Real faces have moderate edges and noise
    // Photos have sharp edges, videos have less noise
    const isReal = (edgeRatio > 0.05 && edgeRatio < 0.3) && (noiseRatio > 0.1);
    const type = isReal ? 'live' : (edgeRatio > 0.3 ? 'photo' : 'video');

    return { isReal, type };
  } catch (error) {
    console.error('Texture analysis error:', error);
    return { isReal: false, type: 'error' };
  }
}

/**
 * Detect depth cues (shadows, highlights) that indicate 3D face
 */
async function detectDepthCues(frame: string): Promise<boolean> {
  try {
    const imageData = await loadImageData(frame);
    if (!imageData) return false;

    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;

    let shadowPixels = 0;
    let highlightPixels = 0;
    let midtonePixels = 0;
    const sampleSize = Math.min(5000, data.length / 4);
    const step = Math.max(1, Math.floor((data.length / 4) / sampleSize));

    for (let i = 0; i < data.length; i += (4 * step)) {
      const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
      
      if (brightness < 70) shadowPixels++;
      else if (brightness > 200) highlightPixels++;
      else midtonePixels++;
    }

    const shadowRatio = shadowPixels / sampleSize;
    const highlightRatio = highlightPixels / sampleSize;
    const midtoneRatio = midtonePixels / sampleSize;

    // Real 3D faces have varied depth (shadows, midtones, highlights)
    // Flat photos lack this variation
    return shadowRatio > 0.05 && highlightRatio > 0.05 && midtoneRatio > 0.4;
  } catch (error) {
    console.error('Depth detection error:', error);
    return false;
  }
}

/**
 * Detect blinking by comparing eye regions across frames
 */
async function detectBlinking(frames: string[]): Promise<boolean> {
  try {
    if (frames.length < 3) return false;

    // For now, use motion as proxy for blinking
    // In production, you'd use eye detection libraries
    const hasMotion = await detectMotionBetweenFrames(frames);
    
    // Check for rapid brightness changes in center region (where eyes typically are)
    let brightnessChanges = 0;
    
    for (let i = 0; i < frames.length - 1; i++) {
      const frame1 = await loadImageData(frames[i]);
      const frame2 = await loadImageData(frames[i + 1]);
      
      if (!frame1 || !frame2) continue;
      
      // Sample center region (where face/eyes are)
      const centerY = Math.floor(frame1.height * 0.4); // Upper-middle area
      const centerX = Math.floor(frame1.width * 0.5);
      const regionSize = 50;
      
      let brightness1 = 0;
      let brightness2 = 0;
      let samples = 0;
      
      for (let y = centerY; y < Math.min(centerY + regionSize, frame1.height); y += 5) {
        for (let x = centerX - regionSize / 2; x < Math.min(centerX + regionSize / 2, frame1.width); x += 5) {
          const idx = (y * frame1.width + x) * 4;
          if (idx < frame1.data.length) {
            brightness1 += (frame1.data[idx] + frame1.data[idx + 1] + frame1.data[idx + 2]) / 3;
            brightness2 += (frame2.data[idx] + frame2.data[idx + 1] + frame2.data[idx + 2]) / 3;
            samples++;
          }
        }
      }
      
      if (samples > 0) {
        const avgBrightness1 = brightness1 / samples;
        const avgBrightness2 = brightness2 / samples;
        const change = Math.abs(avgBrightness1 - avgBrightness2);
        
        if (change > 20) brightnessChanges++;
      }
    }
    
    // Blinking detected if we see brightness changes
    return hasMotion && brightnessChanges > 0;
  } catch (error) {
    console.error('Blink detection error:', error);
    return false;
  }
}

/**
 * Helper: Load image data from data URI
 */
async function loadImageData(dataUri: string): Promise<ImageData | null> {
  try {
    const img = new Image();
    img.src = dataUri;
    
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = reject;
      setTimeout(() => reject(new Error('Image load timeout')), 3000);
    });
    
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return null;
    
    ctx.drawImage(img, 0, 0);
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  } catch (error) {
    console.error('Load image data error:', error);
    return null;
  }
}

/**
 * Helper: Get list of failed checks
 */
function getFailedChecks(hasMotion: boolean, isReal: boolean, hasDepth: boolean, hasBlinking: boolean): string {
  const failed: string[] = [];
  if (!hasMotion) failed.push('motion');
  if (!isReal) failed.push('texture');
  if (!hasDepth) failed.push('depth');
  if (!hasBlinking) failed.push('blinking');
  return failed.join(', ') || 'none';
}
