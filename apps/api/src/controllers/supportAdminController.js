const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const { pool } = require("../services/db");
const supportAdminRepository = require("../repositories/supportAdminRepository");
const notificationService = require("../services/notificationService");

// Dashboard Overview
const getAdminDashboardStats = asyncHandler(async (req, res) => {
  try {
    const stats = await supportAdminRepository.getDashboardStats(req.user.id);

    const totalFreshers = parseInt(stats.total_freshers);
    const totalCoaches = parseInt(stats.total_coaches);
    
    // Auto-calculate optimal threshold (Math.ceil(total_freshers / total_coaches))
    // e.g. 15 freshers / 6 coaches = 2.5 -> max 3 per coach. If 0 coaches, threshold is 0.
    const threshold = totalCoaches > 0 ? Math.ceil(totalFreshers / totalCoaches) : 0;

    const formattedStats = {
      total_freshers: totalFreshers,
      assigned_freshers: parseInt(stats.assigned_freshers),
      active_coaches: totalCoaches,
      completed_mandatory_sessions: parseInt(stats.completed_mandatory_sessions),
      target_mandatory_sessions: parseInt(stats.target_mandatory_sessions),
      target_freshers_per_coach: threshold,
      upcoming_sessions_count: parseInt(stats.upcoming_sessions_count),
      overdue_sessions_count: parseInt(stats.overdue_sessions_count)
    };
    
    // Needs attention list (freshers with 0 completed sessions)
    const needsAttention = await supportAdminRepository.getFreshersNeedingAttention(10);

    res.json({
      stats: formattedStats,
      needsAttention,
    });
  } catch (err) {
    
    throw new AppError("Server error", 500);
  }
});

// Get Peer Coaches
const getAdminCoaches = asyncHandler(async (req, res) => {
  try {
    const rows = await supportAdminRepository.getAdminCoaches();
    res.json(rows);
  } catch (err) {
    throw new AppError("Server error", 500);
  }
});

// Get Freshers
const getAdminFreshers = asyncHandler(async (req, res) => {
  try {
    const rows = await supportAdminRepository.getAdminFreshers();
    res.json(rows);
  } catch (err) {
    throw new AppError("Server error", 500);
  }
});

// Assign Fresher to Coach
const assignFresherToCoach = asyncHandler(async (req, res) => {
  const { fresherId, coachId, academicYearId } = req.body;
  if (!fresherId || !coachId) throw new AppError("Missing ids", 400);

  try {
    const assignment = await supportAdminRepository.assignFresherToCoach(
      academicYearId, fresherId, coachId, req.user.id
    );
    res.json({ success: true, assignment });
  } catch (err) {
    throw new AppError("Server error", 500);
  }
});

// Bulk Assign Freshers (Round Robin)
const bulkAssignFreshers = asyncHandler(async (req, res) => {
  const { academicYearId } = req.body;
  try {
    const assignedCount = await supportAdminRepository.bulkAssignFreshers(academicYearId, req.user.id);
    res.json({ success: true, assignedCount });
  } catch (err) {
    if (err.message === "No active coaches found") {
      throw new AppError(err.message, 400);
    }
    throw new AppError("Server error", 500);
  }
});

// Promote Student to Coach
const promoteToCoach = asyncHandler(async (req, res) => {
  const { studentId } = req.body;
  if (!studentId) throw new AppError("Missing studentId", 400);
  try {
    await supportAdminRepository.promoteToCoach(studentId);
    res.json({ success: true });
  } catch (err) {
    throw new AppError("Server error", 500);
  }
});

// Get Announcements
const getAnnouncements = asyncHandler(async (req, res) => {
  try {
    const rows = await supportAdminRepository.getAnnouncements();
    res.json(rows);
  } catch (err) {
    throw new AppError("Server error", 500);
  }
});

// Post Announcement
const postAnnouncement = asyncHandler(async (req, res) => {
  const { targetAudience, title, content } = req.body;
  try {
    const announcement = await supportAdminRepository.postAnnouncement(req.user.id, targetAudience, title, content);
    res.json(announcement);
  } catch (err) {
    throw new AppError("Server error", 500);
  }
});

// Update Announcement
const updateAnnouncement = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, content } = req.body;
  try {
    const updated = await supportAdminRepository.updateAnnouncement(id, req.user.id, title, content);
    if (!updated) throw new AppError("Not found", 404);
    res.json(updated);
  } catch (err) {
    throw new AppError("Server error", 500);
  }
});

// Delete Announcement
const deleteAnnouncement = asyncHandler(async (req, res) => {
  const { id } = req.params;
  try {
    await supportAdminRepository.deleteAnnouncement(id, req.user.id);
    res.json({ success: true });
  } catch (err) {
    throw new AppError("Server error", 500);
  }
});

// Flag report
const flagReport = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { needsFollowUp } = req.body;
  try {
    const report = await supportAdminRepository.flagReport(id, needsFollowUp);
    res.json(report);
  } catch (err) {
    throw new AppError("Server error", 500);
  }
});

// Get Reports
const getAdminReports = asyncHandler(async (req, res) => {
  try {
    const rows = await supportAdminRepository.getAdminReports();
    res.json(rows);
  } catch (err) {
    throw new AppError("Server error", 500);
  }
});

// Log Follow Up
const logComplianceFollowUp = asyncHandler(async (req, res) => {
  const { fresherId, academicYearId, notes } = req.body;
  try {
    const log = await supportAdminRepository.logComplianceFollowUp(fresherId, academicYearId, notes, req.user.id);
    res.json(log);
  } catch (err) {
    throw new AppError("Server error", 500);
  }
});

// Get User Profile (for public view)
const getAdminUserProfile = asyncHandler(async (req, res) => {
  const { id } = req.params;
  try {
    const userProfile = await supportAdminRepository.getUserProfile(id);
    
    if (!userProfile) throw new AppError("User not found", 404);
    
    if (userProfile.roles && (userProfile.roles.includes('peer_coach') || userProfile.roles.includes('peer_counsellor'))) {
      const assignedFreshers = await supportAdminRepository.getAssignedFreshersForCoach(id);
      userProfile.assigned_freshers = assignedFreshers.map(f => ({
        id: f.id,
        name: f.name,
        sessionsCompleted: parseInt(f.sessions_completed || 0),
        totalAssigned: parseInt(f.total_assigned)
      }));
    } else {
      userProfile.assigned_freshers = [];
      const coachResult = await supportAdminRepository.getAssignedCoachForFresher(id);
      userProfile.assigned_coach = coachResult || null;
    }

    let sessionFilter = `WHERE (s.student_id = $1 OR s.provider_id = $1)`;
    const params = [id];

    if (req.user.roles.includes("peer_coach") && !req.user.roles.includes("coach_admin") && !req.user.roles.includes("admin")) {
      sessionFilter += ` AND (s.student_id = $2 OR s.provider_id = $2)`;
      params.push(req.user.id);
    } else if (req.user.roles.includes("coach_admin") || req.user.roles.includes("admin")) {
      sessionFilter += ` AND s.with_type = 'peer_coach'`;
    }

    // Fetch recent sessions
    const recentSessions = await supportAdminRepository.getRecentSessions(id, sessionFilter, params);

    // Fetch exact count of completed sessions with the viewer to be accurate for progress bars
    if (req.user.roles.includes("peer_coach") || req.user.roles.includes("counsellor") || req.user.roles.includes("advisor")) {
      const viewerCompletedCount = await pool.query(
        `SELECT COUNT(*) FROM sessions WHERE student_id = $1 AND provider_id = $2 AND status = 'completed'`,
        [id, req.user.id]
      );
      userProfile.completed_sessions_with_viewer = parseInt(viewerCompletedCount.rows[0].count);
    }
    
    userProfile.recent_sessions = recentSessions.map(rs => {
      return {
        id: rs.id,
        title: rs.title,
        type: (rs.type === 'peer_coach' && rs.with_name?.toLowerCase().includes('yvonne')) ? 'Coaching' : (rs.type === 'peer_coach' ? 'Peer Coaching' : (rs.type || 'Session')),
        date: new Date(rs.date).toLocaleDateString() + " • " + new Date(rs.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        status: rs.status,
        with: rs.with_name,
        location: rs.location || "TBD",
        provider_id: rs.provider_id,
        student_id: rs.student_id,
        has_report: !!rs.report_content,
        report: rs.report_content ? {
          topic: rs.report_content.topic || "N/A",
          actions: rs.report_content.action_items || rs.report_content.actions || "N/A",
          mood: rs.report_content.wellbeing_notes || rs.report_content.mood || "N/A"
        } : null
      };
    });

    res.json(userProfile);
  } catch (err) {
    
    throw new AppError(err.message, 500);
  }
});

// Get Admin Sessions
const getAdminSessions = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  
  try {
    const data = await supportAdminRepository.getAdminSessions(page, limit);
    res.json(data);
  } catch (err) {
    throw new AppError("Internal server error", 500);
  }
});

// Get Admin Students
const getAdminStudents = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;

  try {
    const data = await supportAdminRepository.getAdminStudents(page, limit);
    res.json(data);
  } catch (err) {
    throw new AppError("Internal server error", 500);
  }
});

// Book a session as an admin
const adminBookSession = asyncHandler(async (req, res) => {
  const { unitId, academicYearId, studentId, providerId, withType, scheduledAt, location, isMandatory, description, title } = req.body;
  
  if (!unitId || !academicYearId || !studentId || !providerId || !scheduledAt) {
    throw new AppError("Missing required fields", 400);
  }

  try {
    const session = await supportAdminRepository.adminBookSession(
      unitId, academicYearId, studentId, providerId, withType, scheduledAt, location, isMandatory, description, title, req.user?.id
    );

    // Send notification to student
    if (studentId !== req.user?.id) {
      const typeStr = withType === "counsellor" ? "Counselling" : withType === "advisor" ? "Advising" : "Coaching";
      await notificationService.sendNotification({
        fromUserId: req.user?.id,
        toUserId: studentId,
        category: "session",
        title: "New Session Booked",
        body: `A new ${typeStr} session "${session.title}" has been scheduled for ${new Date(scheduledAt).toLocaleString()}.`,
        relatedEntity: `session:${session.id}`
      }).catch(err => console.error("Failed to send session booking notification:", err));
    }
    
    // Also notify provider if they didn't book it
    if (providerId !== req.user?.id) {
      const typeStr = withType === "counsellor" ? "Counselling" : withType === "advisor" ? "Advising" : "Coaching";
      await notificationService.sendNotification({
        fromUserId: req.user?.id,
        toUserId: providerId,
        category: "session",
        title: "New Session Assigned",
        body: `You have been assigned a new ${typeStr} session "${session.title}" for ${new Date(scheduledAt).toLocaleString()}.`,
        relatedEntity: `session:${session.id}`
      }).catch(err => console.error("Failed to send session assignment notification:", err));
    }

    res.status(201).json(session);
  } catch (err) {
    console.error(err);
    throw new AppError("Internal server error", 500);
  }
});

module.exports = {
  getAdminDashboardStats,
  getAdminCoaches,
  getAdminFreshers,
  assignFresherToCoach,
  bulkAssignFreshers,
  promoteToCoach,
  getAnnouncements,
  postAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  flagReport,
  getAdminReports,
  logComplianceFollowUp,
  getAdminUserProfile,
  getAdminSessions,
  getAdminStudents,
  adminBookSession,
};
