
import React, { useState } from 'react';
import { Image as ImageIcon, ArrowLeft, ArrowRight } from 'lucide-react';
import { PicDictData } from '../../types/youdao';
import { SourceBadge } from './SourceBadge';

interface ImageGalleryProps {
    word: string;
    picDict?: PicDictData;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({ word, picDict }) => {
    const images = picDict?.pic || [];
    const [activeImageIndex, setActiveImageIndex] = useState(0);

    if (images.length === 0) return null;

    const handlePrevImage = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setActiveImageIndex(prev => Math.max(0, prev - 1));
    };
    
    const handleNextImage = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setActiveImageIndex(prev => Math.min(images.length - 1, prev + 1));
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
                <ImageIcon className="w-5 h-5 text-rose-500" />
                <h3 className="text-lg font-bold text-slate-800">单词配图 (Images)</h3>
            </div>
            
            {/* 3D Stage */}
            <div className="relative w-full h-[400px] flex items-center justify-center bg-slate-900 rounded-xl overflow-hidden group select-none perspective-1000">
                
                {/* Background Glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-blue-500/10 blur-[100px] rounded-full"></div>
                </div>

                {images.map((img, idx) => {
                    const offset = idx - activeImageIndex;
                    const absOffset = Math.abs(offset);
                    
                    // Visibility Optimization: Only render nearby items
                    if (absOffset > 2) return null;

                    // 3D Transform Calculation
                    const isActive = offset === 0;
                    const xTranslate = offset * 55; // 55% shift per item
                    const scale = 1 - (absOffset * 0.15); // Scale down neighbors
                    const rotateY = offset > 0 ? -45 : (offset < 0 ? 45 : 0); // Rotate inward
                    const zIndex = 10 - absOffset;
                    const opacity = 1 - (absOffset * 0.3);

                    return (
                        <div 
                            key={idx}
                            onClick={() => setActiveImageIndex(idx)}
                            className={`absolute w-[60%] h-[75%] rounded-xl shadow-2xl transition-all duration-500 ease-out cursor-pointer origin-center
                                ${isActive ? 'border-2 border-white/20 ring-1 ring-white/10' : 'brightness-50 hover:brightness-75'}`}
                            style={{
                                transform: `translateX(${xTranslate}%) scale(${scale}) perspective(1000px) rotateY(${rotateY}deg)`,
                                zIndex: zIndex,
                                opacity: opacity,
                                // Ensure center alignment for absolute items
                                left: '20%', // (100% - 60%)/2
                            }}
                        >
                            <img 
                                src={img.image} 
                                className="w-full h-full object-cover rounded-xl" 
                                alt={`${word} ${idx + 1}`}
                                loading="lazy"
                            />
                            
                            {/* Reflection Effect (Simple Gradient) */}
                            {isActive && (
                                    <div className="absolute -bottom-6 left-0 right-0 h-6 bg-gradient-to-b from-white/20 to-transparent blur-sm transform scale-y-[-1] opacity-50 mask-image-gradient"></div>
                            )}
                        </div>
                    );
                })}

                {/* Navigation Controls */}
                {images.length > 1 && (
                    <>
                        <button 
                            onClick={handlePrevImage}
                            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 text-white shadow-lg transition-all hover:scale-110 disabled:opacity-30 disabled:cursor-not-allowed"
                            disabled={activeImageIndex === 0}
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                        <button 
                            onClick={handleNextImage}
                            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 text-white shadow-lg transition-all hover:scale-110 disabled:opacity-30 disabled:cursor-not-allowed"
                            disabled={activeImageIndex === images.length - 1}
                        >
                            <ArrowRight className="w-6 h-6" />
                        </button>
                    </>
                )}

                {/* Indicators */}
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-20">
                    {images.slice(0, 5).map((_, dotIdx) => (
                        <div 
                            key={dotIdx} 
                            className={`w-2 h-2 rounded-full transition-all duration-300 ${dotIdx === activeImageIndex ? 'w-6 bg-blue-500' : 'bg-white/30 hover:bg-white/50'}`}
                        />
                    ))}
                </div>
            </div>
            <SourceBadge source="pic_dict" />
        </div>
    );
};
