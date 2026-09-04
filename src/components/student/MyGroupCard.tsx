import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useGroup } from '@/contexts/GroupContext';
import { Room, SwapCode } from '@/types';
import { 
  Users, 
  ArrowLeftRight, 
  KeyRound, 
  Copy, 
  Check, 
  BookOpen, 
  LogIn,
  UserPlus
} from 'lucide-react';
import { Button, message } from 'antd';
import { CreateSwapCodeModal } from '@/components/modals/CreateSwapCodeModal';
import { EnterSwapCodeModal } from '@/components/modals/EnterSwapCodeModal';
import { JoinRoomModal } from '@/components/modals/JoinRoomModal';
import { AddMemberToGroupModal } from '@/components/modals/AddMemberToGroupModal';
import { GroupMembersList } from './GroupMembersList';

interface MyGroupCardProps {
  activeRoom: Room | null;
}

export const MyGroupCard: React.FC<MyGroupCardProps> = ({ activeRoom }) => {
  const { user } = useAuth();
  const { swapCodes, cancelSwapCode } = useGroup();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEnterOpen, setIsEnterOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!user) return null;

  if (!activeRoom) {
    return (
      <div className="p-6 sm:p-12 rounded-2xl bg-white border border-slate-200 text-center space-y-4 shadow-sm">
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700 mx-auto flex items-center justify-center">
          <LogIn className="w-6 h-6 sm:w-7 sm:h-7" />
        </div>
        <div className="max-w-md mx-auto space-y-2">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">
            Anda Belum Bergabung ke Grup Belajar
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Masukkan kode grup dari Admin/Dosen Anda untuk melihat pembagian kelompok kelas dan teman sekelompok.
          </p>
        </div>
        <Button
          type="primary"
          size="large"
          onClick={() => setIsJoinOpen(true)}
          className="rounded-xl font-bold text-xs h-11 px-6 bg-indigo-700 hover:bg-indigo-800 border-0"
        >
          Gabung ke Grup Belajar Sekarang
        </Button>

        <JoinRoomModal open={isJoinOpen} onClose={() => setIsJoinOpen(false)} />
      </div>
    );
  }

  // Find user's sub-group in activeRoom
  const mySubGroup = activeRoom.subGroups.find(sg =>
    sg.members.some(m => m.uid === user.uid || (m.identifier && m.identifier === user.identifier))
  ) || null;

  // Count unassigned participants in the room
  const unassignedCount = React.useMemo(() => {
    if (!activeRoom) return 0;
    const assigned = new Set<string>();
    activeRoom.subGroups.forEach((sg) => {
      (sg.members || []).forEach((m) => {
        if (m.uid) assigned.add(m.uid);
      });
    });
    return (activeRoom.participants || []).filter((p) => !assigned.has(p.uid)).length;
  }, [activeRoom]);

  const now = Date.now();
  const activeCode: SwapCode | undefined = swapCodes.find(
    (c) => c.roomId === activeRoom.id && c.creatorUid === user.uid && c.status === 'ACTIVE' && new Date(c.expiresAt).getTime() > now
  );

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    message.success('Kode pertukaran disalin!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <div className="space-y-4 sm:space-y-6">
        {/* Room Info Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div>
            <div className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider">
              Grup Belajar Aktif:
            </div>
            <div className="text-sm sm:text-base font-black text-slate-900">
              {activeRoom.name}
            </div>
            {activeRoom.description && (
              <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{activeRoom.description}</p>
            )}
          </div>

          <div className="flex items-center space-x-2 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100">
            <span className="px-2.5 py-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-mono font-bold text-slate-700">
              Kode: {activeRoom.code}
            </span>
            <Button
              size="small"
              onClick={() => setIsJoinOpen(true)}
              className="rounded-lg text-xs font-bold border-slate-300 h-7 sm:h-8"
            >
              Ganti Grup
            </Button>
          </div>
        </div>

        {/* Group Placement Card */}
        {mySubGroup ? (
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            {/* Solid Header */}
            <div className="p-4 sm:p-6 lg:p-8 bg-indigo-700 text-white space-y-4">
              <div className="flex items-start sm:items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-bold uppercase tracking-wider bg-white/20 text-white mb-1.5 sm:mb-2">
                    Penempatan Kelompok
                  </span>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white truncate">
                    {mySubGroup.name}
                  </h1>
                  {mySubGroup.topic && (
                    <p className="text-white/80 text-xs sm:text-sm mt-1 flex items-center font-medium line-clamp-1">
                      <BookOpen className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
                      <span>{mySubGroup.topic}</span>
                    </p>
                  )}
                </div>

                <div className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-white/10 border border-white/20 text-center flex-shrink-0">
                  <div className="text-xl sm:text-2xl font-black leading-tight text-white">
                    {mySubGroup.members.length}
                  </div>
                  <div className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider text-white/80">
                    Anggota
                  </div>
                </div>
              </div>

              {/* Active Code Alert Banner */}
              {activeCode && (
                <div className="p-3 sm:p-4 rounded-xl bg-white/10 border border-white/20 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="text-xs">
                    <span className="font-bold">Kode Pertukaran Aktif: </span>
                    <span className="font-mono text-sm font-black underline ml-1">{activeCode.code}</span>
                    <p className="text-[11px] text-white/80 mt-0.5">
                      Bagikan kode ini ke rekan yang ingin bertukar kelompok.
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 w-full sm:w-auto">
                    <Button
                      size="small"
                      onClick={() => handleCopy(activeCode.code)}
                      className="rounded-lg font-bold text-xs bg-white text-indigo-800 border-0 flex-1 sm:flex-initial h-8"
                    >
                      {copied ? 'Tersalin' : 'Salin Kode'}
                    </Button>
                    <Button
                      size="small"
                      type="text"
                      onClick={() => cancelSwapCode(activeCode.id)}
                      className="rounded-lg text-xs text-white hover:bg-white/10 h-8"
                    >
                      Batalkan
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Members Section */}
            <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center">
                    <Users className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-indigo-700" />
                    Daftar Rekan Satu Kelompok
                  </h3>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  <Button
                    onClick={() => setIsAddMemberOpen(true)}
                    className="rounded-xl font-bold text-xs h-9 sm:h-10 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white border-0 flex items-center justify-center space-x-1.5 shadow-sm flex-1 sm:flex-initial"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Tambah Anggota</span>
                    {unassignedCount > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 bg-emerald-800/40 text-white rounded-full text-[10px] font-bold">
                        {unassignedCount}
                      </span>
                    )}
                  </Button>

                  <Button
                    type="primary"
                    disabled={!activeRoom.isSwapAllowed}
                    onClick={() => setIsCreateOpen(true)}
                    className="rounded-xl font-bold text-xs h-9 sm:h-10 px-3 bg-indigo-700 hover:bg-indigo-800 border-0 flex items-center justify-center space-x-1.5 text-white flex-1 sm:flex-initial"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5" />
                    <span>Ajukan Tukar</span>
                  </Button>

                  <Button
                    disabled={!activeRoom.isSwapAllowed}
                    onClick={() => setIsEnterOpen(true)}
                    className="rounded-xl font-bold text-xs h-9 sm:h-10 px-3 border-slate-300 text-slate-700 flex items-center justify-center space-x-1.5 flex-1 sm:flex-initial"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-indigo-700" />
                    <span>Tukar Kode</span>
                  </Button>
                </div>
              </div>

              <GroupMembersList
                members={mySubGroup.members}
                currentUserUid={user.uid}
                currentUserIdentifier={user.identifier}
              />
            </div>
          </div>
        ) : (
          /* Waiting for placement */
          <div className="p-6 sm:p-12 rounded-2xl bg-white border border-slate-200 text-center space-y-4 shadow-sm">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-slate-100 text-slate-600 mx-auto flex items-center justify-center">
              <Users className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div className="max-w-md mx-auto space-y-2">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                Menunggu Penempatan Kelompok
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Anda sudah terdaftar di grup <strong>{activeRoom.name}</strong>. Saat Admin menjalankan pengacakan kelompok atau rekan kelompok menambahkan Anda, posisi Anda akan langsung muncul di sini secara realtime.
              </p>
            </div>
          </div>
        )}
      </div>

      {mySubGroup && (
        <>
          <AddMemberToGroupModal
            open={isAddMemberOpen}
            onClose={() => setIsAddMemberOpen(false)}
            room={activeRoom}
            subGroup={mySubGroup}
          />

          <CreateSwapCodeModal
            open={isCreateOpen}
            onClose={() => setIsCreateOpen(false)}
            room={activeRoom}
            mySubGroup={mySubGroup}
          />

          <EnterSwapCodeModal
            open={isEnterOpen}
            onClose={() => setIsEnterOpen(false)}
            room={activeRoom}
            mySubGroup={mySubGroup}
          />
        </>
      )}

      <JoinRoomModal open={isJoinOpen} onClose={() => setIsJoinOpen(false)} />
    </>
  );
};
