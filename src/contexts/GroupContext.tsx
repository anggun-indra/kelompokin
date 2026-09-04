import React, { createContext, useContext, useState, useEffect } from 'react';
import { Room, SubGroup, Participant, SwapCode, SwapLog, UserProfile } from '@/types';
import { 
  db, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc,
  onSnapshot, 
  runTransaction,
  query,
  where,
  getDocs,
  getDoc
} from '@/lib/firebase';
import { message } from 'antd';
import confetti from 'canvas-confetti';
import * as XLSX from 'xlsx';

interface GroupContextType {
  rooms: Room[];
  activeRoom: Room | null;
  swapCodes: SwapCode[];
  swapLogs: SwapLog[];
  isShuffling: boolean;
  isLoading: boolean;
  
  // Actions
  selectRoom: (room: Room | null) => void;
  createRoom: (name: string, code: string, description: string, totalSubGroups: number, creatorUser: UserProfile) => Promise<{ success: boolean; room?: Room; error?: string }>;
  deleteRoom: (roomId: string) => Promise<boolean>;
  joinRoomByCode: (code: string, user: UserProfile) => Promise<{ success: boolean; room?: Room; error?: string }>;
  leaveRoom: (roomId: string, user: UserProfile) => Promise<boolean>;
  removeParticipant: (roomId: string, participantUid: string) => Promise<boolean>;
  kickAllParticipants: (roomId: string) => Promise<boolean>;
  randomizeSubGroups: (roomId: string, totalSubGroups?: number) => Promise<boolean>;
  toggleRoomSwapAllowed: (roomId: string, allowed: boolean) => Promise<void>;
  generateSwapCode: (roomId: string, user: UserProfile) => Promise<{ success: boolean; code?: string; error?: string }>;
  cancelSwapCode: (codeId: string) => Promise<boolean>;
  executeSwapWithCode: (roomId: string, codeStr: string, user: UserProfile) => Promise<{ success: boolean; error?: string; message?: string }>;
  updateSubGroupTopic: (roomId: string, subGroupId: string, topic: string) => Promise<void>;
  manualMoveParticipant: (roomId: string, participantUid: string, fromSubGroupId: string, toSubGroupId: string) => Promise<boolean>;
  addParticipantToSubGroup: (roomId: string, subGroupId: string, participantUid: string, userProfile?: UserProfile) => Promise<{ success: boolean; error?: string }>;
  exportRoomToExcel: (room: Room) => void;
  resetRoomGroups: (roomId: string) => Promise<void>;
}

const GroupContext = createContext<GroupContextType | undefined>(undefined);

export const GroupProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [rooms, setRooms] = useState<Room[]>(() => {
    try {
      const saved = localStorage.getItem('kelompokin_cached_rooms');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activeRoomId, setActiveRoomId] = useState<string | null>(() => {
    return localStorage.getItem('kelompokin_active_room_id') || null;
  });

  const [swapCodes, setSwapCodes] = useState<SwapCode[]>([]);
  const [swapLogs, setSwapLogs] = useState<SwapLog[]>([]);
  const [isShuffling, setIsShuffling] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Cache rooms locally for offline-first instant loading
  useEffect(() => {
    if (rooms.length > 0) {
      localStorage.setItem('kelompokin_cached_rooms', JSON.stringify(rooms));
    }
  }, [rooms]);

  useEffect(() => {
    if (activeRoomId) {
      localStorage.setItem('kelompokin_active_room_id', activeRoomId);
    } else {
      localStorage.removeItem('kelompokin_active_room_id');
    }
  }, [activeRoomId]);

  // Realtime Firestore Listeners
  useEffect(() => {
    if (!db || !db.app) return;

    let unsubRooms: (() => void) | undefined;
    let unsubSwapCodes: (() => void) | undefined;
    let unsubSwapLogs: (() => void) | undefined;

    try {
      const roomsCol = collection(db, 'rooms');
      unsubRooms = onSnapshot(roomsCol, (snap) => {
        const list: Room[] = [];
        snap.forEach((docSnap) => {
          list.push(docSnap.data() as Room);
        });
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setRooms(list);
      }, (err) => console.warn('Rooms listener note:', err));

      const swapCodesCol = collection(db, 'swap_codes');
      unsubSwapCodes = onSnapshot(swapCodesCol, (snap) => {
        const list: SwapCode[] = [];
        snap.forEach((docSnap) => {
          list.push(docSnap.data() as SwapCode);
        });
        setSwapCodes(list);
      }, (err) => console.warn('SwapCodes listener note:', err));

      const swapLogsCol = collection(db, 'swap_logs');
      unsubSwapLogs = onSnapshot(swapLogsCol, (snap) => {
        const list: SwapLog[] = [];
        snap.forEach((docSnap) => {
          list.push(docSnap.data() as SwapLog);
        });
        list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setSwapLogs(list);
      }, (err) => console.warn('SwapLogs listener note:', err));
    } catch (e) {
      console.warn('Firebase snapshot error:', e);
    }

    return () => {
      if (unsubRooms) unsubRooms();
      if (unsubSwapCodes) unsubSwapCodes();
      if (unsubSwapLogs) unsubSwapLogs();
    };
  }, []);

  const activeRoom = rooms.find(r => r.id === activeRoomId) || null;

  const selectRoom = (room: Room | null) => {
    setActiveRoomId(room ? room.id : null);
  };

  // 1. CREATE ROOM
  const createRoom = async (
    name: string,
    code: string,
    description: string,
    totalSubGroups: number,
    creatorUser: UserProfile
  ): Promise<{ success: boolean; room?: Room; error?: string }> => {
    const cleanCode = code.trim().toUpperCase().replace(/\s+/g, '-');
    if (!cleanCode) return { success: false, error: 'Kode grup tidak boleh kosong.' };

    const existing = rooms.find(r => r.code.toUpperCase() === cleanCode);
    if (existing) {
      return { success: false, error: 'Kode grup sudah digunakan. Pilih kode lain.' };
    }

    const roomId = `room-${Date.now()}`;
    const initialSubGroups: SubGroup[] = [];
    for (let i = 1; i <= totalSubGroups; i++) {
      initialSubGroups.push({
        id: `subgroup-${i}`,
        groupNumber: i,
        name: `Kelompok ${i}`,
        members: [],
      });
    }

    const newRoom: Room = {
      id: roomId,
      code: cleanCode,
      name: name.trim(),
      description: description.trim(),
      creatorUid: creatorUser.uid,
      creatorEmail: creatorUser.email,
      creatorName: creatorUser.fullName,
      isSwapAllowed: true,
      totalSubGroups,
      subGroups: initialSubGroups,
      participants: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Optimistically update local rooms state immediately!
    setRooms((prev) => [newRoom, ...prev]);
    setActiveRoomId(roomId);

    // Save to Firestore in background without blocking UI
    if (db && db.app) {
      setDoc(doc(db, 'rooms', roomId), newRoom).catch((err) => {
        console.warn('Firestore setDoc room note:', err);
      });
    }

    message.success(`Grup "${name}" berhasil dibuat! Bagikan kode [${cleanCode}] kepada peserta.`);
    return { success: true, room: newRoom };
  };

  // 2. DELETE ROOM
  const deleteRoom = async (roomId: string): Promise<boolean> => {
    setRooms((prev) => prev.filter(r => r.id !== roomId));
    if (activeRoomId === roomId) {
      setActiveRoomId(null);
    }

    if (db && db.app) {
      deleteDoc(doc(db, 'rooms', roomId)).catch(console.warn);
    }
    message.info('Grup berhasil dihapus.');
    return true;
  };

  // 3. JOIN ROOM BY CODE (Atomic Firestore Transaction to prevent race conditions)
  const joinRoomByCode = async (
    code: string,
    user: UserProfile
  ): Promise<{ success: boolean; room?: Room; error?: string }> => {
    const cleanCode = code.trim().toUpperCase();

    try {
      // Step A: Find room ID (from local memory or direct Firestore query)
      let targetRoom = rooms.find(r => r.code.toUpperCase() === cleanCode);

      if (!targetRoom && db && db.app) {
        const q = query(collection(db, 'rooms'), where('code', '==', cleanCode));
        const snap = await getDocs(q);
        if (!snap.empty) {
          targetRoom = snap.docs[0].data() as Room;
        }
      }

      if (!targetRoom) {
        return { success: false, error: 'Grup dengan kode tersebut tidak ditemukan.' };
      }

      const roomId = targetRoom.id;
      let finalRoom = targetRoom;

      // Step B: Atomic Transaction in Firestore
      if (db && db.app) {
        const roomRef = doc(db, 'rooms', roomId);
        await runTransaction(db, async (transaction) => {
          const roomDoc = await transaction.get(roomRef);
          if (!roomDoc.exists()) {
            throw new Error('Grup tidak ditemukan di database.');
          }

          const currentRoomData = roomDoc.data() as Room;
          const currentParticipants = currentRoomData.participants || [];

          const alreadyJoined = currentParticipants.some(
            p => p.uid === user.uid || 
                 (p.email && user.email && p.email.toLowerCase() === user.email.toLowerCase())
          );

          if (!alreadyJoined) {
            const newParticipant: Participant = {
              uid: user.uid,
              identifier: user.identifier || '',
              fullName: user.fullName,
              email: user.email,
              avatarUrl: user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`,
              subGroupId: null,
              subGroupNumber: null,
              joinedAt: new Date().toISOString(),
            };

            const updatedParticipants = [...currentParticipants, newParticipant];
            finalRoom = {
              ...currentRoomData,
              participants: updatedParticipants,
              updatedAt: new Date().toISOString(),
            };

            transaction.set(roomRef, finalRoom);
          } else {
            finalRoom = currentRoomData;
          }
        });
      }

      // Step C: Update local state and active room
      setRooms((prev) => {
        const exists = prev.some(r => r.id === finalRoom.id);
        if (exists) {
          return prev.map(r => r.id === finalRoom.id ? finalRoom : r);
        }
        return [finalRoom, ...prev];
      });

      setActiveRoomId(finalRoom.id);
      message.success(`Berhasil bergabung ke grup "${finalRoom.name}"!`);
      return { success: true, room: finalRoom };
    } catch (err: any) {
      console.error('Error joining room:', err);
      message.error(err.message || 'Gagal bergabung ke grup.');
      return { success: false, error: err.message };
    }
  };

  // 4. LEAVE ROOM (Participant self action)
  const leaveRoom = async (roomId: string, user: UserProfile): Promise<boolean> => {
    let room = rooms.find(r => r.id === roomId);
    if (!room && db && db.app) {
      const snap = await getDoc(doc(db, 'rooms', roomId)).catch(() => null);
      if (snap && snap.exists()) room = snap.data() as Room;
    }
    if (!room) return false;

    const updatedParticipants = room.participants.filter(p => p.uid !== user.uid);
    const updatedSubGroups = room.subGroups.map(sg => ({
      ...sg,
      members: sg.members.filter(m => m.uid !== user.uid),
    }));

    const updatedRoom: Room = {
      ...room,
      participants: updatedParticipants,
      subGroups: updatedSubGroups,
      updatedAt: new Date().toISOString(),
    };

    setRooms((prev) => prev.map(r => r.id === roomId ? updatedRoom : r));
    if (activeRoomId === roomId) {
      setActiveRoomId(null);
    }

    if (db && db.app) {
      setDoc(doc(db, 'rooms', roomId), updatedRoom).catch(console.warn);
    }
    message.info(`Anda telah keluar dari grup ${room.name}.`);
    return true;
  };

  // 5. REMOVE / KICK PARTICIPANT (Admin action)
  const removeParticipant = async (roomId: string, participantUid: string): Promise<boolean> => {
    let room = rooms.find(r => r.id === roomId);
    if (!room && db && db.app) {
      const snap = await getDoc(doc(db, 'rooms', roomId)).catch(() => null);
      if (snap && snap.exists()) room = snap.data() as Room;
    }
    if (!room) {
      message.error('Grup tidak ditemukan.');
      return false;
    }

    const targetParticipant = room.participants.find(p => p.uid === participantUid);
    const participantName = targetParticipant?.fullName || 'Peserta';

    const updatedParticipants = room.participants.filter(p => p.uid !== participantUid);
    const updatedSubGroups = room.subGroups.map(sg => ({
      ...sg,
      members: sg.members.filter(m => m.uid !== participantUid),
    }));

    const updatedRoom: Room = {
      ...room,
      participants: updatedParticipants,
      subGroups: updatedSubGroups,
      updatedAt: new Date().toISOString(),
    };

    // Optimistic update
    setRooms((prev) => prev.map(r => r.id === roomId ? updatedRoom : r));

    // Update in Firestore
    if (db && db.app) {
      setDoc(doc(db, 'rooms', roomId), updatedRoom).catch(console.warn);

      // Clean up any swap codes created by this participant in this room
      const q = query(
        collection(db, 'swap_codes'),
        where('roomId', '==', roomId),
        where('creatorUid', '==', participantUid)
      );
      getDocs(q).then((snap) => {
        snap.forEach((d) => deleteDoc(doc(db, 'swap_codes', d.id)).catch(console.warn));
      }).catch(console.warn);
    }

    message.success(`${participantName} berhasil dikeluarkan dari grup.`);
    return true;
  };

  // 6. KICK ALL PARTICIPANTS (Admin bulk action)
  const kickAllParticipants = async (roomId: string): Promise<boolean> => {
    let room = rooms.find(r => r.id === roomId);
    if (!room && db && db.app) {
      const snap = await getDoc(doc(db, 'rooms', roomId)).catch(() => null);
      if (snap && snap.exists()) room = snap.data() as Room;
    }
    if (!room) {
      message.error('Grup tidak ditemukan.');
      return false;
    }

    const clearedSubGroups = room.subGroups.map(sg => ({ ...sg, members: [] }));
    const updatedRoom: Room = {
      ...room,
      participants: [],
      subGroups: clearedSubGroups,
      updatedAt: new Date().toISOString(),
    };

    setRooms((prev) => prev.map(r => r.id === roomId ? updatedRoom : r));

    if (db && db.app) {
      setDoc(doc(db, 'rooms', roomId), updatedRoom).catch(console.warn);

      const q = query(collection(db, 'swap_codes'), where('roomId', '==', roomId));
      getDocs(q).then((snap) => {
        snap.forEach((d) => deleteDoc(doc(db, 'swap_codes', d.id)).catch(console.warn));
      }).catch(console.warn);
    }

    message.success('Semua peserta berhasil dikeluarkan dari grup.');
    return true;
  };

  // 7. RANDOMIZE SUB-GROUPS (Fresh Firestore fetch + Atomic Transaction)
  const randomizeSubGroups = async (roomId: string, totalSubGroups?: number): Promise<boolean> => {
    setIsShuffling(true);
    try {
      let room = rooms.find(r => r.id === roomId);
      if (db && db.app) {
        const snap = await getDoc(doc(db, 'rooms', roomId)).catch(() => null);
        if (snap && snap.exists()) {
          room = snap.data() as Room;
        }
      }

      if (!room) {
        message.error('Grup tidak ditemukan.');
        return false;
      }

      if (!room.participants || room.participants.length === 0) {
        message.warning('Belum ada peserta yang bergabung di grup ini.');
        return false;
      }

      const nGroups = totalSubGroups || room.totalSubGroups || 6;
      const shuffled = [...room.participants];

      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      const newSubGroups: SubGroup[] = [];
      for (let g = 1; g <= nGroups; g++) {
        newSubGroups.push({
          id: `subgroup-${g}`,
          groupNumber: g,
          name: `Kelompok ${g}`,
          members: [],
        });
      }

      const updatedParticipants: Participant[] = [];

      shuffled.forEach((participant, index) => {
        const targetGroupIdx = index % nGroups;
        const targetSubGroup = newSubGroups[targetGroupIdx];
        const assigned: Participant = {
          ...participant,
          subGroupId: targetSubGroup.id,
          subGroupNumber: targetSubGroup.groupNumber,
        };
        targetSubGroup.members.push(assigned);
        updatedParticipants.push(assigned);
      });

      const updatedRoom: Room = {
        ...room,
        totalSubGroups: nGroups,
        subGroups: newSubGroups,
        participants: updatedParticipants,
        updatedAt: new Date().toISOString(),
      };

      // Optimistic update
      setRooms((prev) => prev.map(r => r.id === roomId ? updatedRoom : r));

      if (db && db.app) {
        await setDoc(doc(db, 'rooms', roomId), updatedRoom);
      }

      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.5 },
      });

      message.success(`Berhasil mengacak ${shuffled.length} peserta ke dalam ${nGroups} kelompok!`);
      return true;
    } catch (err: any) {
      console.error('Randomize error:', err);
      message.error('Gagal mengacak kelompok.');
      return false;
    } finally {
      setIsShuffling(false);
    }
  };

  // 8. TOGGLE SWAP ALLOWED
  const toggleRoomSwapAllowed = async (roomId: string, allowed: boolean) => {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;

    const updatedRoom = { ...room, isSwapAllowed: allowed, updatedAt: new Date().toISOString() };
    setRooms((prev) => prev.map(r => r.id === roomId ? updatedRoom : r));

    if (db && db.app) {
      setDoc(doc(db, 'rooms', roomId), updatedRoom).catch(console.warn);
    }

    message.info(
      allowed
        ? 'Fitur pertukaran kelompok DIBUKA untuk grup ini.'
        : 'Fitur pertukaran kelompok DIKUNCI.'
    );
  };

  // 9. GENERATE SWAP CODE
  const generateSwapCode = async (
    roomId: string,
    user: UserProfile
  ): Promise<{ success: boolean; code?: string; error?: string }> => {
    let room = rooms.find(r => r.id === roomId);
    if (!room && db && db.app) {
      const snap = await getDoc(doc(db, 'rooms', roomId)).catch(() => null);
      if (snap && snap.exists()) room = snap.data() as Room;
    }
    if (!room) return { success: false, error: 'Grup tidak ditemukan.' };
    if (!room.isSwapAllowed) return { success: false, error: 'Fitur pertukaran sedang dikunci.' };

    const mySubGroup = room.subGroups.find(sg => sg.members.some(m => m.uid === user.uid));
    if (!mySubGroup) {
      return { success: false, error: 'Anda belum terdaftar dalam kelompok manapun di grup ini.' };
    }

    const now = Date.now();
    const existingCode = swapCodes.find(
      c => c.roomId === roomId && c.creatorUid === user.uid && c.status === 'ACTIVE' && new Date(c.expiresAt).getTime() > now
    );

    if (existingCode) {
      return { success: true, code: existingCode.code };
    }

    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let codeStr = 'TK-';
    for (let i = 0; i < 4; i++) {
      codeStr += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    const newSwapCode: SwapCode = {
      id: `swap-${Date.now()}-${user.uid}`,
      code: codeStr,
      roomId,
      creatorUid: user.uid,
      creatorName: user.fullName,
      creatorIdentifier: user.identifier || '',
      creatorSubGroupId: mySubGroup.id,
      creatorSubGroupNumber: mySubGroup.groupNumber,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      expiresAt,
    };

    setSwapCodes((prev) => [newSwapCode, ...prev]);

    if (db && db.app) {
      setDoc(doc(db, 'swap_codes', newSwapCode.id), newSwapCode).catch(console.warn);
    }

    message.success(`Kode pertukaran aktif: ${codeStr}`);
    return { success: true, code: codeStr };
  };

  // 10. CANCEL SWAP CODE
  const cancelSwapCode = async (codeId: string): Promise<boolean> => {
    setSwapCodes((prev) => prev.map(c => c.id === codeId ? { ...c, status: 'CANCELLED' } : c));

    if (db && db.app) {
      setDoc(doc(db, 'swap_codes', codeId), { status: 'CANCELLED' }, { merge: true }).catch(console.warn);
    }
    message.info('Kode pertukaran dibatalkan.');
    return true;
  };

  // 11. EXECUTE SWAP WITH CODE
  const executeSwapWithCode = async (
    roomId: string,
    codeStr: string,
    user: UserProfile
  ): Promise<{ success: boolean; error?: string; message?: string }> => {
    let room = rooms.find(r => r.id === roomId);
    if (!room && db && db.app) {
      const snap = await getDoc(doc(db, 'rooms', roomId)).catch(() => null);
      if (snap && snap.exists()) room = snap.data() as Room;
    }
    if (!room) return { success: false, error: 'Grup tidak ditemukan.' };
    if (!room.isSwapAllowed) return { success: false, error: 'Fitur pertukaran kelompok sedang dikunci.' };

    const cleanCode = codeStr.trim().toUpperCase();
    const mySubGroup = room.subGroups.find(sg => sg.members.some(m => m.uid === user.uid));
    if (!mySubGroup) {
      return { success: false, error: 'Anda belum terdaftar dalam kelompok manapun.' };
    }

    let targetCode = swapCodes.find(
      c => c.roomId === roomId && c.code.toUpperCase() === cleanCode && c.status === 'ACTIVE'
    );

    // Query Firestore directly for swap code if not in cache
    if (!targetCode && db && db.app) {
      const q = query(
        collection(db, 'swap_codes'),
        where('roomId', '==', roomId),
        where('code', '==', cleanCode),
        where('status', '==', 'ACTIVE')
      );
      const snap = await getDocs(q).catch(() => null);
      if (snap && !snap.empty) {
        targetCode = snap.docs[0].data() as SwapCode;
      }
    }

    if (!targetCode) return { success: false, error: 'Kode tidak valid atau sudah digunakan.' };
    if (new Date(targetCode.expiresAt).getTime() < Date.now()) return { success: false, error: 'Kode telah kedaluwarsa.' };
    if (targetCode.creatorUid === user.uid) return { success: false, error: 'Ini kode milik Anda sendiri.' };
    if (targetCode.creatorSubGroupId === mySubGroup.id) return { success: false, error: 'Anda sudah satu kelompok dengan pembuat kode.' };

    const groupA = room.subGroups.find(sg => sg.id === targetCode.creatorSubGroupId);
    const groupB = room.subGroups.find(sg => sg.id === mySubGroup.id);
    if (!groupA || !groupB) return { success: false, error: 'Data kelompok tidak ditemukan.' };

    const idxA = groupA.members.findIndex(m => m.uid === targetCode.creatorUid);
    const idxB = groupB.members.findIndex(m => m.uid === user.uid);
    if (idxA === -1 || idxB === -1) return { success: false, error: 'Peserta tidak ditemukan di kelompok asal.' };

    const participantA = groupA.members[idxA];
    const participantB = groupB.members[idxB];

    const updatedGroupA_Members = [...groupA.members];
    const updatedGroupB_Members = [...groupB.members];

    updatedGroupA_Members[idxA] = {
      ...participantB,
      subGroupId: groupA.id,
      subGroupNumber: groupA.groupNumber,
    };

    updatedGroupB_Members[idxB] = {
      ...participantA,
      subGroupId: groupB.id,
      subGroupNumber: groupB.groupNumber,
    };

    const updatedSubGroups = room.subGroups.map(sg => {
      if (sg.id === groupA.id) return { ...sg, members: updatedGroupA_Members };
      if (sg.id === groupB.id) return { ...sg, members: updatedGroupB_Members };
      return sg;
    });

    const updatedRoom: Room = {
      ...room,
      subGroups: updatedSubGroups,
      updatedAt: new Date().toISOString(),
    };

    const newLog: SwapLog = {
      id: `log-${Date.now()}`,
      roomId,
      code: targetCode.code,
      participantA: {
        uid: participantA.uid,
        name: participantA.fullName,
        identifier: participantA.identifier,
        fromGroupNumber: groupA.groupNumber,
        toGroupNumber: groupB.groupNumber,
      },
      participantB: {
        uid: participantB.uid,
        name: participantB.fullName,
        identifier: participantB.identifier,
        fromGroupNumber: groupB.groupNumber,
        toGroupNumber: groupA.groupNumber,
      },
      timestamp: new Date().toISOString(),
    };

    // Optimistic update
    setRooms((prev) => prev.map(r => r.id === roomId ? updatedRoom : r));
    setSwapCodes((prev) => prev.map(c => c.id === targetCode.id ? { ...c, status: 'USED' } : c));
    setSwapLogs((prev) => [newLog, ...prev]);

    if (db && db.app) {
      runTransaction(db, async (transaction) => {
        const roomRef = doc(db, 'rooms', roomId);
        const swapCodeRef = doc(db, 'swap_codes', targetCode.id);
        const logRef = doc(db, 'swap_logs', newLog.id);

        transaction.set(roomRef, updatedRoom);
        transaction.update(swapCodeRef, {
          status: 'USED',
          usedByUid: user.uid,
          usedByName: user.fullName,
          usedByIdentifier: user.identifier || '',
          usedAt: new Date().toISOString(),
        });
        transaction.set(logRef, newLog);
      }).catch(console.warn);
    }

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });

    return {
      success: true,
      message: `Berhasil bertukar ke ${groupA.name} bersama ${participantA.fullName}.`,
    };
  };

  // 12. UPDATE TOPIC
  const updateSubGroupTopic = async (roomId: string, subGroupId: string, topic: string) => {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;

    const updatedSubGroups = room.subGroups.map(sg => (sg.id === subGroupId ? { ...sg, topic } : sg));
    const updatedRoom = { ...room, subGroups: updatedSubGroups, updatedAt: new Date().toISOString() };

    setRooms((prev) => prev.map(r => r.id === roomId ? updatedRoom : r));

    if (db && db.app) {
      setDoc(doc(db, 'rooms', roomId), updatedRoom).catch(console.warn);
    }
    message.success('Topik kelompok berhasil diperbarui.');
  };

  // 13. MANUAL MOVE PARTICIPANT
  const manualMoveParticipant = async (
    roomId: string,
    participantUid: string,
    fromSubGroupId: string,
    toSubGroupId: string
  ): Promise<boolean> => {
    if (fromSubGroupId === toSubGroupId) return true;
    const room = rooms.find(r => r.id === roomId);
    if (!room) return false;

    const fromGroup = room.subGroups.find(g => g.id === fromSubGroupId);
    const toGroup = room.subGroups.find(g => g.id === toSubGroupId);
    if (!fromGroup || !toGroup) return false;

    const participant = fromGroup.members.find(m => m.uid === participantUid);
    if (!participant) return false;

    const updatedFromMembers = fromGroup.members.filter(m => m.uid !== participantUid);
    const updatedToMembers = [
      ...toGroup.members,
      {
        ...participant,
        subGroupId: toGroup.id,
        subGroupNumber: toGroup.groupNumber,
      },
    ];

    const updatedSubGroups = room.subGroups.map(sg => {
      if (sg.id === fromSubGroupId) return { ...sg, members: updatedFromMembers };
      if (sg.id === toSubGroupId) return { ...sg, members: updatedToMembers };
      return sg;
    });

    const updatedRoom = { ...room, subGroups: updatedSubGroups, updatedAt: new Date().toISOString() };
    setRooms((prev) => prev.map(r => r.id === roomId ? updatedRoom : r));

    if (db && db.app) {
      setDoc(doc(db, 'rooms', roomId), updatedRoom).catch(console.warn);
    }

    message.success(`${participant.fullName} dipindahkan ke ${toGroup.name}`);
    return true;
  };

  // 14. ADD PARTICIPANT TO SUBGROUP (Supports unassigned participant & self-join)
  const addParticipantToSubGroup = async (
    roomId: string,
    subGroupId: string,
    participantUid: string,
    userProfile?: UserProfile
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      let room = rooms.find(r => r.id === roomId);
      if (db && db.app) {
        const snap = await getDoc(doc(db, 'rooms', roomId)).catch(() => null);
        if (snap && snap.exists()) {
          room = snap.data() as Room;
        }
      }

      if (!room) {
        message.error('Grup tidak ditemukan.');
        return { success: false, error: 'Grup tidak ditemukan.' };
      }

      const targetGroup = room.subGroups.find(g => g.id === subGroupId);
      if (!targetGroup) {
        message.error('Kelompok tujuan tidak ditemukan.');
        return { success: false, error: 'Kelompok tujuan tidak ditemukan.' };
      }

      // 1. Find participant in room.participants by uid, email, or identifier
      let participant = (room.participants || []).find(
        p => p.uid === participantUid ||
             (userProfile && p.email && userProfile.email && p.email.toLowerCase() === userProfile.email.toLowerCase()) ||
             (userProfile && p.identifier && userProfile.identifier && p.identifier === userProfile.identifier)
      );

      // 2. If participant is not yet in room.participants, create them from userProfile
      if (!participant) {
        if (userProfile) {
          participant = {
            uid: userProfile.uid || participantUid,
            identifier: userProfile.identifier || '',
            fullName: userProfile.fullName,
            email: userProfile.email,
            avatarUrl: userProfile.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userProfile.uid || participantUid}`,
            subGroupId: null,
            subGroupNumber: null,
            joinedAt: new Date().toISOString(),
          };
        } else {
          message.error('Data peserta tidak ditemukan.');
          return { success: false, error: 'Data peserta tidak ditemukan.' };
        }
      }

      // Safety check: Ensure participant is NOT already in ANY subgroup
      const isAlreadyAssigned = room.subGroups.some(sg =>
        sg.members.some(m => 
          m.uid === participant.uid || 
          (m.email && participant.email && m.email.toLowerCase() === participant.email.toLowerCase()) ||
          (m.identifier && participant.identifier && m.identifier === participant.identifier)
        )
      );

      if (isAlreadyAssigned) {
        message.error('Peserta ini sudah tergabung dalam kelompok lain.');
        return { success: false, error: 'Peserta ini sudah tergabung dalam kelompok lain.' };
      }

      const updatedParticipant: Participant = {
        ...participant,
        uid: participantUid,
        subGroupId: targetGroup.id,
        subGroupNumber: targetGroup.groupNumber,
      };

      const updatedSubGroups = room.subGroups.map(sg => {
        if (sg.id === subGroupId) {
          return {
            ...sg,
            members: [...sg.members, updatedParticipant],
          };
        }
        return sg;
      });

      // Update or add participant in room.participants
      const participantsList = room.participants || [];
      const existingIndex = participantsList.findIndex(
        p => p.uid === participantUid || 
             (p.email && updatedParticipant.email && p.email.toLowerCase() === updatedParticipant.email.toLowerCase())
      );

      let updatedParticipants: Participant[];
      if (existingIndex >= 0) {
        updatedParticipants = [...participantsList];
        updatedParticipants[existingIndex] = updatedParticipant;
      } else {
        updatedParticipants = [...participantsList, updatedParticipant];
      }

      const updatedRoom: Room = {
        ...room,
        subGroups: updatedSubGroups,
        participants: updatedParticipants,
        updatedAt: new Date().toISOString(),
      };

      setRooms(prev => prev.map(r => r.id === roomId ? updatedRoom : r));

      if (db && db.app) {
        await setDoc(doc(db, 'rooms', roomId), updatedRoom).catch(console.warn);
      }

      message.success(`${participant.fullName} berhasil bergabung ke ${targetGroup.name}!`);
      return { success: true };
    } catch (err: any) {
      console.error('Error adding participant to subgroup:', err);
      const errMsg = err.message || 'Gagal bergabung ke kelompok.';
      message.error(errMsg);
      return { success: false, error: errMsg };
    }
  };

  // 15. EXPORT TO EXCEL
  const exportRoomToExcel = (room: Room) => {
    try {
      const rows: any[] = [];
      let no = 1;

      room.subGroups.forEach(grp => {
        grp.members.forEach(member => {
          rows.push({
            'No': no++,
            'Grup Utama': room.name,
            'Kode Grup': room.code,
            'Kelompok': grp.name,
            'Nomor Kelompok': grp.groupNumber,
            'Topik': grp.topic || '-',
            'ID / NIM': member.identifier,
            'Nama Lengkap': member.fullName,
            'Email': member.email,
          });
        });
      });

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Daftar Kelompok');

      const maxProps = [{ wch: 6 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 25 }, { wch: 18 }, { wch: 30 }, { wch: 35 }];
      worksheet['!cols'] = maxProps;

      const dateStr = new Date().toISOString().split('T')[0];
      XLSX.writeFile(workbook, `Kelompokin_${room.name.replace(/\s+/g, '_')}_${dateStr}.xlsx`);
      message.success('File Excel berhasil diunduh!');
    } catch (err: any) {
      console.error('Export Excel error:', err);
      message.error('Gagal mengekspor file Excel.');
    }
  };

  // 15. RESET ROOM GROUPS
  const resetRoomGroups = async (roomId: string) => {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;

    const clearedSubGroups = room.subGroups.map(sg => ({ ...sg, members: [] }));
    const updatedParticipants = room.participants.map(p => ({
      ...p,
      subGroupId: null,
      subGroupNumber: null,
    }));

    const updatedRoom = {
      ...room,
      subGroups: clearedSubGroups,
      participants: updatedParticipants,
      updatedAt: new Date().toISOString(),
    };

    setRooms((prev) => prev.map(r => r.id === roomId ? updatedRoom : r));

    if (db && db.app) {
      setDoc(doc(db, 'rooms', roomId), updatedRoom).catch(console.warn);
    }
    message.info('Susunan kelompok dalam grup ini telah direset.');
  };

  return (
    <GroupContext.Provider
      value={{
        rooms,
        activeRoom,
        swapCodes,
        swapLogs,
        isShuffling,
        isLoading,
        selectRoom,
        createRoom,
        deleteRoom,
        joinRoomByCode,
        leaveRoom,
        removeParticipant,
        kickAllParticipants,
        randomizeSubGroups,
        toggleRoomSwapAllowed,
        generateSwapCode,
        cancelSwapCode,
        executeSwapWithCode,
        updateSubGroupTopic,
        manualMoveParticipant,
        addParticipantToSubGroup,
        exportRoomToExcel,
        resetRoomGroups,
      }}
    >
      {children}
    </GroupContext.Provider>
  );
};

export const useGroup = () => {
  const context = useContext(GroupContext);
  if (!context) {
    throw new Error('useGroup must be used within a GroupProvider');
  }
  return context;
};
