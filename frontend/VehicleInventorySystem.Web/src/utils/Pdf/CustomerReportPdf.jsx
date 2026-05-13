import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  AddFooter,
  AddMetadataSection,
  AddReportHeader,
  AddSectionTitle,
  AddSummaryCards,
  BuildFileName,
  FormatCurrency,
  FormatDate,
  FormatDateTime,
  FormatLabel,
  FormatNumber,
  GetDashboardSource,
  GetProfessionalTableOptions,
  NormalizeRole
} from './PdfReportHelpers';

const ReportLabels = {
  'customer-summary': 'Customer Summary Report',
  'high-spenders': 'High Spenders Report',
  regulars: 'Regular Customers Report',
  'pending-credits': 'Pending Credits Report',
  daily: 'Daily Customer Report',
  monthly: 'Monthly Customer Report',
  yearly: 'Yearly Customer Report'
};

const PeriodReportTypes = new Set(['daily', 'monthly', 'yearly']);

const ReadValue = (item, keys, fallback = '') => {
  for (const key of keys) {
    const value = item?.[key];
    if (value !== undefined && value !== null && value !== '') return value;
  }

  return fallback;
};

const ReadNumber = (item, keys) => Number(ReadValue(item, keys, 0) || 0);

const GetCustomerName = (item) => ReadValue(item, [
  'customerName',
  'CustomerName',
  'name',
  'Name',
  'fullName',
  'FullName'
], 'Unknown Customer');

const GetPhoneNumber = (item) => ReadValue(item, [
  'customerPhone',
  'CustomerPhone',
  'phoneNumber',
  'PhoneNumber',
  'phone',
  'Phone'
], '-');

const GetEmailAddress = (item) => ReadValue(item, [
  'emailAddress',
  'EmailAddress',
  'email',
  'Email'
], '-');

const GetVehicleReference = (item) => {
  const vehicleInfo = item?.vehicleInfo || item?.VehicleInfo;
  return ReadValue(item, [
    'plate',
    'Plate',
    'plateNumber',
    'PlateNumber',
    'vehicle',
    'Vehicle'
  ], vehicleInfo?.plateNumber || vehicleInfo?.PlateNumber || '-');
};

const BuildEmptyBody = (columnCount) => [[{
  content: 'No customer records available for this report.',
  colSpan: columnCount,
  styles: {
    halign: 'center',
    textColor: [100, 116, 139],
    fontStyle: 'italic'
  }
}]];

const GetReportLabel = (reportType) => {
  const normalizedType = String(reportType || 'customers').toLowerCase();
  return ReportLabels[normalizedType] || `${FormatLabel(reportType || 'Customer')} Report`;
};

const BuildHighSpendersReport = (rows) => {
  const totalRevenue = rows.reduce((sum, item) => sum + ReadNumber(item, ['totalSpent', 'TotalSpent', 'totalSpending', 'TotalSpending']), 0);
  const highestSpending = rows.reduce((max, item) => Math.max(max, ReadNumber(item, ['totalSpent', 'TotalSpent', 'totalSpending', 'TotalSpending'])), 0);

  return {
    summaryCards: [
      { label: 'Total Customers', value: FormatNumber(rows.length) },
      { label: 'Highest Spending Amount', value: FormatCurrency(highestSpending) },
      { label: 'Total Revenue From Listed Customers', value: FormatCurrency(totalRevenue) }
    ],
    headers: ['Customer Name', 'Phone Number', 'Total Spending', 'Purchase Count'],
    body: rows.map((item) => [
      GetCustomerName(item),
      GetPhoneNumber(item),
      FormatCurrency(ReadNumber(item, ['totalSpent', 'TotalSpent', 'totalSpending', 'TotalSpending'])),
      FormatNumber(ReadNumber(item, ['orderCount', 'OrderCount', 'purchaseCount', 'PurchaseCount', 'invoiceCount', 'InvoiceCount']))
    ]),
    columnStyles: {
      0: { cellWidth: 64 },
      1: { cellWidth: 38 },
      2: { cellWidth: 46, halign: 'right' },
      3: { cellWidth: 34, halign: 'center' }
    }
  };
};

const BuildCustomerSummaryReport = (rows) => {
  const totalRevenue = rows.reduce((sum, item) => sum + ReadNumber(item, ['totalSpent', 'TotalSpent', 'totalSpending', 'TotalSpending']), 0);
  const highestSpending = rows.reduce((max, item) => Math.max(max, ReadNumber(item, ['totalSpent', 'TotalSpent', 'totalSpending', 'TotalSpending'])), 0);

  return {
    summaryCards: [
      { label: 'Total Customers', value: FormatNumber(rows.length) },
      { label: 'Highest Spending Amount', value: FormatCurrency(highestSpending) },
      { label: 'Total Revenue From Listed Customers', value: FormatCurrency(totalRevenue) }
    ],
    headers: ['Customer Name', 'Phone Number', 'Total Spending', 'Purchase Count', 'Last Visit Date'],
    body: rows.map((item) => [
      GetCustomerName(item),
      GetPhoneNumber(item),
      FormatCurrency(ReadNumber(item, ['totalSpent', 'TotalSpent', 'totalSpending', 'TotalSpending'])),
      FormatNumber(ReadNumber(item, ['orderCount', 'OrderCount', 'purchaseCount', 'PurchaseCount', 'invoiceCount', 'InvoiceCount'])),
      FormatDate(ReadValue(item, ['lastVisit', 'LastVisit', 'lastVisitDate', 'LastVisitDate'], null))
    ]),
    columnStyles: {
      0: { cellWidth: 54 },
      1: { cellWidth: 34 },
      2: { cellWidth: 38, halign: 'right' },
      3: { cellWidth: 28, halign: 'center' },
      4: { cellWidth: 28 }
    }
  };
};

const BuildRegularCustomersReport = (rows) => {
  const highestVisitCount = rows.reduce((max, item) => Math.max(max, ReadNumber(item, ['visitCount', 'VisitCount', 'orderCount', 'OrderCount'])), 0);

  return {
    summaryCards: [
      { label: 'Total Regular Customers', value: FormatNumber(rows.length) },
      { label: 'Highest Visit Count', value: FormatNumber(highestVisitCount) }
    ],
    headers: ['Customer Name', 'Phone Number', 'Visit Count', 'Last Visit Date'],
    body: rows.map((item) => [
      GetCustomerName(item),
      GetPhoneNumber(item),
      FormatNumber(ReadNumber(item, ['visitCount', 'VisitCount', 'orderCount', 'OrderCount'])),
      FormatDate(ReadValue(item, ['lastVisit', 'LastVisit', 'lastVisitDate', 'LastVisitDate', 'lastPurchase', 'LastPurchase'], null))
    ]),
    columnStyles: {
      0: { cellWidth: 68 },
      1: { cellWidth: 40 },
      2: { cellWidth: 32, halign: 'center' },
      3: { cellWidth: 42 }
    }
  };
};

const BuildPendingCreditsReport = (rows) => {
  const totalPendingAmount = rows.reduce((sum, item) => sum + ReadNumber(item, [
    'totalPending',
    'TotalPending',
    'pendingAmount',
    'PendingAmount',
    'amountDue',
    'AmountDue',
    'totalDue',
    'TotalDue'
  ]), 0);

  return {
    summaryCards: [
      { label: 'Total Pending Customers', value: FormatNumber(rows.length) },
      { label: 'Total Pending Amount', value: FormatCurrency(totalPendingAmount) }
    ],
    headers: ['Customer Name', 'Phone Number', 'Pending Amount', 'Unpaid Invoice Count'],
    body: rows.map((item) => [
      GetCustomerName(item),
      GetPhoneNumber(item),
      FormatCurrency(ReadNumber(item, [
        'totalPending',
        'TotalPending',
        'pendingAmount',
        'PendingAmount',
        'amountDue',
        'AmountDue',
        'totalDue',
        'TotalDue'
      ])),
      FormatNumber(ReadNumber(item, ['unpaidInvoiceCount', 'UnpaidInvoiceCount', 'invoiceCount', 'InvoiceCount']))
    ]),
    columnStyles: {
      0: { cellWidth: 68 },
      1: { cellWidth: 40 },
      2: { cellWidth: 44, halign: 'right' },
      3: { cellWidth: 30, halign: 'center' }
    }
  };
};

const BuildGenericCustomerReport = (rows) => {
  const activeCustomers = rows.filter((item) => item?.isActive !== false && item?.IsActive !== false).length;
  const inactiveCustomers = rows.length - activeCustomers;

  return {
    summaryCards: [
      { label: 'Total Customers', value: FormatNumber(rows.length) },
      { label: 'Active Customers', value: FormatNumber(activeCustomers) },
      { label: 'Inactive Customers', value: FormatNumber(inactiveCustomers) }
    ],
    headers: ['Customer Name', 'Phone Number', 'Email Address', 'Vehicle / Plate'],
    body: rows.map((item) => [
      GetCustomerName(item),
      GetPhoneNumber(item),
      GetEmailAddress(item),
      GetVehicleReference(item)
    ]),
    columnStyles: {
      0: { cellWidth: 52 },
      1: { cellWidth: 36 },
      2: { cellWidth: 58 },
      3: { cellWidth: 36 }
    }
  };
};

const BuildCustomerReport = (rows, reportType) => {
  const normalizedType = String(reportType || 'customers').toLowerCase();

  if (normalizedType === 'customer-summary') return BuildCustomerSummaryReport(rows);
  if (normalizedType === 'high-spenders') return BuildHighSpendersReport(rows);
  if (normalizedType === 'regulars') return BuildRegularCustomersReport(rows);
  if (normalizedType === 'pending-credits') return BuildPendingCreditsReport(rows);

  return BuildGenericCustomerReport(rows);
};

export function ExportCustomerReportPdf(customers = [], reportType = 'customers', role = 'Admin', options = {}) {
  const rows = Array.isArray(customers) ? customers : [];
  const normalizedType = String(reportType || 'customers').toLowerCase();
  const selectedPeriod = String(options.period || (PeriodReportTypes.has(normalizedType) ? normalizedType : 'current-data')).toLowerCase();
  const isCustomRange = selectedPeriod === 'custom';
  const fromDate = options.startDate || '';
  const toDate = options.endDate || '';
  const generatedBy = NormalizeRole(role);
  const reportLabel = GetReportLabel(normalizedType);
  const reportConfig = BuildCustomerReport(rows, normalizedType);
  const periodLabel = isCustomRange ? 'Custom Date Range' : FormatLabel(selectedPeriod);
  const doc = new jsPDF();

  let nextY = AddReportHeader(doc, `${generatedBy} Customer Report`);

  const metadataRows = isCustomRange
    ? [
        ['Report Type', 'Custom Date Range'],
        ['Customer Report', reportLabel],
        ['From Date', FormatDate(fromDate)],
        ['To Date', FormatDate(toDate)],
        ['Generated Date', FormatDateTime(new Date())],
        ['Generated By', generatedBy]
      ]
    : [
        ['Report Type', reportLabel],
        ['Period', periodLabel],
        ['Generated Date', FormatDateTime(new Date())],
        ['Generated By', generatedBy]
      ];

  nextY = AddMetadataSection(doc, metadataRows, nextY);

  nextY = AddSectionTitle(doc, 'Summary Section', nextY);
  nextY = AddSummaryCards(doc, reportConfig.summaryCards, nextY);

  nextY = AddSectionTitle(doc, 'Table Section', nextY);

  autoTable(doc, GetProfessionalTableOptions({
    startY: nextY,
    head: [reportConfig.headers],
    body: reportConfig.body.length > 0 ? reportConfig.body : BuildEmptyBody(reportConfig.headers.length),
    columnStyles: reportConfig.columnStyles
  }));

  AddFooter(doc, `Generated from ${GetDashboardSource(generatedBy)} | VPMS Dashboard`);
  const fileName = isCustomRange && fromDate && toDate
    ? BuildFileName('customer-report', normalizedType, fromDate, 'to', toDate)
    : BuildFileName(generatedBy, selectedPeriod, normalizedType, 'customer-report');
  doc.save(fileName);
}
