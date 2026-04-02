
import React from 'react';
import { X, Play, Check } from 'lucide-react';

interface SoundOption {
  id: string;
  name: string;
  url: string;
}

interface SoundSettingsProps {
  options: SoundOption[];
  selectedUrl: string;
  onSelect: (url: string) => void;
  onClose: () => void;
}

export const SoundSettings: React.FC<SoundSettingsProps> = ({ options, selectedUrl, onSelect, onClose }) => {
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[300] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Ajustes de Sonido</h2>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Notificaciones de Sala</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-all text-slate-400 hover:text-slate-600 shadow-sm">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 max-h-[60vh] overflow-y-auto space-y-2">
          {options.map((option) => (
            <button
              key={option.id}
              onClick={() => onSelect(option.url)}
              className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all border-2 ${
                selectedUrl === option.url 
                  ? 'bg-primary-50 border-primary-500 shadow-md' 
                  : 'bg-white border-slate-100 hover:border-primary-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  selectedUrl === option.url ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-400'
                }`}>
                  <Play size={18} fill={selectedUrl === option.url ? 'currentColor' : 'none'} />
                </div>
                <span className={`font-bold text-sm ${selectedUrl === option.url ? 'text-primary-900' : 'text-slate-600'}`}>
                  {option.name}
                </span>
              </div>
              {selectedUrl === option.url && (
                <div className="bg-primary-600 text-white p-1 rounded-full">
                  <Check size={14} strokeWidth={3} />
                </div>
              )}
            </button>
          ))}
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100">
          <button 
            onClick={onClose}
            className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl hover:bg-slate-800 transition-all active:scale-95"
          >
            Guardar y Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
