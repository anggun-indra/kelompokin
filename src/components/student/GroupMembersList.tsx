import React from 'react';
import { Participant } from '@/types';
import { Mail, IdCard } from 'lucide-react';

interface GroupMembersListProps {
  members: Participant[];
  currentUserUid?: string;
  currentUserIdentifier?: string;
}

export const GroupMembersList: React.FC<GroupMembersListProps> = ({
  members,
  currentUserUid,
  currentUserIdentifier,
}) => {
  if (!members || members.length === 0) {
    return (
      <div className="p-6 text-center text-slate-400 text-xs italic bg-slate-50 rounded-xl border border-dashed border-slate-200">
        Belum ada anggota di kelompok ini.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3">
      {members.map((member, idx) => {
        const isMe = (currentUserUid && member.uid === currentUserUid) || 
                     (currentUserIdentifier && member.identifier === currentUserIdentifier);

        return (
          <div
            key={member.uid || member.identifier || idx}
            className={`p-3 sm:p-4 rounded-xl border transition-all flex items-center justify-between ${
              isMe
                ? 'bg-indigo-50/80 border-indigo-300 ring-1 ring-indigo-200'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <div className="relative flex-shrink-0">
                <img
                  src={member.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.uid || member.identifier}`}
                  alt={member.fullName}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-200 object-cover border border-slate-200"
                />
                <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-slate-900 text-white font-mono text-[9px] font-bold flex items-center justify-center">
                  {idx + 1}
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-1.5 flex-wrap">
                  <span className="font-extrabold text-xs sm:text-sm text-slate-900 truncate">
                    {member.fullName}
                  </span>
                  {isMe && (
                    <span className="px-1.5 py-0.5 rounded bg-indigo-700 text-white text-[9px] font-bold uppercase tracking-wider flex-shrink-0">
                      Anda
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-1.5 mt-0.5 text-[10px] sm:text-[11px] text-slate-500 font-medium truncate">
                  <span className="font-mono text-slate-700 font-bold flex items-center flex-shrink-0">
                    <IdCard className="w-3 h-3 mr-1 text-slate-400" />
                    {member.identifier || '-'}
                  </span>
                  <span>•</span>
                  <span className="truncate flex items-center text-slate-400">
                    <Mail className="w-3 h-3 mr-1 flex-shrink-0" />
                    {member.email}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
