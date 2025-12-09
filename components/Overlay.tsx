import React from 'react';

interface OverlayProps {
  isTreeShape: boolean;
  setIsTreeShape: (v: boolean) => void;
}

const Overlay: React.FC<OverlayProps> = ({ isTreeShape, setIsTreeShape }) => {
  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-end p-8 z-10">
      {/* Minimalist Instructions */}
      <div className="flex flex-col items-center pb-6 opacity-40 transition-opacity duration-1000 hover:opacity-80 gap-2">
        <p className="text-pink-100 text-[10px] tracking-[0.3em] font-light uppercase text-center" style={{ fontFamily: 'serif' }}>
          Open Hand: Dissolve &bull; Fist: Assemble
        </p>
        <p className="text-gold-200 text-[10px] tracking-[0.2em] font-light uppercase text-center text-[#ffd700]" style={{ fontFamily: 'serif' }}>
          Tilt Hand: Rotate &bull; Pinch: Inspect Memory
        </p>
      </div>
    </div>
  );
};

export default Overlay;