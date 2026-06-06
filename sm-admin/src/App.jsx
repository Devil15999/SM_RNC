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
  Menu
} from 'lucide-react';
import './App.css';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

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

  // Login Form States
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Global Loader
  const [isLoading, setIsLoading] = useState(false);

  // Alert Toasts
  const [toasts, setToasts] = useState([]);

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
    }
  }, [token, activeTab]);

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
            <div className="user-avatar">
              {(adminUser?.name || 'A').charAt(0).toUpperCase()}
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
                                  <span className={`badge badge-${
                                    order.status === 'active' ? 'success' :
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
                                  <span className={`badge badge-${
                                    pay.status === 'success' ? 'success' :
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
                              <span className={`badge badge-${
                                order.status === 'active' ? 'success' :
                                order.status === 'completed' ? 'info' :
                                order.status === 'cancelled' ? 'danger' : 'warning'
                              }`}>{order.status}</span>
                            </td>
                            <td>
                              <span className={`badge badge-${
                                order.paymentStatus === 'success' ? 'success' :
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
                              <span className={`badge badge-${
                                pay.status === 'success' ? 'success' :
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

                  <div className="grid-3-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginTop: '10px' }}>
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
                    <label className="form-label">Core Features (comma separated list)</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="OB-GYN Consultations, Nutrition Plans, Postpartum Recovery"
                      value={editPackage.features ? editPackage.features.join(', ') : ''}
                      onChange={(e) => {
                        const vals = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                        setEditPackage(prev => ({ ...prev, features: vals }));
                      }}
                    />
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
                        <div className="grid-3-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
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
                          <div className="form-group">
                            <label className="form-label">Plan Features (comma separated list)</label>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Feature 1, Feature 2, Feature 3"
                              value={plan.features ? plan.features.join(', ') : ''}
                              onChange={(e) => {
                                const vals = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                                setEditPackage(prev => ({
                                  ...prev,
                                  plans: {
                                    ...prev.plans,
                                    [key]: { ...prev.plans[key], features: vals }
                                  }
                                }));
                              }}
                            />
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

export default App;
