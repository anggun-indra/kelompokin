import React, { useState } from 'react';
import { Modal, Input, Button, Popconfirm, Tooltip, Select } from 'antd';
import { Room } from '@/types';
import { useGroup } from '@/contexts/GroupContext';
import { Users, Search, UserMinus, Trash2 } from 'lucide-react';

interface ParticipantsModalProps {
  open: boolean;
  onClose: () => void;
  room: Room;
}

export const ParticipantsModal: React.FC<ParticipantsModalProps> = ({ open, onClose, room }) => {
  const { removeParticipant, kickAllParticipants, addParticipantToSubGroup } = useGroup();
  const [search, setSearch] = useState('');
  const [removingUid, setRemovingUid] = useState<string | null>(null);
  const [assigningUid, setAssigningUid] = useState<string | null>(null);

  const getSubGroupName = (uid: string) => {
    for (const sg of room.subGroups) {
      if (sg.members.some(m => m.uid === uid)) {
        return sg.name;
      }
    }
    return 'Belum Diacak';
  };

  const handleRemove = async (uid: string) => {
    setRemovingUid(uid);
    try {
      await removeParticipant(room.id, uid);
    } finally {
      setRemovingUid(null);
    }
  };

  const handleKickAll = async () => {
    await kickAllParticipants(room.id);
  };

  const filtered = room.participants.filter(
    p => p.fullName.toLowerCase().includes(search.toLowerCase()) || 
         (p.identifier && p.identifier.toLowerCase().includes(search.toLowerCase())) ||
         (p.email && p.email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      width={640}
      title={
        <div className="flex items-center justify-between pr-6">
          <div className="flex items-center space-x-2 text-base font-black text-slate-900">
            <Users className="w-5 h-5 text-indigo-700" />
            <span>Daftar Peserta ({room.participants.length})</span>
          </div>

          {room.participants.length > 0 && (
            <Popconfirm
              title="Keluarkan Semua Peserta?"
              description="Seluruh peserta akan dihapus dari grup ini dan susunan kelompok akan dikosongkan. Yakin?"
              onConfirm={handleKickAll}
              okText="Ya, Keluarkan Semua"
              cancelText="Batal"
              okButtonProps={{ danger: true }}
            >
              <Button 
                danger 
                size="small" 
                className="text-xs font-bold flex items-center space-x-1 border-rose-200 bg-rose-50 hover:bg-rose-100"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Keluarkan Semua</span>
              </Button>
            </Popconfirm>
          )}
        </div>
      }
    >
      <div className="pt-2 pb-2 space-y-3">
        <Input
          prefix={<Search className="w-4 h-4 text-slate-400 mr-1" />}
          placeholder="Cari nama peserta / NIM / ID / Email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
          className="rounded-xl text-xs"
          size="large"
        />

        {room.participants.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            Belum ada peserta yang bergabung ke grup ini. Bagikan kode <strong className="text-indigo-700 font-mono">[{room.code}]</strong> ke peserta.
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
            Tidak ada peserta yang cocok dengan kata kunci "{search}".
          </div>
        ) : (
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 pr-1">
            {filtered.map((p, idx) => {
              const groupName = getSubGroupName(p.uid);

              return (
                <div key={p.uid} className="py-2.5 flex items-center justify-between text-xs hover:bg-slate-50/80 px-2 rounded-lg transition-all">
                  <div className="flex items-center space-x-3 min-w-0 flex-1 mr-3">
                    <span className="w-5 font-mono text-[10px] text-slate-400 font-bold">
                      {idx + 1}.
                    </span>
                    <img
                      src={p.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.uid}`}
                      alt={p.fullName}
                      className="w-8 h-8 rounded-lg bg-slate-200 object-cover flex-shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-slate-900 truncate flex items-center space-x-2">
                        <span>{p.fullName}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono flex items-center space-x-1.5 truncate">
                        <span>ID/NIM: <strong>{p.identifier || '-'}</strong></span>
                        <span>•</span>
                        <span className="truncate">{p.email}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 flex-shrink-0">
                    {groupName === 'Belum Diacak' && room.subGroups.length > 0 ? (
                      <Select
                        size="small"
                        placeholder="+ Pilih Kelompok"
                        className="w-36 text-[10px]"
                        loading={assigningUid === p.uid}
                        disabled={Boolean(assigningUid)}
                        value={undefined}
                        onChange={async (subGroupId: string) => {
                          if (!subGroupId) return;
                          setAssigningUid(p.uid);
                          try {
                            await addParticipantToSubGroup(room.id, subGroupId, p.uid);
                          } finally {
                            setAssigningUid(null);
                          }
                        }}
                        options={room.subGroups.map((sg) => ({
                          value: sg.id,
                          label: `${sg.name} (${sg.members.length})`,
                        }))}
                      />
                    ) : (
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        groupName !== 'Belum Diacak'
                          ? 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {groupName}
                      </span>
                    )}

                    <Popconfirm
                      title="Keluarkan Peserta?"
                      description={`Keluarkan ${p.fullName} dari grup ini?`}
                      onConfirm={() => handleRemove(p.uid)}
                      okText="Ya, Keluarkan"
                      cancelText="Batal"
                      okButtonProps={{ danger: true }}
                    >
                      <Tooltip title="Keluarkan / Hapus dari Grup">
                        <Button
                          type="text"
                          danger
                          size="small"
                          loading={removingUid === p.uid}
                          className="flex items-center justify-center w-7 h-7 p-0 rounded-lg hover:bg-rose-50"
                        >
                          <UserMinus className="w-3.5 h-3.5" />
                        </Button>
                      </Tooltip>
                    </Popconfirm>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
};
