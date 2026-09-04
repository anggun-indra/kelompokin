import React, { useState } from 'react';
import { Modal, Input, Button } from 'antd';
import { useAuth } from '@/contexts/AuthContext';
import { useGroup } from '@/contexts/GroupContext';
import { Room, SubGroup, SwapCode } from '@/types';
import { KeyRound, ArrowRight, AlertCircle, ShieldCheck } from 'lucide-react';
import { ConfirmSwapModal } from './ConfirmSwapModal';

interface EnterSwapCodeModalProps {
  open: boolean;
  onClose: () => void;
  room: Room;
  mySubGroup: SubGroup;
}

export const EnterSwapCodeModal: React.FC<EnterSwapCodeModalProps> = ({
  open,
  onClose,
  room,
  mySubGroup,
}) => {
  const { user } = useAuth();
  const { swapCodes } = useGroup();
  const [code, setCode] = useState('');
  const [errorText, setErrorText] = useState<string | null>(null);
  const [targetSwapCode, setTargetSwapCode] = useState<SwapCode | null>(null);
  const [targetSubGroup, setTargetSubGroup] = useState<SubGroup | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  if (!user) return null;

  const handleValidateCode = () => {
    setErrorText(null);
    const clean = code.trim().toUpperCase();

    if (!clean) {
      setErrorText('Harap masukkan kode pertukaran.');
      return;
    }

    if (!room.isSwapAllowed) {
      setErrorText('Fitur pertukaran kelompok sedang dikunci oleh Admin.');
      return;
    }

    const foundCode = swapCodes.find(
      c => c.roomId === room.id && c.code.toUpperCase() === clean && c.status === 'ACTIVE'
    );

    if (!foundCode) {
      setErrorText('Kode tidak ditemukan atau sudah tidak aktif.');
      return;
    }

    if (new Date(foundCode.expiresAt).getTime() < Date.now()) {
      setErrorText('Kode pertukaran ini telah kedaluwarsa.');
      return;
    }

    if (foundCode.creatorUid === user.uid) {
      setErrorText('Ini adalah kode milik Anda sendiri.');
      return;
    }

    if (foundCode.creatorSubGroupId === mySubGroup.id) {
      setErrorText('Anda sudah berada di kelompok yang sama dengan pembuat kode.');
      return;
    }

    const foundTargetSubGroup = room.subGroups.find(sg => sg.id === foundCode.creatorSubGroupId);
    if (!foundTargetSubGroup) {
      setErrorText('Kelompok asal pembuat kode tidak ditemukan.');
      return;
    }

    setTargetSwapCode(foundCode);
    setTargetSubGroup(foundTargetSubGroup);
    setIsConfirmOpen(true);
  };

  const handleConfirmClose = (success?: boolean) => {
    setIsConfirmOpen(false);
    if (success) {
      setCode('');
      onClose();
    }
  };

  return (
    <>
      <Modal
        open={open && !isConfirmOpen}
        onCancel={onClose}
        footer={null}
        centered
        width={440}
        className="enter-swap-modal"
      >
        <div className="pt-2 pb-2 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700 mx-auto flex items-center justify-center">
              <KeyRound className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Tukar dengan Kode Rekan
            </h2>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Masukkan kode persetujuan pertukaran yang Anda terima dari rekan kelompok lain.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center">
                <ShieldCheck className="w-3.5 h-3.5 mr-1 text-indigo-700" />
                Kode Pertukaran (Format: TK-XXXX)
              </label>
              <Input
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  setErrorText(null);
                }}
                onPressEnter={handleValidateCode}
                placeholder="Contoh: TK-8X2M"
                size="large"
                maxLength={10}
                className="rounded-xl font-mono font-black text-center text-lg text-slate-900 tracking-widest uppercase"
              />
              {errorText && (
                <div className="mt-2 text-xs text-red-600 flex items-center space-x-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{errorText}</span>
                </div>
              )}
            </div>

            <Button
              type="primary"
              size="large"
              onClick={handleValidateCode}
              className="w-full h-12 rounded-xl font-bold text-xs bg-indigo-700 hover:bg-indigo-800 border-0 flex items-center justify-center space-x-2 text-white shadow-md shadow-indigo-700/20"
            >
              <span>Periksa Kode & Lanjutkan</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </Modal>

      {targetSwapCode && targetSubGroup && (
        <ConfirmSwapModal
          open={isConfirmOpen}
          onClose={handleConfirmClose}
          room={room}
          mySubGroup={mySubGroup}
          targetSwapCode={targetSwapCode}
          targetSubGroup={targetSubGroup}
        />
      )}
    </>
  );
};
