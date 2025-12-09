import React, { useEffect, useRef, useState } from 'react';
import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import { easing } from 'maath';

interface GestureControllerProps {
  setAssemble: (assemble: boolean) => void;
  setRotationSpeed: (speed: number) => void;
  setIsPinching: (pinching: boolean) => void;
}

const GestureController: React.FC<GestureControllerProps> = ({ 
  setAssemble, 
  setRotationSpeed,
  setIsPinching 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [gestureStatus, setGestureStatus] = useState<string>("INITIALIZING");
  
  // Refs for smoothing and logic state
  const rotationSpeedRef = useRef(0);
  const isPinchingRef = useRef(false);
  const assembleRef = useRef(false); // Track local state for UI text
  
  useEffect(() => {
    let handLandmarker: HandLandmarker | null = null;
    let animationFrameId: number;
    let video: HTMLVideoElement | null = videoRef.current;

    const setup = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm"
        );
        handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1
        });
        
        startWebcam();
      } catch (e) {
        console.error("Failed to initialize MediaPipe", e);
        setGestureStatus("CAMERA ERROR");
      }
    };

    const startWebcam = async () => {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia && video) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ 
                    video: { width: 320, height: 240 }
                });
                video.srcObject = stream;
                video.addEventListener('loadeddata', () => {
                    setIsLoaded(true);
                    setGestureStatus("WAITING FOR HAND");
                    predictWebcam();
                });
            } catch (err) {
                console.error("Camera access denied", err);
                setGestureStatus("NO CAMERA");
            }
        }
    }

    let lastVideoTime = -1;
    let fistFrameCount = 0;
    let openFrameCount = 0;
    const STATE_THRESHOLD = 5; 

    const predictWebcam = () => {
        if (!handLandmarker || !video) return;
        
        let startTimeMs = performance.now();
        if (video.currentTime !== lastVideoTime) {
            lastVideoTime = video.currentTime;
            const result = handLandmarker.detectForVideo(video, startTimeMs);
            
            let targetRotation = 0;
            let currentStatus = "IDLE";

            if (result.landmarks && result.landmarks.length > 0) {
                const landmarks = result.landmarks[0];
                const wrist = landmarks[0];

                // --- 1. Finger Folding (Fist vs Open) ---
                const isFolded = (tipIdx: number, mcpIdx: number) => {
                    const tip = landmarks[tipIdx];
                    const mcp = landmarks[mcpIdx];
                    const dTip = Math.hypot(tip.x - wrist.x, tip.y - wrist.y);
                    const dMcp = Math.hypot(mcp.x - wrist.x, mcp.y - wrist.y);
                    return dTip < dMcp;
                }

                let foldedCount = 0;
                if (isFolded(8, 5)) foldedCount++;   // Index
                if (isFolded(12, 9)) foldedCount++;  // Middle
                if (isFolded(16, 13)) foldedCount++; // Ring
                if (isFolded(20, 17)) foldedCount++; // Pinky
                
                if (foldedCount >= 3) {
                   fistFrameCount++;
                   openFrameCount = 0;
                } else if (foldedCount <= 1) {
                   openFrameCount++;
                   fistFrameCount = 0;
                } else {
                    fistFrameCount = Math.max(0, fistFrameCount - 1);
                    openFrameCount = Math.max(0, openFrameCount - 1);
                }

                if (fistFrameCount > STATE_THRESHOLD) {
                    setAssemble(true);
                    assembleRef.current = true;
                }
                if (openFrameCount > STATE_THRESHOLD) {
                    setAssemble(false);
                    assembleRef.current = false;
                }

                if (assembleRef.current) currentStatus = "ASSEMBLING";
                else currentStatus = "DISSOLVING";

                // --- 2. Pinch Detection with Hysteresis ---
                const thumbTip = landmarks[4];
                const indexTip = landmarks[8];
                const pinchDist = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y);
                
                if (!isPinchingRef.current && pinchDist < 0.05) {
                    isPinchingRef.current = true;
                    setIsPinching(true);
                } else if (isPinchingRef.current && pinchDist > 0.10) {
                    isPinchingRef.current = false;
                    setIsPinching(false);
                }

                if (isPinchingRef.current) {
                    currentStatus = "MEMORY RECALL";
                }

                // --- 3. Hand Rotation (Tilt) ---
                // "Harder to trigger" logic
                const indexMCP = landmarks[5];
                const pinkyMCP = landmarks[17];
                const dx = pinkyMCP.x - indexMCP.x;
                const dy = pinkyMCP.y - indexMCP.y;
                const angle = Math.atan2(dy, dx); 
                
                // Increased DEADZONE to 0.6 rad (~35 degrees)
                // This forces the user to deliberately rotate the hand
                const DEADZONE = 0.6;
                
                // Check if hand is roughly vertical (fingers pointing up) to distinguish from weird angles?
                // For now, angle deadzone is the most robust simple check.
                
                if (Math.abs(angle) > DEADZONE && !isPinchingRef.current) {
                    const sign = Math.sign(angle);
                    const magnitude = Math.abs(angle) - DEADZONE;
                    // Significantly reduced speed multiplier (0.15) for controlled rotation
                    targetRotation = sign * magnitude * 0.15; 
                    currentStatus = sign > 0 ? "ROTATING RIGHT" : "ROTATING LEFT";
                } else {
                    targetRotation = 0;
                }
            } else {
                targetRotation = 0;
                currentStatus = "NO HAND";
                if (isPinchingRef.current) {
                    isPinchingRef.current = false;
                    setIsPinching(false);
                }
            }

            setGestureStatus(currentStatus);

            // Increased smoothing factor for inertia
            rotationSpeedRef.current += (targetRotation - rotationSpeedRef.current) * 0.05;
            
            if (Math.abs(rotationSpeedRef.current) < 0.0001) rotationSpeedRef.current = 0;
            
            setRotationSpeed(rotationSpeedRef.current);
        }
        animationFrameId = requestAnimationFrame(predictWebcam);
    }

    setup();

    return () => {
        if(video && video.srcObject) {
            const tracks = (video.srcObject as MediaStream).getTracks();
            tracks.forEach(t => t.stop());
        }
        cancelAnimationFrame(animationFrameId);
        if (handLandmarker) handLandmarker.close();
    }
  }, [setAssemble, setRotationSpeed, setIsPinching]);

  return (
    <div className="fixed bottom-6 right-6 z-50 transition-opacity duration-500" style={{ opacity: isLoaded ? 1 : 0 }}>
        <div className="relative flex flex-col items-end gap-2">
            {/* Gesture Status Text */}
            <div className="bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-pink-500/20">
                <span className="text-[10px] font-mono font-bold tracking-widest text-pink-300 animate-pulse">
                    [{gestureStatus}]
                </span>
            </div>

            {/* Video Container */}
            <div className="relative rounded-xl overflow-hidden shadow-[0_0_20px_rgba(255,182,193,0.3)] border border-pink-500/30 w-32 h-24 bg-black/50 backdrop-blur-sm">
                <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline
                    muted
                    className="w-full h-full object-cover transform -scale-x-100 opacity-80" // Mirror effect
                />
                <div className="absolute top-1 left-2 text-[8px] text-pink-200 font-mono tracking-widest uppercase opacity-70">
                    Arix Vision
                </div>
                {/* Pinch Indicator */}
                <div className={`absolute top-2 right-2 w-2 h-2 rounded-full transition-colors duration-300 ${isPinchingRef.current ? 'bg-green-400 shadow-[0_0_8px_#4ade80]' : 'bg-red-900/50'}`}></div>

                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-pink-400"></div>
                <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-pink-400"></div>
            </div>
        </div>
    </div>
  );
}

export default GestureController;