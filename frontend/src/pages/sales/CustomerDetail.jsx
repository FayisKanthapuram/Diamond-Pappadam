import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, SquarePen, FileDown, PlusCircle, Banknote } from 'lucide-react';
import { salesApi } from '../../api/index.js';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import Modal from '../../components/ui/Modal.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import StatCard from '../../components/StatCard.jsx';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/format.js';
import {
  downloadInvoice,
  shareInvoice,
  getInvoiceNumber,
} from '../../utils/invoiceGenerator.js';
import { downloadStatementPDF } from '../../utils/statementGenerator.js';

function toYYYYMMDD(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function CustomerDetail() {
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [stats, setStats] = useState(null);
  const [sales, setSales] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState('sales');

  // Expanded sales states
  const [expandedSales, setExpandedSales] = useState({});

  // Active Dropdown Action State
  const [activeDropdownId, setActiveDropdownId] = useState(null);

  // Sales Search / Filters / Pagination
  const [salesSearch, setSalesSearch] = useState('');
  const [salesOnlyOutstanding, setSalesOnlyOutstanding] = useState(false);
  const [salesPage, setSalesPage] = useState(1);

  // Payments Search / Pagination
  const [paymentsSearch, setPaymentsSearch] = useState('');
  const [paymentsPage, setPaymentsPage] = useState(1);

  // Ledger Search / Pagination
  const [ledger, setLedger] = useState([]);
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [ledgerPage, setLedgerPage] = useState(1);

  // Edit Customer Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editPlace, setEditPlace] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editOpeningBalance, setEditOpeningBalance] = useState('');

  const PAGE_SIZE = 20;

  // Add/Edit Sale Modal State
  const [saleModalOpen, setSaleModalOpen] = useState(false);
  const [editingSaleId, setEditingSaleId] = useState(null);
  const [saleDate, setSaleDate] = useState(new Date().toISOString().slice(0, 10));
  const [saleItems, setSaleItems] = useState([
    { description: '', unit: 'KG', quantity: '', rate: '', amount: 0 }
  ]);
  const [saleReceivedAmount, setSaleReceivedAmount] = useState('');
  const [saleDiscountAmount, setSaleDiscountAmount] = useState('');
  const [saleDiscountReason, setSaleDiscountReason] = useState('');
  const [saleNotes, setSaleNotes] = useState('');
  const [salePreviousBalance, setSalePreviousBalance] = useState(0);

  // Add/Edit Payment Modal State
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [editingPaymentId, setEditingPaymentId] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10));
  const [payNotes, setPayNotes] = useState('');

  // Deletion Modal States
  const [deleteSaleId, setDeleteSaleId] = useState(null);
  const [deletePaymentId, setDeletePaymentId] = useState(null);

  // Invoice Preview Modal States
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [invoiceSale, setInvoiceSale] = useState(null);
  const [sharingInvoice, setSharingInvoice] = useState(false);

  // Download Customer Statement Modal State
  const [statementModalOpen, setStatementModalOpen] = useState(false);
  const [statementFromDate, setStatementFromDate] = useState(() => {
    const now = new Date();
    return toYYYYMMDD(new Date(now.getFullYear(), now.getMonth(), 1));
  });
  const [statementToDate, setStatementToDate] = useState(() => toYYYYMMDD(new Date()));
  const [statementDownloading, setStatementDownloading] = useState(false);

  // Reset pagination when search queries or filters update
  useEffect(() => {
    setSalesPage(1);
  }, [salesSearch, salesOnlyOutstanding]);

  useEffect(() => {
    setPaymentsPage(1);
  }, [paymentsSearch]);

  useEffect(() => {
    setLedgerPage(1);
  }, [ledgerSearch]);

  async function loadCustomerData() {
    setLoading(true);
    try {
      const [res, ledgerRes] = await Promise.all([
        salesApi.getCustomerDetail(id),
        salesApi.getCustomerLedger(id),
      ]);
      setCustomer(res.data.customer);
      setStats(res.data.stats);
      setSales(res.data.sales || []);
      setPayments(res.data.payments || []);
      setLedger(ledgerRes.data.ledger || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load customer details');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCustomerData();
  }, [id]);

  function handleOpenEditModal() {
    if (!customer) return;
    setEditName(customer.name);
    setEditPhone(customer.phone);
    setEditPlace(customer.place);
    setEditNotes(customer.notes || '');
    setEditOpeningBalance(customer.openingBalance !== undefined ? customer.openingBalance : (stats?.openingBalance || 0));
    setEditModalOpen(true);
  }

  async function handleUpdateCustomer(e) {
    e.preventDefault();
    if (!editName || !editPhone || !editPlace) {
      return toast.error('Name, phone, and place are required');
    }

    const opBal = Number(editOpeningBalance) || 0;
    if (opBal < 0) {
      return toast.error('Opening balance cannot be negative');
    }

    setSubmitting(true);
    try {
      await salesApi.updateCustomer(id, {
        name: editName,
        phone: editPhone,
        place: editPlace,
        notes: editNotes,
        openingBalance: opBal,
      });
      toast.success('Customer details updated successfully');
      setEditModalOpen(false);
      await loadCustomerData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update customer');
    } finally {
      setSubmitting(false);
    }
  }

  const applyQuickFilter = (type) => {
    const now = new Date();
    let from, to;
    if (type === 'this-month') {
      from = new Date(now.getFullYear(), now.getMonth(), 1);
      to = now;
    } else if (type === 'last-month') {
      from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      to = new Date(now.getFullYear(), now.getMonth(), 0);
    } else if (type === 'last-3-months') {
      from = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      to = now;
    } else if (type === 'this-year') {
      from = new Date(now.getFullYear(), 0, 1);
      to = now;
    }
    if (from && to) {
      setStatementFromDate(toYYYYMMDD(from));
      setStatementToDate(toYYYYMMDD(to));
    }
  };

  async function handleDownloadStatement(e) {
    e.preventDefault();
    if (!statementFromDate) {
      return toast.error('From Date is required');
    }
    if (!statementToDate) {
      return toast.error('To Date is required');
    }
    if (statementFromDate > statementToDate) {
      return toast.error('From Date must be less than or equal to To Date');
    }

    setStatementDownloading(true);
    try {
      const res = await salesApi.getCustomerStatement(id, {
        from: statementFromDate,
        to: statementToDate,
      });
      downloadStatementPDF(res.data);
      setStatementModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to download statement');
    } finally {
      setStatementDownloading(false);
    }
  }

  function handleItemChange(index, field, value) {
    const updated = [...saleItems];
    updated[index][field] = value;

    if (field === 'quantity' || field === 'rate') {
      const q = Number(updated[index].quantity) || 0;
      const r = Number(updated[index].rate) || 0;
      updated[index].amount = q * r;
    }

    setSaleItems(updated);
  }

  function handleAddRow() {
    setSaleItems([
      ...saleItems,
      { description: '', unit: 'KG', quantity: '', rate: '', amount: 0 }
    ]);
  }

  function handleRemoveRow(index) {
    if (saleItems.length === 1) return;
    setSaleItems(saleItems.filter((_, i) => i !== index));
  }

  function toggleExpand(saleId) {
    setExpandedSales((prev) => ({
      ...prev,
      [saleId]: !prev[saleId],
    }));
  }

  function toggleDropdown(dropdownId) {
    setActiveDropdownId((prev) => (prev === dropdownId ? null : dropdownId));
  }

  function openEditSale(sale) {
    setEditingSaleId(sale.id);
    setSaleDate(sale.date ? new Date(sale.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10));
    setSaleItems(
      sale.items.map((item) => ({
        description: item.description,
        unit: item.unit,
        quantity: item.quantity,
        rate: item.rate,
        amount: item.amount,
      }))
    );
    setSaleReceivedAmount(sale.receivedAmount.toString());
    setSaleDiscountAmount(sale.discountAmount ? sale.discountAmount.toString() : '');
    setSaleDiscountReason(sale.discountReason || '');
    setSaleNotes(sale.notes || '');
    setSalePreviousBalance(sale.previousBalance || 0);
    setSaleModalOpen(true);
  }

  function openEditPayment(p) {
    setEditingPaymentId(p.id);
    setPayAmount(p.amount.toString());
    setPayDate(p.date ? new Date(p.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10));
    setPayNotes(p.notes || '');
    setPayModalOpen(true);
  }

  const handleCloseSaleModal = () => {
    setSaleModalOpen(false);
    setEditingSaleId(null);
    setSaleItems([
      { description: '', unit: 'KG', quantity: '', rate: '', amount: 0 }
    ]);
    setSaleReceivedAmount('');
    setSaleDiscountAmount('');
    setSaleDiscountReason('');
    setSaleNotes('');
    setSalePreviousBalance(0);
    setSaleDate(new Date().toISOString().slice(0, 10));
  };

  const handleClosePayModal = () => {
    setPayModalOpen(false);
    setEditingPaymentId(null);
    setPayAmount('');
    setPayNotes('');
    setPayDate(new Date().toISOString().slice(0, 10));
  };

  async function handleRecordSale(e) {
    e.preventDefault();

    for (let i = 0; i < saleItems.length; i++) {
      const it = saleItems[i];
      if (!it.description.trim()) {
        return toast.error(`Row ${i + 1}: Description is required`);
      }
      const qty = Number(it.quantity);
      const rt = Number(it.rate);
      if (isNaN(qty) || qty <= 0) {
        return toast.error(`Row ${i + 1}: Quantity must be greater than 0`);
      }
      if (isNaN(rt) || rt <= 0) {
        return toast.error(`Row ${i + 1}: Rate must be greater than 0`);
      }
    }

    if (!saleDate) {
      return toast.error('Sale date is required');
    }

    const grandTotal = saleItems.reduce((sum, item) => sum + (item.amount || 0), 0);
    const disc = Number(saleDiscountAmount) || 0;
    if (disc < 0) {
      return toast.error('Discount cannot be negative');
    }
    if (disc > grandTotal) {
      return toast.error('Discount cannot exceed subtotal amount');
    }

    const finalSale = Math.max(0, grandTotal - disc);
    const totalDue = salePreviousBalance + finalSale;
    const received = Number(saleReceivedAmount) || 0;
    if (received > totalDue) {
      return toast.error(`Received amount cannot exceed Total Due (${formatCurrency(totalDue)})`);
    }

    const payload = {
      customerId: id,
      date: saleDate,
      items: saleItems.map(it => ({
        description: it.description.trim(),
        unit: it.unit,
        quantity: Number(it.quantity),
        rate: Number(it.rate),
        amount: Number(it.quantity) * Number(it.rate)
      })),
      discountAmount: disc,
      discountReason: saleDiscountReason.trim(),
      receivedAmount: received,
      notes: saleNotes,
    };

    setSubmitting(true);
    try {
      let savedSale = null;
      if (editingSaleId) {
        const res = await salesApi.updateSale(editingSaleId, payload);
        savedSale = res.data.sale;
        toast.success('Sale updated successfully');
      } else {
        const res = await salesApi.createSale(payload);
        savedSale = res.data.sale;
        toast.success('Sale logged successfully');
      }
      handleCloseSaleModal();
      
      // Reload customer details and find the updated sale for invoice preview
      const detailRes = await salesApi.getCustomerDetail(id);
      setCustomer(detailRes.data.customer);
      setStats(detailRes.data.stats);
      const freshSales = detailRes.data.sales || [];
      const freshPayments = detailRes.data.payments || [];
      setSales(freshSales);
      setPayments(freshPayments);

      if (savedSale) {
        const saleId = savedSale._id || savedSale.id;
        const freshSale = freshSales.find((s) => s.id === saleId);
        if (freshSale) {
          setInvoiceSale(freshSale);
          setInvoiceModalOpen(true);
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save sale');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleInvoiceSent(saleId) {
    try {
      await salesApi.markInvoiceSent(saleId);
      const res = await salesApi.getCustomerDetail(id);
      setCustomer(res.data.customer);
      setStats(res.data.stats);
      setSales(res.data.sales || []);
      setPayments(res.data.payments || []);

      if (invoiceSale && invoiceSale.id === saleId) {
        const updated = (res.data.sales || []).find((s) => s.id === saleId);
        if (updated) {
          setInvoiceSale(updated);
        }
      }
    } catch (err) {
      console.error('Failed to mark invoice as sent:', err);
    }
  }

  async function handleShareSale(sale) {
    setSharingInvoice(true);
    try {
      await shareInvoice(sale, customer, sales, payments, handleInvoiceSent);
    } finally {
      setSharingInvoice(false);
    }
  }

  async function handleRecordPayment(e) {
    e.preventDefault();
    const amount = Number(payAmount);
    if (!amount || amount <= 0) {
      return toast.error('Payment amount must be greater than 0');
    }
    if (!payDate) {
      return toast.error('Payment date is required');
    }

    const payload = {
      customerId: id,
      date: payDate,
      amount,
      notes: payNotes,
    };

    setSubmitting(true);
    try {
      if (editingPaymentId) {
        await salesApi.updatePayment(editingPaymentId, payload);
        toast.success('Payment updated successfully');
      } else {
        await salesApi.createPayment(payload);
        toast.success('Payment recorded successfully');
      }
      handleClosePayModal();
      loadCustomerData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save payment');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirmDeleteSale() {
    if (!deleteSaleId) return;
    setSubmitting(true);
    try {
      await salesApi.deleteSale(deleteSaleId);
      toast.success('Sale deleted successfully');
      setDeleteSaleId(null);
      loadCustomerData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete sale');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirmDeletePayment() {
    if (!deletePaymentId) return;
    setSubmitting(true);
    try {
      await salesApi.deletePayment(deletePaymentId);
      toast.success('Payment deleted successfully');
      setDeletePaymentId(null);
      loadCustomerData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete payment');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading && !customer) {
    return <p className="py-8 text-center text-stone-500">Loading customer details...</p>;
  }

  if (!customer) return null;

  const grandTotal = saleItems.reduce((sum, item) => sum + (item.amount || 0), 0);
  const discount = Number(saleDiscountAmount) || 0;
  const finalSale = Math.max(0, grandTotal - discount);
  const totalDue = salePreviousBalance + finalSale;
  const received = Number(saleReceivedAmount) || 0;
  const saleBalance = totalDue - received;

  // 1. Sales filtering and pagination
  const filteredSales = sales.filter((s) => {
    const matchesSearch =
      (s.notes || '').toLowerCase().includes(salesSearch.toLowerCase()) ||
      s.items.some((item) => (item.description || '').toLowerCase().includes(salesSearch.toLowerCase()));
    const matchesOutstanding = !salesOnlyOutstanding || s.balanceAmount > 0;
    return matchesSearch && matchesOutstanding;
  });

  const totalSalesCount = filteredSales.length;
  const totalSalesPages = Math.max(1, Math.ceil(totalSalesCount / PAGE_SIZE));
  const paginatedSales = filteredSales.slice((salesPage - 1) * PAGE_SIZE, salesPage * PAGE_SIZE);

  const salesStartIndex = totalSalesCount === 0 ? 0 : (salesPage - 1) * PAGE_SIZE + 1;
  const salesEndIndex = Math.min(salesPage * PAGE_SIZE, totalSalesCount);

  // 2. Payments filtering and pagination
  const filteredPayments = payments.filter((p) => {
    return (p.notes || '').toLowerCase().includes(paymentsSearch.toLowerCase());
  });

  const totalPaymentsCount = filteredPayments.length;
  const totalPaymentsPages = Math.max(1, Math.ceil(totalPaymentsCount / PAGE_SIZE));
  const paginatedPayments = filteredPayments.slice((paymentsPage - 1) * PAGE_SIZE, paymentsPage * PAGE_SIZE);

  const paymentsStartIndex = totalPaymentsCount === 0 ? 0 : (paymentsPage - 1) * PAGE_SIZE + 1;
  const paymentsEndIndex = Math.min(paymentsPage * PAGE_SIZE, totalPaymentsCount);

  const filteredLedger = ledger.filter((tx) => {
    return (tx.description || '').toLowerCase().includes(ledgerSearch.toLowerCase());
  });
  const totalLedgerCount = filteredLedger.length;
  const totalLedgerPages = Math.max(1, Math.ceil(totalLedgerCount / PAGE_SIZE));
  const paginatedLedger = filteredLedger.slice((ledgerPage - 1) * PAGE_SIZE, ledgerPage * PAGE_SIZE);
  const ledgerStartIndex = totalLedgerCount === 0 ? 0 : (ledgerPage - 1) * PAGE_SIZE + 1;
  const ledgerEndIndex = Math.min(ledgerPage * PAGE_SIZE, totalLedgerCount);

  return (
    <div className="space-y-8 max-w-4xl mx-auto px-1 sm:px-4 py-2">
      {/* Stripe-like Customer Header */}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-stone-200/60">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">{customer.name}</h1>
          <p className="mt-1.5 text-sm text-stone-500 font-semibold flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1">📍 {customer.place}</span>
            <span className="text-stone-300 hidden sm:inline">•</span>
            <span className="inline-flex items-center gap-1">📞 {customer.phone}</span>
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-4 sm:mt-0 sm:flex sm:items-center sm:gap-2 sm:w-auto">
          <div className="col-span-2 sm:col-span-1 sm:w-auto">
            <Link to="/sales/dashboard" className="block w-full">
              <Button
                variant="secondary"
                className="w-full !h-11 !rounded-xl text-sm font-medium gap-2 text-stone-600 hover:text-stone-900 border-stone-200"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            </Link>
          </div>
          <Button
            variant="secondary"
            onClick={() => handleOpenEditModal()}
            className="w-full !h-11 !rounded-xl text-sm font-medium gap-2 text-slate-700 hover:text-slate-900 bg-slate-50 border-slate-200 hover:bg-slate-100"
          >
            <SquarePen className="w-4 h-4" />
            Edit
          </Button>
          <Button
            variant="secondary"
            onClick={() => setStatementModalOpen(true)}
            className="w-full !h-11 !rounded-xl text-sm font-medium gap-2 text-indigo-700 hover:text-indigo-900 bg-indigo-50 border-indigo-100 hover:bg-indigo-100"
          >
            <FileDown className="w-4 h-4" />
            Statement
          </Button>
          <Button
            onClick={() => {
              setSalePreviousBalance(stats?.balance || 0);
              setSaleModalOpen(true);
            }}
            className="w-full !h-11 !rounded-xl text-sm font-medium gap-2 text-white bg-blue-600 hover:bg-blue-700 shadow-sm border-transparent"
          >
            <PlusCircle className="w-4 h-4" />
            Sale
          </Button>
          <Button
            onClick={() => setPayModalOpen(true)}
            className="w-full !h-11 !rounded-xl text-sm font-medium gap-2 text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm border-transparent"
          >
            <Banknote className="w-4 h-4" />
            Payment
          </Button>
        </div>
      </div>

      {/* Prominent Summary cards */}
      {stats && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="p-5 border-stone-200/80 shadow-sm relative overflow-hidden bg-white">
            <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Opening Balance</span>
            <div className="mt-1.5 text-2xl font-black font-mono tracking-tight text-slate-800">
              {formatCurrency(stats.openingBalance)}
            </div>
            <p className="mt-1 text-[11px] text-stone-400 font-medium">Initial outstanding debt</p>
          </Card>

          <Card className="p-5 border-stone-200/80 shadow-sm relative overflow-hidden bg-white">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Total Sales</span>
            <div className="mt-1.5 text-2xl font-black font-mono tracking-tight text-slate-800">
              {formatCurrency(stats.totalSales)}
            </div>
            <p className="mt-1 text-[11px] text-stone-400 font-medium">Cumulative billings value</p>
          </Card>
          
          <Card className="p-5 border-stone-200/80 shadow-sm relative overflow-hidden bg-white">
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Total Paid</span>
            <div className="mt-1.5 text-2xl font-black font-mono tracking-tight text-slate-800">
              {formatCurrency(stats.totalReceived)}
            </div>
            <p className="mt-1 text-[11px] text-stone-400 font-medium">Cumulative receipts value</p>
          </Card>

          <Card className="p-5 border-stone-200/80 shadow-sm relative overflow-hidden bg-white">
            <div className={`absolute top-0 left-0 w-1.5 h-full ${stats.balance > 0 ? 'bg-rose-500' : 'bg-emerald-500'}`} />
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Outstanding Balance</span>
            <div className={`mt-1.5 text-2xl sm:text-3xl font-black font-mono tracking-tight ${stats.balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {formatCurrency(stats.balance)}
            </div>
            <p className="mt-1 text-[11px] text-stone-400 font-medium">Unpaid balance remaining</p>
          </Card>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="space-y-6">
        <div className="flex border-b border-stone-200/60 text-sm font-bold">
          <button
            type="button"
            onClick={() => {
              setActiveTab('sales');
              setActiveDropdownId(null);
            }}
            className={`pb-3 pr-5 border-b-2 transition-all duration-200 ${
              activeTab === 'sales'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-stone-400 hover:text-stone-600'
            }`}
          >
            Sales ({sales.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('payments');
              setActiveDropdownId(null);
            }}
            className={`pb-3 px-5 border-b-2 transition-all duration-200 ${
              activeTab === 'payments'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-stone-400 hover:text-stone-600'
            }`}
          >
            Payments ({payments.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('ledger');
              setActiveDropdownId(null);
            }}
            className={`pb-3 px-5 border-b-2 transition-all duration-200 ${
              activeTab === 'ledger'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-stone-400 hover:text-stone-600'
            }`}
          >
            Ledger ({ledger.length})
          </button>
        </div>

        {/* 1. SALES TAB */}
        {activeTab === 'sales' && (
          <div className="space-y-4">
            {/* Sales Search and Filters */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-stone-50 border border-stone-200/60 p-4 rounded-xl">
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Search by product name or sale notes..."
                  value={salesSearch}
                  onChange={(e) => setSalesSearch(e.target.value)}
                  className="w-full rounded-lg border border-stone-200 p-2 text-sm focus:border-brand-500 focus:outline-none bg-white"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-stone-600 font-extrabold cursor-pointer">
                <input
                  type="checkbox"
                  checked={salesOnlyOutstanding}
                  onChange={(e) => setSalesOnlyOutstanding(e.target.checked)}
                  className="rounded border-stone-300 text-blue-600 focus:ring-blue-500"
                />
                Show Unpaid Sales Only
              </label>
            </div>

            {totalSalesCount === 0 ? (
              <Card className="p-8 text-center border-dashed border-stone-200 bg-stone-50/50">
                <p className="text-stone-500 text-sm">No sales records matched your criteria.</p>
              </Card>
            ) : (
              <>
                {/* Desktop Sales Table */}
                <div className="hidden md:block overflow-x-auto border border-stone-200/80 rounded-xl bg-white">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-stone-200 text-stone-500 bg-stone-50">
                        <th className="p-3 font-semibold">Date</th>
                        <th className="p-3 font-semibold text-right">Grand Total</th>
                        <th className="p-3 font-semibold text-right">Received Amount</th>
                        <th className="p-3 font-semibold text-right">Outstanding Amount</th>
                        <th className="p-3 font-semibold text-center">Items Count</th>
                        <th className="p-3 font-semibold text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedSales.map((sale) => {
                        const isExpanded = !!expandedSales[sale.id];
                        const dropdownId = `sale-${sale.id}`;
                        const showDropdown = activeDropdownId === dropdownId;

                        return (
                          <React.Fragment key={sale.id}>
                            <tr className="border-b border-stone-100 hover:bg-slate-50/50">
                              <td className="p-3 font-mono text-stone-600">{formatDate(sale.date)}</td>
                              <td className="p-3 text-right font-bold text-slate-800">
                                {formatCurrency(sale.finalSaleAmount !== undefined ? sale.finalSaleAmount : sale.totalAmount)}
                              </td>
                              <td className="p-3 text-right font-semibold text-emerald-600">
                                {formatCurrency(sale.receivedAmount)}
                              </td>
                              <td className={`p-3 text-right font-extrabold ${sale.balanceAmount > 0 ? 'text-rose-600' : 'text-slate-500'}`}>
                                {formatCurrency(sale.balanceAmount)}
                              </td>
                              <td className="p-3 text-center text-stone-600">
                                {sale.items?.length || 0}
                              </td>
                              <td className="p-3 text-center">
                                <div className="relative inline-block text-left">
                                  <button
                                    type="button"
                                    onClick={() => toggleDropdown(dropdownId)}
                                    className="flex h-7 w-7 items-center justify-center rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-50 transition-colors"
                                  >
                                    ⋮
                                  </button>
                                  {showDropdown && (
                                    <>
                                      <div className="fixed inset-0 z-30" onClick={() => setActiveDropdownId(null)} />
                                      <div className="absolute right-0 mt-1.5 w-44 rounded-xl border border-stone-200/80 bg-white p-1 shadow-lg z-40 text-left text-xs font-bold divide-y divide-stone-100">
                                        <div className="py-0.5">
                                          <button
                                            onClick={() => {
                                              toggleExpand(sale.id);
                                              setActiveDropdownId(null);
                                            }}
                                            className="flex w-full items-center rounded-lg px-3 py-2 text-stone-700 hover:bg-stone-50"
                                          >
                                            {isExpanded ? 'Hide Details' : 'View Details'}
                                          </button>
                                          <button
                                            onClick={() => {
                                              setInvoiceSale(sale);
                                              setInvoiceModalOpen(true);
                                              setActiveDropdownId(null);
                                            }}
                                            className="flex w-full items-center rounded-lg px-3 py-2 text-blue-600 hover:bg-stone-50"
                                          >
                                            View Invoice 📄
                                          </button>
                                          <button
                                            onClick={() => {
                                              downloadInvoice(sale, customer, sales, payments);
                                              setActiveDropdownId(null);
                                            }}
                                            className="flex w-full items-center rounded-lg px-3 py-2 text-emerald-600 hover:bg-stone-50"
                                          >
                                            Download PDF ⬇️
                                          </button>
                                          <button
                                            onClick={() => {
                                              handleShareSale(sale);
                                              setActiveDropdownId(null);
                                            }}
                                            className="flex w-full items-center rounded-lg px-3 py-2 text-indigo-600 hover:bg-stone-50"
                                          >
                                            Share Invoice 🔗
                                          </button>
                                        </div>
                                        <div className="py-0.5">
                                          <button
                                            onClick={() => {
                                              openEditSale(sale);
                                              setActiveDropdownId(null);
                                            }}
                                            className="flex w-full items-center rounded-lg px-3 py-2 text-amber-600 hover:bg-stone-50"
                                          >
                                            Edit ✏️
                                          </button>
                                          <button
                                            onClick={() => {
                                              setDeleteSaleId(sale.id);
                                              setActiveDropdownId(null);
                                            }}
                                            className="flex w-full items-center rounded-lg px-3 py-2 text-rose-600 hover:bg-rose-50"
                                          >
                                            Delete ✕
                                          </button>
                                        </div>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                            {isExpanded && (
                              <tr className="bg-slate-50/70 border-b border-stone-100">
                                <td colSpan="6" className="p-4">
                                  <div className="space-y-3 pl-4 border-l-2 border-blue-500">
                                    <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400">
                                      Invoice Itemized List
                                    </h4>
                                    <div className="space-y-2 max-w-xl">
                                      {sale.items.map((prod, idx) => (
                                        <div key={idx} className="flex justify-between items-center text-sm py-1 border-b border-slate-200/40 last:border-none">
                                          <div>
                                            <span className="font-bold text-slate-800">{prod.description}</span>
                                            <span className="text-xs text-stone-400 font-medium ml-2">
                                              ({prod.quantity} {prod.unit} × {formatCurrency(prod.rate)})
                                            </span>
                                          </div>
                                          <span className="font-bold text-slate-700 font-mono">
                                            {formatCurrency(prod.amount)}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                    <div className="mt-3 border-t border-slate-200/40 pt-3 text-xs space-y-1.5 max-w-sm">
                                      <div className="flex justify-between items-center text-stone-500 font-medium">
                                        <span>Subtotal:</span>
                                        <span className="font-mono">{formatCurrency(sale.subtotalAmount || sale.totalAmount)}</span>
                                      </div>
                                      {sale.discountAmount > 0 && (
                                        <div className="flex justify-between items-center text-rose-500 font-semibold">
                                          <span>Discount {sale.discountReason ? `(${sale.discountReason})` : ''}:</span>
                                          <span className="font-mono">-{formatCurrency(sale.discountAmount)}</span>
                                        </div>
                                      )}
                                      <div className="flex justify-between items-center text-slate-800 font-bold border-t border-slate-100 pt-1.5">
                                        <span>Final Sale Amount:</span>
                                        <span className="font-mono">{formatCurrency(sale.finalSaleAmount !== undefined ? sale.finalSaleAmount : sale.totalAmount)}</span>
                                      </div>
                                      <div className="flex justify-between items-center text-emerald-600 font-semibold">
                                        <span>Received Amount:</span>
                                        <span className="font-mono">{formatCurrency(sale.receivedAmount)}</span>
                                      </div>
                                      <div className={`flex justify-between items-center font-extrabold border-t border-slate-100 pt-1.5 ${sale.balanceAmount > 0 ? 'text-rose-600' : 'text-slate-500'}`}>
                                        <span>Balance Outstanding:</span>
                                        <span className="font-mono">{formatCurrency(sale.balanceAmount)}</span>
                                      </div>
                                    </div>
                                    {sale.notes && (
                                      <div className="text-xs text-stone-500 italic mt-2 max-w-xl bg-stone-50 p-2.5 rounded-lg border border-stone-100/60">
                                        <span className="font-bold not-italic text-stone-600 mr-1">Sale notes:</span>
                                        {sale.notes}
                                      </div>
                                    )}
                                    {sale.invoiceSentAt ? (
                                      <div className="text-xs text-emerald-600 font-bold mt-2 max-w-xl bg-emerald-50 p-2.5 rounded-lg border border-emerald-100/60 flex items-center gap-1.5 w-fit">
                                        <span>📨</span>
                                        <span>Invoice Sent At: {formatDateTime(sale.invoiceSentAt)}</span>
                                      </div>
                                    ) : (
                                      <div className="text-xs text-stone-500 font-semibold mt-2 max-w-xl bg-stone-50 p-2.5 rounded-lg border border-stone-100/60 flex items-center gap-1.5 w-fit">
                                        <span>📨</span>
                                        <span>Invoice not sent yet</span>
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Sales Cards */}
                <div className="md:hidden space-y-3">
                  {paginatedSales.map((sale) => {
                    const isExpanded = !!expandedSales[sale.id];
                    const dropdownId = `sale-${sale.id}`;
                    const showDropdown = activeDropdownId === dropdownId;

                    return (
                      <div key={sale.id} className="rounded-xl border border-stone-200/80 bg-white p-4 shadow-sm space-y-3 relative">
                        <div className="flex justify-between items-center text-xs text-stone-500">
                          <span className="font-mono">{formatDate(sale.date)}</span>
                          <span className="font-semibold">{sale.items?.length || 0} items</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs text-stone-600">
                          <div>
                            <span className="block text-stone-400">Total</span>
                            <span className="font-bold text-slate-800">{formatCurrency(sale.finalSaleAmount !== undefined ? sale.finalSaleAmount : sale.totalAmount)}</span>
                          </div>
                          <div>
                            <span className="block text-stone-400">Received</span>
                            <span className="font-bold text-emerald-600">{formatCurrency(sale.receivedAmount)}</span>
                          </div>
                          <div className="text-right">
                            <span className="block text-stone-400">Balance</span>
                            <span className={`font-bold ${sale.balanceAmount > 0 ? 'text-rose-600' : 'text-slate-500'}`}>
                              {formatCurrency(sale.balanceAmount)}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center border-t border-slate-50 pt-2">
                          {sale.notes ? (
                            <span className="text-[11px] text-stone-400 italic truncate max-w-[150px]" title={sale.notes}>
                              {sale.notes}
                            </span>
                          ) : <span />}
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => toggleDropdown(dropdownId)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg text-stone-400 hover:text-stone-600"
                            >
                              ⋮
                            </button>
                            {showDropdown && (
                              <>
                                <div className="fixed inset-0 z-30" onClick={() => setActiveDropdownId(null)} />
                                <div className="absolute right-4 mt-8 w-44 rounded-xl border border-stone-200/80 bg-white p-1 shadow-lg z-40 text-left text-xs font-bold divide-y divide-stone-100">
                                  <div className="py-0.5">
                                    <button
                                      onClick={() => {
                                        toggleExpand(sale.id);
                                        setActiveDropdownId(null);
                                      }}
                                      className="flex w-full items-center rounded-lg px-3 py-2 text-stone-700 hover:bg-stone-50"
                                    >
                                      {isExpanded ? 'Hide Details' : 'View Details'}
                                    </button>
                                    <button
                                      onClick={() => {
                                        setInvoiceSale(sale);
                                        setInvoiceModalOpen(true);
                                        setActiveDropdownId(null);
                                      }}
                                      className="flex w-full items-center rounded-lg px-3 py-2 text-blue-600 hover:bg-stone-50"
                                    >
                                      View Invoice 📄
                                    </button>
                                    <button
                                      onClick={() => {
                                        downloadInvoice(sale, customer, sales, payments);
                                        setActiveDropdownId(null);
                                      }}
                                      className="flex w-full items-center rounded-lg px-3 py-2 text-emerald-600 hover:bg-stone-50"
                                    >
                                      Download PDF ⬇️
                                    </button>
                                    <button
                                      onClick={() => {
                                        handleShareSale(sale);
                                        setActiveDropdownId(null);
                                      }}
                                      className="flex w-full items-center rounded-lg px-3 py-2 text-indigo-600 hover:bg-stone-50"
                                    >
                                      Share Invoice 🔗
                                    </button>
                                  </div>
                                  <div className="py-0.5">
                                    <button
                                      onClick={() => {
                                        openEditSale(sale);
                                        setActiveDropdownId(null);
                                      }}
                                      className="flex w-full items-center rounded-lg px-3 py-2 text-amber-600 hover:bg-stone-50"
                                    >
                                      Edit ✏️
                                    </button>
                                    <button
                                      onClick={() => {
                                        setDeleteSaleId(sale.id);
                                        setActiveDropdownId(null);
                                      }}
                                      className="flex w-full items-center rounded-lg px-3 py-2 text-rose-600 hover:bg-rose-50"
                                    >
                                      Delete ✕
                                    </button>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="space-y-2 mt-2 pt-2 border-t border-slate-100 pl-2 border-l-2 border-blue-500 text-xs">
                            {sale.items.map((item, idx) => (
                              <div key={idx} className="flex justify-between items-center py-1">
                                <div>
                                  <div className="font-bold text-slate-800">{item.description}</div>
                                  <div className="text-[10px] text-stone-500">
                                    {item.quantity} {item.unit} × {formatCurrency(item.rate)}
                                  </div>
                                </div>
                                <span className="font-semibold text-slate-700">{formatCurrency(item.amount)}</span>
                              </div>
                            ))}
                            <div className="mt-3 border-t border-slate-100 pt-2.5 text-[11px] space-y-1.5">
                              <div className="flex justify-between items-center text-stone-500 font-medium">
                                <span>Subtotal:</span>
                                <span className="font-mono">{formatCurrency(sale.subtotalAmount || sale.totalAmount)}</span>
                              </div>
                              {sale.discountAmount > 0 && (
                                <div className="flex justify-between items-center text-rose-500 font-semibold">
                                  <span>Discount {sale.discountReason ? `(${sale.discountReason})` : ''}:</span>
                                  <span className="font-mono">-{formatCurrency(sale.discountAmount)}</span>
                                </div>
                              )}
                              <div className="flex justify-between items-center text-slate-800 font-bold border-t border-slate-50 pt-1">
                                <span>Final Sale Amount:</span>
                                <span className="font-mono">{formatCurrency(sale.finalSaleAmount !== undefined ? sale.finalSaleAmount : sale.totalAmount)}</span>
                              </div>
                              <div className="flex justify-between items-center text-emerald-600 font-semibold">
                                <span>Received Amount:</span>
                                <span className="font-mono">{formatCurrency(sale.receivedAmount)}</span>
                              </div>
                              <div className={`flex justify-between items-center font-extrabold border-t border-slate-50 pt-1 ${sale.balanceAmount > 0 ? 'text-rose-600' : 'text-stone-500'}`}>
                                <span>Balance Outstanding:</span>
                                <span className="font-mono">{formatCurrency(sale.balanceAmount)}</span>
                              </div>
                            </div>
                            <div className="pt-2 border-t border-slate-100">
                              {sale.invoiceSentAt ? (
                                <div className="text-[10px] text-emerald-600 font-bold bg-emerald-50 p-1.5 rounded border border-emerald-100/60 flex items-center gap-1">
                                  <span>📨</span>
                                  <span>Sent: {formatDateTime(sale.invoiceSentAt)}</span>
                                </div>
                              ) : (
                                <div className="text-[10px] text-stone-500 font-semibold bg-stone-50 p-1.5 rounded border border-stone-100/60 flex items-center gap-1">
                                  <span>📨</span>
                                  <span>Not sent yet</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Sales Pagination Footer */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-stone-200/60 pt-4 text-sm font-semibold text-stone-500">
                  <span>
                    Showing {salesStartIndex}–{salesEndIndex} of {totalSalesCount} sales
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={salesPage === 1}
                      onClick={() => setSalesPage((p) => p - 1)}
                      className="border-stone-200"
                    >
                      Previous
                    </Button>
                    <span className="px-2">
                      Page {salesPage} of {totalSalesPages}
                    </span>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={salesPage === totalSalesPages}
                      onClick={() => setSalesPage((p) => p + 1)}
                      className="border-stone-200"
                    >
                      Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
        )}

        {/* 2. PAYMENTS TAB */}
        {activeTab === 'payments' && (
          <div className="space-y-4">
            {/* Payments Filters */}
            <div className="flex bg-stone-50 border border-stone-200/60 p-4 rounded-xl">
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Search by payment notes..."
                  value={paymentsSearch}
                  onChange={(e) => setPaymentsSearch(e.target.value)}
                  className="w-full rounded-lg border border-stone-200 p-2 text-sm focus:border-brand-500 focus:outline-none bg-white"
                />
              </div>
            </div>

            {totalPaymentsCount === 0 ? (
              <Card className="p-8 text-center border-dashed border-stone-200 bg-stone-50/50">
                <p className="text-stone-500 text-sm">No payment records matched your search.</p>
              </Card>
            ) : (
              <>
                {/* Desktop Payments Table */}
                <div className="hidden md:block overflow-x-auto border border-stone-200/80 rounded-xl bg-white">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-stone-200 text-stone-500 bg-stone-50">
                        <th className="p-3 font-semibold">Date</th>
                        <th className="p-3 font-semibold text-right">Amount</th>
                        <th className="p-3 font-semibold">Notes</th>
                        <th className="p-3 font-semibold text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedPayments.map((p) => {
                        const dropdownId = `payment-${p.id}`;
                        const showDropdown = activeDropdownId === dropdownId;

                        return (
                          <tr key={p.id} className="border-b border-stone-100 hover:bg-slate-50/50">
                            <td className="p-3 font-mono text-stone-600">{formatDate(p.date)}</td>
                            <td className="p-3 text-right font-bold text-emerald-600">
                              {formatCurrency(p.amount)}
                            </td>
                            <td className="p-3 text-stone-600">{p.notes || '—'}</td>
                            <td className="p-3 text-center">
                              <div className="relative inline-block text-left">
                                <button
                                  type="button"
                                  onClick={() => toggleDropdown(dropdownId)}
                                  className="flex h-7 w-7 items-center justify-center rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-50 transition-colors"
                                >
                                  ⋮
                                </button>
                                {showDropdown && (
                                  <>
                                    <div className="fixed inset-0 z-30" onClick={() => setActiveDropdownId(null)} />
                                    <div className="absolute right-0 mt-1.5 w-40 rounded-xl border border-stone-200/80 bg-white p-1 shadow-lg z-40 text-left text-xs font-bold divide-y divide-stone-100">
                                      <div className="py-0.5">
                                        <button
                                          onClick={() => {
                                            openEditPayment(p);
                                            setActiveDropdownId(null);
                                          }}
                                          className="flex w-full items-center rounded-lg px-3 py-2 text-amber-600 hover:bg-stone-50"
                                        >
                                          Edit ✏️
                                        </button>
                                      </div>
                                      <div className="py-0.5">
                                        <button
                                          onClick={() => {
                                            setDeletePaymentId(p.id);
                                            setActiveDropdownId(null);
                                          }}
                                          className="flex w-full items-center rounded-lg px-3 py-2 text-rose-600 hover:bg-rose-50"
                                        >
                                          Delete ✕
                                        </button>
                                      </div>
                                    </div>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Payments Cards */}
                <div className="md:hidden space-y-3">
                  {paginatedPayments.map((p) => {
                    const dropdownId = `payment-${p.id}`;
                    const showDropdown = activeDropdownId === dropdownId;

                    return (
                      <div key={p.id} className="rounded-xl border border-stone-200/80 bg-white p-4 shadow-sm flex justify-between items-center relative">
                        <div>
                          <span className="block text-xs font-mono text-stone-500">{formatDate(p.date)}</span>
                          <span className="text-sm text-stone-600 mt-1 block">{p.notes || 'Payment'}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-emerald-600 text-base">{formatCurrency(p.amount)}</span>
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => toggleDropdown(dropdownId)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg text-stone-400 hover:text-stone-600"
                            >
                              ⋮
                            </button>
                            {showDropdown && (
                              <>
                                <div className="fixed inset-0 z-30" onClick={() => setActiveDropdownId(null)} />
                                <div className="absolute right-0 mt-1.5 w-40 rounded-xl border border-stone-200/80 bg-white p-1 shadow-lg z-40 text-left text-xs font-bold divide-y divide-stone-100">
                                  <div className="py-0.5">
                                    <button
                                      onClick={() => {
                                        openEditPayment(p);
                                        setActiveDropdownId(null);
                                      }}
                                      className="flex w-full items-center rounded-lg px-3 py-2 text-amber-600 hover:bg-stone-50"
                                    >
                                      Edit ✏️
                                    </button>
                                  </div>
                                  <div className="py-0.5">
                                    <button
                                      onClick={() => {
                                        setDeletePaymentId(p.id);
                                        setActiveDropdownId(null);
                                      }}
                                      className="flex w-full items-center rounded-lg px-3 py-2 text-rose-600 hover:bg-rose-50"
                                    >
                                      Delete ✕
                                    </button>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Payments Pagination Footer */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-stone-200/60 pt-4 text-sm font-semibold text-stone-500">
                  <span>
                    Showing {paymentsStartIndex}–{paymentsEndIndex} of {totalPaymentsCount} payments
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={paymentsPage === 1}
                      onClick={() => setPaymentsPage((p) => p - 1)}
                      className="border-stone-200"
                    >
                      Previous
                    </Button>
                    <span className="px-2">
                      Page {paymentsPage} of {totalPaymentsPages}
                    </span>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={paymentsPage === totalPaymentsPages}
                      onClick={() => setPaymentsPage((p) => p + 1)}
                      className="border-stone-200"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* 3. LEDGER TAB */}
        {activeTab === 'ledger' && (
          <div className="space-y-4">
            {/* Ledger Filters */}
            <div className="flex bg-stone-50 border border-stone-200/60 p-4 rounded-xl">
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Search ledger description..."
                  value={ledgerSearch}
                  onChange={(e) => setLedgerSearch(e.target.value)}
                  className="w-full rounded-lg border border-stone-200 p-2 text-sm focus:border-brand-500 focus:outline-none bg-white"
                />
              </div>
            </div>

            {totalLedgerCount === 0 ? (
              <Card className="p-8 text-center border-dashed border-stone-200 bg-stone-50/50">
                <p className="text-stone-500 text-sm">No ledger records matched your search.</p>
              </Card>
            ) : (
              <>
                {/* Desktop Ledger Table */}
                <div className="hidden md:block overflow-x-auto border border-stone-200/80 rounded-xl bg-white">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-stone-200 text-stone-500 bg-stone-50">
                        <th className="p-3 font-semibold">Date</th>
                        <th className="p-3 font-semibold">Type</th>
                        <th className="p-3 font-semibold">Description</th>
                        <th className="p-3 font-semibold text-right">Amount</th>
                        <th className="p-3 font-semibold text-right">Running Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedLedger.map((tx) => {
                        return (
                          <tr key={tx.id} className="border-b border-stone-100 hover:bg-slate-50/50">
                            <td className="p-3 font-mono text-stone-600">{formatDate(tx.date)}</td>
                            <td className="p-3">
                              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${
                                tx.type === 'opening-balance'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
                                  : tx.type === 'sale'
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200/60'
                                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                              }`}>
                                {tx.type === 'opening-balance' ? 'Opening Balance' : tx.type === 'sale' ? 'Sale' : 'Payment'}
                              </span>
                            </td>
                            <td className="p-3 text-stone-600">{tx.description}</td>
                            <td className={`p-3 text-right font-bold ${
                              tx.type === 'payment' ? 'text-emerald-600' : 'text-slate-800'
                            }`}>
                              {tx.type === 'payment' ? '-' : '+'}{formatCurrency(tx.amount || tx.totalAmount || 0)}
                            </td>
                            <td className="p-3 text-right font-mono font-extrabold text-slate-800">
                              {formatCurrency(tx.balance)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Ledger Cards */}
                <div className="md:hidden space-y-3">
                  {paginatedLedger.map((tx) => (
                    <div key={tx.id} className="rounded-xl border border-stone-200/80 bg-white p-4 shadow-sm space-y-2.5">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-mono text-stone-500">{formatDate(tx.date)}</span>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          tx.type === 'opening-balance'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
                            : tx.type === 'sale'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200/60'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                        }`}>
                          {tx.type === 'opening-balance' ? 'Opening Balance' : tx.type === 'sale' ? 'Sale' : 'Payment'}
                        </span>
                      </div>
                      <div className="text-sm text-stone-600 font-medium">{tx.description}</div>
                      <div className="flex justify-between items-center border-t border-slate-50 pt-2 text-xs">
                        <div>
                          <span className="text-stone-400 block text-[10px] uppercase font-bold">Amount</span>
                          <span className={`font-bold ${tx.type === 'payment' ? 'text-emerald-600' : 'text-slate-700'}`}>
                            {tx.type === 'payment' ? '-' : '+'}{formatCurrency(tx.amount || tx.totalAmount || 0)}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-stone-400 block text-[10px] uppercase font-bold">Running Balance</span>
                          <span className="font-extrabold text-slate-800">{formatCurrency(tx.balance)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Ledger Pagination Footer */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-stone-200/60 pt-4 text-sm font-semibold text-stone-500">
                  <span>
                    Showing {ledgerStartIndex}–{ledgerEndIndex} of {totalLedgerCount} entries
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={ledgerPage === 1}
                      onClick={() => setLedgerPage((p) => p - 1)}
                      className="border-stone-200"
                    >
                      Previous
                    </Button>
                    <span className="px-2">
                      Page {ledgerPage} of {totalLedgerPages}
                    </span>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={ledgerPage === totalLedgerPages}
                      onClick={() => setLedgerPage((p) => p + 1)}
                      className="border-stone-200"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Add / Edit Sale Modal */}
      <Modal
        open={saleModalOpen}
        onClose={handleCloseSaleModal}
        title={editingSaleId ? 'Edit Sale' : 'Add Sale'}
        size="xl"
      >
        <form onSubmit={handleRecordSale} className="space-y-5">
          <Input
            label="Sale Date"
            type="date"
            value={saleDate}
            onChange={(e) => setSaleDate(e.target.value)}
            required
            disabled={submitting}
          />

          {/* Items Row Editor */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">Items List</h3>
              <Button
                type="button"
                size="sm"
                onClick={handleAddRow}
                disabled={submitting}
                className="bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/50 font-bold text-xs"
              >
                ➕ Add Another Item
              </Button>
            </div>

            <div className="overflow-x-auto border border-stone-200/80 rounded-xl max-h-72">
              <table className="w-full text-left text-sm border-collapse min-w-[650px]">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-400 bg-stone-50 text-xs">
                    <th className="p-2.5 font-bold uppercase tracking-wider w-2/5">Description</th>
                    <th className="p-2.5 font-bold uppercase tracking-wider w-24">Unit</th>
                    <th className="p-2.5 font-bold uppercase tracking-wider w-24 text-right">Quantity</th>
                    <th className="p-2.5 font-bold uppercase tracking-wider w-24 text-right">Rate (₹)</th>
                    <th className="p-2.5 font-bold uppercase tracking-wider w-28 text-right">Amount</th>
                    <th className="p-2.5 font-bold uppercase tracking-wider text-center w-12">Delete</th>
                  </tr>
                </thead>
                <tbody>
                  {saleItems.map((item, idx) => (
                    <tr key={idx} className="border-b border-stone-100 py-1">
                      <td className="p-2">
                        <input
                          type="text"
                          list="sale-description-suggestions"
                          className="w-full rounded-lg border border-stone-200 p-1.5 text-sm focus:border-brand-500 focus:outline-none"
                          placeholder="e.g. 3g 1st"
                          value={item.description}
                          onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                          required
                          disabled={submitting}
                        />
                      </td>

                      <td className="p-2">
                        <select
                          value={item.unit}
                          onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                          className="w-full rounded-lg border border-stone-200 p-1.5 text-sm focus:border-brand-500 focus:outline-none bg-white"
                          disabled={submitting}
                        >
                          <option value="KG">KG</option>
                          <option value="Packet">Packet</option>
                        </select>
                      </td>

                      <td className="p-2">
                        <input
                          type="number"
                          className="w-full rounded-lg border border-stone-200 p-1.5 text-right text-sm focus:border-brand-500 focus:outline-none"
                          placeholder="0"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                          required
                          disabled={submitting}
                          min="0.01"
                          step="any"
                        />
                      </td>

                      <td className="p-2">
                        <input
                          type="number"
                          className="w-full rounded-lg border border-stone-200 p-1.5 text-right text-sm focus:border-brand-500 focus:outline-none"
                          placeholder="0"
                          value={item.rate}
                          onChange={(e) => handleItemChange(idx, 'rate', e.target.value)}
                          required
                          disabled={submitting}
                          min="0.01"
                          step="any"
                        />
                      </td>

                      <td className="p-2 text-right font-mono font-bold text-slate-800">
                        {formatCurrency(item.amount)}
                      </td>

                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(idx)}
                          disabled={saleItems.length === 1 || submitting}
                          className="text-stone-400 hover:text-rose-600 disabled:opacity-30"
                          title="Remove item"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <datalist id="sale-description-suggestions">
              <option value="3g 1st" />
              <option value="5g 2nd" />
              <option value="20 Rs Packet (1st)" />
              <option value="50 Rs Packet (1st)" />
              <option value="Special Hotel Pappadam" />
              <option value="Custom Product" />
            </datalist>
          </div>

          {/* Calculations Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-stone-200 pt-4">
            <div className="flex flex-col space-y-1">
              <label className="text-xs font-semibold text-stone-600">Sale Notes (Optional)</label>
              <textarea
                className="rounded-lg border border-stone-200 p-2 text-sm focus:border-brand-500 focus:outline-none"
                rows="3"
                placeholder="e.g. Delivered directly..."
                value={saleNotes}
                onChange={(e) => setSaleNotes(e.target.value)}
                disabled={submitting}
              />
            </div>

            <div className="bg-stone-50 border border-stone-200/80 rounded-xl p-3.5 space-y-2.5 text-sm">
              <div className="flex justify-between items-center text-slate-600">
                <span className="font-medium text-xs uppercase tracking-wider">Previous Balance:</span>
                <span className="font-mono font-bold text-slate-800">{formatCurrency(salePreviousBalance)}</span>
              </div>

              <div className="flex justify-between items-center text-slate-600 border-t border-stone-200/40 pt-2">
                <span className="font-medium text-xs uppercase tracking-wider">Subtotal Amount:</span>
                <span className="font-mono font-bold text-slate-800">{formatCurrency(grandTotal)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-stone-600 font-medium text-xs uppercase tracking-wider">Discount:</span>
                <div className="w-32">
                  <input
                    type="number"
                    placeholder="0"
                    className="w-full rounded-lg border border-stone-200 p-1.5 text-right text-sm focus:border-brand-500 focus:outline-none font-mono"
                    value={saleDiscountAmount}
                    onChange={(e) => setSaleDiscountAmount(e.target.value)}
                    disabled={submitting}
                    min="0"
                    max={grandTotal}
                    step="any"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-stone-600 font-medium text-xs uppercase tracking-wider">Discount Reason:</span>
                <div className="w-48">
                  <input
                    type="text"
                    placeholder="e.g. Rounding"
                    className="w-full rounded-lg border border-stone-200 p-1.5 text-right text-sm focus:border-brand-500 focus:outline-none"
                    value={saleDiscountReason}
                    onChange={(e) => setSaleDiscountReason(e.target.value)}
                    disabled={submitting}
                  />
                </div>
              </div>

              <div className="flex justify-between items-center text-slate-600 border-t border-stone-200/40 pt-2">
                <span className="font-medium text-xs uppercase tracking-wider">Final Sale Amount:</span>
                <span className="font-mono font-black text-slate-800">{formatCurrency(finalSale)}</span>
              </div>

              <div className="flex justify-between items-center text-slate-800 font-bold border-t border-stone-200/40 pt-2">
                <span className="text-xs uppercase tracking-wider">Total Due:</span>
                <span className="font-mono text-base">{formatCurrency(totalDue)}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-stone-600 font-medium text-xs uppercase tracking-wider">Received Amount:</span>
                <div className="w-32">
                  <input
                    type="number"
                    placeholder="0"
                    className="w-full rounded-lg border border-stone-200 p-1.5 text-right text-sm focus:border-brand-500 focus:outline-none font-mono"
                    value={saleReceivedAmount}
                    onChange={(e) => setSaleReceivedAmount(e.target.value)}
                    disabled={submitting}
                    min="0"
                    step="any"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center font-extrabold border-t border-stone-200/60 pt-2.5 text-slate-900">
                <span className="text-xs uppercase tracking-wider">Balance After Payment:</span>
                <span className={`font-mono text-base ${saleBalance > 0 ? 'text-rose-600' : 'text-slate-500'}`}>{formatCurrency(saleBalance)}</span>
              </div>
            </div>
          </div>

          <div className="btn-stack border-t border-stone-100 pt-4">
            <Button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold"
            >
              {submitting ? 'Saving...' : editingSaleId ? 'Save Changes' : 'Save Sale'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={handleCloseSaleModal}
              disabled={submitting}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add / Edit Payment Modal */}
      <Modal
        open={payModalOpen}
        onClose={handleClosePayModal}
        title={editingPaymentId ? 'Edit Payment' : 'Add Payment'}
      >
        <form onSubmit={handleRecordPayment} className="space-y-4">
          <Input
            label="Payment Amount (INR)"
            type="number"
            placeholder="Enter payment amount"
            value={payAmount}
            onChange={(e) => setPayAmount(e.target.value)}
            required
            disabled={submitting}
            min="0.01"
            step="any"
          />
          <Input
            label="Payment Date"
            type="date"
            value={payDate}
            onChange={(e) => setPayDate(e.target.value)}
            required
            disabled={submitting}
          />
          <div className="flex flex-col space-y-1">
            <label className="text-xs font-semibold text-stone-600">Notes / Method (Optional)</label>
            <input
              type="text"
              list="payment-notes-suggestions"
              className="rounded-lg border border-stone-200 p-2 text-sm focus:border-brand-500 focus:outline-none"
              placeholder="e.g. Cash"
              value={payNotes}
              onChange={(e) => setPayNotes(e.target.value)}
              disabled={submitting}
            />
            <datalist id="payment-notes-suggestions">
              <option value="Cash" />
              <option value="Bank Transfer" />
              <option value="Cheque" />
            </datalist>
          </div>
          <div className="btn-stack pt-2">
            <Button
              type="submit"
              disabled={submitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold"
            >
              {submitting ? 'Saving...' : editingPaymentId ? 'Save Changes' : 'Save Payment'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={handleClosePayModal}
              disabled={submitting}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Sale Confirmation Modal */}
      <Modal
        open={deleteSaleId !== null}
        onClose={() => setDeleteSaleId(null)}
        title="Confirm Sale Deletion"
      >
        <div className="space-y-4">
          <p className="text-sm text-stone-600 leading-relaxed font-semibold">
            Deleting this sale will update the customer's balance and ledger history. Continue?
          </p>
          <div className="btn-stack pt-2">
            <Button
              onClick={handleConfirmDeleteSale}
              disabled={submitting}
              className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-sm"
            >
              {submitting ? 'Deleting...' : 'Delete'}
            </Button>
            <Button
              variant="secondary"
              onClick={() => setDeleteSaleId(null)}
              disabled={submitting}
              className="font-bold text-sm"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Payment Confirmation Modal */}
      <Modal
        open={deletePaymentId !== null}
        onClose={() => setDeletePaymentId(null)}
        title="Confirm Payment Deletion"
      >
        <div className="space-y-4">
          <p className="text-sm text-stone-600 leading-relaxed font-semibold">
            Deleting this payment will update the customer's balance and ledger history. Continue?
          </p>
          <div className="btn-stack pt-2">
            <Button
              onClick={handleConfirmDeletePayment}
              disabled={submitting}
              className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-sm"
            >
              {submitting ? 'Deleting...' : 'Delete'}
            </Button>
            <Button
              variant="secondary"
              onClick={() => setDeletePaymentId(null)}
              disabled={submitting}
              className="font-bold text-sm"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Invoice Preview & Action Modal */}
      <Modal
        open={invoiceModalOpen}
        onClose={() => {
          setInvoiceModalOpen(false);
          setInvoiceSale(null);
        }}
        title={invoiceSale ? `Invoice Preview — ${getInvoiceNumber(invoiceSale, sales)}` : 'Invoice Preview'}
        size="lg"
      >
        {invoiceSale && (
          <div className="space-y-6">
            {/* Header info */}
            <div className="flex justify-between items-start border-b border-stone-200/60 pb-4">
              <div>
                <h3 className="font-extrabold text-blue-600 text-lg">DIAMOND PAPPADAM</h3>
                <p className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Quality Pappadam Manufacturers</p>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-stone-500">Invoice Date</span>
                <p className="font-mono text-sm font-bold text-slate-800">{formatDate(invoiceSale.date)}</p>
              </div>
            </div>

            {/* Billed to info */}
            <div className="bg-slate-50 border border-slate-200/50 rounded-xl p-4 text-sm space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Billed To:</span>
              <p className="font-extrabold text-slate-800 text-base">{customer.name}</p>
              <p className="text-stone-500 font-medium">📍 {customer.place} | 📞 {customer.phone}</p>
            </div>

            {/* Itemized List */}
            <div className="space-y-2.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Items:</span>
              <div className="overflow-x-auto border border-stone-200/80 rounded-xl bg-white">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-stone-200 text-stone-500 bg-stone-50 text-xs">
                      <th className="p-2.5 font-bold">Description</th>
                      <th className="p-2.5 font-bold text-center">Unit</th>
                      <th className="p-2.5 font-bold text-right">Qty</th>
                      <th className="p-2.5 font-bold text-right">Rate</th>
                      <th className="p-2.5 font-bold text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoiceSale.items?.map((item, idx) => (
                      <tr key={idx} className="border-b border-stone-100 last:border-none hover:bg-slate-50/20">
                        <td className="p-2.5 font-bold text-slate-800">{item.description}</td>
                        <td className="p-2.5 text-center text-stone-600">{item.unit}</td>
                        <td className="p-2.5 text-right font-mono text-stone-600">{Number(item.quantity).toFixed(2)}</td>
                        <td className="p-2.5 text-right font-mono text-stone-600">{formatCurrency(item.rate)}</td>
                        <td className="p-2.5 text-right font-mono font-bold text-slate-800">{formatCurrency(item.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Ledger summary block & Notes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-3">
                {invoiceSale.notes ? (
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Notes:</span>
                    <div className="text-xs text-stone-600 italic bg-stone-50 border border-stone-100 p-3 rounded-xl max-h-32 overflow-y-auto">
                      {invoiceSale.notes}
                    </div>
                  </div>
                ) : (
                  <div className="h-10 flex items-center text-xs text-stone-400 italic">No notes recorded for this transaction.</div>
                )}
                
                {/* Invoice Sent At Info */}
                <div className="pt-2">
                  {invoiceSale.invoiceSentAt ? (
                    <div className="text-xs text-emerald-600 font-bold bg-emerald-50/60 p-2.5 rounded-lg border border-emerald-100/60 flex items-center gap-1.5 w-fit">
                      <span>📨</span>
                      <span>Invoice Sent: {formatDateTime(invoiceSale.invoiceSentAt)}</span>
                    </div>
                  ) : (
                    <div className="text-xs text-stone-400 font-semibold bg-stone-50 p-2.5 rounded-lg border border-stone-100/60 flex items-center gap-1.5 w-fit">
                      <span>📨</span>
                      <span>Invoice not shared yet</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Financial summary calculations */}
              {(() => {
                const subtotal = invoiceSale.subtotalAmount || invoiceSale.totalAmount || 0;
                const discount = invoiceSale.discountAmount || 0;
                const finalSale = invoiceSale.finalSaleAmount !== undefined ? invoiceSale.finalSaleAmount : (subtotal - discount);
                const prevBalance = invoiceSale.previousBalance || 0;
                const totalDue = prevBalance + finalSale;
                const received = invoiceSale.receivedAmount || 0;
                const currentBalance = invoiceSale.balanceAfterSale !== undefined ? invoiceSale.balanceAfterSale : (finalSale - received);
                return (
                  <div className="bg-stone-50 border border-stone-200/80 rounded-xl p-4 space-y-2.5 text-sm font-semibold text-stone-600">
                    <div className="flex justify-between items-center">
                      <span>Subtotal Amount:</span>
                      <span className="font-mono text-slate-800 font-bold">{formatCurrency(subtotal)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between items-center text-rose-500">
                        <span>Discount {invoiceSale.discountReason ? `(${invoiceSale.discountReason})` : ''}:</span>
                        <span className="font-mono font-bold">-{formatCurrency(discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center border-t border-stone-200/40 pt-2">
                      <span>Net Sale Amount:</span>
                      <span className="font-mono text-slate-800 font-bold">{formatCurrency(finalSale)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Previous Outstanding:</span>
                      <span className="font-mono text-slate-800 font-bold">{formatCurrency(prevBalance)}</span>
                    </div>
                    <div className="flex justify-between items-center font-bold text-slate-800 border-t border-stone-200/40 pt-2">
                      <span>Total Due:</span>
                      <span className="font-mono text-base font-extrabold">{formatCurrency(totalDue)}</span>
                    </div>
                    <div className="flex justify-between items-center text-emerald-600">
                      <span>Amount Received:</span>
                      <span className="font-mono font-bold">{formatCurrency(received)}</span>
                    </div>
                    <div className={`flex justify-between items-center font-black border-t border-stone-200/60 pt-2.5 ${currentBalance > 0 ? 'text-rose-600 bg-rose-50/50 p-2 rounded-lg' : 'text-emerald-600 bg-emerald-50/50 p-2 rounded-lg'}`}>
                      <span>Current Balance:</span>
                      <span className="font-mono text-lg">{formatCurrency(currentBalance)}</span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Modal Buttons */}
            <div className="btn-stack border-t border-stone-100 pt-4 flex flex-col gap-2.5 sm:flex-row sm:justify-end">
              <Button
                type="button"
                onClick={() => handleShareSale(invoiceSale)}
                disabled={sharingInvoice}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold flex items-center justify-center gap-1.5 shadow-sm text-sm"
              >
                {sharingInvoice ? (
                  <>
                    <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    Sharing...
                  </>
                ) : (
                  <>
                    <span>🔗</span>
                    Share Invoice
                  </>
                )}
              </Button>
              <Button
                type="button"
                onClick={() => downloadInvoice(invoiceSale, customer, sales, payments)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold flex items-center justify-center gap-1.5 shadow-sm text-sm"
              >
                <span>⬇️</span>
                Download Invoice PDF
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setInvoiceModalOpen(false);
                  setInvoiceSale(null);
                }}
                className="font-bold border-stone-200 text-sm"
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Customer Modal */}
      <Modal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Customer Profile"
      >
        <form onSubmit={handleUpdateCustomer} className="space-y-4">
          <Input
            label="Customer Name"
            placeholder="Enter customer's full name"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            required
            disabled={submitting}
          />
          <Input
            label="Phone Number"
            type="tel"
            placeholder="e.g. 9876543210"
            value={editPhone}
            onChange={(e) => setEditPhone(e.target.value)}
            required
            disabled={submitting}
          />
          <Input
            label="Place / Region"
            placeholder="e.g. Kozhikode"
            value={editPlace}
            onChange={(e) => setEditPlace(e.target.value)}
            required
            disabled={submitting}
          />
          <Input
            label="Opening Balance"
            type="number"
            min="0"
            step="any"
            placeholder="Enter previous outstanding amount"
            value={editOpeningBalance}
            onChange={(e) => setEditOpeningBalance(e.target.value)}
            disabled={submitting}
          />
          <div className="flex flex-col space-y-1">
            <label className="text-xs font-semibold text-stone-600">Notes (Optional)</label>
            <textarea
              className="rounded-lg border border-stone-200 p-2 text-sm focus:border-brand-500 focus:outline-none"
              rows="3"
              placeholder="Add extra details..."
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              disabled={submitting}
            />
          </div>
          <div className="btn-stack pt-2">
            <Button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setEditModalOpen(false)}
              disabled={submitting}
              className="border-stone-200 text-stone-600 font-bold"
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {/* Download Customer Statement Modal */}
      <Modal
        open={statementModalOpen}
        onClose={() => setStatementModalOpen(false)}
        title="Download Customer Statement"
      >
        <form onSubmit={handleDownloadStatement} className="space-y-5">
          {/* Quick Filters */}
          <div>
            <label className="text-xs font-semibold text-stone-600 block mb-2">
              Quick Filters
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Button
                type="button"
                variant="secondary"
                className="text-xs py-1.5 px-3 font-semibold border-stone-200 hover:bg-stone-50"
                onClick={() => applyQuickFilter('this-month')}
              >
                This Month
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="text-xs py-1.5 px-3 font-semibold border-stone-200 hover:bg-stone-50"
                onClick={() => applyQuickFilter('last-month')}
              >
                Last Month
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="text-xs py-1.5 px-3 font-semibold border-stone-200 hover:bg-stone-50"
                onClick={() => applyQuickFilter('last-3-months')}
              >
                Last 3 Months
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="text-xs py-1.5 px-3 font-semibold border-stone-200 hover:bg-stone-50"
                onClick={() => applyQuickFilter('this-year')}
              >
                This Year
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="From Date"
              type="date"
              value={statementFromDate}
              onChange={(e) => setStatementFromDate(e.target.value)}
              required
              disabled={statementDownloading}
            />
            <Input
              label="To Date"
              type="date"
              value={statementToDate}
              onChange={(e) => setStatementToDate(e.target.value)}
              required
              disabled={statementDownloading}
            />
          </div>

          <div className="btn-stack border-t border-stone-100 pt-4 flex flex-col gap-2.5 sm:flex-row sm:justify-end">
            <Button
              type="submit"
              disabled={statementDownloading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold flex items-center justify-center gap-1.5 shadow-sm text-sm"
            >
              {statementDownloading ? (
                <>
                  <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  Generating...
                </>
              ) : (
                'Download PDF'
              )}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setStatementModalOpen(false)}
              disabled={statementDownloading}
              className="font-bold border-stone-200 text-sm"
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
