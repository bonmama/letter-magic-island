import type { PlayerData } from './types';

// 单个玩家档案
export interface PlayerProfile {
  id: string;
  name: string;
  emoji: string;
  data: PlayerData;
  createdAt: number;
}

const PROFILES_KEY = 'letter_magic_island_profiles';
const ACTIVE_KEY = 'letter_magic_island_active_profile';
// 旧版单人数据（用于首次迁移）
const LEGACY_KEY = 'letter_magic_island_player_data';

const AVATAR_EMOJIS = ['🐰', '🐱', '🐼', '🦄', '🐲', '⭐', '🐯', '🦊', '🐸', '🐵'];

export const DEFAULT_PLAYER_DATA: PlayerData = {
  totalStars: 0,
  highestScore: 0,
  unlockedCharacters: ['bunny'],
  selectedCharacter: 'bunny',
  totalCorrect: 0,
};

// 读取全部玩家档案
export function loadProfiles(): PlayerProfile[] {
  try {
    const saved = localStorage.getItem(PROFILES_KEY);
    if (saved) {
      const profiles = JSON.parse(saved) as PlayerProfile[];
      if (Array.isArray(profiles) && profiles.length > 0) return profiles;
    }
  } catch (e) {
    console.warn('Failed to load profiles:', e);
  }
  // 首次：尝试迁移旧版单人数据
  try {
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const data = { ...DEFAULT_PLAYER_DATA, ...JSON.parse(legacy) };
      const profile: PlayerProfile = {
        id: 'p1',
        name: '玩家1',
        emoji: '🐰',
        data,
        createdAt: Date.now(),
      };
      saveProfiles([profile]);
      localStorage.setItem(ACTIVE_KEY, 'p1');
      localStorage.removeItem(LEGACY_KEY);
      return [profile];
    }
  } catch (e) {
    console.warn('Failed to migrate legacy data:', e);
  }
  return [];
}

export function saveProfiles(profiles: PlayerProfile[]): void {
  try {
    localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
  } catch (e) {
    console.warn('Failed to save profiles:', e);
  }
}

export function getActiveId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_KEY);
  } catch {
    return null;
  }
}

export function setActiveId(id: string): void {
  try {
    localStorage.setItem(ACTIVE_KEY, id);
  } catch (e) {
    console.warn('Failed to set active profile:', e);
  }
}

// 创建新玩家
export function createProfile(name: string, emoji: string): PlayerProfile {
  const profiles = loadProfiles();
  const id = 'p' + (Date.now().toString(36)) + Math.floor(Math.random() * 1000);
  const profile: PlayerProfile = {
    id,
    name: name.trim() || `玩家${profiles.length + 1}`,
    emoji,
    data: { ...DEFAULT_PLAYER_DATA, unlockedCharacters: ['bunny'], selectedCharacter: 'bunny' },
    createdAt: Date.now(),
  };
  profiles.push(profile);
  saveProfiles(profiles);
  setActiveId(id);
  return profile;
}

// 删除玩家
export function deleteProfile(id: string): PlayerProfile[] {
  let profiles = loadProfiles().filter(p => p.id !== id);
  if (getActiveId() === id) {
    setActiveId(profiles[0]?.id || '');
  }
  saveProfiles(profiles);
  return profiles;
}

// 获取当前玩家档案；若没有则返回 null
export function getActiveProfile(): PlayerProfile | null {
  const profiles = loadProfiles();
  if (profiles.length === 0) return null;
  const activeId = getActiveId();
  return profiles.find(p => p.id === activeId) || profiles[0];
}

// 更新当前玩家数据（以传入的 data 合并）
export function updateActiveProfileData(update: Partial<PlayerData>): PlayerProfile | null {
  const profiles = loadProfiles();
  const activeId = getActiveId();
  const idx = profiles.findIndex(p => p.id === (activeId || profiles[0]?.id));
  if (idx === -1) return null;
  profiles[idx].data = { ...profiles[idx].data, ...update };
  saveProfiles(profiles);
  return profiles[idx];
}

// 更新当前玩家名字/头像
export function updateActiveProfileMeta(meta: { name?: string; emoji?: string }): PlayerProfile | null {
  const profiles = loadProfiles();
  const activeId = getActiveId();
  const idx = profiles.findIndex(p => p.id === (activeId || profiles[0]?.id));
  if (idx === -1) return null;
  if (meta.name) profiles[idx].name = meta.name.trim();
  if (meta.emoji) profiles[idx].emoji = meta.emoji;
  saveProfiles(profiles);
  return profiles[idx];
}

export function getAvatarEmojis(): string[] {
  return AVATAR_EMOJIS;
}

// 改任意玩家的名字（不要求是当前玩家）
export function renameProfile(id: string, name: string): void {
  const profiles = loadProfiles();
  const profile = profiles.find(p => p.id === id);
  if (profile) {
    profile.name = name.trim().slice(0, 10) || profile.name;
    saveProfiles(profiles);
  }
}

// ============ 以下为兼容旧调用的封装（作用于当前玩家） ============

export function loadPlayerData(): PlayerData {
  return getActiveProfile()?.data || { ...DEFAULT_PLAYER_DATA };
}

export function savePlayerData(data: PlayerData): void {
  updateActiveProfileData(data);
}

// 增加星星数
export function addStars(count: number): PlayerData {
  const data = loadPlayerData();
  const updated = { ...data, totalStars: data.totalStars + count };
  updateActiveProfileData(updated);
  return updated;
}

// 更新最高分（返回新数据若破纪录，否则 null）
export function updateHighScore(score: number): PlayerData | null {
  const data = loadPlayerData();
  if (score > data.highestScore) {
    const updated = { ...data, highestScore: score };
    updateActiveProfileData(updated);
    return updated;
  }
  return null;
}

// 增加正确次数
export function addCorrectCount(count: number): PlayerData {
  const data = loadPlayerData();
  const updated = { ...data, totalCorrect: data.totalCorrect + count };
  updateActiveProfileData(updated);
  return updated;
}
