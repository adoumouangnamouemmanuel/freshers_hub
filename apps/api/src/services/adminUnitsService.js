const adminUnitsRepository = require('../repositories/adminUnitsRepository');
const AppError = require('../utils/AppError');

const getCoachingSummary    = (ay) => adminUnitsRepository.getCoachingSummary(ay);
const getCoachingCoaches    = (ay) => adminUnitsRepository.getCoachingCoaches(ay);
const getCounsellingSummary = (ay) => adminUnitsRepository.getCounsellingSummary(ay);
const getAdvisingSummary    = (ay) => adminUnitsRepository.getAdvisingSummary(ay);
const getBuddyUpSummary     = (ay) => adminUnitsRepository.getBuddyUpSummary(ay);
const getSyncStatus         = ()   => adminUnitsRepository.getSyncStatus();

/**
 * Trigger Buddy Up sync.
 * In production, this would call the OIPCC API and pass real pairings.
 * For now it returns an empty mock sync and logs the attempt.
 * TODO: Replace with real OIPCC API client call.
 */
const triggerBuddyUpSync = async (triggeredBy, academicYearId) => {
  // TODO: OIPCC — fetch real pairings from external API:
  // const pairings = await oipccClient.getPairings(academicYearId);
  const pairings = []; // Mock: empty until API is wired

  const result = await adminUnitsRepository.syncBuddyUp(pairings, triggeredBy);
  return result;
};

const getCounsellingCases   = (ay, status) => adminUnitsRepository.getCounsellingCases(ay, status);
const getCounsellors        = (ay) => adminUnitsRepository.getCounsellors(ay);
const assignCounsellingCase = (data) => adminUnitsRepository.assignCounsellingCase(data);
const resolveCounsellingCase= (id) => adminUnitsRepository.resolveCounsellingCase(id);

module.exports = { 
  getCoachingSummary, 
  getCoachingCoaches, 
  getCounsellingSummary, 
  getCounsellingCases,
  getCounsellors,
  assignCounsellingCase,
  resolveCounsellingCase,
  getAdvisingSummary, 
  getBuddyUpSummary, 
  triggerBuddyUpSync, 
  getSyncStatus 
};
