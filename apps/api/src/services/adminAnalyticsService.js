const adminAnalyticsRepository = require('../repositories/adminAnalyticsRepository');

const getOverview     = (ay)       => adminAnalyticsRepository.getOverview(ay);
const getUnitComparison = (ay)     => adminAnalyticsRepository.getUnitComparison(ay);
const getCohortSpeed  = (ay, unit) => adminAnalyticsRepository.getCohortSpeed(ay, unit);
const getMonthlySessions = (ay)    => adminAnalyticsRepository.getMonthlySessions(ay);
const getTopClubs     = ()         => adminAnalyticsRepository.getTopClubs();

/**
 * Build export data from aggregate views.
 * Converts to CSV string server-side — never touches raw session tables.
 */
const exportData = async (format, academicYearId) => {
  const data = await adminAnalyticsRepository.buildExportData(academicYearId);

  if (format === 'csv') {
    // Build a simple flat CSV from cohort data
    const headers = ['class_year', 'academic_year_id', 'total_freshers', 'completed_freshers', 'avg_days_to_complete'];
    const lines = [
      headers.join(','),
      ...(data.cohort || []).map(r => headers.map(h => r[h] ?? '').join(',')),
    ];
    return { contentType: 'text/csv', filename: 'analytics_export.csv', body: lines.join('\n') };
  }

  // Default: return JSON
  return { contentType: 'application/json', filename: 'analytics_export.json', body: JSON.stringify(data, null, 2) };
};

module.exports = { getOverview, getUnitComparison, getCohortSpeed, getMonthlySessions, getTopClubs, exportData };
