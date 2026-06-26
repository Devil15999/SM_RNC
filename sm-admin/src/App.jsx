import React, { useState, useEffect, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  LineElement,
  PointElement
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  CreditCard,
  LogOut,
  Search,
  Trash2,
  Edit,
  X,
  Phone,
  Key,
  Calendar,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Package,
  Menu,
  Briefcase,
  MapPin,
  Clock,
  Download
} from 'lucide-react';
import './App.css';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, LineElement, PointElement);

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const getImageUrl = (photoPath) => {
  if (!photoPath) return '';
  if (photoPath.startsWith('data:image/') || photoPath.startsWith('http://') || photoPath.startsWith('https://')) {
    return photoPath;
  }
  return `${API_BASE_URL.replace('/api', '')}${photoPath}`;
};

const convert24To12 = (time24) => {
  if (!time24) return '';
  const [hoursStr, minutesStr] = time24.split(':');
  let hours = parseInt(hoursStr, 10);
  const minutes = minutesStr;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  const hoursFormatted = hours < 10 ? `0${hours}` : hours;
  return `${hoursFormatted}:${minutes} ${ampm}`;
};

const convert12To24 = (time12) => {
  if (!time12) return '';
  const match = time12.match(/^(\d{2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return '';
  let [_, hoursStr, minutes, ampm] = match;
  let hours = parseInt(hoursStr, 10);
  if (ampm.toUpperCase() === 'PM' && hours < 12) hours += 12;
  if (ampm.toUpperCase() === 'AM' && hours === 12) hours = 0;
  const hoursFormatted = hours < 10 ? `0${hours}` : hours;
  return `${hoursFormatted}:${minutes}`;
};

const toLocalISOString = (dateInput) => {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const toLocalDateString = (dateInput) => {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatOnlyDate = (dateString) => {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

const getAppointmentDateTime = (startDateStr, selectedTimeStr) => {
  if (!startDateStr) return '';
  
  let datePart = '';
  if (typeof startDateStr === 'string' && startDateStr.match(/^\d{4}-\d{2}-\d{2}/)) {
    datePart = startDateStr.substring(0, 10);
  } else {
    const d = new Date(startDateStr);
    if (!isNaN(d.getTime())) {
      const year = d.getUTCFullYear();
      const month = String(d.getUTCMonth() + 1).padStart(2, '0');
      const day = String(d.getUTCDate()).padStart(2, '0');
      datePart = `${year}-${month}-${day}`;
    }
  }
  
  if (!datePart) return '';
  
  let timePart = '09:00'; // default morning time
  if (selectedTimeStr) {
    const match12 = selectedTimeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (match12) {
      let [_, hoursStr, minutes, ampm] = match12;
      let hours = parseInt(hoursStr, 10);
      if (ampm.toUpperCase() === 'PM' && hours < 12) hours += 12;
      if (ampm.toUpperCase() === 'AM' && hours === 12) hours = 0;
      const hoursFormatted = String(hours).padStart(2, '0');
      timePart = `${hoursFormatted}:${minutes}`;
    } else {
      const match24 = selectedTimeStr.match(/^(\d{1,2}):(\d{2})$/);
      if (match24) {
        const hours = String(parseInt(match24[1], 10)).padStart(2, '0');
        const minutes = match24[2];
        timePart = `${hours}:${minutes}`;
      }
    }
  }
  
  return `${datePart}T${timePart}`;
};

const filterByDateRange = (item, dateField, reportStartDate, reportEndDate) => {
  if (!reportStartDate && !reportEndDate) return true;
  if (!item || !item[dateField]) return false;
  const itemDate = new Date(item[dateField]);
  if (reportStartDate) {
    const start = new Date(reportStartDate);
    start.setHours(0, 0, 0, 0);
    if (itemDate < start) return false;
  }
  if (reportEndDate) {
    const end = new Date(reportEndDate);
    end.setHours(23, 59, 59, 999);
    if (itemDate > end) return false;
  }
  return true;
};

const getRevenueTrend = (filteredPayments, startDateStr, endDateStr) => {
  const start = startDateStr ? new Date(startDateStr) : null;
  const end = endDateStr ? new Date(endDateStr) : null;
  
  let useDayGrouping = false;
  if (start && end) {
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays <= 31) {
      useDayGrouping = true;
    }
  }
  
  if (useDayGrouping && start && end) {
    const dayMap = {};
    const labels = [];
    let curr = new Date(start);
    curr.setHours(0, 0, 0, 0);
    const limit = new Date(end);
    limit.setHours(23, 59, 59, 999);
    
    let safety = 0;
    while (curr <= limit && safety < 40) {
      const label = curr.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      labels.push(label);
      dayMap[label] = 0;
      curr.setDate(curr.getDate() + 1);
      safety++;
    }
    
    filteredPayments.forEach(p => {
      const pDate = p.paidAt ? new Date(p.paidAt) : (p.createdAt ? new Date(p.createdAt) : null);
      if (!pDate) return;
      const label = pDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      if (dayMap[label] !== undefined) {
        dayMap[label] += p.amount || 0;
      }
    });
    
    const data = labels.map(l => dayMap[l]);
    return { labels, data };
  } else {
    const monthMap = {};
    
    filteredPayments.forEach(p => {
      const pDate = p.paidAt ? new Date(p.paidAt) : (p.createdAt ? new Date(p.createdAt) : null);
      if (!pDate) return;
      const year = pDate.getFullYear();
      const month = String(pDate.getMonth() + 1).padStart(2, '0');
      const key = `${year}-${month}`;
      monthMap[key] = (monthMap[key] || 0) + (p.amount || 0);
    });
    
    if (start && end) {
      let curr = new Date(start);
      curr.setDate(1);
      curr.setHours(0, 0, 0, 0);
      const limit = new Date(end);
      limit.setDate(1);
      limit.setHours(23, 59, 59, 999);
      
      let safety = 0;
      while (curr <= limit && safety < 36) {
        const key = `${curr.getFullYear()}-${String(curr.getMonth() + 1).padStart(2, '0')}`;
        if (monthMap[key] === undefined) {
          monthMap[key] = 0;
        }
        curr.setMonth(curr.getMonth() + 1);
        safety++;
      }
    }
    
    const sortedKeys = Object.keys(monthMap).sort();
    const labels = sortedKeys.map(k => {
      const [yr, mn] = k.split('-');
      const date = new Date(parseInt(yr), parseInt(mn) - 1, 1);
      return date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
    });
    const data = sortedKeys.map(k => monthMap[k]);
    return { labels, data };
  }
};

const getEmployeeTrend = (filteredEmployees, startDateStr, endDateStr) => {
  const start = startDateStr ? new Date(startDateStr) : null;
  const end = endDateStr ? new Date(endDateStr) : null;
  
  let useDayGrouping = false;
  if (start && end) {
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays <= 31) {
      useDayGrouping = true;
    }
  }
  
  if (useDayGrouping && start && end) {
    const dayMap = {};
    const labels = [];
    let curr = new Date(start);
    curr.setHours(0, 0, 0, 0);
    const limit = new Date(end);
    limit.setHours(23, 59, 59, 999);
    
    let safety = 0;
    while (curr <= limit && safety < 40) {
      const label = curr.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      labels.push(label);
      dayMap[label] = 0;
      curr.setDate(curr.getDate() + 1);
      safety++;
    }
    
    filteredEmployees.forEach(e => {
      const eDate = e.createdAt ? new Date(e.createdAt) : null;
      if (!eDate) return;
      const label = eDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      if (dayMap[label] !== undefined) {
        dayMap[label] += 1;
      }
    });
    
    const data = labels.map(l => dayMap[l]);
    return { labels, data };
  } else {
    const monthMap = {};
    
    filteredEmployees.forEach(e => {
      const eDate = e.createdAt ? new Date(e.createdAt) : null;
      if (!eDate) return;
      const year = eDate.getFullYear();
      const month = String(eDate.getMonth() + 1).padStart(2, '0');
      const key = `${year}-${month}`;
      monthMap[key] = (monthMap[key] || 0) + 1;
    });
    
    if (start && end) {
      let curr = new Date(start);
      curr.setDate(1);
      curr.setHours(0, 0, 0, 0);
      const limit = new Date(end);
      limit.setDate(1);
      limit.setHours(23, 59, 59, 999);
      
      let safety = 0;
      while (curr <= limit && safety < 36) {
        const key = `${curr.getFullYear()}-${String(curr.getMonth() + 1).padStart(2, '0')}`;
        if (monthMap[key] === undefined) {
          monthMap[key] = 0;
        }
        curr.setMonth(curr.getMonth() + 1);
        safety++;
      }
    }
    
    const sortedKeys = Object.keys(monthMap).sort();
    const labels = sortedKeys.map(k => {
      const [yr, mn] = k.split('-');
      const date = new Date(parseInt(yr), parseInt(mn) - 1, 1);
      return date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
    });
    const data = sortedKeys.map(k => monthMap[k]);
    return { labels, data };
  }
};

function App() {
  // Authentication State
  const [token, setToken] = useState(localStorage.getItem('admin_token') || '');
  const [adminUser, setAdminUser] = useState(JSON.parse(localStorage.getItem('admin_user')) || null);

  // Navigation
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  // Data States
  const [stats, setStats] = useState(null);

  const [users, setUsers] = useState([]);
  const [usersPagination, setUsersPagination] = useState({ total: 0, page: 1, limit: 8, pages: 1 });
  const [usersFilters, setUsersFilters] = useState({ search: '', role: '', isVerified: '' });

  const [orders, setOrders] = useState([]);
  const [ordersPagination, setOrdersPagination] = useState({ total: 0, page: 1, limit: 8, pages: 1 });
  const [ordersFilters, setOrdersFilters] = useState({ search: '', status: '', paymentStatus: '', packageType: '' });

  const [payments, setPayments] = useState([]);
  const [paymentsPagination, setPaymentsPagination] = useState({ total: 0, page: 1, limit: 8, pages: 1 });
  const [paymentsFilters, setPaymentsFilters] = useState({ search: '', status: '' });

  // Modal States
  const [editUser, setEditUser] = useState(null);
  const [editOrder, setEditOrder] = useState(null);
  const [editPayment, setEditPayment] = useState(null);

  // Package Management States
  const [packages, setPackages] = useState([]);
  const [editPackage, setEditPackage] = useState(null);
  const [showAddPackageModal, setShowAddPackageModal] = useState(false);
  const [pkgFeatureInput, setPkgFeatureInput] = useState('');
  const [planFeatureInputs, setPlanFeatureInputs] = useState({});

  // Timeslot Management States
  const [timeslots, setTimeslots] = useState({});
  const [newTimeInputs, setNewTimeInputs] = useState({ morning: '', afternoon: '', evening: '' });
  const [editingTime, setEditingTime] = useState({ slotKey: null, index: null, value: '' });

  // Login Form States
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Global Loader
  const [isLoading, setIsLoading] = useState(false);

  // Alert Toasts
  const [toasts, setToasts] = useState([]);

  // Employees & Appointments States
  const [employees, setEmployees] = useState([]);
  const [employeesFilters, setEmployeesFilters] = useState({ search: '', status: '' });
  const [appointments, setAppointments] = useState([]);
  const [appointmentsFilters, setAppointmentsFilters] = useState({ search: '', status: '' });
  const [checkinDateFilter, setCheckinDateFilter] = useState(toLocalDateString(new Date()));
  const [checkinSearchFilter, setCheckinSearchFilter] = useState('');
  const [reportStartDate, setReportStartDate] = useState('');
  const [reportEndDate, setReportEndDate] = useState('');
  const [exportingType, setExportingType] = useState(null);
  const [reportUsers, setReportUsers] = useState([]);
  const [reportOrders, setReportOrders] = useState([]);
  const [reportPayments, setReportPayments] = useState([]);
  const [reportEmployees, setReportEmployees] = useState([]);
  const [reportAppointments, setReportAppointments] = useState([]);
  const [reportPincodeRequests, setReportPincodeRequests] = useState([]);
  const [loadingReportData, setLoadingReportData] = useState(false);
  const [showAddAppointmentModal, setShowAddAppointmentModal] = useState(false);
  const [newAppointment, setNewAppointment] = useState({ customerName: '', customerMobile: '', customerAddress: '', dateTime: '', details: '', assignedEmployee: '' });
  const [editAppointment, setEditAppointment] = useState(null);
  const [viewEmployeeDocs, setViewEmployeeDocs] = useState(null);
  const [previewImage, setPreviewImage] = useState(null); // lightbox URL
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [unscheduledOrders, setUnscheduledOrders] = useState([]);
  const [loadingUnscheduled, setLoadingUnscheduled] = useState(false);

  // Pincode States
  const [serviceablePincodes, setServiceablePincodes] = useState([]);
  const [pincodeRequests, setPincodeRequests] = useState([]);
  const [loadingPincodes, setLoadingPincodes] = useState(false);
  const [newPincode, setNewPincode] = useState('');

  // Memoized filtered data for reports tab
  const reportFilteredData = useMemo(() => {
    if (activeTab !== 'reports') {
      return {
        users: [],
        orders: [],
        payments: [],
        employees: [],
        appointments: [],
        pincodeRequests: [],
        userEmployeeCounts: { users: 0, employees: 0 },
        packageStats: { mother: 0, baby: 0, muma: 0 },
        revenueTrend: { labels: [], data: [] },
        employeeTrend: { labels: [], data: [] }
      };
    }

    const filteredUsers = reportUsers.filter(u => filterByDateRange(u, 'createdAt', reportStartDate, reportEndDate));
    const filteredOrders = reportOrders.filter(o => filterByDateRange(o, 'createdAt', reportStartDate, reportEndDate));
    const filteredPayments = reportPayments.filter(p => filterByDateRange(p, 'createdAt', reportStartDate, reportEndDate));
    const filteredEmployees = reportEmployees.filter(e => filterByDateRange(e, 'createdAt', reportStartDate, reportEndDate));
    const filteredAppointments = reportAppointments.filter(appt => appt.checkinTime && filterByDateRange(appt, 'checkinTime', reportStartDate, reportEndDate));
    const filteredPincodeRequests = reportPincodeRequests.filter(req => filterByDateRange(req, 'createdAt', reportStartDate, reportEndDate));

    // Count Users vs Employees signup
    const userEmployeeCounts = {
      users: filteredUsers.length,
      employees: filteredEmployees.length
    };

    // Calculate Package Share
    const packageStats = { mother: 0, baby: 0, muma: 0 };
    filteredOrders.forEach(o => {
      if (o.packageType === 'mother') packageStats.mother++;
      else if (o.packageType === 'baby') packageStats.baby++;
      else if (o.packageType === 'muma') packageStats.muma++;
    });

    // Calculate Revenue Trend
    const revenueTrend = getRevenueTrend(filteredPayments, reportStartDate, reportEndDate);

    // Calculate Employee Trend
    const employeeTrend = getEmployeeTrend(filteredEmployees, reportStartDate, reportEndDate);

    return {
      users: filteredUsers,
      orders: filteredOrders,
      payments: filteredPayments,
      employees: filteredEmployees,
      appointments: filteredAppointments,
      pincodeRequests: filteredPincodeRequests,
      userEmployeeCounts,
      packageStats,
      revenueTrend,
      employeeTrend
    };
  }, [activeTab, reportUsers, reportOrders, reportPayments, reportEmployees, reportAppointments, reportPincodeRequests, reportStartDate, reportEndDate]);

  // Toast Helper
  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Fetch API Helper with Auth
  const apiFetch = async (endpoint, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(options.headers || {})
    };

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers
      });

      const data = await response.json();

      if (response.status === 401) {
        // Token expired / Unauthorized -> logout
        handleLogout();
        showToast('Session expired. Please log in again.', 'error');
        throw new Error('Unauthorized');
      }

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      return data;
    } catch (err) {
      console.error('API Fetch Error:', err);
      throw err;
    }
  };

  // Logout Handler
  const handleLogout = () => {
    setToken('');
    setAdminUser(null);
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    showToast('Logged out successfully');
  };

  // Login Handler
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginIdentifier.trim() || !loginPassword) {
      setLoginError('Email or mobile and password are required');
      return;
    }

    setLoginError('');
    setLoginLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/admin-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: loginIdentifier, password: loginPassword })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Login failed');
      }

      setToken(data.token);
      setAdminUser(data.user);
      localStorage.setItem('admin_token', data.token);
      localStorage.setItem('admin_user', JSON.stringify(data.user));
      showToast(`Welcome back, ${data.user.name || 'Admin'}!`);
      setActiveTab('dashboard');
    } catch (err) {
      setLoginError(err.message);
    } finally {
      setLoginLoading(false);
    }
  };

  // Fetch Dashboard Stats
  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch('/admin/stats');
      if (res.success) {
        setStats(res.data);
      }
    } catch (err) {
      showToast(err.message || 'Failed to load stats', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch Users
  const fetchUsers = async (page = 1) => {
    setIsLoading(true);
    try {
      const { search, role, isVerified } = usersFilters;
      let query = `?page=${page}&limit=${usersPagination.limit}`;
      if (search) query += `&search=${encodeURIComponent(search)}`;
      if (role) query += `&role=${role}`;
      if (isVerified) query += `&isVerified=${isVerified}`;

      const res = await apiFetch(`/admin/users${query}`);
      if (res.success) {
        setUsers(res.data.users);
        setUsersPagination(res.data.pagination);
      }
    } catch (err) {
      showToast(err.message || 'Failed to fetch users', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch Orders
  const fetchOrders = async (page = 1) => {
    setIsLoading(true);
    try {
      const { search, status, paymentStatus, packageType } = ordersFilters;
      let query = `?page=${page}&limit=${ordersPagination.limit}`;
      if (search) query += `&search=${encodeURIComponent(search)}`;
      if (status) query += `&status=${status}`;
      if (paymentStatus) query += `&paymentStatus=${paymentStatus}`;
      if (packageType) query += `&packageType=${packageType}`;

      const res = await apiFetch(`/admin/orders${query}`);
      if (res.success) {
        setOrders(res.data.orders);
        setOrdersPagination(res.data.pagination);
      }
    } catch (err) {
      showToast(err.message || 'Failed to fetch orders', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch Payments
  const fetchPayments = async (page = 1) => {
    setIsLoading(true);
    try {
      const { search, status } = paymentsFilters;
      let query = `?page=${page}&limit=${paymentsPagination.limit}`;
      if (search) query += `&search=${encodeURIComponent(search)}`;
      if (status) query += `&status=${status}`;

      const res = await apiFetch(`/admin/payments${query}`);
      if (res.success) {
        setPayments(res.data.payments);
        setPaymentsPagination(res.data.pagination);
      }
    } catch (err) {
      showToast(err.message || 'Failed to fetch payments', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch Packages
  const fetchPackages = async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch('/admin/packages');
      if (res.success) {
        setPackages(res.data);
      }
    } catch (err) {
      showToast(err.message || 'Failed to fetch packages', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      const { search, status } = employeesFilters;
      let query = '';
      if (search || status) {
        query = `?search=${encodeURIComponent(search)}&isVerifiedEmployee=${status}`;
      }
      const res = await apiFetch(`/admin/employees${query}`);
      if (res.success) {
        setEmployees(res.data);
      }
    } catch (err) {
      showToast(err.message || 'Failed to fetch employees', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAppointments = async () => {
    setIsLoading(true);
    try {
      let query = '';
      if (activeTab === 'appointments') {
        const { search, status } = appointmentsFilters;
        const params = [];
        if (search) params.push(`search=${encodeURIComponent(search)}`);
        if (status) params.push(`status=${status}`);
        if (params.length > 0) query = `?${params.join('&')}`;
      }

      const res = await apiFetch(`/admin/appointments${query}`);
      if (res.success) {
        setAppointments(res.data);
      }
    } catch (err) {
      showToast(err.message || 'Failed to fetch appointments', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTimeslots = async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch('/admin/timeslots');
      if (res.success) {
        const mapped = {};
        if (Array.isArray(res.data)) {
          res.data.forEach(item => {
            mapped[item.slot] = item.times;
          });
        }
        setTimeslots(mapped);
      }
    } catch (err) {
      showToast(err.message || 'Failed to fetch timeslots configuration', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateTimeslot = async (slot, times) => {
    try {
      const res = await apiFetch('/admin/timeslots', {
        method: 'PUT',
        body: JSON.stringify({ slot, times })
      });
      if (res.success) {
        showToast(`Timeslot configuration for ${slot} updated`);
        fetchTimeslots();
      }
    } catch (err) {
      showToast(err.message || 'Failed to update timeslot configuration', 'error');
    }
  };

  const handleApproveEmployee = async (id, isApproved) => {
    try {
      const res = await apiFetch(`/admin/employees/${id}/approve`, {
        method: 'PUT',
        body: JSON.stringify({ isVerifiedEmployee: isApproved })
      });
      if (res.success) {
        showToast(isApproved ? 'Employee approved successfully' : 'Employee approval status updated');
        fetchEmployees();
      }
    } catch (err) {
      showToast(err.message || 'Verification update failed', 'error');
    }
  };

  const handleScheduleFromOrder = (order) => {
    // Enabled scheduling future appointments for admin
    /*
    if (order.startDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const orderStartDate = new Date(order.startDate);
      orderStartDate.setHours(0, 0, 0, 0);
      if (orderStartDate > today) {
        showToast("Cannot schedule appointment. The subscription start date is in the future.", "error");
        alert("Cannot schedule appointment. The subscription start date is in the future.");
        return;
      }
    }
    */

    const formattedAddress = order.address ? [
      order.address.flatNo,
      order.address.street,
      order.address.city,
      order.address.state,
      order.address.pincode
    ].filter(Boolean).join(', ') : '';

    const detailsParts = [];
    detailsParts.push(`Package: ${order.packageTitle} (${order.planLabel})`);
    if (order.motherName) {
      detailsParts.push(`Mother: ${order.motherName}${order.motherAge ? ` (Age: ${order.motherAge})` : ''}`);
    }
    if (order.babyName) {
      detailsParts.push(`Baby: ${order.babyName}${order.babyAge ? ` (Age: ${order.babyAge})` : ''}`);
    }
    if (order.timeSlot) {
      detailsParts.push(`Preferred Time: ${order.timeSlot} ${order.selectedTime ? `(${order.selectedTime})` : ''}`);
    }
    detailsParts.push(`Order ID: ${order._id}`);

    setNewAppointment({
      customerName: order.user?.name || order.address?.fullName || order.motherName || '',
      customerMobile: order.user?.mobile || order.address?.mobile || '',
      customerAddress: formattedAddress,
      dateTime: getAppointmentDateTime(order.activatedAt || order.startDate, order.selectedTime),
      details: detailsParts.join(' | '),
      assignedEmployee: ''
    });

    setSelectedOrder(order);
    setSelectedOrderId(order._id);
    setActiveTab('appointments');
    setShowAddAppointmentModal(true);
  };

  const handleSelectUnscheduledOrder = (orderId) => {
    if (!orderId) {
      setSelectedOrderId('');
      setNewAppointment({
        customerName: '',
        customerMobile: '',
        customerAddress: '',
        dateTime: '',
        details: '',
        assignedEmployee: ''
      });
      return;
    }
    const order = unscheduledOrders.find(o => o._id === orderId);
    if (order) {
      // Enabled scheduling future appointments for admin
      /*
      if (order.startDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const orderStartDate = new Date(order.startDate);
        orderStartDate.setHours(0, 0, 0, 0);
        if (orderStartDate > today) {
          showToast("Cannot schedule appointment. The subscription start date is in the future.", "error");
          alert("Cannot schedule appointment. The subscription start date is in the future.");
          setSelectedOrderId('');
          setNewAppointment({
            customerName: '',
            customerMobile: '',
            customerAddress: '',
            dateTime: '',
            details: '',
            assignedEmployee: ''
          });
          return;
        }
      }
      */

      setSelectedOrderId(orderId);
      const formattedAddress = order.address ? [
        order.address.flatNo,
        order.address.street,
        order.address.city,
        order.address.state,
        order.address.pincode
      ].filter(Boolean).join(', ') : '';

      const detailsParts = [];
      detailsParts.push(`Package: ${order.packageTitle} (${order.planLabel})`);
      if (order.motherName) {
        detailsParts.push(`Mother: ${order.motherName}${order.motherAge ? ` (Age: ${order.motherAge})` : ''}`);
      }
      if (order.babyName) {
        detailsParts.push(`Baby: ${order.babyName}${order.babyAge ? ` (Age: ${order.babyAge})` : ''}`);
      }
      if (order.timeSlot) {
        detailsParts.push(`Preferred Time: ${order.timeSlot} ${order.selectedTime ? `(${order.selectedTime})` : ''}`);
      }
      detailsParts.push(`Order ID: ${order._id}`);

      setNewAppointment({
        customerName: order.user?.name || order.address?.fullName || order.motherName || '',
        customerMobile: order.user?.mobile || order.address?.mobile || '',
        customerAddress: formattedAddress,
        dateTime: getAppointmentDateTime(order.activatedAt || order.startDate, order.selectedTime),
        details: detailsParts.join(' | '),
        assignedEmployee: ''
      });
    } else {
      setSelectedOrderId('');
      setNewAppointment({
        customerName: '',
        customerMobile: '',
        customerAddress: '',
        dateTime: '',
        details: '',
        assignedEmployee: ''
      });
    }
  };

  const handleCreateAppointment = async (e) => {
    e.preventDefault();
    if (selectedOrderId) {
      const order = unscheduledOrders.find(o => o._id === selectedOrderId);
      // Enabled scheduling future appointments for admin
      /*
      if (order && order.startDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const orderStartDate = new Date(order.startDate);
        orderStartDate.setHours(0, 0, 0, 0);
        if (orderStartDate > today) {
          showToast("Cannot create appointment. The subscription start date is in the future.", "error");
          alert("Cannot create appointment. The subscription start date is in the future.");
          return;
        }
      }
      */
    }
    try {
      const payload = {
        ...newAppointment,
        dateTime: newAppointment.dateTime ? new Date(newAppointment.dateTime).toISOString() : ''
      };
      const res = await apiFetch('/admin/appointments', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      if (res.success) {
        showToast('Appointment created and assigned successfully');
        setNewAppointment({ customerName: '', customerMobile: '', customerAddress: '', dateTime: '', details: '', assignedEmployee: '' });
        setSelectedOrder(null);
        setSelectedOrderId('');
        setShowAddAppointmentModal(false);
        fetchAppointments();
      }
    } catch (err) {
      showToast(err.message || 'Failed to create appointment', 'error');
    }
  };

  const handleDeleteAppointment = async (id) => {
    if (window.confirm('Are you sure you want to delete this appointment?')) {
      try {
        const res = await apiFetch(`/admin/appointments/${id}`, { method: 'DELETE' });
        if (res.success) {
          showToast('Appointment deleted successfully');
          fetchAppointments();
        }
      } catch (err) {
        showToast(err.message || 'Failed to delete appointment', 'error');
      }
    }
  };

  const handleUpdateAppointment = async (e) => {
    e.preventDefault();
    try {
      const res = await apiFetch(`/admin/appointments/${editAppointment._id}`, {
        method: 'PUT',
        body: JSON.stringify({
          customerName: editAppointment.customerName,
          customerMobile: editAppointment.customerMobile,
          customerAddress: editAppointment.customerAddress,
          dateTime: editAppointment.dateTime ? new Date(editAppointment.dateTime).toISOString() : '',
          details: editAppointment.details,
          assignedEmployee: editAppointment.assignedEmployee || null,
          status: editAppointment.status
        })
      });
      if (res.success) {
        showToast('Appointment updated successfully');
        setEditAppointment(null);
        fetchAppointments();
      }
    } catch (err) {
      showToast(err.message || 'Failed to update appointment', 'error');
    }
  };

  // Create Package Handler
  const handleCreatePackage = async (e) => {
    e.preventDefault();
    try {
      const res = await apiFetch('/admin/packages', {
        method: 'POST',
        body: JSON.stringify(editPackage)
      });
      if (res.success) {
        showToast('Package created successfully');
        setEditPackage(null);
        setShowAddPackageModal(false);
        fetchPackages();
      }
    } catch (err) {
      showToast(err.message || 'Creation failed', 'error');
    }
  };

  // Update Package Handler
  const handleUpdatePackage = async (e) => {
    e.preventDefault();
    try {
      const res = await apiFetch(`/admin/packages/${editPackage._id}`, {
        method: 'PUT',
        body: JSON.stringify(editPackage)
      });
      if (res.success) {
        showToast('Package updated successfully');
        setEditPackage(null);
        fetchPackages();
      }
    } catch (err) {
      showToast(err.message || 'Update failed', 'error');
    }
  };

  // Delete Package Handler
  const handleDeletePackage = async (id) => {
    if (window.confirm('Are you sure you want to delete this package? This cannot be undone.')) {
      try {
        const res = await apiFetch(`/admin/packages/${id}`, { method: 'DELETE' });
        if (res.success) {
          showToast('Package deleted successfully');
          fetchPackages();
        }
      } catch (err) {
        showToast(err.message || 'Deletion failed', 'error');
      }
    }
  };

  // Fetch unscheduled orders when Create Appointment modal opens
  useEffect(() => {
    if (showAddAppointmentModal) {
      const fetchUnscheduledOrders = async () => {
        setLoadingUnscheduled(true);
        try {
          const res = await apiFetch('/admin/orders?page=1&limit=1000&paymentStatus=success');
          if (res.success && res.data && res.data.orders) {
            const apptRes = await apiFetch('/admin/appointments');
            const currentAppts = apptRes.success ? apptRes.data : appointments;
            
            const unscheduled = res.data.orders.filter(order => {
              // 1. Precise check: does any appointment details contain this Order ID?
              const isScheduledPrecise = currentAppts.some(appt => 
                appt.details && appt.details.includes(`Order ID: ${order._id}`)
              );
              if (isScheduledPrecise) return false;

              // 2. Fallback: backwards compatibility check for old appointments without Order ID in details
              const mobile = order.user?.mobile || order.address?.mobile;
              if (mobile) {
                const hasMobileMatchWithoutOrderId = currentAppts.some(appt => {
                  const isSameMobile = appt.customerMobile === mobile;
                  const hasNoOrderId = appt.details && !appt.details.includes('Order ID:');
                  return isSameMobile && hasNoOrderId;
                });
                if (hasMobileMatchWithoutOrderId) return false;
              }

              return true;
            });
            
            if (selectedOrder && !unscheduled.some(o => o._id === selectedOrder._id)) {
              unscheduled.unshift(selectedOrder);
            }
            
            setUnscheduledOrders(unscheduled);
          }
        } catch (err) {
          console.error("Failed to load unscheduled orders:", err);
          showToast("Failed to load unscheduled orders", "error");
        } finally {
          setLoadingUnscheduled(false);
        }
      };
      fetchUnscheduledOrders();
    }
  }, [showAddAppointmentModal, selectedOrder]);

  // Trigger data reload on tab change or filters change
  useEffect(() => {
    if (token) {
      if (activeTab === 'dashboard') fetchStats();
      if (activeTab === 'users') fetchUsers(1);
      if (activeTab === 'orders') fetchOrders(1);
      if (activeTab === 'payments') fetchPayments(1);
      if (activeTab === 'packages') fetchPackages();
      if (activeTab === 'employees') fetchEmployees();
      if (activeTab === 'timeslots') fetchTimeslots();
      if (activeTab === 'appointments' || activeTab === 'checkins') {
        fetchAppointments();
        fetchEmployees();
      }
      if (activeTab === 'reports') {
        fetchReportData();
      }
      if (activeTab === 'pincodes') {
        fetchPincodesData();
      }
    }
  }, [token, activeTab, employeesFilters, appointmentsFilters]);

  // Handle Updates
  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      const res = await apiFetch(`/admin/users/${editUser._id}`, {
        method: 'PUT',
        body: JSON.stringify(editUser)
      });
      if (res.success) {
        showToast('User updated successfully');
        setEditUser(null);
        fetchUsers(usersPagination.page);
      }
    } catch (err) {
      showToast(err.message || 'Update failed', 'error');
    }
  };

  const downloadCSV = (data, headers, filename) => {
    if (!data || data.length === 0) {
      showToast("No data available to export for the selected date range", "error");
      return;
    }
    const csvRows = [];
    csvRows.push(headers.join(','));
    for (const row of data) {
      const values = headers.map(header => {
        const val = row[header];
        const escaped = ('' + (val !== undefined && val !== null ? val : '')).replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    }
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const fetchReportData = async () => {
    setLoadingReportData(true);
    try {
      const [usersRes, ordersRes, paymentsRes, employeesRes, appointmentsRes, pincodesRes] = await Promise.all([
        apiFetch(`/admin/users?page=1&limit=100000`),
        apiFetch(`/admin/orders?page=1&limit=100000`),
        apiFetch(`/admin/payments?page=1&limit=100000`),
        apiFetch(`/admin/employees`),
        apiFetch(`/admin/appointments`),
        apiFetch(`/admin/pincode-requests`)
      ]);
      if (usersRes.success) setReportUsers(usersRes.data.users || []);
      if (ordersRes.success) setReportOrders(ordersRes.data.orders || []);
      if (paymentsRes.success) setReportPayments(paymentsRes.data.payments || []);
      if (employeesRes.success) setReportEmployees(employeesRes.data || []);
      if (appointmentsRes.success) setReportAppointments(appointmentsRes.data || []);
      if (pincodesRes.success) setReportPincodeRequests(pincodesRes.data || []);
    } catch (err) {
      console.error("Failed to fetch reports datasets:", err);
      showToast("Failed to fetch reports datasets", "error");
    } finally {
      setLoadingReportData(false);
    }
  };

  const fetchPincodesData = async () => {
    setLoadingPincodes(true);
    try {
      const [serviceableRes, requestsRes] = await Promise.all([
        apiFetch('/admin/pincodes'),
        apiFetch('/admin/pincode-requests')
      ]);
      if (serviceableRes.success) setServiceablePincodes(serviceableRes.data || []);
      if (requestsRes.success) setPincodeRequests(requestsRes.data || []);
    } catch (err) {
      console.error("Failed to fetch pincodes data:", err);
      showToast("Failed to fetch pincodes data", "error");
    } finally {
      setLoadingPincodes(false);
    }
  };

  const handleRefresh = () => {
    if (activeTab === 'dashboard') fetchStats();
    else if (activeTab === 'users') fetchUsers(usersPagination.page || 1);
    else if (activeTab === 'orders') fetchOrders(ordersPagination.page || 1);
    else if (activeTab === 'payments') fetchPayments(paymentsPagination.page || 1);
    else if (activeTab === 'packages') fetchPackages();
    else if (activeTab === 'employees') fetchEmployees();
    else if (activeTab === 'timeslots') fetchTimeslots();
    else if (activeTab === 'appointments' || activeTab === 'checkins') {
      fetchAppointments();
      fetchEmployees();
    }
    else if (activeTab === 'reports') fetchReportData();
    else if (activeTab === 'pincodes') fetchPincodesData();
  };

  const handleAddPincode = async (e) => {
    e.preventDefault();
    if (!newPincode.trim() || newPincode.trim().length !== 6) {
      showToast("Please enter a valid 6-digit pincode", "error");
      return;
    }
    try {
      const res = await apiFetch('/admin/pincodes', {
        method: 'POST',
        body: JSON.stringify({ pincode: newPincode.trim() })
      });
      if (res.success) {
        showToast("Pincode added successfully");
        setNewPincode('');
        fetchPincodesData();
      }
    } catch (err) {
      showToast(err.message || "Failed to add pincode", "error");
    }
  };

  const handleDeletePincode = async (id) => {
    if (window.confirm("Are you sure you want to delete this serviceable pincode?")) {
      try {
        const res = await apiFetch(`/admin/pincodes/${id}`, { method: 'DELETE' });
        if (res.success) {
          showToast("Pincode deleted successfully");
          fetchPincodesData();
        }
      } catch (err) {
        showToast(err.message || "Failed to delete pincode", "error");
      }
    }
  };

  const handleExport = async (type) => {
    setExportingType(type);
    try {
      let data = [];
      let headers = [];
      let filename = `report_${type}_${Date.now()}.csv`;

      if (type === 'users') {
        const filtered = reportFilteredData.users;
        headers = ['ID', 'Name', 'Email', 'Mobile', 'Role', 'Verified', 'Created At'];
        data = filtered.map(u => ({
          ID: u._id,
          Name: u.name,
          Email: u.email,
          Mobile: u.mobile,
          Role: u.role,
          Verified: u.isVerified ? 'Yes' : 'No',
          'Created At': u.createdAt ? new Date(u.createdAt).toLocaleString('en-IN') : ''
        }));
      } else if (type === 'orders') {
        const filtered = reportFilteredData.orders;
        headers = ['Order ID', 'Customer Name', 'Customer Mobile', 'Package', 'Plan', 'Price', 'Status', 'Payment Status', 'Start Date', 'Activated At', 'Expires At', 'Mother Name', 'Baby Name'];
        data = filtered.map(o => ({
          'Order ID': o._id,
          'Customer Name': o.user?.name || o.address?.fullName || '',
          'Customer Mobile': o.user?.mobile || o.address?.mobile || '',
          'Package': o.packageTitle,
          'Plan': o.planLabel,
          'Price': o.price,
          'Status': o.status,
          'Payment Status': o.paymentStatus,
          'Start Date': o.startDate ? new Date(o.startDate).toLocaleDateString('en-IN') : '',
          'Activated At': o.activatedAt ? new Date(o.activatedAt).toLocaleDateString('en-IN') : '',
          'Expires At': o.expiresAt ? new Date(o.expiresAt).toLocaleDateString('en-IN') : '',
          'Mother Name': o.motherName || '',
          'Baby Name': o.babyName || ''
        }));
      } else if (type === 'payments') {
        const filtered = reportFilteredData.payments;
        headers = ['Payment ID', 'Customer Name', 'Customer Mobile', 'Order ID', 'Package', 'Transaction ID', 'Amount', 'Status', 'UPI ID', 'UPI Reference', 'Paid At'];
        data = filtered.map(p => ({
          'Payment ID': p._id,
          'Customer Name': p.user?.name || '',
          'Customer Mobile': p.user?.mobile || '',
          'Order ID': p.order?._id || p.order || '',
          'Package': p.order?.packageTitle || '',
          'Transaction ID': p.transactionId,
          'Amount': p.amount,
          'Status': p.status,
          'UPI ID': p.upiId || '',
          'UPI Reference': p.upiRef || '',
          'Paid At': p.paidAt ? new Date(p.paidAt).toLocaleString('en-IN') : ''
        }));
      } else if (type === 'employees') {
        const filtered = reportFilteredData.employees;
        headers = ['Employee ID', 'Name', 'Email', 'Mobile', 'Occupation', 'Address', 'Aadhar Number', 'Approved', 'Registered At'];
        data = filtered.map(e => ({
          'Employee ID': e._id,
          'Name': e.name,
          'Email': e.email,
          'Mobile': e.mobile,
          'Occupation': e.occupation,
          'Address': e.address || e.permanentAddress || '',
          'Aadhar Number': e.aadharNumber,
          'Approved': e.isVerifiedEmployee ? 'Yes' : 'No',
          'Registered At': e.createdAt ? new Date(e.createdAt).toLocaleString('en-IN') : ''
        }));
      } else if (type === 'checkins') {
        const filtered = reportFilteredData.appointments;
        headers = ['Appointment ID', 'Check-in Time', 'Employee Name', 'Customer Name', 'Customer Mobile', 'Address', 'Latitude', 'Longitude', 'Status'];
        data = filtered.map(appt => ({
          'Appointment ID': appt._id,
          'Check-in Time': appt.checkinTime ? new Date(appt.checkinTime).toLocaleString('en-IN') : '',
          'Employee Name': appt.assignedEmployee?.name || '',
          'Customer Name': appt.customerName,
          'Customer Mobile': appt.customerMobile,
          'Address': appt.customerAddress,
          'Latitude': appt.checkinLocation?.latitude || '',
          'Longitude': appt.checkinLocation?.longitude || '',
          'Status': appt.status
        }));
      } else if (type === 'pincodes') {
        const filtered = reportFilteredData.pincodeRequests;
        headers = ['Request ID', 'Mobile Number', 'Requested Pincode', 'User ID', 'User Name', 'User Email', 'Requested At'];
        data = filtered.map(req => ({
          'Request ID': req._id,
          'Mobile Number': req.mobile || '',
          'Requested Pincode': req.pincode || '',
          'User ID': req.user?._id || '',
          'User Name': req.user?.name || 'Guest User',
          'User Email': req.user?.email || '',
          'Requested At': req.createdAt ? new Date(req.createdAt).toLocaleString('en-IN') : ''
        }));
      }

      downloadCSV(data, headers, filename);
      showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} data exported successfully`);
    } catch (err) {
      console.error(err);
      showToast(`Failed to export ${type} data`, 'error');
    } finally {
      setExportingType(null);
    }
  };

  const handleOrderStartDateChange = (val) => {
    setEditOrder(prev => {
      if (!prev) return null;
      const updated = { ...prev, activatedAt: val };
      if (val) {
        const [year, month, day] = val.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        const months = prev.planKey === '1month' ? 1 : prev.planKey === '3month' ? 3 : 6;
        date.setMonth(date.getMonth() + months);
        
        const expYear = date.getFullYear();
        const expMonth = String(date.getMonth() + 1).padStart(2, '0');
        const expDay = String(date.getDate()).padStart(2, '0');
        updated.expiresAt = `${expYear}-${expMonth}-${expDay}`;
      } else {
        updated.expiresAt = '';
      }
      return updated;
    });
  };

  const handleOrderStatusChange = (newStatus) => {
    setEditOrder(prev => {
      if (!prev) return null;
      const updated = { ...prev, status: newStatus };
      if (newStatus === 'active' && !updated.activatedAt) {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const todayStr = `${year}-${month}-${day}`;
        updated.activatedAt = todayStr;
        
        const date = new Date(year, today.getMonth(), today.getDate());
        const months = prev.planKey === '1month' ? 1 : prev.planKey === '3month' ? 3 : 6;
        date.setMonth(date.getMonth() + months);
        
        const expYear = date.getFullYear();
        const expMonth = String(date.getMonth() + 1).padStart(2, '0');
        const expDay = String(date.getDate()).padStart(2, '0');
        updated.expiresAt = `${expYear}-${expMonth}-${expDay}`;
      }
      return updated;
    });
  };

  const handleUpdateOrder = async (e) => {
    e.preventDefault();
    try {
      const res = await apiFetch(`/admin/orders/${editOrder._id}`, {
        method: 'PUT',
        body: JSON.stringify({
          status: editOrder.status,
          paymentStatus: editOrder.paymentStatus,
          activatedAt: editOrder.activatedAt,
          expiresAt: editOrder.expiresAt
        })
      });
      if (res.success) {
        showToast('Order updated successfully');
        setEditOrder(null);
        fetchOrders(ordersPagination.page);
      }
    } catch (err) {
      showToast(err.message || 'Update failed', 'error');
    }
  };

  const handleUpdatePayment = async (e) => {
    e.preventDefault();
    try {
      const res = await apiFetch(`/admin/payments/${editPayment._id}`, {
        method: 'PUT',
        body: JSON.stringify({
          status: editPayment.status,
          amount: editPayment.amount,
          upiId: editPayment.upiId,
          upiRef: editPayment.upiRef
        })
      });
      if (res.success) {
        showToast('Payment record updated successfully');
        setEditPayment(null);
        fetchPayments(paymentsPagination.page);
      }
    } catch (err) {
      showToast(err.message || 'Update failed', 'error');
    }
  };

  // Handle Deletions
  const handleDeleteUser = async (id) => {
    if (window.confirm('WARNING: Deleting this user will cascade delete all their registered orders, payments, and address records! Are you absolutely sure?')) {
      try {
        const res = await apiFetch(`/admin/users/${id}`, { method: 'DELETE' });
        if (res.success) {
          showToast('User and associated details deleted successfully');
          fetchUsers(usersPagination.page);
        }
      } catch (err) {
        showToast(err.message || 'Deletion failed', 'error');
      }
    }
  };

  const handleDeleteEmployee = async (id) => {
    if (window.confirm('Are you sure you want to delete this employee? This will unassign them from any appointments.')) {
      try {
        const res = await apiFetch(`/admin/employees/${id}`, { method: 'DELETE' });
        if (res.success) {
          showToast('Employee deleted successfully');
          fetchEmployees();
        }
      } catch (err) {
        showToast(err.message || 'Deletion failed', 'error');
      }
    }
  };

  const handleDeleteOrder = async (id) => {
    if (window.confirm('Delete this order and associated payments?')) {
      try {
        const res = await apiFetch(`/admin/orders/${id}`, { method: 'DELETE' });
        if (res.success) {
          showToast('Order deleted successfully');
          fetchOrders(ordersPagination.page);
        }
      } catch (err) {
        showToast(err.message || 'Deletion failed', 'error');
      }
    }
  };

  // Format Helpers
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Render Login view
  if (!token) {
    return (
      <div className="login-wrapper">
        <div className="glass-panel login-card animate-fade-in">
          <div className="login-logo">
            <h2>Second Muma</h2>
            <p className="brand-subtitle">Admin Workspace</p>
          </div>

          {loginError && (
            <div className="badge badge-danger" style={{ width: '100%', padding: '10px', marginBottom: '20px', borderRadius: '8px', justifyContent: 'center' }}>
              <AlertTriangle size={16} style={{ marginRight: '6px' }} /> {loginError}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Email or Phone Number</label>
              <div style={{ position: 'relative' }}>
                <Phone size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter email or 10-digit number"
                  style={{ paddingLeft: '44px' }}
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Key size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="password"
                  className="form-control"
                  placeholder="Enter password"
                  style={{ paddingLeft: '44px' }}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary login-action" disabled={loginLoading}>
              {loginLoading ? 'Verifying...' : 'Enter Dashboard'}
            </button>
          </form>
        </div>

        {/* Toast Container */}
        <div className="toast-container">
          {toasts.map(toast => (
            <div key={toast.id} className={`toast toast-${toast.type}`}>
              {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
              <span>{toast.message}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Render Admin Dashboard layout
  return (
    <div className="admin-layout">
      {/* Sidebar Overlay */}
      <div
        className={`sidebar-overlay ${mobileMenuOpen ? 'open' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div>
            <div className="brand-logo">Second Muma</div>
            <div className="brand-subtitle">Control Center</div>
          </div>
        </div>

        <nav className="sidebar-menu">
          <button
            className={`menu-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => handleTabChange('dashboard')}
          >
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </button>

          <button
            className={`menu-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => handleTabChange('users')}
          >
            <Users size={20} />
            <span>Users</span>
          </button>

          <button
            className={`menu-item ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => handleTabChange('orders')}
          >
            <ShoppingCart size={20} />
            <span>Orders</span>
          </button>

          <button
            className={`menu-item ${activeTab === 'payments' ? 'active' : ''}`}
            onClick={() => handleTabChange('payments')}
          >
            <CreditCard size={20} />
            <span>Payments</span>
          </button>

          <button
            className={`menu-item ${activeTab === 'packages' ? 'active' : ''}`}
            onClick={() => handleTabChange('packages')}
          >
            <Package size={20} />
            <span>Packages</span>
          </button>

          <button
            className={`menu-item ${activeTab === 'employees' ? 'active' : ''}`}
            onClick={() => handleTabChange('employees')}
          >
            <Briefcase size={20} />
            <span>Employees</span>
          </button>

          <button
            className={`menu-item ${activeTab === 'appointments' ? 'active' : ''}`}
            onClick={() => handleTabChange('appointments')}
          >
            <Calendar size={20} />
            <span>Appointments</span>
          </button>

          <button
            className={`menu-item ${activeTab === 'checkins' ? 'active' : ''}`}
            onClick={() => handleTabChange('checkins')}
          >
            <MapPin size={20} />
            <span>Attendance</span>
          </button>

          <button
            className={`menu-item ${activeTab === 'timeslots' ? 'active' : ''}`}
            onClick={() => handleTabChange('timeslots')}
          >
            <Clock size={20} />
            <span>Timeslots</span>
          </button>

          <button
            className={`menu-item ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => handleTabChange('reports')}
          >
            <Download size={20} />
            <span>Reports</span>
          </button>

          <button
            className={`menu-item ${activeTab === 'pincodes' ? 'active' : ''}`}
            onClick={() => handleTabChange('pincodes')}
          >
            <MapPin size={20} />
            <span>Pincodes</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn">
            <LogOut size={20} />
            <span>Log out Session</span>
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <main className="main-content">
        <header className="admin-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button className="menu-toggle-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <div className="header-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h1>{activeTab === 'checkins' ? 'Attendance' : activeTab === 'reports' ? 'Export Reports' : activeTab === 'pincodes' ? 'Serviceable Pincodes' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h1>
              <button 
                onClick={handleRefresh} 
                className={`refresh-btn ${isLoading ? 'spin' : ''}`}
                title="Refresh Current Tab Data"
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  background: 'rgba(0, 0, 0, 0.03)', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: '50%', 
                  width: '32px', 
                  height: '32px', 
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  transition: 'all 0.2s ease',
                  padding: 0,
                  marginTop: '2px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--text-main)';
                  e.currentTarget.style.background = 'var(--bg-panel-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--text-muted)';
                  e.currentTarget.style.background = 'rgba(0, 0, 0, 0.03)';
                }}
              >
                <RefreshCw size={14} />
              </button>
            </div>
          </div>

          <div className="header-user">
            <div className="user-info" style={{ textAlign: 'right' }}>
              <div className="user-name">{adminUser?.name || 'Administrator'}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--accent-pink)', fontWeight: 'bold' }}>ADMIN</div>
            </div>
            <div className="user-avatar" style={{ overflow: 'hidden' }}>
              <img src="/user.png" alt="admin" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          </div>
        </header>

        <div className="content-body">
          {isLoading && !stats && !users.length && !orders.length && !payments.length ? (
            <div className="spinner-container">
              <div className="spinner"></div>
              <span>Processing data records...</span>
            </div>
          ) : (
            <>
              {/* Tab 1: Dashboard */}
              {activeTab === 'dashboard' && stats && (
                <div className="animate-fade-in">
                  {/* Stats Cards */}
                  <div className="stats-grid">
                    <div className="glass-panel stat-card">
                      <div className="stat-info">
                        <span className="stat-label">Total Revenue</span>
                        <span className="stat-value">{formatCurrency(stats.metrics.totalRevenue)}</span>
                      </div>
                      <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)' }}>
                        <CreditCard size={24} />
                      </div>
                    </div>

                    <div className="glass-panel stat-card">
                      <div className="stat-info">
                        <span className="stat-label">Registered Users</span>
                        <span className="stat-value">{stats.metrics.totalUsers}</span>
                      </div>
                      <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}>
                        <Users size={24} />
                      </div>
                    </div>

                    <div className="glass-panel stat-card">
                      <div className="stat-info">
                        <span className="stat-label">Active Subscriptions</span>
                        <span className="stat-value">{stats.metrics.activeOrders}</span>
                      </div>
                      <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(233, 30, 138, 0.15)', color: 'var(--accent-pink)' }}>
                        <ShoppingCart size={24} />
                      </div>
                    </div>

                    <div className="glass-panel stat-card">
                      <div className="stat-info">
                        <span className="stat-label">Pending Payments</span>
                        <span className="stat-value">{stats.metrics.pendingPayments}</span>
                      </div>
                      <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', color: 'var(--warning)' }}>
                        <RefreshCw size={24} className="spin" style={{ animation: 'spin 8s linear infinite' }} />
                      </div>
                    </div>

                    <div className="glass-panel stat-card">
                      <div className="stat-info">
                        <span className="stat-label">Total Employees</span>
                        <span className="stat-value">{stats.metrics.totalEmployees || 0}</span>
                      </div>
                      <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(99, 102, 241, 0.15)', color: '#6366f1' }}>
                        <Briefcase size={24} />
                      </div>
                    </div>

                    <div className="glass-panel stat-card">
                      <div className="stat-info">
                        <span className="stat-label">Total Appointments</span>
                        <span className="stat-value">{stats.metrics.totalAppointments || 0}</span>
                      </div>
                      <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(236, 72, 153, 0.15)', color: '#ec4899' }}>
                        <Calendar size={24} />
                      </div>
                    </div>
                  </div>

                  {/* Charts Grid */}
                  <div className="charts-grid">
                    <div className="glass-panel chart-card">
                      <h3 className="chart-title">Revenue Trends</h3>
                      <div className="chart-container">
                        <Bar
                          data={{
                            labels: stats.monthlyTrend.map(t => {
                              const [year, month] = t._id.split('-');
                              return new Date(year, month - 1).toLocaleString('default', { month: 'short' });
                            }),
                            datasets: [{
                              label: 'Monthly Sales (₹)',
                              data: stats.monthlyTrend.map(t => t.revenue),
                              backgroundColor: '#e91e8a',
                              borderRadius: 6,
                            }]
                          }}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: { display: false },
                            },
                            scales: {
                              y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#9ca3af' } },
                              x: { grid: { display: false }, ticks: { color: '#9ca3af' } }
                            }
                          }}
                        />
                      </div>
                    </div>

                    <div className="glass-panel chart-card">
                      <h3 className="chart-title">Package Share</h3>
                      <div className="chart-container">
                        <Doughnut
                          data={{
                            labels: ['Mother Care', 'Baby Care', 'Muma Bundle'],
                            datasets: [{
                              data: [stats.packageStats.mother, stats.packageStats.baby, stats.packageStats.muma],
                              backgroundColor: ['#E91E8A', '#1FBDBD', '#7B2D8B'],
                              borderWidth: 0,
                            }]
                          }}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                position: 'bottom',
                                labels: { color: '#9ca3af', font: { family: 'var(--font-sans)', size: 11 } }
                              }
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Dashboard Tables side-by-side */}
                  <div className="dashboard-tables">
                    <div className="glass-panel" style={{ padding: '24px' }}>
                      <h3 className="chart-title">Recent Subscriptions</h3>
                      <div className="table-container">
                        <table className="admin-table">
                          <thead>
                            <tr>
                              <th>Client</th>
                              <th>Package</th>
                              <th>Amount</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {stats.recentOrders.map(order => (
                              <tr key={order._id}>
                                <td>
                                  <div style={{ fontWeight: '600' }}>{order.user?.name || 'Guest User'}</div>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{order.user?.mobile}</div>
                                </td>
                                <td>
                                  <i className={`fa-solid ${order.icon || 'fa-box'}`} style={{ marginRight: '8px', color: order.accentColor }}></i>
                                  {order.packageTitle} ({order.planLabel})
                                </td>
                                <td>{formatCurrency(order.price)}</td>
                                <td>
                                  <span className={`badge badge-${order.status === 'active' ? 'success' :
                                      order.status === 'completed' ? 'info' :
                                        order.status === 'cancelled' ? 'danger' : 'warning'
                                    }`}>{order.status}</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="glass-panel" style={{ padding: '24px' }}>
                      <h3 className="chart-title">Recent Transactions</h3>
                      <div className="table-container">
                        <table className="admin-table">
                          <thead>
                            <tr>
                              <th>Txn ID</th>
                              <th>Amount</th>
                              <th>Status</th>
                              <th>Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {stats.recentPayments.map(pay => (
                              <tr key={pay._id}>
                                <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{pay.transactionId.substring(0, 16)}...</td>
                                <td>{formatCurrency(pay.amount)}</td>
                                <td>
                                  <span className={`badge badge-${pay.status === 'success' ? 'success' :
                                      pay.status === 'failed' ? 'danger' : 'warning'
                                    }`}>{pay.status}</span>
                                </td>
                                <td>{new Date(pay.createdAt).toLocaleDateString('en-IN')}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Users */}
              {activeTab === 'users' && (
                <div className="glass-panel animate-fade-in" style={{ padding: '24px' }}>
                  {/* Filters */}
                  <div className="filter-bar">
                    <div className="search-input-wrapper">
                      <Search size={18} />
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Search users by name, email or mobile..."
                        value={usersFilters.search}
                        onChange={(e) => setUsersFilters(prev => ({ ...prev, search: e.target.value }))}
                        onKeyDown={(e) => e.key === 'Enter' && fetchUsers(1)}
                      />
                    </div>

                    <select
                      className="form-control filter-select"
                      value={usersFilters.role}
                      onChange={(e) => {
                        setUsersFilters(prev => ({ ...prev, role: e.target.value }));
                        // Fetch immediately on select change
                        setTimeout(() => fetchUsers(1), 0);
                      }}
                    >
                      <option value="">All Roles</option>
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>

                    <select
                      className="form-control filter-select"
                      value={usersFilters.isVerified}
                      onChange={(e) => {
                        setUsersFilters(prev => ({ ...prev, isVerified: e.target.value }));
                        setTimeout(() => fetchUsers(1), 0);
                      }}
                    >
                      <option value="">All States</option>
                      <option value="true">Verified</option>
                      <option value="false">Unverified</option>
                    </select>

                    <button className="btn btn-primary" onClick={() => fetchUsers(1)}>
                      Apply Filters
                    </button>
                  </div>

                  {/* Users Table */}
                  <div className="table-container">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Mobile</th>
                          <th>Role</th>
                          <th>Verified</th>
                          <th>Joined At</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map(user => (
                          <tr key={user._id}>
                            <td style={{ fontWeight: '600' }}>{user.name || '—'}</td>
                            <td>{user.email || '—'}</td>
                            <td>{user.mobile}</td>
                            <td>
                              <span className={`badge ${user.role === 'admin' ? 'badge-pink' : 'badge-info'}`}>
                                {user.role}
                              </span>
                            </td>
                            <td>
                              <span className={`badge ${user.isVerified ? 'badge-success' : 'badge-danger'}`}>
                                {user.isVerified ? 'Verified' : 'Pending'}
                              </span>
                            </td>
                            <td>{formatDate(user.createdAt)}</td>
                            <td className="actions-cell">
                              <button className="btn btn-secondary btn-icon" onClick={() => setEditUser(user)}>
                                <Edit size={16} />
                              </button>
                              <button className="btn btn-danger btn-icon" onClick={() => handleDeleteUser(user._id)}>
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  <div className="pagination">
                    <div className="pagination-info">
                      Showing page {usersPagination.page} of {usersPagination.pages} ({usersPagination.total} total records)
                    </div>
                    <div className="pagination-nav">
                      <button
                        className="pagination-btn"
                        disabled={usersPagination.page === 1}
                        onClick={() => fetchUsers(usersPagination.page - 1)}
                      >
                        Prev
                      </button>
                      <button
                        className="pagination-btn"
                        disabled={usersPagination.page === usersPagination.pages}
                        onClick={() => fetchUsers(usersPagination.page + 1)}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Orders */}
              {activeTab === 'orders' && (
                <div className="glass-panel animate-fade-in" style={{ padding: '24px' }}>
                  {/* Filters */}
                  <div className="filter-bar">
                    <div className="search-input-wrapper">
                      <Search size={18} />
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Search order ID or transaction ID..."
                        value={ordersFilters.search}
                        onChange={(e) => setOrdersFilters(prev => ({ ...prev, search: e.target.value }))}
                        onKeyDown={(e) => e.key === 'Enter' && fetchOrders(1)}
                      />
                    </div>

                    <select
                      className="form-control filter-select"
                      value={ordersFilters.packageType}
                      onChange={(e) => {
                        setOrdersFilters(prev => ({ ...prev, packageType: e.target.value }));
                        setTimeout(() => fetchOrders(1), 0);
                      }}
                    >
                      <option value="">All Packages</option>
                      <option value="mother">Mother Care</option>
                      <option value="baby">Baby Care</option>
                      <option value="muma">Muma Bundle</option>
                    </select>

                    <select
                      className="form-control filter-select"
                      value={ordersFilters.status}
                      onChange={(e) => {
                        setOrdersFilters(prev => ({ ...prev, status: e.target.value }));
                        setTimeout(() => fetchOrders(1), 0);
                      }}
                    >
                      <option value="">All Statuses</option>
                      <option value="created">Created</option>
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>

                    <select
                      className="form-control filter-select"
                      value={ordersFilters.paymentStatus}
                      onChange={(e) => {
                        setOrdersFilters(prev => ({ ...prev, paymentStatus: e.target.value }));
                        setTimeout(() => fetchOrders(1), 0);
                      }}
                    >
                      <option value="">All Payments</option>
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="success">Success</option>
                      <option value="failed">Failed</option>
                      <option value="refunded">Refunded</option>
                    </select>

                    <button className="btn btn-primary" onClick={() => fetchOrders(1)}>
                      Apply Filters
                    </button>
                  </div>

                  {/* Orders Table */}
                  <div className="table-container">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Order ID</th>
                          <th>Client details</th>
                          <th>Package Detail</th>
                          <th>Amount</th>
                          <th>Subscription Status</th>
                          <th>Payment State</th>
                          <th>Active Window</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map(order => (
                          <tr key={order._id}>
                            <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{order._id}</td>
                            <td>
                              <div style={{ fontWeight: '600' }}>{order.user?.name || 'Guest User'}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{order.user?.mobile}</div>
                            </td>
                            <td>
                              <i className={`fa-solid ${order.icon || 'fa-box'}`} style={{ marginRight: '8px', color: order.accentColor }}></i>
                              {order.packageTitle} ({order.planLabel})
                            </td>
                            <td>{formatCurrency(order.price)}</td>
                            <td>
                              <span className={`badge badge-${order.status === 'active' ? 'success' :
                                  order.status === 'completed' ? 'info' :
                                    order.status === 'cancelled' ? 'danger' : 'warning'
                                }`}>{order.status}</span>
                            </td>
                            <td>
                              <span className={`badge badge-${order.paymentStatus === 'success' ? 'success' :
                                  order.paymentStatus === 'failed' ? 'danger' :
                                    order.paymentStatus === 'pending' ? 'warning' : 'info'
                                }`}>{order.paymentStatus}</span>
                            </td>
                            <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              <div><strong>Start:</strong> {formatOnlyDate(order.activatedAt)}</div>
                              <div><strong>End:</strong> {formatOnlyDate(order.expiresAt)}</div>
                            </td>
                            <td className="actions-cell">
                              {order.paymentStatus === 'success' && (
                                <button
                                  className="btn btn-success btn-icon"
                                  onClick={() => handleScheduleFromOrder(order)}
                                  title="Schedule Appointment"
                                >
                                  <Calendar size={16} />
                                </button>
                              )}
                              <button className="btn btn-secondary btn-icon" onClick={() => setEditOrder(order)}>
                                <Edit size={16} />
                              </button>
                              <button className="btn btn-danger btn-icon" onClick={() => handleDeleteOrder(order._id)}>
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  <div className="pagination">
                    <div className="pagination-info">
                      Showing page {ordersPagination.page} of {ordersPagination.pages} ({ordersPagination.total} total records)
                    </div>
                    <div className="pagination-nav">
                      <button
                        className="pagination-btn"
                        disabled={ordersPagination.page === 1}
                        onClick={() => fetchOrders(ordersPagination.page - 1)}
                      >
                        Prev
                      </button>
                      <button
                        className="pagination-btn"
                        disabled={ordersPagination.page === ordersPagination.pages}
                        onClick={() => fetchOrders(ordersPagination.page + 1)}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: Payments */}
              {activeTab === 'payments' && (
                <div className="glass-panel animate-fade-in" style={{ padding: '24px' }}>
                  {/* Filters */}
                  <div className="filter-bar">
                    <div className="search-input-wrapper">
                      <Search size={18} />
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Search Transaction ID, UPI ID or reference..."
                        value={paymentsFilters.search}
                        onChange={(e) => setPaymentsFilters(prev => ({ ...prev, search: e.target.value }))}
                        onKeyDown={(e) => e.key === 'Enter' && fetchPayments(1)}
                      />
                    </div>

                    <select
                      className="form-control filter-select"
                      value={paymentsFilters.status}
                      onChange={(e) => {
                        setPaymentsFilters(prev => ({ ...prev, status: e.target.value }));
                        setTimeout(() => fetchPayments(1), 0);
                      }}
                    >
                      <option value="">All Statuses</option>
                      <option value="initiated">Initiated</option>
                      <option value="pending">Pending</option>
                      <option value="success">Success</option>
                      <option value="failed">Failed</option>
                      <option value="refunded">Refunded</option>
                    </select>

                    <button className="btn btn-primary" onClick={() => fetchPayments(1)}>
                      Apply Filters
                    </button>
                  </div>

                  {/* Payments Table */}
                  <div className="table-container">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Transaction ID</th>
                          <th>Client details</th>
                          <th>Order package</th>
                          <th>Amount</th>
                          <th>UPI Reference</th>
                          <th>Status</th>
                          <th>Date</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payments.map(pay => (
                          <tr key={pay._id}>
                            <td style={{ fontFamily: 'monospace', fontSize: '0.85rem', fontWeight: 'bold' }}>{pay.transactionId}</td>
                            <td>
                              <div style={{ fontWeight: '600' }}>{pay.user?.name || 'Guest User'}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{pay.user?.mobile}</div>
                            </td>
                            <td>{pay.order?.packageTitle || '—'} ({pay.order?.planLabel || '—'})</td>
                            <td>{formatCurrency(pay.amount)}</td>
                            <td>
                              <div style={{ fontSize: '0.85rem' }}><strong>UPI ID:</strong> {pay.upiId || '—'}</div>
                              <div style={{ fontSize: '0.85rem' }}><strong>Ref No:</strong> {pay.upiRef || '—'}</div>
                            </td>
                            <td>
                              <span className={`badge badge-${pay.status === 'success' ? 'success' :
                                  pay.status === 'failed' ? 'danger' : 'warning'
                                }`}>{pay.status}</span>
                            </td>
                            <td>{formatDate(pay.paidAt || pay.createdAt)}</td>
                            <td className="actions-cell">
                              <button className="btn btn-secondary btn-icon" onClick={() => setEditPayment(pay)}>
                                <Edit size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  <div className="pagination">
                    <div className="pagination-info">
                      Showing page {paymentsPagination.page} of {paymentsPagination.pages} ({paymentsPagination.total} total records)
                    </div>
                    <div className="pagination-nav">
                      <button
                        className="pagination-btn"
                        disabled={paymentsPagination.page === 1}
                        onClick={() => fetchPayments(paymentsPagination.page - 1)}
                      >
                        Prev
                      </button>
                      <button
                        className="pagination-btn"
                        disabled={paymentsPagination.page === paymentsPagination.pages}
                        onClick={() => fetchPayments(paymentsPagination.page + 1)}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {/* Tab 5: Packages */}
              {activeTab === 'packages' && (
                <div className="animate-fade-in">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>Manage Packages</h2>
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        setEditPackage({
                          type: '',
                          title: '',
                          subtitle: '',
                          tagline: '',
                          icon: 'fa-box',
                          accentColor: '#E91E8A',
                          startingPrice: 0,
                          features: [''],
                          plans: {
                            '1month': { key: '1month', label: '1 Month', price: 0, originalPrice: 0, savings: '', badge: '', features: [''] },
                            '3month': { key: '3month', label: '3 Months', price: 0, originalPrice: 0, savings: '', badge: '', features: [''] },
                            '6month': { key: '6month', label: '6 Months', price: 0, originalPrice: 0, savings: '', badge: '', features: [''] },
                          }
                        });
                        setShowAddPackageModal(true);
                      }}
                    >
                      + Add New Package
                    </button>
                  </div>

                  <div className="packages-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
                    {packages.map(pkg => (
                      <div key={pkg._id} className="glass-panel" style={{ borderTop: `4px solid ${pkg.accentColor}`, padding: '24px', display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                          <div style={{ fontSize: '2.5rem', color: pkg.accentColor }}><i className={`fa-solid ${pkg.icon || 'fa-box'}`}></i></div>
                          <span className="badge" style={{ backgroundColor: `${pkg.accentColor}20`, color: pkg.accentColor, fontWeight: 'bold' }}>{pkg.type.toUpperCase()}</span>
                        </div>

                        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: '0 0 8px 0', color: 'var(--text)' }}>{pkg.title}</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 16px 0', lineHeight: '1.4' }}>{pkg.subtitle}</p>

                        <div style={{ marginBottom: '16px' }}>
                          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold', marginBottom: '8px' }}>Core Features</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {pkg.features.map((f, i) => (
                              <span key={i} className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', fontSize: '0.75rem' }}>{f}</span>
                            ))}
                          </div>
                        </div>

                        <div style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Starting from</span>
                            <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--success)' }}>{formatCurrency(pkg.startingPrice)}</span>
                          </div>

                          <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                              className="btn btn-secondary"
                              style={{ flex: 1, padding: '8px 12px', fontSize: '0.85rem' }}
                              onClick={() => {
                                const safePkg = {
                                  ...pkg,
                                  features: pkg.features || [],
                                  plans: {
                                    '1month': { ...pkg.plans?.['1month'], features: pkg.plans?.['1month']?.features || [] },
                                    '3month': { ...pkg.plans?.['3month'], features: pkg.plans?.['3month']?.features || [] },
                                    '6month': { ...pkg.plans?.['6month'], features: pkg.plans?.['6month']?.features || [] },
                                  }
                                };
                                setEditPackage(safePkg);
                              }}
                            >
                              Edit details & plans
                            </button>
                            <button
                              className="btn btn-danger btn-icon"
                              style={{ padding: '8px 12px' }}
                              onClick={() => handleDeletePackage(pkg._id)}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 6: Employees */}
              {activeTab === 'employees' && (
                <div className="glass-panel animate-fade-in" style={{ padding: '24px' }}>
                  {/* Filters */}
                  <div className="filter-bar">
                    <div className="search-input-wrapper">
                      <Search size={18} />
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Search employees by name, email or mobile..."
                        value={employeesFilters.search}
                        onChange={(e) => setEmployeesFilters(prev => ({ ...prev, search: e.target.value }))}
                        onKeyDown={(e) => e.key === 'Enter' && fetchEmployees()}
                      />
                    </div>

                    <select
                      className="form-control filter-select"
                      value={employeesFilters.status}
                      onChange={(e) => {
                        setEmployeesFilters(prev => ({ ...prev, status: e.target.value }));
                        setTimeout(() => fetchEmployees(), 0);
                      }}
                    >
                      <option value="">All Statuses</option>
                      <option value="true">Approved</option>
                      <option value="false">Pending Approval</option>
                    </select>

                    <button className="btn btn-primary" onClick={fetchEmployees}>
                      Apply Filters
                    </button>
                  </div>

                  {/* Employees Table */}
                  <div className="table-container">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Photo</th>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Mobile</th>
                          <th>Occupation</th>
                          <th>Aadhar No</th>
                          <th>Approval Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {employees.map(emp => (
                          <tr key={emp._id}>
                            <td>
                              <img
                                src={getImageUrl(emp.userPhoto) || '/user.png'}
                                alt={emp.name}
                                style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)', cursor: 'zoom-in' }}
                                onClick={() => setPreviewImage(getImageUrl(emp.userPhoto) || '/user.png')}
                                onError={(e) => { e.target.src = '/user.png'; }}
                              />
                            </td>
                            <td style={{ fontWeight: '600' }}>{emp.name || '—'}</td>
                            <td>{emp.email || '—'}</td>
                            <td>{emp.mobile}</td>
                            <td>{emp.occupation || '—'}</td>
                            <td style={{ fontFamily: 'monospace' }}>{emp.aadharNumber || '—'}</td>
                            <td>
                              <span className={`badge ${emp.isVerifiedEmployee ? 'badge-success' : 'badge-danger'}`}>
                                {emp.isVerifiedEmployee ? 'Approved' : 'Pending Approval'}
                              </span>
                            </td>
                            <td className="actions-cell">
                              <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.8rem' }} onClick={() => setViewEmployeeDocs(emp)}>
                                View Docs
                              </button>
                              {emp.isVerifiedEmployee ? (
                                <button className="btn btn-danger" style={{ padding: '4px 10px', fontSize: '0.8rem' }} onClick={() => handleApproveEmployee(emp._id, false)}>
                                  Revoke
                                </button>
                              ) : (
                                <button className="btn btn-success" style={{ padding: '4px 10px', fontSize: '0.8rem' }} onClick={() => handleApproveEmployee(emp._id, true)}>
                                  Approve
                                </button>
                              )}
                              <button className="btn btn-danger btn-icon" onClick={() => handleDeleteEmployee(emp._id)} title="Delete Employee" style={{ padding: '4px' }}>
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {employees.length === 0 && (
                          <tr>
                            <td colSpan="8" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                              No employees found matching the filters
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tab 7: Appointments */}
              {activeTab === 'appointments' && (
                <div className="glass-panel animate-fade-in" style={{ padding: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <div className="filter-bar" style={{ margin: 0, flex: 1 }}>
                      <div className="search-input-wrapper">
                        <Search size={18} />
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Search customer, mobile, or employee..."
                          value={appointmentsFilters.search}
                          onChange={(e) => setAppointmentsFilters(prev => ({ ...prev, search: e.target.value }))}
                          onKeyDown={(e) => e.key === 'Enter' && fetchAppointments()}
                        />
                      </div>

                      <select
                        className="form-control filter-select"
                        value={appointmentsFilters.status}
                        onChange={(e) => {
                          setAppointmentsFilters(prev => ({ ...prev, status: e.target.value }));
                          setTimeout(() => fetchAppointments(), 0);
                        }}
                      >
                        <option value="">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="checked_in">Checked In</option>
                        <option value="completed">Completed</option>
                      </select>

                      <button className="btn btn-primary" onClick={fetchAppointments}>
                        Apply Filters
                      </button>
                    </div>
                    
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        setSelectedOrder(null);
                        setSelectedOrderId('');
                        setNewAppointment({
                          customerName: '',
                          customerMobile: '',
                          customerAddress: '',
                          dateTime: '',
                          details: '',
                          assignedEmployee: ''
                        });
                        setShowAddAppointmentModal(true);
                      }}
                      style={{ marginLeft: '16px' }}
                    >
                      + Create Appointment
                    </button>
                  </div>

                  {/* Appointments Table */}
                  <div className="table-container">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Customer</th>
                          <th>Details</th>
                          <th>Schedule</th>
                          <th>Assigned Employee</th>
                          <th>OTP</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {appointments.map(appt => (
                          <tr key={appt._id}>
                            <td>
                              <div style={{ fontWeight: '600' }}>{appt.customerName}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{appt.customerMobile}</div>
                            </td>
                            <td style={{ fontSize: '0.85rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={appt.details || '—'}>
                              {appt.details || '—'}
                            </td>
                            <td style={{ fontSize: '0.8rem' }}>{formatDate(appt.dateTime)}</td>
                            <td>
                              {appt.assignedEmployee ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <img
                                    src={getImageUrl(appt.assignedEmployee.userPhoto) || '/user.png'}
                                    alt={appt.assignedEmployee.name}
                                    style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover', cursor: 'zoom-in' }}
                                    onClick={() => setPreviewImage(getImageUrl(appt.assignedEmployee.userPhoto) || '/user.png')}
                                    onError={(e) => { e.target.src = '/user.png'; }}
                                  />
                                  <div>
                                    <div style={{ fontWeight: '500', fontSize: '0.85rem' }}>{appt.assignedEmployee.name}</div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{appt.assignedEmployee.occupation}</div>
                                  </div>
                                </div>
                              ) : (
                                <span style={{ color: 'var(--error)', fontStyle: 'italic', fontSize: '0.85rem' }}>Unassigned</span>
                              )}
                            </td>
                            <td style={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: '0.9rem' }}>{appt.otp}</td>
                            <td>
                              <span className={`badge badge-${appt.status === 'checked_in' ? 'success' : appt.status === 'completed' ? 'info' : 'warning'}`}>
                                {appt.status}
                              </span>
                            </td>
                            <td className="actions-cell">
                              <button
                                className="btn btn-secondary btn-icon"
                                onClick={() => {
                                  setEditAppointment({
                                    _id: appt._id,
                                    customerName: appt.customerName || '',
                                    customerMobile: appt.customerMobile || '',
                                    customerAddress: appt.customerAddress || '',
                                    dateTime: toLocalISOString(appt.dateTime),
                                    details: appt.details || '',
                                    assignedEmployee: appt.assignedEmployee ? (appt.assignedEmployee._id || appt.assignedEmployee) : '',
                                    status: appt.status || 'pending'
                                  });
                                }}
                                title="Edit Appointment"
                              >
                                <Edit size={16} />
                              </button>
                              <button className="btn btn-danger btn-icon" onClick={() => handleDeleteAppointment(appt._id)} title="Delete Appointment">
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {appointments.length === 0 && (
                          <tr>
                            <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                              No appointments found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tab: Check-ins */}
              {activeTab === 'checkins' && (() => {
                // Filter appointments (showing check-ins and pending check-ins)
                const checkedInAppts = appointments.filter(appt => {
                  // Filter by date
                  if (checkinDateFilter) {
                    const targetDate = appt.checkinTime || appt.dateTime;
                    const apptDateStr = toLocalDateString(targetDate);
                    if (apptDateStr !== checkinDateFilter) return false;
                  }
                  
                  // Filter by search
                  if (checkinSearchFilter) {
                    const q = checkinSearchFilter.toLowerCase();
                    const empName = appt.assignedEmployee?.name?.toLowerCase() || '';
                    const custName = appt.customerName?.toLowerCase() || '';
                    const details = appt.details?.toLowerCase() || '';
                    if (!empName.includes(q) && !custName.includes(q) && !details.includes(q)) return false;
                  }
                  
                  return true;
                });

                // Sort: checked_in first, then pending, then completed. Newest time first within each status.
                const sortedCheckedInAppts = [...checkedInAppts].sort((a, b) => {
                  const statusWeight = {
                    checked_in: 1,
                    pending: 2,
                    completed: 3
                  };
                  const wA = statusWeight[a.status] || 99;
                  const wB = statusWeight[b.status] || 99;
                  if (wA !== wB) return wA - wB;
                  
                  const tA = new Date(a.checkinTime || a.dateTime).getTime();
                  const tB = new Date(b.checkinTime || b.dateTime).getTime();
                  return tB - tA;
                });

                // Calculate metrics for selected date (or overall if date is cleared)
                const todayStr = toLocalDateString(new Date());
                const checkinsToday = appointments.filter(appt => appt.checkinTime && toLocalDateString(appt.checkinTime) === todayStr);
                const totalCheckinsTodayCount = checkinsToday.length;
                const completedTodayCount = checkinsToday.filter(appt => appt.status === 'completed').length;
                const activeServicesCount = appointments.filter(appt => appt.status === 'checked_in').length;
                const pendingTodayCount = appointments.filter(appt => appt.status === 'pending' && toLocalDateString(appt.dateTime) === todayStr).length;

                return (
                  <div className="glass-panel animate-fade-in" style={{ padding: '24px' }}>
                    
                    {/* Metrics Header */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                      <div className="stat-card" style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Present Today</div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 'bold', marginTop: '6px', color: 'var(--text)' }}>{totalCheckinsTodayCount}</div>
                      </div>
                      <div className="stat-card" style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Completed Services Today</div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 'bold', marginTop: '6px', color: 'var(--accent-pink)' }}>{completedTodayCount}</div>
                      </div>
                      <div className="stat-card" style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Currently Checked In (Active)</div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 'bold', marginTop: '6px', color: '#10b981' }}>{activeServicesCount}</div>
                      </div>
                      <div className="stat-card" style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pending Attendance Today</div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 'bold', marginTop: '6px', color: 'var(--warning)' }}>{pendingTodayCount}</div>
                      </div>
                    </div>

                    {/* Filters bar */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                      <div className="filter-bar" style={{ margin: 0, flex: 1, display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        
                        {/* Search Input */}
                        <div className="search-input-wrapper" style={{ minWidth: '250px' }}>
                          <Search size={18} />
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Search employee or customer..."
                            value={checkinSearchFilter}
                            onChange={(e) => setCheckinSearchFilter(e.target.value)}
                          />
                        </div>

                        {/* Date Filter Input */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.04)', padding: '2px 12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                          <Calendar size={16} style={{ color: 'var(--text-muted)' }} />
                          <input
                            type="date"
                            className="form-control"
                            style={{ background: 'transparent', border: 'none', color: 'var(--text)', padding: '6px 0', fontSize: '0.9rem', outline: 'none' }}
                            value={checkinDateFilter}
                            onChange={(e) => setCheckinDateFilter(e.target.value)}
                          />
                        </div>

                        {/* Clear Date button / Today Button */}
                        {checkinDateFilter && (
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '8px 16px' }}
                            onClick={() => setCheckinDateFilter('')}
                          >
                            All Dates
                          </button>
                        )}
                        
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '8px 16px' }}
                          onClick={() => setCheckinDateFilter(toLocalDateString(new Date()))}
                        >
                          Today
                        </button>
                      </div>
                    </div>

                    {/* Check-ins Table */}
                    <div className="table-container">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Attendance Time</th>
                            <th>Employee</th>
                            <th>Customer</th>
                            <th>Appointment Address</th>
                            <th>Check-in Location</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sortedCheckedInAppts.map(appt => (
                            <tr key={appt._id}>
                              <td style={{ fontSize: '0.85rem' }}>
                                <div style={{ fontWeight: '600' }}>{formatDate(appt.checkinTime)}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                  Scheduled: {formatDate(appt.dateTime)}
                                </div>
                              </td>
                              <td>
                                {appt.assignedEmployee ? (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <img
                                      src={getImageUrl(appt.assignedEmployee.userPhoto) || '/user.png'}
                                      alt={appt.assignedEmployee.name}
                                      style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }}
                                      onError={(e) => { e.target.src = '/user.png'; }}
                                    />
                                    <div>
                                      <div style={{ fontWeight: '500', fontSize: '0.85rem' }}>{appt.assignedEmployee.name}</div>
                                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{appt.assignedEmployee.occupation}</div>
                                    </div>
                                  </div>
                                ) : (
                                  <span style={{ color: 'var(--error)', fontStyle: 'italic', fontSize: '0.85rem' }}>Unknown Employee</span>
                                )}
                              </td>
                              <td>
                                <div style={{ fontWeight: '600', fontSize: '0.85rem' }}>{appt.customerName}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{appt.customerMobile}</div>
                              </td>
                              <td style={{ fontSize: '0.8rem', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={appt.customerAddress}>
                                {appt.customerAddress}
                              </td>
                              <td>
                                {appt.checkinLocation && appt.checkinLocation.latitude !== null && appt.checkinLocation.longitude !== null ? (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <MapPin size={14} style={{ color: 'var(--accent-pink)' }} />
                                    <a
                                      href={`https://maps.google.com/?q=${appt.checkinLocation.latitude},${appt.checkinLocation.longitude}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{ color: '#3b82f6', textDecoration: 'none', fontSize: '0.85rem', fontWeight: '500' }}
                                    >
                                      {appt.checkinLocation.latitude.toFixed(5)}, {appt.checkinLocation.longitude.toFixed(5)}
                                    </a>
                                  </div>
                                ) : (
                                  <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No coordinates</span>
                                )}
                              </td>
                              <td>
                                <span className={`badge badge-${appt.status === 'checked_in' ? 'success' : appt.status === 'completed' ? 'info' : 'warning'}`}>
                                  {appt.status === 'checked_in' ? 'In Progress' : appt.status === 'pending' ? 'Pending' : appt.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                          {sortedCheckedInAppts.length === 0 && (
                            <tr>
                              <td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                                No attendance or pending services for this day
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}

              {/* Tab 8: Timeslots */}
              {activeTab === 'timeslots' && (
                <div className="animate-fade-in">
                  <div style={{ marginBottom: '24px' }}>
                    <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>Manage Timeslots</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
                      Configure the preferred times selectable by customers for morning, afternoon, and evening slots.
                    </p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
                    {['morning', 'afternoon', 'evening'].map(slotKey => {
                      const slotTimes = timeslots[slotKey] || [];
                      return (
                        <div key={slotKey} className="glass-panel" style={{ padding: '24px', borderTop: `4px solid ${slotKey === 'morning' ? '#f59e0b' : slotKey === 'afternoon' ? '#10b981' : '#e91e8a'}` }}>
                          <h3 style={{ textTransform: 'capitalize', fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Clock size={18} color={slotKey === 'morning' ? '#f59e0b' : slotKey === 'afternoon' ? '#10b981' : '#e91e8a'} />
                            {slotKey} Slot
                          </h3>

                          {/* Pills container */}
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px', minHeight: '60px', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                            {slotTimes.length > 0 ? slotTimes.map((time, idx) => {
                              const isEditing = editingTime.slotKey === slotKey && editingTime.index === idx;
                              return (
                                <span 
                                  key={idx} 
                                  style={{ 
                                    display: 'inline-flex', 
                                    alignItems: 'center', 
                                    gap: '6px', 
                                    padding: isEditing ? '3px 8px' : '6px 12px', 
                                    background: 'rgba(255,255,255,0.05)', 
                                    border: '1px solid var(--border-color)', 
                                    borderRadius: '20px', 
                                    fontSize: '0.85rem',
                                    color: 'var(--text-main)'
                                  }}
                                >
                                  {isEditing ? (
                                    <form
                                      onSubmit={(e) => {
                                        e.preventDefault();
                                        const rawVal = editingTime.value;
                                        if (!rawVal) return;
                                        const val = convert24To12(rawVal);
                                        if (slotTimes.includes(val) && slotTimes[idx] !== val) {
                                          showToast('Time already exists', 'error');
                                          return;
                                        }
                                        const updated = [...slotTimes];
                                        updated[idx] = val;
                                        handleUpdateTimeslot(slotKey, updated);
                                        setEditingTime({ slotKey: null, index: null, value: '' });
                                      }}
                                      style={{ display: 'inline-flex', alignItems: 'center' }}
                                    >
                                      <input
                                        type="time"
                                        value={editingTime.value}
                                        onChange={(e) => setEditingTime(prev => ({ ...prev, value: e.target.value }))}
                                        style={{
                                          padding: '2px 6px',
                                          fontSize: '0.8rem',
                                          height: '22px',
                                          width: '105px',
                                          border: '1px solid var(--accent-pink)',
                                          borderRadius: '4px',
                                          background: '#ffffff',
                                          color: 'var(--text-main)',
                                          outline: 'none'
                                        }}
                                        autoFocus
                                        onKeyDown={(e) => {
                                          if (e.key === 'Escape') {
                                            setEditingTime({ slotKey: null, index: null, value: '' });
                                          }
                                        }}
                                        onBlur={() => {
                                          setTimeout(() => {
                                            setEditingTime({ slotKey: null, index: null, value: '' });
                                          }, 200);
                                        }}
                                      />
                                    </form>
                                  ) : (
                                    <>
                                      <span 
                                        onClick={() => setEditingTime({ slotKey, index: idx, value: convert12To24(time) })}
                                        style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                        title="Click to edit"
                                      >
                                        {time}
                                        <Edit size={10} style={{ color: 'var(--text-muted)', opacity: 0.6 }} />
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (window.confirm(`Are you sure you want to delete "${time}" from the ${slotKey} slot?`)) {
                                            const updated = slotTimes.filter((_, i) => i !== idx);
                                            handleUpdateTimeslot(slotKey, updated);
                                          }
                                        }}
                                        style={{ 
                                          border: 'none', 
                                          background: 'transparent', 
                                          color: '#ef4444', 
                                          cursor: 'pointer',
                                          fontSize: '0.8rem',
                                          padding: '0 2px',
                                          display: 'flex',
                                          alignItems: 'center'
                                        }}
                                      >
                                        <X size={12} />
                                      </button>
                                    </>
                                  )}
                                </span>
                              );
                            }) : (
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic', margin: 'auto' }}>No times configured</span>
                            )}
                          </div>

                          {/* Add Form */}
                          <form onSubmit={(e) => {
                            e.preventDefault();
                            const rawVal = newTimeInputs[slotKey];
                            if (!rawVal) return;
                            const val = convert24To12(rawVal);
                            if (slotTimes.includes(val)) {
                              showToast('Time already exists', 'error');
                              return;
                            }
                            const updated = [...slotTimes, val];
                            handleUpdateTimeslot(slotKey, updated);
                            setNewTimeInputs(prev => ({ ...prev, [slotKey]: '' }));
                          }} style={{ display: 'flex', gap: '10px' }}>
                            <input
                              type="time"
                              className="form-control"
                              value={newTimeInputs[slotKey] || ''}
                              onChange={(e) => setNewTimeInputs(prev => ({ ...prev, [slotKey]: e.target.value }))}
                              style={{ flexGrow: 1 }}
                            />
                            <button type="submit" className="btn btn-primary" style={{ padding: '8px 16px', whiteSpace: 'nowrap' }}>
                              Add Time
                            </button>
                          </form>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tab: Reports */}
              {activeTab === 'reports' && (
                <div className="glass-panel animate-fade-in" style={{ padding: '24px' }}>
                  <div style={{ marginBottom: '24px' }}>
                    <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>Export Data Reports</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
                      Select a date range filter (optional) and download data logs instantly in CSV format.
                    </p>
                  </div>

                  {/* Date Range Filters */}
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '12px', marginBottom: '32px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Start Date</span>
                      <input 
                        type="date" 
                        className="form-control" 
                        value={reportStartDate} 
                        onChange={(e) => setReportStartDate(e.target.value)} 
                        style={{ width: '180px' }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>End Date</span>
                      <input 
                        type="date" 
                        className="form-control" 
                        value={reportEndDate} 
                        onChange={(e) => setReportEndDate(e.target.value)} 
                        style={{ width: '180px' }}
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                      {(reportStartDate || reportEndDate) && (
                        <button 
                          className="btn btn-secondary" 
                          onClick={() => {
                            setReportStartDate('');
                            setReportEndDate('');
                          }}
                          style={{ height: '40px' }}
                        >
                          Clear Filters
                        </button>
                      )}
                    </div>
                  </div>

                  {loadingReportData ? (
                    <div className="spinner-container" style={{ minHeight: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                      <div className="spinner"></div>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Caching reports datasets...</span>
                    </div>
                  ) : (
                    <>
                      {/* Graphical Analytics Section */}
                      <div style={{ marginBottom: '36px' }}>
                        <h3 style={{ margin: '0 0 20px 0', fontSize: '1.25rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ display: 'inline-block', width: '4px', height: '18px', backgroundColor: 'var(--accent-pink)', borderRadius: '2px' }}></span>
                          Graphical Analytics
                        </h3>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
                          {/* Chart 1: Signups Distribution */}
                          <div className="glass-panel chart-card" style={{ border: '1px solid var(--border-color)', borderRadius: '12px', minHeight: '340px' }}>
                            <h4 className="chart-title" style={{ margin: '0 0 16px 0', fontSize: '1rem', fontWeight: '600' }}>Signups (Users vs Employees)</h4>
                            <div className="chart-container" style={{ flexGrow: 1, position: 'relative' }}>
                              <Bar
                                data={{
                                  labels: ['Clients', 'Employees'],
                                  datasets: [{
                                    label: 'Registrations',
                                    data: [reportFilteredData.userEmployeeCounts.users, reportFilteredData.userEmployeeCounts.employees],
                                    backgroundColor: ['#3b82f6', '#f59e0b'],
                                    borderRadius: 4,
                                    barThickness: 30
                                  }]
                                }}
                                options={{
                                  responsive: true,
                                  maintainAspectRatio: false,
                                  plugins: {
                                    legend: { display: false }
                                  },
                                  scales: {
                                    y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#9ca3af', precision: 0 } },
                                    x: { grid: { display: false }, ticks: { color: '#9ca3af' } }
                                  }
                                }}
                              />
                            </div>
                          </div>

                          {/* Chart 2: Package Share */}
                          <div className="glass-panel chart-card" style={{ border: '1px solid var(--border-color)', borderRadius: '12px', minHeight: '340px' }}>
                            <h4 className="chart-title" style={{ margin: '0 0 16px 0', fontSize: '1rem', fontWeight: '600' }}>Package Share (Orders count)</h4>
                            <div className="chart-container" style={{ flexGrow: 1, position: 'relative' }}>
                              <Doughnut
                                data={{
                                  labels: ['Mother Care', 'Baby Care', 'Muma Bundle'],
                                  datasets: [{
                                    data: [reportFilteredData.packageStats.mother, reportFilteredData.packageStats.baby, reportFilteredData.packageStats.muma],
                                    backgroundColor: ['#e91e8a', '#1fbdbd', '#7b2d8b'],
                                    borderWidth: 0
                                  }]
                                }}
                                options={{
                                  responsive: true,
                                  maintainAspectRatio: false,
                                  plugins: {
                                    legend: {
                                      position: 'bottom',
                                      labels: { color: '#9ca3af', boxWidth: 12, font: { family: 'var(--font-sans)', size: 11 } }
                                    }
                                  }
                                }}
                              />
                            </div>
                          </div>

                          {/* Chart 3: Revenue Trend */}
                          <div className="glass-panel chart-card" style={{ border: '1px solid var(--border-color)', borderRadius: '12px', minHeight: '340px' }}>
                            <h4 className="chart-title" style={{ margin: '0 0 16px 0', fontSize: '1rem', fontWeight: '600' }}>Revenue Trend (₹ Earning)</h4>
                            <div className="chart-container" style={{ flexGrow: 1, position: 'relative' }}>
                              <Bar
                                data={{
                                  labels: reportFilteredData.revenueTrend.labels,
                                  datasets: [{
                                    label: 'Revenue (₹)',
                                    data: reportFilteredData.revenueTrend.data,
                                    backgroundColor: '#10b981',
                                    borderRadius: 4,
                                  }]
                                }}
                                options={{
                                  responsive: true,
                                  maintainAspectRatio: false,
                                  plugins: {
                                    legend: { display: false }
                                  },
                                  scales: {
                                    y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#9ca3af' } },
                                    x: { grid: { display: false }, ticks: { color: '#9ca3af', font: { size: 10 } } }
                                  }
                                }}
                              />
                            </div>
                          </div>

                          {/* Chart 4: Employee Signup Trend */}
                          <div className="glass-panel chart-card" style={{ border: '1px solid var(--border-color)', borderRadius: '12px', minHeight: '340px' }}>
                            <h4 className="chart-title" style={{ margin: '0 0 16px 0', fontSize: '1rem', fontWeight: '600' }}>Employee Signup Trend</h4>
                            <div className="chart-container" style={{ flexGrow: 1, position: 'relative' }}>
                              <Line
                                data={{
                                  labels: reportFilteredData.employeeTrend.labels,
                                  datasets: [{
                                    label: 'Employee Signups',
                                    data: reportFilteredData.employeeTrend.data,
                                    borderColor: '#f59e0b',
                                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                                    tension: 0.3,
                                    fill: true,
                                    pointBackgroundColor: '#f59e0b',
                                    pointBorderColor: '#fff',
                                    pointHoverRadius: 6,
                                  }]
                                }}
                                options={{
                                  responsive: true,
                                  maintainAspectRatio: false,
                                  plugins: {
                                    legend: { display: false }
                                  },
                                  scales: {
                                    y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#9ca3af', precision: 0 } },
                                    x: { grid: { display: false }, ticks: { color: '#9ca3af', font: { size: 10 } } }
                                  }
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Export Categories Section */}
                      <div>
                        <h3 style={{ margin: '0 0 20px 0', fontSize: '1.25rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ display: 'inline-block', width: '4px', height: '18px', backgroundColor: 'var(--accent-pink)', borderRadius: '2px' }}></span>
                          CSV Reports Export
                        </h3>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                          
                          {/* Users Card */}
                          <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid var(--border-color)', borderRadius: '12px', minHeight: '180px' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                <div style={{ padding: '10px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', borderRadius: '8px' }}>
                                  <Users size={20} />
                                </div>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', margin: 0 }}>Registered Users</h3>
                              </div>
                              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4', margin: '0 0 16px 0' }}>
                                Download the list of all registered clients, including contact emails, mobile numbers, verification status, and creation dates.
                              </p>
                            </div>
                            <button 
                              className="btn btn-primary" 
                              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                              onClick={() => handleExport('users')}
                              disabled={exportingType !== null}
                            >
                              <Download size={16} />
                              {exportingType === 'users' ? 'Exporting...' : 'Export Users List'}
                            </button>
                          </div>

                          {/* Orders Card */}
                          <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid var(--border-color)', borderRadius: '12px', minHeight: '180px' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                <div style={{ padding: '10px', background: 'rgba(233, 30, 138, 0.1)', color: 'var(--accent-pink)', borderRadius: '8px' }}>
                                  <ShoppingCart size={20} />
                                </div>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', margin: 0 }}>Subscription Orders</h3>
                              </div>
                              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4', margin: '0 0 16px 0' }}>
                                Export booking history details, selected packages/plans, pricing, activation timelines, checkin window logs, and status info.
                              </p>
                            </div>
                            <button 
                              className="btn btn-primary" 
                              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                              onClick={() => handleExport('orders')}
                              disabled={exportingType !== null}
                            >
                              <Download size={16} />
                              {exportingType === 'orders' ? 'Exporting...' : 'Export Orders List'}
                            </button>
                          </div>

                          {/* Payments Card */}
                          <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid var(--border-color)', borderRadius: '12px', minHeight: '180px' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                <div style={{ padding: '10px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: '8px' }}>
                                  <CreditCard size={20} />
                                </div>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', margin: 0 }}>Payments History</h3>
                              </div>
                              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4', margin: '0 0 16px 0' }}>
                                Retrieve detailed accounts transaction logs, payment statuses, UPI handles, gateway reference codes, and timestamps.
                              </p>
                            </div>
                            <button 
                              className="btn btn-primary" 
                              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                              onClick={() => handleExport('payments')}
                              disabled={exportingType !== null}
                            >
                              <Download size={16} />
                              {exportingType === 'payments' ? 'Exporting...' : 'Export Payments'}
                            </button>
                          </div>

                          {/* Employees Card */}
                          <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid var(--border-color)', borderRadius: '12px', minHeight: '180px' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                <div style={{ padding: '10px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', borderRadius: '8px' }}>
                                  <Briefcase size={20} />
                                </div>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', margin: 0 }}>Employees Log</h3>
                              </div>
                              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4', margin: '0 0 16px 0' }}>
                                Export service employee records, occupation roles, registered contact profiles, verification statuses, and sign-up dates.
                              </p>
                            </div>
                            <button 
                              className="btn btn-primary" 
                              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                              onClick={() => handleExport('employees')}
                              disabled={exportingType !== null}
                            >
                              <Download size={16} />
                              {exportingType === 'employees' ? 'Exporting...' : 'Export Employees'}
                            </button>
                           {/* Checkins Card */}
                          <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid var(--border-color)', borderRadius: '12px', minHeight: '180px' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                <div style={{ padding: '10px', background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', borderRadius: '8px' }}>
                                  <MapPin size={20} />
                                </div>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', margin: 0 }}>Service Check-ins</h3>
                              </div>
                              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4', margin: '0 0 16px 0' }}>
                                Download check-in metrics including recorded timestamps, employee assignees, GPS verification details, and addresses.
                              </p>
                            </div>
                            <button 
                              className="btn btn-primary" 
                              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                              onClick={() => handleExport('checkins')}
                              disabled={exportingType !== null}
                            >
                              <Download size={16} />
                              {exportingType === 'checkins' ? 'Exporting...' : 'Export Check-ins'}
                            </button>
                          </div>

                          {/* Requested Pincodes Card */}
                          <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid var(--border-color)', borderRadius: '12px', minHeight: '180px' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                <div style={{ padding: '10px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '8px' }}>
                                  <MapPin size={20} />
                                </div>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', margin: 0 }}>Requested Pincodes</h3>
                              </div>
                              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4', margin: '0 0 16px 0' }}>
                                Download customer service requests (leads) for currently unserviced areas, including contact numbers, requested pincodes, and timestamps.
                              </p>
                            </div>
                            <button 
                              className="btn btn-primary" 
                              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                              onClick={() => handleExport('pincodes')}
                              disabled={exportingType !== null}
                            >
                              <Download size={16} />
                              {exportingType === 'pincodes' ? 'Exporting...' : 'Export Pincode Requests'}
                            </button>
                          </div>

                        </div>

                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Tab: Pincodes */}
              {activeTab === 'pincodes' && (
                <div className="glass-panel animate-fade-in" style={{ padding: '24px' }}>
                  <div style={{ marginBottom: '24px' }}>
                    <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>Manage Service Zones & Requests</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
                      Register serviceable pincodes to validate checkouts, and view customer requests from non-serviced regions.
                    </p>
                  </div>

                  {loadingPincodes ? (
                    <div className="spinner-container" style={{ minHeight: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                      <div className="spinner"></div>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading pincode records...</span>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '32px', alignItems: 'start' }}>
                      
                      {/* Left: Serviceable Pincodes List & Form */}
                      <div className="glass-panel" style={{ padding: '20px', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', margin: '0 0 16px 0', color: 'var(--text-main)' }}>Serviceable Pincodes</h3>
                        
                        <form onSubmit={handleAddPincode} style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Enter 6-digit pincode"
                            maxLength={6}
                            value={newPincode}
                            onChange={(e) => setNewPincode(e.target.value.replace(/[^0-9]/g, ''))}
                            style={{ flexGrow: 1 }}
                            required
                          />
                          <button type="submit" className="btn btn-primary" style={{ padding: '8px 16px', whiteSpace: 'nowrap' }}>
                            Add
                          </button>
                        </form>

                        <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                          {serviceablePincodes.length === 0 ? (
                            <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                              No serviceable pincodes registered.
                            </div>
                          ) : (
                            <table className="admin-table" style={{ width: '100%' }}>
                              <thead>
                                <tr>
                                  <th style={{ padding: '8px 12px' }}>Pincode</th>
                                  <th style={{ padding: '8px 12px', textAlign: 'right' }}>Action</th>
                                </tr>
                              </thead>
                              <tbody>
                                {serviceablePincodes.map((item) => (
                                  <tr key={item._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <td style={{ padding: '10px 12px', fontWeight: 'bold' }}>{item.pincode}</td>
                                    <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                                      <button 
                                        className="btn btn-secondary" 
                                        style={{ padding: '4px 8px', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                                        onClick={() => handleDeletePincode(item._id)}
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>
                      </div>

                      {/* Right: Area Service Requests Table */}
                      <div className="glass-panel" style={{ padding: '20px', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', margin: '0 0 16px 0', color: 'var(--text-main)' }}>Customer Service Requests (Leads)</h3>
                        
                        <div style={{ maxHeight: '470px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                          {pincodeRequests.length === 0 ? (
                            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>
                              No pincode service requests recorded yet.
                            </div>
                          ) : (
                            <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                              <thead>
                                <tr>
                                  <th style={{ padding: '12px 16px' }}>Mobile Number</th>
                                  <th style={{ padding: '12px 16px' }}>Requested Pincode</th>
                                  <th style={{ padding: '12px 16px' }}>User Profile</th>
                                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Requested At</th>
                                </tr>
                              </thead>
                              <tbody>
                                {pincodeRequests.map((reqLead) => (
                                  <tr key={reqLead._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <td style={{ padding: '12px 16px', fontWeight: '600' }}>{reqLead.mobile}</td>
                                    <td style={{ padding: '12px 16px' }}>
                                      <span className="badge badge-warning" style={{ fontSize: '0.85rem', padding: '4px 8px' }}>
                                        {reqLead.pincode}
                                      </span>
                                    </td>
                                    <td style={{ padding: '12px 16px', fontSize: '0.85rem' }}>
                                      {reqLead.user ? (
                                        <div>
                                          <div style={{ fontWeight: 'bold' }}>{reqLead.user.name}</div>
                                          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{reqLead.user.email}</div>
                                        </div>
                                      ) : (
                                        <span style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>Guest User</span>
                                      )}
                                    </td>
                                    <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                      {new Date(reqLead.createdAt).toLocaleString('en-IN')}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>
                      </div>

                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Edit User Modal */}
      {editUser && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content animate-fade-in">
            <div className="modal-header">
              <h3 className="modal-title">Edit User Profile</h3>
              <button className="modal-close" onClick={() => setEditUser(null)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleUpdateUser}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editUser.name || ''}
                    onChange={(e) => setEditUser(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-control"
                    value={editUser.email || ''}
                    onChange={(e) => setEditUser(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>

                <div className="grid-2-col">
                  <div className="form-group">
                    <label className="form-label">System Role</label>
                    <select
                      className="form-control"
                      value={editUser.role}
                      onChange={(e) => setEditUser(prev => ({ ...prev, role: e.target.value }))}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">OTP Verification Status</label>
                    <select
                      className="form-control"
                      value={editUser.isVerified.toString()}
                      onChange={(e) => setEditUser(prev => ({ ...prev, isVerified: e.target.value === 'true' }))}
                    >
                      <option value="true">Verified</option>
                      <option value="false">Unverified</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setEditUser(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Order Modal */}
      {editOrder && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content animate-fade-in">
            <div className="modal-header">
              <h3 className="modal-title">Edit Subscription Order</h3>
              <button className="modal-close" onClick={() => setEditOrder(null)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleUpdateOrder}>
              <div className="modal-body">
                 <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '1.8rem', color: editOrder.accentColor }}><i className={`fa-solid ${editOrder.icon || 'fa-box'}`}></i></div>
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{editOrder.packageTitle}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{editOrder.planLabel} Plan — ID: {editOrder._id}</div>
                  </div>
                </div>

                {/* Booking / Care Details */}
                <div style={{ padding: '16px', background: 'rgba(255,255,255,0.015)', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '20px' }}>
                  <div style={{ fontWeight: '700', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#e91e8a', marginBottom: '12px' }}>Booking & Care Details</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px', fontSize: '0.85rem', color: 'var(--text)' }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Mother's Name:</span>
                      <div style={{ fontWeight: '600', marginTop: '2px' }}>{editOrder.motherName || 'Not specified'}</div>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Mother's Age:</span>
                      <div style={{ fontWeight: '600', marginTop: '2px' }}>{editOrder.motherAge ? `${editOrder.motherAge} years` : 'Not specified'}</div>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Baby's Name:</span>
                      <div style={{ fontWeight: '600', marginTop: '2px' }}>{editOrder.babyName || 'Not specified'}</div>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Baby's Age Range:</span>
                      <div style={{ fontWeight: '600', marginTop: '2px' }}>{editOrder.babyAge || 'Not specified'}</div>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Appointment Start:</span>
                      <div style={{ fontWeight: '600', marginTop: '2px' }}>{editOrder.startDate ? new Date(editOrder.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Not specified'}</div>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Time Slot / Time:</span>
                      <div style={{ fontWeight: '600', marginTop: '2px', textTransform: 'capitalize' }}>
                        {editOrder.timeSlot || 'Not specified'} {editOrder.selectedTime ? `(${editOrder.selectedTime})` : ''}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid-2-col">
                  <div className="form-group">
                    <label className="form-label">Subscription Status</label>
                    <select
                      className="form-control"
                      value={editOrder.status}
                      onChange={(e) => handleOrderStatusChange(e.target.value)}
                    >
                      <option value="created">Created</option>
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Payment Status</label>
                    <select
                      className="form-control"
                      value={editOrder.paymentStatus}
                      onChange={(e) => setEditOrder(prev => ({ ...prev, paymentStatus: e.target.value }))}
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="success">Success</option>
                      <option value="failed">Failed</option>
                      <option value="refunded">Refunded</option>
                    </select>
                  </div>
                </div>

                <div className="grid-2-col">
                  <div className="form-group">
                    <label className="form-label">Start Date</label>
                    <div style={{ position: 'relative' }}>
                      <Calendar size={16} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                      <input
                        type="date"
                        className="form-control"
                        value={editOrder.activatedAt ? toLocalDateString(editOrder.activatedAt) : ''}
                        onChange={(e) => handleOrderStartDateChange(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">End Date</label>
                    <div style={{ position: 'relative' }}>
                      <Calendar size={16} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                      <input
                        type="date"
                        className="form-control"
                        value={editOrder.expiresAt ? toLocalDateString(editOrder.expiresAt) : ''}
                        onChange={(e) => setEditOrder(prev => ({ ...prev, expiresAt: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setEditOrder(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Payment Modal */}
      {editPayment && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content animate-fade-in">
            <div className="modal-header">
              <h3 className="modal-title">Edit Payment Transaction</h3>
              <button className="modal-close" onClick={() => setEditPayment(null)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleUpdatePayment}>
              <div className="modal-body">
                <div style={{ marginBottom: '20px', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-color)', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                  <div><strong>TXN ID:</strong> {editPayment.transactionId}</div>
                  <div style={{ marginTop: '4px' }}><strong>ORDER ID:</strong> {editPayment.order?._id || editPayment.order}</div>
                </div>

                <div className="grid-2-col">
                  <div className="form-group">
                    <label className="form-label">Payment Status</label>
                    <select
                      className="form-control"
                      value={editPayment.status}
                      onChange={(e) => setEditPayment(prev => ({ ...prev, status: e.target.value }))}
                    >
                      <option value="initiated">Initiated</option>
                      <option value="pending">Pending</option>
                      <option value="success">Success</option>
                      <option value="failed">Failed</option>
                      <option value="refunded">Refunded</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Amount Paid (₹)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={editPayment.amount}
                      onChange={(e) => setEditPayment(prev => ({ ...prev, amount: Number(e.target.value) }))}
                      required
                    />
                  </div>
                </div>

                <div className="grid-2-col">
                  <div className="form-group">
                    <label className="form-label">UPI Merchant ID</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editPayment.upiId || ''}
                      onChange={(e) => setEditPayment(prev => ({ ...prev, upiId: e.target.value }))}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">UPI Ref/UTR Number</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editPayment.upiRef || ''}
                      onChange={(e) => setEditPayment(prev => ({ ...prev, upiRef: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setEditPayment(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit/Add Package Modal */}
      {editPackage && (
        <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-panel modal-content animate-fade-in" style={{ maxWidth: '800px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editPackage._id ? 'Edit Package & Plans' : 'Create New Package'}
              </h3>
              <button
                className="modal-close"
                onClick={() => {
                  setEditPackage(null);
                  setShowAddPackageModal(false);
                }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={editPackage._id ? handleUpdatePackage : handleCreatePackage}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                {/* Basic Details Section */}
                <div>
                  <h4 style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '6px', marginBottom: '14px', fontSize: '0.95rem', color: 'var(--accent-pink)', fontWeight: 'bold' }}>Basic Package Info</h4>
                  <div className="grid-2-col">
                    <div className="form-group">
                      <label className="form-label">Package ID / Type Key (e.g., mother)</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="mother"
                        required
                        disabled={!!editPackage._id}
                        value={editPackage.type || ''}
                        onChange={(e) => setEditPackage(prev => ({ ...prev, type: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '') }))}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Package Title (e.g., Mother Care)</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Mother Care"
                        required
                        value={editPackage.title || ''}
                        onChange={(e) => setEditPackage(prev => ({ ...prev, title: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="grid-2-col" style={{ marginTop: '10px' }}>
                    <div className="form-group">
                      <label className="form-label">Subtitle</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Expert health support tailored for new mothers"
                        value={editPackage.subtitle || ''}
                        onChange={(e) => setEditPackage(prev => ({ ...prev, subtitle: e.target.value }))}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Tagline</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Expert support for expecting & new mothers"
                        value={editPackage.tagline || ''}
                        onChange={(e) => setEditPackage(prev => ({ ...prev, tagline: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="grid-3-col" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '15px', marginTop: '10px' }}>
                    <div className="form-group">
                      <label className="form-label">FontAwesome Icon (e.g., fa-baby)</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="fa-baby"
                        required
                        value={editPackage.icon || ''}
                        onChange={(e) => setEditPackage(prev => ({ ...prev, icon: e.target.value }))}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Accent Theme Color</label>
                      <input
                        type="color"
                        className="form-control"
                        style={{ height: '42px', padding: '4px' }}
                        required
                        value={editPackage.accentColor || '#E91E8A'}
                        onChange={(e) => setEditPackage(prev => ({ ...prev, accentColor: e.target.value }))}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Starting Price (₹)</label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="999"
                        required
                        value={editPackage.startingPrice || 0}
                        onChange={(e) => setEditPackage(prev => ({ ...prev, startingPrice: parseInt(e.target.value, 10) || 0 }))}
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginTop: '10px' }}>
                    <label className="form-label">Core Features</label>
                    {/* Feature chips */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px', minHeight: '32px' }}>
                      {(editPackage.features || []).map((f, i) => (
                        <span key={i} style={{
                          display: 'inline-flex', alignItems: 'center', gap: '6px',
                          backgroundColor: 'var(--primary-light, #fce4f3)', color: 'var(--primary, #E91E8A)',
                          borderRadius: '20px', padding: '4px 12px', fontSize: '13px', fontWeight: 600,
                          border: '1px solid var(--primary, #E91E8A)'
                        }}>
                          {f}
                          <button type="button" onClick={() => setEditPackage(prev => ({ ...prev, features: prev.features.filter((_, idx) => idx !== i) }))}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'inherit', lineHeight: 1, fontSize: '14px' }}>✕</button>
                        </span>
                      ))}
                    </div>
                    {/* Add feature input */}
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Type a feature and press Add"
                        value={pkgFeatureInput}
                        onChange={(e) => setPkgFeatureInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && pkgFeatureInput.trim()) {
                            e.preventDefault();
                            setEditPackage(prev => ({ ...prev, features: [...(prev.features || []), pkgFeatureInput.trim()] }));
                            setPkgFeatureInput('');
                          }
                        }}
                        style={{ flex: 1 }}
                      />
                      <button type="button" className="btn btn-secondary" style={{ whiteSpace: 'nowrap', padding: '0 16px' }}
                        onClick={() => {
                          if (pkgFeatureInput.trim()) {
                            setEditPackage(prev => ({ ...prev, features: [...(prev.features || []), pkgFeatureInput.trim()] }));
                            setPkgFeatureInput('');
                          }
                        }}>+ Add</button>
                    </div>
                  </div>
                </div>

                {/* Nested Plans Settings */}
                <div>
                  <h4 style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '6px', marginBottom: '14px', fontSize: '0.95rem', color: 'var(--accent-pink)', fontWeight: 'bold' }}>Subscription Plans</h4>

                  {['1month', '3month', '6month'].map((key) => {
                    const plan = editPackage.plans?.[key] || { key, label: key === '1month' ? '1 Month' : key === '3month' ? '3 Months' : '6 Months', price: 0, originalPrice: 0, savings: '', badge: '', features: [] };
                    return (
                      <div key={key} style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '16px' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '12px', color: 'var(--text)', textTransform: 'capitalize' }}>
                          {plan.label} Plan Details
                        </div>
                        <div className="grid-3-col" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '15px' }}>
                          <div className="form-group">
                            <label className="form-label">Actual Price (₹)</label>
                            <input
                              type="number"
                              className="form-control"
                              required
                              value={plan.price || 0}
                              onChange={(e) => {
                                const val = parseInt(e.target.value, 10) || 0;
                                setEditPackage(prev => ({
                                  ...prev,
                                  plans: {
                                    ...prev.plans,
                                    [key]: { ...prev.plans[key], price: val }
                                  }
                                }));
                              }}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Original Price (₹)</label>
                            <input
                              type="number"
                              className="form-control"
                              required
                              value={plan.originalPrice || 0}
                              onChange={(e) => {
                                const val = parseInt(e.target.value, 10) || 0;
                                setEditPackage(prev => ({
                                  ...prev,
                                  plans: {
                                    ...prev.plans,
                                    [key]: { ...prev.plans[key], originalPrice: val }
                                  }
                                }));
                              }}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Promo Badge (e.g. Most Popular)</label>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Best Value"
                              value={plan.badge || ''}
                              onChange={(e) => {
                                setEditPackage(prev => ({
                                  ...prev,
                                  plans: {
                                    ...prev.plans,
                                    [key]: { ...prev.plans[key], badge: e.target.value || null }
                                  }
                                }));
                              }}
                            />
                          </div>
                        </div>

                        <div className="grid-2-col" style={{ marginTop: '10px' }}>
                          <div className="form-group">
                            <label className="form-label">Savings Text (e.g., Save ₹300)</label>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Save ₹300"
                              value={plan.savings || ''}
                              onChange={(e) => {
                                setEditPackage(prev => ({
                                  ...prev,
                                  plans: {
                                    ...prev.plans,
                                    [key]: { ...prev.plans[key], savings: e.target.value }
                                  }
                                }));
                              }}
                            />
                          </div>
                        </div>
                        <div className="form-group" style={{ marginTop: '12px' }}>
                          <label className="form-label">Plan Features</label>
                          {/* Feature chips */}
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px', minHeight: '32px' }}>
                            {(plan.features || []).map((f, i) => (
                              <span key={i} style={{
                                display: 'inline-flex', alignItems: 'center', gap: '6px',
                                backgroundColor: 'rgba(100,100,255,0.08)', color: 'var(--text)',
                                borderRadius: '20px', padding: '4px 12px', fontSize: '13px', fontWeight: 600,
                                border: '1px solid var(--border)'
                              }}>
                                {f}
                                <button type="button"
                                  onClick={() => setEditPackage(prev => ({
                                    ...prev,
                                    plans: {
                                      ...prev.plans,
                                      [key]: { ...prev.plans[key], features: (prev.plans[key].features || []).filter((_, idx) => idx !== i) }
                                    }
                                  }))}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'inherit', lineHeight: 1, fontSize: '14px' }}>✕</button>
                              </span>
                            ))}
                            {(plan.features || []).length === 0 && (
                              <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic' }}>No features added yet</span>
                            )}
                          </div>
                          {/* Add feature input */}
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Type a feature and press Add or Enter"
                              value={planFeatureInputs[key] || ''}
                              onChange={(e) => setPlanFeatureInputs(prev => ({ ...prev, [key]: e.target.value }))}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && (planFeatureInputs[key] || '').trim()) {
                                  e.preventDefault();
                                  const val = planFeatureInputs[key].trim();
                                  setEditPackage(prev => ({
                                    ...prev,
                                    plans: {
                                      ...prev.plans,
                                      [key]: { ...prev.plans[key], features: [...(prev.plans[key].features || []), val] }
                                    }
                                  }));
                                  setPlanFeatureInputs(prev => ({ ...prev, [key]: '' }));
                                }
                              }}
                              style={{ flex: 1 }}
                            />
                            <button type="button" className="btn btn-secondary" style={{ whiteSpace: 'nowrap', padding: '0 16px' }}
                              onClick={() => {
                                const val = (planFeatureInputs[key] || '').trim();
                                if (val) {
                                  setEditPackage(prev => ({
                                    ...prev,
                                    plans: {
                                      ...prev.plans,
                                      [key]: { ...prev.plans[key], features: [...(prev.plans[key].features || []), val] }
                                    }
                                  }));
                                  setPlanFeatureInputs(prev => ({ ...prev, [key]: '' }));
                                }
                              }}>+ Add</button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="modal-footer" style={{ marginTop: '10px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setEditPackage(null);
                    setShowAddPackageModal(false);
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editPackage._id ? 'Save Changes' : 'Create Package'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Employee Docs Modal */}
      {viewEmployeeDocs && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content animate-fade-in" style={{ maxWidth: '600px', width: '95%' }}>
            <div className="modal-header">
              <h3 className="modal-title">Employee Document Verification</h3>
              <button className="modal-close" onClick={() => setViewEmployeeDocs(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '16px' }}>
                <img
                  src={getImageUrl(viewEmployeeDocs.userPhoto) || '/user.png'}
                  alt={viewEmployeeDocs.name}
                  style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent-pink)', cursor: 'zoom-in' }}
                  onClick={() => setPreviewImage(getImageUrl(viewEmployeeDocs.userPhoto) || '/user.png')}
                  onError={(e) => { e.target.src = '/user.png'; }}
                />
                <div>
                  <h4 style={{ fontSize: '1.2rem', margin: 0, fontWeight: 'bold' }}>{viewEmployeeDocs.name}</h4>
                  <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0', fontSize: '0.85rem' }}>{viewEmployeeDocs.occupation} • {viewEmployeeDocs.mobile}</p>
                  <p style={{ color: 'var(--text-muted)', margin: '2px 0 0 0', fontSize: '0.85rem' }}>{viewEmployeeDocs.email}</p>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <strong style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Working Address (Optional)</strong>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', lineHeight: '1.4' }}>{viewEmployeeDocs.address || 'Not Provided'}</p>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <strong style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Permanent Address</strong>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', lineHeight: '1.4' }}>{viewEmployeeDocs.permanentAddress}</p>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <strong style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Aadhar Number</strong>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.95rem', fontWeight: 'bold', fontFamily: 'monospace' }}>{viewEmployeeDocs.aadharNumber}</p>
              </div>

              <div className="grid-2-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '20px' }}>
                <div>
                  <strong style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Aadhar Photo</strong>
                  <div style={{ marginTop: '6px', height: '140px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)', cursor: 'zoom-in' }}
                    onClick={() => setPreviewImage(getImageUrl(viewEmployeeDocs.aadharPhoto))}>
                      <img
                        src={getImageUrl(viewEmployeeDocs.aadharPhoto) || 'https://via.placeholder.com/150'}
                        alt="Aadhar Card"
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        onError={(e) => { e.target.src = 'https://via.placeholder.com/150'; }}
                      />
                  </div>
                </div>

                <div>
                  <strong style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Certificates Upload</strong>
                  {(() => {
                    // Normalise: support both legacy string and new array format
                    const certs = Array.isArray(viewEmployeeDocs.certificatesPhoto)
                      ? viewEmployeeDocs.certificatesPhoto.filter(Boolean)
                      : viewEmployeeDocs.certificatesPhoto
                        ? [viewEmployeeDocs.certificatesPhoto]
                        : [];
                    return certs.length > 0 ? (
                      <div style={{ marginTop: '6px', display: 'grid', gridTemplateColumns: `repeat(${certs.length}, 1fr)`, gap: '8px' }}>
                        {certs.map((cert, idx) => (
                          <div key={idx}
                            onClick={() => setPreviewImage(getImageUrl(cert))}
                            style={{ display: 'block', height: '140px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)', cursor: 'zoom-in' }}>
                            <img
                              src={getImageUrl(cert) || 'https://via.placeholder.com/150'}
                              alt={`Certificate ${idx + 1}`}
                              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                              onError={(e) => { e.target.src = 'https://via.placeholder.com/150'; }}
                            />
                            <div style={{ textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-muted)', padding: '2px 0' }}>Cert {idx + 1}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ marginTop: '6px', height: '140px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.05)', color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>
                        No certificates uploaded
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
            <div className="modal-footer" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '12px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setViewEmployeeDocs(null)}>
                Close
              </button>
              {viewEmployeeDocs.isVerifiedEmployee ? (
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => {
                    handleApproveEmployee(viewEmployeeDocs._id, false);
                    setViewEmployeeDocs(null);
                  }}
                >
                  Revoke Verification
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    handleApproveEmployee(viewEmployeeDocs._id, true);
                    setViewEmployeeDocs(null);
                  }}
                >
                  Verify & Approve Employee
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Appointment Modal */}
      {showAddAppointmentModal && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content animate-fade-in" style={{ maxWidth: '550px', width: '95%' }}>
            <div className="modal-header">
              <h3 className="modal-title">Create Appointment</h3>
              <button className="modal-close" onClick={() => setShowAddAppointmentModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateAppointment}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Customer Name (Unscheduled)</label>
                  {loadingUnscheduled ? (
                    <div style={{ padding: '10px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                      Loading customers...
                    </div>
                  ) : unscheduledOrders.length === 0 ? (
                    <div style={{ padding: '10px', fontSize: '0.9rem', color: 'var(--danger)', background: 'var(--danger-glow)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: '8px' }}>
                      No unscheduled customers found. All paid orders have scheduled appointments.
                    </div>
                  ) : (
                    <>
                      <select
                        className="form-control"
                        required
                        value={selectedOrderId}
                        onChange={(e) => handleSelectUnscheduledOrder(e.target.value)}
                      >
                        <option value="">-- Choose Customer --</option>
                        {unscheduledOrders.map(order => {
                          const clientName = order.user?.name || order.address?.fullName || 'Unknown';
                          const mobile = order.user?.mobile || order.address?.mobile || 'No Mobile';
                          return (
                            <option key={order._id} value={order._id}>
                              {clientName} ({mobile}) - {order.packageTitle}
                            </option>
                          );
                        })}
                      </select>
                      {selectedOrderId && (
                        <div style={{ marginTop: '8px', padding: '10px 12px', background: 'rgba(233, 30, 138, 0.05)', border: '1px solid rgba(233, 30, 138, 0.15)', borderRadius: '8px', fontSize: '0.85rem' }}>
                          <div><strong style={{ color: 'var(--accent-pink)' }}>Customer's Preferred Start Date:</strong> {
                            (() => {
                              const order = unscheduledOrders.find(o => o._id === selectedOrderId);
                              if (!order) return 'Not found';
                              const prefDate = order.startDate ? new Date(order.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }) : 'None';
                              const prefTime = order.selectedTime ? `${order.selectedTime}` : (order.timeSlot || 'None');
                              return `${prefDate} (${prefTime})`;
                            })()
                          }</div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Customer Mobile</label>
                  <input
                    type="tel"
                    className="form-control"
                    placeholder="Enter 10-digit mobile number"
                    required
                    pattern="[6-9][0-9]{9}"
                    value={newAppointment.customerMobile}
                    onChange={(e) => setNewAppointment(prev => ({ ...prev, customerMobile: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Appointment Address</label>
                  <textarea
                    className="form-control"
                    placeholder="Enter full site address"
                    rows="2"
                    required
                    value={newAppointment.customerAddress}
                    onChange={(e) => setNewAppointment(prev => ({ ...prev, customerAddress: e.target.value }))}
                    style={{ resize: 'none', height: 'auto' }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Date and Time</label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    required
                    value={newAppointment.dateTime}
                    onChange={(e) => setNewAppointment(prev => ({ ...prev, dateTime: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Details / Special Notes</label>
                  <textarea
                    className="form-control"
                    placeholder="Enter baby care details or support requirements"
                    rows="3"
                    value={newAppointment.details}
                    onChange={(e) => setNewAppointment(prev => ({ ...prev, details: e.target.value }))}
                    style={{ resize: 'none', height: 'auto' }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Assign Employee</label>
                  <select
                    className="form-control"
                    value={newAppointment.assignedEmployee}
                    onChange={(e) => setNewAppointment(prev => ({ ...prev, assignedEmployee: e.target.value }))}
                  >
                    <option value="">Unassigned / Save for later</option>
                    {employees
                      .filter(emp => emp.isVerifiedEmployee)
                      .map(emp => (
                        <option key={emp._id} value={emp._id}>
                          {emp.name} ({emp.occupation})
                        </option>
                      ))}
                  </select>
                  {employees.filter(emp => emp.isVerifiedEmployee).length === 0 && (
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: 'var(--error)' }}>
                      No verified employees available. Please verify employees first.
                    </p>
                  )}
                </div>
              </div>
              <div className="modal-footer" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '12px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddAppointmentModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create & Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Appointment Modal */}
      {editAppointment && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content animate-fade-in" style={{ maxWidth: '550px', width: '95%' }}>
            <div className="modal-header">
              <h3 className="modal-title">Edit Appointment</h3>
              <button className="modal-close" onClick={() => setEditAppointment(null)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleUpdateAppointment}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Customer Name</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={editAppointment.customerName}
                    onChange={(e) => setEditAppointment(prev => ({ ...prev, customerName: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Customer Mobile</label>
                  <input
                    type="tel"
                    className="form-control"
                    placeholder="Enter 10-digit mobile number"
                    required
                    pattern="[6-9][0-9]{9}"
                    value={editAppointment.customerMobile}
                    onChange={(e) => setEditAppointment(prev => ({ ...prev, customerMobile: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Appointment Address</label>
                  <textarea
                    className="form-control"
                    placeholder="Enter full site address"
                    rows="2"
                    required
                    value={editAppointment.customerAddress}
                    onChange={(e) => setEditAppointment(prev => ({ ...prev, customerAddress: e.target.value }))}
                    style={{ resize: 'none', height: 'auto' }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Date and Time</label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    required
                    value={editAppointment.dateTime}
                    onChange={(e) => setEditAppointment(prev => ({ ...prev, dateTime: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Details / Special Notes</label>
                  <textarea
                    className="form-control"
                    placeholder="Enter baby care details or support requirements"
                    rows="3"
                    value={editAppointment.details}
                    onChange={(e) => setEditAppointment(prev => ({ ...prev, details: e.target.value }))}
                    style={{ resize: 'none', height: 'auto' }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Assign Employee</label>
                  <select
                    className="form-control"
                    value={editAppointment.assignedEmployee}
                    onChange={(e) => setEditAppointment(prev => ({ ...prev, assignedEmployee: e.target.value }))}
                  >
                    <option value="">Unassigned</option>
                    {employees
                      .filter(emp => emp.isVerifiedEmployee || emp._id === editAppointment.assignedEmployee || (editAppointment.assignedEmployee && emp._id === editAppointment.assignedEmployee._id))
                      .map(emp => (
                        <option key={emp._id} value={emp._id}>
                          {emp.name} ({emp.occupation}){!emp.isVerifiedEmployee ? ' [Pending Verification]' : ''}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    className="form-control"
                    value={editAppointment.status}
                    onChange={(e) => setEditAppointment(prev => ({ ...prev, status: e.target.value }))}
                  >
                    <option value="pending">Pending</option>
                    <option value="checked_in">Checked In</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '12px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditAppointment(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Container */}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>

      {/* ── Image Lightbox Preview ────────────────────────────────────────── */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.88)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'zoom-out',
            backdropFilter: 'blur(6px)',
            animation: 'fadeIn 0.18s ease',
          }}
        >
          {/* Close button */}
          <button
            onClick={() => setPreviewImage(null)}
            style={{
              position: 'absolute', top: '20px', right: '24px',
              background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)',
              color: '#fff', borderRadius: '50%', width: '40px', height: '40px',
              fontSize: '1.2rem', cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              backdropFilter: 'blur(4px)',
            }}
          >
            ✕
          </button>
          <img
            src={previewImage}
            alt="Document Preview"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '90vw', maxHeight: '88vh',
              objectFit: 'contain', borderRadius: '10px',
              boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
              cursor: 'default',
            }}
          />
        </div>
      )}
    </div>
  );
}

export default App;
