import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
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
  Clock
} from 'lucide-react';
import './App.css';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const getImageUrl = (photoPath) => {
  if (!photoPath) return '';
  if (photoPath.startsWith('data:image/') || photoPath.startsWith('http://') || photoPath.startsWith('https://')) {
    return photoPath;
  }
  return `${API_BASE_URL.replace('/api', '')}${photoPath}`;
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
  const [timeslots, setTimeslots] = useState([]);
  const [newTimeInputs, setNewTimeInputs] = useState({ morning: '', afternoon: '', evening: '' });

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
  const [showAddAppointmentModal, setShowAddAppointmentModal] = useState(false);
  const [newAppointment, setNewAppointment] = useState({ customerName: '', customerMobile: '', customerAddress: '', dateTime: '', details: '', assignedEmployee: '' });
  const [viewEmployeeDocs, setViewEmployeeDocs] = useState(null);
  const [previewImage, setPreviewImage] = useState(null); // lightbox URL

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
      const { search, status } = appointmentsFilters;
      let query = '';
      const params = [];
      if (search) params.push(`search=${encodeURIComponent(search)}`);
      if (status) params.push(`status=${status}`);
      if (params.length > 0) query = `?${params.join('&')}`;

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
        setTimeslots(res.data);
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

  const handleCreateAppointment = async (e) => {
    e.preventDefault();
    try {
      const res = await apiFetch('/admin/appointments', {
        method: 'POST',
        body: JSON.stringify(newAppointment)
      });
      if (res.success) {
        showToast('Appointment created and assigned successfully');
        setNewAppointment({ customerName: '', customerMobile: '', customerAddress: '', dateTime: '', details: '', assignedEmployee: '' });
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
      if (activeTab === 'appointments') {
        fetchAppointments();
        fetchEmployees();
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
            className={`menu-item ${activeTab === 'timeslots' ? 'active' : ''}`}
            onClick={() => handleTabChange('timeslots')}
          >
            <Clock size={20} />
            <span>Timeslots</span>
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
            <div className="header-title">
              <h1>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h1>
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
                              <div><strong>Start:</strong> {formatDate(order.activatedAt)}</div>
                              <div><strong>End:</strong> {formatDate(order.expiresAt)}</div>
                            </td>
                            <td className="actions-cell">
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
                          <th>Check-in Details</th>
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
                            <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {appt.status === 'checked_in' && appt.checkinLocation ? (
                                <div>
                                  <div><strong>Time:</strong> {formatDate(appt.checkinTime)}</div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                    <MapPin size={12} style={{ color: 'var(--accent-pink)' }} />
                                    <a
                                      href={`https://maps.google.com/?q=${appt.checkinLocation.latitude},${appt.checkinLocation.longitude}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{ color: '#3b82f6', textDecoration: 'none' }}
                                    >
                                      {appt.checkinLocation.latitude.toFixed(5)}, {appt.checkinLocation.longitude.toFixed(5)}
                                    </a>
                                  </div>
                                </div>
                              ) : (
                                '—'
                              )}
                            </td>
                            <td className="actions-cell">
                              <button className="btn btn-danger btn-icon" onClick={() => handleDeleteAppointment(appt._id)}>
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {appointments.length === 0 && (
                          <tr>
                            <td colSpan="8" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                              No appointments found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

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
                            {slotTimes.length > 0 ? slotTimes.map((time, idx) => (
                              <span 
                                key={idx} 
                                style={{ 
                                  display: 'inline-flex', 
                                  alignItems: 'center', 
                                  gap: '6px', 
                                  padding: '6px 12px', 
                                  background: 'rgba(255,255,255,0.05)', 
                                  border: '1px solid var(--border-color)', 
                                  borderRadius: '20px', 
                                  fontSize: '0.85rem',
                                  color: 'var(--text)'
                                }}
                              >
                                {time}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = slotTimes.filter((_, i) => i !== idx);
                                    handleUpdateTimeslot(slotKey, updated);
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
                              </span>
                            )) : (
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic', margin: 'auto' }}>No times configured</span>
                            )}
                          </div>

                          {/* Add Form */}
                          <form onSubmit={(e) => {
                            e.preventDefault();
                            const val = newTimeInputs[slotKey]?.trim();
                            if (!val) return;
                            if (slotTimes.includes(val)) {
                              showToast('Time already exists', 'error');
                              return;
                            }
                            const updated = [...slotTimes, val];
                            handleUpdateTimeslot(slotKey, updated);
                            setNewTimeInputs(prev => ({ ...prev, [slotKey]: '' }));
                          }} style={{ display: 'flex', gap: '10px' }}>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="e.g. 09:30 AM"
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
                      onChange={(e) => setEditOrder(prev => ({ ...prev, status: e.target.value }))}
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
                    <label className="form-label">Activated At</label>
                    <div style={{ position: 'relative' }}>
                      <Calendar size={16} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                      <input
                        type="datetime-local"
                        className="form-control"
                        value={editOrder.activatedAt ? new Date(editOrder.activatedAt).toISOString().substring(0, 16) : ''}
                        onChange={(e) => setEditOrder(prev => ({ ...prev, activatedAt: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Expires At</label>
                    <div style={{ position: 'relative' }}>
                      <Calendar size={16} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                      <input
                        type="datetime-local"
                        className="form-control"
                        value={editOrder.expiresAt ? new Date(editOrder.expiresAt).toISOString().substring(0, 16) : ''}
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
                  <label className="form-label">Customer Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter customer name"
                    required
                    value={newAppointment.customerName}
                    onChange={(e) => setNewAppointment(prev => ({ ...prev, customerName: e.target.value }))}
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
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter baby care details or support requirements"
                    value={newAppointment.details}
                    onChange={(e) => setNewAppointment(prev => ({ ...prev, details: e.target.value }))}
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
