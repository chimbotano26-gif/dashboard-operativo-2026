import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCw, MapPin } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class MapErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('[MapErrorBoundary caught error]:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 w-full min-h-[500px] bg-[#071324] rounded-xl border border-cyan-800/80 p-6 flex flex-col items-center justify-center text-center text-white">
          <div className="p-3.5 rounded-full bg-rose-950/80 border border-rose-500/60 text-rose-400 mb-3 shadow-lg">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h3 className="text-base font-black text-cyan-200 uppercase tracking-wide mb-1">
            {this.props.fallbackTitle || 'Protección Activa del Mapa Táctico'}
          </h3>
          <p className="text-xs text-slate-300 max-w-md leading-relaxed mb-4">
            Se interceptó un conflicto de renderizado externo para evitar que la pantalla se vuelva negra. El sistema puede restablecerse al mapa base vectorial nativo de forma instantánea.
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={this.handleRetry}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg transition-transform active:scale-95"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Restablecer Mapa Estable</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
