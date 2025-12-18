
import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastProps {
  toast: ToastMessage | null;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  useEffect(() => {
    if (toast) {
      // 动态时长计算：基础 1.5秒 + 每个字符 100毫秒，上限 6秒
      const baseDuration = 1500;
      const durationPerChar = 100;
      const duration = Math.min(Math.max(baseDuration, toast.message.length * durationPerChar), 6000);

      const timer = setTimeout(() => {
        onClose();
      }, duration);

      // 监听用户交互，一旦用户点击或按键（想要进行其他操作），立即关闭 Toast
      const handleUserInteraction = () => {
          onClose();
      };

      // 使用 capture 确保在事件冒泡前捕获，或者在 window 层级监听
      window.addEventListener('mousedown', handleUserInteraction);
      window.addEventListener('keydown', handleUserInteraction);

      return () => {
          clearTimeout(timer);
          window.removeEventListener('mousedown', handleUserInteraction);
          window.removeEventListener('keydown', handleUserInteraction);
      };
    }
  }, [toast, onClose]);

  if (!toast) return null;

  // Modern, cleaner style: White bg, colored icon/text, side border
  const styles = {
    success: { border: 'border-l-4 border-emerald-500', iconColor: 'text-emerald-500', icon: <CheckCircle /> },
    error: { border: 'border-l-4 border-red-500', iconColor: 'text-red-500', icon: <AlertCircle /> },
    warning: { border: 'border-l-4 border-amber-500', iconColor: 'text-amber-500', icon: <AlertCircle /> },
    info: { border: 'border-l-4 border-blue-500', iconColor: 'text-blue-500', icon: <Info /> },
  };

  const currentStyle = styles[toast.type];

  return (
    // 使用 Flex 居中代替 absolute + transform，避免与 animate-in 冲突导致的跳动
    <div className="fixed bottom-10 left-0 right-0 z-[9999] flex justify-center pointer-events-none">
      <div className={`bg-white px-6 py-4 rounded-lg shadow-2xl shadow-slate-400/20 flex items-center gap-4 min-w-[300px] max-w-lg border border-slate-100 ${currentStyle.border} pointer-events-auto animate-in slide-in-from-bottom-5 fade-in duration-300`}>
        <div className={`shrink-0 ${currentStyle.iconColor}`}>
            {React.cloneElement(currentStyle.icon as any, { className: "w-5 h-5" })}
        </div>
        <div className="flex-1 text-sm font-medium text-slate-700 leading-snug break-words">
          {toast.message}
        </div>
        <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="p-1 text-slate-400 hover:text-slate-600 rounded transition shrink-0 hover:bg-slate-100">
            <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
