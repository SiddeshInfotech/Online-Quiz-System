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
      earned_date: badge.awarded_at
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
    const response = await api.post(`/achievements/badges/${id}/claim`);
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
        { name: "Streak", earned: 0, total: 0 },
        { name: "Volume", earned: 0, total: 0 },
        { name: "Accuracy", earned: 0, total: 0 },
        { name: "Speed", earned: 0, total: 0 },
        { name: "Subject Mastery", earned: 0, total: 0 },
        { name: "Time & Habit", earned: 0, total: 0 },
        { name: "Exploration", earned: 0, total: 0 },
        { name: "Leaderboard", earned: 0, total: 0 },
        { name: "Growth", earned: 0, total: 0 },
        { name: "Milestones", earned: 0, total: 0 }
      ];
    }
  }
}

const achievementService = new AchievementService();
export default achievementService;
