import React, { useState, useEffect } from 'react';
import { Modal, Input, Button, message } from 'antd';
import { useAuth } from '@/contexts/AuthContext';
import { User, IdCard, Mail, CheckCircle2, Users, X } from 'lucide-react';
import confetti from 'canvas-confetti';

interface CompleteProfileModalProps {
  open: boolean;
  onClose?: () => void;
  canDismiss?: boolean;
}

export const CompleteProfileModal: React.FC<CompleteProfileModalProps> = ({ 
  open, 
  onClose,
  canDismiss = false 
}) => {
  const { user, updateProfile } = useAuth();
  const [fullName, setFullName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setIdentifier(user.identifier || '');
    }
  }, [user, open]);

  const handleSubmit = async () => {
    if (!fullName.trim()) {
      message.warning('Harap masukkan nama lengkap Anda.');
      return;
    }
    if (!identifier.trim()) {
      message.warning('Harap masukkan Nomor Identitas / NIM / ID Anda.');
      return;
    }

    setLoading(true);
    try {
      const res = await updateProfile({
        fullName: fullName.trim(),
        identifier: identifier.trim(),
      });

      if (res.success) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
        if (onClose) onClose();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      footer={null}
      closable={canDismiss}
      onCancel={onClose}
      maskClosable={canDismiss}
      centered
      width={480}
      className="complete-profile-modal"
    >
      <div className="pt-2 pb-1 space-y-6">
        {/* Header - Solid Minimalist */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-indigo-700 text-white mx-auto flex items-center justify-center shadow-md">
            <Users className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Lengkapi Identitas Pengguna
          </h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Masukkan identitas resmi Anda agar terdaftar dalam sistem pengacakan kelompok.
          </p>
        </div>

        {/* Input Fields */}
        <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
          {/* Email (Readonly) */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5 flex items-center">
              <Mail className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
              Email Akun Google
            </label>
            <Input
              value={user?.email}
              disabled
              size="large"
              className="rounded-xl font-medium bg-white text-slate-600 border-slate-200"
            />
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center">
              <User className="w-3.5 h-3.5 mr-1.5 text-indigo-700" />
              Nama Lengkap <span className="text-red-500 ml-0.5">*</span>
            </label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Contoh: Andika Pratama"
              size="large"
              className="rounded-xl font-semibold"
            />
          </div>

          {/* Identifier / NIM / NIP / ID */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center">
              <IdCard className="w-3.5 h-3.5 mr-1.5 text-indigo-700" />
              Nomor Identitas (NIM / NIP / ID) <span className="text-red-500 ml-0.5">*</span>
            </label>
            <Input
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Contoh: 2201010042 atau ID-0912"
              size="large"
              className="rounded-xl font-mono font-bold text-slate-900 tracking-wider"
            />
          </div>
        </div>

        {/* Action Button */}
        <div>
          <Button
            type="primary"
            size="large"
            loading={loading}
            onClick={handleSubmit}
            className="w-full h-12 rounded-xl font-bold text-sm bg-indigo-700 hover:bg-indigo-800 border-0 flex items-center justify-center space-x-2 text-white shadow-md shadow-indigo-700/20"
          >
            <CheckCircle2 className="w-4 h-4 mr-1.5" />
            <span>Simpan Profil</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
};
