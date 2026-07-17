const express = require('express');
const request = require('supertest');
const { pool } = require('../services/db');
const postRoutes = require('../routes/postRoutes');
const errorHandler = require('../middleware/errorHandler');

const app = express();
app.use(express.json());
app.use('/posts', postRoutes);
app.use(errorHandler);

let adminToken;
let studentToken;
let adminUserId;
let studentUserId;
let testPostId;

beforeAll(async () => {
  // Create test users
  const adminRes = await pool.query(`
    INSERT INTO users (email, full_name) 
    VALUES ('admin.post@test.com', 'Admin User') 
    RETURNING id
  `);
  adminUserId = adminRes.rows[0].id;

  const studentRes = await pool.query(`
    INSERT INTO users (email, full_name) 
    VALUES ('student.post@test.com', 'Student User') 
    RETURNING id
  `);
  studentUserId = studentRes.rows[0].id;

  // Generate tokens directly for testing (mocking JWT issuing)
  const jwt = require('jsonwebtoken');
  const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
  
  adminToken = jwt.sign(
    { sub: adminUserId, email: 'admin.post@test.com', roles: ['admin'] },
    JWT_SECRET,
    { expiresIn: '15m' }
  );

  studentToken = jwt.sign(
    { sub: studentUserId, email: 'student.post@test.com', roles: ['student'] },
    JWT_SECRET,
    { expiresIn: '15m' }
  );
});

afterAll(async () => {
  // Clean up
  await pool.query('DELETE FROM posts WHERE author_id IN ($1, $2)', [adminUserId, studentUserId]);
  await pool.query('DELETE FROM users WHERE id IN ($1, $2)', [adminUserId, studentUserId]);
  await pool.end();
});

describe('Post Module Integration Tests', () => {
  describe('POST /posts', () => {
    it('should prevent student from creating a post (insufficient permissions)', async () => {
      const res = await request(app)
        .post('/posts')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          title: 'Student Post',
          content: 'This should fail',
        });
      
      expect(res.status).toBe(403);
    });

    it('should validate missing title and content', async () => {
      const res = await request(app)
        .post('/posts')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          category: 'announcement'
        });
      
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Validation failed');
    });

    it('should allow admin to create a post', async () => {
      const res = await request(app)
        .post('/posts')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Test Admin Post',
          content: 'This is a test post content',
          category: 'announcement',
          visibility: 'public'
        });
      
      expect(res.status).toBe(201);
      expect(res.body.post).toHaveProperty('id');
      expect(res.body.post.title).toBe('Test Admin Post');
      
      testPostId = res.body.post.id;
    });
  });

  describe('GET /posts', () => {
    it('should fetch paginated posts and metadata', async () => {
      const res = await request(app)
        .get('/posts?page=1&limit=10')
        .set('Authorization', `Bearer ${studentToken}`);
        
      expect(res.status).toBe(200);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.meta).toHaveProperty('total');
      expect(res.body.meta.page).toBe(1);
      expect(res.body.meta.limit).toBe(10);
      
      // Ensure the newly created post is in the results
      const found = res.body.data.find(p => p.id === testPostId);
      expect(found).toBeDefined();
    });

    it('should fetch own posts using author=me', async () => {
      const res = await request(app)
        .get('/posts?author=me')
        .set('Authorization', `Bearer ${adminToken}`);
        
      expect(res.status).toBe(200);
      expect(res.body.data).toBeInstanceOf(Array);
      // Admin should see their post
      const found = res.body.data.find(p => p.id === testPostId);
      expect(found).toBeDefined();
    });
  });

  describe('GET /posts/:id', () => {
    it('should fetch post by ID', async () => {
      const res = await request(app)
        .get(`/posts/${testPostId}`);
        
      expect(res.status).toBe(200);
      expect(res.body.post.title).toBe('Test Admin Post');
    });

    it('should return 404 for invalid UUID', async () => {
      const res = await request(app)
        .get(`/posts/not-a-uuid`);
        
      expect(res.status).toBe(400); // validation failure
    });
  });

  describe('PUT /posts/:id', () => {
    it('should prevent student from updating admin post', async () => {
      const res = await request(app)
        .put(`/posts/${testPostId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          title: 'Hacked Title'
        });
        
      expect(res.status).toBe(403);
    });

    it('should allow author (admin) to update post', async () => {
      const res = await request(app)
        .put(`/posts/${testPostId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Updated Admin Post',
          content: 'Updated content'
        });
        
      expect(res.status).toBe(200);
      expect(res.body.post.title).toBe('Updated Admin Post');
    });
  });

  describe('DELETE /posts/:id', () => {
    it('should prevent student from deleting admin post', async () => {
      const res = await request(app)
        .delete(`/posts/${testPostId}`)
        .set('Authorization', `Bearer ${studentToken}`);
        
      expect(res.status).toBe(403);
    });

    it('should allow author to delete post', async () => {
      const res = await request(app)
        .delete(`/posts/${testPostId}`)
        .set('Authorization', `Bearer ${adminToken}`);
        
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
    
    it('should return 404 for deleted post', async () => {
      const res = await request(app)
        .get(`/posts/${testPostId}`);
        
      expect(res.status).toBe(404);
    });
  });
});
