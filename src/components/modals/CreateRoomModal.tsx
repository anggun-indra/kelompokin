import React, { useState } from 'react';
import { Modal, Input, InputNumber, Button, message } from 'antd';
import { useAuth } from '@/contexts/AuthContext';
import { useGroup } from '@/contexts/GroupContext';
import { PlusCircle, Hash, Users, BookOpen } from 'lucide-react';

interface CreateRoomModalProps {
  open: boolean;
  onClose: () => void;
}

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({ open, onClose }) => {
  const { user } = useAuth();
  const { createRoom } = useGroup();

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [totalSubGroups, setTotalSubGroups] = useState<number>(6);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      message.warning('Harap masukkan nama grup.');
      return;
    }
    if (!code.trim()) {
      message.warning('Harap tentukan kode grup.');
      return;
    }
    if (!user) return;

    setLoading(true);
    try {
      const res = await createRoom(name, code, description, totalSubGroups, user);
      if (res.success) {
        setName('');
        setCode('');
        setDescription('');
        setTotalSubGroups(6);
        onClose();
      } else {
        message.error(res.error || 'Gagal membuat grup.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateRandomCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let rand = 'GRP-';
    for (let i = 0; i < 4; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCode(rand);
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      width={500}
      title={
        <div className="flex items-center space-x-2 text-base font-black text-slate-900">
          <PlusCircle className="w-5 h-5 text-indigo-700" />
          <span>Buat Grup / Sesi Belajar Baru</span>
        </div>
      }
    >
      <div className="pt-2 pb-1 space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Nama Grup / Kelas / Sesi <span className="text-red-500">*</span>
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Contoh: Kelas Pemrograman Web A / Workshop UI UX"
            size="large"
            className="rounded-xl"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold text-slate-700 flex items-center">
              <Hash className="w-3.5 h-3.5 mr-1 text-slate-400" />
              Kode Akses Grup (Untuk Peserta Join) <span className="text-red-500 ml-0.5">*</span>
            </label>
            <button
              type="button"
              onClick={handleGenerateRandomCode}
              className="text-[11px] text-indigo-700 font-bold hover:underline"
            >
              Acak Kode
            </button>
          </div>
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Contoh: WEB-4A atau GRP-7X2M"
            size="large"
            className="rounded-xl font-mono font-bold uppercase"
          />
          <p className="text-[11px] text-slate-400 mt-1">
            Peserta akan memasukkan kode ini setelah login untuk bergabung ke grup ini.
          </p>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Deskripsi / Catatan Tambahan (Opsional)
          </label>
          <Input.TextArea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Contoh: Sesi pembagian kelompok tugas akhir semester genap..."
            rows={3}
            className="rounded-xl text-xs"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Jumlah Kelompok yang Akan Dibagi:
          </label>
          <InputNumber
            min={2}
            max={30}
            value={totalSubGroups}
            onChange={(val) => val && setTotalSubGroups(val)}
            className="w-full rounded-xl font-mono font-bold"
            size="large"
          />
        </div>

        <Button
          type="primary"
          size="large"
          loading={loading}
          onClick={handleCreate}
          className="w-full h-12 rounded-xl font-bold text-xs bg-indigo-700 hover:bg-indigo-800 border-0 text-white mt-2"
        >
          Buat Grup Sekarang
        </Button>
      </div>
    </Modal>
  );
};
