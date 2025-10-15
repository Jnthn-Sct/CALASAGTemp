import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaBell,
  FaChevronDown,
  FaChevronLeft,
  FaChevronRight,
  FaFileAlt,
  FaLock,
  FaUser,
  FaHome,
  FaCog,
  FaShieldAlt,
  FaExclamationTriangle,
  FaEye,
  FaPlus,
  FaFilter,
  FaDownload,
  FaHistory,
  FaFirstAid,
  FaFire,
  FaCheckCircle,
} from "react-icons/fa";
import logoImage from "../Images/nobg-logo.png";

// Import Chart.js components
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  Title as ChartTitle,
  LineElement,
  PointElement,
  Filler,
} from "chart.js";
import { Pie, Line } from "react-chartjs-2";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  ChartTitle,
  LineElement,
  PointElement,
  Filler
);
import { supabase } from "../../db";

export const presenceBadge = (status?: string) => {
  const common = "px-2 py-1 rounded-full text-xs font-medium";
  if (status === "online")
    return (
      <span className={`${common} bg-green-100 text-green-800`}>ONLINE</span>
    );
  if (status === "idle")
    return (
      <span className={`${common} bg-yellow-100 text-yellow-800`}>IDLE</span>
    );
  return <span className={`${common} bg-gray-100 text-gray-800`}>OFFLINE</span>;
};

export const accountBadge = (status?: string) => {
  const common = "px-2 py-1 rounded-full text-xs font-medium";
  if (status === "active")
    return (
      <span className={`${common} bg-green-100 text-green-800`}>
        ACCOUNT ACTIVE
      </span>
    );
  if (status === "pending")
    return (
      <span className={`${common} bg-yellow-100 text-yellow-800`}>
        ACCOUNT PENDING
      </span>
    );
  return (
    <span className={`${common} bg-red-100 text-red-800`}>
      ACCOUNT INACTIVE
    </span>
  );
};

// prettyType declared at top-level

interface UiUser {
  id: string;
  name: string;
  email?: string;
  status?: "active" | "inactive" | string; // account activation controlled by admin
  onlineStatus?: "online" | "idle" | "offline"; // realtime presence
  lastLogin?: string;
  reports?: number; // incident reports
  crisis?: number; // crisis alerts
  role?: string; // user role (admin, user, etc.)
  icon: string; // optional icon URL
}

interface EmergencyReport {
  id: number;
  title: string;
  message: string | undefined; // Changed from description to message
  location: string | undefined;
  severity: "low" | "medium" | "high" | "critical" | "Not Set";
  status: "pending" | "reviewing" | "resolved" | "Not Set";
  reportedBy: string | undefined;
  reporterId?: string;
  type?: string;
  date: string;
  updatedBy?: string;
  updatedAt?: string;
}

interface CrisisAlertRow {
  id: number;
  type: string;
  user_id: string | null;
  created_at: string;
}

// DB: safety_tips(id, name, content, icon, created_at)
interface SafetyTip {
  id: number;
  name: string;
  content: string;
  icon?: string | null;
  created_at: string;
}

// Interface for tracking incident actions
interface IncidentAction {
  id: number;
  incident_id: number;
  admin_id: string;
  admin_name: string;
  admin_role: string;
  action_type: string;
  previous_value: string;
  new_value: string;
  created_at: string;
  incident_type?: string;
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();

  // Get current user data from local storage or authentication
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    name: string;
    email: string;
    role: string;
  } | null>(null);

  const appRole = useMemo(() => localStorage.getItem("userRole") || "user", []);

  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState<boolean>(false);
  const [showEmergencyDetails, setShowEmergencyDetails] =
    useState<boolean>(false);
  const [selectedEmergency, setSelectedEmergency] =
    useState<EmergencyReport | null>(null);
  const [isEditingEmergency, setIsEditingEmergency] = useState<boolean>(false);
  const [editedEmergency, setEditedEmergency] = useState<{
    severity: "low" | "medium" | "high" | "critical";
    status: "pending" | "reviewing" | "resolved";
  }>({ severity: "medium", status: "pending" });
  const [showSafetyTipModal, setShowSafetyTipModal] = useState<boolean>(false);
  const [showSafetyTipDetails, setShowSafetyTipDetails] =
    useState<boolean>(false);
  const [isEditingSafetyTip, setIsEditingSafetyTip] = useState<boolean>(false);
  const [editedSafetyTip, setEditedSafetyTip] = useState<{
    id?: number;
    name: string;
    content: string;
    icon: string | null;
  }>({ name: "", content: "", icon: null });
  const [selectedSafetyTip, setSelectedSafetyTip] = useState<SafetyTip | null>(
    null
  );
  const [showUserDetails, setShowUserDetails] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<UiUser | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  // Enhanced notification structure with admin-specific fields
  const [notificationTab, setNotificationTab] = useState<"unread" | "all">(
    "unread"
  );
  const [notificationsList, setNotificationsList] = useState<
    {
      id: number;
      message: string;
      time: string;
      read: boolean;
      type: "emergency" | "critical_incident" | "system" | "general";
      sourceId?: number;
      forAdminId?: string;
      clearedBy?: string[];
    }[]
  >([]);

  const [openSidebarDropdown, setOpenSidebarDropdown] = useState<string | null>(
    null
  );

  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [isEditingSecurity, setIsEditingSecurity] = useState(false);
  const [personalInfo, setPersonalInfo] = useState({ name: "", email: "" });
  const [securityInfo, setSecurityInfo] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(false);

  const [users, setUsers] = useState<UiUser[]>([]);
  const [usersLoadError, setUsersLoadError] = useState<string | null>(null);

  const [emergencies, setEmergencies] = useState<EmergencyReport[]>([]);
  const [crisisAlerts, setCrisisAlerts] = useState<CrisisAlertRow[]>([]);

  const [safetyTips, setSafetyTips] = useState<SafetyTip[]>([]);
  const [safetyTipsError, setSafetyTipsError] = useState<string | null>(null);

  // New state for incident actions loading and pagination
  const [isLoadingActions, setIsLoadingActions] = useState<boolean>(false);
  const [actionsError, setActionsError] = useState<string | null>(null);
  const [actionPage, setActionPage] = useState(1);
  const actionsPerPage = 50;
  // State for editing incident reports and safety tips

  // State for action history and activity log
  const [incidentActions, setIncidentActions] = useState<IncidentAction[]>([]);
  const [activityLog, setActivityLog] = useState<IncidentAction[]>([]);
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [lastUpdated, setLastUpdated] = useState<string>(
    new Date().toISOString()
  );

  const [severityPercentages, setSeverityPercentages] = useState({
    low: 0,
    medium: 0,
    high: 0,
    critical: 0,
  });
  // Sorting
  const [sortField, setSortField] = useState<string>("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Filters
  const [filterType, setFilterType] = useState<string>("all");
  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const [newSafetyTip, setNewSafetyTip] = useState({
    name: "",
    content: "",
  });

  const loadEmergencies = async () => {
    let query = supabase
      .from("emergencies")
      .select(
        `
          id,
          message,
          created_at,
          status,
          emergency_type,
          user_id,
          severity,
          updated_by,
          updated_at,
          location,
          users:user_id(name)
        `
      )
      .order(sortField, { ascending: sortOrder === "asc" })
      .limit(2000);

    // Apply filters
    if (filterType !== "all") query = query.eq("emergency_type", filterType);
    if (filterSeverity !== "all") query = query.eq("severity", filterSeverity);
    if (filterStatus !== "all") query = query.eq("status", filterStatus);

    const { data, error } = await query;

    if (error) {
      console.error("Error loading emergencies:", error);
      return;
    }
    if (data) {
      const mapped: EmergencyReport[] = data.map((r: any) => ({
        id: r.id,
        title: r.emergency_type || "Unknown",
        message: r.message || "-",
        location: r.location
          ? `Lat: ${r.location.lat ?? "N/A"}, Lng: ${r.location.lng ?? "N/A"}`
          : "-",
        severity: r.severity ?? "Not Set",
        status: r.status ?? "Not Set",
        reportedBy: r.users?.name || "-",
        reporterId: r.user_id,
        type: r.emergency_type,
        date: r.created_at?.substring(0, 10) || "",
        updatedBy: r.updated_by || "",
        updatedAt: r.updated_at || "",
      }));
      setEmergencies(mapped);
    }
  };

  // Presence helpers
  const computeOnlineStatus = (
    lastSeen?: string | null
  ): "online" | "idle" | "offline" => {
    if (!lastSeen) return "offline";
    const last = new Date(lastSeen).getTime();
    const now = Date.now();
    const diff = now - last;
    if (diff <= 2 * 60 * 1000) return "online"; // <= 2 minutes
    if (diff <= 10 * 60 * 1000) return "idle"; // <= 10 minutes
    return "offline";
  };

  const userNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const u of users) {
      m.set(u.id, u.name);
    }
    return m;
  }, [users]);

  // State for tracking new activity log entries
  const [hasNewActivity, setHasNewActivity] = useState(false);
  const [lastViewedActionId, setLastViewedActionId] = useState<number>(0);

  // Initial data load and realtime subscriptions
  const fetchSeverityDistribution = async () => {
    const { data: severityCounts, error } = await supabase
      .from("emergencies")
      .select("severity");

    if (error) {
      console.error("Error fetching severities:", error);
      return;
    }

    // Count severities
    const counts: { [key: string]: number } = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };
    severityCounts?.forEach((row: { severity: string | null }) => {
      if (row.severity && row.severity in counts) {
        counts[row.severity]++;
      }
    });

    const total = Object.values(counts).reduce((a, b) => a + b, 0);

    // Calculate percentages
    const percentages = Object.fromEntries(
      Object.entries(counts).map(([key, val]) => [
        key,
        total > 0 ? Math.round((val / total) * 100) : 0,
      ])
    ) as { low: number; medium: number; high: number; critical: number };
    setSeverityPercentages(percentages);
  };
  const [filter, setFilter] = useState<"week" | "month" | "year">("month");
  const [incidentData, setIncidentData] = useState<number[]>([]);
  const [growth, setGrowth] = useState<number | null>(null);
  const [chartLabels, setChartLabels] = useState<string[]>([]);

  useEffect(() => {
    const fetchIncidentStats = async () => {
      try {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const date = now.getDate();

        let startCurrent: Date, endCurrent: Date;
        let startPrevious: Date, endPrevious: Date;
        let newLabels: string[] = [];
        let newIncidentData: number[];
        let groupByFn: (d: Date) => number;

        if (filter === "week") {
          const dayOfWeek = now.getDay();
          startCurrent = new Date(year, month, date - dayOfWeek);
          endCurrent = new Date(
            year,
            month,
            date + (6 - dayOfWeek),
            23,
            59,
            59,
            999
          );
          startPrevious = new Date(
            startCurrent.getTime() - 7 * 24 * 60 * 60 * 1000
          );
          endPrevious = new Date(
            endCurrent.getTime() - 7 * 24 * 60 * 60 * 1000
          );
          newLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
          newIncidentData = new Array(7).fill(0);
          groupByFn = (d) => d.getDay();
        } else if (filter === "month") {
          const daysInMonth = new Date(year, month + 1, 0).getDate();
          startCurrent = new Date(year, month, 1);
          endCurrent = new Date(year, month, daysInMonth, 23, 59, 59, 999);
          startPrevious = new Date(year, month - 1, 1);
          endPrevious = new Date(year, month, 0, 23, 59, 59, 999);
          newLabels = Array.from({ length: daysInMonth }, (_, i) =>
            (i + 1).toString()
          );
          newIncidentData = new Array(daysInMonth).fill(0);
          groupByFn = (d) => d.getDate() - 1;
        } else {
          // 'year'
          startCurrent = new Date(year, 0, 1);
          endCurrent = new Date(year, 11, 31, 23, 59, 59, 999);
          startPrevious = new Date(year - 1, 0, 1);
          endPrevious = new Date(year - 1, 11, 31, 23, 59, 59, 999);
          newLabels = [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
          ];
          newIncidentData = new Array(12).fill(0);
          groupByFn = (d) => d.getMonth();
        }

        // Fetch current period data
        const { data: currentData, error: currentError } = await supabase
          .from("emergencies")
          .select("id, created_at")
          .gte("created_at", startCurrent.toISOString())
          .lte("created_at", endCurrent.toISOString());

        if (currentError) throw currentError;

        // Fetch previous period data
        const { data: previousData, error: previousError } = await supabase
          .from("emergencies")
          .select("id, created_at")
          .gte("created_at", startPrevious.toISOString())
          .lte("created_at", endPrevious.toISOString());

        if (previousError) throw previousError;

        // Group data for the chart
        currentData?.forEach((incident) => {
          const incidentDate = new Date(incident.created_at);
          const index = groupByFn(incidentDate);
          if (index >= 0 && index < newIncidentData.length) {
            newIncidentData[index]++;
          }
        });

        setChartLabels(newLabels);
        setIncidentData(newIncidentData);

        // Calculate growth percentage
        const currentTotal = currentData?.length || 0;
        const prevTotal = previousData?.length || 0;

        // Growth %
        let percentageGrowth = 0;
        if (prevTotal > 0) {
          percentageGrowth = ((currentTotal - prevTotal) / prevTotal) * 100;
        } else if (currentTotal > 0) {
          percentageGrowth = 100;
        } else {
          percentageGrowth = 0;
        }
        setGrowth(percentageGrowth);
      } catch (err) {
        console.error("Error fetching incident stats:", err);
      }
    };

    fetchIncidentStats();
  }, [filter]);
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        console.error("Error fetching user, redirecting to login.");
        navigate("/login");
        return;
      }
      console.log("Current logged-in user (from Supabase):", user);

      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("user_id, name, email, role")
        .eq("user_id", user.id)
        .single();

      if (profileError) {
        console.error("Error fetching user profile:", profileError);
      } else if (profile) {
        setCurrentUser({
          id: profile.user_id,
          name: profile.name,
          email: profile.email,
          role: profile.role,
        });
        setPersonalInfo({ name: profile.name, email: profile.email });
      }
    };

    const loadSafetyTips = async () => {
      const { data, error } = await supabase
        .from("safety_tips")
        .select("id, name, content, icon, created_at")
        .order("created_at", { ascending: false });
      if (error) {
        setSafetyTipsError(error.message);
      } else {
        setSafetyTips(data || []);
      }
    };

    // Define loadIncidentActions at the top level of useEffect to avoid duplicate declarations
    const loadIncidentActions = async (page = 1) => {
      setIsLoadingActions(true);
      setActionsError(null);
      const { data, error } = await supabase
        .from("incident_actions")
        .select(
          `
          id, 
          incident_id, 
          admin_id, 
          action_type, 
          previous_value, 
          new_value, 
          created_at,
          admin:users!fk_admin(name, role),
          incident:emergencies!fk_incident(emergency_type)
        `
        )
        .order("created_at", { ascending: false })
        .range((page - 1) * actionsPerPage, page * actionsPerPage - 1);

      if (error) {
        console.error("Error loading incident actions:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });
        setActionsError("Failed to load activity log. Please try again.");
        setIsLoadingActions(false);
        return;
      }

      if (data) {
        const mapped: IncidentAction[] = data.map((action: any) => ({
          id: action.id,
          incident_id: action.incident_id,
          admin_id: action.admin_id,
          admin_name: action.admin?.name || "Unknown",
          admin_role: action.admin?.role || "Unknown",
          action_type: action.action_type,
          previous_value: action.previous_value || "",
          new_value: action.new_value || "",
          created_at: action.created_at,
          incident_type: action.incident?.emergency_type || "Unknown",
        }));

        setIncidentActions(mapped);
        setActivityLog(mapped);

        // Check if there are new actions since last viewed
        if (mapped.length > 0) {
          const highestId = Math.max(...mapped.map((action) => action.id));
          if (highestId > lastViewedActionId && lastViewedActionId !== 0) {
            setHasNewActivity(true);
          }
          // Update last viewed ID only if this is the initial load
          if (lastViewedActionId === 0) {
            setLastViewedActionId(highestId);
          }
        }
      }

      setIsLoadingActions(false);
    };



    const loadCrisis = async () => {
      const { data, error } = await supabase
        .from("crisis_alerts")
        .select("id, type, user_id, created_at")
        .order("created_at", { ascending: false })
        .limit(2000);
      if (!error && data) {
        setCrisisAlerts(
          (data as any[]).map((r) => ({
            id: r.id,
            type: r.type,
            user_id: r.user_id,
            created_at: r.created_at,
          }))
        );
      }
    };

    const loadUsersBase = async () => {
      setUsersLoadError(null);
      const { data, error } = await supabase
        .from("users")
        .select("user_id, name, email, role, status, last_login")
        .in("role", ["user", "moderator"]);

      if (error) {
        setUsersLoadError(
          "Limited view due to permissions. Showing public profiles only."
        );
        const { data: namesData } = await supabase
          .from("users")
          .select("user_id, name");
        setUsers(
          (namesData || []).map((u: any) => ({
            id: u.user_id,
            name: u.name || "Unknown",
            onlineStatus: "offline",
            reports: 0,
            crisis: 0,
          }))
        );
      } else {
        setUsers(
          (data || []).map((u: any) => ({
            id: u.user_id,
            name: u.name || "Unknown",
            email: u.email,
            status: (u.status as any) || "inactive",
            lastLogin: u.last_login || "",
            reports: 0,
            crisis: 0,
            onlineStatus: "offline",
          }))
        );
      }
    };

    const loadIncidentCounts = async () => {
      const { data } = await supabase.from("emergencies").select("user_id");
      if (!data) return;
      const counts = new Map<string, number>();
      for (const r of data as any[]) {
        if (!r.user_id) continue;
        counts.set(r.user_id, (counts.get(r.user_id) || 0) + 1);
      }
      setUsers((prev) =>
        prev.map((u) => ({ ...u, reports: counts.get(u.id) || 0 }))
      );
    };

    const loadCrisisCounts = async () => {
      const { data } = await supabase.from("crisis_alerts").select("user_id");
      if (!data) return;
      const counts = new Map<string, number>();
      for (const r of data as any[]) {
        if (!r.user_id) continue;
        counts.set(r.user_id, (counts.get(r.user_id) || 0) + 1);
      }
      setUsers((prev) =>
        prev.map((u) => ({ ...u, crisis: counts.get(u.id) || 0 }))
      );
    };

    // Load all data with improved concurrent loading
    const loadAll = async () => {
      await fetchCurrentUser();
      try {
        await Promise.all([
          loadSafetyTips(),
          loadEmergencies(),
          loadCrisis(),
          loadUsersBase(),
          loadIncidentCounts(),
          loadCrisisCounts(),
          loadIncidentActions(),
          fetchSeverityDistribution(),
        ]);
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };

    loadAll();

    // Set up all real-time subscriptions
    const safetyTipsChannel = supabase
      .channel("safety_tips")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "safety_tips" },
        () => {
          loadSafetyTips();
        }
      )
      .subscribe();

    const emergenciesChannel = supabase
      .channel("emergencies")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "emergencies" },
        async (payload) => {
          const newEmergency = payload.new;
          const emergencyType = newEmergency.emergency_type;

          // Update local notifications state immediately
          setNotificationsList((prev) => [
            {
              id: Date.now(),
              message: `New ${emergencyType} emergency reported`,
              time: new Date().toLocaleString(),
              read: false,
              type: "emergency",
              sourceId: newEmergency.id,
              clearedBy: [],
            },
            ...prev,
          ]);

          // ✅ Use RPC to notify ALL admins
          const { error } = await supabase.rpc("create_notification", {
            recipient_id: null, // null means broadcast to all admins (handled in SQL function)
            notification_type: "admin",
            message_text: `New ${emergencyType} emergency reported`,
            sender_id: newEmergency.user_id,
          });

          if (error) {
            console.error("Failed to create admin notification:", error);
          }

          loadEmergencies();
          loadIncidentCounts();
          fetchSeverityDistribution();
        }
      )

      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "emergencies" },
        async (payload) => {
          const updatedEmergency = payload.new;

          if (updatedEmergency.severity === "critical") {
            setNotificationsList((prev) => [
              {
                id: Date.now(),
                message: `Emergency #${updatedEmergency.id} severity changed to CRITICAL`,
                time: new Date().toLocaleString(),
                read: false,
                type: "critical_incident",
                sourceId: updatedEmergency.id,
                clearedBy: [],
              },
              ...prev,
            ]);

            // ✅ Use RPC so ALL admins are notified
            const { error } = await supabase.rpc("create_notification", {
              recipient_id: null, // broadcast to all admins
              notification_type: "admin",
              message_text: `Emergency #${updatedEmergency.id} severity changed to CRITICAL`,
              sender_id: updatedEmergency.updated_by,
            });

            if (error) {
              console.error(
                "Failed to create critical incident notification:",
                error
              );
            }
          }

          loadEmergencies();
          loadIncidentCounts();
          fetchSeverityDistribution();
        }
      )

      .subscribe();

    const crisisChannel = supabase
      .channel("crisis")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "crisis_alerts" },
        () => {
          loadCrisis();
          loadCrisisCounts();
        }
      )
      .subscribe();

    // Create a separate channel for activity indicators
    const activityChannel = supabase
      .channel("activity_indicators")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "incident_actions" },
        (payload) => {
          // Set indicator for new activity
          setHasNewActivity(true);

          // Refresh incident actions
          loadIncidentActions();
        }
      )
      .subscribe();

    // Add subscription for notifications
    const notificationsChannel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications" },
        (payload) => {
          loadNotifications();
        }
      )
      .subscribe();

    const usersChannel = supabase
      .channel("users")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "users",
        },
        () => {
          loadUsersBase();
          loadPresence();
          loadIncidentCounts();
        }
      )
      .subscribe();

    // Set up real-time subscription for incident actions
    const incidentActionsChannel = supabase
      .channel("incident_actions")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "incident_actions" },
        async (payload) => {
          const newAction = payload.new as any;

          // Fetch admin details
          const { data: adminData, error: adminError } = await supabase
            .from("users")
            .select("name, role")
            .eq("user_id", newAction.admin_id)
            .single();

          if (adminError) {
            console.error("Error fetching admin details:", adminError);
          }

          // Fetch incident details
          const { data: incidentData, error: incidentError } = await supabase
            .from("emergencies")
            .select("emergency_type")
            .eq("id", newAction.incident_id)
            .single();

          if (incidentError) {
            console.error("Error fetching incident details:", incidentError);
          }

          const mappedAction: IncidentAction = {
            id: newAction.id,
            incident_id: newAction.incident_id,
            admin_id: newAction.admin_id,
            admin_name: adminData?.name || "Unknown",
            admin_role: adminData?.role || "Unknown",
            action_type: newAction.action_type,
            previous_value: newAction.previous_value || "",
            new_value: newAction.new_value || "",
            created_at: newAction.created_at,
            incident_type: incidentData?.emergency_type || "Unknown",
          };

          setIncidentActions((prev) => [mappedAction, ...prev]);
          setActivityLog((prev) =>
            actionFilter === "all" ||
              mappedAction.action_type === actionFilter
              ? [mappedAction, ...prev]
              : prev
          );
        }
      )
      .subscribe();

    // Clean up all subscriptions when component unmounts
    return () => {
      supabase.removeChannel(safetyTipsChannel);
      supabase.removeChannel(emergenciesChannel);
      supabase.removeChannel(usersChannel);
      supabase.removeChannel(crisisChannel);
      supabase.removeChannel(activityChannel);
      supabase.removeChannel(notificationsChannel);
      supabase.removeChannel(incidentActionsChannel); // Make sure to remove this channel as well
    };
  }, []); // Re-run if currentUser changes

  // Add this below the main useEffect
  useEffect(() => {
    if (!currentUser?.id) return;

    const loadNotifications = async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", currentUser.id)
        .eq("notification_type", "admin")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading notifications:", error);
        return;
      }

      if (data) {
        const formatted = data.map((notification) => ({
          id: notification.id,
          message: notification.message,
          time: new Date(notification.created_at).toLocaleString(),
          read: notification.read,
          type: notification.type || "general",
          sourceId: notification.source_id,
          forAdminId: notification.for_admin_id,
          clearedBy: notification.cleared_by,
        }));
        setNotificationsList(formatted);
      }
    };

    loadNotifications();

    const notificationsChannel = supabase.channel('custom-notification-channel').on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${currentUser.id}` }, payload => {
      loadNotifications();
    }).subscribe();
    return () => { supabase.removeChannel(notificationsChannel) }
  }, [currentUser?.id]);

  useEffect(() => {
    loadEmergencies();
  }, [
    sortField,
    sortOrder,
    filterType,
    filterSeverity,
    filterStatus,
  ]);

  const handleLogout = () => {
    localStorage.removeItem("userRole");
    navigate("/login");
  };

  const handleToggleUserStatus = async (userId: string) => {
    try {
      const target = users.find((u) => u.id === userId);
      if (!target) return;
      const next = target.status === "active" ? "inactive" : "active";
      const { error } = await supabase
        .from("users")
        .update({ status: next })
        .eq("user_id", userId);
      if (error) {
        alert(`Unable to update user (RLS/permissions): ${error.message}`);
        return;
      }
      setUsers(
        users.map((u) => (u.id === userId ? { ...u, status: next as any } : u))
      );
      setShowUserDetails(false);
    } catch (e: any) {
      alert(`Error updating user: ${e.message}`);
    }
  };

  const handleIncidentAction = async (
    incidentId: number,
    action: "review" | "resolve" | "escalate"
  ) => {
    const emergency = emergencies.find((emg) => emg.id === incidentId);
    if (!emergency) return;

    const previousStatus = emergency.status;
    let newStatus: "pending" | "reviewing" | "resolved" = "pending";
    if (action === "review") newStatus = "reviewing";
    if (action === "resolve") newStatus = "resolved";
    if (action === "escalate") newStatus = "reviewing";

    try {
      const { error } = await supabase
        .from("emergencies")
        .update({
          status: newStatus, // Corrected from `status` to `newStatus`
          updated_by: currentUser.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", incidentId);

      if (error) {
        alert(`Error updating emergency: ${error.message}`);
        return;
      }

      console.log("Logging action:", {
        incident_id: incidentId,
        admin_id: currentUser?.id || null,
        action_type: "status_change",
      });

      const { error: actionError } = await supabase
        .from("incident_actions")
        .insert({
          incident_id: incidentId,
          admin_id: currentUser?.id || null,
          action_type: "status_change",
          previous_value: previousStatus,
          new_value: newStatus,
          created_at: new Date().toISOString(),
        });

      if (actionError) {
        console.error("Error logging incident action:", actionError);
      }

      setEmergencies((prev) =>
        prev.map((emg) =>
          emg.id === incidentId ? { ...emg, status: newStatus } : emg
        )
      );

      setShowEmergencyDetails(false);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleSaveEmergencyEdit = async () => {
    if (!selectedEmergency || !editedEmergency) return;

    try {
      const { error } = await supabase
        .from("emergencies")
        .update({
          status: editedEmergency.status,
          severity: editedEmergency.severity,
          updated_by: currentUser?.id || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedEmergency.id);

      if (error) {
        alert(`Error updating emergency: ${error.message}`);
        return;
      }

      // Log status change if changed
      if (selectedEmergency.status !== editedEmergency.status) {
        console.log("Logging action:", {
          incident_id: selectedEmergency.id,
          admin_id: currentUser?.id || null,
          action_type: "status_change",
        });

        const { error: actionError } = await supabase
          .from("incident_actions")
          .insert({
            incident_id: selectedEmergency.id,
            admin_id: currentUser?.id || null,
            action_type: "status_change",
            previous_value: selectedEmergency.status,
            new_value: editedEmergency.status,
            created_at: new Date().toISOString(),
          });

        if (actionError) {
          console.error("Error logging status change:", actionError);
        }
      }

      // Log severity change if changed
      if (selectedEmergency.severity !== editedEmergency.severity) {
        console.log("Logging action:", {
          incident_id: selectedEmergency.id,
          admin_id: currentUser?.id || null,
          action_type: "severity_change",
        });

        const { error: actionError } = await supabase
          .from("incident_actions")
          .insert({
            incident_id: selectedEmergency.id,
            admin_id: currentUser?.id || null,
            action_type: "severity_change",
            previous_value: selectedEmergency.severity,
            new_value: editedEmergency.severity,
            created_at: new Date().toISOString(),
          });

        if (actionError) {
          console.error("Error logging severity change:", actionError);
        }
      }

      setEmergencies((prev) =>
        prev.map((em) =>
          em.id === selectedEmergency.id
            ? {
              ...em,
              status: editedEmergency.status,
              severity: editedEmergency.severity,
            }
            : em
        )
      );

      setIsEditingEmergency(false);
      setShowEmergencyDetails(false);
    } catch (err: any) {
      console.error("Error saving emergency edit:", err);
      alert(`Error: ${err.message}`);
    }
  };

  const handleDeleteSafetyTip = async (tipId: number) => {
    const { error } = await supabase
      .from("safety_tips")
      .delete()
      .eq("id", tipId);
    if (error) {
      alert(`Unable to delete safety tip (RLS/permissions): ${error.message}`);
    } else {
      setSafetyTips((prev) => prev.filter((t) => t.id !== tipId));
    }
  };

  const handleAddSafetyTip = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { name: newSafetyTip.name, content: newSafetyTip.content };
    const { data, error } = await supabase
      .from("safety_tips")
      .insert(payload)
      .select("id, name, content, icon, created_at")
      .single();
    if (error) {
      alert(`Unable to add safety tip (RLS/permissions): ${error.message}`);
    } else if (data) {
      setSafetyTips((prev) => [data as SafetyTip, ...prev]);
      setShowSafetyTipModal(false);
      setNewSafetyTip({ name: "", content: "" });
    }
  };

  const handleSaveSafetyTipEdit = async () => {
    if (!editedSafetyTip || !editedSafetyTip.id) return;

    if (!editedSafetyTip.name || !editedSafetyTip.content) {
      alert("Title and content are required");
      return;
    }

    try {
      const { error } = await supabase
        .from("safety_tips")
        .update({
          name: editedSafetyTip.name,
          content: editedSafetyTip.content,
          icon: editedSafetyTip.icon,
        })
        .eq("id", editedSafetyTip.id);

      if (error) {
        alert(`Unable to update safety tip: ${error.message}`);
      } else {
        // Update local state
        setSafetyTips((prev) =>
          prev.map((tip) =>
            tip.id === editedSafetyTip.id ? editedSafetyTip : tip
          )
        );
        setIsEditingSafetyTip(false);
        setShowSafetyTipDetails(false);
      }
    } catch (error: any) {
      console.error("Error updating safety tip:", error);
      alert(`Failed to update safety tip: ${error.message}`);
    }
  };

  const renderContent = () => {
    // Prepare data for charts
    const toTypeLabel = (type?: string) => {
      if (!type) return "General";
      const map: Record<string, string> = {
        Medical: "Medical",
        Fire: "Fire",
        Accident: "Accident",
        Crime: "Crime",
        Other: "Other",
      };
      return map[type] || type.charAt(0).toUpperCase() + type.slice(1);
    };

    const userStatusData = {
      labels: ["Active", "Inactive", "Pending"],
      datasets: [
        {
          data: [
            users.filter((u) => u.status === "active").length,
            users.filter((u) => u.status === "inactive").length,
            users.filter((u) => u.status === "pending").length,
          ],
          backgroundColor: ["#005524", "#f69f00", "#d97706"],
          borderColor: ["#ffffff", "#ffffff", "#ffffff"],
          borderWidth: 2,
        },
      ],
    };

    const salesData = {
      labels: chartLabels,
      datasets: [
        {
          label: "Incident Reports",
          data: incidentData.length > 0 ? incidentData : new Array(12).fill(0),
          borderColor: "#005524",
          backgroundColor: "rgba(0, 85, 36, 0.1)",
          tension: 0.4,
          fill: true,
        },
      ],
    };

    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom" as const,
          labels: {
            usePointStyle: true,
            padding: 20,
          },
        },
        title: {
          display: false,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: "rgba(0, 0, 0, 0.05)",
          },
        },
        x: {
          grid: {
            color: "rgba(0, 0, 0, 0.05)",
          },
        },
      },
    };

    switch (activeTab) {
      case "dashboard":
        return (
          <div className="space-y-6">
            {/* Top Metric Cards */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {/* Total Users */}
              <div className="group bg-gradient-to-br from-white to-white/95 rounded-2xl p-6 shadow-md transition-transform duration-300 ease-out transform hover:-translate-y-2 hover:shadow-xl border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">
                      TOTAL USERS
                    </p>
                    <p className="text-3xl font-bold text-gray-900">
                      {users.length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-[#005524] to-[#004015] rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <FaUser size={20} />
                  </div>
                </div>
              </div>

              {/* Active Users */}
              <div className="group bg-gradient-to-br from-white to-white/95 rounded-2xl p-6 shadow-md transition-transform duration-300 ease-out transform hover:-translate-y-2 hover:shadow-xl border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">
                      ACTIVE USERS (ACCOUNT)
                    </p>
                    <p className="text-3xl font-bold text-gray-900">
                      {users.filter((u) => u.status === "active").length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-[#f69f00] to-[#be4c1d] rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <FaUser size={20} />
                  </div>
                </div>
              </div>

              {/* Pending Users */}
              <div className="group bg-gradient-to-br from-white to-white/95 rounded-2xl p-6 shadow-md transition-transform duration-300 ease-out transform hover:-translate-y-2 hover:shadow-xl border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">
                      PENDING USERS
                    </p>
                    <p className="text-3xl font-bold text-gray-900">
                      {users.filter((u) => u.status === "pending").length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <FaUser size={20} />
                  </div>
                </div>
              </div>

              {/* Critical Emergencies */}
              <div className="group bg-gradient-to-br from-white to-white/95 rounded-2xl p-6 shadow-md transition-transform duration-300 ease-out transform hover:-translate-y-2 hover:shadow-xl border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">
                      CRITICAL EMERGENCIES
                    </p>
                    <p className="text-3xl font-bold text-gray-900">
                      {
                        emergencies.filter((i) => i.severity === "critical")
                          .length
                      }
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <FaExclamationTriangle size={20} />
                  </div>
                </div>
              </div>

              {/* Presence Summary */}
              <div className="group bg-gradient-to-br from-white to-white/95 rounded-2xl p-6 shadow-md transition-transform duration-300 ease-out transform hover:-translate-y-2 hover:shadow-xl border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">
                      ONLINE USERS
                    </p>
                    <p className="text-3xl font-bold text-gray-900">
                      {users.filter((u) => u.onlineStatus === "online").length}
                    </p>
                    <p className="text-sm text-blue-600 mt-1">
                      {users.filter((u) => u.onlineStatus === "idle").length}{" "}
                      idle
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <FaShieldAlt size={20} />
                  </div>
                </div>
              </div>

              {/* Crisis Alerts Total */}
              <div className="group bg-gradient-to-br from-white to-white/95 rounded-2xl p-6 shadow-md transition-transform duration-300 ease-out transform hover:-translate-y-2 hover:shadow-xl border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">
                      CRISIS ALERTS
                    </p>
                    <p className="text-3xl font-bold text-gray-900">
                      {crisisAlerts.length}
                    </p>
                    <p className="text-sm text-red-600 mt-1">Real-time</p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-red-400 to-red-600 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <FaExclamationTriangle size={20} />
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Sales Overview Chart */}
              <div className="bg-white/95 rounded-2xl p-6 shadow-md border border-gray-100 transition-transform duration-300 ease-out transform hover:-translate-y-2 hover:shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Incident Reports Overview
                    </h3>
                    <p className="text-sm text-gray-600">
                      {growth !== null
                        ? `${growth.toFixed(1)}% ${growth >= 0 ? "more" : "less"
                        } vs last ${filter}`
                        : "Loading..."}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setFilter("week")}
                      className={`px-3 py-1 text-xs rounded-lg transition-colors ${filter === "week"
                        ? "bg-[#005524] text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                    >
                      Week
                    </button>
                    <button
                      onClick={() => setFilter("month")}
                      className={`px-3 py-1 text-xs rounded-lg transition-colors ${filter === "month"
                        ? "bg-[#005524] text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                    >
                      Month
                    </button>
                    <button
                      onClick={() => setFilter("year")}
                      className={`px-3 py-1 text-xs rounded-lg transition-colors ${filter === "year"
                        ? "bg-[#005524] text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                    >
                      Year
                    </button>
                  </div>
                </div>
                <div style={{ height: "300px" }}>
                  <Line data={salesData} options={chartOptions} />
                </div>
              </div>

              {/* User Status Distribution */}
              <div className="bg-white/95 rounded-2xl p-6 shadow-md border border-gray-100 transition-transform duration-300 ease-out transform hover:-translate-y-2 hover:shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    User Status Distribution
                  </h3>
                  <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                    <FaDownload size={16} />
                  </button>
                </div>
                <div style={{ height: "300px" }}>
                  <Pie data={userStatusData} options={chartOptions} />
                </div>
              </div>
            </div>

            {/* Bottom Section */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Recent Users */}
              <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 transition-transform duration-300 ease-out transform hover:-translate-y-2 hover:shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Recent Users
                  </h3>
                  <button className="text-[#005524] hover:text-[#004015] text-sm font-medium">
                    View all
                  </button>
                </div>
                <div className="space-y-4">
                  {users.slice(0, 3).map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-[#005524] to-[#f69f00] rounded-full flex items-center justify-center text-white font-semibold text-sm">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {user.name}
                          </p>
                          {user.email && (
                            <p className="text-sm text-gray-500">
                              {user.email}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {presenceBadge(user.onlineStatus)}
                        {accountBadge(user.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 transition-transform duration-300 ease-out transform hover:-translate-y-2 hover:shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Recent Activity
                  </h3>
                  <button className="text-[#005524] hover:text-[#004015] text-sm font-medium">
                    View all
                  </button>
                </div>
                <div className="space-y-4">
                  {emergencies.slice(0, 3).map((emergency) => (
                    <div
                      key={emergency.id}
                      className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer group"
                      onClick={() => {
                        setSelectedEmergency(emergency);
                        setShowEmergencyDetails(true);
                      }}
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${emergency.severity === "critical"
                            ? "bg-red-100"
                            : emergency.severity === "high"
                              ? "bg-orange-100"
                              : "bg-yellow-100"
                            }`}
                        >
                          <FaBell
                            size={12}
                            className={
                              emergency.severity === "critical"
                                ? "text-red-600"
                                : emergency.severity === "high"
                                  ? "text-orange-600"
                                  : "text-yellow-600"
                            }
                          />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {emergency.title}
                          </p>
                          <p className="text-sm text-gray-500">
                            {emergency.location}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-400">
                          {emergency.date}
                        </span>
                        <button className="p-1 text-gray-400 hover:text-[#005524] opacity-0 group-hover:opacity-100 transition-all duration-300">
                          <FaEye size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* System Status */}
              <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 transition-transform duration-300 ease-out transform hover:-translate-y-2 hover:shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    System Status
                  </h3>
                  <button className="text-[#005524] hover:text-[#004015] text-sm font-medium">
                    Details
                  </button>
                </div>
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <FaCheckCircle size={12} className="text-green-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          Low Severity
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-green-600">
                        {severityPercentages.low}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${severityPercentages.low}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                          <FaExclamationTriangle
                            size={12}
                            className="text-yellow-600"
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          Medium Severity
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-yellow-600">
                        {severityPercentages.medium}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-yellow-500 h-2 rounded-full"
                        style={{ width: `${severityPercentages.medium}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                          <FaExclamationTriangle
                            size={12}
                            className="text-orange-600"
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          High Severity
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-orange-600">
                        {severityPercentages.high}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-orange-500 h-2 rounded-full"
                        style={{ width: `${severityPercentages.high}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                          <FaExclamationTriangle
                            size={12}
                            className="text-red-600"
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          Critical Severity
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-red-600">
                        {severityPercentages.critical}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-red-500 h-2 rounded-full"
                        style={{ width: `${severityPercentages.critical}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "users": // Original case for the full user table
        return (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                All Users (Table View)
              </h2>
              <div className="flex items-center gap-3">
                <button className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-2">
                  <FaFilter size={14} />
                  Filter
                </button>
                <button
                  disabled
                  className="px-4 py-2 bg-gray-200 text-gray-500 rounded-lg cursor-not-allowed transition-colors flex items-center gap-2"
                  title="User creation is managed via signup or super admin tools"
                >
                  <FaPlus size={14} />
                  Add User
                </button>
              </div>
            </div>
            {usersLoadError && (
              <div className="mb-4 text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                {usersLoadError}
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Account Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Presence
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Last Login
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Incident Reports
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Crisis Alerts
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-br from-[#005524] to-[#f69f00] rounded-full flex items-center justify-center text-white font-semibold text-sm">
                            {user.name.charAt(0)}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {user.email || "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {accountBadge(user.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {presenceBadge(user.onlineStatus)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {user.lastLogin
                          ? new Date(user.lastLogin).toLocaleString()
                          : "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {user.reports ?? 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {user.crisis ?? 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        {appRole === "super_admin" && (
                          <button
                            onClick={() => handleToggleUserStatus(user.id)}
                            className={`px-3 py-1 rounded-lg transition-colors ${user.status === "active"
                              ? "text-red-600 hover:text-red-800 hover:bg-red-50"
                              : "text-green-600 hover:text-green-800 hover:bg-green-50"
                              }`}
                          >
                            {user.status === "active"
                              ? "Deactivate"
                              : "Activate"}
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowUserDetails(true);
                          }}
                          className="px-3 py-1 rounded-lg text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-colors"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case "total-users-list": // Case for displaying all users as a list
        return (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              All Users
            </h2>
            <div className="space-y-4">
              {users.map((user, index) => (
                <div
                  key={user.id}
                  className={`flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-colors ${index < users.length - 1
                    ? "border-b border-gray-100 pb-4"
                    : ""
                    }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#005524] to-[#f69f00] rounded-full flex items-center justify-center text-white font-semibold">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{user.name}</h3>
                      <p className="text-sm text-gray-600">
                        {user.email || "—"} &bull; {user.status || "—"} &bull;
                        Presence: {user.onlineStatus || "â€”"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {presenceBadge(user.onlineStatus)}
                    {accountBadge(user.status)}
                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                      <FaEye size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "active-users-list": // Case for displaying only active users as a list
        return (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Active Users
            </h2>
            <div className="space-y-4">
              {users
                .filter((user) => user.status === "active")
                .map((user, index, arr) => (
                  <div
                    key={user.id}
                    className={`flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-colors ${index < arr.length - 1
                      ? "border-b border-gray-100 pb-4"
                      : ""
                      }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#005524] to-[#f69f00] rounded-full flex items-center justify-center text-white font-semibold">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {user.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {user.email || "—"} &bull; Presence:{" "}
                          {user.onlineStatus || "â€”"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {presenceBadge(user.onlineStatus)}
                      <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                        <FaEye size={14} />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        );

      case "emergencies":
        return (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Incident Reports
              </h2>
            </div>
            <div className="flex flex-wrap gap-3 mb-4">
              {/* Sort Field */}
              <select
                value={sortField}
                onChange={(e) => setSortField(e.target.value)}
                className="px-3 py-2 border rounded-lg"
              >
                <option value="created_at">Date</option>
                <option value="emergency_type">Type</option>
                <option value="users.name">Reporter</option>
                <option value="severity">Severity</option>
                <option value="status">Status</option>
              </select>

              {/* Sort Order */}
              <button
                onClick={() =>
                  setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
                }
                className="px-3 py-2 border rounded-lg"
              >
                {sortOrder === "asc" ? "⬆️ Asc" : "⬇️ Desc"}
              </button>

              {/* Filter Type */}
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border rounded-lg"
              >
                <option value="all">All Types</option>
                <option value="Crime">Crime</option>
                <option value="Medical">Medical</option>
                <option value="Fire">Fire</option>
                <option value="Accident">Accident</option>
                <option value="Other">Other</option>
              </select>

              {/* Filter Severity */}
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="px-3 py-2 border rounded-lg"
              >
                <option value="all">All Severities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>

              {/* Filter Status */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border rounded-lg"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="reviewing">Reviewing</option>
                <option value="resolved">Resolved</option>
              </select>

              {/* Reset Filters */}
              <button
                onClick={() => {
                  setSortField("created_at");
                  setSortOrder("desc");
                  setFilterType("all");
                  setFilterSeverity("all");
                  setFilterStatus("all");
                  setSearchQuery("");
                }}
                className="px-3 py-2 border rounded-lg bg-gray-100 hover:bg-gray-200"
              >
                Reset
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Reporter
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Severity
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
                <tbody className="bg-white divide-y divide-gray-100">
                  {emergencies.map((emergency) => (
                    <tr
                      key={emergency.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {toTypeLabel(emergency.type)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {emergency.reporterId
                          ? userNameById.get(emergency.reporterId) || "—"
                          : "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${emergency.severity === "critical"
                            ? "bg-red-100 text-red-800"
                            : emergency.severity === "high"
                              ? "bg-orange-100 text-orange-800"
                              : emergency.severity === "medium"
                                ? "bg-yellow-100 text-yellow-800"
                                : emergency.severity === "low"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                            }`}
                        >
                          {emergency.severity}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${emergency.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : emergency.status === "reviewing"
                              ? "bg-blue-100 text-blue-800"
                              : emergency.status === "resolved"
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                        >
                          {emergency.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {emergency.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => {
                            setSelectedEmergency(emergency);
                            setShowEmergencyDetails(true);
                            // Initialize editedEmergency with current values
                            setEditedEmergency({
                              severity:
                                emergency.severity === "Not Set"
                                  ? "medium"
                                  : (emergency.severity as
                                    | "low"
                                    | "medium"
                                    | "high"
                                    | "critical"),
                              status:
                                emergency.status === "Not Set"
                                  ? "pending"
                                  : (emergency.status as
                                    | "pending"
                                    | "reviewing"
                                    | "resolved"),
                            });
                          }}
                          className="px-3 py-1 rounded-lg text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-colors"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Crisis Alerts table */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Crisis Alerts (Safe/Unsafe/Acknowledgements)
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Reporter
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {crisisAlerts.map((a) => (
                      <tr
                        key={a.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {a.type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {a.user_id ? userNameById.get(a.user_id) || "—" : "—"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {a.created_at
                            ? new Date(a.created_at).toLocaleString()
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      case "safety-tips":
        return (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Safety Tips
              </h2>
              <button
                onClick={() => setShowSafetyTipModal(true)}
                className="px-4 py-2 bg-[#005524] text-white rounded-lg hover:bg-[#004d20] transition-colors flex items-center gap-2"
              >
                <FaPlus size={14} />
                Add New Tip
              </button>
            </div>
            {safetyTipsError && (
              <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
                {safetyTipsError}
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Icon
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {safetyTips.map((tip) => (
                    <tr
                      key={tip.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {tip.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {tip.icon || "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {(tip.created_at || "").toString().substring(0, 10)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap space-x-2">
                        <button
                          onClick={() => {
                            setSelectedSafetyTip(tip as any);
                            setShowSafetyTipDetails(true);
                          }}
                          className="px-3 py-1 rounded-lg text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-colors"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleDeleteSafetyTip(tip.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      case "activity-log":
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  Activity Log
                </h3>
                <div className="flex items-center gap-2">
                  <select
                    className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#005524]"
                    onChange={(e) => {
                      // Filter by action type
                      if (e.target.value === "all") {
                        setActivityLog(incidentActions);
                      } else {
                        setActivityLog(
                          incidentActions.filter(
                            (action) => action.action_type === e.target.value
                          )
                        );
                      }
                    }}
                  >
                    <option value="all">All Actions</option>
                    <option value="status_change">Status Changes</option>
                    <option value="severity_change">Severity Changes</option>
                  </select>
                </div>
              </div>

              {activityLog.length > 0 ? (
                <div className="space-y-4">
                  {activityLog.map((action) => (
                    <div
                      key={action.id}
                      className="border border-gray-100 rounded-xl p-4 hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${action.admin_role === "police"
                              ? "bg-blue-600"
                              : action.admin_role === "medical"
                                ? "bg-red-600"
                                : "bg-orange-600"
                              }`}
                          >
                            {action.admin_role === "police" ? (
                              <FaShieldAlt size={14} />
                            ) : action.admin_role === "medical" ? (
                              <FaFirstAid size={14} />
                            ) : (
                              <FaFire size={14} />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {action.admin_name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {action.admin_role}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs text-gray-500">
                          {action.created_at
                            ? new Date(action.created_at).toLocaleString()
                            : "N/A"}
                        </span>
                      </div>
                      <div className="pl-10">
                        <p className="text-gray-700">
                          {action.action_type === "status_change"
                            ? "Changed status from "
                            : "Changed severity from "}
                          <span className="font-medium">
                            {action.previous_value}
                          </span>{" "}
                          to{" "}
                          <span className="font-medium">{action.new_value}</span>
                          {" for incident #"}
                          {action.incident_id}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FaHistory size={40} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">No activity recorded yet</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Actions on emergencies will appear here
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      case "settings":
        return (
          <div className="space-y-4">
            {/* Profile Settings */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  Personal Information
                </h3>
                <button
                  onClick={() => setIsEditingPersonal(!isEditingPersonal)}
                  className="text-sm font-medium text-[#005524] hover:text-[#004d20]"
                >
                  {isEditingPersonal ? "Cancel" : "Edit"}
                </button>
              </div>
              <form className="space-y-4">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={personalInfo.name}
                    onChange={(e) =>
                      setPersonalInfo({ ...personalInfo, name: e.target.value })
                    }
                    disabled={!isEditingPersonal}
                    className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm p-2 ${!isEditingPersonal ? "bg-gray-100" : "bg-white"
                      }`}
                  />
                </div>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700"
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
                    className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm p-2 ${!isEditingPersonal ? "bg-gray-100" : "bg-white"
                      }`}
                  />
                </div>
                {isEditingPersonal && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      className="px-4 py-2 bg-[#005524] text-white rounded-lg hover:bg-[#004d20]"
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
                <h3 className="text-xl font-semibold text-gray-900">
                  Security
                </h3>
                <button
                  onClick={() => setIsEditingSecurity(!isEditingSecurity)}
                  className="text-sm font-medium text-[#005524] hover:text-[#004d20]"
                >
                  {isEditingSecurity ? "Cancel" : "Change Password"}
                </button>
              </div>
              <form className="space-y-4">
                {isEditingSecurity && (
                  <>
                    <div>
                      <label
                        htmlFor="currentPassword"
                        className="block text-sm font-medium text-gray-700"
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
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm p-2"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="newPassword"
                        className="block text-sm font-medium text-gray-700"
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
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm p-2"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="confirmPassword"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Confirm New Password
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
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm p-2"
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        className="px-4 py-2 bg-[#005524] text-white rounded-lg hover:bg-[#004d20]"
                      >
                        Change Password
                      </button>
                    </div>
                  </>
                )}
              </form>
            </div>

            {/* General Settings Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                General Settings
              </h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">
                      Notifications
                    </h4>
                    <p className="text-sm text-gray-600">
                      Enable/disable notifications
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      setNotificationsEnabled(!notificationsEnabled)
                    }
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${notificationsEnabled ? "bg-[#005524]" : "bg-gray-200"
                      }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-all duration-200 ${notificationsEnabled ? "translate-x-6" : "translate-x-1"
                        }`}
                    />
                  </button>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">
                      Email Notifications
                    </h4>
                    <p className="text-sm text-gray-600">
                      Receive email notifications for updates
                    </p>
                  </div>
                  <button
                    onClick={() => setEmailNotifications(!emailNotifications)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${emailNotifications ? "bg-[#005524]" : "bg-gray-200"
                      }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-all duration-200 ${emailNotifications ? "translate-x-6" : "translate-x-1"
                        }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <button className="px-6 py-3 bg-[#005524] text-white rounded-lg hover:bg-[#004d20] transition-colors font-medium">
                Save Changes
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-[#f8eed4]">
      {/* Sidebar */}
      <div
        className={`flex-shrink-0 transition-all duration-300 transform-gpu ${isSidebarCollapsed ? "w-16" : "w-64"
          } mx-4 my-4 p-2 rounded-2xl backdrop-blur-sm bg-white/75 border border-white/10 shadow-xl hover:-translate-y-1 hover:shadow-2xl`}
      >
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <img
              src={logoImage}
              alt="CALASAG Logo"
              className="h-8 w-auto object-contain"
            />
            {!isSidebarCollapsed && (
              <span className="text-xl font-bold text-gray-900"></span>
            )}
          </div>
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
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
                className={`relative flex items-center w-full text-left px-4 py-3 gap-3 rounded-r-full transition-all duration-200 text-sm font-medium ${activeTab === "dashboard" ? "bg-[#E7F6EE] text-[#005524]" : "text-gray-700 hover:bg-[#F1FAF4] hover:text-[#005524]"} ${isSidebarCollapsed ? "justify-center" : "justify-between"}`}
              >
                <span className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-r-full transition-all duration-200 ${activeTab === "dashboard" 
                  ? "bg-[#005524]" 
                  : "bg-transparent group-hover:bg-[#CDE6D3]"}`} />
                <div className="relative z-10 w-full">
                  <div className={`flex items-center gap-3 flex-1 ${isSidebarCollapsed ? 'justify-center' : ''}`}>
                    <FaHome size={18} />
                    {!isSidebarCollapsed && <span>Dashboard</span>}
                  </div>
                </div>
              </button>
            </li>

            <li>
              <div>
                <button
                  onClick={() => {
                    if (isSidebarCollapsed) {
                      setOpenSidebarDropdown("users-management");
                    } else {
                      setOpenSidebarDropdown(
                        openSidebarDropdown === "users-management"
                          ? null
                          : "users-management"
                      );
                    }
                  }}
                  className={`relative flex items-center w-full text-left px-4 py-3 gap-3 rounded-r-full transition-all duration-200 text-sm font-medium ${["users","total-users-list","active-users-list"].includes(activeTab) ? "bg-[#E7F6EE] text-[#005524]" : "text-gray-700 hover:bg-[#F1FAF4] hover:text-[#005524]"} ${isSidebarCollapsed ? "justify-center" : "justify-between"}`}
                >
                  <span
                    className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-r-full transition-all duration-200 ${["users", "total-users-list", "active-users-list"].includes(
                      activeTab
                    )
                      ? "bg-[#005524]"
                      : "bg-transparent group-hover:bg-[#CDE6D3]"
                      }`}
                  />
                  <div className="relative z-10 w-full">
                    <div className={`flex items-center gap-3 flex-1 ${isSidebarCollapsed ? 'justify-center' : ''}`}>
                      <FaUser size={18} />
                      {!isSidebarCollapsed && <span>Users Management</span>}
                    </div>
                  </div>
                  {!isSidebarCollapsed && (
                    <FaChevronDown
                      className={`transform transition-transform duration-200 ${openSidebarDropdown === "users-management" ? "rotate-180" : ""
                        }`}
                    />
                  )}
                </button>

                {openSidebarDropdown === "users-management" &&
                  !isSidebarCollapsed && (
                    <div className="ml-6 mt-2 space-y-1">
                      <button
                        onClick={() => setActiveTab("users")}
                        className={`w-full text-left px-3 py-2 rounded-l-full rounded-r-lg text-sm transition-colors duration-200 pl-6 ${activeTab === "users" ? "text-[#005524] font-medium bg-[#E7F6EE]" : "text-gray-600 hover:text-[#005524] hover:bg-[#F1FAF4]"}`}
                      >
                        Full User Table
                      </button>
                      <button
                        onClick={() => setActiveTab("total-users-list")}
                        className={`w-full text-left px-3 py-2 rounded-l-full rounded-r-lg text-sm transition-colors duration-200 pl-6 ${activeTab === "total-users-list" ? "text-[#005524] font-medium bg-[#E7F6EE]" : "text-gray-600 hover:text-[#005524] hover:bg-[#F1FAF4]"}`}
                      >
                        Total Users List
                      </button>
                      <button
                        onClick={() => setActiveTab("active-users-list")}
                        className={`w-full text-left px-3 py-2 rounded-l-full rounded-r-lg text-sm transition-colors duration-200 pl-6 ${activeTab === "active-users-list" ? "text-[#005524] font-medium bg-[#E7F6EE]" : "text-gray-600 hover:text-[#005524] hover:bg-[#F1FAF4]"}`}
                      >
                        Active Users List
                      </button>
                    </div>
                  )}
              </div>
            </li>

            <li>
              <button
                onClick={() => setActiveTab("emergencies")}
                className={`relative flex items-center gap-3 px-4 py-3 rounded-r-full transition-all duration-200 text-sm font-medium group
                            ${activeTab === "emergencies"
                    ? "bg-[#E7F6EE] text-[#005524]"
                    : "text-gray-700 hover:bg-[#F1FAF4] hover:text-[#005524]"
                  }
                            `}
              >
                <span
                  className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-r-full transition-all duration-200 ${activeTab === "emergencies"
                    ? "bg-[#005524]"
                    : "bg-transparent group-hover:bg-[#CDE6D3]"
                    }`}
                />
                <div className="relative flex items-center gap-3 z-10">
                  <FaBell size={18} />
                  {!isSidebarCollapsed && "Incident Reports"}
                </div>
              </button>
            </li>

            <li>
              <button
                onClick={() => setActiveTab("safety-tips")}
                className={`relative flex items-center gap-3 px-4 py-3 rounded-r-full transition-all duration-200 text-sm font-medium group
                            ${activeTab === "safety-tips"
                    ? "bg-[#E7F6EE] text-[#005524]"
                    : "text-gray-700 hover:bg-[#F1FAF4] hover:text-[#005524]"
                  }
                            `}
              >
                <span
                  className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-r-full transition-all duration-200 ${activeTab === "safety-tips"
                    ? "bg-[#005524]"
                    : "bg-transparent group-hover:bg-[#CDE6D3]"
                    }`}
                />
                <div className="relative flex items-center gap-3 z-10">
                  <FaFileAlt size={18} />
                  {!isSidebarCollapsed && "Safety Tips"}
                </div>
              </button>
            </li>

            <li>
              <button
                onClick={() => setActiveTab("activity-log")}
                className={`relative flex items-center gap-3 px-4 py-3 rounded-r-full transition-all duration-200 text-sm font-medium group
                            ${activeTab === "activity-log"
                    ? "bg-[#E7F6EE] text-[#005524]"
                    : "text-gray-700 hover:bg-[#F1FAF4] hover:text-[#005524]"
                  }
                            `}
              >
                <span
                  className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-r-full transition-all duration-200 ${activeTab === "activity-log"
                    ? "bg-[#005524]"
                    : "bg-transparent group-hover:bg-[#CDE6D3]"
                    }`}
                />
                <div className="relative flex items-center gap-3 z-10">
                  <FaHistory size={18} />
                  {!isSidebarCollapsed && "Activity Log"}
                </div>
              </button>
            </li>

            <li>
              <button
                onClick={() => setActiveTab("settings")}
                className={`relative flex items-center gap-3 px-4 py-3 rounded-r-full transition-all duration-200 text-sm font-medium group
                            ${activeTab === "settings"
                    ? "bg-[#E7F6EE] text-[#005524]"
                    : "text-gray-700 hover:bg-[#F1FAF4] hover:text-[#005524]"
                  }
                            `}
              >
                <span
                  className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-r-full transition-all duration-200 ${activeTab === "settings"
                    ? "bg-[#005524]"
                    : "bg-transparent group-hover:bg-[#CDE6D3]"
                    }`}
                />
                <div className="relative flex items-center gap-3 z-10">
                  <FaCog size={18} />
                  {!isSidebarCollapsed && "Settings"}
                </div>
              </button>
            </li>
          </ul>
        </nav>

  <div className="p-4 border-t border-transparent" />
      </div>

      {/* Main Content */}
        <div className="flex-1 flex flex-col transition-all duration-300">
        {/* Top Navigation Bar - rounded inline */}
        <header className="mx-1 my-4 p-2 rounded-2xl bg-white/80 backdrop-blur-sm border border-white/10 shadow-lg flex items-center justify-between">
            <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="md:hidden text-gray-400 hover:text-gray-600 transition-colors"
            >
              <FaChevronRight size={16} />
            </button>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Dashboard</span>
              <FaChevronRight size={12} />
              <span className="text-gray-900 font-medium">
                {activeTab === "users" && "User Management"}
                {activeTab === "emergencies" && "Emergency Reports"}
                {activeTab === "safety-tips" && "Safety Tips"}
                {activeTab === "settings" && "Settings"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications((prev) => !prev)}
                className="text-gray-500 hover:text-green-700 hover:bg-gray-100 rounded-lg p-2 transition-colors relative"
              >
                <FaBell size={18} />
                {notificationsList.some((n) => !n.read) && (
                  <span className="absolute -top-1 -right-1 block h-2 w-2 rounded-full bg-red-500"></span>
                )}
              </button>
              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Notifications
                      </h3>
                      <button
                        onClick={async () => {
                          const unreadIds = notificationsList
                            .filter((n) => !n.read)
                            .map((n) => n.id);
                          if (unreadIds.length === 0) return;
                          const { error } = await supabase
                            .from("notifications")
                            .update({ read: true })
                            .in("id", unreadIds)
                            .eq("user_id", currentUser.id);
                          if (error) {
                            alert(`Error: ${error.message}`);
                          } else {
                            setNotificationsList((prev) =>
                              prev.map((n) => ({ ...n, read: true }))
                            );
                          }
                        }}
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        Mark all as read
                      </button>
                    </div>
                    <div className="flex border-b border-gray-200 mt-2">
                      <button
                        onClick={() => setNotificationTab("unread")}
                        className={`flex-1 py-2 text-sm font-medium ${notificationTab === "unread"
                          ? "border-b-2 border-[#005524] text-[#005524]"
                          : "text-gray-500 hover:text-gray-700"
                          }`}
                      >
                        Unread
                      </button>
                      <button
                        onClick={() => setNotificationTab("all")}
                        className={`flex-1 py-2 text-sm font-medium ${notificationTab === "all"
                          ? "border-b-2 border-[#005524] text-[#005524]"
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
                          className={`px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors ${notification.read ? "bg-gray-50" : "bg-white"
                            }`}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <p
                                className={`text-sm ${notification.read
                                  ? "text-gray-600"
                                  : "text-gray-800 font-medium"
                                  }`}
                              >
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {notification.time}
                              </p>
                            </div>
                            {!notification.read && (
                              <button
                                onClick={async () => {
                                  const { error } = await supabase
                                    .from("notifications")
                                    .update({ read: true })
                                    .eq("id", notification.id)
                                    .eq("user_id", currentUser.id);
                                  if (error) {
                                    alert(`Error: ${error.message}`);
                                  } else {
                                    setNotificationsList((prev) =>
                                      prev.map((n) =>
                                        n.id === notification.id
                                          ? { ...n, read: true }
                                          : n
                                      )
                                    );
                                  }
                                }}
                                className="ml-2 text-xs text-blue-600 hover:underline"
                              >
                                Mark as read
                              </button>
                            )}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                  {notificationsList.length === 0 && (
                    <div className="px-4 py-3 text-center text-gray-500">
                      No new notifications
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Profile */}
            <div className="relative">
              <button
                onClick={() => setIsProfileDropdownOpen((s) => !s)}
                className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none"
              >
                {currentUser && (
                  <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                      currentUser?.name || "A"
                    )}&background=005524&color=fff`}
                    alt="avatar"
                    className="w-8 h-8 rounded-full border border-gray-200"
                  />
                )}
                <span className="hidden md:inline text-gray-700 font-medium">
                  {currentUser?.name || "Loading..."}
                </span>
                <FaChevronDown size={12} />
              </button>

              {isProfileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-100 py-2 z-50">
                  <button
                    onClick={() => {
                      setActiveTab("settings");
                      setIsProfileDropdownOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Profile Settings
                  </button>
                  <button
                    onClick={() => {
                      setShowLogoutConfirm(true);
                      setIsProfileDropdownOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                  >
                    Log Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content Area */}
  <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto">{renderContent()}</div>
        </main>
      </div>

      {/* Emergency Details Modal */}
      {showEmergencyDetails && selectedEmergency && (
        <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold text-[#005524] mb-4">
              Emergency Details
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-700">Title</h3>
                <p className="text-gray-600">{selectedEmergency.title}</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-700">Message</h3>
                <p className="text-gray-600">
                  {selectedEmergency.message || "-"}
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-700">Location</h3>
                <p className="text-gray-600">
                  {selectedEmergency.location || "-"}
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-700">Severity</h3>
                {isEditingEmergency ? (
                  <select
                    value={editedEmergency.severity}
                    onChange={(e) =>
                      setEditedEmergency({
                        ...editedEmergency,
                        severity: e.target.value as
                          | "low"
                          | "medium"
                          | "high"
                          | "critical",
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#005524]"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                ) : (
                  <p className="text-gray-600">{selectedEmergency.severity}</p>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-gray-700">Status</h3>
                {isEditingEmergency ? (
                  <select
                    value={editedEmergency.status}
                    onChange={(e) =>
                      setEditedEmergency({
                        ...editedEmergency,
                        status: e.target.value as
                          | "pending"
                          | "reviewing"
                          | "resolved",
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#005524]"
                  >
                    <option value="pending">Pending</option>
                    <option value="reviewing">Reviewing</option>
                    <option value="resolved">Resolved</option>
                  </select>
                ) : (
                  <p className="text-gray-600">{selectedEmergency.status}</p>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-gray-700">Reported By</h3>
                <p className="text-gray-600">
                  {selectedEmergency.reportedBy || "-"}
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-4">
              {!isEditingEmergency ? (
                <>
                  {selectedEmergency.severity === "critical" && (
                    <button
                      onClick={() =>
                        handleIncidentAction(selectedEmergency.id, "escalate")
                      }
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      Escalate to Authorities
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setEditedEmergency({
                        severity:
                          selectedEmergency.severity === "Not Set"
                            ? "medium"
                            : (selectedEmergency.severity as
                              | "low"
                              | "medium"
                              | "high"
                              | "critical"),
                        status:
                          selectedEmergency.status === "Not Set"
                            ? "pending"
                            : (selectedEmergency.status as
                              | "pending"
                              | "reviewing"
                              | "resolved"),
                      });
                      setIsEditingEmergency(true);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setShowEmergencyDetails(false)}
                    className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200"
                  >
                    Close
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleSaveEmergencyEdit}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setIsEditingEmergency(false)}
                    className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200"
                    type="button"
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Safety Tip Modal */}
      {showSafetyTipModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold text-[#005524] mb-4">
              Add Safety Tip
            </h2>
            <form onSubmit={handleAddSafetyTip} className="space-y-4">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={newSafetyTip.name}
                  onChange={(e) =>
                    setNewSafetyTip({ ...newSafetyTip, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#005524]"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Content
                </label>
                <textarea
                  value={newSafetyTip.content}
                  onChange={(e) =>
                    setNewSafetyTip({
                      ...newSafetyTip,
                      content: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#005524]"
                  rows={4}
                  required
                />
              </div>
              {/* Icon dropdown selection */}
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Icon (optional)
                </label>
                <select
                  value={newSafetyTip.icon || ""}
                  onChange={e => setNewSafetyTip({ ...newSafetyTip, icon: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#005524]"
                >
                  <option value="">Select an icon</option>
                  <option value="FaShieldAlt">Shield</option>
                  <option value="FaFirstAid">First Aid</option>
                  <option value="FaFireExtinguisher">Fire Extinguisher</option>
                  <option value="FaBell">Bell</option>
                  <option value="FaExclamationTriangle">Warning</option>
                  <option value="FaInfoCircle">Info</option>
                  <option value="FaUserShield">User Shield</option>
                  <option value="FaHeartbeat">Heartbeat</option>
                  <option value="FaAmbulance">Ambulance</option>
                  <option value="FaHandsHelping">Helping Hands</option>
                </select>
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowSafetyTipModal(false);
                    setNewSafetyTip({ name: "", content: "" });
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#005524] text-white rounded-lg hover:bg-[#004015]"
                >
                  Add Tip
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Safety Tip Details Modal */}
      {showSafetyTipDetails && selectedSafetyTip && (
        <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold text-[#005524] mb-4">
              Safety Tip Details
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-700">Title</h3>
                {isEditingSafetyTip ? (
                  <input
                    type="text"
                    value={editedSafetyTip?.name || ""}
                    onChange={(e) =>
                      setEditedSafetyTip({
                        ...editedSafetyTip!,
                        name: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#005524]"
                  />
                ) : (
                  <p className="text-gray-600">{selectedSafetyTip.name}</p>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-gray-700">Content</h3>
                {isEditingSafetyTip ? (
                  <textarea
                    value={editedSafetyTip?.content || ""}
                    onChange={(e) =>
                      setEditedSafetyTip({
                        ...editedSafetyTip!,
                        content: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#005524]"
                    rows={4}
                  />
                ) : (
                  <p className="text-gray-600">{selectedSafetyTip.content}</p>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-gray-700">Icon</h3>
                {isEditingSafetyTip ? (
                  <input
                    type="text"
                    value={editedSafetyTip?.icon || ""}
                    onChange={(e) =>
                      setEditedSafetyTip({
                        ...editedSafetyTip!,
                        icon: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#005524]"
                  />
                ) : (
                  <p className="text-gray-600">
                    {selectedSafetyTip.icon || "â€”"}
                  </p>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-gray-700">Date</h3>
                <p className="text-gray-600">
                  {(selectedSafetyTip.created_at || "")
                    .toString()
                    .substring(0, 10)}
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-4">
              {isEditingSafetyTip ? (
                <>
                  <button
                    type="button"
                    onClick={handleSaveSafetyTipEdit}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setIsEditingSafetyTip(false)}
                    className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200"
                    type="button"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      // This should not be called for emergencies
                      setEditedSafetyTip({ ...selectedSafetyTip });
                      setIsEditingSafetyTip(true);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      setShowSafetyTipDetails(false);
                      setSelectedSafetyTip(null);
                    }}
                    className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200"
                  >
                    Close
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-lg border border-gray-200">
            <h2 className="text-2xl font-bold text-[#005524] mb-4">
              Confirm Logout
            </h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to logout?
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-[#005524] text-white rounded-lg hover:bg-[#004015]"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {showUserDetails && selectedUser && (
        <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold text-[#005524] mb-4">
              User Details
            </h2>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 rounded-full bg-[#f9a01b] flex items-center justify-center text-white text-2xl font-bold">
                  {selectedUser.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{selectedUser.name}</h3>
                  <p className="text-gray-500">{selectedUser.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {accountBadge(selectedUser.status)}
                {presenceBadge(selectedUser.onlineStatus)}
              </div>
              <div>
                <h3 className="font-semibold text-gray-700">Last Login</h3>
                <p className="text-gray-600">{selectedUser.lastLogin}</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-700">Total Reports</h3>
                <p className="text-gray-600">{selectedUser.reports}</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-4">
              <button
                onClick={() => handleToggleUserStatus(selectedUser.id)}
                className={`px-4 py-2 rounded-lg ${selectedUser.status === "active"
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : "bg-green-600 text-white hover:bg-green-700"
                  }`}
              >
                {selectedUser.status === "active"
                  ? "Deactivate User"
                  : "Activate User"}
              </button>
              <button
                onClick={() => setShowUserDetails(false)}
                className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;