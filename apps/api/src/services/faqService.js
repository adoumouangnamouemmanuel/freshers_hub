const faqRepository = require("../repositories/faqRepository");
const AppError = require("../utils/AppError");

const getFaqs = async (filters, page, limit) => {
  return await faqRepository.getFaqs(filters, page, limit);
};

const getFaqById = async (id) => {
  const faq = await faqRepository.getFaqById(id);
  if (!faq) {
    throw new AppError("FAQ not found", 404);
  }
  return faq;
};

const createFaq = async (faqData) => {
  return await faqRepository.createFaq(faqData);
};

const updateFaq = async (id, faqData) => {
  const faq = await faqRepository.updateFaq(id, faqData);
  if (!faq) {
    throw new AppError("FAQ not found", 404);
  }
  return faq;
};

const deleteFaq = async (id) => {
  const deleted = await faqRepository.deleteFaq(id);
  if (!deleted) {
    throw new AppError("FAQ not found", 404);
  }
  return true;
};

module.exports = {
  getFaqs,
  getFaqById,
  createFaq,
  updateFaq,
  deleteFaq,
};
