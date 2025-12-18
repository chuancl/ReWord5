
import React from 'react';
import { LayoutDashboard, BookOpen, Palette, Settings, Briefcase, MousePointerClick, Languages, Database, AppWindow, Sliders, Zap } from 'lucide-react';
import { AppView, SettingSectionId } from '../types';
import { Logo } from './Logo';

interface SidebarProps {
  currentView: AppView;
  onViewChange: (view: AppView) => void;
  onSettingScroll: (id: SettingSectionId) => void;
  activeSettingSection: SettingSectionId | null;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange, onSettingScroll, activeSettingSection }) => {
  
  const mainNav = [
    { id: 'dashboard', label: '仪表盘', icon: LayoutDashboard },
    { id: 'words', label: '词汇管理', icon: BookOpen },
  ] as const;

  const settingNav = [
    { id: 'general', label: '常规选项', icon: Sliders },
    { id: 'visual-styles', label: '视觉样式', icon: Palette },
    { id: 'scenarios', label: '场景配置', icon: Briefcase },
    { id: 'word-bubble', label: '单词交互气泡', icon: MousePointerClick },
    { id: 'page-widget', label: '悬浮球弹窗', icon: AppWindow },
    { id: 'engines', label: '翻译引擎', icon: Languages },
    { id: 'preview', label: '真实效果预览', icon: Zap },
    { id: 'anki', label: 'Anki 集成', icon: Database },
  ] as const;

  return (
    <div className="w-64 bg-slate-900 text-slate-100 h-screen flex flex-col fixed left-0 top-0 overflow-y-auto z-50 shadow-xl">
      <div className="px-6 pt-8 pb-6">
        {/* Pass text-white to ensure 'Re' appears white on dark background */}
        <Logo className="w-10 h-10 shadow-lg" textClassName="text-white" />
      </div>

      <nav className="flex-1 px-3 space-y-6">
        {/* Main Views */}
        <div className="space-y-1">
          {mainNav.map((item) => (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id as AppView)}
              className={`w-full flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                currentView === item.id 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon className={`mr-3 h-5 w-5 ${currentView === item.id ? 'text-white' : 'text-slate-500'}`} />
              {item.label}
            </button>
          ))}
        </div>

        {/* General Settings Group */}
        <div>
          <button
            onClick={() => onViewChange('settings')}
            className={`w-full flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 mb-2 ${
                currentView === 'settings' 
                  ? 'bg-slate-800 text-white' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
          >
            <Settings className={`mr-3 h-5 w-5 ${currentView === 'settings' ? 'text-white' : 'text-slate-500'}`} />
            通用设置
          </button>

          {/* Submenu for Settings - Always Expanded */}
          <div className={`space-y-1 ml-4 border-l-2 border-slate-700 pl-2 transition-all duration-300 opacity-100`}>
             {settingNav.map((item) => {
               const isActive = currentView === 'settings' && activeSettingSection === item.id;
               return (
                <button
                  key={item.id}
                  onClick={() => {
                    onViewChange('settings');
                    setTimeout(() => onSettingScroll(item.id as SettingSectionId), 10);
                  }}
                  className={`w-full flex items-center px-3 py-2 text-sm rounded-md transition-all ${
                    isActive
                      ? 'bg-slate-800/50 text-blue-400 font-medium translate-x-1'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <item.icon className="mr-3 h-4 w-4" />
                  {item.label}
                </button>
               );
             })}
          </div>
        </div>
      </nav>

      <div className="p-4 border-t border-slate-800">
        {currentView === 'word-detail' ? (
            <div className="text-center text-xs text-slate-500 mb-2 bg-slate-800 rounded p-2 border border-slate-700">
               正在查看单词详情
            </div>
        ) : (
            <div className="flex items-center text-xs text-slate-500 mb-2">
                <span>当前状态:</span>
                <span className="ml-auto text-emerald-400">运行中</span>
            </div>
        )}
        <div className="w-full bg-slate-800 rounded-full h-1.5 mb-1">
           <div className="bg-emerald-500 h-1.5 rounded-full" style={{width: '100%'}}></div>
        </div>
      </div>
    </div>
  );
};
