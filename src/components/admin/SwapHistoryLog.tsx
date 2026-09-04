import React from 'react';
import { useGroup } from '@/contexts/GroupContext';
import { History, ArrowLeftRight, CheckCircle2 } from 'lucide-react';

export const SwapHistoryLog: React.FC = () => {
  const { activeRoom, swapLogs } = useGroup();

  if (!activeRoom) return null;

  const roomLogs = swapLogs.filter(l => l.roomId === activeRoom.id);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center">
            <History className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-indigo-700" />
            Riwayat Pertukaran Kode ({activeRoom.name})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit log pertukaran kelompok antar peserta via kode persetujuan.
          </p>
        </div>
        <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold font-mono">
          {roomLogs.length} Catatan
        </span>
      </div>

      {roomLogs.length === 0 ? (
        <div className="p-6 sm:p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-400">
          Belum ada pertukaran kelompok di grup ini.
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {roomLogs.map((log) => (
            <div key={log.id} className="py-3 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-start space-x-2.5 min-w-0">
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-slate-900 flex items-center flex-wrap gap-1">
                    <span className="text-indigo-800">{log.participantA.name}</span>
                    <span className="text-slate-400 font-mono font-normal text-[11px]">(K-{log.participantA.fromGroupNumber})</span>
                    <ArrowLeftRight className="w-3 h-3 text-slate-400 mx-0.5 flex-shrink-0" />
                    <span className="text-indigo-800">{log.participantB.name}</span>
                    <span className="text-slate-400 font-mono font-normal text-[11px]">(K-{log.participantB.fromGroupNumber})</span>
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-slate-400 flex items-center space-x-1.5 mt-0.5">
                    <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-bold">
                      {log.code}
                    </span>
                    <span>•</span>
                    <span>{new Date(log.timestamp).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })} WIB</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
