const { pool } = require("../services/db");

const getOffices = async () => {
  const { rows } = await pool.query(`SELECT * FROM offices ORDER BY name ASC`);
  return rows;
};

const getOfficeById = async (id) => {
  const { rows: offices } = await pool.query(`SELECT * FROM offices WHERE id = $1`, [id]);
  const office = offices[0];
  if (!office) return null;

  const [staffRes, linksRes, docsRes, faqsRes] = await Promise.all([
    pool.query(`SELECT * FROM office_staff WHERE office_id = $1`, [id]),
    pool.query(`SELECT * FROM office_links WHERE office_id = $1`, [id]),
    pool.query(`SELECT * FROM office_documents WHERE office_id = $1`, [id]),
    pool.query(`SELECT id, category, question, answer, created_at, updated_at FROM faq_items WHERE category = $1`, [office.short_name]),
  ]);

  office.staff = staffRes.rows;
  office.links = linksRes.rows;
  office.documents = docsRes.rows;
  office.faqs = faqsRes.rows;

  return office;
};

const createOffice = async (officeData) => {
  const { name, short_name, description, location, hours, icon, hero_image, contact_email, contact_phone, contact_whatsapp } = officeData;
  const { rows } = await pool.query(
    `INSERT INTO offices (name, short_name, description, location, hours, icon, hero_image, contact_email, contact_phone, contact_whatsapp) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
    [name, short_name, description, location, hours, icon, hero_image, contact_email, contact_phone, contact_whatsapp]
  );
  return rows[0];
};

const createOfficeStaff = async (staffData) => {
  const { office_id, name, role, email, phone, image_url } = staffData;
  const { rows } = await pool.query(
    `INSERT INTO office_staff (office_id, name, role, email, phone, image_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [office_id, name, role, email, phone, image_url]
  );
  return rows[0];
};

const createOfficeLink = async (linkData) => {
  const { office_id, title, url, icon } = linkData;
  const { rows } = await pool.query(
    `INSERT INTO office_links (office_id, title, url, icon) VALUES ($1, $2, $3, $4) RETURNING *`,
    [office_id, title, url, icon]
  );
  return rows[0];
};

const createOfficeDocument = async (docData) => {
  const { office_id, title, url, type, size } = docData;
  const { rows } = await pool.query(
    `INSERT INTO office_documents (office_id, title, url, type, size) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [office_id, title, url, type, size]
  );
  return rows[0];
};

module.exports = {
  getOffices,
  getOfficeById,
  createOffice,
  createOfficeStaff,
  createOfficeLink,
  createOfficeDocument
};
