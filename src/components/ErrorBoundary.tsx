import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    private handleReset = () => {
        localStorage.removeItem('habit-tracker-storage');
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-[#0E0F13] text-white flex flex-col items-center justify-center p-4 text-center">
                    <div className="max-w-md w-full bg-[#161821] p-8 rounded-3xl border border-white/10 shadow-2xl">
                        <h1 className="text-2xl font-bold mb-4 text-red-500">Algo salió mal 😔</h1>
                        <p className="text-gray-400 mb-6">
                            La aplicación ha encontrado un error inesperado al iniciar.
                        </p>

                        <div className="bg-black/30 p-4 rounded-xl text-left mb-6 overflow-auto max-h-40 text-xs font-mono text-red-300">
                            {this.state.error?.message || 'Error desconocido'}
                        </div>

                        <p className="text-sm text-gray-500 mb-6">
                            Si el problema persiste, intenta restablecer los datos de la aplicación.
                            Esto eliminará tus hábitos guardados localmente.
                        </p>

                        <button
                            onClick={this.handleReset}
                            className="w-full py-3 px-6 bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl transition-colors shadow-lg shadow-red-500/20"
                        >
                            Restablecer Datos y Reiniciar
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
