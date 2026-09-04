import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Users, ArrowLeftRight } from 'lucide-react';
import { Button } from 'antd';

export const AuthPage: React.FC = () => {
  const { loginWithGoogle } = useAuth();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      await loginWithGoogle();
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between py-6 sm:py-10 px-4 sm:px-6 lg:px-8">
      {/* Top Header */}
      <div className="max-w-4xl mx-auto w-full flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-700 text-white flex items-center justify-center font-bold shadow-sm">
            <Users className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="flex items-center">
            <span className="text-lg sm:text-xl font-black tracking-tight text-slate-900">Kelompokin</span>
            <span className="ml-2 text-[9px] sm:text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
              App
            </span>
          </div>
        </div>
      </div>

      {/* Main Authentication Card */}
      <div className="max-w-md mx-auto w-full py-4 sm:py-6">
        <div className="bg-white rounded-2xl border border-slate-300 shadow-sm p-6 sm:p-10 space-y-6 sm:space-y-8 text-center">
          {/* Header Icon */}
          <div className="space-y-2.5 sm:space-y-3">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-indigo-700 text-white mx-auto flex items-center justify-center shadow-sm">
              <ArrowLeftRight className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Sistem Pengacakan & Pertukaran Kelompok
            </h1>
            <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
              Masuk dengan akun Google untuk membuat sesi grup belajar baru atau bergabung ke grup dengan kode akses.
            </p>
          </div>

          {/* Unified Google Sign-In */}
          <div className="space-y-3">
            <Button
              type="primary"
              size="large"
              loading={isLoggingIn}
              onClick={handleLogin}
              className="w-full h-12 sm:h-14 rounded-xl font-black text-xs sm:text-sm bg-indigo-700 hover:bg-indigo-800 border-0 flex items-center justify-center space-x-2.5 text-white shadow-sm"
            >
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#ffffff"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#ffffff"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#ffffff"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#ffffff"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Masuk dengan Akun Google</span>
            </Button>
          </div>

          <div className="pt-2 border-t border-slate-200 text-[10px] sm:text-[11px] text-slate-400">
            Platform universal untuk kelas kuliah, bootcamp, dan grup belajar.
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-4xl mx-auto w-full text-center text-[11px] sm:text-xs text-slate-400">
        &copy; {new Date().getFullYear()} Kelompokin • Sistem Pengacakan & Pertukaran Kelompok.
      </div>
    </div>
  );
};
