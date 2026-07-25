const adminAnalyticsRepository = require('../repositories/adminAnalyticsRepository');
const ExcelJS = require('exceljs');

const getOverview     = (ay)       => adminAnalyticsRepository.getOverview(ay);
const getUnitComparison = (ay)     => adminAnalyticsRepository.getUnitComparison(ay);
const getCohortSpeed  = (ay, unit) => adminAnalyticsRepository.getCohortSpeed(ay, unit);
const getMonthlySessions = (ay)    => adminAnalyticsRepository.getMonthlySessions(ay);
const getTopClubs     = ()         => adminAnalyticsRepository.getTopClubs();

/**
 * Export: Streams an Excel workbook directly to the HTTP response using exceljs.
 * This avoids memory crashes on massive datasets by chunking the stream.
 */
const exportData = async (res, academicYearId) => {
  const data = await adminAnalyticsRepository.buildExportData(academicYearId);

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=fresherhub_export_${new Date().toISOString().split('T')[0]}.xlsx`);

  const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({ stream: res });

  // 1. Overview Sheet
  const sheet1 = workbook.addWorksheet('Overview');
  sheet1.columns = [
    { header: 'Metric', key: 'metric', width: 30 },
    { header: 'Value', key: 'value', width: 20 }
  ];
  const { users, clubs, coaching, counselling, advising } = data.overview;
  sheet1.addRow({ metric: 'Total Users', value: users?.total_users || 0 });
  sheet1.addRow({ metric: 'Total Students', value: users?.total_students || 0 });
  sheet1.addRow({ metric: 'Total Coaches', value: users?.total_coaches || 0 });
  sheet1.addRow({ metric: 'Active Clubs', value: clubs?.total_clubs || 0 });
  sheet1.addRow({ metric: 'Coaching Completion (%)', value: coaching?.completion_rate || 0 });
  sheet1.addRow({ metric: 'Counselling Engagement (%)', value: counselling?.completion_rate || 0 });
  sheet1.addRow({ metric: 'Advising Sessions (%)', value: advising?.completion_rate || 0 });
  sheet1.commit();

  // 2. Cohort Speed Sheet
  const sheet2 = workbook.addWorksheet('Cohort Speed');
  sheet2.columns = [
    { header: 'Class Year', key: 'class_year', width: 15 },
    { header: 'Total Freshers', key: 'total_freshers', width: 20 },
    { header: 'Completed', key: 'completed_freshers', width: 20 },
    { header: 'Avg Days to Complete', key: 'avg_days_to_complete', width: 25 }
  ];
  (data.cohort || []).forEach(row => sheet2.addRow(row));
  sheet2.commit();

  // 3. Monthly Sessions Sheet
  const sheet3 = workbook.addWorksheet('Monthly Sessions');
  sheet3.columns = [
    { header: 'Month', key: 'month', width: 20 },
    { header: 'Unit', key: 'unit_name', width: 20 },
    { header: 'Total Sessions', key: 'total_sessions', width: 20 },
    { header: 'Completed Sessions', key: 'completed_sessions', width: 20 }
  ];
  (data.monthly || []).forEach(row => {
    // Format date properly for Excel
    const rowData = { ...row };
    if (rowData.month) {
       const date = new Date(rowData.month);
       rowData.month = isNaN(date.getTime()) ? rowData.month : date.toLocaleString('en-GB', { timeZone: 'Africa/Accra' });
    }
    sheet3.addRow(rowData);
  });
  sheet3.commit();

  // Finalize the workbook to close the stream and send it to the client
  await workbook.commit();
};

module.exports = { getOverview, getUnitComparison, getCohortSpeed, getMonthlySessions, getTopClubs, exportData };
