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

      // Determine if user can search other users
      const staffRoles = ['coach_admin', 'advisor', 'counsellor', 'staff', 'faculty', 'oipcc_admin'];
      const canSearchUsers = userRoles.some(r => staffRoles.includes(r));

      // Execute all searches concurrently
      const [posts, groups, faqs, locations, users] = await Promise.all([
        searchRepository.searchPosts(q, userId, limit),
        searchRepository.searchGroups(q, userId, limit),
        searchRepository.searchFaqs(q, limit),
        searchRepository.searchLocations(q, limit),
        canSearchUsers ? searchRepository.searchUsers(q, limit) : Promise.resolve([])
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
