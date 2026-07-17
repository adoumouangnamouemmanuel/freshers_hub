const faqService = require("../services/faqService");
const asyncHandler = require("../utils/asyncHandler");

const getFaqs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, q, category } = req.query;
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  
  const result = await faqService.getFaqs({ q, category }, pageNum, limitNum);

  res.json({
    success: true,
    data: result.faqs,
    meta: {
      total: result.total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(result.total / limitNum),
    },
  });
});

const getFaqById = asyncHandler(async (req, res) => {
  const faq = await faqService.getFaqById(req.params.id);
  res.json({ success: true, data: faq });
});

const createFaq = asyncHandler(async (req, res) => {
  const newFaq = await faqService.createFaq(req.body);
  res.status(201).json({ success: true, data: newFaq });
});

const updateFaq = asyncHandler(async (req, res) => {
  const updatedFaq = await faqService.updateFaq(req.params.id, req.body);
  res.json({ success: true, data: updatedFaq });
});

const deleteFaq = asyncHandler(async (req, res) => {
  await faqService.deleteFaq(req.params.id);
  res.status(204).send();
});

module.exports = {
  getFaqs,
  getFaqById,
  createFaq,
  updateFaq,
  deleteFaq,
};
