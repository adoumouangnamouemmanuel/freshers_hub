const { pool } = require("../services/db");
const supportAdminRepository = require("../repositories/supportAdminRepository");

// Dashboard Overview
async function getAdminDashboardStats(req, res) {
  try {
    const stats = await supportAdminRepository.getDashboardStats();

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
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

// Get Peer Coaches
async function getAdminCoaches(req, res) {
  try {
    const rows = await supportAdminRepository.getAdminCoaches();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
}

// Get Freshers
async function getAdminFreshers(req, res) {
  try {
    const rows = await supportAdminRepository.getAdminFreshers();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
}

// Assign Fresher to Coach
async function assignFresherToCoach(req, res) {
  const { fresherId, coachId, academicYearId } = req.body;
  if (!fresherId || !coachId) return res.status(400).json({ error: "Missing ids" });

  try {
    const assignment = await supportAdminRepository.assignFresherToCoach(
      academicYearId, fresherId, coachId, req.user.id
    );
    res.json({ success: true, assignment });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
}

// Bulk Assign Freshers (Round Robin)
async function bulkAssignFreshers(req, res) {
  const { academicYearId } = req.body;
  try {
    const assignedCount = await supportAdminRepository.bulkAssignFreshers(academicYearId, req.user.id);
    res.json({ success: true, assignedCount });
  } catch (err) {
    if (err.message === "No active coaches found") {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: "Server error" });
  }
}

// Promote Student to Coach
async function promoteToCoach(req, res) {
  const { studentId } = req.body;
  if (!studentId) return res.status(400).json({ error: "Missing studentId" });
  try {
    await supportAdminRepository.promoteToCoach(studentId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
}

// Get Announcements
async function getAnnouncements(req, res) {
  try {
    const rows = await supportAdminRepository.getAnnouncements();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
}

// Post Announcement
async function postAnnouncement(req, res) {
  const { targetAudience, title, content } = req.body;
  try {
    const announcement = await supportAdminRepository.postAnnouncement(req.user.id, targetAudience, title, content);
    res.json(announcement);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
}

// Update Announcement
async function updateAnnouncement(req, res) {
  const { id } = req.params;
  const { title, content } = req.body;
  try {
    const updated = await supportAdminRepository.updateAnnouncement(id, req.user.id, title, content);
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
}

// Delete Announcement
async function deleteAnnouncement(req, res) {
  const { id } = req.params;
  try {
    await supportAdminRepository.deleteAnnouncement(id, req.user.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
}

// Flag report
async function flagReport(req, res) {
  const { id } = req.params;
  const { needsFollowUp } = req.body;
  try {
    const report = await supportAdminRepository.flagReport(id, needsFollowUp);
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
}

// Get Reports
async function getAdminReports(req, res) {
  try {
    const rows = await supportAdminRepository.getAdminReports();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
}

// Log Follow Up
async function logComplianceFollowUp(req, res) {
  const { fresherId, academicYearId, notes } = req.body;
  try {
    const log = await supportAdminRepository.logComplianceFollowUp(fresherId, academicYearId, notes, req.user.id);
    res.json(log);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
}

// Get User Profile (for public view)
async function getAdminUserProfile(req, res) {
  const { id } = req.params;
  try {
    const userProfile = await supportAdminRepository.getUserProfile(id);
    
    if (!userProfile) return res.status(404).json({ error: "User not found" });
    
    if (userProfile.roles && userProfile.roles.includes('peer_coach')) {
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
    
    userProfile.recent_sessions = recentSessions.map(rs => {
      return {
        id: rs.id,
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
    console.error("GET ADMIN USER PROFILE ERROR:", err);
    res.status(500).json({ error: err.message, stack: err.stack });
  }
}

// Get Admin Sessions
async function getAdminSessions(req, res) {
  try {
    const rows = await supportAdminRepository.getAdminSessions();
    res.json(rows);
  } catch (err) {
    console.error("Error getting admin sessions:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// Get Admin Students
async function getAdminStudents(req, res) {
  try {
    const directory = await supportAdminRepository.getAdminStudents();
    res.json(directory);
  } catch (err) {
    console.error("Error getting admin directory:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// Book a session as an admin
async function adminBookSession(req, res) {
  const { unitId, academicYearId, studentId, providerId, withType, scheduledAt, location, isMandatory, description } = req.body;
  
  if (!unitId || !academicYearId || !studentId || !providerId || !scheduledAt) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const session = await supportAdminRepository.adminBookSession(
      unitId, academicYearId, studentId, providerId, withType, scheduledAt, location, isMandatory, description
    );
    res.status(201).json(session);
  } catch (err) {
    console.error("Error admin booking session:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

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
