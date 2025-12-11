import React, { useState, Suspense, useEffect, useRef, Component, ErrorInfo } from 'react';
import Scene from './components/Scene';
import Overlay from './components/Overlay';
import GestureController from './components/GestureController';

// --- Error Boundary to catch crashes ---
class ErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean, error: string }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: "" };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error: error.toString() };
  }

  componentDidCatch(error: any, errorInfo: ErrorInfo) {
    console.error("App Crash:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#1a0b2e] text-pink-500 p-10 text-center">
          <h1 className="text-2xl font-bold mb-4">⚠️ 应用遇到问题</h1>
          <p className="mb-4 text-gray-300">请尝试刷新页面。如果问题持续，可能是网络原因导致 AI 模型无法加载。</p>
          <code className="bg-black/50 p-4 rounded text-xs text-red-400 font-mono text-left w-full max-w-lg overflow-auto">
            {this.state.error}
          </code>
        </div>
      );
    }
    return this.props.children;
  }
}

// Initial Start Screen
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
  const [isTreeShape, setIsTreeShape] = useState(false);
  const [rotationSpeed, setRotationSpeed] = useState(0);
  const [isPinching, setIsPinching] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  return (
    <div className="relative w-full h-full bg-[#1a0b2e]">
      <ErrorBoundary>
          {!hasStarted && <StartScreen onStart={() => setHasStarted(true)} />}

          <BackgroundMusic isStarted={hasStarted} />

          {hasStarted && (
              <GestureController 
                setAssemble={setIsTreeShape} 
                setRotationSpeed={setRotationSpeed}
                setIsPinching={setIsPinching}
              />
          )}

          <Overlay isTreeShape={isTreeShape} setIsTreeShape={setIsTreeShape} />
          
          {hasStarted && (
            <Suspense fallback={
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-40">
                    <div className="flex flex-col items-center">
                        <div className="w-8 h-8 border-2 border-pink-400 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <span className="text-pink-200 animate-pulse text-xs tracking-widest">LOADING 3D SCENE...</span>
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
          
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none -z-10">
             <span className="text-purple-800 animate-pulse text-xs tracking-widest">INITIALIZING ARIX...</span>
          </div>
      </ErrorBoundary>
    </div>
  );
};

export default App;