import React, { useState } from 'react';
import { Modal, Input, Button, message } from 'antd';
import { useAuth } from '@/contexts/AuthContext';
import { useGroup } from '@/contexts/GroupContext';
import { LogIn, Hash, ArrowRight } from 'lucide-react';

interface JoinRoomModalProps {
  open: boolean;
  onClose: () => void;
}

export const JoinRoomModal: React.FC<JoinRoomModalProps> = ({ open, onClose }) => {
  const { user } = useAuth();
  const { joinRoomByCode } = useGroup();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    if (!code.trim()) {
      message.warning('Harap masukkan kode grup.');
      return;
    }
    if (!user) return;

    setLoading(true);
    try {
      const res = await joinRoomByCode(code.trim(), user);
      if (res.success) {
        setCode('');
        onClose();
      } else {
        message.error(res.error || 'Gagal bergabung ke grup.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      width={420}
      className="join-modal"
    >
      <div className="pt-2 pb-1 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700 mx-auto flex items-center justify-center">
            <LogIn className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Gabung ke Grup Belajar
          </h2>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Masukkan kode grup yang diberikan oleh Admin / Dosen / Pengampu Anda.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center">
              <Hash className="w-3.5 h-3.5 mr-1 text-indigo-700" />
              Kode Akses Grup
            </label>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onPressEnter={handleJoin}
              placeholder="Contoh: WEB-4A / GRP-8X2M"
              size="large"
              className="rounded-xl font-mono font-black text-center text-lg uppercase tracking-widest text-slate-900"
            />
          </div>

          <Button
            type="primary"
            size="large"
            loading={loading}
            onClick={handleJoin}
            className="w-full h-12 rounded-xl font-bold text-xs bg-indigo-700 hover:bg-indigo-800 border-0 flex items-center justify-center space-x-2 text-white shadow-md shadow-indigo-700/20"
          >
            <span>Gabung ke Grup</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </Modal>
  );
};
