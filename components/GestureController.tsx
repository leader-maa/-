import React, { useEffect, useRef, useState } from 'react';
import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

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
  const [status, setStatus] = useState<string>("INITIALIZING AI...");
  const [isAiActive, setIsAiActive] = useState(false);
  
  // Logic state refs
  const lastVideoTimeRef = useRef(-1);
  const rotationSpeedRef = useRef(0);
  
  useEffect(() => {
    let handLandmarker: HandLandmarker | null = null;
    let animationFrameId: number;
    let isCancelled = false;

    const setup = async () => {
      try {
        setStatus("LOADING MODEL...");
        
        // 1. Load Vision Tasks (WASM)
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm"
        );
        
        if (isCancelled) return;

        // 2. Create HandLandmarker
        // Using CPU delegate to prevent WebGL context conflicts with Three.js
        handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: "CPU" 
          },
          runningMode: "VIDEO",
          numHands: 1
        });
        
        if (isCancelled) return;
        
        setStatus("STARTING CAM...");
        startWebcam();

      } catch (e) {
        console.warn("AI Load Failed (Network Issue?):", e);
        if (!isCancelled) {
            setStatus("AI FAILED - MOUSE MODE ONLY");
        }
      }
    };

    const startWebcam = async () => {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia && videoRef.current) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ 
                    video: { width: 320, height: 240 }
                });
                
                if (isCancelled) {
                    stream.getTracks().forEach(t => t.stop());
                    return;
                }

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.addEventListener('loadeddata', () => {
                        if (isCancelled) return;
                        setIsAiActive(true);
                        setStatus("ACTIVE");
                        predictWebcam();
                    });
                }
            } catch (err) {
                console.error("Camera denied:", err);
                if (!isCancelled) setStatus("CAMERA DENIED");
            }
        }
    };

    const predictWebcam = () => {
        if (!handLandmarker || !videoRef.current || isCancelled) return;
        
        const video = videoRef.current;
        
        // --- CRITICAL FIX START ---
        // Prevent "Framebuffer is incomplete: Attachment has zero size" error
        // MediaPipe will crash WebGL if passed a video with 0 width/height
        if (video.videoWidth === 0 || video.videoHeight === 0) {
            animationFrameId = requestAnimationFrame(predictWebcam);
            return;
        }
        // --- CRITICAL FIX END ---

        let startTimeMs = performance.now();

        if (video.currentTime !== lastVideoTimeRef.current) {
            lastVideoTimeRef.current = video.currentTime;
            
            try {
                const result = handLandmarker.detectForVideo(video, startTimeMs);
                
                // Defaults
                let targetAssemble = false;
                let targetPinch = false;
                let targetRot = 0;

                if (result.landmarks && result.landmarks.length > 0) {
                    const landmarks = result.landmarks[0];
                    const wrist = landmarks[0];
                    const thumbTip = landmarks[4];
                    const indexTip = landmarks[8];
                    const middleTip = landmarks[12];
                    const ringTip = landmarks[16];
                    const pinkyTip = landmarks[20];

                    // --- 1. Fist Detection (Assemble Tree) ---
                    const tips = [indexTip, middleTip, ringTip, pinkyTip];
                    let avgDist = 0;
                    tips.forEach(p => {
                        avgDist += Math.sqrt(
                            Math.pow(p.x - wrist.x, 2) + Math.pow(p.y - wrist.y, 2)
                        );
                    });
                    avgDist /= 4;
                    
                    if (avgDist < 0.25) {
                        targetAssemble = true;
                    }

                    // --- 2. Pinch Detection (Open Gift) ---
                    const pinchDist = Math.sqrt(
                        Math.pow(thumbTip.x - indexTip.x, 2) + 
                        Math.pow(thumbTip.y - indexTip.y, 2)
                    );
                    if (pinchDist < 0.05) {
                        targetPinch = true;
                    }

                    // --- 3. Rotation (Tilt) ---
                    const centerX = wrist.x;
                    const deadZone = 0.1;
                    if (Math.abs(centerX - 0.5) > deadZone) {
                        targetRot = (0.5 - centerX) * 4.0; 
                    }
                }

                setAssemble(targetAssemble);
                setIsPinching(targetPinch);
                
                rotationSpeedRef.current += (targetRot - rotationSpeedRef.current) * 0.1;
                setRotationSpeed(rotationSpeedRef.current);

            } catch (e) {
                console.error("Prediction Error:", e);
            }
        }

        animationFrameId = requestAnimationFrame(predictWebcam);
    };

    setup();

    return () => {
        isCancelled = true;
        if(animationFrameId) cancelAnimationFrame(animationFrameId);
        if(handLandmarker) handLandmarker.close();
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(t => t.stop());
        }
    };
  }, [setAssemble, setRotationSpeed, setIsPinching]);

  return (
    <div className="absolute top-4 left-4 z-50 pointer-events-none">
        {/* Webcam Preview */}
        <div className={`relative w-32 h-24 rounded-lg overflow-hidden border-2 transition-colors duration-300 ${isAiActive ? 'border-pink-500/50' : 'border-gray-800'}`}>
            <video 
                ref={videoRef}
                className={`w-full h-full object-cover transform -scale-x-100 ${isAiActive ? 'opacity-100' : 'opacity-0'}`}
                autoPlay 
                playsInline
                muted
            />
            {/* Status Overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <span className="text-[10px] text-pink-200 font-mono tracking-wider text-center px-1">
                    {status}
                </span>
            </div>
        </div>
    </div>
  );
};

export default GestureController;