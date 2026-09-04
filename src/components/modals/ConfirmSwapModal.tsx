import React, { useState } from 'react';
import { Modal, Button, message } from 'antd';
import { useAuth } from '@/contexts/AuthContext';
import { useGroup } from '@/contexts/GroupContext';
import { Room, SubGroup, SwapCode } from '@/types';
import { ArrowLeftRight, CheckCircle2 } from 'lucide-react';

interface ConfirmSwapModalProps {
  open: boolean;
  onClose: (success?: boolean) => void;
  room: Room;
  mySubGroup: SubGroup;
  targetSwapCode: SwapCode;
  targetSubGroup: SubGroup;
}

export const ConfirmSwapModal: React.FC<ConfirmSwapModalProps> = ({
  open,
  onClose,
  room,
  mySubGroup,
  targetSwapCode,
  targetSubGroup,
}) => {
  const { user } = useAuth();
  const { executeSwapWithCode } = useGroup();
  const [loading, setLoading] = useState(false);

  if (!user) return null;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const res = await executeSwapWithCode(room.id, targetSwapCode.code, user);
      if (res.success) {
        message.success(res.message || 'Pertukaran kelompok berhasil disetujui!');
        onClose(true);
      } else {
        message.error(res.error || 'Pertukaran gagal.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={() => onClose(false)}
      footer={null}
      centered
      width={500}
      className="confirm-swap-modal"
    >
      <div className="pt-2 pb-1 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 mx-auto flex items-center justify-center">
            <ArrowLeftRight className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Konfirmasi Pertukaran Kelompok
          </h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Pastikan detail pertukaran di bawah ini sudah sesuai sebelum menyetujui.
          </p>
        </div>

        {/* Visual Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
              Pembuat Kode
            </span>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-900 truncate">
                {targetSwapCode.creatorName}
              </div>
              <div className="text-[11px] font-mono text-slate-500">
                ID: {targetSwapCode.creatorIdentifier}
              </div>
            </div>
            <div className="pt-2 border-t border-slate-200 text-xs">
              <span className="text-slate-500">Asal: </span>
              <span className="font-bold text-indigo-700">{targetSubGroup.name}</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 space-y-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-700">
              Anda (Pengganti)
            </span>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-900 truncate">
                {user.fullName}
              </div>
              <div className="text-[11px] font-mono text-slate-500">
                ID: {user.identifier}
              </div>
            </div>
            <div className="pt-2 border-t border-indigo-200 text-xs">
              <span className="text-slate-500">Asal: </span>
              <span className="font-bold text-indigo-800">{mySubGroup.name}</span>
            </div>
          </div>
        </div>

        {/* Summary Note */}
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
          <div className="font-bold flex items-center">
            <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-700" />
            Setelah Disetujui:
          </div>
          <ul className="text-[11px] text-emerald-800 list-disc pl-5 space-y-0.5">
            <li>Anda akan bergabung ke <strong>{targetSubGroup.name}</strong></li>
            <li>{targetSwapCode.creatorName} akan berpindah ke <strong>{mySubGroup.name}</strong></li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex space-x-3 pt-1">
          <Button
            size="large"
            onClick={() => onClose(false)}
            className="w-1/3 rounded-xl font-bold text-xs"
          >
            Batal
          </Button>
          <Button
            type="primary"
            size="large"
            loading={loading}
            onClick={handleConfirm}
            className="w-2/3 h-12 rounded-xl font-bold text-xs bg-emerald-700 hover:bg-emerald-800 border-0 flex items-center justify-center space-x-2 text-white shadow-md shadow-emerald-700/20"
          >
            <CheckCircle2 className="w-4 h-4 mr-1" />
            <span>Setujui & Tukar Sekarang</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
};
