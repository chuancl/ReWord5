
import React, { useState } from 'react';
import { Scenario } from '../../types';
import { Trash2, Plus } from 'lucide-react';

interface ScenariosSectionProps {
  scenarios: Scenario[];
  setScenarios: React.Dispatch<React.SetStateAction<Scenario[]>>;
}

export const ScenariosSection: React.FC<ScenariosSectionProps> = ({ scenarios, setScenarios }) => {
  const [newScenarioName, setNewScenarioName] = useState('');

  const addScenario = () => {
    if (!newScenarioName.trim()) return;
    const newId = (scenarios.length + 1).toString();
    setScenarios([...scenarios, { id: newId, name: newScenarioName, isActive: false, isCustom: true }]);
    setNewScenarioName('');
  };

  const deleteScenario = (id: string) => {
    if (id === '1') return; 
    setScenarios(scenarios.filter(s => s.id !== id));
  };

  return (
    <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-800">学习场景</h2>
          <p className="text-sm text-slate-500">不同场景可独立维护词库（如考试、旅游、工作）。</p>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
           {scenarios.map(s => (
             <div key={s.id} className={`relative flex items-center justify-between p-4 rounded-xl border-2 transition-all ${s.isActive ? 'border-blue-500 bg-blue-50' : 'border-slate-100 hover:border-blue-200'}`}>
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 ${s.isActive ? 'bg-blue-500' : 'bg-slate-300'}`}></div>
                  <span className={`font-medium ${s.isActive ? 'text-blue-800' : 'text-slate-600'}`}>{s.name}</span>
                </div>
                {s.id !== '1' && (
                  <button onClick={() => deleteScenario(s.id)} className="text-slate-400 hover:text-red-500 p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
             </div>
           ))}
        </div>
        <div className="flex gap-2">
           <input 
             type="text" 
             placeholder="输入新场景名称..."
             value={newScenarioName}
             onChange={(e) => setNewScenarioName(e.target.value)}
             className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
           />
           <button onClick={addScenario} className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 flex items-center text-sm">
             <Plus className="w-4 h-4 mr-2" /> 添加
           </button>
        </div>
      </div>
    </section>
  );
};
