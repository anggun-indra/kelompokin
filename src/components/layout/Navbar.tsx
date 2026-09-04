import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useGroup } from '@/contexts/GroupContext';
import { 
  Users, 
  LogOut, 
  ChevronDown, 
  Plus, 
  LogIn, 
  FolderOpen, 
  Edit
} from 'lucide-react';
import { Button, Dropdown, MenuProps } from 'antd';
import { CreateRoomModal } from '@/components/modals/CreateRoomModal';
import { JoinRoomModal } from '@/components/modals/JoinRoomModal';
import { CompleteProfileModal } from '@/components/modals/CompleteProfileModal';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { rooms, activeRoom, selectRoom } = useGroup();

  const [isCreateRoomOpen, setIsCreateRoomOpen] = useState(false);
  const [isJoinRoomOpen, setIsJoinRoomOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  // Filter only rooms the current user owns or has joined
  const myRooms = rooms.filter(
    r => (user && r.creatorUid === user.uid) || 
         (user && r.participants.some(p => p.uid === user.uid || (p.email && user.email && p.email.toLowerCase() === user.email.toLowerCase())))
  );

  const roomMenuItems: MenuProps['items'] = [
    ...(myRooms.length > 0
      ? [
          {
            key: 'room-header',
            type: 'group' as const,
            label: 'Grup Anda',
            children: myRooms.map((r) => ({
              key: r.id,
              label: (
                <div className="py-1 max-w-[240px]">
                  <div className={`text-xs font-bold truncate ${activeRoom?.id === r.id ? 'text-indigo-700 font-extrabold' : 'text-slate-800'}`}>
                    {r.name}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                    Kode: {r.code} • {r.participants.length} Peserta {r.creatorUid === user?.uid ? '• (Admin)' : ''}
                  </div>
                </div>
              ),
              onClick: () => selectRoom(r),
            })),
          },
          {
            type: 'divider' as const,
          },
        ]
      : [
          {
            key: 'no-room',
            disabled: true,
            label: (
              <div className="py-1 text-xs text-slate-400 italic">
                Belum ada grup yang diikuti
              </div>
            ),
          },
          {
            type: 'divider' as const,
          },
        ]),
    {
      key: 'add-room',
      label: (
        <div className="flex items-center text-xs font-bold text-indigo-700 py-1">
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          Buat Grup Baru
        </div>
      ),
      onClick: () => setIsCreateRoomOpen(true),
    },
    {
      key: 'join-room',
      label: (
        <div className="flex items-center text-xs font-bold text-slate-700 py-1">
          <LogIn className="w-3.5 h-3.5 mr-1.5" />
          Gabung Grup dengan Kode
        </div>
      ),
      onClick: () => setIsJoinRoomOpen(true),
    },
  ];

  const profileMenuItems: MenuProps['items'] = [
    {
      key: 'user-info',
      disabled: true,
      label: (
        <div className="py-1 max-w-[200px]">
          <div className="font-bold text-xs text-slate-900 truncate">
            {user?.fullName}
          </div>
          <div className="text-[10px] text-slate-400 font-mono truncate">
            {user?.email}
          </div>
          {user?.identifier && (
            <div className="text-[10px] text-indigo-700 font-mono font-bold mt-0.5 truncate">
              ID/NIM: {user.identifier}
            </div>
          )}
        </div>
      ),
    },
    {
      type: 'divider',
    },
    {
      key: 'edit-profile',
      label: (
        <div className="flex items-center text-xs font-bold text-slate-700 py-1">
          <Edit className="w-3.5 h-3.5 mr-1.5 text-indigo-700" />
          Edit Profil (Nama / NIM)
        </div>
      ),
      onClick: () => setIsEditProfileOpen(true),
    },
    {
      key: 'logout',
      danger: true,
      label: (
        <div className="flex items-center text-xs font-bold py-1">
          <LogOut className="w-3.5 h-3.5 mr-1.5" />
          Keluar (Logout)
        </div>
      ),
      onClick: logout,
    },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
            {/* Brand Logo */}
            <div 
              onClick={() => selectRoom(null)}
              className="flex items-center space-x-2 sm:space-x-3 cursor-pointer select-none flex-shrink-0"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-indigo-700 text-white flex items-center justify-center font-bold shadow-sm">
                <Users className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="flex items-center">
                <span className="text-base sm:text-lg font-black tracking-tight text-slate-900">
                  Kelompokin
                </span>
                <span className="hidden sm:inline-block ml-1.5 text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                  App
                </span>
              </div>
            </div>

            {/* Room Switcher (Mobile & Desktop) */}
            {user && (
              <div className="flex items-center space-x-1 sm:space-x-2 flex-1 justify-end md:justify-center max-w-[260px] sm:max-w-none">
                <Dropdown menu={{ items: roomMenuItems }} trigger={['click']} placement="bottom">
                  <Button className="rounded-xl font-bold text-xs flex items-center space-x-1.5 h-8 sm:h-9 px-2.5 sm:px-3 border-slate-300 max-w-[160px] sm:max-w-[220px]">
                    <FolderOpen className="w-3.5 h-3.5 text-indigo-700 flex-shrink-0" />
                    <span className="truncate text-left text-slate-800">
                      {activeRoom ? activeRoom.name : 'Pilih Grup'}
                    </span>
                    <ChevronDown className="w-3 h-3 text-slate-400 flex-shrink-0" />
                  </Button>
                </Dropdown>

                <Button
                  type="text"
                  size="small"
                  onClick={() => setIsCreateRoomOpen(true)}
                  className="hidden sm:flex text-xs font-bold text-indigo-700 hover:bg-indigo-50 items-center h-8"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Grup Baru
                </Button>
              </div>
            )}

            {/* User Profile */}
            <div className="flex items-center space-x-1 sm:space-x-3 flex-shrink-0">
              {user && (
                <Dropdown menu={{ items: profileMenuItems }} trigger={['click']} placement="bottomRight">
                  <Button
                    type="text"
                    className="flex items-center space-x-1.5 sm:space-x-2 h-8 sm:h-9 px-1.5 sm:px-2 rounded-xl hover:bg-slate-100"
                  >
                    <img
                      src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`}
                      alt={user.fullName}
                      className="w-7 h-7 rounded-lg bg-slate-200 object-cover flex-shrink-0"
                    />
                    <div className="text-left hidden md:block max-w-[100px] lg:max-w-[140px]">
                      <div className="text-xs font-bold text-slate-900 truncate">
                        {user.fullName}
                      </div>
                    </div>
                    <ChevronDown className="w-3 h-3 text-slate-400 hidden sm:block" />
                  </Button>
                </Dropdown>
              )}
            </div>
          </div>
        </div>
      </header>

      <CreateRoomModal
        open={isCreateRoomOpen}
        onClose={() => setIsCreateRoomOpen(false)}
      />

      <JoinRoomModal
        open={isJoinRoomOpen}
        onClose={() => setIsJoinRoomOpen(false)}
      />

      <CompleteProfileModal
        open={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        canDismiss={true}
      />
    </>
  );
};
