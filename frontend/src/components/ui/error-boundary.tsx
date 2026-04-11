'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCcw, AlertCircle, Home } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] p-4 text-white">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md bg-[#161616]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl overflow-hidden relative"
          >
            {/* Background Glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20">
                <AlertCircle className="w-10 h-10 text-red-500" />
              </div>
              
              <div className="space-y-2">
                <h1 className="text-2xl font-bold tracking-tight">Something went wrong</h1>
                <p className="text-white/60 text-sm leading-relaxed">
                  The application encountered an unexpected error. We've been notified and are looking into it.
                </p>
              </div>

              {this.state.error && (
                <div className="w-full p-4 bg-black/40 rounded-xl border border-white/5 font-mono text-xs text-red-400 overflow-auto max-h-32 text-left">
                  {this.state.error.message}
                </div>
              )}

              <div className="w-full flex flex-col gap-3">
                <button
                  onClick={this.handleReset}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-white text-black font-semibold rounded-xl hover:bg-white/90 transition-all duration-200 active:scale-[0.98]"
                >
                  <RefreshCcw className="w-4 h-4" />
                  Try Again
                </button>
                
                <a
                  href="/"
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-white/5 text-white font-medium rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-200"
                >
                  <Home className="w-4 h-4" />
                  Return Home
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}
