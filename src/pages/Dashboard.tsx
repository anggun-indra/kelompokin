import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useGroup } from '@/contexts/GroupContext';
import { RandomizerPanel } from '@/components/admin/RandomizerPanel';
import { GroupLiveBoard } from '@/components/admin/GroupLiveBoard';
import { SwapHistoryLog } from '@/components/admin/SwapHistoryLog';
import { MyGroupCard } from '@/components/student/MyGroupCard';
import { AllGroupsOverview } from '@/components/student/AllGroupsOverview';
import { CreateRoomModal } from '@/components/modals/CreateRoomModal';
import { JoinRoomModal } from '@/components/modals/JoinRoomModal';
import { 
  Users, 
  Layers, 
  History, 
  ShieldCheck, 
  Plus, 
  LogIn, 
  FolderOpen, 
  ArrowRight,
  Share2,
  Copy,
  Check,
  ChevronLeft
} from 'lucide-react';
import { Button, message } from 'antd';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { rooms, activeRoom, selectRoom, joinRoomByCode } = useGroup();

  const [activeTab, setActiveTab] = useState<'my-group' | 'all-groups' | 'history'>('my-group');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [joining, setJoining] = useState(false);

  if (!user) return null;

  const isCreator = activeRoom ? activeRoom.creatorUid === user.uid : false;
  const isJoined = activeRoom ? activeRoom.participants.some(
    p => p.uid === user.uid || (p.email && user.email && p.email.toLowerCase() === user.email.toLowerCase())
  ) : false;

  const handleCopyGroupCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    message.success(`Kode grup [${code}] berhasil disalin!`);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleShareGroup = (room: any) => {
    const text = encodeURIComponent(
      `Halo! Silakan login di aplikasi *Kelompokin* (https://kelompokin.web.app) dan gabung ke grup *${room.name}* menggunakan Kode Akses: *${room.code}*`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleQuickJoinActiveRoom = async () => {
    if (!activeRoom) return;
    setJoining(true);
    try {
      await joinRoomByCode(activeRoom.code, user);
    } finally {
      setJoining(false);
    }
  };

  // Filter only rooms the user owns or has joined
  const myRooms = rooms.filter(
    r => r.creatorUid === user.uid || 
         r.participants.some(p => p.uid === user.uid || (p.email && user.email && p.email.toLowerCase() === user.email.toLowerCase()))
  );

  return (
    <div className="min-h-[calc(100vh-3.5rem)] sm:min-h-[calc(100vh-4rem)] bg-slate-100 py-4 sm:py-8 px-3 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
        {/* If no active room, show welcome selection screen */}
        {!activeRoom ? (
          <div className="space-y-6 sm:space-y-8">
            <div className="text-center space-y-1.5 sm:space-y-2 py-2 sm:py-4">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Selamat Datang, {user.fullName}!
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto px-2">
                Mulai dengan membuat sesi grup belajar baru untuk mengacak kelompok atau bergabung ke grup dengan kode akses.
              </p>
            </div>

            {/* Two Main Action Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 max-w-4xl mx-auto">
              {/* Card 1: Create Group */}
              <div className="bg-white rounded-2xl border border-slate-300 p-6 sm:p-8 text-center space-y-4 sm:space-y-5 shadow-sm hover:border-indigo-600 transition-all flex flex-col justify-between">
                <div className="space-y-2.5 sm:space-y-3">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700 mx-auto flex items-center justify-center font-bold">
                    <Plus className="w-6 h-6 sm:w-7 sm:h-7" />
                  </div>
                  <h2 className="text-lg sm:text-xl font-black text-slate-900">
                    Buat Grup Belajar Baru
                  </h2>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Untuk Dosen / Pengampu / Ketua. Buat sesi belajar, tentukan jumlah kelompok, dan bagikan kode ke peserta.
                  </p>
                </div>
                <Button
                  type="primary"
                  size="large"
                  onClick={() => setIsCreateOpen(true)}
                  className="w-full h-11 sm:h-12 rounded-xl font-bold text-xs bg-indigo-700 hover:bg-indigo-800 border-0 flex items-center justify-center space-x-2 text-white"
                >
                  <Plus className="w-4 h-4" />
                  <span>Buat Grup Baru Sekarang</span>
                </Button>
              </div>

              {/* Card 2: Join Group */}
              <div className="bg-white rounded-2xl border border-slate-300 p-6 sm:p-8 text-center space-y-4 sm:space-y-5 shadow-sm hover:border-slate-600 transition-all flex flex-col justify-between">
                <div className="space-y-2.5 sm:space-y-3">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-slate-100 text-slate-700 mx-auto flex items-center justify-center font-bold">
                    <LogIn className="w-6 h-6 sm:w-7 sm:h-7" />
                  </div>
                  <h2 className="text-lg sm:text-xl font-black text-slate-900">
                    Gabung dengan Kode Grup
                  </h2>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Untuk Peserta / Mahasiswa. Masukkan kode akses grup yang diberikan oleh pengampu untuk melihat kelompok Anda.
                  </p>
                </div>
                <Button
                  size="large"
                  onClick={() => setIsJoinOpen(true)}
                  className="w-full h-11 sm:h-12 rounded-xl font-bold text-xs bg-slate-900 hover:bg-slate-800 text-white border-0 flex items-center justify-center space-x-2"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Gabung ke Grup Belajar</span>
                </Button>
              </div>
            </div>

            {/* List of My Groups */}
            {myRooms.length > 0 && (
              <div className="max-w-4xl mx-auto pt-2 sm:pt-6 space-y-3 sm:space-y-4">
                <h3 className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-wider px-1">
                  Grup Belajar Anda ({myRooms.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {myRooms.map((r) => (
                    <div
                      key={r.id}
                      onClick={() => selectRoom(r)}
                      className="p-4 rounded-xl bg-white border border-slate-200 hover:border-indigo-600 cursor-pointer transition-all shadow-sm flex flex-col justify-between space-y-2"
                    >
                      <div>
                        <div className="font-extrabold text-sm text-slate-900 truncate">
                          {r.name}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          Kode: {r.code} • {r.participants.length} Peserta
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs font-bold text-indigo-700">
                        <span>{r.creatorUid === user.uid ? 'Pembuat (Admin)' : 'Peserta'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Active Room View */
          <div className="space-y-4 sm:space-y-6">
            {/* Share Group Code Alert Banner */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-300 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-start sm:items-center space-x-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold flex-shrink-0 mt-0.5 sm:mt-0">
                  <FolderOpen className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center flex-wrap gap-1.5">
                    <span className="text-base sm:text-lg font-black text-slate-900 truncate">
                      {activeRoom.name}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      isCreator ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {isCreator ? 'Admin' : isJoined ? 'Peserta' : 'Belum Gabung'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 flex items-center flex-wrap gap-x-2 gap-y-0.5 mt-0.5">
                    <span>Kode: <strong className="font-mono text-indigo-700 font-bold">{activeRoom.code}</strong></span>
                    <span>•</span>
                    <span>{activeRoom.participants.length} Peserta</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="flex items-center flex-wrap gap-2 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                {!isCreator && !isJoined && (
                  <Button
                    type="primary"
                    size="small"
                    loading={joining}
                    onClick={handleQuickJoinActiveRoom}
                    className="rounded-lg text-xs font-bold bg-indigo-700 hover:bg-indigo-800 border-0 text-white h-8"
                  >
                    Gabung ke Grup Ini
                  </Button>
                )}

                <Button
                  size="small"
                  onClick={() => handleCopyGroupCode(activeRoom.code)}
                  className="rounded-lg text-xs font-bold border-slate-300 flex items-center space-x-1 h-8"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'Tersalin' : 'Salin Kode'}</span>
                </Button>

                <Button
                  type="primary"
                  size="small"
                  onClick={() => handleShareGroup(activeRoom)}
                  className="rounded-lg text-xs font-bold bg-emerald-700 hover:bg-emerald-800 border-0 flex items-center space-x-1 text-white h-8"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Bagikan WA</span>
                </Button>
              </div>
            </div>

            {/* Navigation Tabs Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-300">
              {/* Responsive Tabs */}
              <div className="grid grid-cols-2 sm:flex sm:space-x-2 gap-1.5 sm:gap-0">
                {isCreator ? (
                  <>
                    <button
                      onClick={() => setActiveTab('my-group')}
                      className={`px-3 sm:px-4 py-2 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center space-x-1.5 transition-all ${
                        activeTab === 'my-group'
                          ? 'bg-indigo-700 text-white shadow-sm'
                          : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-300'
                      }`}
                    >
                      <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span className="truncate">Live Board</span>
                    </button>

                    <button
                      onClick={() => setActiveTab('history')}
                      className={`px-3 sm:px-4 py-2 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center space-x-1.5 transition-all ${
                        activeTab === 'history'
                          ? 'bg-indigo-700 text-white shadow-sm'
                          : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-300'
                      }`}
                    >
                      <History className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span className="truncate">Riwayat Barter</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setActiveTab('my-group')}
                      className={`px-3 sm:px-4 py-2 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center space-x-1.5 transition-all ${
                        activeTab === 'my-group'
                          ? 'bg-indigo-700 text-white shadow-sm'
                          : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-300'
                      }`}
                    >
                      <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span className="truncate">Kelompok Saya</span>
                    </button>

                    <button
                      onClick={() => setActiveTab('all-groups')}
                      className={`px-3 sm:px-4 py-2 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center space-x-1.5 transition-all ${
                        activeTab === 'all-groups'
                          ? 'bg-indigo-700 text-white shadow-sm'
                          : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-300'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span className="truncate">Semua ({activeRoom.subGroups.length})</span>
                    </button>
                  </>
                )}
              </div>

              {/* Back to Home Button */}
              <Button
                size="small"
                onClick={() => selectRoom(null)}
                className="text-xs font-bold border-slate-300 h-8 self-end sm:self-auto flex items-center space-x-1 text-slate-600"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Ganti Grup / Menu Utama</span>
              </Button>
            </div>

            {/* Tab Views */}
            {isCreator ? (
              activeTab === 'my-group' ? (
                <div className="space-y-4 sm:space-y-6">
                  <RandomizerPanel />
                  <GroupLiveBoard />
                </div>
              ) : (
                <SwapHistoryLog />
              )
            ) : (
              activeTab === 'my-group' ? (
                <MyGroupCard activeRoom={activeRoom} />
              ) : (
                <AllGroupsOverview room={activeRoom} />
              )
            )}
          </div>
        )}
      </div>

      <CreateRoomModal open={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
      <JoinRoomModal open={isJoinOpen} onClose={() => setIsJoinOpen(false)} />
    </div>
  );
};
