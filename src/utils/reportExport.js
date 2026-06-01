const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

const exportReportExcel = async ({ summary, rows }, res) => {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Report');

  ws.addRow(['Metric', 'Value']);
  ws.addRow(['Total Students', summary.totalStudents]);
  ws.addRow(['Cash Paid', summary.cashPaid]);
  ws.addRow(['Online Paid', summary.onlinePaid]);
  ws.addRow(['Pending', summary.pending]);
  ws.addRow([]);
  ws.addRow(['Student', 'Class', 'Teacher', 'Month', 'Year', 'Payment']);

  rows.forEach((r) => {
    ws.addRow([r.studentName, r.className, r.teacherName, r.month, r.year, r.paymentMethod]);
  });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=fee-report.xlsx');
  await wb.xlsx.write(res);
  res.end();
};

const exportReportPdf = ({ summary, rows }, res) => {
  const doc = new PDFDocument({ margin: 30, size: 'A4' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename=fee-report.pdf');
  doc.pipe(res);

  doc.fontSize(16).text('School Fee Report', { underline: true });
  doc.moveDown();
  doc.fontSize(11).text(`Total Students: ${summary.totalStudents}`);
  doc.text(`Cash Paid: ${summary.cashPaid}`);
  doc.text(`Online Paid: ${summary.onlinePaid}`);
  doc.text(`Pending: ${summary.pending}`);
  doc.moveDown();

  rows.slice(0, 100).forEach((r, idx) => {
    doc.text(`${idx + 1}. ${r.studentName} | ${r.className} | ${r.teacherName} | ${r.month} ${r.year} | ${r.paymentMethod}`);
  });

  doc.end();
};

module.exports = { exportReportExcel, exportReportPdf };
