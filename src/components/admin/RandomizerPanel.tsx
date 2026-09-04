import React, { useState } from 'react';
import { useGroup } from '@/contexts/GroupContext';
import { 
  Dices, 
  Lock, 
  Unlock, 
  FileSpreadsheet, 
  Users, 
  Sliders, 
  Plus, 
  Trash2, 
  FolderOpen 
} from 'lucide-react';
import { Button, InputNumber, Popconfirm } from 'antd';
import { CreateRoomModal } from '@/components/modals/CreateRoomModal';
import { ParticipantsModal } from './ParticipantsModal';

export const RandomizerPanel: React.FC = () => {
  const { 
    activeRoom, 
    isShuffling, 
    randomizeSubGroups, 
    toggleRoomSwapAllowed, 
    exportRoomToExcel, 
    resetRoomGroups,
    deleteRoom
  } = useGroup();

  const [numGroups, setNumGroups] = useState<number>(activeRoom?.totalSubGroups || 6);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);

  if (!activeRoom) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 text-center space-y-4">
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-indigo-50 text-indigo-700 mx-auto flex items-center justify-center font-bold">
          <FolderOpen className="w-6 h-6 sm:w-7 sm:h-7" />
        </div>
        <div className="max-w-md mx-auto space-y-2">
          <h2 className="text-lg sm:text-xl font-black text-slate-900">
            Belum Ada Grup yang Dipilih
          </h2>
          <p className="text-xs text-slate-500">
            Buat grup baru untuk mulai membagikan kode ke peserta dan melakukan pengacakan kelompok.
          </p>
        </div>
        <Button
          type="primary"
          onClick={() => setIsCreateOpen(true)}
          className="rounded-xl font-bold text-xs h-10 px-5 bg-indigo-700 hover:bg-indigo-800 border-0"
        >
          <Plus className="w-4 h-4 mr-1" />
          Buat Grup Belajar Baru
        </Button>

        <CreateRoomModal open={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
      </div>
    );
  }

  const handleRandomize = async () => {
    await randomizeSubGroups(activeRoom.id, numGroups);
  };

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
        {/* Top Header Summary */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 sm:pb-6 border-b border-slate-200">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 sm:py-1 rounded bg-slate-100 text-slate-700 text-[11px] sm:text-xs font-bold uppercase tracking-wider mb-1.5">
              <Sliders className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-indigo-700" />
              <span>Panel Pengacakan Grup</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center flex-wrap gap-2">
              <span>{activeRoom.name}</span>
              <span className="px-2 py-0.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-800 font-mono text-xs font-bold">
                Kode: {activeRoom.code}
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Bagikan kode <strong className="text-indigo-700 font-mono">[{activeRoom.code}]</strong> kepada peserta untuk bergabung.
            </p>
          </div>

          {/* Quick Stats (Mobile 3-col grid) */}
          <div className="grid grid-cols-3 gap-2 sm:flex sm:items-center sm:space-x-3">
            <div 
              onClick={() => setIsParticipantsOpen(true)}
              className="p-2.5 sm:p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center cursor-pointer hover:bg-slate-100 transition-all"
            >
              <div className="text-xl sm:text-2xl font-black text-indigo-700">
                {activeRoom.participants.length}
              </div>
              <div className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider text-slate-500 truncate">
                Peserta
              </div>
            </div>

            <div className="p-2.5 sm:p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <div className="text-xl sm:text-2xl font-black text-slate-900">
                {activeRoom.subGroups.length}
              </div>
              <div className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider text-slate-500 truncate">
                Kelompok
              </div>
            </div>

            <div className="p-2.5 sm:p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <div className="text-xl sm:text-2xl font-black text-slate-900">
                {activeRoom.subGroups.length > 0 && activeRoom.participants.length > 0
                  ? Math.round(activeRoom.participants.length / activeRoom.subGroups.length)
                  : 0}
              </div>
              <div className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider text-slate-500 truncate">
                Rata/Kel
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 items-stretch">
          {/* Subgroups Count */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1 flex flex-col justify-between">
            <label className="block text-xs font-bold text-slate-700">
              Jumlah Kelompok:
            </label>
            <InputNumber
              min={2}
              max={30}
              value={numGroups}
              onChange={(val) => val && setNumGroups(val)}
              className="w-full rounded-xl font-mono font-bold"
              size="large"
            />
          </div>

          {/* Randomize Button */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-1">
            <label className="block text-xs font-bold text-slate-700">
              Pengacakan Merata:
            </label>
            <Button
              type="primary"
              size="large"
              loading={isShuffling}
              onClick={handleRandomize}
              className="w-full h-10 rounded-xl font-bold text-xs bg-indigo-700 hover:bg-indigo-800 border-0 text-white flex items-center justify-center space-x-2 shadow-sm"
            >
              <Dices className={`w-4 h-4 ${isShuffling ? 'animate-spin' : ''}`} />
              <span>Acak Kelompok Sekarang</span>
            </Button>
          </div>

          {/* Lock / Unlock Toggle */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-1">
            <label className="block text-xs font-bold text-slate-700">
              Izin Pertukaran:
            </label>
            <Button
              size="large"
              onClick={() => toggleRoomSwapAllowed(activeRoom.id, !activeRoom.isSwapAllowed)}
              className={`w-full h-10 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 border-0 ${
                activeRoom.isSwapAllowed
                  ? 'bg-amber-600 hover:bg-amber-700 text-white'
                  : 'bg-emerald-700 hover:bg-emerald-800 text-white'
              }`}
            >
              {activeRoom.isSwapAllowed ? (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Kunci Pertukaran</span>
                </>
              ) : (
                <>
                  <Unlock className="w-4 h-4" />
                  <span>Buka Izin Pertukaran</span>
                </>
              )}
            </Button>
          </div>

          {/* Export to Excel */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-1">
            <label className="block text-xs font-bold text-slate-700">
              Rekap Data:
            </label>
            <Button
              size="large"
              onClick={() => exportRoomToExcel(activeRoom)}
              className="w-full h-10 rounded-xl font-bold text-xs bg-emerald-700 hover:bg-emerald-800 text-white border-0 flex items-center justify-center space-x-1.5 shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Ekspor Excel (.xlsx)</span>
            </Button>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-3 sm:pt-4 border-t border-slate-200 text-xs">
          <div className="flex items-center space-x-2">
            <Button
              size="small"
              onClick={() => setIsParticipantsOpen(true)}
              className="rounded-lg text-xs font-bold border-slate-300 flex-1 sm:flex-initial h-8"
            >
              <Users className="w-3.5 h-3.5 mr-1 text-indigo-700" />
              Daftar Peserta ({activeRoom.participants.length})
            </Button>

            <Button
              size="small"
              onClick={() => setIsCreateOpen(true)}
              className="rounded-lg text-xs font-bold bg-indigo-50 text-indigo-800 border-indigo-200 flex-1 sm:flex-initial h-8"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Grup Baru
            </Button>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-1 sm:pt-0">
            <Popconfirm
              title="Reset Kelompok dalam Grup ini?"
              description="Susunan anggota dalam kelompok akan dikosongkan. Yakin?"
              onConfirm={() => resetRoomGroups(activeRoom.id)}
              okText="Ya, Reset"
              cancelText="Batal"
              okButtonProps={{ danger: true }}
            >
              <Button type="text" danger size="small" className="text-xs font-semibold h-8">
                Reset Susunan
              </Button>
            </Popconfirm>

            <Popconfirm
              title="Hapus Grup ini?"
              description="Grup beserta semua datanya akan dihapus permanen. Yakin?"
              onConfirm={() => deleteRoom(activeRoom.id)}
              okText="Ya, Hapus"
              cancelText="Batal"
              okButtonProps={{ danger: true }}
            >
              <Button type="text" danger size="small" className="text-xs font-semibold h-8 flex items-center">
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                Hapus Grup
              </Button>
            </Popconfirm>
          </div>
        </div>
      </div>

      <CreateRoomModal open={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
      <ParticipantsModal open={isParticipantsOpen} onClose={() => setIsParticipantsOpen(false)} room={activeRoom} />
    </>
  );
};
