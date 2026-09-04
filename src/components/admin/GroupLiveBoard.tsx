import React, { useState } from 'react';
import { useGroup } from '@/contexts/GroupContext';
import { SubGroup } from '@/types';
import { 
  Users, 
  Edit3, 
  Check, 
  BookOpen, 
  MoveRight,
  UserMinus,
  UserPlus,
  UserX
} from 'lucide-react';
import { Input, Button, Modal, Select, Popconfirm, Tooltip } from 'antd';
import { AddMemberToGroupModal } from '@/components/modals/AddMemberToGroupModal';

export const GroupLiveBoard: React.FC = () => {
  const { 
    activeRoom, 
    updateSubGroupTopic, 
    manualMoveParticipant, 
    removeParticipant, 
    removeParticipantFromSubGroup 
  } = useGroup();
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
  const [tempTopic, setTempTopic] = useState('');

  const [movingParticipant, setMovingParticipant] = useState<{
    uid: string;
    name: string;
    identifier: string;
    fromSubGroupId: string;
  } | null>(null);
  const [targetSubGroupId, setTargetSubGroupId] = useState<string>('');
  const [removingUid, setRemovingUid] = useState<string | null>(null);
  const [unassigningUid, setUnassigningUid] = useState<string | null>(null);
  const [addingToGroup, setAddingToGroup] = useState<SubGroup | null>(null);

  if (!activeRoom) return null;

  const handleStartEditTopic = (grp: SubGroup) => {
    setEditingTopicId(grp.id);
    setTempTopic(grp.topic || '');
  };

  const handleSaveTopic = async (subGroupId: string) => {
    await updateSubGroupTopic(activeRoom.id, subGroupId, tempTopic);
    setEditingTopicId(null);
  };

  const handleConfirmMove = async () => {
    if (!movingParticipant || !targetSubGroupId) return;
    await manualMoveParticipant(
      activeRoom.id,
      movingParticipant.uid,
      movingParticipant.fromSubGroupId,
      targetSubGroupId
    );
    setMovingParticipant(null);
    setTargetSubGroupId('');
  };

  const handleRemoveMember = async (uid: string) => {
    setRemovingUid(uid);
    try {
      await removeParticipant(activeRoom.id, uid);
    } finally {
      setRemovingUid(null);
    }
  };

  const handleRemoveFromSubGroup = async (subGroupId: string, uid: string) => {
    setUnassigningUid(uid);
    try {
      await removeParticipantFromSubGroup(activeRoom.id, subGroupId, uid);
    } finally {
      setUnassigningUid(null);
    }
  };

  return (
    <>
      <div className="space-y-4 sm:space-y-6">
        <div>
          <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center">
            <Users className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-indigo-700" />
            Susunan Kelompok Realtime ({activeRoom.name})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Admin dapat mengatur topik projek, memindahkan peserta ke kelompok lain, atau mengeluarkan peserta dari grup.
          </p>
        </div>

        {/* Subgroups Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {activeRoom.subGroups.map((grp) => (
            <div
              key={grp.id}
              className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm flex flex-col justify-between"
            >
              {/* Solid Header */}
              <div className="p-3.5 sm:p-4 bg-slate-900 text-white space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm tracking-tight text-white">
                    {grp.name}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-white/20 text-white font-mono text-xs font-bold">
                    {grp.members.length} Orang
                  </span>
                </div>

                {/* Topic */}
                <div className="pt-0.5">
                  {editingTopicId === grp.id ? (
                    <div className="flex items-center space-x-1.5">
                      <Input
                        size="small"
                        value={tempTopic}
                        onChange={(e) => setTempTopic(e.target.value)}
                        placeholder="Ketik topik kelompok..."
                        className="rounded-lg text-xs"
                      />
                      <Button
                        size="small"
                        type="primary"
                        onClick={() => handleSaveTopic(grp.id)}
                        className="rounded-lg bg-indigo-600 text-white border-0 flex items-center justify-center p-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <div
                      onClick={() => handleStartEditTopic(grp)}
                      className="flex items-center justify-between text-[11px] text-white/90 bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-lg cursor-pointer transition-all"
                    >
                      <span className="truncate flex items-center">
                        <BookOpen className="w-3 h-3 mr-1.5 flex-shrink-0" />
                        {grp.topic || 'Klik untuk atur topik...'}
                      </span>
                      <Edit3 className="w-3 h-3 ml-1 flex-shrink-0 text-white/70" />
                    </div>
                  )}
                </div>
              </div>

              {/* Members List */}
              <div className="p-3 sm:p-4 divide-y divide-slate-100 flex-1 space-y-1.5">
                {grp.members.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-400 italic">
                    Belum ada anggota. Silakan acak kelompok.
                  </div>
                ) : (
                  grp.members.map((member, i) => (
                    <div
                      key={member.uid || member.identifier || i}
                      className="pt-2 first:pt-0 flex items-center justify-between text-xs group hover:bg-slate-50/60 px-1 py-1 rounded transition-all"
                    >
                      <div className="flex items-center space-x-2 min-w-0 flex-1 mr-2">
                        <span className="w-4 font-mono text-[10px] text-slate-400 font-bold flex-shrink-0">
                          {i + 1}.
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-slate-800 truncate">
                            {member.fullName}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400 truncate">
                            {member.identifier || '-'}
                          </div>
                        </div>
                      </div>

                      {/* Action buttons: Always visible on mobile, hover on desktop */}
                      <div className="flex items-center space-x-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all flex-shrink-0">
                        {/* Move Participant Button */}
                        <Tooltip title="Pindahkan ke Kelompok Lain">
                          <button
                            onClick={() => {
                              setMovingParticipant({
                                uid: member.uid,
                                name: member.fullName,
                                identifier: member.identifier,
                                fromSubGroupId: grp.id,
                              });
                              setTargetSubGroupId('');
                            }}
                            className="text-slate-400 hover:text-indigo-700 p-1.5 rounded hover:bg-slate-200 transition-all"
                          >
                            <MoveRight className="w-3.5 h-3.5" />
                          </button>
                        </Tooltip>

                        {/* Remove from SubGroup Button (Keeps in room as unassigned) */}
                        <Popconfirm
                          title="Keluarkan dari Kelompok?"
                          description={`Keluarkan ${member.fullName} dari ${grp.name}? Peserta akan berstatus belum berkelompok dan tetap ada di kelas/grup ini.`}
                          onConfirm={() => handleRemoveFromSubGroup(grp.id, member.uid)}
                          okText="Ya, Keluarkan dari Kelompok"
                          cancelText="Batal"
                        >
                          <Tooltip title="Keluarkan dari Kelompok Ini">
                            <button
                              disabled={unassigningUid === member.uid}
                              className="text-slate-400 hover:text-amber-600 p-1.5 rounded hover:bg-amber-50 transition-all"
                            >
                              <UserX className="w-3.5 h-3.5" />
                            </button>
                          </Tooltip>
                        </Popconfirm>

                        {/* Kick / Remove Participant Button */}
                        <Popconfirm
                          title="Keluarkan Peserta?"
                          description={`Keluarkan ${member.fullName} dari grup ini?`}
                          onConfirm={() => handleRemoveMember(member.uid)}
                          okText="Ya, Keluarkan"
                          cancelText="Batal"
                          okButtonProps={{ danger: true }}
                        >
                          <Tooltip title="Keluarkan dari Grup">
                            <button
                              disabled={removingUid === member.uid}
                              className="text-slate-400 hover:text-rose-600 p-1.5 rounded hover:bg-rose-50 transition-all"
                            >
                              <UserMinus className="w-3.5 h-3.5" />
                            </button>
                          </Tooltip>
                        </Popconfirm>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Add Member Button for Admin */}
              <div className="p-2.5 bg-slate-50 border-t border-slate-100">
                <Button
                  type="dashed"
                  size="small"
                  onClick={() => setAddingToGroup(grp)}
                  className="w-full rounded-xl text-xs font-bold text-emerald-700 border-emerald-300 hover:border-emerald-500 hover:bg-emerald-50 flex items-center justify-center space-x-1.5 h-8"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ Tambah Anggota</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {movingParticipant && (
        <Modal
          open={Boolean(movingParticipant)}
          onCancel={() => setMovingParticipant(null)}
          onOk={handleConfirmMove}
          title="Pindahkan Peserta ke Kelompok Lain"
          okText="Pindahkan"
          cancelText="Batal"
          okButtonProps={{ disabled: !targetSubGroupId }}
          centered
          width={420}
        >
          <div className="space-y-4 py-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="font-bold text-slate-900">{movingParticipant.name}</div>
              <div className="text-slate-500 font-mono">ID: {movingParticipant.identifier}</div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                Pilih Kelompok Tujuan:
              </label>
              <Select
                value={targetSubGroupId || undefined}
                onChange={(val) => setTargetSubGroupId(val)}
                placeholder="Pilih Kelompok..."
                className="w-full"
                size="large"
                options={activeRoom.subGroups
                  .filter((g) => g.id !== movingParticipant.fromSubGroupId)
                  .map((g) => ({
                    value: g.id,
                    label: `${g.name} (${g.members.length} Anggota)`,
                  }))}
              />
            </div>
          </div>
        </Modal>
      )}

      {addingToGroup && (
        <AddMemberToGroupModal
          open={Boolean(addingToGroup)}
          onClose={() => setAddingToGroup(null)}
          room={activeRoom}
          subGroup={addingToGroup}
        />
      )}
    </>
  );
};
