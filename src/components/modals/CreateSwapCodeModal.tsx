import React, { useState } from 'react';
import { Modal, Button, message } from 'antd';
import { useAuth } from '@/contexts/AuthContext';
import { useGroup } from '@/contexts/GroupContext';
import { Room, SubGroup, SwapCode } from '@/types';
import { 
  ArrowLeftRight, 
  Copy, 
  Check, 
  Clock, 
  AlertTriangle, 
  MessageSquare,
  ShieldCheck
} from 'lucide-react';

interface CreateSwapCodeModalProps {
  open: boolean;
  onClose: () => void;
  room: Room;
  mySubGroup: SubGroup;
}

export const CreateSwapCodeModal: React.FC<CreateSwapCodeModalProps> = ({
  open,
  onClose,
  room,
  mySubGroup,
}) => {
  const { user } = useAuth();
  const { generateSwapCode, swapCodes, cancelSwapCode } = useGroup();
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!user) return null;

  const now = Date.now();
  const activeCode: SwapCode | undefined = swapCodes.find(
    (c) => c.roomId === room.id && c.creatorUid === user.uid && c.status === 'ACTIVE' && new Date(c.expiresAt).getTime() > now
  );

  const handleGenerate = async () => {
    setLoading(true);
    try {
      await generateSwapCode(room.id, user);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    message.success('Kode pertukaran berhasil disalin!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = (code: string) => {
    const text = encodeURIComponent(
      `Halo! Saya *${user.fullName}* (${user.identifier}) dari *${mySubGroup.name}* di grup *${room.name}* ingin bertukar kelompok.\n\n` +
      `Gunakan Kode Pertukaran saya: *${code}*\n` +
      `di aplikasi *Kelompokin* untuk menyetujui barter kelompok.`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleCancel = async (codeId: string) => {
    await cancelSwapCode(codeId);
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      width={480}
      className="swap-code-modal"
    >
      <div className="pt-2 pb-2 space-y-6">
        {/* Header - Solid Minimalist */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700 mx-auto flex items-center justify-center">
            <ArrowLeftRight className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Ajukan Pertukaran Kelompok
          </h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Anda terdaftar di <span className="font-bold text-indigo-700">{mySubGroup.name}</span>. Berikan kode ini kepada peserta lain yang bersedia bertukar.
          </p>
        </div>

        {!room.isSwapAllowed ? (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-700" />
            <p>Fitur pertukaran kelompok saat ini sedang dikunci oleh Admin.</p>
          </div>
        ) : activeCode ? (
          <div className="space-y-4">
            <div className="p-6 rounded-2xl bg-slate-50 border-2 border-indigo-300 text-center space-y-3">
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-600 mr-1.5" />
                Kode Aktif Siap Dibagikan
              </span>

              <div className="py-2">
                <div className="text-3xl font-black font-mono tracking-widest text-indigo-800 bg-white inline-block px-6 py-2.5 rounded-xl border border-slate-300 shadow-sm">
                  {activeCode.code}
                </div>
              </div>

              <div className="flex items-center justify-center space-x-1 text-xs text-slate-500">
                <Clock className="w-3.5 h-3.5 mr-1" />
                <span>Berlaku hingga: {new Date(activeCode.expiresAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <Button
                  size="large"
                  onClick={() => handleCopy(activeCode.code)}
                  className="rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 border-slate-300"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-600" />}
                  <span>{copied ? 'Tersalin!' : 'Salin Kode'}</span>
                </Button>

                <Button
                  type="primary"
                  size="large"
                  onClick={() => handleShareWhatsApp(activeCode.code)}
                  className="rounded-xl font-bold text-xs bg-emerald-700 hover:bg-emerald-800 border-0 flex items-center justify-center space-x-1.5 text-white"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Kirim ke WA</span>
                </Button>
              </div>
            </div>

            <div className="flex justify-between items-center px-1">
              <span className="text-[11px] text-slate-400">Ingin membatalkan ajuan?</span>
              <Button
                type="text"
                danger
                size="small"
                onClick={() => handleCancel(activeCode.id)}
                className="text-xs font-semibold"
              >
                Batalkan Kode
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
              <div className="font-bold text-slate-800">Petunjuk Pertukaran:</div>
              <ol className="list-decimal pl-4 space-y-1 text-slate-500">
                <li>Klik tombol <strong>Buat Kode Pertukaran</strong> di bawah.</li>
                <li>Bagikan kode ke rekan yang ingin bertukar kelompok.</li>
                <li>Setelah rekan Anda mengonfirmasi, posisi kelompok Anda berdua akan <strong>otomatis tertukar</strong>.</li>
              </ol>
            </div>

            <Button
              type="primary"
              size="large"
              loading={loading}
              onClick={handleGenerate}
              className="w-full h-12 rounded-xl font-bold text-sm bg-indigo-700 hover:bg-indigo-800 border-0 flex items-center justify-center space-x-2 text-white shadow-md"
            >
              <ArrowLeftRight className="w-4 h-4 mr-1" />
              <span>Buat Kode Pertukaran Sekarang</span>
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
};
