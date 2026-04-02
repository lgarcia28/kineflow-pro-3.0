import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Settings, Timer as TimerIcon, Zap, Coffee, Repeat, Layers } from 'lucide-react';

type TimerPhase = 'PREPARE' | 'WORK' | 'REST' | 'SET_REST' | 'FINISHED';

interface TabataSettings {
  prepare: number;
  work: number;
  rest: number;
  cycles: number;
  sets: number;
  setRest: number;
}

export const TabataTimer: React.FC = () => {
  const [isStarted, setIsStarted] = useState(false);
  const [settings, setSettings] = useState<TabataSettings>({
    prepare: 10,
    work: 20,
    rest: 10,
    cycles: 8,
    sets: 1,
    setRest: 60,
  });

  const calculateTotalTime = (s: TabataSettings) => {
    // Total = Sets * (Cycles * Work + (Cycles - 1) * Rest) + (Sets - 1) * SetRest
    return s.sets * (s.cycles * s.work + (s.cycles - 1) * s.rest) + (s.sets - 1) * s.setRest;
  };

  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState<TimerPhase>('PREPARE');
  const [timeLeft, setTimeLeft] = useState(10);
  const [totalTimeLeft, setTotalTimeLeft] = useState(calculateTotalTime(settings));
  const [currentCycle, setCurrentCycle] = useState(1);
  const [currentSet, setCurrentSet] = useState(1);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!isStarted) {
      setTotalTimeLeft(calculateTotalTime(settings));
      setTimeLeft(settings.prepare);
    }
  }, [settings, isStarted]);

  const initAudio = () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
    } catch (e) {
      console.error("Audio context initialization failed", e);
    }
  };

  const playSound = (type: 'tick' | 'start' | 'finish' | 'whistle') => {
    try {
      initAudio();
      if (!audioCtxRef.current) return;
      
      const audioCtx = audioCtxRef.current;
      const now = audioCtx.currentTime;

      const createOscillator = (freq: number, startTime: number, duration: number, volume: number, type: OscillatorType = 'sine') => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(volume, startTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      if (type === 'tick') {
        createOscillator(440, now, 0.1, 0.1);
      } else if (type === 'start') {
        createOscillator(880, now, 0.3, 0.2);
      } else if (type === 'finish') {
        createOscillator(1320, now, 0.5, 0.2);
      } else if (type === 'whistle') {
        // More realistic whistle: two frequencies + noise
        const duration = 0.5;
        
        const playWhistlePart = (freq: number) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now);
          osc.frequency.exponentialRampToValueAtTime(freq - 100, now + duration);
          
          // Add some vibrato
          const lfo = audioCtx.createOscillator();
          const lfoGain = audioCtx.createGain();
          lfo.frequency.value = 30;
          lfoGain.gain.value = 20;
          lfo.connect(lfoGain);
          lfoGain.connect(osc.frequency);
          lfo.start(now);
          lfo.stop(now + duration);

          gain.gain.setValueAtTime(0, now);
          gain.gain.linearRampToValueAtTime(0.2, now + 0.05);
          gain.gain.linearRampToValueAtTime(0.2, now + duration - 0.1);
          gain.gain.linearRampToValueAtTime(0, now + duration);
          
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(now);
          osc.stop(now + duration);
        };

        playWhistlePart(2500);
        playWhistlePart(2550); // Slight detune for "beating" effect

        // Add some noise for air effect
        const bufferSize = audioCtx.sampleRate * duration;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        const noise = audioCtx.createBufferSource();
        noise.buffer = buffer;
        const noiseGain = audioCtx.createGain();
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 2500;
        filter.Q.value = 1;

        noiseGain.gain.setValueAtTime(0, now);
        noiseGain.gain.linearRampToValueAtTime(0.05, now + 0.05);
        noiseGain.gain.linearRampToValueAtTime(0, now + duration);

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(audioCtx.destination);
        noise.start(now);
        noise.stop(now + duration);
      }
    } catch (e) {
      console.error("Sound playback failed", e);
    }
  };

  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) return 0;
          return prev - 1;
        });

        if (phase !== 'PREPARE' && phase !== 'FINISHED') {
          setTotalTimeLeft((prev) => Math.max(0, prev - 1));
        }
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, phase]);

  useEffect(() => {
    if (!isActive) return;

    if (timeLeft === 0) {
      handlePhaseTransition();
    } else if (timeLeft <= 3) {
      playSound('tick');
    }
  }, [timeLeft, isActive]);

  const handlePhaseTransition = () => {
    if (phase === 'PREPARE') {
      playSound('whistle');
      setPhase('WORK');
      setTimeLeft(settings.work);
    } else if (phase === 'WORK') {
      playSound('whistle');
      if (currentCycle < settings.cycles) {
        setPhase('REST');
        setTimeLeft(settings.rest);
      } else {
        if (currentSet < settings.sets) {
          setPhase('SET_REST');
          setTimeLeft(settings.setRest);
        } else {
          setPhase('FINISHED');
          setIsActive(false);
          playSound('finish');
        }
      }
    } else if (phase === 'REST') {
      playSound('whistle');
      setPhase('WORK');
      setCurrentCycle((prev) => prev + 1);
      setTimeLeft(settings.work);
    } else if (phase === 'SET_REST') {
      playSound('whistle');
      setPhase('WORK');
      setCurrentCycle(1);
      setCurrentSet((prev) => prev + 1);
      setTimeLeft(settings.work);
    }
  };

  const startWorkout = () => {
    initAudio();
    setIsStarted(true);
    setIsActive(true);
  };

  const toggleTimer = () => {
    initAudio();
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setIsStarted(false);
    setPhase('PREPARE');
    setTimeLeft(settings.prepare);
    setTotalTimeLeft(calculateTotalTime(settings));
    setCurrentCycle(1);
    setCurrentSet(1);
  };

  const updateSetting = (key: keyof TabataSettings, value: number) => {
    const newSettings = { ...settings, [key]: Math.max(1, value) };
    setSettings(newSettings);
  };

  const getPhaseColor = () => {
    switch (phase) {
      case 'PREPARE': return 'text-blue-500 bg-blue-50';
      case 'WORK': return 'text-red-500 bg-red-50';
      case 'REST': return 'text-emerald-500 bg-emerald-50';
      case 'SET_REST': return 'text-amber-500 bg-amber-50';
      case 'FINISHED': return 'text-purple-500 bg-purple-50';
      default: return 'text-slate-500 bg-slate-50';
    }
  };

  const getPhaseLabel = () => {
    switch (phase) {
      case 'PREPARE': return 'Prepárate';
      case 'WORK': return '¡DALE!';
      case 'REST': return 'Descansa';
      case 'SET_REST': return 'Descanso Largo';
      case 'FINISHED': return '¡Terminado!';
      default: return '';
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const totalTime = phase === 'WORK' ? settings.work : 
                    phase === 'REST' ? settings.rest : 
                    phase === 'SET_REST' ? settings.setRest : 
                    settings.prepare;

  const progress = (timeLeft / totalTime) * 100;

  if (!isStarted) {
    return (
      <div className="w-full max-w-2xl mx-auto p-4">
        <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden p-6 lg:p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-primary-100 text-primary-600 rounded-2xl">
              <TimerIcon size={24} />
            </div>
            <div>
              <h3 className="text-xl lg:text-2xl font-black text-slate-900">Configurar Tabata</h3>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Personaliza tu entrenamiento</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <SettingItem label="Preparación" value={settings.prepare} onChange={(v) => updateSetting('prepare', v)} icon={<TimerIcon size={14} />} />
            <SettingItem label="Trabajo" value={settings.work} onChange={(v) => updateSetting('work', v)} icon={<Zap size={14} />} />
            <SettingItem label="Descanso" value={settings.rest} onChange={(v) => updateSetting('rest', v)} icon={<Coffee size={14} />} />
            <SettingItem label="Ciclos" value={settings.cycles} onChange={(v) => updateSetting('cycles', v)} icon={<Repeat size={14} />} />
            <SettingItem label="Series" value={settings.sets} onChange={(v) => updateSetting('sets', v)} icon={<Layers size={14} />} />
            <SettingItem label="Descanso Serie" value={settings.setRest} onChange={(v) => updateSetting('setRest', v)} icon={<Coffee size={14} />} />
          </div>

          <div className="bg-slate-50 rounded-3xl p-6 mb-8 border border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Duración Total Estimada</p>
              <p className="text-3xl font-black text-slate-900 tabular-nums">{formatTime(calculateTotalTime(settings))}</p>
            </div>
            <button 
              onClick={startWorkout}
              className="w-full sm:w-auto px-8 py-4 bg-primary-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-primary-200 hover:bg-primary-700 hover:scale-105 transition-all active:scale-95 flex items-center justify-center gap-3"
            >
              <Play size={20} fill="white" />
              Comenzar Entrenamiento
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl mx-auto p-4">
      <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden p-8 flex flex-col items-center">
        
        <div className={`px-6 py-2 rounded-full ${getPhaseColor()} font-black uppercase tracking-widest text-xs mb-6 flex items-center gap-2 shadow-sm`}>
          {getPhaseLabel()}
        </div>

        <div className="text-center mb-6">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tiempo Total Restante</p>
          <p className="text-3xl font-black text-slate-900 tabular-nums">{formatTime(totalTimeLeft)}</p>
        </div>

        <div className="relative w-56 h-56 sm:w-64 sm:h-64 flex items-center justify-center mb-8">
          <svg className="w-full h-full -rotate-90">
            <circle
              cx="50%"
              cy="50%"
              r="45%"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-slate-100"
            />
            <circle
              cx="50%"
              cy="50%"
              r="45%"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeDasharray="283%"
              strokeDashoffset={`${283 - (283 * progress) / 100}%`}
              className={`${getPhaseColor().split(' ')[0]} transition-all duration-1000 ease-linear`}
              strokeLinecap="round"
              style={{ strokeDasharray: '283%', strokeDashoffset: `${283 - (283 * progress) / 100}%` }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-7xl sm:text-8xl font-black text-slate-900 tabular-nums leading-none">
              {timeLeft}
            </span>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Segundos</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 w-full max-w-sm mb-8">
          <div className="bg-slate-50 p-4 rounded-2xl text-center border border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ciclo</p>
            <p className="text-xl font-black text-slate-900">{currentCycle} <span className="text-slate-300 text-sm">/ {settings.cycles}</span></p>
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl text-center border border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Serie</p>
            <p className="text-xl font-black text-slate-900">{currentSet} <span className="text-slate-300 text-sm">/ {settings.sets}</span></p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <button 
            onClick={resetTimer}
            className="w-14 h-14 bg-white shadow-xl rounded-2xl flex items-center justify-center text-slate-400 hover:text-red-500 transition-all active:scale-90 border border-slate-100 group"
            title="Finalizar y volver"
          >
            <RotateCcw size={24} className="group-hover:rotate-[-45deg] transition-transform" />
          </button>
          
          <button 
            onClick={toggleTimer}
            className={`w-20 h-20 rounded-3xl flex flex-col items-center justify-center text-white shadow-2xl transition-all transform active:scale-95 ${isActive ? 'bg-slate-900 shadow-slate-200' : 'bg-primary-600 shadow-primary-200'}`}
          >
            <div className="flex items-center justify-center">
              {isActive ? <Pause size={32} fill="white" /> : <Play size={32} fill="white" className="ml-1" />}
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest mt-1">{isActive ? 'Pausa' : 'Seguir'}</span>
          </button>

          <div className="w-14 h-14"></div>
        </div>
      </div>
    </div>
  );
};

interface SettingItemProps {
  label: string;
  value: number;
  onChange: (val: number) => void;
  icon: React.ReactNode;
}

const SettingItem: React.FC<SettingItemProps> = ({ label, value, onChange, icon }) => (
  <div className="bg-slate-50 p-3 lg:p-2 rounded-2xl border border-slate-100 group hover:border-primary-200 transition-colors">
    <div className="flex items-center gap-2 mb-2 lg:mb-1">
      <div className="p-1.5 bg-white rounded-lg text-slate-400 group-hover:text-primary-500 transition-colors shadow-sm">
        {icon}
      </div>
      <p className="text-[9px] lg:text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</p>
    </div>
    <div className="flex items-center justify-between bg-white p-1.5 rounded-xl shadow-sm border border-slate-100">
      <button 
        onClick={() => onChange(value - 1)} 
        className="w-8 h-8 lg:w-7 lg:h-7 bg-slate-50 rounded-lg flex items-center justify-center text-slate-900 hover:bg-primary-50 hover:text-primary-600 active:scale-90 transition-all font-black text-base"
      >
        -
      </button>
      <input 
        type="number"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value) || 0)}
        className="w-16 text-center text-lg lg:text-base font-black text-slate-900 tabular-nums bg-transparent border-none focus:outline-none focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        inputMode="numeric"
      />
      <button 
        onClick={() => onChange(value + 1)} 
        className="w-8 h-8 lg:w-7 lg:h-7 bg-slate-50 rounded-lg flex items-center justify-center text-slate-900 hover:bg-primary-50 hover:text-primary-600 active:scale-90 transition-all font-black text-base"
      >
        +
      </button>
    </div>
  </div>
);
