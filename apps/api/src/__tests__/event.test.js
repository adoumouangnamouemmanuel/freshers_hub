const express = require('express');
const supertest = require('supertest');
const { pool } = require('../services/db');
const eventRoutes = require('../routes/eventRoutes');
const postRoutes = require('../routes/postRoutes');
const errorHandler = require('../middleware/errorHandler');

const app = express();
app.use(express.json());
app.use('/events', eventRoutes);
app.use('/posts', postRoutes);
app.use(errorHandler);

const request = supertest(app);

describe('Event Module Integration Tests', () => {
  let adminUserId;
  let adminToken;
  let studentUserId;
  let studentToken;
  let studentUserId2;
  let studentToken2;
  let testEventId;
  let testPostId;

  beforeAll(async () => {
    // Create test users
    const adminRes = await pool.query(`
      INSERT INTO users (email, full_name) 
      VALUES ('admin.event@test.com', 'Admin User') 
      RETURNING id
    `);
    adminUserId = adminRes.rows[0].id;

    const studentRes = await pool.query(`
      INSERT INTO users (email, full_name) 
      VALUES ('student.event@test.com', 'Student User') 
      RETURNING id
    `);
    studentUserId = studentRes.rows[0].id;

    const student2Res = await pool.query(`
      INSERT INTO users (email, full_name) 
      VALUES ('student2.event@test.com', 'Student User 2') 
      RETURNING id
    `);
    studentUserId2 = student2Res.rows[0].id;

    // Generate tokens
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
    
    adminToken = jwt.sign(
      { sub: adminUserId, email: 'admin.event@test.com', roles: ['admin'] },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    studentToken = jwt.sign(
      { sub: studentUserId, email: 'student.event@test.com', roles: ['student'] },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    studentToken2 = jwt.sign(
      { sub: studentUserId2, email: 'student2.event@test.com', roles: ['student'] },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    // Clean up
    await pool.query('DELETE FROM users WHERE email IN ($1, $2, $3)', [
      'admin.event@test.com', 'student.event@test.com', 'student2.event@test.com'
    ]);
    await pool.end();
  });

  describe('POST /events', () => {
    it('should prevent student from creating an event', async () => {
      const res = await request
        .post('/events')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          title: 'Student Event',
          content: 'Should fail',
          eventDate: '2027-10-10',
          eventTime: '18:00'
        });
      
      expect(res.status).toBe(403);
    });

    it('should allow admin to create an event', async () => {
      const res = await request
        .post('/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Awesome Tech Meetup',
          content: 'Discussing the future of web development.',
          eventDate: '2027-10-10',
          eventTime: '18:00',
          location: 'Main Hall',
          capacity: 2,
          visibility: 'public'
        });
      
      expect(res.status).toBe(201);
      expect(res.body.event).toHaveProperty('id');
      expect(res.body.post.title).toBe('Awesome Tech Meetup');
      
      testEventId = res.body.event.id;
      testPostId = res.body.post.id;
    });

    it('should validate bad inputs', async () => {
      const res = await request
        .post('/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Sh', // too short
          content: 'Ok',
          eventDate: 'invalid-date',
          eventTime: '99:99'
        });
      
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Validation failed/);
    });
  });

  describe('GET /events', () => {
    it('should fetch events', async () => {
      const res = await request
        .get('/events')
        .set('Authorization', `Bearer ${studentToken}`);
        
      expect(res.status).toBe(200);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.meta.total).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET /events/:id', () => {
    it('should fetch a single event', async () => {
      const res = await request
        .get(`/events/${testEventId}`)
        .set('Authorization', `Bearer ${studentToken}`);
        
      expect(res.status).toBe(200);
      expect(res.body.event.title).toBe('Awesome Tech Meetup');
      expect(res.body.event.capacity).toBe(2);
    });
  });

  describe('PUT /events/:id', () => {
    it('should prevent student from updating admin event', async () => {
      const res = await request
        .put(`/events/${testEventId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          location: 'New Hall'
        });
        
      expect(res.status).toBe(403);
    });

    it('should allow author (admin) to update event', async () => {
      const res = await request
        .put(`/events/${testEventId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          location: 'Auditorium'
        });
        
      expect(res.status).toBe(200);
      expect(res.body.event.location).toBe('Auditorium');
      expect(res.body.event.title).toBe('Awesome Tech Meetup'); // Remains unchanged
    });
  });

  describe('RSVP System', () => {
    it('should allow student to RSVP going', async () => {
      const res = await request
        .post(`/events/${testEventId}/rsvp`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ status: 'going' });
        
      expect(res.status).toBe(200);
      expect(res.body.counts.goingCount).toBe(1);
    });

    it('should allow admin to RSVP going', async () => {
      const res = await request
        .post(`/events/${testEventId}/rsvp`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'going' });
        
      expect(res.status).toBe(200);
      expect(res.body.counts.goingCount).toBe(2);
    });

    it('should reject third RSVP if capacity is reached', async () => {
      const res = await request
        .post(`/events/${testEventId}/rsvp`)
        .set('Authorization', `Bearer ${studentToken2}`)
        .send({ status: 'going' });
        
      // Capacity is 2
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/capacity/i);
    });

    it('should allow existing user to change RSVP to declined', async () => {
      const res = await request
        .post(`/events/${testEventId}/rsvp`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ status: 'declined' });
        
      expect(res.status).toBe(200);
      expect(res.body.counts.goingCount).toBe(1);
    });
  });

  describe('DELETE /events/:id', () => {
    it('should prevent student from deleting admin event', async () => {
      const res = await request
        .delete(`/events/${testEventId}`)
        .set('Authorization', `Bearer ${studentToken}`);
        
      expect(res.status).toBe(403);
    });

    it('should allow author to delete event', async () => {
      const res = await request
        .delete(`/events/${testEventId}`)
        .set('Authorization', `Bearer ${adminToken}`);
        
      expect(res.status).toBe(200);
    });

    it('should verify event and post are deleted', async () => {
      const resEvent = await request
        .get(`/events/${testEventId}`)
        .set('Authorization', `Bearer ${studentToken}`);
      
      expect(resEvent.status).toBe(404);

      const resPost = await request
        .get(`/posts/${testPostId}`)
        .set('Authorization', `Bearer ${studentToken}`);
      
      expect(resPost.status).toBe(404);
    });
  });
});
