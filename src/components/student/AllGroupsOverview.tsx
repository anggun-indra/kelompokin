import React, { useState } from 'react';
import { Room } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useGroup } from '@/contexts/GroupContext';
import { Layers, Search, UserPlus } from 'lucide-react';
import { Input, Button, Popconfirm } from 'antd';
import confetti from 'canvas-confetti';

interface AllGroupsOverviewProps {
  room: Room | null;
  mySubGroupId?: string | null;
}

export const AllGroupsOverview: React.FC<AllGroupsOverviewProps> = ({ room, mySubGroupId }) => {
  const { user } = useAuth();
  const { addParticipantToSubGroup } = useGroup();
  const [searchQuery, setSearchQuery] = useState('');
  const [joiningSubGroupId, setJoiningSubGroupId] = useState<string | null>(null);

  const handleSelfJoinGroup = async (subGroupId: string) => {
    if (!room || !user) return;
    setJoiningSubGroupId(subGroupId);
    try {
      const res = await addParticipantToSubGroup(room.id, subGroupId, user.uid, user);
      if (res.success) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    } finally {
      setJoiningSubGroupId(null);
    }
  };

  if (!room) {
    return (
      <div className="p-6 sm:p-8 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-400">
        Pilih atau gabung ke grup terlebih dahulu.
      </div>
    );
  }

  const filteredSubGroups = room.subGroups.filter(grp => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const isNameMatch = grp.name.toLowerCase().includes(query);
    const isMemberMatch = grp.members.some(
      m => m.fullName.toLowerCase().includes(query) || (m.identifier && m.identifier.toLowerCase().includes(query))
    );
    return isNameMatch || isMemberMatch;
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center">
            <Layers className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-indigo-700" />
            Susunan Seluruh Kelompok ({room.name})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Lihat susunan kelompok untuk mencari rekan barter.
          </p>
        </div>

        <div className="w-full sm:w-64">
          <Input
            prefix={<Search className="w-4 h-4 text-slate-400 mr-1" />}
            placeholder="Cari nama / ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            allowClear
            size="large"
            className="rounded-xl text-xs h-10"
          />
        </div>
      </div>

      {!mySubGroupId && user && (
        <div className="p-3.5 sm:p-4 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <UserPlus className="w-4 h-4 text-indigo-700 flex-shrink-0" />
            <span>
              <strong>Pilih Kelompok:</strong> Anda belum memiliki kelompok. Klik tombol <strong>Gabung</strong> pada kelompok yang ingin Anda tuju di bawah ini.
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {filteredSubGroups.map((grp) => {
          const isMyGroup = grp.id === mySubGroupId;

          return (
            <div
              key={grp.id}
              className={`rounded-2xl border bg-white overflow-hidden shadow-sm flex flex-col justify-between ${
                isMyGroup
                  ? 'border-indigo-600 ring-2 ring-indigo-600/20'
                  : 'border-slate-200'
              }`}
            >
              {/* Solid Card Header */}
              <div className={`p-3.5 sm:p-4 ${isMyGroup ? 'bg-indigo-700' : 'bg-slate-900'} text-white`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-extrabold text-sm tracking-tight">
                      {grp.name}
                    </span>
                    {isMyGroup && (
                      <span className="px-2 py-0.5 rounded bg-white text-indigo-800 text-[9px] font-black uppercase">
                        Kelompok Anda
                      </span>
                    )}
                  </div>
                  <span className="px-2 py-0.5 rounded bg-white/20 text-white font-mono text-xs font-bold">
                    {grp.members.length} Orang
                  </span>
                </div>
                {grp.topic && (
                  <p className="text-[11px] text-white/80 mt-1 truncate">
                    {grp.topic}
                  </p>
                )}
              </div>

              {/* Members List */}
              <div className="p-3 sm:p-4 divide-y divide-slate-100 flex-1 space-y-1.5">
                {grp.members.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-400 italic">
                    Belum ada anggota.
                  </div>
                ) : (
                  grp.members.map((member, i) => (
                    <div
                      key={member.uid || member.identifier || i}
                      className="pt-2 first:pt-0 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center space-x-2 min-w-0">
                        <span className="w-4 font-mono text-[10px] text-slate-400 font-bold flex-shrink-0">
                          {i + 1}.
                        </span>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-800 truncate">
                            {member.fullName}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400">
                            {member.identifier || '-'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Action Button for Unassigned User */}
              {!mySubGroupId && user && (
                <div className="p-2.5 bg-slate-50 border-t border-slate-100">
                  <Popconfirm
                    title={`Gabung ke ${grp.name}?`}
                    description={`Anda akan terdaftar sebagai anggota ${grp.name}. Konfirmasi?`}
                    onConfirm={() => handleSelfJoinGroup(grp.id)}
                    okText="Ya, Gabung"
                    cancelText="Batal"
                    okButtonProps={{ loading: joiningSubGroupId === grp.id }}
                  >
                    <Button
                      type="primary"
                      size="small"
                      loading={joiningSubGroupId === grp.id}
                      disabled={Boolean(joiningSubGroupId)}
                      className="w-full rounded-xl font-bold text-xs h-8 bg-indigo-700 hover:bg-indigo-800 border-0 flex items-center justify-center space-x-1.5 text-white"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Gabung ke {grp.name}</span>
                    </Button>
                  </Popconfirm>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
