import api from './api';

/**
 * Event invalidation trigger for gamification data across the application.
 */
export const notifyGamificationUpdated = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('app:refresh-gamification'));
  }
};

/**
 * Normalize badge object to support both latest contract and legacy aliases.
 */
export const normalizeBadge = (raw) => {
  if (!raw) return null;

  const badge_id = raw.badge_id ?? raw.id;
  const badge_name = raw.badge_name ?? raw.name ?? '';
  const description = raw.description ?? raw.requirement ?? '';
  const icon_url = raw.icon_url ?? raw.image_url ?? '';
  const category = raw.category ?? 'General';

  let is_unlocked = raw.is_unlocked;
  let is_claimed = raw.is_claimed;

  if (is_unlocked === undefined && raw.status) {
    is_unlocked = raw.status === 'UNLOCKED' || raw.status === 'CLAIMABLE' || raw.status === 'CLAIMED';
  }
  if (is_claimed === undefined && raw.status) {
    is_claimed = raw.status === 'CLAIMED';
  }

  is_unlocked = !!is_unlocked;
  is_claimed = !!is_claimed;

  const current_progress = raw.current_progress ?? raw.progress ?? 0;
  const required_target = raw.required_target ?? raw.target ?? 1;

  let progress_percentage = raw.progress_percentage;
  if (progress_percentage === undefined || progress_percentage === null) {
    progress_percentage = required_target > 0 ? Math.min(100, Math.round((current_progress / required_target) * 100)) : 0;
  }

  const earned_at = raw.earned_at ?? raw.claimed_at ?? null;

  return {
    ...raw,
    // Latest backend contract guaranteed fields
    badge_id,
    badge_name,
    description,
    icon_url,
    category,
    is_unlocked,
    is_claimed,
    current_progress,
    required_target,
    progress_percentage,
    earned_at,

    // Legacy fallback aliases during rollout
    id: badge_id,
    name: badge_name,
    image_url: icon_url,
    progress: current_progress,
    target: required_target,
    status: is_claimed ? 'CLAIMED' : is_unlocked ? 'CLAIMABLE' : 'LOCKED',
    requirement: description,
    claimed_at: earned_at,

    // Optional fields preserved if present
    xp_reward: raw.xp_reward ?? raw.xp_earned,
    xp_earned: raw.xp_earned ?? raw.xp_reward,
    rarity: raw.rarity || 'Common',
  };
};

class AchievementService {
  /**
   * Get all badges
   */
  async getAllBadges() {
    const response = await api.get('/achievements/all/');
    if (!response.data) {
      return [];
    }
    const badgesArray = Array.isArray(response.data)
      ? response.data
      : Array.isArray(response.data.badges)
      ? response.data.badges
      : [];

    return badgesArray.map(normalizeBadge);
  }

  /**
   * Claim a claimable badge
   */
  async claimBadge(id) {
    try {
      const response = await api.post(`/achievements/claim/${id}/`);
      notifyGamificationUpdated();
      return response.data;
    } catch (error) {
      const status = error.response?.status;
      const detail = error.response?.data?.detail || error.response?.data?.message || error.response?.data?.error || '';

      if (status === 400) {
        if (detail.includes('already been claimed')) {
          throw new Error('This badge has already been claimed.');
        } else if (detail.includes('criteria') || detail.includes('not yet fulfilled') || detail.includes('locked')) {
          throw new Error('Complete the badge requirements before claiming.');
        }
        throw new Error(detail || 'Complete the badge requirements before claiming.');
      } else if (status === 404) {
        throw new Error('Badge not found.');
      }

      throw new Error(detail || 'Failed to claim badge.');
    }
  }

  /**
   * Trigger server-side badge evaluation
   */
  async checkUnlock() {
    try {
      const response = await api.post('/achievements/check-unlock/');
      notifyGamificationUpdated();
      return response.data;
    } catch {
      console.warn('Achievement check-unlock failed (non-critical)');
      return null;
    }
  }

  /**
   * Get user authenticated badges
   */
  async getUserAuthBadges() {
    try {
      return await this.getAllBadges();
    } catch (error) {
      console.warn("Failed to load user badges from /achievements/all/", error);
      return [];
    }
  }

  /**
   * Get user achievement stats
   */
  async getUserStats() {
    const response = await api.get('/achievements/stats/');
    return response.data;
  }

  /**
   * Get all categories
   */
  async getCategories() {
    try {
      const response = await api.get('/achievements/categories/');
      return response.data;
    } catch (e) {
      return [
        { name: "Streak", claimed: 0, total: 0 },
        { name: "Volume", claimed: 0, total: 0 },
        { name: "Accuracy", claimed: 0, total: 0 },
        { name: "Speed", claimed: 0, total: 0 },
        { name: "Subject Mastery", claimed: 0, total: 0 },
        { name: "Time & Habit", claimed: 0, total: 0 },
        { name: "Exploration", claimed: 0, total: 0 },
        { name: "Leaderboard", claimed: 0, total: 0 },
        { name: "Growth", claimed: 0, total: 0 },
        { name: "Milestones", claimed: 0, total: 0 }
      ];
    }
  }
}

const achievementService = new AchievementService();
export default achievementService;

