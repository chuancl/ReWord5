
import React from 'react';

export const SourceBadge = ({ source }: { source: string }) => (
    <div className="mt-4 pt-3 border-t border-slate-50 flex justify-end">
        <span className="text-[10px] text-slate-300 font-mono tracking-wide uppercase">Source: {source}</span>
    </div>
);
