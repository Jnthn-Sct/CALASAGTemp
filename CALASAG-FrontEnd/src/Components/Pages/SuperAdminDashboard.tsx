import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logoImage from "../Images/nobg-logo.png";
import {
  FaUserCircle,
  FaBell,
  FaChevronDown,
  FaChevronLeft,
  FaChevronRight,
  FaTable,
  FaChartBar,
  FaKey,
  FaFileAlt,
  FaCubes,
  FaLock,
  FaUser,
  FaHome,
  FaCog,
  FaDownload,
  FaPlus,
  FaEye,
  FaShieldAlt,
  FaKey as FaPermissions,
} from "react-icons/fa";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { supabase } from "../../db"; // Adjust path to your Supabase client

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface Admin {
  id: number;
  user_id: string; // Actual UUID from the users table
  name: string;
  email: string;
  status: "active" | "inactive";
  lastLogin: string;
  last_login?: string; // Database field
}

interface FeatureUpdate {
  id: number;
  name: string;
  description: string;
  status: "pending" | "approved" | "rejected";
  date: string;
}

interface SystemReport {
  id: number;
  title: string;
  type: "performance" | "usage" | "security";
  status: "generated" | "reviewed" | "archived";
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
  user_id: string;
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
  const [showFeatureUpdateModal, setShowFeatureUpdateModal] =
    useState<boolean>(false);
  const [showReportDetails, setShowReportDetails] = useState<boolean>(false);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [selectedReport, setSelectedReport] = useState<SystemReport | null>(
    null
  );
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] =
    useState<boolean>(false);
  const [isEditingPersonal, setIsEditingPersonal] = useState<boolean>(false);
  const [isEditingSecurity, setIsEditingSecurity] = useState<boolean>(false);
  const [personalInfo, setPersonalInfo] = useState({ name: "", email: "" });
  const [securityInfo, setSecurityInfo] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [notifications, setNotifications] = useState<boolean>(false);
  const [emailNotifications, setEmailNotifications] = useState<boolean>(false);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [notificationsList, setNotificationsList] = useState<Notification[]>(
    []
  );
  const [featureUpdates, setFeatureUpdates] = useState<FeatureUpdate[]>([]);
  const [reports, setReports] = useState<SystemReport[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [showGenerateReportModal, setShowGenerateReportModal] =
    useState<boolean>(false);
  const [isSubmittingAdmin, setIsSubmittingAdmin] = useState<boolean>(false);
  const [isSubmittingFeature, setIsSubmittingFeature] =
    useState<boolean>(false);
  const [isSubmittingReport, setIsSubmittingReport] = useState<boolean>(false);
  const [isSubmittingReportAction, setIsSubmittingReportAction] =
    useState<boolean>(false);

      const [systemStatus, setSystemStatus] = useState({
    security: { unresolved: 0, total: 0 },
    userManagement: { activePercent: 0 },
    alerts: { active: 0, resolved: 0 },
    dbPerformance: { latency: 15 }, // Mocked value
  });
  // Chart data
  const [performanceData, setPerformanceData] = useState({
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        label: "System Uptime (%)",
        data: [0, 0, 0, 0, 0, 0],
        borderColor: "#005524",
        backgroundColor: "rgba(0, 85, 36, 0.1)",
        tension: 0.4,
        fill: true,
      },
    ],
  });

  const [adminActivityData, setAdminActivityData] = useState({
    labels: ["Active Admins", "Inactive Admins"],
    datasets: [
      {
        label: "Admin Status",
        data: [0, 0],
        backgroundColor: ["#005524", "#f9a01b"],
      },
    ],
  });

  const [reportDistributionData, setReportDistributionData] = useState({
    labels: ["Performance", "Usage", "Security"],
    datasets: [
      {
        data: [0, 0, 0],
        backgroundColor: ["#005524", "#f9a01b", "#ff4d4f"],
        borderWidth: 0,
      },
    ],
  });

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
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
          throw new Error("No authenticated user found");
        }

        const { data: profileData, error: profileError } = await supabase
          .from("users")
          .select("user_id, name, email, role")
          .eq("user_id", user.id)
          .single()
          .returns<UserProfile>();
        if (profileError) {
          throw new Error(`Profile fetch error: ${profileError.message}`);
        }

        if (profileData.role !== "super_admin") {
          navigate("/dashboard");
          return;
        }

        setUserProfile({
          id: profileData.user_id,
          user_id: profileData.user_id,
          name: profileData.name || "Super Admin",
          email: profileData.email,
          role: profileData.role,
        });
        setPersonalInfo({
          name: profileData.name || "Super Admin",
          email: profileData.email,
        });
      } catch (err: any) {
        setError(`Failed to load user data: ${err.message}`);
        navigate("/login");
      }
    };

    fetchUserData();

    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        navigate("/login");
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  // Fetch admins
  const fetchAllUsers = async () => {
    try {
      let { data, error } = await supabase
        .from("users")
        .select("user_id, name, email, role, status, last_login")
        .eq("role", "admin")
        .returns<Admin[]>();
      if (error) {
        if (error.message.includes("Could not find the column")) {
          await supabase.rpc("notify_pgrst_reload_schema");
          const { data: retryData, error: retryError } = await supabase
            .from("users")
            .select(
              "user_id, name, email, role, status, last_login"
            )
            .eq("role", "admin")
            .returns<Admin[]>();
          if (retryError) throw retryError;
          data = retryData;
        } else {
          throw error;
        }
      }

      const adminsData = (data || []).map((user, index) => ({
        id: index + 1,
        user_id: user.user_id,
        name: user.name || "Unknown",
        email: user.email,
        status: user.status || "inactive",
        lastLogin: user.last_login
          ? new Date(user.last_login).toLocaleString()
          : "N/A",
        last_login: user.last_login,
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
        .from("users")
        .select("status")
        .eq("role", "admin");
      if (error) {
        if (error.message.includes("Could not find the column")) {
          await supabase.rpc("notify_pgrst_reload_schema");
          const { data: retryData, error: retryError } = await supabase
            .from("users")
            .select("status")
            .eq("role", "admin");
          if (retryError) throw retryError;
          data = retryData;
        } else {
          throw error;
        }
      }

      const activeCount = (data || []).filter(
        (user) => user.status === "active"
      ).length;
      const inactiveCount = (data || []).filter(
        (user) => user.status === "inactive"
      ).length;

      setAdminActivityData({
        labels: ["Active Admins", "Inactive Admins"],
        datasets: [
          {
            label: "Admin Status",
            data: [activeCount, inactiveCount],
            backgroundColor: ["#005524", "#f9a01b"],
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
        .from("feature_updates")
        .select("id, name, description, status, date")
        .order("date", { ascending: false })
        .returns<FeatureUpdate[]>();
      if (error) {
        if (error.message.includes("Could not find the table")) {
          await supabase.rpc("notify_pgrst_reload_schema");
          const { data: retryData, error: retryError } = await supabase
            .from("feature_updates")
            .select("id, name, description, status, date")
            .order("date", { ascending: false })
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
        .from("system_reports")
        .select("id, title, type, status, date, metrics")
        .order("date", { ascending: false })
        .returns<SystemReport[]>();
      if (error) {
        if (error.message.includes("Could not find the table")) {
          await supabase.rpc("notify_pgrst_reload_schema");
          const { data: retryData, error: retryError } = await supabase
            .from("system_reports")
            .select("id, title, type, status, date, metrics")
            .order("date", { ascending: false })
            .returns<SystemReport[]>();
          if (retryError) throw retryError;
          setReports(retryData || []);
        } else {
          throw error;
        }
      } else {
        setReports(data || []);

        const performance = data.filter((r) => r.type === "performance").length;
        const usage = data.filter((r) => r.type === "usage").length;
        const security = data.filter((r) => r.type === "security").length;
        setReportDistributionData({
          labels: ["Performance", "Usage", "Security"],
          datasets: [
            {
              data: [performance, usage, security],
              backgroundColor: ["#005524", "#f9a01b", "#ff4d4f"],
              borderWidth: 0,
            },
          ],
        });
      }
    } catch (error: any) {
      console.error("Fetch reports error:", error);
      setError(`Failed to fetch reports: ${error.message}`);
    }
  };

  // Fetch performance data for chart
  const fetchPerformanceData = async () => {
    try {
      const startDate = "2025-01-01";
      const endDate = "2025-08-31";
      const { data, error } = await supabase
        .from("system_reports")
        .select("date, metrics")
        .eq("type", "performance")
        .gte("date", startDate)
        .lte("date", endDate)
        .returns<{ date: string; metrics: { uptime?: number } }[]>();
      if (error) throw error;

      const monthlyUptime = [0, 0, 0, 0, 0, 0, 0, 0];
      data.forEach((report) => {
        const month = new Date(report.date).getMonth();
        monthlyUptime[month] = report.metrics.uptime || 0;
      });

      setPerformanceData({
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"],
        datasets: [
          {
            label: "System Uptime (%)",
            data: monthlyUptime,
            borderColor: "#005524",
            backgroundColor: "rgba(0, 85, 36, 0.1)",
            tension: 0.4,
            fill: true,
          },
        ],
      });
    } catch (error: any) {
      console.error("Fetch performance data error:", error);
      setError(`Failed to fetch performance data: ${error.message}`);
    }
  };

  // Fetch notifications for the current super admin
  const fetchNotifications = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user found");

      const { data, error } = await supabase
        .from("notifications")
        .select("id, message, created_at, read")
        .eq("user_id", user.id) // Fetch only for the current super admin
        .order("created_at", { ascending: false })
        .limit(5)
        .returns<
          { id: number; message: string; created_at: string; read: boolean }[]
        >();
      if (error) throw error;

      setNotificationsList(
        data.map((notification) => ({
          id: notification.id,
          message: notification.message,
          time: new Date(notification.created_at).toLocaleTimeString(),
          read: notification.read,
        }))
      );
    } catch (error: any) {
      console.error("Fetch notifications error:", error);
      setError(`Failed to fetch notifications: ${error.message}`);
    }
  };

  // Mark notification as read
  const markNotificationAsRead = async (notificationId: number) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", notificationId);
      if (error) throw error;

      setNotificationsList((prev) =>
        prev.map((notification) =>
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
  const handleReportAction = async (
    reportId: number,
    action: "review" | "archive"
  ) => {
    setIsSubmittingReportAction(true);
    try {
      const newStatus = action === "review" ? "reviewed" : "archived";
      const { error } = await supabase
        .from("system_reports")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", reportId);
      if (error) throw error;

      // Get current user ID
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        // Create notification for the report action
        const { error: notificationError } = await supabase
          .from("notifications")
          .insert({
            user_id: user.id,
            message: `System report has been ${action}ed`,
            type: "system_report",
            notification_type: "general",
            read: false,
          });

        if (notificationError) {
          console.error("Notification creation failed:", notificationError);
        }
      }

      setReports((prev) =>
        prev.map((report) =>
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

  // Fetch system status data
  const fetchSystemStatus = async () => {
    try {
      // 1. Security System: Unresolved incidents
      const { data: incidents, error: incidentsError } = await supabase
        .from("emergencies")
        .select("status", { count: "exact" });

      if (incidentsError) throw incidentsError;

      const unresolvedIncidents = incidents.filter(
        (i) => i.status !== "resolved"
      ).length;

      // 2. User Management: % of active users in last 7 days
      const sevenDaysAgo = new Date(
        Date.now() - 7 * 24 * 60 * 60 * 1000
      ).toISOString();
      const { count: totalUsers, error: totalUsersError } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true });

      if (totalUsersError) throw totalUsersError;

      const { count: activeUsers, error: activeUsersError } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .gte("last_login", sevenDaysAgo);

      if (activeUsersError) throw activeUsersError;

      const activeUserPercentage =
        totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0;

      // 3. Alert System: Active vs Resolved
      const { data: alerts, error: alertsError } = await supabase
        .from("emergencies")
        .select("status");

      if (alertsError) throw alertsError;

      const activeAlerts = alerts.filter(
        (a) => a.status === "pending" || a.status === "reviewing"
      ).length;
      const resolvedAlerts = alerts.filter(
        (a) => a.status === "resolved"
      ).length;

      // 4. DB Performance (mocked)
      // Note: Real DB latency isn't available via client-side API for security reasons.
      // This value is static but can be replaced if an API becomes available.
      const dbLatency = 15; // ms

      setSystemStatus({
        security: { unresolved: unresolvedIncidents, total: incidents.length },
        userManagement: { activePercent: activeUserPercentage },
        alerts: { active: activeAlerts, resolved: resolvedAlerts },
        dbPerformance: { latency: dbLatency },
      });
    } catch (error: any) {
      console.error("Error fetching system status:", error);
      setError(`Failed to fetch system status: ${error.message}`);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      localStorage.removeItem("userRole");
      navigate("/login");
    } catch (error: any) {
      setError(`Failed to log out: ${error.message}`);
    }
  };

  // Handle add admin
  const handleAddAdmin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmittingAdmin(true);
    try {
      // Frontend guard: only super_admins can create admins
      if (!userProfile || userProfile.role !== "super_admin") {
        throw new Error("Only super admins can create admin accounts");
      }

      const formData = new FormData(e.currentTarget);
      const adminName = formData.get("adminName") as string;
      const adminEmail = formData.get("adminEmail") as string;
      const adminPassword = formData.get("adminPassword") as string;

      // Call Edge Function (must be deployed as `create_admin` in Supabase)
      const { data: sessionData } = await supabase.auth.getSession();
      const { error } = await supabase.functions.invoke("create_admin", {
        body: { name: adminName, email: adminEmail, password: adminPassword },
        headers: sessionData?.session?.access_token
          ? { Authorization: `Bearer ${sessionData.session.access_token}` }
          : undefined,
      });

      if (error) {
        throw new Error(error.message || "Failed to create admin (backend)");
      }

      await fetchAllUsers();
      setShowAddAdmin(false);
      setSuccessMessage("Admin added successfully");
    } catch (error: any) {
      setError(`Failed to add admin: ${error.message}`);
    } finally {
      setIsSubmittingAdmin(false);
    }
  };

  // Handle feature update
  const handleFeatureUpdate = async (
    updateId: number,
    status: "approved" | "rejected"
  ) => {
    try {
      const { error } = await supabase
        .from("feature_updates")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", updateId);
      if (error) throw error;

      // Get current user ID
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        // Create notification for the feature update
        const { error: notificationError } = await supabase
          .from("notifications")
          .insert({
            user_id: user.id,
            message: `Feature update has been ${status}`,
            type: "feature_update",
            notification_type: "general",
            read: false,
          });

        if (notificationError) {
          console.error("Notification creation failed:", notificationError);
        }
      }

      setFeatureUpdates((prev) =>
        prev.map((update) =>
          update.id === updateId ? { ...update, status } : update
        )
      );
      setSuccessMessage(`Feature update ${status} successfully`);
    } catch (error: any) {
      setError(`Failed to update feature: ${error.message}`);
    }
  };

  // Handle add feature update
  const handleAddFeatureUpdate = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    setIsSubmittingFeature(true);
    try {
      const formData = new FormData(e.currentTarget);
      const updateName = formData.get("updateName") as string;
      const updateDesc = formData.get("updateDesc") as string;

      const { error } = await supabase.from("feature_updates").insert({
        name: updateName,
        description: updateDesc,
        status: "pending",
        date: new Date().toISOString(),
      });

      if (error) throw error;

      // Get current user ID
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        // Create notification for the new feature update
        const { error: notificationError } = await supabase
          .from("notifications")
          .insert({
            user_id: user.id,
            message: `New feature update "${updateName}" has been added`,
            type: "feature_update",
            notification_type: "general",
            read: false,
          });

        if (notificationError) {
          console.error("Notification creation failed:", notificationError);
        }
      }

      await fetchFeatureUpdates();
      setShowFeatureUpdateModal(false);
      setSuccessMessage("Feature update added successfully");
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
      const reportTitle = formData.get("reportTitle") as string;
      const reportType = formData.get("reportType") as
        | "performance"
        | "usage"
        | "security";
      const metrics = {
        uptime: reportType === "performance" ? 99.5 : undefined,
        activeUsers: reportType === "usage" ? 1000 : undefined,
        responseTime: reportType === "performance" ? 200 : undefined,
        securityIncidents: reportType === "security" ? 0 : undefined,
      };

      const { error } = await supabase.from("system_reports").insert({
        title: reportTitle,
        type: reportType,
        status: "generated",
        date: new Date().toISOString(),
        metrics,
      });

      if (error) throw error;

      // Get current user ID
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        // Create notification for the generated report
        const { error: notificationError } = await supabase
          .from("notifications")
          .insert({
            user_id: user.id,
            message: `System report "${reportTitle}" has been generated`,
            type: "system_report",
            notification_type: "general",
            read: false,
          });

        if (notificationError) {
          console.error("Notification creation failed:", notificationError);
        }
      }

      await fetchReports();
      setShowGenerateReportModal(false);
      setSuccessMessage("Report generated successfully");
    } catch (error: any) {
      setError(`Failed to generate report: ${error.message}`);
    } finally {
      setIsSubmittingReport(false);
    }
  };

  // Handle toggle admin status
  const handleToggleAdminStatus = async (adminId: number) => {
    try {
      const admin = admins.find((a) => a.id === adminId);
      if (!admin) return;

      const newStatus = admin.status === "active" ? "inactive" : "active";
      const { error } = await supabase
        .from("users")
        .update({ status: newStatus })
        .eq("user_id", admin.user_id);

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
        .from("users")
        .update({ name: personalInfo.name, email: personalInfo.email })
        .eq("user_id", userProfile?.id);

      if (error) throw error;

      setUserProfile((prev) =>
        prev
          ? { ...prev, name: personalInfo.name, email: personalInfo.email }
          : null
      );
      setIsEditingPersonal(false);
      setSuccessMessage("Personal info updated successfully");
    } catch (error: any) {
      setError(`Failed to update personal info: ${error.message}`);
    }
  };

  // Handle password update
  const handlePasswordUpdate = async () => {
    if (securityInfo.newPassword !== securityInfo.confirmPassword) {
      setError("New password and confirm password do not match");
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: securityInfo.newPassword,
      });

      if (error) throw error;

      setSecurityInfo({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setIsEditingSecurity(false);
      setSuccessMessage("Password updated successfully");
    } catch (error: any) {
      setError(`Failed to update password: ${error.message}`);
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
    fetchSystemStatus();

    const featureSubscription = supabase
      .channel(`feature_updates_${Date.now()}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "feature_updates" },
        () => {
          fetchFeatureUpdates();
        }
      )
      .subscribe((_status, err) => {
        if (err) {
          console.error("Feature subscription error:", err);
          setError(`Feature subscription error: ${err.message}`);
        }
      });

    const reportSubscription = supabase
      .channel(`system_reports_${Date.now()}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "system_reports" },
        () => {
          fetchReports();
          fetchPerformanceData();
          fetchSystemStatus(); // Re-fetch on report changes
        }
      )
      .subscribe((_status, err) => {
        if (err) {
          console.error("Report subscription error:", err);
          setError(`Report subscription error: ${err.message}`);
        }
      });

    const userSubscription = supabase
      .channel(`users_${Date.now()}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "users",
        },
        () => {
          fetchAllUsers();
          fetchAdminActivityData();
          fetchSystemStatus(); // Re-fetch on user changes
        }
      )
      .subscribe((_status, err) => {
        if (err) {
          console.error("User subscription error:", err);
          setError(`User subscription error: ${err.message}`);
        }
      });

    if (!userProfile?.id) return;

    const notificationSubscription = supabase
      .channel(`notifications_${Date.now()}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userProfile?.id}`,
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe((_status, err) => {
        if (err) {
          console.error("Notification subscription error:", err);
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
          <div className="space-y-4">
            {/* Top Metric Cards */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="group bg-white rounded-2xl p-6 shadow-sm transition-transform duration-300 ease-out transform hover:-translate-y-2 hover:shadow-lg border border-gray-100 hover:border-[#005524]/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">
                      TOTAL ADMINS
                    </p>
                    <p className="text-3xl font-bold text-gray-900">
                      {admins.length}
                    </p>
                    <p className="text-sm text-green-600 mt-1">
                      {admins.filter((a) => a.status === "active").length}{" "}
                      active
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-[#005524] to-[#004015] rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <FaUser size={20} />
                  </div>
                </div>
              </div>
              <div className="group bg-white rounded-2xl p-6 shadow-sm transition-transform duration-300 ease-out transform hover:-translate-y-2 hover:shadow-lg border border-gray-100 hover:border-blue-500/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">
                      PENDING UPDATES
                    </p>
                    <p className="text-3xl font-bold text-gray-900">
                      {
                        featureUpdates.filter((fu) => fu.status === "pending")
                          .length
                      }
                    </p>
                    <p className="text-sm text-blue-600 mt-1">
                      {
                        featureUpdates.filter((fu) => fu.status === "approved")
                          .length
                      }{" "}
                      approved
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <FaCog size={20} />
                  </div>
                </div>
              </div>
              <div className="group bg-white rounded-2xl p-6 shadow-sm transition-transform duration-300 ease-out transform hover:-translate-y-2 hover:shadow-lg border border-gray-100 hover:border-red-500/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">
                      SYSTEM REPORTS
                    </p>
                    <p className="text-3xl font-bold text-gray-900">
                      {reports.length}
                    </p>
                    <p className="text-sm text-red-600 mt-1">
                      {reports.filter((r) => r.status === "generated").length}{" "}
                      generated
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <FaChartBar size={20} />
                  </div>
                </div>
              </div>
              <div className="group bg-white rounded-2xl p-6 shadow-sm transition-transform duration-300 ease-out transform hover:-translate-y-2 hover:shadow-lg border border-gray-100 hover:border-green-500/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">
                      SYSTEM UPTIME
                    </p>
                    <p className="text-3xl font-bold text-gray-900">99.8%</p>
                    <p className="text-sm text-green-600 mt-1">
                      All systems operational
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <FaShieldAlt size={20} />
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="bg-white rounded-2xl p-6 shadow-sm transition-transform duration-300 ease-out transform hover:-translate-y-2 hover:shadow-lg border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      System Performance Trends
                    </h3>
                    <p className="text-sm text-gray-600">
                      Uptime metrics for 2025
                    </p>
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
                <div style={{ height: "300px" }}>
                  <Line
                    data={performanceData}
                    options={{
                      ...chartOptions,
                      plugins: {
                        legend: {
                          position: "bottom" as const,
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

              <div className="bg-white rounded-2xl p-6 shadow-sm transition-transform duration-300 ease-out transform hover:-translate-y-2 hover:shadow-lg border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Admin Activity
                  </h3>
                  <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                    <FaDownload size={16} />
                  </button>
                </div>
                <div style={{ height: "300px" }}>
                  <Bar
                    data={adminActivityData}
                    options={{
                      ...chartOptions,
                      plugins: {
                        legend: {
                          position: "bottom" as const,
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

              <div className="bg-white rounded-2xl p-6 shadow-sm transition-transform duration-300 ease-out transform hover:-translate-y-2 hover:shadow-lg border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Report Distribution
                  </h3>
                  <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                    <FaDownload size={16} />
                  </button>
                </div>
                <div style={{ height: "300px" }}>
                  <Doughnut
                    data={reportDistributionData}
                    options={{
                      ...chartOptions,
                      plugins: {
                        legend: {
                          position: "bottom" as const,
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
              <div className="bg-white rounded-2xl p-6 shadow-sm transition-transform duration-300 ease-out transform hover:-translate-y-2 hover:shadow-lg border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Recent Admins
                  </h3>
                  <button
                    onClick={() => setActiveTab("admin-management")}
                    className="text-[#005524] hover:text-[#004015] text-sm font-medium"
                  >
                    View all
                  </button>
                </div>
                <div className="space-y-4">
                  {admins.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      No admins created yet.
                    </p>
                  ) : (
                    admins.slice(0, 3).map((admin) => (
                      <div
                        key={admin.id}
                        className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer group"
                        onClick={() => {
                          setSelectedAdmin(admin);
                        }}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-[#005524] to-[#f69f00] rounded-full flex items-center justify-center text-white font-semibold text-sm">
                            {admin.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {admin.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {admin.email}
                            </p>
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

              <div className="bg-white rounded-2xl p-6 shadow-sm transition-transform duration-300 ease-out transform hover:-translate-y-2 hover:shadow-lg border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Recent System Reports
                  </h3>
                  <button
                    onClick={() => setActiveTab("system-reports")}
                    className="text-[#005524] hover:text-[#004015] text-sm font-medium"
                  >
                    View all
                  </button>
                </div>
                <div className="space-y-4">
                  {reports.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      No reports available. Generate a report in the System
                      Reports tab.
                    </p>
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
                              report.type === "performance"
                                ? "bg-green-100"
                                : report.type === "usage"
                                ? "bg-blue-100"
                                : "bg-red-100"
                            }`}
                          >
                            <FaChartBar
                              size={12}
                              className={
                                report.type === "performance"
                                  ? "text-green-600"
                                  : report.type === "usage"
                                  ? "text-blue-600"
                                  : "text-red-600"
                              }
                            />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {report.title}
                            </p>
                            <p className="text-sm text-gray-500">
                              {report.type.charAt(0).toUpperCase() +
                                report.type.slice(1)}{" "}
                              • {new Date(report.date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              report.status === "archived"
                                ? "bg-green-100 text-green-800"
                                : report.status === "reviewed"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {report.status.charAt(0).toUpperCase() +
                              report.status.slice(1)}
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

              <div className="bg-white rounded-2xl p-6 shadow-sm transition-transform duration-300 ease-out transform hover:-translate-y-2 hover:shadow-lg border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    System Status
                  </h3>
                  <button
                    onClick={() => setActiveTab("system-reports")}
                    className="text-[#005524] hover:text-[#004015] text-sm font-medium"
                  >
                    View Details
                  </button>
                </div>
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <FaKey size={12} className="text-blue-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          Security System
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-semibold text-red-600">
                          {systemStatus.security.unresolved}
                        </span>
                        <span className="text-xs text-gray-500">unresolved</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div // This progress bar is decorative. The number is the key metric.
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: "98%" }}
                      ></div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <FaUser size={12} className="text-green-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          User Management
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-semibold text-green-600">
                          {systemStatus.userManagement.activePercent}%
                        </span>
                        <span className="text-xs text-gray-500">active</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${systemStatus.userManagement.activePercent}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                          <FaBell size={12} className="text-purple-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          Alert System
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-semibold text-yellow-600">
                          {systemStatus.alerts.active}
                        </span>
                        <span className="text-xs text-gray-500">active</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div // This progress bar is decorative.
                        className="bg-purple-500 h-2 rounded-full"
                        style={{ width: "92%" }}
                      ></div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                          <FaChartBar size={12} className="text-orange-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          Database Performance
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-semibold text-green-600">
                          {systemStatus.dbPerformance.latency}ms
                        </span>
                        <span className="text-xs text-gray-500">latency</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div // This progress bar is decorative.
                        className="bg-orange-500 h-2 rounded-full"
                        style={{ width: "99%" }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case "admin-management":
        return (
          <div className="space-y-4">
            {/* Header with Stats */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Admin Management
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Manage admin accounts
                  </p>
                </div>
                <button
                  onClick={() => setShowAddAdmin(true)}
                  className="px-4 py-2 bg-[#005524] text-white rounded-lg hover:bg-[#004d20] transition-colors flex items-center gap-2"
                >
                  <FaPlus size={14} /> Add New Admin
                </button>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Total Admins
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {admins.length}
                      </p>
                    </div>
                    <FaUser className="text-gray-400" size={20} />
                  </div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Active
                      </p>
                      <p className="text-2xl font-bold text-green-600">
                        {admins.filter((a) => a.status === "active").length}
                      </p>
                    </div>
                    <FaShieldAlt className="text-green-400" size={20} />
                  </div>
                </div>
                <div className="bg-red-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Inactive
                      </p>
                      <p className="text-2xl font-bold text-red-600">
                        {admins.filter((a) => a.status === "inactive").length}
                      </p>
                    </div>
                    <FaLock className="text-red-400" size={20} />
                  </div>
                </div>
              </div>
            </div>

            {/* Admin Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Admin
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Last Login
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {admins.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center">
                            <FaUser className="text-gray-300 mb-4" size={48} />
                            <p className="text-sm text-gray-500 mb-2">
                              No admins created yet
                            </p>
                            <p className="text-xs text-gray-400">
                              Use the "Add New Admin" button to create one
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      admins.map((admin) => (
                        <tr
                          key={admin.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-[#005524] rounded-full flex items-center justify-center text-white font-semibold text-sm mr-3">
                                {admin.name.charAt(0)}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {admin.name}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {admin.email}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                admin.status === "active"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              <div
                                className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                                  admin.status === "active"
                                    ? "bg-green-400"
                                    : "bg-red-400"
                                }`}
                              ></div>
                              {admin.status.charAt(0).toUpperCase() +
                                admin.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {admin.lastLogin}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <button
                              onClick={() => handleToggleAdminStatus(admin.id)}
                              className={`px-3 py-1.5 rounded-lg transition-colors text-xs font-medium ${
                                admin.status === "active"
                                  ? "bg-red-100 text-red-800 hover:bg-red-200"
                                  : "bg-green-100 text-green-800 hover:bg-green-200"
                              }`}
                            >
                              <FaLock size={10} className="inline mr-1" />
                              {admin.status === "active"
                                ? "Deactivate"
                                : "Activate"}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      case "feature-updates":
        return (
          <div className="space-y-4">
            {/* Header with Stats */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Feature Updates
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Manage and approve feature updates
                  </p>
                </div>
                <button
                  onClick={() => setShowFeatureUpdateModal(true)}
                  className="px-4 py-2 bg-[#005524] text-white rounded-lg hover:bg-[#004d20] transition-colors flex items-center gap-2"
                >
                  <FaPlus size={14} /> Add New Update
                </button>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-yellow-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Pending
                      </p>
                      <p className="text-2xl font-bold text-yellow-600">
                        {
                          featureUpdates.filter((fu) => fu.status === "pending")
                            .length
                        }
                      </p>
                    </div>
                    <FaCog className="text-yellow-400" size={20} />
                  </div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Approved
                      </p>
                      <p className="text-2xl font-bold text-green-600">
                        {
                          featureUpdates.filter(
                            (fu) => fu.status === "approved"
                          ).length
                        }
                      </p>
                    </div>
                    <FaShieldAlt className="text-green-400" size={20} />
                  </div>
                </div>
                <div className="bg-red-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Rejected
                      </p>
                      <p className="text-2xl font-bold text-red-600">
                        {
                          featureUpdates.filter(
                            (fu) => fu.status === "rejected"
                          ).length
                        }
                      </p>
                    </div>
                    <FaLock className="text-red-400" size={20} />
                  </div>
                </div>
              </div>
            </div>

            {/* Feature Updates Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Feature
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {featureUpdates.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center">
                            <FaCog className="text-gray-300 mb-4" size={48} />
                            <p className="text-sm text-gray-500 mb-2">
                              No feature updates available
                            </p>
                            <p className="text-xs text-gray-400">
                              Use the "Add New Update" button to create one
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      featureUpdates.map((update) => (
                        <tr
                          key={update.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-semibold text-sm mr-3">
                                <FaCubes size={16} />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {update.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  ID: #{update.id}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-gray-800 max-w-xs truncate">
                              {update.description}
                            </p>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                update.status === "approved"
                                  ? "bg-green-100 text-green-800"
                                  : update.status === "rejected"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              <div
                                className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                                  update.status === "approved"
                                    ? "bg-green-400"
                                    : update.status === "rejected"
                                    ? "bg-red-400"
                                    : "bg-yellow-400"
                                }`}
                              ></div>
                              {update.status.charAt(0).toUpperCase() +
                                update.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(update.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {update.status === "pending" ? (
                              <div className="flex space-x-2">
                                <button
                                  onClick={() =>
                                    handleFeatureUpdate(update.id, "approved")
                                  }
                                  className="px-3 py-1.5 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors text-xs font-medium flex items-center"
                                >
                                  <FaShieldAlt size={10} className="mr-1" />
                                  Approve
                                </button>
                                <button
                                  onClick={() =>
                                    handleFeatureUpdate(update.id, "rejected")
                                  }
                                  className="px-3 py-1.5 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition-colors text-xs font-medium flex items-center"
                                >
                                  <FaLock size={10} className="mr-1" />
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">
                                {update.status === "approved"
                                  ? "Approved"
                                  : "Rejected"}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      case "system-reports":
        return (
          <div className="space-y-4">
            {/* Header with Stats */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    System Reports
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Generate and manage system reports
                  </p>
                </div>
                <button
                  onClick={() => setShowGenerateReportModal(true)}
                  className="px-4 py-2 bg-[#005524] text-white rounded-lg hover:bg-[#004d20] transition-colors flex items-center gap-2"
                >
                  <FaPlus size={14} /> Generate Report
                </button>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Total Reports
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {reports.length}
                      </p>
                    </div>
                    <FaFileAlt className="text-gray-400" size={20} />
                  </div>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Generated
                      </p>
                      <p className="text-2xl font-bold text-yellow-600">
                        {reports.filter((r) => r.status === "generated").length}
                      </p>
                    </div>
                    <FaChartBar className="text-yellow-400" size={20} />
                  </div>
                </div>
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Reviewed
                      </p>
                      <p className="text-2xl font-bold text-blue-600">
                        {reports.filter((r) => r.status === "reviewed").length}
                      </p>
                    </div>
                    <FaEye className="text-blue-400" size={20} />
                  </div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Archived
                      </p>
                      <p className="text-2xl font-bold text-green-600">
                        {reports.filter((r) => r.status === "archived").length}
                      </p>
                    </div>
                    <FaShieldAlt className="text-green-400" size={20} />
                  </div>
                </div>
              </div>
            </div>

            {/* Reports Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Report
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reports.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center">
                            <FaFileAlt
                              className="text-gray-300 mb-4"
                              size={48}
                            />
                            <p className="text-sm text-gray-500 mb-2">
                              No reports available
                            </p>
                            <p className="text-xs text-gray-400">
                              Use the "Generate Report" button to create one
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      reports.map((report) => (
                        <tr
                          key={report.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div
                                className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold text-sm mr-3 ${
                                  report.type === "performance"
                                    ? "bg-gradient-to-br from-green-500 to-green-600"
                                    : report.type === "usage"
                                    ? "bg-gradient-to-br from-blue-500 to-blue-600"
                                    : "bg-gradient-to-br from-red-500 to-red-600"
                                }`}
                              >
                                <FaChartBar size={16} />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {report.title}
                                </p>
                                <p className="text-xs text-gray-500">
                                  ID: #{report.id}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                report.type === "performance"
                                  ? "bg-green-100 text-green-800"
                                  : report.type === "usage"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {report.type.charAt(0).toUpperCase() +
                                report.type.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                report.status === "archived"
                                  ? "bg-green-100 text-green-800"
                                  : report.status === "reviewed"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              <div
                                className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                                  report.status === "archived"
                                    ? "bg-green-400"
                                    : report.status === "reviewed"
                                    ? "bg-blue-400"
                                    : "bg-yellow-400"
                                }`}
                              ></div>
                              {report.status.charAt(0).toUpperCase() +
                                report.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(report.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => {
                                  setShowReportDetails(true);
                                  setSelectedReport(report);
                                }}
                                className="px-3 py-1.5 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors text-xs font-medium flex items-center"
                              >
                                <FaEye size={10} className="mr-1" />
                                Details
                              </button>
                              {report.status === "generated" && (
                                <>
                                  <button
                                    onClick={() =>
                                      handleReportAction(report.id, "review")
                                    }
                                    className={`px-3 py-1.5 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors text-xs font-medium flex items-center ${
                                      isSubmittingReportAction
                                        ? "opacity-50 cursor-not-allowed"
                                        : ""
                                    }`}
                                    disabled={isSubmittingReportAction}
                                  >
                                    <FaChartBar size={10} className="mr-1" />
                                    Review
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleReportAction(report.id, "archive")
                                    }
                                    className={`px-3 py-1.5 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors text-xs font-medium flex items-center ${
                                      isSubmittingReportAction
                                        ? "opacity-50 cursor-not-allowed"
                                        : ""
                                    }`}
                                    disabled={isSubmittingReportAction}
                                  >
                                    <FaShieldAlt size={10} className="mr-1" />
                                    Archive
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      case "settings":
        return (
          <div className="space-y-4">
            {/* Profile Header */}
            <div className="bg-white rounded-2xl p-6 shadow-sm transition-transform duration-300 ease-out transform hover:-translate-y-2 hover:shadow-lg border border-gray-100">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 bg-[#005524] rounded-full flex items-center justify-center text-white font-bold text-xl">
                  {userProfile?.name?.charAt(0) || "S"}
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {userProfile?.name || "Super Admin"}
                  </h2>
                  <p className="text-sm text-gray-600">{userProfile?.email}</p>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-1">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1.5"></div>
                    Super Administrator
                  </span>
                </div>
              </div>
            </div>

            {/* Personal Information */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Personal Information
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Update your personal details
                  </p>
                </div>
                <button
                  onClick={() => setIsEditingPersonal(!isEditingPersonal)}
                  className="px-4 py-2 text-sm font-medium text-[#005524] hover:text-[#004d20] hover:bg-green-50 rounded-lg transition-colors"
                >
                  {isEditingPersonal ? "Cancel" : "Edit Profile"}
                </button>
              </div>
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={personalInfo.name}
                      onChange={(e) =>
                        setPersonalInfo({
                          ...personalInfo,
                          name: e.target.value,
                        })
                      }
                      disabled={!isEditingPersonal}
                      className={`w-full rounded-lg border-gray-300 shadow-sm text-sm p-3 transition-colors ${
                        !isEditingPersonal
                          ? "bg-gray-50 text-gray-500 cursor-not-allowed"
                          : "bg-white border-gray-300 focus:border-[#005524] focus:ring-1 focus:ring-[#005524]"
                      }`}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={personalInfo.email}
                      onChange={(e) =>
                        setPersonalInfo({
                          ...personalInfo,
                          email: e.target.value,
                        })
                      }
                      disabled={!isEditingPersonal}
                      className={`w-full rounded-lg border-gray-300 shadow-sm text-sm p-3 transition-colors ${
                        !isEditingPersonal
                          ? "bg-gray-50 text-gray-500 cursor-not-allowed"
                          : "bg-white border-gray-300 focus:border-[#005524] focus:ring-1 focus:ring-[#005524]"
                      }`}
                    />
                  </div>
                </div>
                {isEditingPersonal && (
                  <div className="flex justify-end pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={handlePersonalInfoUpdate}
                      className="px-6 py-2 bg-[#005524] text-white rounded-lg hover:bg-[#004d20] transition-colors font-medium"
                    >
                      Save Changes
                    </button>
                  </div>
                )}
              </form>
            </div>

            {/* Security Settings */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Security Settings
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Manage your account security
                  </p>
                </div>
                <button
                  onClick={() => setIsEditingSecurity(!isEditingSecurity)}
                  className="px-4 py-2 text-sm font-medium text-[#005524] hover:text-[#004d20] hover:bg-red-50 rounded-lg transition-colors"
                >
                  {isEditingSecurity ? "Cancel" : "Change Password"}
                </button>
              </div>
              <form className="space-y-6">
                {isEditingSecurity ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label
                          htmlFor="currentPassword"
                          className="block text-sm font-medium text-gray-700 mb-2"
                        >
                          Current Password
                        </label>
                        <input
                          type="password"
                          id="currentPassword"
                          value={securityInfo.currentPassword}
                          onChange={(e) =>
                            setSecurityInfo({
                              ...securityInfo,
                              currentPassword: e.target.value,
                            })
                          }
                          className="w-full rounded-lg border-gray-300 shadow-sm text-sm p-3 focus:border-[#005524] focus:ring-1 focus:ring-[#005524]"
                          placeholder="Enter current password"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="newPassword"
                          className="block text-sm font-medium text-gray-700 mb-2"
                        >
                          New Password
                        </label>
                        <input
                          type="password"
                          id="newPassword"
                          value={securityInfo.newPassword}
                          onChange={(e) =>
                            setSecurityInfo({
                              ...securityInfo,
                              newPassword: e.target.value,
                            })
                          }
                          className="w-full rounded-lg border-gray-300 shadow-sm text-sm p-3 focus:border-[#005524] focus:ring-1 focus:ring-[#005524]"
                          placeholder="Enter new password"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="confirmPassword"
                          className="block text-sm font-medium text-gray-700 mb-2"
                        >
                          Confirm Password
                        </label>
                        <input
                          type="password"
                          id="confirmPassword"
                          value={securityInfo.confirmPassword}
                          onChange={(e) =>
                            setSecurityInfo({
                              ...securityInfo,
                              confirmPassword: e.target.value,
                            })
                          }
                          className="w-full rounded-lg border-gray-300 shadow-sm text-sm p-3 focus:border-[#005524] focus:ring-1 focus:ring-[#005524]"
                          placeholder="Confirm new password"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end pt-4 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={handlePasswordUpdate}
                        className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                      >
                        Update Password
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">
                          Password
                        </h4>
                        <p className="text-sm text-gray-600">
                          Last updated: Never
                        </p>
                      </div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    </div>
                  </div>
                )}
              </form>
            </div>

            {/* Notification Settings */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                Notification Preferences
              </h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FaBell className="text-blue-600" size={16} />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">
                        Push Notifications
                      </h4>
                      <p className="text-sm text-gray-600">
                        Receive real-time notifications
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setNotifications(!notifications)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                      notifications ? "bg-[#005524]" : "bg-gray-200"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                        notifications ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <FaUser className="text-green-600" size={16} />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">
                        Email Notifications
                      </h4>
                      <p className="text-sm text-gray-600">
                        Receive updates via email
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setEmailNotifications(!emailNotifications)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                      emailNotifications ? "bg-[#005524]" : "bg-gray-200"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                        emailNotifications ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* System Information */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                System Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">
                      Role
                    </span>
                    <span className="text-sm text-gray-900">
                      Super Administrator
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">
                      Account Status
                    </span>
                    <span className="text-sm text-green-600 font-medium">
                      Active
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">
                      Last Login
                    </span>
                    <span className="text-sm text-gray-900">Just now</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">
                      Session Timeout
                    </span>
                    <span className="text-sm text-gray-900">24 hours</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">
                      Two-Factor Auth
                    </span>
                    <span className="text-sm text-gray-900">Disabled</span>
                  </div>
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
  <div className="flex h-screen bg-[#f8eed4]">
      <div
        className={`flex-shrink-0 transition-all duration-300 transform-gpu ${
          isSidebarCollapsed ? "w-16" : "w-64"
        } mx-4 my-4 p-2 rounded-2xl backdrop-blur-sm bg-white/75 border border-white/10 shadow-xl hover:-translate-y-1 hover:shadow-2xl`}
      >
        <div className="flex items-center justify-between p-4">
          {!isSidebarCollapsed && (
            <img src={logoImage} alt="Logo" className="h-8" />
          )}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-2 text-gray-600 hover:text-[#005524] hover:bg-gray-50 rounded-full"
          >
            {isSidebarCollapsed ? (
              <FaChevronRight size={16} />
            ) : (
              <FaChevronLeft size={16} />
            )}
          </button>
        </div>
        <nav className="mt-4">
          <ul className="space-y-2">
            <li>
              <button
                onClick={() => setActiveTab("dashboard")}
                className={`relative overflow-hidden flex items-center w-full p-3 text-sm font-medium rounded-lg transition transform ${
                  activeTab === "dashboard"
                    ? "bg-[#005524] text-white scale-100 shadow-inner"
                    : "text-gray-700 hover:bg-white/10 hover:text-[#005524] hover:scale-102"
                }`}
                onMouseDown={(e) => (e.currentTarget.style.transform = 'translateY(1px)')}
                onMouseUp={(e) => (e.currentTarget.style.transform = '')}
              >
                <span className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/0 to-black/2 opacity-0 transition-opacity"></span>
                <FaHome
                  size={16}
                  className={isSidebarCollapsed ? "" : "mr-3"}
                />
                {!isSidebarCollapsed && "Dashboard"}
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab("admin-management")}
                className={`relative overflow-hidden flex items-center w-full p-3 text-sm font-medium rounded-lg transition transform ${
                  activeTab === "admin-management"
                    ? "bg-[#005524] text-white scale-100 shadow-inner"
                    : "text-gray-700 hover:bg-white/10 hover:text-[#005524] hover:scale-102"
                }`}
                onMouseDown={(e) => (e.currentTarget.style.transform = 'translateY(1px)')}
                onMouseUp={(e) => (e.currentTarget.style.transform = '')}
              >
                <FaTable
                  size={16}
                  className={isSidebarCollapsed ? "" : "mr-3"}
                />
                {!isSidebarCollapsed && "Admin Management"}
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab("feature-updates")}
                className={`relative overflow-hidden flex items-center w-full p-3 text-sm font-medium rounded-lg transition transform ${
                  activeTab === "feature-updates"
                    ? "bg-[#005524] text-white scale-100 shadow-inner"
                    : "text-gray-700 hover:bg-white/10 hover:text-[#005524] hover:scale-102"
                }`}
                onMouseDown={(e) => (e.currentTarget.style.transform = 'translateY(1px)')}
                onMouseUp={(e) => (e.currentTarget.style.transform = '')}
              >
                <FaCubes
                  size={16}
                  className={isSidebarCollapsed ? "" : "mr-3"}
                />
                {!isSidebarCollapsed && "Feature Updates"}
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab("system-reports")}
                className={`relative overflow-hidden flex items-center w-full p-3 text-sm font-medium rounded-lg transition transform ${
                  activeTab === "system-reports"
                    ? "bg-[#005524] text-white scale-100 shadow-inner"
                    : "text-gray-700 hover:bg-white/10 hover:text-[#005524] hover:scale-102"
                }`}
                onMouseDown={(e) => (e.currentTarget.style.transform = 'translateY(1px)')}
                onMouseUp={(e) => (e.currentTarget.style.transform = '')}
              >
                <FaFileAlt
                  size={16}
                  className={isSidebarCollapsed ? "" : "mr-3"}
                />
                {!isSidebarCollapsed && "System Reports"}
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab("settings")}
                className={`relative overflow-hidden flex items-center w-full p-3 text-sm font-medium rounded-lg transition transform ${
                  activeTab === "settings"
                    ? "bg-[#005524] text-white scale-100 shadow-inner"
                    : "text-gray-700 hover:bg-white/10 hover:text-[#005524] hover:scale-102"
                }`}
                onMouseDown={(e) => (e.currentTarget.style.transform = 'translateY(1px)')}
                onMouseUp={(e) => (e.currentTarget.style.transform = '')}
              >
                <FaCog size={16} className={isSidebarCollapsed ? "" : "mr-3"} />
                {!isSidebarCollapsed && "Settings"}
              </button>
            </li>
          </ul>
        </nav>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="mx-1 my-6 p-4 rounded-2xl bg-white/80 backdrop-blur-sm border border-white/10 shadow-lg flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 text-gray-700 hover:text-green-700 hover:bg-gray-100 rounded-lg lg:hidden transition-colors"
            >
              <FaChevronRight size={16} />
            </button>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Dashboard</span>
                <FaChevronRight size={12} />
                <span className="text-gray-900 font-medium">
                  {activeTab === "admin-management" && "Admin Management"}
                  {activeTab === "feature-updates" && "Feature Updates"}
                  {activeTab === "system-reports" && "System Reports"}
                  {activeTab === "settings" && "Settings"}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-gray-700 hover:text-green-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FaBell size={16} />
              {notificationsList.some((notification) => !notification.read) && (
                <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
              )}
            </button>
            <div className="relative">
              <button
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="flex items-center space-x-2 text-gray-700 hover:text-green-700 rounded-lg px-2 py-1 transition-colors"
              >
                <FaUserCircle size={22} />
                <span className="hidden md:inline text-sm font-medium text-gray-800">{userProfile?.name || 'Super Admin'}</span>
                <FaChevronDown size={12} />
              </button>
              {isProfileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-2 z-50">
                  <button
                    onClick={() => setActiveTab("settings")}
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
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Notifications
            </h3>
            {notificationsList.length === 0 ? (
              <p className="text-sm text-gray-500">No new notifications</p>
            ) : (
              notificationsList.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg ${
                    notification.read ? "bg-gray-50" : "bg-white"
                  }`}
                  onClick={() => markNotificationAsRead(notification.id)}
                >
                  <div className="flex items-center space-x-2">
                    {!notification.read && (
                      <span className="h-2 w-2 bg-red-500 rounded-full"></span>
                    )}
                    <div>
                      <p
                        className={`text-sm ${
                          notification.read
                            ? "text-gray-600"
                            : "text-gray-800 font-medium"
                        }`}
                      >
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500">
                        {notification.time}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        <div className="flex-1 p-6 overflow-y-auto">
          {error && (
            <div className="mb-4 p-4 bg-red-100 text-red-800 rounded-lg flex justify-between items-center">
              <span>{error}</span>
              <button
                onClick={() => setError(null)}
                className="text-red-600 hover:text-red-800"
              >
                ✕
              </button>
            </div>
          )}
          {successMessage && (
            <div className="mb-4 p-4 bg-green-100 text-green-800 rounded-lg flex justify-between items-center">
              <span>{successMessage}</span>
              <button
                onClick={() => setSuccessMessage(null)}
                className="text-green-600 hover:text-green-800"
              >
                ✕
              </button>
            </div>
          )}
          {renderContent()}
        </div>
      </div>

      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirm Logout
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to log out?
            </p>
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
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Add New Admin
            </h3>
            <form onSubmit={handleAddAdmin} className="space-y-4">
              <div>
                <label
                  htmlFor="adminName"
                  className="block text-sm font-medium text-gray-700"
                >
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
                <label
                  htmlFor="adminEmail"
                  className="block text-sm font-medium text-gray-700"
                >
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
                <label
                  htmlFor="adminPassword"
                  className="block text-sm font-medium text-gray-700"
                >
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
                  className={`px-4 py-2 bg-[#005524] text-white rounded-lg hover:bg-[#004d20] ${
                    isSubmittingAdmin ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {isSubmittingAdmin ? "Adding..." : "Add Admin"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showFeatureUpdateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Add Feature Update
            </h3>
            <form onSubmit={handleAddFeatureUpdate} className="space-y-4">
              <div>
                <label
                  htmlFor="updateName"
                  className="block text-sm font-medium text-gray-700"
                >
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
                <label
                  htmlFor="updateDesc"
                  className="block text-sm font-medium text-gray-700"
                >
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
                  className={`px-4 py-2 bg-[#005524] text-white rounded-lg hover:bg-[#004d20] ${
                    isSubmittingFeature ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {isSubmittingFeature ? "Adding..." : "Add Update"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showGenerateReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Generate Report
            </h3>
            <form onSubmit={handleGenerateReport} className="space-y-4">
              <div>
                <label
                  htmlFor="reportTitle"
                  className="block text-sm font-medium text-gray-700"
                >
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
                <label
                  htmlFor="reportType"
                  className="block text-sm font-medium text-gray-700"
                >
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
                  className={`px-4 py-2 bg-[#005524] text-white rounded-lg hover:bg-[#004d20] ${
                    isSubmittingReport ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {isSubmittingReport ? "Generating..." : "Generate Report"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showReportDetails && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {selectedReport.title}
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Type</p>
                <p className="text-sm text-gray-900">
                  {selectedReport.type.charAt(0).toUpperCase() +
                    selectedReport.type.slice(1)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Status</p>
                <p className="text-sm text-gray-900">
                  {selectedReport.status.charAt(0).toUpperCase() +
                    selectedReport.status.slice(1)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Date</p>
                <p className="text-sm text-gray-900">
                  {new Date(selectedReport.date).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Metrics</p>
                <ul className="text-sm text-gray-900 space-y-1">
                  {selectedReport.metrics.uptime && (
                    <li>Uptime: {selectedReport.metrics.uptime}%</li>
                  )}
                  {selectedReport.metrics.activeUsers && (
                    <li>Active Users: {selectedReport.metrics.activeUsers}</li>
                  )}
                  {selectedReport.metrics.responseTime && (
                    <li>
                      Response Time: {selectedReport.metrics.responseTime}ms
                    </li>
                  )}
                  {selectedReport.metrics.securityIncidents && (
                    <li>
                      Security Incidents:{" "}
                      {selectedReport.metrics.securityIncidents}
                    </li>
                  )}
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
                onClick={() => handleReportAction(selectedReport.id, "review")}
                className={`px-4 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 ${
                  isSubmittingReportAction
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
                disabled={isSubmittingReportAction}
              >
                Review
              </button>
              <button
                onClick={() => handleReportAction(selectedReport.id, "archive")}
                className={`px-4 py-2 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 ${
                  isSubmittingReportAction
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
                disabled={isSubmittingReportAction}
              >
                Archive
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminDashboard;