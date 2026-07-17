const { pool } = require("../services/db");
const logger = require("../utils/logger");
const asyncHandler = require("../utils/asyncHandler");

const handleFaqSearch = asyncHandler(async (req, res) => {
  const query = req.query.q || "";

  if (!query) {
    return res.json({ results: [] });
  }

  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      `SELECT id, category, question, answer FROM faq_items WHERE question ILIKE $1 OR answer ILIKE $1 LIMIT 20`,
      [`%${query}%`]
    );
    res.json({ results: rows });
  } catch (err) {
    logger.warn("FAQ DB error (falling back to mock data): " + err.message);
    
    const mockFaqs = [
      { id: '1', category: 'Housing', question: 'How do I apply for a hostel?', answer: 'Hostel applications open in July via the SIS portal. Ensure you have paid your housing deposit.' },
      { id: '2', category: 'Housing', question: 'Can I choose my hostel roommate?', answer: 'First-year students are randomly assigned to encourage mingling. You can request specific roommates from sophomore year.' },
      { id: '3', category: 'Health', question: 'Where is the health center?', answer: 'The Natembea Health Center is located behind the student hostels. It is open 24/7 for emergencies.' },
      { id: '4', category: 'Academics', question: 'How do I drop a course?', answer: 'Use the SIS portal before the add/drop deadline in week 2 of the semester.' },
      { id: '5', category: 'Finance', question: 'When is tuition due?', answer: 'Tuition must be paid in full or a payment plan agreed upon before the start of the semester.' }
    ];
    
    const qLower = query.toLowerCase();
    const results = mockFaqs.filter(f => 
      f.question.toLowerCase().includes(qLower) || 
      f.answer.toLowerCase().includes(qLower)
    );
    
    res.json({ results });
  } finally {
    client.release();
  }
});

module.exports = {
  handleFaqSearch,
};
