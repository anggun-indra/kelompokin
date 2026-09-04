export interface UserProfile {
  uid: string;
  email: string;
  fullName: string;
  identifier?: string; // NIM / NIP / ID Peserta
  avatarUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Participant {
  uid: string;
  identifier: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  subGroupId?: string | null;
  subGroupNumber?: number | null;
  joinedAt: string;
}

export interface SubGroup {
  id: string;
  groupNumber: number;
  name: string; // e.g. "Kelompok 1"
  topic?: string;
  members: Participant[];
}

export interface Room {
  id: string;
  code: string; // e.g. "KELAS-4A" or "GRP-7X2M"
  name: string; // e.g. "Kelas Pemrograman Web" or "Workshop UI/UX"
  description?: string;
  creatorUid: string;
  creatorEmail: string;
  creatorName: string;
  isSwapAllowed: boolean;
  totalSubGroups: number;
  subGroups: SubGroup[];
  participants: Participant[];
  createdAt: string;
  updatedAt: string;
}

export type SwapCodeStatus = 'ACTIVE' | 'USED' | 'CANCELLED' | 'EXPIRED';

export interface SwapCode {
  id: string;
  code: string;
  roomId: string;
  creatorUid: string;
  creatorName: string;
  creatorIdentifier: string;
  creatorSubGroupId: string;
  creatorSubGroupNumber: number;
  status: SwapCodeStatus;
  createdAt: string;
  expiresAt: string;
  usedByUid?: string;
  usedByName?: string;
  usedByIdentifier?: string;
  usedAt?: string;
}

export interface SwapLog {
  id: string;
  roomId: string;
  code: string;
  participantA: {
    uid: string;
    name: string;
    identifier: string;
    fromGroupNumber: number;
    toGroupNumber: number;
  };
  participantB: {
    uid: string;
    name: string;
    identifier: string;
    fromGroupNumber: number;
    toGroupNumber: number;
  };
  timestamp: string;
}
