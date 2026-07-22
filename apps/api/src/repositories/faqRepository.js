const { pool } = require("../services/db");

const getFaqs = async (filters, page, limit) => {
  const offset = (page - 1) * limit;
  const values = [];
  let query = `SELECT id, category, question, answer, created_at, updated_at FROM faq_items`;
  const conditions = [];

  if (filters.category) {
    values.push(filters.category);
    conditions.push(`category = $${values.length}`);
  }

  if (filters.q) {
    values.push(filters.q);
    conditions.push(`search_vector @@ websearch_to_tsquery('english', $${values.length})`);
  }

  if (conditions.length > 0) {
    query += ` WHERE ` + conditions.join(" AND ");
  }

  if (filters.q) {
    // Order by rank if searching
    query += ` ORDER BY ts_rank(search_vector, websearch_to_tsquery('english', $${values.length})) DESC, created_at DESC`;
  } else {
    query += ` ORDER BY created_at DESC`;
  }
  
  query += ` LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
  
  const countQuery = `SELECT COUNT(*) FROM faq_items` + (conditions.length > 0 ? ` WHERE ` + conditions.join(" AND ") : "");

  const [data, countRes] = await Promise.all([
    pool.query(query, [...values, limit, offset]),
    pool.query(countQuery, values),
  ]);

  return {
    faqs: data.rows,
    total: parseInt(countRes.rows[0].count, 10),
  };
};

const getFaqById = async (id) => {
  const { rows } = await pool.query(`SELECT * FROM faq_items WHERE id = $1`, [id]);
  return rows[0] || null;
};

const createFaq = async (faqData) => {
  const { category, question, answer } = faqData;
  const { rows } = await pool.query(
    `INSERT INTO faq_items (category, question, answer) 
     VALUES ($1, $2, $3) RETURNING *`,
    [category, question, answer]
  );
  return rows[0];
};

const updateFaq = async (id, faqData) => {
  const updates = [];
  const values = [];

  Object.entries(faqData).forEach(([key, value]) => {
    if (value !== undefined) {
      values.push(value);
      updates.push(`${key} = $${values.length}`);
    }
  });

  if (updates.length === 0) return await getFaqById(id);

  values.push(id);
  const query = `
    UPDATE faq_items 
    SET ${updates.join(", ")}, updated_at = CURRENT_TIMESTAMP 
    WHERE id = $${values.length} 
    RETURNING *`;

  const { rows } = await pool.query(query, values);
  return rows[0] || null;
};

const deleteFaq = async (id) => {
  const { rowCount } = await pool.query(`DELETE FROM faq_items WHERE id = $1`, [id]);
  return rowCount > 0;
};

module.exports = {
  getFaqs,
  getFaqById,
  createFaq,
  updateFaq,
  deleteFaq,
};
