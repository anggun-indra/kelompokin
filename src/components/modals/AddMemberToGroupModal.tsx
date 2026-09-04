import React, { useState, useMemo } from 'react';
import { Modal, Input, Button } from 'antd';
import { Room, SubGroup, Participant } from '@/types';
import { useGroup } from '@/contexts/GroupContext';
import { UserPlus, Search, Users, CheckCircle2 } from 'lucide-react';

interface AddMemberToGroupModalProps {
  open: boolean;
  onClose: () => void;
  room: Room;
  subGroup: SubGroup;
}

export const AddMemberToGroupModal: React.FC<AddMemberToGroupModalProps> = ({
  open,
  onClose,
  room,
  subGroup,
}) => {
  const { addParticipantToSubGroup } = useGroup();
  const [search, setSearch] = useState('');
  const [addingUid, setAddingUid] = useState<string | null>(null);

  // Identify all participant UIDs that are already assigned to ANY subgroup
  const assignedUids = useMemo(() => {
    const set = new Set<string>();
    room.subGroups.forEach((sg) => {
      (sg.members || []).forEach((m) => {
        if (m.uid) set.add(m.uid);
      });
    });
    return set;
  }, [room.subGroups]);

  // Participants in the room who don't belong to any subgroup yet
  const unassignedParticipants = useMemo(() => {
    return (room.participants || []).filter((p) => !assignedUids.has(p.uid));
  }, [room.participants, assignedUids]);

  // Search filter
  const filteredParticipants = useMemo(() => {
    if (!search.trim()) return unassignedParticipants;
    const q = search.toLowerCase();
    return unassignedParticipants.filter(
      (p) =>
        p.fullName.toLowerCase().includes(q) ||
        (p.identifier && p.identifier.toLowerCase().includes(q)) ||
        (p.email && p.email.toLowerCase().includes(q))
    );
  }, [unassignedParticipants, search]);

  const handleAddMember = async (participant: Participant) => {
    setAddingUid(participant.uid);
    try {
      await addParticipantToSubGroup(room.id, subGroup.id, participant.uid);
    } finally {
      setAddingUid(null);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      width={540}
      title={
        <div className="flex items-center space-x-2.5 text-base font-black text-slate-900 pr-6">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <UserPlus className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="truncate">Tambah Anggota ke {subGroup.name}</div>
            <div className="text-[11px] font-normal text-slate-500">
              Pilih rekan yang belum tergabung dalam kelompok manapun
            </div>
          </div>
        </div>
      }
    >
      <div className="pt-2 pb-1 space-y-3">
        {/* Search Bar */}
        <Input
          prefix={<Search className="w-4 h-4 text-slate-400 mr-1.5" />}
          placeholder="Cari nama rekan, NIM, atau email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
          className="rounded-xl text-xs py-2"
          size="middle"
        />

        {/* Counter Info */}
        <div className="flex items-center justify-between text-xs px-1 text-slate-500">
          <span>
            Tersedia:{' '}
            <strong className="text-slate-800 font-bold font-mono">
              {unassignedParticipants.length}
            </strong>{' '}
            peserta belum berkelompok
          </span>
          <span className="text-[11px] text-slate-400">
            Anggota saat ini: {subGroup.members.length}
          </span>
        </div>

        {/* Participant List or Empty States */}
        {unassignedParticipants.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <div className="text-sm font-bold text-slate-800">
              Semua Peserta Sudah Memiliki Kelompok
            </div>
            <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
              Seluruh peserta yang bergabung di grup belajar ini telah terdaftar ke dalam kelompok masing-masing.
            </p>
          </div>
        ) : filteredParticipants.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl space-y-2">
            <Users className="w-8 h-8 text-slate-400 mx-auto" />
            <div className="text-xs font-bold text-slate-700">
              Tidak Ada Peserta yang Cocok
            </div>
            <p className="text-[11px] text-slate-400">
              Tidak ditemukan peserta belum berkelompok dengan kata kunci "{search}".
            </p>
          </div>
        ) : (
          <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100 pr-1 -mr-1">
            {filteredParticipants.map((p) => {
              const isAdding = addingUid === p.uid;

              return (
                <div
                  key={p.uid}
                  className="py-2.5 px-2 flex items-center justify-between text-xs hover:bg-slate-50 rounded-xl transition-all group"
                >
                  <div className="flex items-center space-x-3 min-w-0 flex-1 mr-2">
                    <img
                      src={
                        p.avatarUrl ||
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.uid}`
                      }
                      alt={p.fullName}
                      className="w-8 h-8 rounded-lg bg-slate-200 object-cover flex-shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-slate-800 truncate">
                        {p.fullName}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono truncate">
                        {p.identifier ? `NIM/ID: ${p.identifier}` : p.email}
                      </div>
                    </div>
                  </div>

                  <Button
                    type="primary"
                    size="small"
                    loading={isAdding}
                    disabled={Boolean(addingUid)}
                    onClick={() => handleAddMember(p)}
                    className="rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 border-0 flex items-center space-x-1.5 h-8 px-3 text-white flex-shrink-0"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Pilih</span>
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
};
