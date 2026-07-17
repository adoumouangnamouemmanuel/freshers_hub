const request = require("supertest");
const express = require("express");
const { pool } = require("../services/db");
const faqRoutes = require("../routes/faqRoutes");
const errorHandler = require("../middleware/errorHandler");

const app = express();
app.use(express.json());
app.use("/faqs", faqRoutes);
app.use(errorHandler);

let adminToken;
let studentToken;
let createdFaqId;

beforeAll(async () => {
  await pool.query(`DELETE FROM users WHERE email IN ('faqadmin@test.com', 'faqstudent@test.com')`);

  const adminRes = await pool.query(`
    INSERT INTO users (email, full_name) 
    VALUES ('faqadmin@test.com', 'Admin User') 
    RETURNING id
  `);
  
  const studentRes = await pool.query(`
    INSERT INTO users (email, full_name) 
    VALUES ('faqstudent@test.com', 'Student User') 
    RETURNING id
  `);

  const jwt = require("jsonwebtoken");
  const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
  adminToken = jwt.sign({ sub: adminRes.rows[0].id, roles: ["admin"] }, JWT_SECRET, { expiresIn: "1h" });
  studentToken = jwt.sign({ sub: studentRes.rows[0].id, roles: ["student"] }, JWT_SECRET, { expiresIn: "1h" });

  await pool.query("DELETE FROM faq_items");
});

afterAll(async () => {
  await pool.query(`DELETE FROM users WHERE email IN ('faqadmin@test.com', 'faqstudent@test.com')`);
  await pool.query("DELETE FROM faq_items");
});

describe("FAQ Module Integration Tests", () => {
  describe("POST /faqs", () => {
    it("should prevent student from creating a FAQ", async () => {
      const res = await request(app)
        .post("/faqs")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({
          category: "General",
          question: "What is this?",
          answer: "It is an app."
        });
      expect(res.status).toBe(403);
    });

    it("should allow admin to create a FAQ", async () => {
      const res = await request(app)
        .post("/faqs")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          category: "Housing",
          question: "Where do I apply?",
          answer: "On the portal."
        });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty("id");
      expect(res.body.data.category).toBe("Housing");
      createdFaqId = res.body.data.id;
    });

    it("should validate input schema", async () => {
      const res = await request(app)
        .post("/faqs")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          category: "A", // too short
          question: "Hi", // too short
        });
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Validation failed/);
    });
  });

  describe("GET /faqs", () => {
    it("should fetch paginated FAQs", async () => {
      const res = await request(app).get("/faqs").query({ limit: 10 });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.meta.total).toBe(1);
    });

    it("should search FAQs by query", async () => {
      const res = await request(app).get("/faqs/search").query({ q: "portal" });
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].question).toBe("Where do I apply?");
    });
  });

  describe("GET /faqs/:id", () => {
    it("should fetch a single FAQ by ID", async () => {
      const res = await request(app).get(`/faqs/${createdFaqId}`);
      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(createdFaqId);
    });

    it("should return 404 for missing FAQ", async () => {
      const fakeId = "123e4567-e89b-12d3-a456-426614174000";
      const res = await request(app).get(`/faqs/${fakeId}`);
      expect(res.status).toBe(404);
    });
  });

  describe("PUT /faqs/:id", () => {
    it("should prevent student from updating a FAQ", async () => {
      const res = await request(app)
        .put(`/faqs/${createdFaqId}`)
        .set("Authorization", `Bearer ${studentToken}`)
        .send({ category: "Academics" });
      expect(res.status).toBe(403);
    });

    it("should allow admin to update a FAQ", async () => {
      const res = await request(app)
        .put(`/faqs/${createdFaqId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ category: "Academics", question: "Where do I apply for classes?" });
      expect(res.status).toBe(200);
      expect(res.body.data.category).toBe("Academics");
      expect(res.body.data.question).toBe("Where do I apply for classes?");
    });
  });

  describe("DELETE /faqs/:id", () => {
    it("should prevent student from deleting a FAQ", async () => {
      const res = await request(app)
        .delete(`/faqs/${createdFaqId}`)
        .set("Authorization", `Bearer ${studentToken}`);
      expect(res.status).toBe(403);
    });

    it("should allow admin to delete a FAQ", async () => {
      const res = await request(app)
        .delete(`/faqs/${createdFaqId}`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(204);
      
      const checkRes = await request(app).get(`/faqs/${createdFaqId}`);
      expect(checkRes.status).toBe(404);
    });
  });
});
