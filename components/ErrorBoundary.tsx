import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RotateCcw, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught Error caught by ErrorBoundary:", error, errorInfo);
  }

  private handleReset = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
          registrations.forEach(r => r.unregister());
        });
      }
    } catch (e) {
      console.error(e);
    }
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-slate-900 text-white flex items-center justify-center p-6 text-center">
          <div className="max-w-md w-full bg-slate-800/90 backdrop-blur-md p-8 rounded-[2.5rem] border border-slate-700 shadow-2xl flex flex-col items-center">
            <div className="w-16 h-16 bg-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center mb-5 border border-amber-500/30">
              <AlertTriangle size={32} />
            </div>
            <h2 className="text-2xl font-black mb-2">Actualización en KineFlow Pro</h2>
            <p className="text-slate-300 text-xs font-medium mb-6 leading-relaxed">
              Safari guardó una sesión anterior en la memoria del teléfono. Presiona el botón a continuación para limpiar la caché de este dispositivo y cargar la nueva versión.
            </p>
            <button
              onClick={this.handleReset}
              className="w-full py-4 bg-primary-600 hover:bg-primary-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary-600/30 active:scale-95 cursor-pointer"
            >
              <RotateCcw size={16} /> Limpiar Memoria y Recargar
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
