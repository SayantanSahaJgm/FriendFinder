"use client";
import { useCallback, useEffect, useRef, useState } from "react";

export type CameraState = "idle" | "starting" | "started" | "stopped" | "error";

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [state, setState] = useState<CameraState>("idle");
  const [error, setError] = useState<string | null>(null);

  const start = useCallback(async (constraints: MediaStreamConstraints = { video: { facingMode: "user" } }) => {
    setError(null);
    if (typeof window === "undefined" || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError("Camera not supported in this environment");
      setState("error");
      return null;
    }

    try {
      setState("starting");
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setState("started");
      return stream;
    } catch (err: any) {
      console.error("useCamera: getUserMedia failed", err);
      setError(err?.message || String(err));
      setState("error");
      return null;
    }
  }, []);

  const stop = useCallback(() => {
    try {
      const s = streamRef.current;
      if (s) {
        s.getTracks().forEach((t) => t.stop());
      }
    } catch (err) {
      console.warn("useCamera.stop error", err);
    } finally {
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
      setState("stopped");
    }
  }, []);

  useEffect(() => {
    return () => {
      try {
        const s = streamRef.current;
        if (s) s.getTracks().forEach((t) => t.stop());
      } catch (_) {
        // ignore
      }
      streamRef.current = null;
    };
  }, []);

  return {
    videoRef,
    start,
    stop,
    state,
    error,
    isStarted: state === "started",
  } as const;
}

export default useCamera;
