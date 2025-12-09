import React, { useState, Suspense, useEffect, useRef } from 'react';
import Scene from './components/Scene';
import Overlay from './components/Overlay';
import GestureController from './components/GestureController';

// Initial Start Screen to handle Autoplay Policy
const StartScreen: React.FC<{ onStart: () => void }> = ({ onStart }) => {
    return (
        <div 
            onClick={onStart}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#1a0b2e] cursor-pointer transition-opacity duration-1000"
        >
            <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-pink-600 to-purple-600 rounded-lg blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative px-7 py-4 bg-black rounded-lg leading-none flex items-center divide-x divide-gray-600">
                    <span className="flex items-center space-x-5">
                        <span className="pr-6 text-gray-100 text-xl font-serif tracking-widest">ARIX CHRISTMAS</span>
                    </span>
                    <span className="pl-6 text-pink-400 group-hover:text-pink-300 transition duration-200 text-sm tracking-widest uppercase">
                        Click to Enter
                    </span>
                </div>
            </div>
            <p className="mt-4 text-purple-300/50 text-xs tracking-[0.3em] font-light">ENABLE AUDIO & CAMERA</p>
        </div>
    );
};

const BackgroundMusic: React.FC<{ isStarted: boolean }> = ({ isStarted }) => {
    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = 0.3;
        }

        if (isStarted && audioRef.current) {
            // Attempt to play only after user interaction (start button)
            const playPromise = audioRef.current.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.log("Audio playback failed (likely browser policy):", error);
                });
            }
        }
    }, [isStarted]);

    return (
        <audio 
            ref={audioRef} 
            src="https://assets.mixkit.co/music/preview/mixkit-christmas-magic-202.mp3" 
            loop 
            preload="auto"
        />
    );
}

const App: React.FC = () => {
  // Core state: Chaos vs Order
  const [isTreeShape, setIsTreeShape] = useState(false);
  const [rotationSpeed, setRotationSpeed] = useState(0);
  const [isPinching, setIsPinching] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  return (
    <div className="relative w-full h-full bg-[#1a0b2e]">
      
      {!hasStarted && <StartScreen onStart={() => setHasStarted(true)} />}

      {/* Background Music - Only plays after start */}
      <BackgroundMusic isStarted={hasStarted} />

      {/* Gesture Control Logic (Includes Camera Preview) */}
      {hasStarted && (
          <GestureController 
            setAssemble={setIsTreeShape} 
            setRotationSpeed={setRotationSpeed}
            setIsPinching={setIsPinching}
          />
      )}

      {/* UI Layer */}
      <Overlay isTreeShape={isTreeShape} setIsTreeShape={setIsTreeShape} />
      
      {/* 3D Layer */}
      {hasStarted && (
        <Suspense fallback={
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="flex flex-col items-center">
                    <div className="w-8 h-8 border-2 border-pink-400 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <span className="text-pink-200 animate-pulse text-xs tracking-widest">LOADING RESOURCES...</span>
                </div>
            </div>
        }>
            <Scene 
            isTreeShape={isTreeShape} 
            rotationSpeed={rotationSpeed}
            isPinching={isPinching}
            />
        </Suspense>
      )}
      
      {/* Initialization Text (Behind scene) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none -z-10">
         <span className="text-purple-800 animate-pulse text-xs tracking-widest">INITIALIZING ARIX...</span>
      </div>
    </div>
  );
};

export default App;