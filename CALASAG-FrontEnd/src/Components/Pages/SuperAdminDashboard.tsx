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

interface IotDevice {
  id: string;
  device_id: string;
  user_id: string | null;
  is_activated: boolean;
  created_at: string;
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
  const [showChangeFeatureStatusModal, setShowChangeFeatureStatusModal] =
    useState<boolean>(false);
  const [selectedFeatureUpdateForStatusChange, setSelectedFeatureUpdateForStatusChange] =
    useState<FeatureUpdate | null>(null);
  const [notificationTab, setNotificationTab] = useState<"unread" | "all">(
    "unread"
  );
  const [showArchivedReports, setShowArchivedReports] = useState<boolean>(false);
  const [iotDevices, setIotDevices] = useState<IotDevice[]>([]);
  const [newDeviceId, setNewDeviceId] = useState<string>("");
  const [isSubmittingReportAction, setIsSubmittingReportAction] =
    useState<boolean>(false);
  const [isAddingDevice, setIsAddingDevice] = useState<boolean>(false);
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
        borderColor: "#4ECDC4",
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
        backgroundColor: ["#4ECDC4", "#f9a01b"],
      },
    ],
  });

  const [reportDistributionData, setReportDistributionData] = useState({
    labels: ["Performance", "Usage", "Security"],
    datasets: [
      {
        data: [0, 0, 0],
        backgroundColor: ["#4ECDC4", "#f9a01b", "#ff4d4f"],
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
    let timer: NodeJS.Timeout;
    if (successMessage || error) {
      timer = setTimeout(() => {
        setSuccessMessage(null);
        setError(null);
      }, 5000);
    }
    return () => clearTimeout(timer);
  }, [successMessage, error]);

  useEffect(() => {
    const updatePresence = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("users")
          .update({ last_seen: new Date().toISOString() })
          .eq("user_id", user.id);
      }
    };

    updatePresence(); // initial update
    const interval = setInterval(updatePresence, 60 * 1000); // every 1 minute

    return () => clearInterval(interval);
  }, []);

  const usersById = React.useMemo(() => {
    const map = new Map<string, Admin>();
    admins.forEach(admin => map.set(admin.user_id, admin));
    return map;
  }, [admins]);

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
            backgroundColor: ["#4ECDC4", "#E63946"],
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
              backgroundColor: ["#4ECDC4", "#E63946", "#FFD166"],
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
            borderColor: "#4ECDC4",
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

  const handleUnarchiveReport = async (reportId: number) => {
    setIsSubmittingReportAction(true);
    try {
      const { error } = await supabase
        .from("system_reports")
        .update({ status: "reviewed", updated_at: new Date().toISOString() })
        .eq("id", reportId);
      if (error) throw error;

      setReports((prev) =>
        prev.map((report) =>
          report.id === reportId
            ? { ...report, status: "reviewed" }
            : report
        )
      );
      setSuccessMessage("Report has been unarchived.");
    } catch (error: any) {
      setError(`Failed to unarchive report: ${error.message}`);
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

  const markAllNotificationsAsRead = async () => {
    if (!userProfile) return;
    const unreadIds = notificationsList
      .filter(n => !n.read)
      .map(n => n.id);

    if (unreadIds.length === 0) return;

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .in('id', unreadIds)
      .eq('user_id', userProfile.id);

    if (error) {
      setError(`Error marking notifications as read: ${error.message}`);
    } else {
      fetchNotifications();
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

  // Fetch IoT devices
  const fetchIotDevices = async () => {
    try {
      const { data, error } = await supabase
        .from("iot_devices")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setIotDevices(data || []);
    } catch (error: any) {
      setError(`Failed to fetch IoT devices: ${error.message}`);
    }
  };

  // Handle add IoT device
  const handleAddDevice = async (e: React.FormEvent<HTMLFormElement>) => {
    setIsAddingDevice(true);
    e.preventDefault();
    if (!newDeviceId.trim()) {
      setError("Device ID cannot be empty.");
      return;
    }
    try {
      const { error } = await supabase
        .from("iot_devices")
        .insert({ device_id: newDeviceId.trim() });

      if (error) throw error;

      setSuccessMessage(`Device "${newDeviceId}" registered successfully.`);
      setNewDeviceId("");
      await fetchIotDevices(); // Refresh the list
    } catch (error: any) {
      setError(`Failed to register device: ${error.message}`);
    } finally {
      setIsAddingDevice(false);
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
    fetchIotDevices();
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

    const iotDevicesSubscription = supabase
      .channel(`iot_devices_${Date.now()}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "iot_devices" },
        () => {
          fetchIotDevices();
        }
      )
      .subscribe((_status, err) => {
        if (err) {
          console.error("IoT Devices subscription error:", err);
          setError(`IoT Devices subscription error: ${err.message}`);
        }
      });

    return () => {
      supabase.removeChannel(featureSubscription);
      supabase.removeChannel(reportSubscription);
      supabase.removeChannel(userSubscription);
      supabase.removeChannel(notificationSubscription);
      supabase.removeChannel(iotDevicesSubscription);
      supabase.removeChannel(iotDevicesSubscription);
    };
  }, [userProfile?.id]);

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <div className="space-y-4">
            {/* Top Metric Cards */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="group bg-white rounded-2xl p-6 shadow-sm transition-transform duration-300 ease-out transform hover:-translate-y-2 hover:shadow-lg border border-gray-100 hover:border-[#4ECDC4]">
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
                  <div className="w-12 h-12 bg-[#4ECDC4] rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <FaUser size={20} />
                  </div>
                </div>
              </div>
              <div className="group bg-white rounded-2xl p-6 shadow-sm transition-transform duration-300 ease-out transform hover:-translate-y-2 hover:shadow-lg border border-gray-100 hover:border-[#4ECDC4]">
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
                    <p className="text-sm text-[#2B2B2B]-600 mt-1">
                      {
                        featureUpdates.filter((fu) => fu.status === "approved")
                          .length
                      }{" "}
                      approved
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-[#2B2B2B] to-[#2B2B2B] rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
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
                    <p className="text-sm text-[#E63946]-600 mt-1">
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
                    className="text-[#4ECDC4] hover:text-[#004015] text-sm font-medium"
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
                          <div className="w-10 h-10 bg-[#2B2B2B] rounded-full flex items-center justify-center text-white font-semibold text-sm">
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
                          <button className="p-1 text-gray-400 hover:text-[#4ECDC4] opacity-0 group-hover:opacity-100 transition-all duration-300">
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
                    className="text-[#4ECDC4] hover:text-[#2B2B2B] text-sm font-medium"
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
                            className={`w-8 h-8 rounded-full flex items-center justify-center ${report.type === "performance"
                              ? "bg-[#4ECDC4]-100"
                              : report.type === "usage"
                                ? "bg-[#FFD166]-100"
                                : "bg-[#E63946]-100"
                              }`}
                          >
                            <FaChartBar
                              size={12}
                              className={
                                report.type === "performance"
                                  ? "bg-[#4ECDC4]-600"
                                  : report.type === "usage"
                                    ? "bg-[#FFD166]-600"
                                    : "bg-[#E63946]-600"
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
                            className={`text-xs px-2 py-1 rounded-full ${report.status === "archived"
                              ? "bg-[#4ECDC4]-100 text-[#4ECDC4]-800"
                              : report.status === "reviewed"
                                ? "bg-[#2B2B2B]-100 text-[#2B2B2B]-800"
                                : "bg-[#FFD166]-100 text-[#FFD166]-800"
                              }`}
                          >
                            {report.status.charAt(0).toUpperCase() +
                              report.status.slice(1)}
                          </span>
                          <button className="p-1 text-gray-400 hover:text-[#4ECDC4] opacity-0 group-hover:opacity-100 transition-all duration-300">
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
                    className="text-[#4ECDC4] hover:text-[#004015] text-sm font-medium"
                  >
                    View Details
                  </button>
                </div>
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-[#2B2B2B]-100 rounded-lg flex items-center justify-center">
                          <FaKey size={12} className="text-[#2B2B2B]" />
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
                        className="bg-[#2B2B2B]-500 h-2 rounded-full"
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
                  className="px-4 py-2 bg-[#4ECDC4] text-white rounded-lg hover:bg-[#2B2B2B] transition-colors flex items-center gap-2"
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
                              <div className="w-10 h-10 bg-[#4ECDC4] rounded-full flex items-center justify-center text-white font-semibold text-sm mr-3">
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
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${admin.status === "active"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                                }`}
                            >
                              <div
                                className={`w-1.5 h-1.5 rounded-full mr-1.5 ${admin.status === "active"
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
                              className={`px-3 py-1.5 rounded-lg transition-colors text-xs font-medium ${admin.status === "active"
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
                  className="px-4 py-2 bg-[#4ECDC4] text-white rounded-lg hover:bg-[#004d20] transition-colors flex items-center gap-2"
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
                              <div className="w-10 h-10 bg-gradient-to-br from-[#2B2B2B]-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-semibold text-sm mr-3">
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
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${update.status === "approved"
                                ? "bg-green-100 text-green-800"
                                : update.status === "rejected"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-yellow-100 text-yellow-800"
                                }`}
                            >
                              <div
                                className={`w-1.5 h-1.5 rounded-full mr-1.5 ${update.status === "approved"
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
                              <button
                                onClick={() => {
                                  setSelectedFeatureUpdateForStatusChange(update);
                                  setShowChangeFeatureStatusModal(true);
                                }}
                                className="px-3 py-1.5 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors text-xs font-medium flex items-center"
                              >
                                <FaCog size={10} className="mr-1" />
                                Change Status
                              </button>
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
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setShowArchivedReports(!showArchivedReports)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                  >
                    {showArchivedReports ? "Hide Archived" : "Show Archived"}
                  </button>
                  <button
                    onClick={() => setShowGenerateReportModal(true)}
                    className="px-4 py-2 bg-[#4ECDC4] text-white rounded-lg hover:bg-[#2B2B2B] transition-colors flex items-center gap-2"
                  >
                    <FaPlus size={14} /> Generate Report
                  </button>
                </div>
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
                <div className="bg-[#2B2B2B]-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Reviewed
                      </p>
                      <p className="text-2xl font-bold text-[#2B2B2B]-600">
                        {reports.filter((r) => r.status === "reviewed").length}
                      </p>
                    </div>
                    <FaEye className="text-[#2B2B2B]-400" size={20} />
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
                      reports
                        .filter(
                          (report) => showArchivedReports || report.status !== "archived"
                        )
                        .map((report) => (
                        <tr
                          key={report.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div
                                className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold text-sm mr-3 ${report.type === "performance"
                                  ? "bg-gradient-to-br from-[#4ECDC4] to-[#4ECDC4]"
                                  : report.type === "usage"
                                    ? "bg-gradient-to-br from-[#2B2B2B] to-[#2B2B2B]"
                                    : "bg-gradient-to-br from-[#FFD166] to-[#FFD166]"
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
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${report.type === "performance"
                                ? "bg-[#4ECDC4]-100 text-[#4ECDC4]-800"
                                : report.type === "usage"
                                  ? "bg-[#2B2B2B]-100 text-[#2B2B2B]-800"
                                  : "bg-[#FFD166]-100 text-[#FFD166]-800"
                                }`}
                            >
                              {report.type.charAt(0).toUpperCase() +
                                report.type.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${report.status === "archived"
                                ? "bg-[#4ECDC4]-100 text-[#4ECDC4]-800"
                                : report.status === "reviewed"
                                  ? "bg-[#2B2B2B]-100 text-[#2B2B2B]-800"
                                  : "bg-[#FFD166]-100 text-[#FFD166]-800"
                                }`}
                            >
                              <div
                                className={`w-1.5 h-1.5 rounded-full mr-1.5 ${report.status === "archived"
                                  ? "bg-[#4ECDC4]"
                                  : report.status === "reviewed"
                                    ? "bg-[#2B2B2B]"
                                    : "bg-[#FFD166]"
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
                                    className={`px-3 py-1.5 bg-[#2B2B2B]-100 text-[#2B2B2B]-800 rounded-lg hover:bg-[#2B2B2B]-200 transition-colors text-xs font-medium flex items-center ${isSubmittingReportAction
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
                                    className={`px-3 py-1.5 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors text-xs font-medium flex items-center ${isSubmittingReportAction
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
                              {report.status === "archived" && (
                                <button
                                  onClick={() =>
                                    handleUnarchiveReport(report.id)
                                  }
                                  className={`px-3 py-1.5 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors text-xs font-medium flex items-center ${
                                    isSubmittingReportAction
                                      ? "opacity-50 cursor-not-allowed"
                                      : ""
                                  }`}
                                  disabled={isSubmittingReportAction}
                                >
                                  Unarchive
                                </button>
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
      case "iot-devices":
        return (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Register New IoT Device
              </h2>
              <p className="text-sm text-gray-600 mb-6">
                Enter the unique Device ID to register a new IoT device in the
                system.
              </p>
              <form onSubmit={handleAddDevice} className="flex items-center gap-4">
                <div className="flex-grow">
                  <label htmlFor="deviceId" className="sr-only">
                    Device ID
                  </label>
                  <input
                    type="text"
                    id="deviceId"
                    name="deviceId"
                    value={newDeviceId}
                    onChange={(e) => setNewDeviceId(e.target.value)}
                    placeholder="Enter new Device ID"
                    className="w-full rounded-lg border-gray-300 shadow-sm text-sm p-3 focus:border-[#4ECDC4] focus:ring-1 focus:ring-[#2B2B2B]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isAddingDevice}
                  className="px-6 py-3 bg-[#4ECDC4] text-white rounded-lg hover:bg-[#2B2B2B] transition-colors font-medium flex items-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isAddingDevice ? 'Registering...' : (
                    <><FaPlus size={14} /> Register Device</>
                  )}
                </button>
              </form>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Registered IoT Devices
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Device ID
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Registered At
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Assigned User
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {iotDevices.map((device) => (
                      <tr
                        key={device.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {device.device_id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${device.is_activated
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                              }`}
                          >
                            {device.is_activated ? "Activated" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(device.created_at).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {usersById.get(device.user_id)?.name || device.user_id || "Unassigned"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-[#4ECDC4]/70 overflow-hidden">
      {/* Sidebar */}
      <div
        className={`flex flex-col flex-shrink-0 transition-all duration-300 transform-gpu ${isSidebarCollapsed ? "w-16" : "w-64"
          } m-2 p-2 rounded-2xl backdrop-blur-sm bg-[#FAFAFA]/75 border border-white/10 shadow-xl hover:-translate-y-1 hover:shadow-2xl h-[calc(100vh-1rem)]`}
      >
        <div className="flex items-center justify-between p-3">
          {!isSidebarCollapsed && (
            <img src={logoImage} alt="Logo" className="h-7 w-auto object-contain transition-transform duration-300 hover:scale-110" />
          )}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-300 hover:scale-110 active:scale-95"
          >
            {isSidebarCollapsed ? (
              <FaChevronRight size={14} />
            ) : (
              <FaChevronLeft size={14} />
            )}
          </button>
        </div>
        <nav className="mt-4 flex-1">
          <ul className="space-y-2">
            <li>
              <button
                onClick={() => setActiveTab("dashboard")}
                className={`group relative flex items-center w-full text-left px-4 py-3 gap-3 rounded-r-full transition-all duration-300 text-sm font-medium transform hover:scale-[1.02] active:scale-[0.98] ${activeTab === "dashboard"
                  ? "bg-[#E7F6EE] text-[#2B2B2B] shadow-md shadow-[#4ECDC4]/20"
                  : "text-gray-700 hover:bg-[#F1FAF4] hover:text-[#2B2B2B] hover:shadow-sm"
                  }`}
              >
                <span className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-r-full transition-all duration-300 ${activeTab === "dashboard"
                  ? "bg-[#4ECDC4]"
                  : "bg-transparent group-hover:bg-[#4ECDC4]"
                  }`} />
                <div className="relative z-10 w-full">
                  <div className={`flex items-center gap-3 flex-1 ${isSidebarCollapsed ? 'justify-center' : ''}`}>
                    <FaHome size={18} className="transition-transform duration-300 group-hover:scale-110" />
                    {!isSidebarCollapsed && <span className="transition-all duration-300 group-hover:translate-x-1">Dashboard</span>}
                  </div>
                </div>
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab("admin-management")}
                className={`group relative flex items-center w-full text-left px-4 py-3 gap-3 rounded-r-full transition-all duration-300 text-sm font-medium transform hover:scale-[1.02] active:scale-[0.98] ${activeTab === "admin-management"
                  ? "bg-[#E7F6EE] text-[#2B2B2B] shadow-md shadow-[#4ECDC4]/20"
                  : "text-gray-700 hover:bg-[#F1FAF4] hover:text-[#2B2B2B] hover:shadow-sm"
                  }`}
              >
                <span className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-r-full transition-all duration-300 ${activeTab === "admin-management"
                  ? "bg-[#4ECDC4]"
                  : "bg-transparent group-hover:bg-[#4ECDC4]"
                  }`} />
                <div className="relative z-10 w-full">
                  <div className={`flex items-center gap-3 flex-1 ${isSidebarCollapsed ? 'justify-center' : ''}`}>
                    <FaTable size={18} className="transition-transform duration-300 group-hover:scale-110" />
                    {!isSidebarCollapsed && <span className="transition-all duration-300 group-hover:translate-x-1">Admin Management</span>}
                  </div>
                </div>
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab("feature-updates")}
                className={`group relative flex items-center w-full text-left px-4 py-3 gap-3 rounded-r-full transition-all duration-300 text-sm font-medium transform hover:scale-[1.02] active:scale-[0.98] ${activeTab === "feature-updates"
                  ? "bg-[#E7F6EE] text-[#2B2B2B] shadow-md shadow-[#4ECDC4]/20"
                  : "text-gray-700 hover:bg-[#F1FAF4] hover:text-[#2B2B2B] hover:shadow-sm"
                  }`}
              >
                <span className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-r-full transition-all duration-300 ${activeTab === "feature-updates"
                  ? "bg-[#4ECDC4]"
                  : "bg-transparent group-hover:bg-[#4ECDC4]"
                  }`} />
                <div className="relative z-10 w-full">
                  <div className={`flex items-center gap-3 flex-1 ${isSidebarCollapsed ? 'justify-center' : ''}`}>
                    <FaCubes size={18} className="transition-transform duration-300 group-hover:scale-110" />
                    {!isSidebarCollapsed && <span className="transition-all duration-300 group-hover:translate-x-1">Feature Updates</span>}
                  </div>
                </div>
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab("system-reports")}
                className={`group relative flex items-center w-full text-left px-4 py-3 gap-3 rounded-r-full transition-all duration-300 text-sm font-medium transform hover:scale-[1.02] active:scale-[0.98] ${activeTab === "system-reports"
                  ? "bg-[#E7F6EE] text-[#2B2B2B] shadow-md shadow-[#4ECDC4]/20"
                  : "text-gray-700 hover:bg-[#F1FAF4] hover:text-[#2B2B2B] hover:shadow-sm"
                  }`}
              >
                <span className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-r-full transition-all duration-300 ${activeTab === "system-reports"
                  ? "bg-[#4ECDC4]"
                  : "bg-transparent group-hover:bg-[#4ECDC4]"
                  }`} />
                <div className="relative z-10 w-full">
                  <div className={`flex items-center gap-3 flex-1 ${isSidebarCollapsed ? 'justify-center' : ''}`}>
                    <FaFileAlt size={18} className="transition-transform duration-300 group-hover:scale-110" />
                    {!isSidebarCollapsed && <span className="transition-all duration-300 group-hover:translate-x-1">System Reports</span>}
                  </div>
                </div>
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab("iot-devices")}
                className={`group relative flex items-center w-full text-left px-4 py-3 gap-3 rounded-r-full transition-all duration-300 text-sm font-medium transform hover:scale-[1.02] active:scale-[0.98] ${activeTab === "iot-devices"
                  ? "bg-[#E7F6EE] text-[#2B2B2B] shadow-md shadow-[#4ECDC4]/20"
                  : "text-gray-700 hover:bg-[#F1FAF4] hover:text-[#2B2B2B] hover:shadow-sm"
                  }`}
              >
                <span className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-r-full transition-all duration-300 ${activeTab === "iot-devices"
                  ? "bg-[#4ECDC4]"
                  : "bg-transparent group-hover:bg-[#4ECDC4]"
                  }`} />
                <div className="relative z-10 w-full">
                  <div className={`flex items-center gap-3 flex-1 ${isSidebarCollapsed ? 'justify-center' : ''}`}>
                    <FaCubes size={18} className="transition-transform duration-300 group-hover:scale-110" />
                    {!isSidebarCollapsed && <span className="transition-all duration-300 group-hover:translate-x-1">IoT Devices</span>}
                  </div>
                </div>
              </button>
            </li>
          </ul>
        </nav>

        {/* Logout Button - Sticky to Bottom */}
        <div className="mt-auto p-2 border-t border-gray-200/50">
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className={`group relative flex items-center w-full text-left px-4 py-3 gap-3 rounded-r-full transition-all duration-300 text-sm font-medium transform hover:scale-[1.02] active:scale-[0.98] text-red-600 hover:bg-red-50 hover:text-red-700 hover:shadow-sm ${isSidebarCollapsed ? 'justify-center' : ''}`}
          >
            <span className="absolute left-0 top-0 bottom-0 w-1.5 rounded-r-full transition-all duration-300 bg-transparent group-hover:bg-red-500" />
            <div className="relative z-10 w-full">
              <div className={`flex items-center gap-3 flex-1 ${isSidebarCollapsed ? 'justify-center' : ''}`}>
                <FaChevronLeft size={18} className="transition-transform duration-300 group-hover:scale-110" />
                {!isSidebarCollapsed && <span className="transition-all duration-300 group-hover:translate-x-1">Logout</span>}
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Top Navbar */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="m-2 p-3 rounded-2xl bg-[#FAFAFA]/80 backdrop-blur-sm border border-white/10 shadow-lg flex items-center justify-between hover:shadow-xl transition-all duration-300">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg lg:hidden transition-all duration-300 hover:scale-110 active:scale-95"
            >
              <FaChevronRight size={14} />
            </button>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="font-medium">Dashboard</span>
              <FaChevronRight size={10} className="text-gray-400" />
              <span className="text-gray-900 font-semibold">
                {activeTab === "dashboard" && "Overview"}
                {activeTab === "admin-management" && "Admin Management"}
                {activeTab === "feature-updates" && "Feature Updates"}
                {activeTab === "system-reports" && "System Reports"}
                {activeTab === "iot-devices" && "IoT Devices"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-gray-500 hover:text-green-700 hover:bg-gray-100 rounded-lg transition-all duration-300 hover:scale-110 active:scale-95"
            >
              <FaBell size={16} />
              {notificationsList.some((notification) => !notification.read) && (
                <span className="absolute top-0 right-0 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white/80 animate-pulse"></span>
              )}
            </button>
            {/* User Profile Display */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg">
              {userProfile && (
                <img
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                    userProfile?.name || "S"
                  )}&background=2B2B2B&color=fff`}
                  alt="avatar"
                  className="w-7 h-7 rounded-full border border-gray-200"
                />
              )}
              <span className="hidden md:inline text-gray-700 font-medium text-sm">
                {userProfile?.name || "Loading..."}
              </span>
            </div>
          </div>
        </div>

        {showNotifications && (
          <div className="absolute right-4 top-16 w-80 bg-white rounded-lg shadow-lg border border-gray-100 p-4 z-50">
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">
                  Notifications
                </h3>
                <button
                  onClick={markAllNotificationsAsRead}
                  className="text-sm text-[#2B2B2B] hover:text-[#2B2B2B]"
                >
                  Mark all as read
                </button>
              </div>
              <div className="flex border-b border-gray-200 mt-2">
                <button
                  onClick={() => setNotificationTab("unread")}
                  className={`flex-1 py-2 text-sm font-medium ${notificationTab === "unread"
                    ? "border-b-2 border-[#4ECDC4] text-[#2B2B2B]"
                    : "text-gray-500 hover:text-gray-700"
                    }`}
                >
                  Unread
                </button>
                <button
                  onClick={() => setNotificationTab("all")}
                  className={`flex-1 py-2 text-sm font-medium ${notificationTab === "all"
                    ? "border-b-2 border-[#4ECDC4] text-[#2B2B2B]"
                    : "text-gray-500 hover:text-gray-700"
                    }`}
                >
                  All
                </button>
              </div>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {(() => {
                const filteredNotifications =
                  notificationTab === "unread"
                    ? notificationsList.filter((n) => !n.read)
                    : notificationsList;

                if (filteredNotifications.length === 0) {
                  return (
                    <div className="px-4 py-3 text-center text-gray-500">
                      No {notificationTab} notifications
                    </div>
                  );
                }

                return filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors cursor-pointer ${notification.read ? "bg-gray-50" : "bg-white"
                      }`}
                    onClick={() => markNotificationAsRead(notification.id)}
                  >
                    <p
                      className={`text-sm ${notification.read
                        ? "text-gray-600"
                        : "text-gray-800 font-medium"
                        }`}
                    >
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                  </div>
                ));
              })()}
            </div>
          </div>
        )}

        <div className="flex-1 p-4 overflow-y-auto">
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
          <div className="max-w-7xl mx-auto h-full">{renderContent()}</div>
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
                className="px-4 py-2 bg-[#E63946] text-white rounded-lg hover:bg-[#D62839]"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddAdmin && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50">
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
                  className={`px-4 py-2 bg-[#4ECDC4] text-white rounded-lg hover:bg-[#2B2B2B] ${isSubmittingAdmin ? "opacity-50 cursor-not-allowed" : ""
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
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50">
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
                  className={`px-4 py-2 bg-[#4ECDC4] text-white rounded-lg hover:bg-[#2B2B2B] ${isSubmittingFeature ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                >
                  {isSubmittingFeature ? "Adding..." : "Add Update"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showChangeFeatureStatusModal && selectedFeatureUpdateForStatusChange && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Change Feature Status
            </h3>
            <p className="text-sm text-gray-600 mb-2">
              Feature:{" "}
              <span className="font-medium">
                {selectedFeatureUpdateForStatusChange.name}
              </span>
            </p>
            <p className="text-sm text-gray-600 mb-6">
              Current Status:{" "}
              <span className="font-medium">
                {selectedFeatureUpdateForStatusChange.status}
              </span>
            </p>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowChangeFeatureStatusModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              {selectedFeatureUpdateForStatusChange.status !== "approved" && (
                <button
                  onClick={() => {
                    handleFeatureUpdate(
                      selectedFeatureUpdateForStatusChange.id,
                      "approved"
                    );
                    setShowChangeFeatureStatusModal(false);
                  }}
                  className="px-4 py-2 bg-green-100 text-green-800 rounded-lg hover:bg-green-200"
                >
                  Change to Approved
                </button>
              )}
              {selectedFeatureUpdateForStatusChange.status !== "rejected" && (
                <button
                  onClick={() => {
                    handleFeatureUpdate(
                      selectedFeatureUpdateForStatusChange.id,
                      "rejected"
                    );
                    setShowChangeFeatureStatusModal(false);
                  }}
                  className="px-4 py-2 bg-red-100 text-red-800 rounded-lg hover:bg-red-200"
                >
                  Change to Rejected
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showGenerateReportModal && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50">
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
                  className={`px-4 py-2 bg-[#4ECDC4] text-white rounded-lg hover:bg-[#2B2B2B] ${isSubmittingReport ? "opacity-50 cursor-not-allowed" : ""
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
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50">
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
                className={`px-4 py-2 bg-[#2B2B2B]-100 text-[#2B2B2B]-800 rounded-lg hover:bg-[#2B2B2B]-200 ${isSubmittingReportAction
                  ? "opacity-50 cursor-not-allowed"
                  : ""
                  }`}
                disabled={isSubmittingReportAction}
              >
                Review
              </button>
              <button
                onClick={() => handleReportAction(selectedReport.id, "archive")}
                className={`px-4 py-2 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 ${isSubmittingReportAction
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