import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import StaffManager from '../components/management/StaffManager';
import InventoryManager from '../components/management/InventoryManager';
import CustomerManager from '../components/management/CustomerManager';
import Dialog from '../components/Dialog';
import { extractVendorItems, normalizeVendor, vendorService } from '../services/vendorService';
import { useToast } from '../context/ToastContext';
import PartFormModal from '../components/parts/PartFormModal';
import VendorSearchSelect from '../components/VendorSearchSelect';
import StaffFilters from '../components/staff/StaffFilters';
import { ExportFinancialReportPdf } from "../utils/Pdf/FinancialReportPdf";
import { ExportCustomerReportPdf } from "../utils/Pdf/CustomerReportPdf";
import TransactionsTable from '../components/staff/TransactionsTable';
import StaffStatsCards from '../components/staff/StaffStatsCards';
import CustomerStatsCards from '../components/customer/CustomerStatsCards';
import { Download, FileText, AlertCircle, Plus, Edit2, Trash2 } from 'lucide-react';
import '../styles/admin-dashboard.css';

import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';




const formatChartCurrency = (value) =>
  `Rs. ${Number(value || 0).toLocaleString()}`;

const buildRevenueTrendData = (transactions = []) => {
  if (!transactions.length) return [];

  const grouped = {};

  transactions.forEach((tx) => {
    // Safe date parsing using existing helper
    const rawDate = parseTransactionDate(tx);
    if (!rawDate) return;

    const key = rawDate.toISOString().split('T')[0];
    if (!grouped[key]) {
      grouped[key] = 0;
    }
    grouped[key] += getTransactionAmount(tx);
  });

  const sortedKeys = Object.keys(grouped).sort();

  return sortedKeys.map(key => ({
    name: new Date(key).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    revenue: grouped[key],
    rawDate: key
  }));
};

const buildPaymentStatusData = (transactions = []) => {
  let paid = 0;
  let pending = 0;
  let overdue = 0;

  transactions.forEach((tx) => {
    const status = String(readFirstValue(tx, ['paymentStatus', 'status'], '')).toLowerCase();
    if (status.includes('paid')) paid += 1;
    else if (status.includes('pending')) pending += 1;
    else overdue += 1;
  });

  // Filter out 0 values to avoid overlapping labels
  return [
    { name: 'Paid', value: paid, color: '#10B981' },
    { name: 'Pending', value: pending, color: '#F59E0B' },
    { name: 'Overdue', value: overdue, color: '#EF4444' }
  ].filter(d => d.value > 0);
};

const buildInventoryStatusData = (inventory = []) => {
  let inStock = 0;
  let lowStock = 0;
  let outOfStock = 0;

  inventory.forEach((item) => {
    const qty = Number(
      item.stock ??
      item.quantity ??
      item.stockQuantity ??
      item.availableQuantity ??
      item.qty ??
      0
    );

    if (qty <= 0) outOfStock += 1;
    else if (qty < 10) lowStock += 1;
    else inStock += 1;
  });

  return [
    { name: "In Stock", value: inStock, color: "#10B981" },
    { name: "Low Stock", value: lowStock, color: "#F59E0B" },
    { name: "Out of Stock", value: outOfStock, color: "#EF4444" }
  ];
};

const buildTopSellingPartsData = (transactions = [], inventory = []) => {
  const safeTransactions = Array.isArray(transactions) ? transactions : [];
  const safeInventory = Array.isArray(inventory) ? inventory : [];

  const grouped = {};

  // 1. Primary: Build from transactions
  if (safeTransactions.length > 0) {
    safeTransactions.forEach((tx) => {
      // A. Check for nested items arrays (e.g. { items: [...] })
      const possibleItemsKeys = [
        'items', 'Items', 'transactionItems', 'TransactionItems',
        'saleItems', 'SaleItems', 'orderItems', 'OrderItems',
        'products', 'Products', 'parts', 'Parts',
        'details', 'Details', 'transactionDetails', 'TransactionDetails'
      ];

      let items = [];
      for (const key of possibleItemsKeys) {
        if (Array.isArray(tx[key]) && tx[key].length > 0) {
          items = tx[key];
          break;
        }
      }

      // B. Check for single item objects (e.g. { item: { ... } })
      if (items.length === 0) {
        const singleKeys = ['item', 'Item', 'part', 'Part', 'product', 'Product', 'transactionItem', 'TransactionItem'];
        for (const key of singleKeys) {
          if (tx[key] && typeof tx[key] === 'object' && !Array.isArray(tx[key])) {
            items = [tx[key]];
            break;
          }
        }
      }

      if (items.length > 0) {
        items.forEach((item) => {
          const name = readFirstValue(item, ['partName', 'PartName', 'productName', 'ProductName', 'itemName', 'ItemName', 'name', 'Name', 'part', 'Part'], 'Unknown Item');
          const qty = Number(readFirstValue(item, ['quantity', 'Quantity', 'qty', 'Qty', 'count', 'Count', 'amount', 'Amount'], 0)) || 1;

          let finalName = 'Unknown Item';
          if (typeof name === 'object' && name !== null) {
            finalName = readFirstValue(name, ['name', 'Name', 'partName', 'PartName'], 'Unknown Item');
          } else if (name && name !== 'Unknown Item') {
            finalName = String(name);
          }

          // D. Cross-reference with inventory if name is still unknown but we have an ID
          if (finalName === 'Unknown Item' && safeInventory.length > 0) {
            const partId = readFirstValue(item, ['partId', 'PartId', 'productId', 'ProductId', 'itemId', 'ItemId']);
            if (partId) {
              const matchedPart = safeInventory.find(inv => String(inv.id) === String(partId) || String(inv.partCode) === String(partId));
              if (matchedPart && matchedPart.name) {
                finalName = matchedPart.name;
              }
            }
          }

          if (finalName && finalName !== 'Unknown Item') {
            grouped[finalName] = (grouped[finalName] || 0) + qty;
          }
        });
      }

      // C. Fallback: Flat structure or String parsing
      let flatName = readFirstValue(tx, ['partName', 'PartName', 'productName', 'ProductName', 'itemName', 'ItemName', 'name', 'Name'], null);
      const flatQty = Number(readFirstValue(tx, ['quantity', 'Quantity', 'qty', 'Qty', 'count', 'Count'], 0));

      // Look up flat part ID if name is missing
      if (!flatName && safeInventory.length > 0) {
        const flatPartId = readFirstValue(tx, ['partId', 'PartId', 'productId', 'ProductId', 'itemId', 'ItemId']);
        if (flatPartId) {
          const matchedPart = safeInventory.find(inv => String(inv.id) === String(flatPartId) || String(inv.partCode) === String(flatPartId));
          if (matchedPart && matchedPart.name) {
            flatName = matchedPart.name;
          }
        }
      }

      if (flatName && flatQty > 0) {
        grouped[String(flatName)] = (grouped[String(flatName)] || 0) + flatQty;
      }

      // Always try string parsing as well to be sure
      const stringProps = ['summary', 'Summary', 'description', 'Description', 'remarks', 'Remarks', 'details', 'Details'];
      stringProps.forEach(prop => {
        const str = String(tx[prop] || '');
        if (str && (str.includes('x') || str.includes('X'))) {
          const parts = str.split(',').map(s => s.trim());
          parts.forEach(p => {
            const match = p.match(/(\d+)\s*[xX]\s*(.*)/);
            if (match) {
              const q = parseInt(match[1]);
              const n = match[2].trim();
              if (n && q > 0) grouped[n] = (grouped[n] || 0) + q;
            }
          });
        }
      });
    });
  }

  // 2. Secondary: Fallback to inventory records
  if (Object.keys(grouped).length === 0 && safeInventory.length > 0) {
    safeInventory.forEach(item => {
      const name = item.name || item.Name || 'Unknown Part';
      const sold = Number(readFirstValue(item, ['soldCount', 'SoldCount', 'quantitySold', 'QuantitySold', 'sold', 'Sold', 'salesCount', 'SalesCount'], 0));
      if (sold > 0) {
        grouped[name] = (grouped[name] || 0) + sold;
      }
    });
  }

  return Object.entries(grouped)
    .map(([name, quantity]) => ({ name, quantity }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);
};


const REPORT_PERIODS = ['Daily', 'Monthly', 'Yearly', 'Custom'];
const CUSTOM_REPORT_PERIOD = 'Custom';
const REPORT_PERIOD_MAP = {
  Daily: 'daily',
  Monthly: 'monthly',
  Yearly: 'yearly',
  [CUSTOM_REPORT_PERIOD]: 'custom'
};
const DEFAULT_REPORT_FILTER = { period: 'daily', startDate: '', endDate: '' };

const buildFilterFromPeriod = (period, startDate = '', endDate = '') => ({
  period: REPORT_PERIOD_MAP[period] || 'daily',
  startDate: period === CUSTOM_REPORT_PERIOD ? startDate : '',
  endDate: period === CUSTOM_REPORT_PERIOD ? endDate : ''
});

const isValidCustomDateRange = ({ startDate, endDate }) => {
  if (!startDate || !endDate) return false;
  return new Date(endDate) >= new Date(startDate);
};

const buildReportQuery = ({ period, startDate, endDate }) => {
  const params = new URLSearchParams();
  params.set('period', period);

  if (period === 'custom') {
    params.set('startDate', startDate);
    params.set('endDate', endDate);
  }

  return params.toString();
};

const getReportPeriodLabel = (filter) => {
  if (filter.period === 'custom') return 'Custom Date Range';
  return filter.period.charAt(0).toUpperCase() + filter.period.slice(1);
};

const readFirstValue = (item, keys, fallback = null) => {
  for (const key of keys) {
    const value = item?.[key];
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return fallback;
};

const parseTransactionDate = (transaction) => {
  const value = readFirstValue(transaction, ['date', 'Date', 'createdAt', 'CreatedAt', 'transactionDate', 'TransactionDate']);
  if (!value) return null;

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const getTransactionAmount = (transaction) => {
  const amount = Number(readFirstValue(transaction, ['amount', 'Amount', 'totalAmount', 'TotalAmount', 'total', 'Total'], 0));
  return Number.isFinite(amount) ? amount : 0;
};




const normalizeTransaction = (transaction) => {
  const transactionDate = parseTransactionDate(transaction);
  const type = readFirstValue(transaction, ['type', 'Type'], '');
  const customerName = readFirstValue(transaction, ['customerName', 'CustomerName'], '');
  const vendorName = readFirstValue(transaction, ['vendorName', 'VendorName'], '');
  const id = readFirstValue(transaction, [
    'id',
    'Id',
    'invoiceId',
    'InvoiceId',
    'invoiceNo',
    'InvoiceNo',
    'invoiceNumber',
    'InvoiceNumber',
    'transactionId',
    'TransactionId'
  ], '');

  return {
    ...transaction,
    id,
    type,
    customerName: customerName || vendorName || readFirstValue(transaction, ['summary', 'Summary'], 'Unknown Transaction'),
    vendorName,
    date: transactionDate ? transactionDate.toLocaleDateString() : '',
    transactionDate,
    total: getTransactionAmount(transaction),
    amount: getTransactionAmount(transaction),
    paymentStatus: readFirstValue(transaction, ['paymentStatus', 'PaymentStatus', 'status', 'Status'], '')
  };
};

const isSameDay = (left, right) =>
  left.getFullYear() === right.getFullYear() &&
  left.getMonth() === right.getMonth() &&
  left.getDate() === right.getDate();

const isWithinReportPeriod = (transaction, filter) => {
  const date = transaction.transactionDate || parseTransactionDate(transaction);
  if (!date) return false;

  const today = new Date();
  if (filter.period === 'daily') return isSameDay(date, today);
  if (filter.period === 'monthly') {
    return date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth();
  }
  if (filter.period === 'yearly') return date.getFullYear() === today.getFullYear();
  if (filter.period === 'custom') {
    if (!filter.startDate || !filter.endDate) return false;
    const start = new Date(`${filter.startDate}T00:00:00`);
    const end = new Date(`${filter.endDate}T23:59:59`);
    return date >= start && date <= end;
  }

  return true;
};

export function AdminDashboard({ staffList, onAddStaff, onRemoveStaff, onUpdateStaff, sales, inventory, onUpdateInventory, customerList, onRemoveCustomer, onUpdateCustomer, onOpenVendorManagement, view = 'main' }) {
  const showToast = useToast();
  const navigate = useNavigate();




  const [txPage, setTxPage] = useState(1);
  const TX_PER_PAGE = 10;
  const [reportPeriod, setReportPeriod] = useState('Daily');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [appliedReportFilter, setAppliedReportFilter] = useState(DEFAULT_REPORT_FILTER);
  const [adminRoute, setAdminRoute] = useState('main');
  const [report, setReport] = useState({ period: 'daily', revenue: 0, count: 0 });
  const [adminCustomerReport, setAdminCustomerReport] = useState([]);
  const [isFinancialReportLoading, setIsFinancialReportLoading] = useState(false);
  const [isCustomerReportLoading, setIsCustomerReportLoading] = useState(false);
  const [hasFinancialReportLoaded, setHasFinancialReportLoaded] = useState(false);
  const [hasCustomerReportLoaded, setHasCustomerReportLoaded] = useState(false);
  const [vendors, setVendors] = useState([]);
  const [isAddPartModalOpen, setIsAddPartModalOpen] = useState(false);
  const [isAddPartSaving, setIsAddPartSaving] = useState(false);
  const [liveTransactions, setLiveTransactions] = useState([]);
  const [isLiveTransactionsLoading, setIsLiveTransactionsLoading] = useState(false);
  const [liveTransactionsError, setLiveTransactionsError] = useState('');
  const liveSales = liveTransactions.filter(tx => tx.type !== 'Purchase');
  const livePurchases = liveTransactions.filter(tx => tx.type === 'Purchase');

  const filteredSales = liveSales.filter((transaction) => isWithinReportPeriod(transaction, appliedReportFilter));
  const filteredPurchases = livePurchases.filter((transaction) => isWithinReportPeriod(transaction, appliedReportFilter));

  const filteredSalesRevenue = filteredSales.reduce((sum, transaction) => sum + getTransactionAmount(transaction), 0);
  const filteredPurchasesExpense = filteredPurchases.reduce((sum, transaction) => sum + getTransactionAmount(transaction), 0);

  const currentYear = new Date().getFullYear();
  const ytdSales = liveSales.filter((transaction) => {
    const transactionDate = transaction.transactionDate || parseTransactionDate(transaction);
    return transactionDate && transactionDate.getFullYear() === currentYear;
  });
  const ytdPurchases = livePurchases.filter((transaction) => {
    const transactionDate = transaction.transactionDate || parseTransactionDate(transaction);
    return transactionDate && transactionDate.getFullYear() === currentYear;
  });

  const ytdSalesRevenue = ytdSales.reduce((sum, transaction) => sum + getTransactionAmount(transaction), 0);
  const ytdPurchasesExpense = ytdPurchases.reduce((sum, transaction) => sum + getTransactionAmount(transaction), 0);

  const revenueTrendData = useMemo(
    () => buildRevenueTrendData(sales && sales.length > 0 ? sales : liveTransactions),
    [liveTransactions, sales]
  );

  const inventoryStatusData = useMemo(
    () => buildInventoryStatusData(inventory || []),
    [inventory]
  );

  const topSellingPartsData = useMemo(
    () => buildTopSellingPartsData(
      sales && sales.length > 0 ? sales : liveTransactions,
      inventory
    ),
    [liveTransactions, sales, inventory]
  );

  const paymentStatusData = useMemo(
    () => buildPaymentStatusData(sales && sales.length > 0 ? sales : liveTransactions),
    [liveTransactions, sales]
  );

  const refreshLiveTransactions = async () => {
    setIsLiveTransactionsLoading(true);
    setLiveTransactionsError('');
    try {
      const { apiFetch } = await import('../services/api');
      const response = await apiFetch('/Transactions/recent');
      let data = response;
      if (response && !Array.isArray(response)) {
        data = response.data || response.items || response.transactions || response.results || response.value || [];
      }
      setLiveTransactions(Array.isArray(data) ? data.map(normalizeTransaction) : []);
    } catch (error) {
      setLiveTransactions([]);
      setLiveTransactionsError('Unable to load live transactions.');
      showToast('error', 'Unable to load live transactions.');
    } finally {
      setIsLiveTransactionsLoading(false);
    }
  };

  useEffect(() => {
    let isCancelled = false;

    const loadGeneratedReports = async () => {
      const { apiFetch } = await import('../services/api');
      const query = buildReportQuery(appliedReportFilter);

      setIsFinancialReportLoading(true);
      setIsCustomerReportLoading(true);
      setHasFinancialReportLoaded(false);
      setHasCustomerReportLoaded(false);

      if (appliedReportFilter.period === 'custom' && !isValidCustomDateRange(appliedReportFilter)) {
        if (!isCancelled) {
          setReport({ period: 'custom', startDate: appliedReportFilter.startDate, endDate: appliedReportFilter.endDate, revenue: 0, count: 0 });
          setAdminCustomerReport([]);
          setIsFinancialReportLoading(false);
          setIsCustomerReportLoading(false);
        }
        return;
      }

      try {
        const response = await apiFetch(`/Reports/revenue?${query}`);
        const data = response?.data ?? response;
        if (data && !isCancelled) {
          setReport({
            period: data.period ?? data.Period ?? appliedReportFilter.period,
            startDate: data.startDate ?? data.StartDate ?? appliedReportFilter.startDate,
            endDate: data.endDate ?? data.EndDate ?? appliedReportFilter.endDate,
            revenue: Number(data.revenue ?? data.totalRevenue ?? data.TotalRevenue ?? 0),
            count: Number(data.count ?? data.invoiceCount ?? data.InvoiceCount ?? 0)
          });
          setHasFinancialReportLoaded(true);
        }
      } catch {
        if (!isCancelled) {
          setHasFinancialReportLoaded(false);
          showToast('error', 'Unable to load financial report data.');
        }
      } finally {
        if (!isCancelled) {
          setIsFinancialReportLoading(false);
        }
      }

      try {
        const response = await apiFetch(`/Reports/customers?${query}`);
        const data = response?.data ?? response;
        if (!isCancelled) {
          setAdminCustomerReport(Array.isArray(data) ? data : []);
          setHasCustomerReportLoaded(true);
        }
      } catch {
        if (!isCancelled) {
          setAdminCustomerReport([]);
          setHasCustomerReportLoaded(false);
        }
      } finally {
        if (!isCancelled) {
          setIsCustomerReportLoading(false);
        }
      }
    };

    loadGeneratedReports();

    return () => {
      isCancelled = true;
    };
  }, [appliedReportFilter]);

  useEffect(() => {
    vendorService.getVendors({ pageNumber: 1, pageSize: 200, status: 'all' }).then((res) => {
      const loadedVendors = extractVendorItems(res);
      console.log('Loaded vendors:', loadedVendors);
      setVendors(loadedVendors);
    }).catch(() => setVendors([]));
  }, []);

  useEffect(() => {
    refreshLiveTransactions();
  }, []);

  useEffect(() => {
    if (Array.isArray(sales) && sales.length > 0) {
      refreshLiveTransactions();
    }
  }, [sales]);

  useEffect(() => { setTxPage(1); }, [appliedReportFilter]);

  const handleAdminAddPart = async (payload) => {
    console.log('handleAdminAddPart called with payload:', payload);
    setIsAddPartSaving(true);

    // Safety timeout to ensure modal closes
    const timeoutId = setTimeout(() => {
      console.warn('Operation taking too long, closing modal');
      setIsAddPartModalOpen(false);
      setIsAddPartSaving(false);
    }, 30000); // 30 second timeout

    try {
      const { apiFetch } = await import('../services/api');
      console.log('Creating part with API...');
      const newPart = await apiFetch('/parts', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      clearTimeout(timeoutId);
      console.log('API response:', newPart);

      if (!newPart) {
        console.error('No response from API');
        showToast('error', 'Failed to create part: No response from server.');
        setIsAddPartSaving(false);
        return;
      }

      const vendorName = vendors.find(v => v.id === Number(payload.vendorId))?.name || 'Unknown Vendor';
      const updatedInventory = [
        ...inventory,
        {
          id: newPart.id ?? newPart.Id,
          name: newPart.name ?? newPart.Name,
          stock: newPart.stockLevel ?? newPart.StockLevel,
          stockLevel: newPart.stockLevel ?? newPart.StockLevel,
          price: newPart.price ?? newPart.Price,
          vendorId: newPart.vendorId ?? newPart.VendorId ?? payload.vendorId,
          vendorName: newPart.vendorName ?? newPart.VendorName ?? vendorName,
          vendor: newPart.vendorName ?? newPart.VendorName ?? vendorName,
          partCode: newPart.partCode ?? newPart.PartCode
        }
      ];

      console.log('Updated inventory:', updatedInventory);
      onUpdateInventory(updatedInventory);
      console.log('Inventory updated, closing modal');
      showToast('success', 'Part created successfully.');
      setIsAddPartModalOpen(false);
      setIsAddPartSaving(false);
      console.log('Modal closed');
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('Error creating part:', error);
      showToast('error', error?.message || 'Failed to create part.');
      setIsAddPartSaving(false);
      // Ensure modal closes even on error
      setTimeout(() => {
        console.log('Force closing modal due to error');
        setIsAddPartModalOpen(false);
      }, 2000);
    }
  };

  const handleReportPeriodChange = (event) => {
    const nextPeriod = event.target.value;
    setReportPeriod(nextPeriod);

    if (nextPeriod !== CUSTOM_REPORT_PERIOD) {
      setAppliedReportFilter(buildFilterFromPeriod(nextPeriod));
    }
  };

  const handleCustomDateChange = (field) => (event) => {
    const value = event.target.value;

    if (field === 'startDate') {
      setFromDate(value);
    } else {
      setToDate(value);
    }
  };

  const handleGenerateCustomReport = (event) => {
    event?.preventDefault();

    if (!isValidCustomDateRange({ startDate: fromDate, endDate: toDate })) {
      showToast('error', 'Please select a valid date range.');
      return;
    }

    setAppliedReportFilter(buildFilterFromPeriod(CUSTOM_REPORT_PERIOD, fromDate, toDate));
  };

  const canExportFinancialReport = hasFinancialReportLoaded && !isFinancialReportLoading;
  const canExportCustomerReport = hasCustomerReportLoaded && !isCustomerReportLoading;
  const currentView = view && view !== 'main' ? view : adminRoute;
  const renderTrendBadge = (value) => {
    const isNegative = value < 0;
    return (
      <span className={`admin-trend-badge ${isNegative ? 'is-negative' : 'is-positive'}`}>
        {isNegative ? 'Negative' : 'Positive'}
      </span>
    );
  };

  const renderReportPeriodControls = (placement = 'card') => (
    <div className="admin-filter-stack">
      <div className="admin-filter-field">
        <span className="admin-filter-label">Report Period</span>
        <select
          id={`report-period-${placement}`}
          value={reportPeriod}
          onChange={handleReportPeriodChange}
          className="admin-filter-select"
        >
          {REPORT_PERIODS.map((period) => (
            <option key={period} value={period}>
              {period === CUSTOM_REPORT_PERIOD ? 'Custom Date Range' : period}
            </option>
          ))}
        </select>
      </div>
      {reportPeriod === CUSTOM_REPORT_PERIOD && (
        <form className="admin-custom-range-box" onSubmit={handleGenerateCustomReport}>
          <div className="admin-filter-field">
            <span className="admin-filter-label">From Date</span>
            <input type="date" value={fromDate} onChange={handleCustomDateChange('startDate')} className="admin-filter-input" aria-label="From Date" />
          </div>
          <div className="admin-filter-field">
            <span className="admin-filter-label">To Date</span>
            <input type="date" value={toDate} min={fromDate || undefined} onChange={handleCustomDateChange('endDate')} className="admin-filter-input" aria-label="To Date" />
          </div>
          <button type="submit" className="admin-generate-btn">Generate Report</button>
        </form>
      )}
    </div>
  );

  const renderFinancialsCard = () => (
    <div className="admin-card admin-financials-card" id="stats">
      <div className="admin-card-header">
        <div className="admin-card-title-block">
          <h3 className="admin-card-title">Live Financials</h3>
          <p className="admin-card-subtitle">Revenue, activity count, and annual totals from live transactions.</p>
        </div>
      </div>
      <div className="admin-card-body">
        <div className="admin-filter-section">
          {renderReportPeriodControls('financials')}
        </div>
        <div className="admin-results-section">
          <div className="admin-section-heading">
            <span className="admin-section-label">Report Results</span>
            {isFinancialReportLoading && <span className="admin-loading-badge">Loading...</span>}
          </div>
          <div className="admin-report-table-wrap">
            <table className="admin-report-table">
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Sales</th>
                  <th>Revenue</th>
                  <th>Purchases</th>
                  <th>Expense</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><span className="admin-period-cell">{getReportPeriodLabel(appliedReportFilter)}</span></td>
                  <td>{filteredSales.length}</td>
                  <td><strong style={{ color: '#10B981' }}>Rs. {filteredSalesRevenue.toFixed(2)}</strong></td>
                  <td>{filteredPurchases.length}</td>
                  <td><strong style={{ color: '#EF4444' }}>Rs. {filteredPurchasesExpense.toFixed(2)}</strong></td>
                </tr>
                <tr className="total-row">
                  <td><span className="admin-period-cell">YTD Total</span></td>
                  <td>{ytdSales.length}</td>
                  <td><strong style={{ color: '#10B981' }}>Rs. {ytdSalesRevenue.toFixed(2)}</strong></td>
                  <td>{ytdPurchases.length}</td>
                  <td><strong style={{ color: '#EF4444' }}>Rs. {ytdPurchasesExpense.toFixed(2)}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div className="admin-export-section">
          <div className="admin-section-heading">
            <span className="admin-section-label">Export Actions</span>
          </div>
          <div className="admin-export-actions">
            <button
              className="admin-export-btn admin-export-btn--financial"
              disabled={!canExportFinancialReport}
              onClick={() => ExportFinancialReportPdf({ ...report, period: appliedReportFilter.period, revenue: filteredSalesRevenue, count: filteredSales.length }, appliedReportFilter.period, "Admin", appliedReportFilter)}
            >
              <FileText size={13} />
              <span>Export Financial Report PDF</span>
            </button>
            <button
              className="admin-export-btn admin-export-btn--customer"
              disabled={!canExportCustomerReport}
              onClick={() => ExportCustomerReportPdf(adminCustomerReport, "customer-summary", "Admin", appliedReportFilter)}
            >
              <Download size={13} />
              <span>Export Customer Report PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTransactionsCard = (type) => {
    const isSales = type === 'sales';
    const txList = isSales ? filteredSales : filteredPurchases;
    const txTotal = isSales ? filteredSalesRevenue : filteredPurchasesExpense;

    const totalTxPages = Math.max(1, Math.ceil(txList.length / TX_PER_PAGE));
    const pagedTransactions = txList.slice((txPage - 1) * TX_PER_PAGE, txPage * TX_PER_PAGE);

    return (
      <div id={isSales ? "live-transactions" : "purchase-history"} className="admin-card">
        <div className="admin-transactions-header">
          <div className="admin-transactions-header-left">
            <h3 className="admin-card-title">{isSales ? 'Live Sales' : 'Purchase History'}</h3>
            <p className="admin-card-subtitle">Filtered real-time {isSales ? 'sales' : 'purchase'} records</p>
          </div>
          <div className="admin-transactions-controls">
            {renderReportPeriodControls('transactions')}
            <button onClick={refreshLiveTransactions} className="admin-refresh-btn">Refresh</button>
          </div>
        </div>
        <div className="admin-card-body">
          <div className="admin-metrics-row">
            <div className="admin-metric-cell">
              <p className="admin-metric-label">{isSales ? 'Live Sales' : 'Purchase Records'}</p>
              <p className="admin-metric-value">{txList.length}</p>
              <p className="admin-metric-delta">{getReportPeriodLabel(appliedReportFilter)} filter</p>
            </div>
            <div className="admin-metric-cell">
              <p className="admin-metric-label">{isSales ? 'Revenue' : 'Expense'}</p>
              <p className="admin-metric-value" style={{ fontSize: '16px', color: isSales ? '#10B981' : '#EF4444' }}>Rs. {txTotal.toFixed(2)}</p>
              <p className="admin-metric-delta">Filtered real total</p>
            </div>
            <div className="admin-metric-cell">
              <p className="admin-metric-label">Report Period</p>
              <p className="admin-metric-value" style={{ fontSize: '16px' }}>{getReportPeriodLabel(appliedReportFilter)}</p>
              <p className="admin-metric-delta">Current filter</p>
            </div>
          </div>
          <div className="admin-table-panel">
            {isLiveTransactionsLoading ? (
              <p className="admin-loading-text">Loading {isSales ? 'sales' : 'purchases'}...</p>
            ) : (
              <div className="admin-table-scroll"><TransactionsTable transactions={pagedTransactions} /></div>
            )}
            {liveTransactionsError && !isLiveTransactionsLoading && (
              <p className="admin-error-text">{liveTransactionsError}</p>
            )}
            {!isLiveTransactionsLoading && totalTxPages > 1 && (
              <div className="admin-pagination">
                <button className="admin-page-btn" onClick={() => setTxPage(p => Math.max(1, p - 1))} disabled={txPage === 1}>&#8592; Prev</button>
                <span className="admin-page-info">Page {txPage} of {totalTxPages} &bull; {txList.length} records</span>
                <button className="admin-page-btn" onClick={() => setTxPage(p => Math.min(totalTxPages, p + 1))} disabled={txPage === totalTxPages}>Next &#8594;</button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderAnalyticsCharts = () => {
    const PIE_COLORS = ['#10B981', '#F59E0B', '#EF4444'];
    const BAR_COLORS = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#6366F1'];

    return (
      <div className="admin-analytics-grid">
        {/* Revenue Trend */}
        <div className="admin-card admin-chart-card">
          <div className="admin-card-header">
            <div className="admin-card-title-block">
              <h3 className="admin-card-title">Revenue Performance</h3>
              <p className="admin-card-subtitle">Daily revenue trend and growth visualization</p>
            </div>
          </div>
          <div className="admin-chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueTrendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} minTickGap={30} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={formatChartCurrency} />
                <Tooltip formatter={(value) => formatChartCurrency(value)} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }} />
                <Legend iconType="circle" />
                <Line type="monotone" dataKey="revenue" stroke="#2563EB" strokeWidth={4} dot={{ r: 6, fill: '#fff', stroke: '#2563EB', strokeWidth: 2 }} activeDot={{ r: 8, strokeWidth: 0 }} animationDuration={1500} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Inventory Status */}
        <div className="admin-card admin-chart-card">
          <div className="admin-card-header">
            <div className="admin-card-title-block">
              <h3 className="admin-card-title">Inventory Health</h3>
              <p className="admin-card-subtitle">Stock availability by status category</p>
            </div>
          </div>
          <div className="admin-chart-container">
            {inventoryStatusData.some(item => item.value > 0) ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={inventoryStatusData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label
                  >
                    {inventoryStatusData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="analytics-empty" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94A3B8', fontSize: '14px' }}>
                No inventory data available
              </div>
            )}
          </div>
        </div>

        {/* Top Selling Parts */}
        <div className="admin-card admin-chart-card">
          <div className="admin-card-header">
            <div className="admin-card-title-block">
              <h3 className="admin-card-title">Top Moving Parts</h3>
              <p className="admin-card-subtitle">Most popular inventory items by quantity sold</p>
            </div>
          </div>
          <div className="admin-chart-container">
            {topSellingPartsData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topSellingPartsData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: '#64748B' }} height={60} interval={0} angle={-15} textAnchor="end" />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                  <Tooltip cursor={{ fill: '#F1F5F9', opacity: 0.4 }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }} />
                  <Legend />
                  <Bar dataKey="quantity" radius={[6, 6, 0, 0]} barSize={38}>
                    {topSellingPartsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="analytics-empty" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94A3B8', fontSize: '14px' }}>
                No sales item data available
              </div>
            )}
          </div>
        </div>

        {/* Payment Status */}
        <div className="admin-card admin-chart-card">
          <div className="admin-card-header">
            <div className="admin-card-title-block">
              <h3 className="admin-card-title">Invoice Lifecycle</h3>
              <p className="admin-card-subtitle">Distribution of payment fulfillment statuses</p>
            </div>
          </div>
          <div className="admin-chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={paymentStatusData}
                  cx="50%"
                  cy="45%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                  label={({ name, value, percent }) => value > 0 ? `${name} ${(percent * 100).toFixed(0)}%` : ''}
                  labelLine={false}
                >
                  {paymentStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  if (currentView === 'add-staff') return <AddStaffPage onAdd={onAddStaff} onBack={() => setAdminRoute('main')} />;
  if (currentView === 'manage-inventory') return <InventoryPurchasePage inventory={inventory} vendors={vendors} onUpdate={onUpdateInventory} onBack={() => navigate(-1)} onSuccess={() => navigate('/admin/purchases')} onRefreshTransactions={refreshLiveTransactions} />;
  if (currentView === 'manage-customers') return <CustomerManagementPage customers={customerList} onRemove={onRemoveCustomer} onUpdate={onUpdateCustomer} onBack={() => navigate(-1)} />;
  if (currentView === 'view-all-inventory') return <FullInventoryPage inventory={inventory} onBack={() => navigate(-1)} />;
  if (currentView === 'view-all-staff') return <FullStaffPage staffList={staffList} onNavigate={setAdminRoute} onBack={() => setAdminRoute('main')} onRemove={onRemoveStaff} onUpdate={onUpdateStaff} onAddStaff={onAddStaff} />;
  if (currentView === 'add-staff-from-staff') return <AddStaffPage onAdd={onAddStaff} onBack={() => setAdminRoute('view-all-staff')} />;
  if (currentView === 'transactions') {
    return <div className="admin-dashboard-page">{renderTransactionsCard('sales')}</div>;
  }
  if (currentView === 'purchases') {
    return <div className="admin-dashboard-page">{renderTransactionsCard('purchases')}</div>;
  }
  if (currentView === 'reports') {
    return <div className="admin-dashboard-page">{renderFinancialsCard()}</div>;
  }

  return (
    <div className="admin-dashboard-page admin-overview-page">
      {/* TOP ROW: Financial (2fr) | Staff + Inventory stacked (1fr) */}
      <div className="admin-top-row">
        <div className="admin-top-left">
          {renderFinancialsCard()}
        </div>
        <div className="admin-top-right">
          <StaffManager userRole="Admin" staffList={staffList} onNavigate={setAdminRoute} onRemove={onRemoveStaff} onUpdate={onUpdateStaff} />
          <div id="inventory">
            <InventoryManager inventory={inventory} onNavigate={setAdminRoute} onAddPart={() => setIsAddPartModalOpen(true)} />
          </div>
        </div>
      </div>
      {/* MID ROW: Vendors (1fr) | Customers (1fr) */}
      <div className="admin-mid-row">
        <div id="vendors" className="admin-card">
          <div className="admin-card-header">
            <div className="admin-card-title-block">
              <h3 className="admin-card-title">Partners &amp; Vendors</h3>
              <p className="admin-card-subtitle">Active supplier relationships for inventory operations.</p>
            </div>
            <div className="admin-card-actions">
              <button onClick={onOpenVendorManagement} className="admin-secondary-btn">Vendor Management</button>
            </div>
          </div>
          <div className="admin-card-body">
            <div className="admin-vendor-list">
              {vendors.slice(0, 5).map(v => (
                <div key={v.id} className="admin-vendor-item">
                  <span className="admin-vendor-name">{v.name}</span>
                  <span className="admin-vendor-badge">Active</span>
                </div>
              ))}
              {vendors.length === 0 && <p className="admin-vendor-empty">No vendors found.</p>}
              {vendors.length > 5 && <p className="admin-vendor-more">+ {vendors.length - 5} more partners</p>}
            </div>
          </div>
        </div>
        <div id="customers">
          <CustomerManager customers={customerList} onNavigate={setAdminRoute} onRemove={onRemoveCustomer} onEdit={onUpdateCustomer} />
        </div>
      </div>
      {/* ANALYTICS SECTION */}
      {renderAnalyticsCharts()}

      {/* BOTTOM ROW: Live Transactions (full width) */}
      <div className="admin-bottom-row">
        {renderTransactionsCard('sales')}
      </div>
      <PartFormModal
        isOpen={isAddPartModalOpen}
        isEditing={false}
        initialPart={null}
        vendors={vendors}
        onClose={() => setIsAddPartModalOpen(false)}
        onSubmit={handleAdminAddPart}
        isSaving={isAddPartSaving}
      />
    </div>
  );
}

function AddStaffPage({ onAdd, onBack }) {
  const globalShowToast = useToast();
  const [toast, setToast] = useState(null);
  const [newStaff, setNewStaff] = useState({
    fullName: '',
    emailAddress: '',
    phoneNumber: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleChange = (field) => (event) => {
    const { value } = event.target;
    setNewStaff((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: '' }));
  };

  const handlePhoneChange = (event) => {
    const { value } = event.target;
    // Allow only numeric digits and limit to 10 digits
    const digitsOnly = value.replace(/\D/g, '').slice(0, 10);
    setNewStaff((current) => ({ ...current, phoneNumber: digitsOnly }));
    setErrors((current) => ({ ...current, phoneNumber: '' }));
  };

  const validate = () => {
    // Check validation in order and return first error only
    if (!newStaff.fullName.trim()) {
      const error = 'Full Name is required.';
      setErrors({ fullName: error });
      return { isValid: false, error };
    }

    if (!newStaff.emailAddress.trim()) {
      const error = 'Email Address is required.';
      setErrors({ emailAddress: error });
      return { isValid: false, error };
    }

    if (!newStaff.phoneNumber.trim()) {
      const error = 'Phone Number is required.';
      setErrors({ phoneNumber: error });
      return { isValid: false, error };
    }

    if (!newStaff.password) {
      const error = 'Password is required.';
      setErrors({ password: error });
      return { isValid: false, error };
    }

    if (newStaff.password.length < 8) {
      const error = 'Password must be at least 8 characters.';
      setErrors({ password: error });
      return { isValid: false, error };
    }

    if (!newStaff.confirmPassword) {
      const error = 'Confirm Password is required.';
      setErrors({ confirmPassword: error });
      return { isValid: false, error };
    }

    if (newStaff.password !== newStaff.confirmPassword) {
      const error = 'Passwords do not match.';
      setErrors({ confirmPassword: error });
      return { isValid: false, error };
    }

    setErrors({});
    return { isValid: true, error: null };
  };

  const handleAdd = async (event) => {
    event.preventDefault();

    const validation = validate();
    if (!validation.isValid) {
      showToast('error', validation.error);
      return;
    }

    setIsSaving(true);
    try {
      const isCreated = await onAdd({
        fullName: newStaff.fullName.trim(),
        emailAddress: newStaff.emailAddress.trim(),
        phoneNumber: newStaff.phoneNumber.trim(),
        password: newStaff.password,
        confirmPassword: newStaff.confirmPassword
      });
      if (isCreated) {
        onBack();
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {toast && (
        <div
          className={`vendor-toast vendor-toast-${toast.type}`}
          role="status"
        >
          <span className="vendor-toast-icon" aria-hidden="true">
            {toast.type === 'success' ? (
              <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.78-9.22a.75.75 0 00-1.06-1.06L9 11.44 7.28 9.72a.75.75 0 10-1.06 1.06l2.25 2.25c.29.3.77.3 1.06 0l3.25-3.25z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm-.75-11.25a.75.75 0 011.5 0v4.5a.75.75 0 01-1.5 0v-4.5zm.75 8.5a1 1 0 100-2 1 1 0 000 2z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </span>
          {toast.message}
        </div>
      )}
      <div className="staff-card" style={{ maxWidth: '640px', margin: 'auto' }}>
        <div className="staff-card-header">
          <div>
            <div className="staff-card-title">Add System Staff</div>
            <p style={{ fontSize: '12px', color: '#94A3B8', margin: '2px 0 0' }}>Create a staff account with secure credentials and contact details.</p>
          </div>
          <button onClick={onBack} className="btn-view-customer" style={{ background: '#F1F5F9', color: '#475569' }}>← Back</button>
        </div>
        <div className="staff-card-body" style={{ padding: '20px' }}>
          <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#64748B', display: 'block', marginBottom: '5px' }}>Full Name</label>
                <input
                  type="text"
                  placeholder="Staff full name"
                  value={newStaff.fullName}
                  onChange={handleChange('fullName')}
                  aria-invalid={Boolean(errors.fullName)}
                  className="search-input-field"
                  style={{ width: '100%', height: '38px', margin: 0, borderColor: errors.fullName ? '#EF4444' : undefined }}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#64748B', display: 'block', marginBottom: '5px' }}>Email Address</label>
                <input
                  type="email"
                  placeholder="staff@example.com"
                  value={newStaff.emailAddress}
                  onChange={handleChange('emailAddress')}
                  aria-invalid={Boolean(errors.emailAddress)}
                  className="search-input-field"
                  style={{ width: '100%', height: '38px', margin: 0, borderColor: errors.emailAddress ? '#EF4444' : undefined }}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#64748B', display: 'block', marginBottom: '5px' }}>Phone Number</label>
                <input
                  type="text"
                  placeholder="98XXXXXXXX"
                  value={newStaff.phoneNumber}
                  onChange={handlePhoneChange}
                  aria-invalid={Boolean(errors.phoneNumber)}
                  className="search-input-field"
                  style={{ width: '100%', height: '38px', margin: 0, borderColor: errors.phoneNumber ? '#EF4444' : undefined }}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#64748B', display: 'block', marginBottom: '5px' }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="At least 8 characters"
                    value={newStaff.password}
                    onChange={handleChange('password')}
                    aria-invalid={Boolean(errors.password)}
                    className="search-input-field"
                    style={{ width: '100%', height: '38px', margin: 0, paddingRight: '3.5rem', borderColor: errors.password ? '#EF4444' : undefined }}
                  />
                  <button type="button" onClick={() => setShowPassword((c) => !c)} style={{ position: 'absolute', right: '0.7rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 0, fontSize: '11px', fontWeight: 600 }}>
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#64748B', display: 'block', marginBottom: '5px' }}>Confirm Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Re-enter password"
                    value={newStaff.confirmPassword}
                    onChange={handleChange('confirmPassword')}
                    aria-invalid={Boolean(errors.confirmPassword)}
                    className="search-input-field"
                    style={{ width: '100%', height: '38px', margin: 0, paddingRight: '3.5rem', borderColor: errors.confirmPassword ? '#EF4444' : undefined }}
                  />
                  <button type="button" onClick={() => setShowConfirmPassword((c) => !c)} style={{ position: 'absolute', right: '0.7rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 0, fontSize: '11px', fontWeight: 600 }}>
                    {showConfirmPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '4px' }}>
              <button type="button" onClick={onBack} disabled={isSaving} className="btn-view-customer" style={{ background: '#F1F5F9', color: '#475569' }}>
                Cancel
              </button>
              <button type="submit" disabled={isSaving} className="btn-sale-primary">
                {isSaving ? 'Creating...' : 'Create Staff'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

function InventoryPurchasePage({ inventory, vendors, onUpdate, onBack, onSuccess, onRefreshTransactions }) {
  const showToast = useToast();
  const [purchaseData, setPurchaseData] = useState({ partId: '', quantity: '', vendorId: '' });
  const [errors, setErrors] = useState({ partId: '', quantity: '', vendorId: '' });

  const validateForm = () => {
    const newErrors = { partId: '', quantity: '', vendorId: '' };

    if (!purchaseData.partId) {
      newErrors.partId = 'Please select a part';
    }

    if (!purchaseData.quantity) {
      newErrors.quantity = 'Quantity is required';
    } else if (isNaN(purchaseData.quantity) || parseInt(purchaseData.quantity) <= 0) {
      newErrors.quantity = 'Quantity must be a number greater than 0';
    }

    if (!purchaseData.vendorId) {
      newErrors.vendorId = 'Please select a vendor';
    }

    setErrors(newErrors);
    return Object.values(newErrors).every((err) => err === '');
  };

  const handleInputChange = (field, value) => {
    setPurchaseData({ ...purchaseData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const handlePurchase = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const part = inventory.find(p => p.id === parseInt(purchaseData.partId));
    if (!part) return;
    try {
      const { apiFetch } = await import('../services/api');
      await apiFetch('/Transactions/purchase', {
        method: 'POST',
        body: JSON.stringify({
          vendorId: parseInt(purchaseData.vendorId),
          totalAmount: part.price * parseInt(purchaseData.quantity),
          items: [{ partId: parseInt(purchaseData.partId), quantity: parseInt(purchaseData.quantity), unitPrice: part.price * 0.7 }]
        })
      });
      showToast('success', 'Stock updated successfully.');
      const updatedInventory = inventory.map(p => p.id === parseInt(purchaseData.partId) ? { ...p, stock: p.stock + parseInt(purchaseData.quantity) } : p);
      onUpdate(updatedInventory);
      if (onRefreshTransactions) {
        await onRefreshTransactions();
      }
      if (onSuccess) {
        onSuccess();
      } else {
        onBack();
      }
    } catch (err) { showToast('error', 'Purchase failed.'); }
  };
  return (
    <div className="staff-card" style={{ maxWidth: '640px', margin: 'auto' }}>
      <div className="staff-card-header">
        <div>
          <div className="staff-card-title">New Stock Purchase</div>
          <p style={{ fontSize: '12px', color: '#94A3B8', margin: '2px 0 0' }}>Restock a part from an active vendor.</p>
        </div>
        <button onClick={onBack} className="btn-view-customer" style={{ background: '#F1F5F9', color: '#475569' }}>← Back</button>
      </div>
      <div className="staff-card-body" style={{ padding: '20px' }}>
        <form onSubmit={handlePurchase} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#64748B', display: 'block', marginBottom: '5px' }}>
              Select Part {errors.partId && <span style={{ color: '#DC2626' }}>*</span>}
            </label>
            <select
              onChange={e => handleInputChange('partId', e.target.value)}
              value={purchaseData.partId}
              className="search-input-field"
              style={{
                width: '100%',
                height: '38px',
                margin: 0,
                borderColor: errors.partId ? '#DC2626' : undefined,
                backgroundColor: errors.partId ? '#FEF2F2' : undefined,
              }}
            >
              <option value="">Select Part</option>
              {inventory.map(p => <option key={p.id} value={p.id}>{p.name} (Current: {p.stock})</option>)}
            </select>
            {errors.partId && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#DC2626', fontSize: '12px', marginTop: '4px' }}>
                <AlertCircle size={14} />
                {errors.partId}
              </div>
            )}
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#64748B', display: 'block', marginBottom: '5px' }}>
              Quantity {errors.quantity && <span style={{ color: '#DC2626' }}>*</span>}
            </label>
            <input
              type="number"
              placeholder="e.g., 10"
              onChange={e => handleInputChange('quantity', e.target.value)}
              value={purchaseData.quantity}
              className="search-input-field"
              style={{
                width: '100%',
                height: '38px',
                margin: 0,
                borderColor: errors.quantity ? '#DC2626' : undefined,
                backgroundColor: errors.quantity ? '#FEF2F2' : undefined,
              }}
            />
            {errors.quantity && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#DC2626', fontSize: '12px', marginTop: '4px' }}>
                <AlertCircle size={14} />
                {errors.quantity}
              </div>
            )}
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#64748B', display: 'block', marginBottom: '5px' }}>
              Vendor {errors.vendorId && <span style={{ color: '#DC2626' }}>*</span>}
            </label>
            <VendorSearchSelect
              vendors={vendors}
              value={purchaseData.vendorId ? Number(purchaseData.vendorId) : null}
              onChange={(id) => handleInputChange('vendorId', id ? String(id) : '')}
              style={{
                borderColor: errors.vendorId ? '#DC2626' : undefined,
                backgroundColor: errors.vendorId ? '#FEF2F2' : undefined,
              }}
            />
            {errors.vendorId && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#DC2626', fontSize: '12px', marginTop: '4px' }}>
                <AlertCircle size={14} />
                {errors.vendorId}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '4px' }}>
            <button type="button" onClick={onBack} className="btn-view-customer" style={{ background: '#F1F5F9', color: '#475569' }}>Cancel</button>
            <button type="submit" className="btn-sale-primary">Complete Purchase</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CustomerManagementPage({ customers, onRemove, onUpdate, onBack }) {
  const showToast = useToast();
  const [searchInput, setSearchInput] = useState('');
  const [draftStatusFilter, setDraftStatusFilter] = useState('all');
  const [appliedStatusFilter, setAppliedStatusFilter] = useState('all');
  const [submittedSearchTerm, setSubmittedSearchTerm] = useState('');
  const [pageNumber, setPageNumber] = useState(1);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({ name: '', email: '', phone: '', plate: '' });
  const [validationErrors, setValidationErrors] = useState({ name: '', email: '', phone: '' });
  const [removeDialog, setRemoveDialog] = useState({ isOpen: false, customerId: null, customerName: '', isRemoving: true });
  const [isRemoving, setIsRemoving] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const PAGE_SIZE = 5;

  const stats = useMemo(() => {
    const active = customers.filter((customer) => customer.isActive).length;
    return {
      total: customers.length,
      active,
      inactive: customers.length - active,
    };
  }, [customers]);

  const clearFilters = () => {
    setSearchInput('');
    setDraftStatusFilter('all');
    setSubmittedSearchTerm('');
    setAppliedStatusFilter('all');
    setPageNumber(1);
  };

  useEffect(() => {
    if (searchInput.trim() === '') {
      clearFilters();
    }
  }, [searchInput]);

  const filteredCustomers = useMemo(() => {
    let result = [...customers];
    const term = submittedSearchTerm.trim().toLowerCase();

    if (term) {
      result = result.filter((customer) => {
        const searchable = [
          customer.name,
          customer.email,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return searchable.includes(term);
      });
    }

    if (appliedStatusFilter === 'active') {
      result = result.filter((customer) => customer.isActive);
    } else if (appliedStatusFilter === 'inactive') {
      result = result.filter((customer) => !customer.isActive);
    }

    return result;
  }, [customers, submittedSearchTerm, appliedStatusFilter]);

  const totalItems = filteredCustomers.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));

  const pagedCustomers = useMemo(() => {
    const start = (pageNumber - 1) * PAGE_SIZE;
    return filteredCustomers.slice(start, start + PAGE_SIZE);
  }, [filteredCustomers, pageNumber]);

  const hasNextPage = pageNumber < totalPages;
  const hasPreviousPage = pageNumber > 1;

  useEffect(() => {
    if (pageNumber > totalPages) {
      setPageNumber(totalPages);
    }
  }, [pageNumber, totalPages]);

  const handleSearch = (event) => {
    event.preventDefault();
    const nextSearchTerm = searchInput.trim();
    const nextStatusFilter = draftStatusFilter;
    setSubmittedSearchTerm(nextSearchTerm);
    setAppliedStatusFilter(nextStatusFilter);
    setPageNumber(1);
  };

  const handleStatusFilterChange = (status) => {
    setDraftStatusFilter(status);
    setAppliedStatusFilter(status);
    setPageNumber(1);
  };

  const handleClearFilters = (event) => {
    event.preventDefault();
    clearFilters();
  };

  const handleSearchInputClear = (event) => {
    if (event.target.value === '') {
      clearFilters();
    }
  };

  const canClearFilters = Boolean(searchInput.trim() || submittedSearchTerm || appliedStatusFilter !== 'all' || draftStatusFilter !== 'all');

  const startEdit = (c) => { setEditingId(c.id); setEditData({ name: c.name, email: c.email || '', phone: c.phone || '', plate: c.plate || '' }); setValidationErrors({ name: '', email: '', phone: '' }); };

  const validateName = (name) => {
    if (!name.trim()) return 'Name is required';
    if (!/^[a-zA-Z\s]*$/.test(name)) return 'Name must contain only letters and spaces';
    return '';
  };

  const validateEmail = (email) => {
    if (!email.trim()) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Invalid email format';
    return '';
  };

  const validatePhone = (phone) => {
    if (!phone.trim()) return 'Phone number is required';
    if (!/^\d{10}$/.test(phone.replace(/\D/g, ''))) return 'Phone must be 10 digits with no letters or symbols';
    return '';
  };

  const handleSave = async (id) => {
    const nameError = validateName(editData.name);
    const emailError = validateEmail(editData.email);
    const phoneError = validatePhone(editData.phone);

    setValidationErrors({ name: nameError, email: emailError, phone: phoneError });

    if (nameError || emailError || phoneError) return;

    setIsSaving(true);
    try {
      const { apiFetch } = await import('../services/api');
      await apiFetch(`/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: editData.name,
          email: editData.email,
          phoneNumber: editData.phone
        })
      });

      const originalCustomer = customers.find(c => c.id === id);
      const updatedCustomer = {
        ...originalCustomer,
        name: editData.name,
        email: editData.email,
        phone: editData.phone,
        plate: editData.plate
      };

      setEditingId(null);
      onUpdate(updatedCustomer);
      showToast('success', `${editData.name} has been updated successfully.`);
    } catch (error) {
      showToast('error', 'Error updating customer: ' + (error.message || 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveClick = (customerId, customerName, isActive) => {
    setRemoveDialog({ isOpen: true, customerId, customerName, isRemoving: isActive });
  };

  const handleConfirmRemove = async () => {
    setIsRemoving(true);
    try {
      await onRemove(removeDialog.customerId);
      const message = removeDialog.isRemoving
        ? `${removeDialog.customerName} has been removed successfully.`
        : `${removeDialog.customerName} has been reactivated successfully.`;
      setRemoveDialog({ isOpen: false, customerId: null, customerName: '', isRemoving: true });
      showToast('success', message);
    } catch (error) {
      const action = removeDialog.isRemoving ? 'removing' : 'reactivating';
      showToast('error', `Error ${action} customer: ` + (error.message || 'Unknown error'));
      setRemoveDialog({ isOpen: false, customerId: null, customerName: '', isRemoving: true });
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: 'auto', paddingBottom: '40px' }}>
      <div className="staff-card" style={{ marginBottom: '24px' }}>
        <div className="staff-card-header">
          <div>
            <div className="staff-card-title">Customer Management</div>
            <p style={{ fontSize: '12px', color: '#94A3B8', margin: '2px 0 0' }}>Manage registered customer accounts and vehicle information.</p>
          </div>
          <button onClick={onBack} className="btn-view-customer" style={{ background: '#F1F5F9', color: '#475569' }}>← Back</button>
        </div>
      </div>

      <StaffFilters
        searchTerm={searchInput}
        onSearchChange={setSearchInput}
        statusFilter={draftStatusFilter}
        onStatusChange={handleStatusFilterChange}
        onSearch={handleSearch}
        onInputSearch={handleSearchInputClear}
        onClear={handleClearFilters}
        canClearFilters={canClearFilters}
      />

      <CustomerStatsCards total={stats.total} active={stats.active} inactive={stats.inactive} />

      <div className="vendor-section-header" style={{ marginTop: '24px' }}>
        <div>
          <h2>Customer List</h2>
          <p>{`Showing ${pagedCustomers.length} of ${totalItems} customer${totalItems === 1 ? '' : 's'}.`}</p>
        </div>
      </div>

      <div className="staff-card">
        <div className="staff-card-body">
          <div className="staff-table-scroll">
            <table className="staff-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Contact</th>
                  <th>Vehicle</th>
                  <th>Plate</th>
                  <th style={{ width: '120px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pagedCustomers.map(c => (
                  <tr key={c.id}>
                    {editingId === c.id ? (
                      <td colSpan="5" style={{ padding: '12px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px' }}>
                          <div>
                            <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', display: 'block', marginBottom: '4px' }}>Name</label>
                            <input type="text" value={editData.name} onChange={e => { setEditData({ ...editData, name: e.target.value }); setValidationErrors({ ...validationErrors, name: validateName(e.target.value) }); }} placeholder="Customer Name" className="search-input-field" style={{ width: '100%', height: '34px', margin: 0, borderColor: validationErrors.name ? '#EF4444' : undefined }} />
                            {validationErrors.name && <span style={{ fontSize: '10px', color: '#EF4444' }}>{validationErrors.name}</span>}
                          </div>
                          <div>
                            <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', display: 'block', marginBottom: '4px' }}>Email</label>
                            <input type="email" value={editData.email} onChange={e => { setEditData({ ...editData, email: e.target.value }); setValidationErrors({ ...validationErrors, email: validateEmail(e.target.value) }); }} placeholder="Email" className="search-input-field" style={{ width: '100%', height: '34px', margin: 0, borderColor: validationErrors.email ? '#EF4444' : undefined }} />
                            {validationErrors.email && <span style={{ fontSize: '10px', color: '#EF4444' }}>{validationErrors.email}</span>}
                          </div>
                          <div>
                            <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', display: 'block', marginBottom: '4px' }}>Phone</label>
                            <input type="text" value={editData.phone} onChange={e => { setEditData({ ...editData, phone: e.target.value }); setValidationErrors({ ...validationErrors, phone: validatePhone(e.target.value) }); }} placeholder="Phone Number" className="search-input-field" style={{ width: '100%', height: '34px', margin: 0, borderColor: validationErrors.phone ? '#EF4444' : undefined }} />
                            {validationErrors.phone && <span style={{ fontSize: '10px', color: '#EF4444' }}>{validationErrors.phone}</span>}
                          </div>
                          <div>
                            <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', display: 'block', marginBottom: '4px' }}>Plate Number</label>
                            <input type="text" value={editData.plate} onChange={e => setEditData({ ...editData, plate: e.target.value })} placeholder="Vehicle Plate" className="search-input-field" style={{ width: '100%', height: '34px', margin: 0 }} />
                          </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                          <button onClick={() => setEditingId(null)} className="btn-view-customer" style={{ background: '#F1F5F9', color: '#475569' }}>Cancel</button>
                          <button onClick={() => handleSave(c.id)} className="btn-sale-primary" disabled={isSaving || validationErrors.name || validationErrors.email || validationErrors.phone}>{isSaving ? 'Saving...' : 'Save Changes'}</button>
                        </div>
                      </td>
                    ) : (
                      <>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div className="avatar-circle" style={{ width: '28px', height: '28px', fontSize: '10px' }}>{c.name?.[0]?.toUpperCase()}</div>
                            <div style={{ fontSize: '13px', fontWeight: 600 }}>{c.name}</div>
                          </div>
                        </td>
                        <td>
                          <div style={{ fontSize: '12px', color: '#1E293B' }}>{c.email}</div>
                          <div style={{ fontSize: '11px', color: '#94A3B8' }}>{c.phone}</div>
                        </td>
                        <td>
                          {c.vehicleInfo ? (
                            <div style={{ fontSize: '12px', color: '#475569' }}>
                              {c.vehicleInfo.make?.toLowerCase().includes(c.vehicleInfo.model?.toLowerCase()) || c.vehicleInfo.model?.toLowerCase().includes(c.vehicleInfo.make?.toLowerCase()) ? c.vehicleInfo.make : `${c.vehicleInfo.make} ${c.vehicleInfo.model}`} ({c.vehicleInfo.year})
                              {c.vehicleCount > 1 && <span className="badge-pill badge-loyalty" style={{ marginLeft: '5px', fontSize: '10px' }}>+{c.vehicleCount - 1}</span>}
                            </div>
                          ) : (
                            <span style={{ fontSize: '11px', color: '#94A3B8' }}>No vehicle</span>
                          )}
                        </td>
                        <td><span className="badge-pill badge-paid">{c.vehicleInfo?.plateNumber || c.plate || 'N/A'}</span></td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                            <button onClick={() => startEdit(c)} className="btn-view-customer">Edit</button>
                            <button onClick={() => handleRemoveClick(c.id, c.name, c.isActive)} className="btn-view-customer" style={{ background: c.isActive ? '#FEF2F2' : '#F0FDF4', color: c.isActive ? '#DC2626' : '#16A34A', border: `1px solid ${c.isActive ? '#FECACA' : '#BBF7D0'}` }}>{c.isActive ? 'Remove' : 'Reactive'}</button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
                {pagedCustomers.length === 0 && (
                  <tr><td colSpan="5" style={{ padding: '28px', textAlign: 'center', color: '#94A3B8' }}>No customers found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="vendor-pagination" style={{ marginTop: '20px' }}>
          <div className="vendor-pagination-meta">
            <span className="vendor-pagination-count">Total customers: {totalItems}</span>
            <span className="vendor-pagination-summary">Page {pageNumber} of {totalPages}</span>
          </div>
          <div className="vendor-pagination-actions">
            <button
              type="button"
              className="btn-secondary vendor-pagination-button vendor-pagination-button-previous"
              onClick={() => setPageNumber((current) => Math.max(1, current - 1))}
              disabled={!hasPreviousPage}
            >
              Previous
            </button>
            <button
              type="button"
              className="btn-secondary vendor-pagination-button vendor-pagination-button-next"
              onClick={() => setPageNumber((current) => current + 1)}
              disabled={!hasNextPage}
            >
              Next
            </button>
          </div>
        </div>
      )}

      <Dialog isOpen={removeDialog.isOpen} title={removeDialog.isRemoving ? "Remove Customer" : "Reactive Customer"} message={removeDialog.isRemoving ? `Are you sure you want to remove ${removeDialog.customerName}? This action cannot be undone.` : `Are you sure you want to reactive ${removeDialog.customerName}'s account?`} type="confirm" confirmText={removeDialog.isRemoving ? "Remove" : "Reactive"} cancelText="Cancel" isLoading={isRemoving} onConfirm={handleConfirmRemove} onCancel={() => setRemoveDialog({ isOpen: false, customerId: null, customerName: '', isRemoving: true })} />
    </div>
  );
}


function FullInventoryPage({ inventory, onBack }) {
  return (
    <div className="staff-card" style={{ maxWidth: '960px', margin: 'auto' }}>
      <div className="staff-card-header">
        <div>
          <div className="staff-card-title">Full Inventory</div>
          <p style={{ fontSize: '12px', color: '#94A3B8', margin: '2px 0 0' }}>All registered parts and current stock levels.</p>
        </div>
        <button onClick={onBack} className="btn-view-customer" style={{ background: '#F1F5F9', color: '#475569' }}>← Back</button>
      </div>
      <div className="staff-card-body">
        <div className="staff-table-scroll">
          <table className="staff-table">
            <thead>
              <tr>
                <th>Part Name</th>
                <th>Vendor</th>
                <th>Price</th>
                <th>Stock</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map(p => (
                <tr key={p.id}>
                  <td><div style={{ fontWeight: 600, fontSize: '13px' }}>{p.name}</div></td>
                  <td><div style={{ fontSize: '12px', color: '#64748B' }}>{p.vendorName || p.vendor || 'Unknown Vendor'}</div></td>
                  <td><strong style={{ fontSize: '13px' }}>Rs. {p.price}</strong></td>
                  <td><span className={`badge-pill ${p.stock < 10 ? 'badge-overdue' : 'badge-paid'}`}>{p.stock}</span></td>
                </tr>
              ))}
              {inventory.length === 0 && (
                <tr><td colSpan="4" style={{ padding: '28px', textAlign: 'center', color: '#94A3B8' }}>No parts registered.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function FullStaffPage({ staffList, onNavigate, onBack, onRemove, onUpdate, onAddStaff }) {
  const showToast = useToast();
  const [searchInput, setSearchInput] = useState('');
  const [draftStatusFilter, setDraftStatusFilter] = useState('all');
  const [appliedStatusFilter, setAppliedStatusFilter] = useState('all');
  const [submittedSearchTerm, setSubmittedSearchTerm] = useState('');
  const [pageNumber, setPageNumber] = useState(1);
  const [showAddStaffForm, setShowAddStaffForm] = useState(false);
  const [removeDialog, setRemoveDialog] = useState({ isOpen: false, staffId: null, staffName: '' });
  const [isRemoving, setIsRemoving] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState(null);
  const [editData, setEditData] = useState({});
  const [editingEmail, setEditingEmail] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const PAGE_SIZE = 5;

  const stats = useMemo(() => {
    const active = staffList.filter((staff) => staff.isActive).length;
    return {
      total: staffList.length,
      active,
      inactive: staffList.length - active,
    };
  }, [staffList]);

  const clearStaffFilters = () => {
    setSearchInput('');
    setDraftStatusFilter('all');
    setSubmittedSearchTerm('');
    setAppliedStatusFilter('all');
    setPageNumber(1);
  };

  useEffect(() => {
    if (searchInput.trim() === '') {
      clearStaffFilters();
    }
  }, [searchInput]);

  const filteredStaff = useMemo(() => {
    let result = [...staffList];
    const term = submittedSearchTerm.trim().toLowerCase();

    if (term) {
      result = result.filter((staff) => {
        const searchable = [
          staff.name,
          staff.email,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return searchable.includes(term);
      });
    }

    if (appliedStatusFilter === 'active') {
      result = result.filter((staff) => staff.isActive);
    } else if (appliedStatusFilter === 'inactive') {
      result = result.filter((staff) => !staff.isActive);
    }

    return result;
  }, [staffList, submittedSearchTerm, appliedStatusFilter]);

  const totalItems = filteredStaff.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));

  const pagedStaff = useMemo(() => {
    const start = (pageNumber - 1) * PAGE_SIZE;
    return filteredStaff.slice(start, start + PAGE_SIZE);
  }, [filteredStaff, pageNumber]);

  const hasNextPage = pageNumber < totalPages;
  const hasPreviousPage = pageNumber > 1;

  useEffect(() => {
    if (pageNumber > totalPages) {
      setPageNumber(totalPages);
    }
  }, [pageNumber, totalPages]);

  const handleSearch = (event) => {
    event.preventDefault();
    const nextSearchTerm = searchInput.trim();
    const nextStatusFilter = draftStatusFilter;

    setSubmittedSearchTerm(nextSearchTerm);
    setAppliedStatusFilter(nextStatusFilter);
    setPageNumber(1);
  };

  const handleStatusFilterChange = (status) => {
    setDraftStatusFilter(status);
    setAppliedStatusFilter(status);
    setPageNumber(1);
  };

  const handleClearFilters = (event) => {
    event.preventDefault();
    clearStaffFilters();
  };

  const handleSearchInputClear = (event) => {
    if (event.target.value === '') {
      clearStaffFilters();
    }
  };

  const canClearFilters = Boolean(
    searchInput.trim() || submittedSearchTerm || appliedStatusFilter !== 'all' || draftStatusFilter !== 'all'
  );

  const handleRemoveClick = (staffId, staffName) => {
    setRemoveDialog({ isOpen: true, staffId, staffName });
  };

  const handleConfirmRemove = async () => {
    setIsRemoving(true);
    try {
      await onRemove(removeDialog.staffId);
      setRemoveDialog({ isOpen: false, staffId: null, staffName: '' });
    } finally {
      setIsRemoving(false);
    }
  };

  const handleEditClick = (staff) => {
    setEditingStaffId(staff.id);
    setEditData({
      name: staff.name || '',
      email: staff.email || '',
      phone: staff.phoneNumber || staff.phone || '',
      role: staff.role || 'Staff',
      isActive: staff.isActive !== false
    });
    setEditingEmail(staff.email || '');
  };

  const handleCancelEdit = () => {
    setEditingStaffId(null);
    setEditData({});
    setEditingEmail('');
  };

  const validateEditForm = () => {
    if (!editData.name || editData.name.trim().length < 2) {
      return 'Full name is required (at least 2 characters).';
    }
    if (!editData.email || !editData.email.includes('@')) {
      return 'Valid email is required.';
    }
    if (!editData.phone || editData.phone.replace(/\D/g, '').length !== 10) {
      return 'Phone number must be exactly 10 digits.';
    }
    return null;
  };

  const handleSaveEdit = async () => {
    const error = validateEditForm();
    if (error) {
      showToast('error', error);
      return;
    }

    setIsSavingEdit(true);
    try {
      const success = await onUpdate({
        id: editingStaffId,
        name: editData.name.trim(),
        email: editData.email.trim(),
        phone: editData.phone.trim(),
        role: editData.role,
        isActive: editData.isActive
      });

      if (success) {
        handleCancelEdit();
      }
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handlePhoneChangeEdit = (e) => {
    const value = e.target.value;
    const digitsOnly = value.replace(/\D/g, '').slice(0, 10);
    setEditData({ ...editData, phone: digitsOnly });
  };

  const handleDeleteStaff = (staffId, staffName) => {
    handleRemoveClick(staffId, staffName);
  };

  return (
    <>
      <div style={{ maxWidth: '1200px', margin: 'auto', paddingBottom: '40px' }}>
        <div className="staff-card" style={{ marginBottom: '24px' }}>
          <div className="staff-card-header">
            <div>
              <div className="staff-card-title">System Staff Directory</div>
              <p style={{ fontSize: '12px', color: '#94A3B8', margin: '2px 0 0' }}>All registered staff members and their roles.</p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowAddStaffForm(true)} className="btn-sale-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Plus size={15} /> Add Staff
              </button>
              <button onClick={onBack} className="btn-view-customer" style={{ background: '#F1F5F9', color: '#475569' }}>← Back</button>
            </div>
          </div>
        </div>

        <StaffFilters
          searchTerm={searchInput}
          onSearchChange={setSearchInput}
          statusFilter={draftStatusFilter}
          onStatusChange={handleStatusFilterChange}
          onSearch={handleSearch}
          onInputSearch={handleSearchInputClear}
          onClear={handleClearFilters}
          canClearFilters={canClearFilters}
        />

        <StaffStatsCards total={stats.total} active={stats.active} inactive={stats.inactive} />

        <div className="vendor-section-header" style={{ marginTop: '24px' }}>
          <div>
            <h2>Staff Directory</h2>
            <p>{`Showing ${pagedStaff.length} of ${totalItems} staff member${totalItems === 1 ? '' : 's'}.`}</p>
          </div>
        </div>

        <div className="staff-card">
          <div className="staff-card-body">
            <table className="staff-table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th style={{ width: '120px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pagedStaff.map(s => (
                  <tr key={s.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="avatar-circle" style={{ width: '28px', height: '28px', fontSize: '10px', background: '#2563eb', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{s.name[0].toUpperCase()}</div>
                        <div style={{ fontSize: '13px', fontWeight: 600 }}>{s.name}</div>
                      </div>
                    </td>
                    <td><div style={{ fontSize: '12px', color: '#64748B' }}>{s.email}</div></td>
                    <td><span className="badge-pill badge-loyalty">{s.role}</span></td>
                    <td>
                      <span className={`badge-pill ${s.isActive ? 'badge-paid' : 'badge-overdue'}`}>
                        {s.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => handleEditClick(s)}
                          className="btn-icon-small"
                          title="Edit staff"
                          style={{ background: '#E0F2FE', color: '#0369a1', padding: '6px 8px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteStaff(s.id, s.name)}
                          className="btn-icon-small"
                          title="Delete staff"
                          style={{ background: '#FEE2E2', color: '#dc2626', padding: '6px 8px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {pagedStaff.length === 0 && (
                  <tr><td colSpan="5" style={{ padding: '28px', textAlign: 'center', color: '#94A3B8' }}>No staff members found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {totalPages > 1 && (
          <div className="vendor-pagination" style={{ marginTop: '20px' }}>
            <div className="vendor-pagination-meta">
              <span className="vendor-pagination-count">Total staff: {totalItems}</span>
              <span className="vendor-pagination-summary">Page {pageNumber} of {totalPages}</span>
            </div>
            <div className="vendor-pagination-actions">
              <button
                type="button"
                className="btn-secondary vendor-pagination-button vendor-pagination-button-previous"
                onClick={() => setPageNumber((current) => Math.max(1, current - 1))}
                disabled={!hasPreviousPage}
              >
                Previous
              </button>
              <button
                type="button"
                className="btn-secondary vendor-pagination-button vendor-pagination-button-next"
                onClick={() => setPageNumber((current) => current + 1)}
                disabled={!hasNextPage}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {showAddStaffForm && (
        <div className="modal-overlay" onClick={() => setShowAddStaffForm(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div style={{ maxWidth: '640px' }}>
              <AddStaffPage onAdd={onAddStaff} onBack={() => setShowAddStaffForm(false)} />
            </div>
          </div>
        </div>
      )}

      {editingStaffId && (
        <div className="modal-overlay" onClick={handleCancelEdit}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="staff-card" style={{ maxWidth: '100%', margin: 0, border: 'none', boxShadow: 'none' }}>
              <div className="staff-card-header" style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: '16px' }}>
                <div>
                  <div className="staff-card-title" style={{ fontSize: '18px', marginBottom: '4px' }}>Edit Staff Member</div>
                  <p style={{ fontSize: '12px', color: '#94A3B8', margin: 0 }}>Update staff profile information.</p>
                </div>
                <button onClick={handleCancelEdit} style={{ background: 'none', border: 'none', fontSize: '20px', color: '#64748B', cursor: 'pointer', padding: 0 }}>✕</button>
              </div>
              <div className="staff-card-body" style={{ padding: '20px' }}>
                <form onSubmit={(e) => { e.preventDefault(); handleSaveEdit(); }} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#64748B', display: 'block', marginBottom: '5px' }}>Full Name</label>
                    <input
                      type="text"
                      placeholder="Staff full name"
                      value={editData.name || ''}
                      onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                      className="search-input-field"
                      style={{ width: '100%', height: '38px', margin: 0 }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#64748B', display: 'block', marginBottom: '5px' }}>Email Address</label>
                    <input
                      type="email"
                      placeholder="staff@example.com"
                      value={editData.email || ''}
                      onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                      className="search-input-field"
                      style={{ width: '100%', height: '38px', margin: 0 }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#64748B', display: 'block', marginBottom: '5px' }}>Phone Number</label>
                    <input
                      type="text"
                      placeholder="98XXXXXXXX"
                      value={editData.phone || ''}
                      onChange={handlePhoneChangeEdit}
                      className="search-input-field"
                      style={{ width: '100%', height: '38px', margin: 0 }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#64748B', display: 'block', marginBottom: '5px' }}>Role</label>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#1E293B', padding: '9px 12px', background: '#F1F5F9', borderRadius: '4px', border: '1px solid #E2E8F0' }}>Staff</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      id="activeCheckbox"
                      checked={editData.isActive !== false}
                      onChange={(e) => setEditData({ ...editData, isActive: e.target.checked })}
                      style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    <label htmlFor="activeCheckbox" style={{ fontSize: '12px', fontWeight: 700, color: '#64748B', cursor: 'pointer', margin: 0 }}>Active</label>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '8px' }}>
                    <button type="button" onClick={handleCancelEdit} disabled={isSavingEdit} className="btn-view-customer" style={{ background: '#F1F5F9', color: '#475569', fontWeight: 600 }}>
                      Cancel
                    </button>
                    <button type="submit" disabled={isSavingEdit} className="btn-sale-primary" style={{ fontWeight: 600, minWidth: '120px' }}>
                      {isSavingEdit ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      <Dialog isOpen={removeDialog.isOpen} title="Remove Staff Member" message={`Are you sure you want to remove ${removeDialog.staffName}? This action cannot be undone.`} type="confirm" confirmText="Remove" cancelText="Cancel" isLoading={isRemoving} onConfirm={handleConfirmRemove} onCancel={() => setRemoveDialog({ isOpen: false, staffId: null, staffName: '' })} />
    </>
  );
}
