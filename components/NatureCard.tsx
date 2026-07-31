
import React from 'react';
import { GameChallenge } from '../types';

interface NatureCardProps {
  challenge: GameChallenge;
  onClose: () => void;
}

const NatureCard: React.FC<NatureCardProps> = ({ challenge, onClose }) => {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-2xl animate-in fade-in zoom-in duration-500">
      <div className="max-w-3xl w-full border border-emerald-500/30 bg-black shadow-[0_0_100px_rgba(16,185,129,0.1)] overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="h-full bg-zinc-900 border-r border-emerald-500/20 p-8 space-y-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="text-[10px] text-emerald-600 font-bold uppercase">Specimen Class</div>
                      {challenge.isUltraHD && (
                        <span className="text-[8px] bg-emerald-500 text-black px-1 font-black">8K-RECON</span>
                      )}
                    </div>
                    <h2 className="text-4xl font-black text-white italic tracking-tighter">{challenge.animal}</h2>
                </div>
                
                <div className="space-y-4 pt-4">
                    <div className="space-y-1">
                        <div className="text-[10px] text-emerald-600 font-bold uppercase">Camouflage Mechanism</div>
                        <p className="text-sm text-zinc-300 leading-relaxed italic border-l-2 border-emerald-500/50 pl-4">
                            "{challenge.natureFact}"
                        </p>
                    </div>
                </div>

                <div className="pt-8">
                    <button 
                        onClick={onClose}
                        className="w-full h-14 bg-emerald-600 hover:bg-emerald-500 text-black font-black uppercase tracking-widest transition-all active:scale-95"
                    >
                        Archive Specimen
                    </button>
                </div>
            </div>
            <div className="relative h-64 md:h-auto group">
                <img src={challenge.imageUrl} className="w-full h-full object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all duration-700" />
                <div className="absolute inset-0 bg-gradient-to-l from-transparent to-black/80"></div>
                <div className="absolute bottom-6 right-6 text-[10px] text-white/40 font-mono">
                    TIMESTAMP: {new Date(challenge.timestamp).toISOString()}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default NatureCard;
