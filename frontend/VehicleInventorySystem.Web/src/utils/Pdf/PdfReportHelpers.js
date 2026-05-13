import autoTable from 'jspdf-autotable';

export const BrandTitle = 'Vehicle Inventory & Parts Management System (VPMS)';

export const PdfColors = {
  ink: [15, 23, 42],
  muted: [71, 85, 105],
  line: [226, 232, 240],
  soft: [248, 250, 252],
  header: [30, 41, 59],
  white: [255, 255, 255]
};

export const PageMargin = {
  left: 14,
  right: 14,
  bottom: 18
};

export const FormatCurrency = (value) => {
  const amount = Number(value || 0);
  return `Rs. ${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

export const FormatNumber = (value) => Number(value || 0).toLocaleString('en-US');

export const FormatDate = (value) => {
  if (!value) return '-';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

export const FormatDateTime = (value = new Date()) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const FormatLabel = (value) => {
  const label = String(value || '')
    .replace(/[-_]+/g, ' ')
    .trim();

  if (!label) return '-';
  return label.replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
};

export const NormalizeRole = (role) => {
  const value = String(role || 'Admin').trim();
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
};

export const GetDashboardSource = (role) => `${NormalizeRole(role)} Dashboard`;

export const BuildFileName = (...parts) => {
  const baseName = parts
    .filter(Boolean)
    .join('-')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return `${baseName || 'vpms-report'}.pdf`;
};

export const AddReportHeader = (doc, subtitle) => {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...PdfColors.ink);
  doc.text(BrandTitle, PageMargin.left, 18);

  doc.setFontSize(12);
  doc.setTextColor(...PdfColors.muted);
  doc.text(subtitle, PageMargin.left, 27);

  doc.setDrawColor(...PdfColors.line);
  doc.setLineWidth(0.2);
  doc.line(PageMargin.left, 33, doc.internal.pageSize.getWidth() - PageMargin.right, 33);

  doc.setFont('helvetica', 'normal');
  return 43;
};

export const AddSectionTitle = (doc, title, y) => {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...PdfColors.ink);
  doc.text(title, PageMargin.left, y);

  doc.setDrawColor(...PdfColors.line);
  doc.setLineWidth(0.15);
  doc.line(PageMargin.left, y + 3, doc.internal.pageSize.getWidth() - PageMargin.right, y + 3);

  doc.setFont('helvetica', 'normal');
  return y + 10;
};

export const AddMetadataSection = (doc, rows, startY) => {
  const tableStartY = AddSectionTitle(doc, 'Report Details', startY);

  autoTable(doc, {
    startY: tableStartY,
    body: rows,
    theme: 'grid',
    margin: { left: PageMargin.left, right: PageMargin.right },
    styles: {
      font: 'helvetica',
      fontSize: 9,
      cellPadding: { top: 3, right: 4, bottom: 3, left: 4 },
      lineColor: PdfColors.line,
      lineWidth: 0.1,
      textColor: PdfColors.ink,
      valign: 'middle'
    },
    columnStyles: {
      0: {
        cellWidth: 44,
        fillColor: PdfColors.soft,
        fontStyle: 'bold',
        textColor: PdfColors.muted
      },
      1: {
        cellWidth: 138
      }
    }
  });

  return (doc.lastAutoTable?.finalY || tableStartY) + 12;
};

export const AddSummaryCards = (doc, cards, startY) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const usableWidth = pageWidth - PageMargin.left - PageMargin.right;
  const gap = 6;
  const count = Math.max(cards.length, 1);
  const cardWidth = (usableWidth - gap * (count - 1)) / count;
  const cardHeight = 30;

  cards.forEach((card, index) => {
    const x = PageMargin.left + index * (cardWidth + gap);
    const y = startY;

    doc.setDrawColor(...PdfColors.line);
    doc.setFillColor(...PdfColors.soft);
    doc.roundedRect(x, y, cardWidth, cardHeight, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...PdfColors.muted);
    const labelLines = doc.splitTextToSize(String(card.label), cardWidth - 8).slice(0, 2);
    doc.text(labelLines, x + 4, y + 7);

    doc.setFontSize(String(card.value).length > 17 ? 9 : 11);
    doc.setTextColor(...PdfColors.ink);
    const valueLines = doc.splitTextToSize(String(card.value), cardWidth - 8).slice(0, 1);
    doc.text(valueLines, x + 4, y + 22);
  });

  doc.setFont('helvetica', 'normal');
  return startY + cardHeight + 12;
};

export const GetProfessionalTableOptions = (overrides = {}) => ({
  theme: 'grid',
  margin: { left: PageMargin.left, right: PageMargin.right },
  styles: {
    font: 'helvetica',
    fontSize: 9,
    cellPadding: { top: 4, right: 3, bottom: 4, left: 3 },
    overflow: 'linebreak',
    lineColor: PdfColors.line,
    lineWidth: 0.1,
    textColor: PdfColors.ink,
    valign: 'middle'
  },
  headStyles: {
    fillColor: PdfColors.header,
    textColor: PdfColors.white,
    fontStyle: 'bold',
    halign: 'left'
  },
  alternateRowStyles: {
    fillColor: PdfColors.soft
  },
  ...overrides
});

export const AddFooter = (doc, sourceText = 'Generated from VPMS Dashboard') => {
  const pageCount = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
    doc.setPage(pageNumber);
    doc.setDrawColor(...PdfColors.line);
    doc.setLineWidth(0.15);
    doc.line(PageMargin.left, pageHeight - 15, pageWidth - PageMargin.right, pageHeight - 15);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...PdfColors.muted);
    doc.text(sourceText, PageMargin.left, pageHeight - 9);
    doc.text(`Page ${pageNumber} of ${pageCount}`, pageWidth - PageMargin.right, pageHeight - 9, {
      align: 'right'
    });
  }
};
