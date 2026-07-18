import api from './api';

class AchievementService {
  /**
   * Get all badges
   */
  async getAllBadges() {
    const response = await api.get('/achievements/all/');
    if (!response.data || !response.data.badges) {
      return [];
    }
    return response.data.badges.map(badge => ({
      id: badge.badge_id,
      name: badge.name,
      description: badge.description,
      image_url: badge.image_url,
      category: badge.category,
      rarity: badge.rarity,
      status: badge.status,
      progress: badge.progress,
      target: badge.target,
      xp_reward: badge.xp_reward,
      requirement: badge.requirement,
      claimed_at: badge.claimed_at
    }));
  }

  /**
   * Get badge by ID
   */
  async getBadgeById(id) {
    const response = await api.get(`/achievements/badges/${id}`);
    return response.data;
  }

  /**
   * Claim a claimable badge
   */
  async claimBadge(id) {
    const response = await api.post(`/achievements/claim/${id}/`);
    return response.data;
  }

  /**
   * Get user authenticated badges
   */
  async getUserAuthBadges() {
    const response = await api.get('/auth/badges/');
    return response.data;
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
    // If the backend has an endpoint for categories:
    try {
      const response = await api.get('/achievements/categories/');
      return response.data;
    } catch (e) {
      // Fallback categories if endpoint doesn't exist
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
