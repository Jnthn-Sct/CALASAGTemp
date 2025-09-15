import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logoImage from "../Images/no-bg-logo.png";
import { FaUserCircle, FaBell, FaMoon, FaSun, FaChevronDown, FaChevronLeft, FaChevronRight, FaTable, FaChartBar, FaKey, FaCalendarAlt, FaFileAlt, FaCubes, FaLock, FaUser, FaHome, FaCog, FaDownload, FaPlus, FaEye, FaKey as FaPermissions } from 'react-icons/fa';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { supabase } from "../../db"; // Adjust path to your Supabase client

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

interface Admin {
  id: number;
  user_id: string; // Actual UUID from the users table
  name: string;
  email: string;
  status: 'active' | 'inactive';
  lastLogin: string;
  permissions: string[];
}

interface FeatureUpdate {
  id: number;
  name: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  date: string;
}

interface SystemReport {
  id: number;
  title: string;
  type: 'performance' | 'usage' | 'security';
  status: 'generated' | 'reviewed' | 'archived';
  date: string;
  metrics: {
    uptime?: number;
    activeUsers?: number;
    responseTime?: number;
    securityIncidents?: number;
  };
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Notification {
  id: number;
  message: string;
  time: string;
  read: boolean;
}

const SuperAdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState<boolean>(false);
  const [showAddAdmin, setShowAddAdmin] = useState<boolean>(false);
  const [showFeatureUpdateModal, setShowFeatureUpdateModal] = useState<boolean>(false);
  const [showReportDetails, setShowReportDetails] = useState<boolean>(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState<boolean>(false);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [selectedReport, setSelectedReport] = useState<SystemReport | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState<boolean>(false);
  const [isEditingPersonal, setIsEditingPersonal] = useState<boolean>(false);
  const [isEditingSecurity, setIsEditingSecurity] = useState<boolean>(false);
  const [personalInfo, setPersonalInfo] = useState({ name: '', email: '' });
  const [securityInfo, setSecurityInfo] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [notifications, setNotifications] = useState<boolean>(false);
  const [emailNotifications, setEmailNotifications] = useState<boolean>(false);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [notificationsList, setNotificationsList] = useState<Notification[]>([]);
  const [featureUpdates, setFeatureUpdates] = useState<FeatureUpdate[]>([]);
  const [reports, setReports] = useState<SystemReport[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [showGenerateReportModal, setShowGenerateReportModal] = useState<boolean>(false);
  const [isSubmittingAdmin, setIsSubmittingAdmin] = useState<boolean>(false);
  const [isSubmittingFeature, setIsSubmittingFeature] = useState<boolean>(false);
  const [isSubmittingReport, setIsSubmittingReport] = useState<boolean>(false);
  const [isSubmittingReportAction, setIsSubmittingReportAction] = useState<boolean>(false);

  // Chart data
  const [performanceData, setPerformanceData] = useState({
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'System Uptime (%)',
        data: [0, 0, 0, 0, 0, 0],
        borderColor: '#005524',
        backgroundColor: 'rgba(0, 85, 36, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  });

  const [adminActivityData, setAdminActivityData] = useState({
    labels: ['Active Admins', 'Inactive Admins'],
    datasets: [
      {
        label: 'Admin Status',
        data: [0, 0],
        backgroundColor: ['#005524', '#f9a01b'],
      },
    ],
  });

  const [reportDistributionData, setReportDistributionData] = useState({
    labels: ['Performance', 'Usage', 'Security'],
    datasets: [
      {
        data: [0, 0, 0],
        backgroundColor: ['#005524', '#f9a01b', '#ff4d4f'],
        borderWidth: 0,
      },
    ],
  });

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
  };

  // Clear success or error messages after 5 seconds
  useEffect(() => {
    if (successMessage || error) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, error]);

  // Fetch user data and verify super_admin role
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
        if (userError || !user) {
          throw new Error('No authenticated user found');
        }

        const { data: profileData, error: profileError } = await supabase
          .from('users')
          .select('user_id, name, email, role')
          .eq('user_id', user.id)
          .single()
          .returns<UserProfile>();
        if (profileError) {
          throw new Error(`Profile fetch error: ${profileError.message}`);
        }

        if (profileData.role !== 'super_admin') {
          navigate('/dashboard');
          return;
        }

        setUserProfile({
          id: profileData.user_id,
          name: profileData.name || 'Super Admin',
          email: profileData.email,
          role: profileData.role,
        });
        setPersonalInfo({
          name: profileData.name || 'Super Admin',
          email: profileData.email,
        });
      } catch (err: any) {
        setError(`Failed to load user data: ${err.message}`);
        navigate('/login');
      }
    };

    fetchUserData();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT') {
          navigate('/login');
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  // Fetch admins
  const fetchAllUsers = async () => {
    try {
      let { data, error } = await supabase
        .from('users')
        .select('user_id, name, email, role, status, last_login, permissions')
        .eq('role', 'admin')
        .returns<Admin[]>();
      if (error) {
        if (error.message.includes('Could not find the column')) {
          await supabase.rpc('notify_pgrst_reload_schema');
          const { data: retryData, error: retryError } = await supabase
            .from('users')
            .select('user_id, name, email, role, status, last_login, permissions')
            .eq('role', 'admin')
            .returns<Admin[]>();
          if (retryError) throw retryError;
          data = retryData;
        } else {
          throw error;
        }
      }

      const adminsData = data.map((user, index) => ({
        id: index + 1,
        user_id: user.user_id,
        name: user.name || 'Unknown',
        email: user.email,
        status: user.status || 'inactive',
        lastLogin: user.last_login ? new Date(user.last_login).toLocaleString() : 'N/A',
        permissions: user.permissions || [],
      }));
      setAdmins(adminsData);
    } catch (error: any) {
      setError(`Failed to fetch admins: ${error.message}`);
    }
  };

  // Fetch admin activity data
  const fetchAdminActivityData = async () => {
    try {
      let { data, error } = await supabase
        .from('users')
        .select('status')
        .eq('role', 'admin');
      if (error) {
        if (error.message.includes('Could not find the column')) {
          await supabase.rpc('notify_pgrst_reload_schema');
          const { data: retryData, error: retryError } = await supabase
            .from('users')
            .select('status')
            .eq('role', 'admin');
          if (retryError) throw retryError;
          data = retryData;
        } else {
          throw error;
        }
      }

      const activeCount = data.filter(user => user.status === 'active').length;
      const inactiveCount = data.filter(user => user.status === 'inactive').length;

      setAdminActivityData({
        labels: ['Active Admins', 'Inactive Admins'],
        datasets: [
          {
            label: 'Admin Status',
            data: [activeCount, inactiveCount],
            backgroundColor: ['#005524', '#f9a01b'],
          },
        ],
      });
    } catch (error: any) {
      setError(`Failed to fetch admin activity data: ${error.message}`);
    }
  };

  // Fetch feature updates
  const fetchFeatureUpdates = async () => {
    try {
      const { data, error } = await supabase
        .from('feature_updates')
        .select('id, name, description, status, date')
        .order('date', { ascending: false })
        .returns<FeatureUpdate[]>();
      if (error) {
        if (error.message.includes('Could not find the table')) {
          await supabase.rpc('notify_pgrst_reload_schema');
          const { data: retryData, error: retryError } = await supabase
            .from('feature_updates')
            .select('id, name, description, status, date')
            .order('date', { ascending: false })
            .returns<FeatureUpdate[]>();
          if (retryError) throw retryError;
          setFeatureUpdates(retryData || []);
        } else {
          throw error;
        }
      } else {
        setFeatureUpdates(data || []);
      }
    } catch (error: any) {
      setError(`Failed to fetch feature updates: ${error.message}`);
    }
  };

  // Fetch system reports
  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from('system_reports')
        .select('id, title, type, status, date, metrics')
        .order('date', { ascending: false })
        .returns<SystemReport[]>();
      if (error) {
        if (error.message.includes('Could not find the table')) {
          await supabase.rpc('notify_pgrst_reload_schema');
          const { data: retryData, error: retryError } = await supabase
            .from('system_reports')
            .select('id, title, type, status, date, metrics')
            .order('date', { ascending: false })
            .returns<SystemReport[]>();
          if (retryError) throw retryError;
          setReports(retryData || []);
        } else {
          throw error;
        }
      } else {
        setReports(data || []);

        const performance = data.filter(r => r.type === 'performance').length;
        const usage = data.filter(r => r.type === 'usage').length;
        const security = data.filter(r => r.type === 'security').length;
        setReportDistributionData({
          labels: ['Performance', 'Usage', 'Security'],
          datasets: [
            {
              data: [performance, usage, security],
              backgroundColor: ['#005524', '#f9a01b', '#ff4d4f'],
              borderWidth: 0,
            },
          ],
        });
      }
    } catch (error: any) {
      console.error('Fetch reports error:', error);
      setError(`Failed to fetch reports: ${error.message}`);
    }
  };

  // Fetch performance data for chart
  const fetchPerformanceData = async () => {
    try {
      const startDate = '2025-01-01';
      const endDate = '2025-08-31';
      const { data, error } = await supabase
        .from('system_reports')
        .select('date, metrics')
        .eq('type', 'performance')
        .gte('date', startDate)
        .lte('date', endDate)
        .returns<{ date: string; metrics: { uptime?: number } }[]>();
      if (error) throw error;

      const monthlyUptime = [0, 0, 0, 0, 0, 0, 0, 0];
      data.forEach(report => {
        const month = new Date(report.date).getMonth();
        monthlyUptime[month] = report.metrics.uptime || 0;
      });

      setPerformanceData({
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
        datasets: [
          {
            label: 'System Uptime (%)',
            data: monthlyUptime,
            borderColor: '#005524',
            backgroundColor: 'rgba(0, 85, 36, 0.1)',
            tension: 0.4,
            fill: true,
          },
        ],
      });
    } catch (error: any) {
      console.error('Fetch performance data error:', error);
      setError(`Failed to fetch performance data: ${error.message}`);
    }
  };

  // Fetch notifications for the current super admin
  const fetchNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user found');

      const { data, error } = await supabase
        .from('notifications')
        .select('id, message, created_at, read')
        .eq('user_id', user.id) // Fetch only for the current super admin
        .order('created_at', { ascending: false })
        .limit(5)
        .returns<{ id: number; message: string; created_at: string; read: boolean }[]>();
      if (error) throw error;

      setNotificationsList(
        data.map(notification => ({
          id: notification.id,
          message: notification.message,
          time: new Date(notification.created_at).toLocaleTimeString(),
          read: notification.read,
        }))
      );
    } catch (error: any) {
      console.error('Fetch notifications error:', error);
      setError(`Failed to fetch notifications: ${error.message}`);
    }
  };

  // Mark notification as read
  const markNotificationAsRead = async (notificationId: number) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);
      if (error) throw error;

      setNotificationsList(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      );
    } catch (error: any) {
      setError(`Failed to mark notification as read: ${error.message}`);
    }
  };

  // Handle report actions (review or archive)
  const handleReportAction = async (reportId: number, action: 'review' | 'archive') => {
    setIsSubmittingReportAction(true);
    try {
      const newStatus = action === 'review' ? 'reviewed' : 'archived';
      const { error } = await supabase
        .from('system_reports')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', reportId);
      if (error) throw error;

      setReports(prev =>
        prev.map(report =>
          report.id === reportId ? { ...report, status: newStatus } : report
        )
      );

      if (selectedReport?.id === reportId) {
        setSelectedReport({ ...selectedReport, status: newStatus });
      }

      setShowReportDetails(false);
      setSuccessMessage(`Report ${action}ed successfully`);
    } catch (error: any) {
      setError(`Failed to ${action} report: ${error.message}`);
    } finally {
      setIsSubmittingReportAction(false);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      localStorage.removeItem('userRole');
      navigate('/login');
    } catch (error: any) {
      setError(`Failed to log out: ${error.message}`);
    }
  };

  // Handle add admin
  const handleAddAdmin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmittingAdmin(true);
    try {
      const formData = new FormData(e.currentTarget);
      const adminName = formData.get('adminName') as string;
      const adminEmail = formData.get('adminEmail') as string;
      const adminPassword = formData.get('adminPassword') as string;

      const { error } = await supabase.auth.signUp({
        email: adminEmail,
        password: adminPassword,
        options: {
          data: { name: adminName, role: 'admin' },
        },
      });

      if (error) throw error;

      await fetchAllUsers();
      setShowAddAdmin(false);
      setSuccessMessage('Admin added successfully');
    } catch (error: any) {
      setError(`Failed to add admin: ${error.message}`);
    } finally {
      setIsSubmittingAdmin(false);
    }
  };

  // Handle feature update
  const handleFeatureUpdate = async (updateId: number, status: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('feature_updates')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', updateId);
      if (error) throw error;

      setFeatureUpdates(prev =>
        prev.map(update =>
          update.id === updateId ? { ...update, status } : update
        )
      );
      setSuccessMessage(`Feature update ${status} successfully`);
    } catch (error: any) {
      setError(`Failed to update feature: ${error.message}`);
    }
  };

  // Handle add feature update
  const handleAddFeatureUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmittingFeature(true);
    try {
      const formData = new FormData(e.currentTarget);
      const updateName = formData.get('updateName') as string;
      const updateDesc = formData.get('updateDesc') as string;

      const { error } = await supabase
        .from('feature_updates')
        .insert({
          name: updateName,
          description: updateDesc,
          status: 'pending',
          date: new Date().toISOString(),
        });

      if (error) throw error;

      await fetchFeatureUpdates();
      setShowFeatureUpdateModal(false);
      setSuccessMessage('Feature update added successfully');
    } catch (error: any) {
      setError(`Failed to add feature update: ${error.message}`);
    } finally {
      setIsSubmittingFeature(false);
    }
  };

  // Handle generate report
  const handleGenerateReport = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmittingReport(true);
    try {
      const formData = new FormData(e.currentTarget);
      const reportTitle = formData.get('reportTitle') as string;
      const reportType = formData.get('reportType') as 'performance' | 'usage' | 'security';
      const metrics = {
        uptime: reportType === 'performance' ? 99.5 : undefined,
        activeUsers: reportType === 'usage' ? 1000 : undefined,
        responseTime: reportType === 'performance' ? 200 : undefined,
        securityIncidents: reportType === 'security' ? 0 : undefined,
      };

      const { error } = await supabase
        .from('system_reports')
        .insert({
          title: reportTitle,
          type: reportType,
          status: 'generated',
          date: new Date().toISOString(),
          metrics,
        });

      if (error) throw error;

      await fetchReports();
      setShowGenerateReportModal(false);
      setSuccessMessage('Report generated successfully');
    } catch (error: any) {
      setError(`Failed to generate report: ${error.message}`);
    } finally {
      setIsSubmittingReport(false);
    }
  };

  // Handle update permissions
  const handleUpdatePermissions = async (e: React.FormEvent<HTMLFormElement>, adminId: number) => {
    e.preventDefault();
    try {
      const formData = new FormData(e.currentTarget);
      const permissions = ['view_reports', 'manage_admins', 'approve_features'].filter(perm => formData.get(perm));

      const admin = admins.find(admin => admin.id === adminId);
      if (!admin) throw new Error('Admin not found');

      const { error } = await supabase
        .from('users')
        .update({ permissions })
        .eq('user_id', admin.user_id);

      if (error) throw error;

      await fetchAllUsers();
      setShowPermissionsModal(false);
      setSuccessMessage('Permissions updated successfully');
    } catch (error: any) {
      setError(`Failed to update permissions: ${error.message}`);
    }
  };

  // Handle toggle admin status
  const handleToggleAdminStatus = async (adminId: number) => {
    try {
      const admin = admins.find(a => a.id === adminId);
      if (!admin) return;

      const newStatus = admin.status === 'active' ? 'inactive' : 'active';
      const { error } = await supabase
        .from('users')
        .update({ status: newStatus })
        .eq('user_id', admin.user_id);

      if (error) throw error;

      await fetchAllUsers();
      setSuccessMessage(`Admin status updated to ${newStatus}`);
    } catch (error: any) {
      setError(`Failed to toggle admin status: ${error.message}`);
    }
  };

  // Handle personal info update
  const handlePersonalInfoUpdate = async () => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ name: personalInfo.name, email: personalInfo.email })
        .eq('user_id', userProfile?.id);

      if (error) throw error;

      setUserProfile(prev => prev ? { ...prev, name: personalInfo.name, email: personalInfo.email } : null);
      setIsEditingPersonal(false);
      setSuccessMessage('Personal info updated successfully');
    } catch (error: any) {
      setError(`Failed to update personal info: ${error.message}`);
    }
  };

  // Handle password update
  const handlePasswordUpdate = async () => {
    if (securityInfo.newPassword !== securityInfo.confirmPassword) {
      setError('New password and confirm password do not match');
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: securityInfo.newPassword,
      });

      if (error) throw error;

      setSecurityInfo({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setIsEditingSecurity(false);
      setSuccessMessage('Password updated successfully');
    } catch (error: any) {
      setError(`Failed to update password: ${error.message}`);
    }
  };

  // Handle generate report from notification
  const handleGenerateReportFromNotification = async (notificationId: number) => {
    setIsSubmittingReport(true);
    try {
      const notification = notificationsList.find(n => n.id === notificationId);
      if (!notification) return;

      const { error } = await supabase
        .from('system_reports')
        .insert({
          title: `Report from Notification ${notificationId}`,
          type: 'performance',
          status: 'generated',
          date: new Date().toISOString(),
          metrics: { uptime: 99.5 },
        });

      if (error) throw error;

      await fetchReports();
      setSuccessMessage('Report generated from notification successfully');
      await markNotificationAsRead(notificationId); // Mark as read after action
    } catch (error: any) {
      setError(`Failed to generate report from notification: ${error.message}`);
    } finally {
      setIsSubmittingReport(false);
    }
  };

  // Initial data fetch and subscriptions
  useEffect(() => {
    fetchAllUsers();
    fetchAdminActivityData();
    fetchFeatureUpdates();
    fetchReports();
    fetchPerformanceData();
    fetchNotifications();

    const featureSubscription = supabase
      .channel('feature_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'feature_updates' }, payload => {
        fetchFeatureUpdates();
      })
      .subscribe((status, err) => {
        if (err) {
          console.error('Feature subscription error:', err);
          setError(`Feature subscription error: ${err.message}`);
        }
      });

    const reportSubscription = supabase
      .channel('system_reports')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'system_reports' }, payload => {
        fetchReports();
        fetchPerformanceData();
      })
      .subscribe((status, err) => {
        if (err) {
          console.error('Report subscription error:', err);
          setError(`Report subscription error: ${err.message}`);
        }
      });

    const userSubscription = supabase
      .channel('users')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users', filter: "role=eq.admin" }, payload => {
        fetchAllUsers();
        fetchAdminActivityData();
      })
      .subscribe((status, err) => {
        if (err) {
          console.error('User subscription error:', err);
          setError(`User subscription error: ${err.message}`);
        }
      });

    const notificationSubscription = supabase
      .channel('notifications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userProfile?.id}` }, payload => {
        fetchNotifications();
      })
      .subscribe((status, err) => {
        if (err) {
          console.error('Notification subscription error:', err);
          setError(`Notification subscription error: ${err.message}`);
        }
      });

    return () => {
      supabase.removeChannel(featureSubscription);
      supabase.removeChannel(reportSubscription);
      supabase.removeChannel(userSubscription);
      supabase.removeChannel(notificationSubscription);
    };
  }, [userProfile?.id]);

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <div className="space-y-8">
            {/* Top Metric Cards */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              <div className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-[#005524]/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">TOTAL ADMINS</p>
                    <p className="text-3xl font-bold text-gray-900">{admins.length}</p>
                    <p className="text-sm text-green-600 mt-1">+12% since last month</p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-[#005524] to-[#004015] rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <FaUser size={20} />
                  </div>
                </div>
              </div>
              <div className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-blue-500/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">PENDING UPDATES</p>
                    <p className="text-3xl font-bold text-gray-900">{featureUpdates.filter(fu => fu.status === 'pending').length}</p>
                    <p className="text-sm text-blue-600 mt-1">+15% this quarter</p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <FaCog size={20} />
                  </div>
                </div>
              </div>
              <div className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-red-500/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">SYSTEM PERFORMANCE</p>
                    <p className="text-3xl font-bold text-gray-900">{reports.filter(r => r.type === 'performance').length}</p>
                    <p className="text-sm text-red-600 mt-1">+5% since last week</p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <FaChartBar size={20} />
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">System Performance Trends</h3>
                    <p className="text-sm text-gray-600">Uptime metrics for 2025</p>
                  </div>
                  <div className="flex space-x-2">
                    <button className="px-3 py-1 text-xs bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors">
                      Week
                    </button>
                    <button className="px-3 py-1 text-xs bg-[#005524] text-white rounded-lg">
                      Month
                    </button>
                    <button className="px-3 py-1 text-xs bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors">
                      Year
                    </button>
                  </div>
                </div>
                <div style={{ height: '300px' }}>
                  <Line
                    data={performanceData}
                    options={{
                      ...chartOptions,
                      plugins: {
                        legend: {
                          position: 'bottom' as const,
                          labels: {
                            usePointStyle: true,
                            padding: 20,
                          },
                        },
                      },
                    }}
                  />
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Admin Activity</h3>
                  <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                    <FaDownload size={16} />
                  </button>
                </div>
                <div style={{ height: '300px' }}>
                  <Bar
                    data={adminActivityData}
                    options={{
                      ...chartOptions,
                      plugins: {
                        legend: {
                          position: 'bottom' as const,
                          labels: {
                            usePointStyle: true,
                            padding: 20,
                          },
                        },
                      },
                    }}
                  />
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Report Distribution</h3>
                  <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                    <FaDownload size={16} />
                  </button>
                </div>
                <div style={{ height: '300px' }}>
                  <Doughnut
                    data={reportDistributionData}
                    options={{
                      ...chartOptions,
                      plugins: {
                        legend: {
                          position: 'bottom' as const,
                          labels: {
                            usePointStyle: true,
                            padding: 20,
                          },
                        },
                      },
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Admins</h3>
                  <button
                    onClick={() => setActiveTab('admin-management')}
                    className="text-[#005524] hover:text-[#004015] text-sm font-medium"
                  >
                    View all
                  </button>
                </div>
                <div className="space-y-4">
                  {admins.length === 0 ? (
                    <p className="text-sm text-gray-500">No admins created yet.</p>
                  ) : (
                    admins.slice(0, 3).map((admin) => (
                      <div
                        key={admin.id}
                        className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer group"
                        onClick={() => {
                          setSelectedAdmin(admin);
                          setShowPermissionsModal(true);
                        }}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-[#005524] to-[#f69f00] rounded-full flex items-center justify-center text-white font-semibold text-sm">
                            {admin.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{admin.name}</p>
                            <p className="text-sm text-gray-500">{admin.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button className="p-1 text-gray-400 hover:text-[#005524] opacity-0 group-hover:opacity-100 transition-all duration-300">
                            <FaPlus size={12} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Recent System Reports</h3>
                  <button
                    onClick={() => setActiveTab('system-reports')}
                    className="text-[#005524] hover:text-[#004015] text-sm font-medium"
                  >
                    View all
                  </button>
                </div>
                <div className="space-y-4">
                  {reports.length === 0 ? (
                    <p className="text-sm text-gray-500">No reports available. Generate a report in the System Reports tab.</p>
                  ) : (
                    reports.slice(0, 3).map((report) => (
                      <div
                        key={report.id}
                        className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer group"
                        onClick={() => {
                          setSelectedReport(report);
                          setShowReportDetails(true);
                        }}
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              report.type === 'performance'
                                ? 'bg-green-100'
                                : report.type === 'usage'
                                ? 'bg-blue-100'
                                : 'bg-red-100'
                            }`}
                          >
                            <FaChartBar
                              size={12}
                              className={
                                report.type === 'performance'
                                  ? 'text-green-600'
                                  : report.type === 'usage'
                                  ? 'text-blue-600'
                                  : 'text-red-600'
                              }
                            />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{report.title}</p>
                            <p className="text-sm text-gray-500">
                              {report.type.charAt(0).toUpperCase() + report.type.slice(1)} •{' '}
                              {new Date(report.date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              report.status === 'archived'
                                ? 'bg-green-100 text-green-800'
                                : report.status === 'reviewed'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                          </span>
                          <button className="p-1 text-gray-400 hover:text-[#005524] opacity-0 group-hover:opacity-100 transition-all duration-300">
                            <FaEye size={12} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">System Status</h3>
                  <button className="text-[#005524] hover:text-[#004015] text-sm font-medium"> Details </button>
                </div>
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <FaKey size={12} className="text-blue-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-900">Security System</span>
                      </div>
                      <span className="text-sm font-semibold text-green-600">98%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: '98%' }}></div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <FaUser size={12} className="text-green-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-900">User Management</span>
                      </div>
                      <span className="text-sm font-semibold text-green-600">95%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '95%' }}></div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                          <FaBell size={12} className="text-purple-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-900">Alert System</span>
                      </div>
                      <span className="text-sm font-semibold text-green-600">92%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-purple-500 h-2 rounded-full" style={{ width: '92%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case "admin-management":
        return (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">All Admins (Table View)</h2>
              <button
                onClick={() => setShowAddAdmin(true)}
                className="px-4 py-2 bg-[#005524] text-white rounded-lg hover:bg-[#004d20] transition-colors flex items-center gap-2"
              >
                <FaPlus size={14} /> Add New Admin
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Last Login</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Permissions</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {admins.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                        No admins created yet. Use the "Add New Admin" button to create one.
                      </td>
                    </tr>
                  ) : (
                    admins.map((admin) => (
                      <tr key={admin.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{admin.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{admin.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{admin.status}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{admin.lastLogin}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                          {admin.permissions.length > 0 ? (
                            admin.permissions.map((perm, index) => (
                              <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full mr-1">{perm}</span>
                            ))
                          ) : (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">None</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 space-x-2">
                          <button
                            onClick={() => handleToggleAdminStatus(admin.id)}
                            className={`px-3 py-1 rounded-lg transition-colors ${admin.status === 'active' ? 'bg-red-100 text-red-800 hover:bg-red-200' : 'bg-green-100 text-green-800 hover:bg-green-200'}`}
                          >
                            <FaLock size={12} className="inline mr-1" /> {admin.status === 'active' ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => {
                              setSelectedAdmin(admin);
                              setShowPermissionsModal(true);
                            }}
                            className="px-3 py-1 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors"
                          >
                            <FaPermissions size={12} className="inline mr-1" /> Permissions
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      case "feature-updates":
        return (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Feature Updates</h2>
              <button
                onClick={() => setShowFeatureUpdateModal(true)}
                className="px-4 py-2 bg-[#005524] text-white rounded-lg hover:bg-[#004d20] transition-colors flex items-center gap-2"
              >
                <FaPlus size={14} /> Add New Update
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {featureUpdates.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                        No feature updates available. Use the "Add New Update" button to create one.
                      </td>
                    </tr>
                  ) : (
                    featureUpdates.map((update) => (
                      <tr key={update.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{update.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-800">{update.description}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              update.status === 'approved'
                                ? 'bg-green-100 text-green-800'
                                : update.status === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {update.status.charAt(0).toUpperCase() + update.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                          {new Date(update.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 space-x-2">
                          {update.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleFeatureUpdate(update.id, 'approved')}
                                className="px-3 py-1 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleFeatureUpdate(update.id, 'rejected')}
                                className="px-3 py-1 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition-colors"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      case "system-reports":
        return (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">System Reports</h2>
              <button
                onClick={() => setShowGenerateReportModal(true)}
                className="px-4 py-2 bg-[#005524] text-white rounded-lg hover:bg-[#004d20] transition-colors flex items-center gap-2"
              >
                <FaPlus size={14} /> Generate Report
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Title</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reports.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                        No reports available. Use the "Generate Report" button to create one.
                      </td>
                    </tr>
                  ) : (
                    reports.map((report) => (
                      <tr key={report.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{report.title}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                          {report.type.charAt(0).toUpperCase() + report.type.slice(1)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              report.status === 'archived'
                                ? 'bg-green-100 text-green-800'
                                : report.status === 'reviewed'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                          {new Date(report.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 space-x-2">
                          <button
                            onClick={() => handleReportAction(report.id, 'review')}
                            className={`px-3 py-1 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors ${isSubmittingReportAction ? 'opacity-50 cursor-not-allowed' : ''}`}
                            disabled={isSubmittingReportAction}
                          >
                            Review
                          </button>
                          <button
                            onClick={() => handleReportAction(report.id, 'archive')}
                            className={`px-3 py-1 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors ${isSubmittingReportAction ? 'opacity-50 cursor-not-allowed' : ''}`}
                            disabled={isSubmittingReportAction}
                          >
                            Archive
                          </button>
                          <button
                            onClick={() => {
                              setShowReportDetails(true);
                              setSelectedReport(report);
                            }}
                            className="px-3 py-1 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors"
                          >
                            Details
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      case "settings":
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Personal Information</h3>
                <button
                  onClick={() => setIsEditingPersonal(!isEditingPersonal)}
                  className="text-sm font-medium text-[#005524] hover:text-[#004d20]"
                >
                  {isEditingPersonal ? 'Cancel' : 'Edit'}
                </button>
              </div>
              <form className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    id="name"
                    value={personalInfo.name}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, name: e.target.value })}
                    disabled={!isEditingPersonal}
                    className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm p-2 ${!isEditingPersonal ? 'bg-gray-100' : 'bg-white'}`}
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    value={personalInfo.email}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, email: e.target.value })}
                    disabled={!isEditingPersonal}
                    className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm p-2 ${!isEditingPersonal ? 'bg-gray-100' : 'bg-white'}`}
                  />
                </div>
                {isEditingPersonal && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handlePersonalInfoUpdate}
                      className="px-4 py-2 bg-[#005524] text-white rounded-lg hover:bg-[#004d20]"
                    >
                      Save Changes
                    </button>
                  </div>
                )}
              </form>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Security</h3>
                <button
                  onClick={() => setIsEditingSecurity(!isEditingSecurity)}
                  className="text-sm font-medium text-[#005524] hover:text-[#004d20]"
                >
                  {isEditingSecurity ? 'Cancel' : 'Change Password'}
                </button>
              </div>
              <form className="space-y-4">
                {isEditingSecurity && (
                  <>
                    <div>
                      <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">Current Password</label>
                      <input
                        type="password"
                        id="currentPassword"
                        value={securityInfo.currentPassword}
                        onChange={(e) => setSecurityInfo({ ...securityInfo, currentPassword: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm p-2"
                      />
                    </div>
                    <div>
                      <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">New Password</label>
                      <input
                        type="password"
                        id="newPassword"
                        value={securityInfo.newPassword}
                        onChange={(e) => setSecurityInfo({ ...securityInfo, newPassword: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm p-2"
                      />
                    </div>
                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                      <input
                        type="password"
                        id="confirmPassword"
                        value={securityInfo.confirmPassword}
                        onChange={(e) => setSecurityInfo({ ...securityInfo, confirmPassword: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm p-2"
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handlePasswordUpdate}
                        className="px-4 py-2 bg-[#005524] text-white rounded-lg hover:bg-[#004d20]"
                      >
                        Change Password
                      </button>
                    </div>
                  </>
                )}
              </form>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">General Settings</h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Notifications</h4>
                    <p className="text-sm text-gray-600">Enable/disable notifications</p>
                  </div>
                  <button
                    onClick={() => setNotifications(!notifications)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${notifications ? 'bg-[#005524]' : 'bg-gray-200'}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${notifications ? 'translate-x-6' : 'translate-x-1'}`}
                    />
                  </button>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Email Notifications</h4>
                    <p className="text-sm text-gray-600">Receive updates via email</p>
                  </div>
                  <button
                    onClick={() => setEmailNotifications(!emailNotifications)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${emailNotifications ? 'bg-[#005524]' : 'bg-gray-200'}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${emailNotifications ? 'translate-x-6' : 'translate-x-1'}`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <div className={`bg-white shadow-sm border-r border-gray-200 transition-all duration-300 ${isSidebarCollapsed ? 'w-16' : 'w-64'}`}>
        <div className="flex items-center justify-between p-4">
          {!isSidebarCollapsed && (
            <img src={logoImage} alt="Logo" className="h-8" />
          )}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-2 text-gray-600 hover:text-[#005524] hover:bg-gray-50 rounded-full"
          >
            {isSidebarCollapsed ? <FaChevronRight size={16} /> : <FaChevronLeft size={16} />}
          </button>
        </div>
        <nav className="mt-4">
          <ul className="space-y-2">
            <li>
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center w-full p-3 text-sm font-medium ${activeTab === 'dashboard' ? 'bg-[#005524] text-white' : 'text-gray-600 hover:bg-gray-50 hover:text-[#005524]'}`}
              >
                <FaHome size={16} className={isSidebarCollapsed ? '' : 'mr-3'} />
                {!isSidebarCollapsed && 'Dashboard'}
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab('admin-management')}
                className={`flex items-center w-full p-3 text-sm font-medium ${activeTab === 'admin-management' ? 'bg-[#005524] text-white' : 'text-gray-600 hover:bg-gray-50 hover:text-[#005524]'}`}
              >
                <FaTable size={16} className={isSidebarCollapsed ? '' : 'mr-3'} />
                {!isSidebarCollapsed && 'Admin Management'}
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab('feature-updates')}
                className={`flex items-center w-full p-3 text-sm font-medium ${activeTab === 'feature-updates' ? 'bg-[#005524] text-white' : 'text-gray-600 hover:bg-gray-50 hover:text-[#005524]'}`}
              >
                <FaCubes size={16} className={isSidebarCollapsed ? '' : 'mr-3'} />
                {!isSidebarCollapsed && 'Feature Updates'}
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab('system-reports')}
                className={`flex items-center w-full p-3 text-sm font-medium ${activeTab === 'system-reports' ? 'bg-[#005524] text-white' : 'text-gray-600 hover:bg-gray-50 hover:text-[#005524]'}`}
              >
                <FaFileAlt size={16} className={isSidebarCollapsed ? '' : 'mr-3'} />
                {!isSidebarCollapsed && 'System Reports'}
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab('settings')}
                className={`flex items-center w-full p-3 text-sm font-medium ${activeTab === 'settings' ? 'bg-[#005524] text-white' : 'text-gray-600 hover:bg-gray-50 hover:text-[#005524]'}`}
              >
                <FaCog size={16} className={isSidebarCollapsed ? '' : 'mr-3'} />
                {!isSidebarCollapsed && 'Settings'}
              </button>
            </li>
          </ul>
        </nav>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="bg-white shadow-sm border-b border-gray-200 p-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 text-gray-600 hover:text-[#005524] hover:bg-gray-50 rounded-full lg:hidden"
            >
              <FaChevronRight size={16} />
            </button>
            <h1 className="text-xl font-semibold text-gray-900">Super Admin Dashboard</h1>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-gray-600 hover:text-[#005524] hover:bg-gray-50 rounded-full"
            >
              <FaBell size={16} />
              {notificationsList.some(notification => !notification.read) && (
                <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
              )}
            </button>
            <div className="relative">
              <button
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="flex items-center space-x-2 text-gray-600 hover:text-[#005524]"
              >
                <FaUserCircle size={24} />
                <span className="hidden md:inline text-sm font-medium">{userProfile?.name || 'Super Admin'}</span>
                <FaChevronDown size={12} />
              </button>
              {isProfileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-2 z-50">
                  <button
                    onClick={() => setActiveTab('settings')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Profile Settings
                  </button>
                  <button
                    onClick={() => setShowLogoutConfirm(true)}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                  >
                    Log Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {showNotifications && (
          <div className="absolute right-4 top-16 w-80 bg-white rounded-lg shadow-lg border border-gray-100 p-4 z-50">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Notifications</h3>
            {notificationsList.length === 0 ? (
              <p className="text-sm text-gray-500">No new notifications</p>
            ) : (
              notificationsList.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg ${
                    notification.read ? 'bg-gray-50' : 'bg-white'
                  }`}
                  onClick={() => markNotificationAsRead(notification.id)}
                >
                  <div className="flex items-center space-x-2">
                    {!notification.read && (
                      <span className="h-2 w-2 bg-red-500 rounded-full"></span>
                    )}
                    <div>
                      <p className={`text-sm ${notification.read ? 'text-gray-600' : 'text-gray-800 font-medium'}`}>
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500">{notification.time}</p>
                    </div>
                  </div>
                  {notification.message.includes('System report') && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent marking as read when clicking the button
                        handleGenerateReportFromNotification(notification.id);
                      }}
                      className="text-xs text-[#005524] hover:text-[#004d20]"
                      disabled={isSubmittingReport}
                    >
                      Generate Report
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        <div className="flex-1 p-6 overflow-y-auto">
          {error && (
            <div className="mb-4 p-4 bg-red-100 text-red-800 rounded-lg flex justify-between items-center">
              <span>{error}</span>
              <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
                ✕
              </button>
            </div>
          )}
          {successMessage && (
            <div className="mb-4 p-4 bg-green-100 text-green-800 rounded-lg flex justify-between items-center">
              <span>{successMessage}</span>
              <button onClick={() => setSuccessMessage(null)} className="text-green-600 hover:text-green-800">
                ✕
              </button>
            </div>
          )}
          {renderContent()}
        </div>
      </div>

      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Logout</h3>
            <p className="text-sm text-gray-600 mb-6">Are you sure you want to log out?</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Admin</h3>
            <form onSubmit={handleAddAdmin} className="space-y-4">
              <div>
                <label htmlFor="adminName" className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  id="adminName"
                  name="adminName"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm p-2"
                />
              </div>
              <div>
                <label htmlFor="adminEmail" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  id="adminEmail"
                  name="adminEmail"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm p-2"
                />
              </div>
              <div>
                <label htmlFor="adminPassword" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  type="password"
                  id="adminPassword"
                  name="adminPassword"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm p-2"
                />
              </div>
                            <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddAdmin(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdmin}
                  className={`px-4 py-2 bg-[#005524] text-white rounded-lg hover:bg-[#004d20] ${isSubmittingAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isSubmittingAdmin ? 'Adding...' : 'Add Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showFeatureUpdateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Feature Update</h3>
            <form onSubmit={handleAddFeatureUpdate} className="space-y-4">
              <div>
                <label htmlFor="updateName" className="block text-sm font-medium text-gray-700">
                  Update Name
                </label>
                <input
                  type="text"
                  id="updateName"
                  name="updateName"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm p-2"
                />
              </div>
              <div>
                <label htmlFor="updateDesc" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  id="updateDesc"
                  name="updateDesc"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm p-2"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowFeatureUpdateModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingFeature}
                  className={`px-4 py-2 bg-[#005524] text-white rounded-lg hover:bg-[#004d20] ${isSubmittingFeature ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isSubmittingFeature ? 'Adding...' : 'Add Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showGenerateReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Generate Report</h3>
            <form onSubmit={handleGenerateReport} className="space-y-4">
              <div>
                <label htmlFor="reportTitle" className="block text-sm font-medium text-gray-700">
                  Report Title
                </label>
                <input
                  type="text"
                  id="reportTitle"
                  name="reportTitle"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm p-2"
                />
              </div>
              <div>
                <label htmlFor="reportType" className="block text-sm font-medium text-gray-700">
                  Report Type
                </label>
                <select
                  id="reportType"
                  name="reportType"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm p-2"
                >
                  <option value="performance">Performance</option>
                  <option value="usage">Usage</option>
                  <option value="security">Security</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowGenerateReportModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReport}
                  className={`px-4 py-2 bg-[#005524] text-white rounded-lg hover:bg-[#004d20] ${isSubmittingReport ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isSubmittingReport ? 'Generating...' : 'Generate Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showReportDetails && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{selectedReport.title}</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Type</p>
                <p className="text-sm text-gray-900">{selectedReport.type.charAt(0).toUpperCase() + selectedReport.type.slice(1)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Status</p>
                <p className="text-sm text-gray-900">{selectedReport.status.charAt(0).toUpperCase() + selectedReport.status.slice(1)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Date</p>
                <p className="text-sm text-gray-900">{new Date(selectedReport.date).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Metrics</p>
                <ul className="text-sm text-gray-900 space-y-1">
                  {selectedReport.metrics.uptime && <li>Uptime: {selectedReport.metrics.uptime}%</li>}
                  {selectedReport.metrics.activeUsers && <li>Active Users: {selectedReport.metrics.activeUsers}</li>}
                  {selectedReport.metrics.responseTime && <li>Response Time: {selectedReport.metrics.responseTime}ms</li>}
                  {selectedReport.metrics.securityIncidents && <li>Security Incidents: {selectedReport.metrics.securityIncidents}</li>}
                </ul>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowReportDetails(false)}
                className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200"
              >
                Close
              </button>
              <button
                onClick={() => handleReportAction(selectedReport.id, 'review')}
                className={`px-4 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 ${isSubmittingReportAction ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={isSubmittingReportAction}
              >
                Review
              </button>
              <button
                onClick={() => handleReportAction(selectedReport.id, 'archive')}
                className={`px-4 py-2 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 ${isSubmittingReportAction ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={isSubmittingReportAction}
              >
                Archive
              </button>
            </div>
          </div>
        </div>
      )}

      {showPermissionsModal && selectedAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Manage Permissions for {selectedAdmin.name}</h3>
            <form onSubmit={(e) => handleUpdatePermissions(e, selectedAdmin.id)} className="space-y-4">
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="view_reports"
                    defaultChecked={selectedAdmin.permissions.includes('view_reports')}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">View Reports</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="manage_admins"
                    defaultChecked={selectedAdmin.permissions.includes('manage_admins')}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">Manage Admins</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="approve_features"
                    defaultChecked={selectedAdmin.permissions.includes('approve_features')}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">Approve Features</span>
                </label>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowPermissionsModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#005524] text-white rounded-lg hover:bg-[#004d20]"
                >
                  Save Permissions
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminDashboard;