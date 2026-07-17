const request = require("supertest");
const express = require("express");
const jwt = require("jsonwebtoken");
const { pool } = require("../services/db");
const groupRoutes = require("../routes/groupRoutes");
const { errorHandler } = require("../middleware/errorMiddleware");

// Setup express app just for testing the group routes
const app = express();
app.use(express.json());
app.use("/api/groups", groupRoutes);
app.use(errorHandler);

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

const adminUser = { id: '11111111-1111-1111-1111-111111111111', roles: ['admin'] };
const studentUser = { id: '22222222-2222-2222-2222-222222222222', roles: ['student'] };
const anotherStudentUser = { id: '33333333-3333-3333-3333-333333333333', roles: ['student'] };

const adminToken = jwt.sign(adminUser, JWT_SECRET, { expiresIn: '1h' });
const studentToken = jwt.sign(studentUser, JWT_SECRET, { expiresIn: '1h' });
const anotherStudentToken = jwt.sign(anotherStudentUser, JWT_SECRET, { expiresIn: '1h' });

describe("Group Routes API", () => {
  let createdGroupId;

  beforeAll(async () => {
    // Setup users
    await pool.query(`
      INSERT INTO users (id, full_name, email, role) 
      VALUES 
        ($1, 'Admin Group Test', 'admin_grp@test.com', 'admin'),
        ($2, 'Student Group Test', 'student_grp@test.com', 'student'),
        ($3, 'Another Student Grp', 'another_grp@test.com', 'student')
      ON CONFLICT (id) DO NOTHING
    `, [adminUser.id, studentUser.id, anotherStudentUser.id]);
  });

  afterAll(async () => {
    if (createdGroupId) {
      await pool.query('DELETE FROM groups WHERE id = $1', [createdGroupId]);
    }
  });

  describe("POST /api/groups", () => {
    it("should allow a user to create a group", async () => {
      const response = await request(app)
        .post("/api/groups")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({
          name: "Test Group",
          type: "public",
          description: "This is a test group",
          category: "Technology"
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("id");
      createdGroupId = response.body.data.id;
    });

    it("should fail validation with invalid data", async () => {
      const response = await request(app)
        .post("/api/groups")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({
          name: "Te", // Too short
          type: "pu" // Too short
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe("GET /api/groups", () => {
    it("should get all groups with pagination", async () => {
      const response = await request(app)
        .get("/api/groups")
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.meta).toHaveProperty("total");
    });
  });

  describe("GET /api/groups/:id", () => {
    it("should get group details by id", async () => {
      const response = await request(app)
        .get(`/api/groups/${createdGroupId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(createdGroupId);
    });

    it("should return 404 for invalid id", async () => {
      const response = await request(app)
        .get("/api/groups/99999999-9999-9999-9999-999999999999");

      expect(response.status).toBe(404);
    });
  });

  describe("POST /api/groups/:id/join and DELETE /api/groups/:id/leave", () => {
    it("should allow a user to join a group", async () => {
      const response = await request(app)
        .post(`/api/groups/${createdGroupId}/join`)
        .set("Authorization", `Bearer ${anotherStudentToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Successfully joined group");
    });

    it("should allow a user to leave a group", async () => {
      const response = await request(app)
        .delete(`/api/groups/${createdGroupId}/leave`)
        .set("Authorization", `Bearer ${anotherStudentToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Successfully left group");
    });
  });

  describe("PUT /api/groups/:id", () => {
    it("should not allow a non-leader to update the group", async () => {
      // anotherStudent is not a leader
      const response = await request(app)
        .put(`/api/groups/${createdGroupId}`)
        .set("Authorization", `Bearer ${anotherStudentToken}`)
        .send({
          name: "Hacked Group Name"
        });

      expect(response.status).toBe(403);
    });

    it("should allow a leader to update the group", async () => {
      // studentUser is the creator, hence leader
      const response = await request(app)
        .put(`/api/groups/${createdGroupId}`)
        .set("Authorization", `Bearer ${studentToken}`)
        .send({
          name: "Updated Group Name",
          description: "Updated description"
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe("Updated Group Name");
    });
  });

  describe("DELETE /api/groups/:id", () => {
    it("should not allow a non-leader/non-admin to delete the group", async () => {
      const response = await request(app)
        .delete(`/api/groups/${createdGroupId}`)
        .set("Authorization", `Bearer ${anotherStudentToken}`);

      expect(response.status).toBe(403);
    });

    it("should allow an admin to delete the group", async () => {
      const response = await request(app)
        .delete(`/api/groups/${createdGroupId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(204);
      
      // Cleanup flag since we deleted it
      createdGroupId = null;
    });
  });
});
