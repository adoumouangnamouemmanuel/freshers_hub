const searchRepository = require("../repositories/searchRepository");
const { z } = require("zod");

const searchSchema = z.object({
  q: z.string().min(1).max(100),
  limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 5)
});

const searchController = {
  async globalSearch(req, res, next) {
    try {
      const { q, limit } = searchSchema.parse(req.query);
      const userId = req.user?.id;
      const userRoles = req.user?.roles || [];

      // Determine if user can search other users (and consequently, not search campus entities)
      const staffRoles = ['coach_admin', 'advisor', 'counsellor', 'staff', 'faculty', 'oipcc_admin'];
      const isStaffOrAdmin = userRoles.some(r => staffRoles.includes(r));

      // Execute all searches concurrently
      const [posts, groups, faqs, locations, users] = await Promise.all([
        searchRepository.searchPosts(q, userId, limit),
        isStaffOrAdmin ? Promise.resolve([]) : searchRepository.searchGroups(q, userId, limit),
        isStaffOrAdmin ? Promise.resolve([]) : searchRepository.searchFaqs(q, limit),
        isStaffOrAdmin ? Promise.resolve([]) : searchRepository.searchLocations(q, limit),
        isStaffOrAdmin ? searchRepository.searchUsers(q, limit) : Promise.resolve([])
      ]);

      res.json({
        results: {
          users,
          posts,
          groups,
          faqs,
          locations
        }
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid search parameters", details: err.errors });
      }
      next(err);
    }
  }
};

module.exports = searchController;
