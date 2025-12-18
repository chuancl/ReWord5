
import React from 'react';
import { PageWidgetConfig } from '../../types';

interface FloatingBallProps {
    config: PageWidgetConfig;
    badgeCount: number;
    isDragging: boolean;
    onMouseDown: (e: React.MouseEvent) => void;
    onClick: (e: React.MouseEvent) => void;
}

export const FloatingBall: React.FC<FloatingBallProps> = ({ config, badgeCount, isDragging, onMouseDown, onClick }) => {
    return (
        <div 
            className={`fixed z-[2147483647] cursor-move select-none group touch-none`}
            style={{ 
                left: config.x, 
                top: config.y,
                pointerEvents: 'auto'
            }}
            onMouseDown={onMouseDown}
            onClick={(e) => {
                if (!isDragging) onClick(e);
            }}
        >
            {/* Wrapper for Float Animation (only when not dragging) */}
            <div className={`relative w-16 h-16 flex items-center justify-center transition-transform duration-300 ease-out ${isDragging ? 'scale-90 cursor-grabbing' : 'hover:scale-110 animate-float'}`}>
                
                {/* --- Layer 0: Magic Energy Halo (Rotating Outer Ring) --- */}
                <div className="absolute -inset-4 rounded-full opacity-50 blur-lg animate-spin-slow pointer-events-none"
                     style={{
                         background: 'conic-gradient(from 0deg, transparent 0%, rgba(59, 130, 246, 0.2) 25%, rgba(168, 85, 247, 0.4) 50%, rgba(59, 130, 246, 0.2) 75%, transparent 100%)'
                     }}
                ></div>
                
                {/* --- Layer 1: Ambient Glow (Backlight) --- */}
                <div className="absolute -inset-1 rounded-full bg-indigo-500/30 blur-md group-hover:bg-indigo-500/50 transition-colors duration-500"></div>

                {/* --- Layer 2: The Crystal Sphere (Main Body) --- */}
                <div 
                    className="relative w-full h-full rounded-full overflow-hidden backdrop-blur-[1px] z-10 border border-white/30"
                    style={{
                        // Ultra-Deep 3D Shadow Stack
                        boxShadow: `
                            inset -12px -12px 24px rgba(17, 24, 39, 0.4),   /* Deep Dark Core Shadow (Bottom Right) */
                            inset 8px 8px 16px rgba(255, 255, 255, 0.7),    /* Bright Upper Highlight (Top Left) */
                            inset 0 0 20px rgba(124, 58, 237, 0.2),         /* Inner Magic Glow (Violet Tint) */
                            0 12px 24px rgba(0, 0, 0, 0.25),                /* Main Drop Shadow (Levitation) */
                            0 4px 8px rgba(0, 0, 0, 0.1)                    /* Ambient Contact Shadow */
                        `,
                        // Glossy Glass Gradient: Transparent center, reflective edges
                        background: 'radial-gradient(circle at 35% 30%, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.1) 30%, rgba(167, 139, 250, 0.1) 60%, rgba(30, 58, 138, 0.2) 100%)'
                    }}
                >
                    {/* 2.1 Hard Specular Highlight (The "Glint") */}
                    <div className="absolute top-[12%] left-[15%] w-[35%] h-[20%] bg-gradient-to-b from-white to-transparent opacity-90 rounded-full rotate-[-45deg] blur-[1px] pointer-events-none filter brightness-150"></div>
                    
                    {/* 2.2 Secondary Point Light */}
                    <div className="absolute top-[20%] left-[10%] w-[6%] h-[6%] bg-white rounded-full blur-[0.5px] pointer-events-none"></div>

                    {/* 2.3 Rim Light / Caustics at Bottom (Refracted Light) */}
                    <div className="absolute bottom-[5%] right-[10%] w-[70%] h-[35%] bg-gradient-to-t from-cyan-400/40 via-blue-500/20 to-transparent opacity-80 rounded-full blur-[6px] rotate-[-20deg] pointer-events-none mix-blend-overlay"></div>

                    {/* --- Layer 3: The Suspended Core Icon (Cat Paw) --- */}
                    <div className="absolute inset-0 flex items-center justify-center z-20">
                        {/* Core Icon with SVG Glow Filter */}
                        <div className="relative transform transition-transform duration-500 group-hover:scale-110 filter drop-shadow-[0_4px_4px_rgba(0,0,0,0.3)]">
                            <svg width="36" height="36" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <defs>
                                    <linearGradient id="core_gradient" x1="0" y1="0" x2="100" y2="100">
                                        <stop offset="0%" stopColor="#60a5fa" />    {/* Light Blue */}
                                        <stop offset="50%" stopColor="#3b82f6" />   {/* Blue */}
                                        <stop offset="100%" stopColor="#7c3aed" />  {/* Violet */}
                                    </linearGradient>
                                    {/* Inner Glow Filter for the Icon */}
                                    <filter id="icon_glow" x="-20%" y="-20%" width="140%" height="140%">
                                        <feGaussianBlur stdDeviation="2" result="blur"/>
                                        <feComposite in="SourceGraphic" in2="blur" operator="over"/>
                                    </filter>
                                </defs>
                                
                                {/* Cat Paw - Toes */}
                                <ellipse cx="18" cy="40" rx="9" ry="11" transform="rotate(-20 18 40)" fill="url(#core_gradient)" filter="url(#icon_glow)" />
                                <ellipse cx="38" cy="25" rx="9" ry="11" transform="rotate(-10 38 25)" fill="url(#core_gradient)" filter="url(#icon_glow)" />
                                <ellipse cx="62" cy="25" rx="9" ry="11" transform="rotate(10 62 25)" fill="url(#core_gradient)" filter="url(#icon_glow)" />
                                <ellipse cx="82" cy="40" rx="9" ry="11" transform="rotate(20 82 40)" fill="url(#core_gradient)" filter="url(#icon_glow)" />

                                {/* Cat Paw - Main Pad */}
                                <path 
                                    d="M 28 62 Q 50 48 72 62 Q 82 78 65 88 Q 50 82 35 88 Q 18 78 28 62 Z"
                                    fill="url(#core_gradient)"
                                    filter="url(#icon_glow)"
                                />

                                {badgeCount > 0 && (
                                    <circle cx="88" cy="20" r="8" fill="#f43f5e" className="animate-ping" style={{ animationDuration: '2s' }} />
                                )}
                            </svg>
                        </div>
                    </div>
                </div>

                {/* --- Layer 4: Notification Gemstone --- */}
                {badgeCount > 0 && (
                    <div className="absolute -top-1 -right-1 z-30 perspective-500">
                        <div className="relative flex h-6 min-w-[24px] px-1.5 items-center justify-center group/badge">
                            {/* Magical glow behind badge */}
                            <span className="absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-50 blur-md animate-pulse"></span>
                            
                            <span 
                                className="relative inline-flex rounded-full h-5 min-w-[20px] px-1.5 bg-gradient-to-br from-rose-500 via-red-500 to-pink-600 text-[10px] font-extrabold text-white items-center justify-center leading-none border border-white/60 shadow-lg"
                                style={{ boxShadow: '0 4px 6px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,0.5)' }}
                            >
                                {badgeCount > 99 ? '99+' : badgeCount}
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
