
import React from 'react';

export const Logo: React.FC<{ className?: string, withText?: boolean, textClassName?: string }> = ({ className = "w-10 h-10", withText = true, textClassName }) => {
  return (
    <div className={`flex items-center gap-3 select-none ${textClassName || 'text-slate-900'}`}>
      {/* 
         Icon Design: "The Sparkle"
         A deep blue gradient circle containing a sharp white 4-pointed star (hypocycloid-ish).
         Represents a flash of insight or linguistic brilliance.
      */}
      <div className={`${className} relative flex items-center justify-center rounded-full bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 shadow-md shadow-blue-900/20 shrink-0 overflow-hidden ring-1 ring-white/10 group`}>
         
         {/* Top Gloss Reflection */}
         <div className="absolute top-0 inset-x-0 h-2/5 bg-gradient-to-b from-white/20 to-transparent pointer-events-none"></div>

         <svg viewBox="0 0 100 100" className="w-[65%] h-[65%] drop-shadow-sm relative z-10" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Main 4-Pointed Star (Sparkle) */}
            <path 
                d="M 50 15 C 50 38 65 50 88 50 C 65 50 50 62 50 85 C 50 62 35 50 12 50 C 35 50 50 38 50 15 Z" 
                fill="white"
                className="group-hover:scale-110 transition-transform duration-500 ease-out" 
            />
            
            {/* Decorative Particles (Tiny Stars) */}
            <path d="M 28 28 L 30 28 L 28 30 L 26 28 Z" fill="white" fillOpacity="0.7" className="animate-pulse" style={{ animationDuration: '2s' }} />
            <path d="M 72 72 L 74 72 L 72 74 L 70 72 Z" fill="white" fillOpacity="0.5" className="animate-pulse" style={{ animationDuration: '3s' }} />
            
            {/* Faint Orbit Ring */}
            <circle cx="50" cy="50" r="32" stroke="white" strokeWidth="0.5" strokeOpacity="0.2" />
         </svg>
      </div>
      
      {withText && (
        <div className="flex flex-col justify-center pt-0.5">
            {/* Main Brand: ReWord */}
            <div className="flex items-baseline leading-none tracking-tight">
              {/* "Re" uses current text color (White in sidebar, Dark in light mode) */}
              <span className="text-2xl font-black font-sans">
                Re
              </span>
              {/* "Word" is always Brand Blue */}
              <span className="text-2xl font-black text-blue-500 font-sans">
                Word
              </span>
              {/* Accent Dot */}
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 ml-0.5 mb-1 self-end"></div>
            </div>

            {/* Subtitle: 易语道 */}
            <div className="flex items-center mt-1 pl-0.5">
               <span className="text-[10px] font-bold opacity-60 tracking-[0.4em] uppercase font-sans whitespace-nowrap">
                 易语道
               </span>
            </div>
        </div>
      )}
    </div>
  );
};
