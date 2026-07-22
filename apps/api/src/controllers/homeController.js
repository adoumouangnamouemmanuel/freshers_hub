const { pool } = require("../services/db");
const asyncHandler = require("../utils/asyncHandler");
const postService = require("../services/postService");

const getHomeDashboard = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const roles = req.user.roles || [];
  
  const currentYear = new Date().getFullYear();
  const classYear = req.user.studentProfile?.graduationYear || req.user.classYear;
  const isFresher = Number(classYear) === currentYear + 4;

  const isPeerCoach = roles.includes("peer_coach");
  const isPeerCounsellor = roles.includes("peer_counsellor");
  const isCounsellor = roles.includes("counsellor");
  const isClubLead = roles.includes("club_lead");
  const isAdmin = roles.includes("admin");
  const isCoachAdmin = roles.includes("coach_admin") || isAdmin;
  const isAdvisor = roles.includes("advisor");

  const isContinuingStudent = !isFresher && !roles.some(r => 
    ["staff", "faculty", "coach_admin", "admin", "peer_coach", "peer_counsellor", "club_lead", "advisor", "counsellor", "student_leader"].includes(r)
  );

  const client = await pool.connect();
  try {
    // 1. Posts & Unread Count (Common)
    const [postsResult, unreadResult] = await Promise.all([
      postService.getPosts(client, { userId, page: 1, limit: 100 }),
      client.query(`SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND read_at IS NULL`, [userId])
    ]);

    const dashboardData = {
      posts: postsResult.data || [],
      unreadCount: parseInt(unreadResult.rows[0].count, 10) || 0,
    };

    const promises = [];

    // 2. Groups (For students/fresher/club lead)
    if (isContinuingStudent || isClubLead || isFresher) {
      promises.push(
        client.query(`
          SELECT g.id, g.name, g.image_url, g.category, 
                 (g.created_by = $1 OR EXISTS (SELECT 1 FROM group_leaders gl WHERE gl.group_id = g.id AND gl.user_id = $1)) as "isLeader" 
          FROM groups g 
          JOIN group_members gm ON g.id = gm.group_id 
          WHERE gm.user_id = $1
        `, [userId]).then(res => { dashboardData.groups = res.rows; })
      );
    }

    // 3. Fresher Data (Assigned Coaches & Buddy)
    if (isFresher) {
      dashboardData.fresherData = {};
      promises.push(
        client.query(`
          SELECT ca.id, ca.peer_coach_id, u.full_name AS coach_name, u.avatar_url 
          FROM coach_assignments ca JOIN users u ON ca.peer_coach_id = u.id 
          WHERE ca.fresher_id = $1
        `, [userId]).then(res => { dashboardData.fresherData.assignedCoaches = res.rows; })
      );
      promises.push(
        client.query(`
          SELECT bp.id, bp.buddy_id, u.full_name AS buddy_name, u.avatar_url 
          FROM buddy_pairings bp JOIN users u ON bp.buddy_id = u.id 
          WHERE bp.fresher_id = $1
        `, [userId]).then(res => { dashboardData.fresherData.assignedBuddy = res.rows[0] || null; })
      );
    }

    // 4. Peer Coach Data (Assigned Freshers)
    if (isPeerCoach) {
      dashboardData.coachData = {};
      promises.push(
        client.query(`
          SELECT ca.id, ca.fresher_id, u.full_name AS fresher_name, u.avatar_url 
          FROM coach_assignments ca JOIN users u ON ca.fresher_id = u.id 
          WHERE ca.peer_coach_id = $1
        `, [userId]).then(res => { dashboardData.coachData.assignedFreshers = res.rows; })
      );
    }

    // 5. Unified Sessions Fetching
    if (isCoachAdmin || isPeerCounsellor || isPeerCoach || isAdvisor || isCounsellor || isFresher) {
      promises.push((async () => {
        await client.query("BEGIN");
        await client.query("SELECT set_config('app.current_user_id', $1, true)", [userId]);
        
        let sessionQuery = `
          SELECT s.*, u1.full_name AS student_name, u1.avatar_url AS student_avatar,
                 u2.full_name AS provider_name, u2.avatar_url AS provider_avatar
          FROM sessions s
          JOIN users u1 ON s.student_id = u1.id
          LEFT JOIN users u2 ON s.provider_id = u2.id
          WHERE (s.student_id = $1 OR s.provider_id = $1)
            AND s.status = 'scheduled'
        `;

        if (isCoachAdmin && !isPeerCoach && !isFresher) {
          sessionQuery = `
            SELECT s.*, u1.full_name AS student_name, u1.avatar_url AS student_avatar,
                   u2.full_name AS provider_name, u2.avatar_url AS provider_avatar
            FROM sessions s
            JOIN users u1 ON s.student_id = u1.id
            LEFT JOIN users u2 ON s.provider_id = u2.id
            WHERE s.provider_id = $1 AND s.status = 'scheduled'
          `;
        }

        const { rows: sessions } = await client.query(sessionQuery, [userId]);
        await client.query("COMMIT");

        const upcoming = [];
        const overdue = [];
        const now = new Date();

        sessions.forEach(s => {
          const sessionDate = new Date(s.scheduled_at || s.date || (s.session_date ? `${s.session_date}T${s.start_time || '00:00:00'}` : now));
          if (sessionDate > now) {
            upcoming.push(s);
          } else if (sessionDate <= now) {
            overdue.push(s);
          }
        });

        upcoming.sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
        overdue.sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime());

        dashboardData.sessions = { upcoming, overdue };
      })());
    }

    // 6. Admin Dashboard Stats (Coach Admin)
    if (isCoachAdmin) {
      const currentYear = new Date().getFullYear();
      const fresherYear = currentYear + 4;
      promises.push(
        client.query(`
          SELECT 
            (SELECT COUNT(*) FROM users u JOIN user_roles ur ON u.id = ur.user_id JOIN roles r ON ur.role_id = r.id WHERE r.name = 'student' AND u.class_year = ${fresherYear} AND u.id NOT IN (SELECT fresher_id FROM coach_assignments)) as unassigned_freshers,
            (SELECT COUNT(*) FROM users u JOIN user_roles ur ON u.id = ur.user_id JOIN roles r ON ur.role_id = r.id WHERE r.name = 'student' AND u.class_year = ${fresherYear}) as total_freshers,
            (SELECT COUNT(*) FROM sessions WHERE status = 'scheduled' AND scheduled_at > NOW() AND unit_id = (SELECT id FROM units WHERE name = 'coaching' LIMIT 1)) as upcoming_sessions_count,
            (SELECT COUNT(*) FROM sessions WHERE status = 'scheduled' AND scheduled_at <= NOW() AND unit_id = (SELECT id FROM units WHERE name = 'coaching' LIMIT 1)) as overdue_sessions_count,
            (SELECT COUNT(*) FROM sessions WHERE status = 'completed' AND is_mandatory = true AND unit_id = (SELECT id FROM units WHERE name = 'coaching' LIMIT 1)) as completed_mandatory_sessions,
            (SELECT COUNT(DISTINCT peer_coach_id) FROM coach_assignments) as active_coaches
        `).then(res => {
          const stats = res.rows[0];
          const needsAttention = [];
          if (stats.unassigned_freshers > 0) needsAttention.push({ id: 1, text: `${stats.unassigned_freshers} freshers need coaches assigned` });
          if (stats.overdue_sessions_count > 0) needsAttention.push({ id: 2, text: `${stats.overdue_sessions_count} sessions are overdue for completion` });
          dashboardData.adminStats = { stats, needsAttention };
        })
      );
    }

    // 7. Advising Stats
    if (isAdvisor) {
      promises.push((async () => {
        const statsRes = await client.query(`
          SELECT 
            COUNT(CASE WHEN status = 'scheduled' AND date_trunc('day', scheduled_at) = current_date THEN 1 END) as today_sessions,
            COUNT(CASE WHEN status = 'scheduled' AND date_trunc('week', scheduled_at) = date_trunc('week', current_date) THEN 1 END) as this_week_sessions,
            COUNT(CASE WHEN status = 'scheduled' AND scheduled_at <= NOW() THEN 1 END) as overdue_sessions
          FROM sessions 
          WHERE (provider_id = $1 OR created_by = $1) AND unit_id = (SELECT id FROM units WHERE name = 'advising' LIMIT 1)
        `, [userId]);
        
        const upcomingRes = await client.query(`
          SELECT s.*, u.full_name as student_name 
          FROM sessions s 
          JOIN users u ON s.student_id = u.id 
          WHERE s.provider_id = $1 AND s.status = 'scheduled' AND s.scheduled_at > NOW() AND s.unit_id = (SELECT id FROM units WHERE name = 'advising' LIMIT 1)
          ORDER BY s.scheduled_at ASC LIMIT 1
        `, [userId]);

        dashboardData.advisingStats = { 
          stats: statsRes.rows[0],
          upcomingSessions: upcomingRes.rows 
        };
      })());
    }

    // 8. Counselling Stats
    if (isCounsellor) {
      promises.push((async () => {
        const statsRes = await client.query(`
          SELECT 
            COUNT(CASE WHEN status = 'scheduled' AND date_trunc('day', scheduled_at) = current_date THEN 1 END) as today_sessions,
            COUNT(CASE WHEN status = 'scheduled' AND date_trunc('week', scheduled_at) = date_trunc('week', current_date) THEN 1 END) as this_week_sessions,
            COUNT(CASE WHEN status = 'scheduled' AND scheduled_at <= NOW() THEN 1 END) as overdue_sessions
          FROM sessions 
          WHERE (provider_id = $1 OR created_by = $1) AND unit_id = (SELECT id FROM units WHERE name = 'counselling' LIMIT 1)
        `, [userId]);

        const upcomingRes = await client.query(`
          SELECT s.*, u.full_name as student_name 
          FROM sessions s 
          JOIN users u ON s.student_id = u.id 
          WHERE s.provider_id = $1 AND s.status = 'scheduled' AND s.scheduled_at > NOW() AND s.unit_id = (SELECT id FROM units WHERE name = 'counselling' LIMIT 1)
          ORDER BY s.scheduled_at ASC LIMIT 1
        `, [userId]);

        dashboardData.counsellingStats = { 
          stats: statsRes.rows[0],
          upcomingSessions: upcomingRes.rows 
        };
      })());
    }

    await Promise.all(promises);

    res.json(dashboardData);
  } finally {
    client.release();
  }
});

module.exports = {
  getHomeDashboard,
};
