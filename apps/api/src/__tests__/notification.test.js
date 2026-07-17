const request = require("supertest");
const express = require("express");
const jwt = require("jsonwebtoken");
const { pool } = require("../services/db");
const notificationRoutes = require("../routes/notificationRoutes");
const errorHandler = require("../middleware/errorHandler");

const app = express();
app.use(express.json());
app.use("/api/notifications", notificationRoutes);
app.use(errorHandler);

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

const testUser = { sub: 'f0000000-0000-4000-8000-000000000000', email: 'test_notif@test.com' };
const testToken = jwt.sign(testUser, JWT_SECRET, { expiresIn: '1h' });

let unreadNotificationId;
let readNotificationId;

beforeAll(async () => {
  // Insert test user
  await pool.query(`
    INSERT INTO users (id, full_name, email) 
    VALUES ($1, 'Test Notif User', 'test_notif@test.com')
    ON CONFLICT (id) DO NOTHING
  `, [testUser.sub]);

  // Insert some test notifications
  const res1 = await pool.query(`
    INSERT INTO notifications (user_id, category, title, body, related_entity, read_at)
    VALUES ($1, 'system', 'Unread Notification', 'This is unread', null, null)
    RETURNING id
  `, [testUser.sub]);
  unreadNotificationId = res1.rows[0].id;

  const res2 = await pool.query(`
    INSERT INTO notifications (user_id, category, title, body, related_entity, read_at)
    VALUES ($1, 'system', 'Read Notification', 'This is read', null, NOW())
    RETURNING id
  `, [testUser.sub]);
  readNotificationId = res2.rows[0].id;
});

afterAll(async () => {
  // Cleanup
  await pool.query(`DELETE FROM notifications WHERE user_id = $1`, [testUser.sub]);
  await pool.query(`DELETE FROM user_roles WHERE user_id = $1 OR assigned_by = $1`, [testUser.sub]);
  await pool.query(`DELETE FROM users WHERE id = $1`, [testUser.sub]);
});

describe("Notification Routes API", () => {
  describe("GET /api/notifications/unread-count", () => {
    it("should return the correct unread count", async () => {
      const response = await request(app)
        .get("/api/notifications/unread-count")
        .set("Authorization", `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.unreadCount).toBeGreaterThanOrEqual(1); // At least the one we inserted
    });
  });

  describe("GET /api/notifications", () => {
    it("should fetch notifications with pagination", async () => {
      const response = await request(app)
        .get("/api/notifications")
        .set("Authorization", `Bearer ${testToken}`)
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
      expect(response.body.meta).toHaveProperty("total");
    });
  });

  describe("PATCH /api/notifications/:id/read", () => {
    it("should mark an unread notification as read", async () => {
      const response = await request(app)
        .patch(`/api/notifications/${unreadNotificationId}/read`)
        .set("Authorization", `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify it's read by checking unread count
      const countRes = await request(app)
        .get("/api/notifications/unread-count")
        .set("Authorization", `Bearer ${testToken}`);
      
      expect(countRes.body.unreadCount).toBe(0);
    });

    it("should return 404 for a non-existent or already read notification", async () => {
      const response = await request(app)
        .patch(`/api/notifications/${readNotificationId}/read`)
        .set("Authorization", `Bearer ${testToken}`);

      expect(response.status).toBe(404);
    });

    it("should return 400 for invalid UUID", async () => {
      const response = await request(app)
        .patch("/api/notifications/invalid-id/read")
        .set("Authorization", `Bearer ${testToken}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });
  });

  describe("PATCH /api/notifications/read-all", () => {
    it("should mark all unread notifications as read", async () => {
      // First, insert a new unread notification
      await pool.query(`
        INSERT INTO notifications (user_id, category, title, body)
        VALUES ($1, 'system', 'Another Unread', '...')
      `, [testUser.sub]);

      const response = await request(app)
        .patch("/api/notifications/read-all")
        .set("Authorization", `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.markedCount).toBe(1);

      // Verify all are read
      const countRes = await request(app)
        .get("/api/notifications/unread-count")
        .set("Authorization", `Bearer ${testToken}`);
      
      expect(countRes.body.unreadCount).toBe(0);
    });
  });
});
