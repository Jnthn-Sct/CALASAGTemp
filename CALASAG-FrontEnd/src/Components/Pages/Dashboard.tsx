import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaHome,
  FaBell,
  FaUser,
  FaCog,
  FaSignOutAlt,
  FaSearch,
  FaMapMarkerAlt,
  FaPhone,
  FaExclamationTriangle,
  FaCheck,
  FaCheckDouble,
  FaTimes,
  FaEnvelope,
  FaInfoCircle,
  FaFire,
  FaShieldAlt,
  FaCarCrash,
  FaAmbulance,
  FaUserPlus,
  FaUserMinus,
  FaEdit,
  FaArrowLeft,
  FaChevronDown,
  FaPaperPlane,
  FaEye,
} from "react-icons/fa";
import logoImage from "../Images/nobg-logo.png";
import mapImage from "../Images/ph-map.png";
import { supabase } from "../../db";
import CryptoJS from "crypto-js";

const secretKey = import.meta.env.VITE_ENCRYPTION_KEY;
import { FaHouseFloodWater } from "react-icons/fa6";

// Interfaces
interface Location {
  lat: number;
  lng: number;
}

interface Emergency {
  id: number;
  name: string;
  avatar: string | null;
  emergency_type: string;
  message: string;
  location: Location;
  created_at: string;
  user_id: string;
}

interface Connection {
  id: number;
  name: string;
  avatar: string | null;
  connected_user_id: string;
  is_online?: boolean;
}

interface ConnectionRequest {
  id: number;
  sender_id: string;
  recipient_id: string;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
  sender_name: string;
  sender_avatar: string | null;
}

interface SafetyTip {
  id: number;
  name: string;
  content: string;
  icon: string;
}

interface Notification {
  id: number;
  user_id: string;
  type: string;
  notification_type?: string;
  message: string;
  read: boolean;
  created_at: string;
}

interface Message {
  id: number;
  sender_id: string;
  receiver_id: string;
  content: string;
  timestamp: string;
  sender_name: string;
  receiver_name: string;
}

interface CrisisAlert {
  id: number;
  type: string;
  reporter: string;
  is_self: boolean;
  created_at: string;
  location: Location;
  responded_safe?: boolean;
  related_crisis_id?: number;
  user_id?: string;
  marked_safe_users?: { user_id: string; name: string }[];
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string | null;
  first_name?: string;
}

interface SearchResult {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  connectionStatus?: "connected" | "request_sent" | "request_received" | null;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeUser, setActiveUser] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>("home");
  const [showMessages, setShowMessages] = useState<boolean>(false);
  const [showReport, setShowReport] = useState<boolean>(false);
  const [showProfileMenu, setShowProfileMenu] = useState<boolean>(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState<boolean>(false);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [showProfile, setShowProfile] = useState<boolean>(false);
  const [showEditProfile, setShowEditProfile] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showLocationView, setShowLocationView] = useState<boolean>(false);
  const [showConnectionOptions, setShowConnectionOptions] = useState<boolean>(false);
  const [showConnectionRequestsMenu, setShowConnectionRequestsMenu] = useState<boolean>(false);
  const [showCrisisModal, setShowCrisisModal] = useState<boolean>(false);
  const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [selectedEmergency, setSelectedEmergency] = useState<Emergency | null>(null);
  const [showCallConfirm, setShowCallConfirm] = useState<boolean>(false);
  const [showReportConfirm, setShowReportConfirm] = useState<boolean>(false);
  const [showAlertConfirm, setShowAlertConfirm] = useState<boolean>(false);
  const [selectedAlertType, setSelectedAlertType] = useState<string | null>(null);
  const [selectedEmergencyForAction, setSelectedEmergencyForAction] = useState<Emergency | null>(null);
  const [selectedCrisisAlert, setSelectedCrisisAlert] = useState<CrisisAlert | null>(null);
  const [originalCrisisType, setOriginalCrisisType] = useState<string>("Emergency");
  const [isSafe, setIsSafe] = useState<boolean>(false);
  const [crisisAlert, setCrisisAlert] = useState<CrisisAlert | null>(null);
  const [crisisAlerts, setCrisisAlerts] = useState<CrisisAlert[]>([]);
  const [userSafeAlerts, setUserSafeAlerts] = useState<CrisisAlert[]>([]);
  const [pendingCrisisAlerts, setPendingCrisisAlerts] = useState<CrisisAlert[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentChatRecipient, setCurrentChatRecipient] = useState<string>("");
  const [showChatList, setShowChatList] = useState<boolean>(true);
  const [messageText, setMessageText] = useState("");
  const [messageSent, setMessageSent] = useState(false);
  const [showSafetyTipModal, setShowSafetyTipModal] = useState<boolean>(false);
  const [selectedSafetyTip, setSelectedSafetyTip] = useState<SafetyTip | null>(null);
  const [emergencies, setEmergencies] = useState<Emergency[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [connectionRequests, setConnectionRequests] = useState<ConnectionRequest[]>([]);
  const [safetyTips, setSafetyTips] = useState<SafetyTip[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [deviceStatus, setDeviceStatus] = useState<"Active" | "Inactive">("Active");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [errorTimeoutId, setErrorTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const [successTimeoutId, setSuccessTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const [userLocation, setUserLocation] = useState<Location>({
    lat: 14.5995,
    lng: 120.9842,
  });
  const [emergencyFilter, setEmergencyFilter] = useState<"nearby" | "all">("nearby");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSearchResults, setShowSearchResults] = useState<boolean>(false);
  const [selectedSearchProfile, setSelectedSearchProfile] = useState<SearchResult | null>(null);
  const [editProfileData, setEditProfileData] = useState<Partial<UserProfile>>({});
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  // Separate page states for different sections
  const [emergencyPage, setEmergencyPage] = useState<number>(1);
  const [safeAlertsPage, setSafeAlertsPage] = useState<number>(1);
  const [pendingAlertsPage, setPendingAlertsPage] = useState<number>(1);
  const [notificationTab, setNotificationTab] = useState<"unread" | "all">(
    "unread"
  );
  const alertsPerPage = 4;
  const emergenciesPerPage = 6;
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Theme utility functions
  const getThemeClasses = () => {
    const isDark = theme === "dark";
    return {
      background: isDark ? "bg-gray-900" : "bg-[#FAFAFA]",
      cardBackground: isDark ? "bg-gray-800" : "bg-white",
      textPrimary: isDark ? "text-white" : "text-[#2B2B2B]",
      textSecondary: isDark ? "text-gray-300" : "text-gray-600",
      textTertiary: isDark ? "text-gray-400" : "text-gray-500",
      border: isDark ? "border-gray-600" : "border-gray-200",
      hover: isDark ? "hover:bg-gray-700" : "hover:bg-gray-50",
      input: isDark ? "bg-gray-700 text-white border-gray-600" : "bg-gray-50 text-gray-900 border-gray-100",
      modal: isDark ? "bg-gray-800" : "bg-white",
      navbar: isDark ? "bg-gray-900 border-gray-700" : "bg-[#FAFAFA] border-gray-300",
      deviceCard: isDark ? "bg-gray-800" : "bg-[#2B2B2B]",
      deviceCardText: isDark ? "text-white" : "text-white",
      connectionCard: isDark ? "bg-gray-800" : "bg-white",
      welcomeCard: isDark ? "bg-gray-800" : "bg-gradient-to-br from-[#649b95] to-[#649b95]",
      emergencyCard: isDark ? "bg-gray-800" : "bg-white",
      reportCard: isDark ? "bg-gray-800" : "bg-white",
      messageCard: isDark ? "bg-gray-800" : "bg-white",
      alertCard: isDark ? "bg-gray-800" : "bg-white",
      searchDropdown: isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100",
      notificationDropdown: isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100",
      connectionRequestDropdown: isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100",
      profileDropdown: isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100",
      chatBackground: isDark ? "bg-gray-700" : "bg-gray-50",
      messageBubble: isDark ? "bg-gray-600" : "bg-gray-200",
      messageBubbleOwn: isDark ? "bg-[#4ECDC4]" : "bg-[#4ECDC4]",
      buttonSecondary: isDark ? "bg-gray-700 hover:bg-gray-600 text-white" : "bg-gray-200 hover:bg-gray-300 text-gray-900",
    };
  };

  const themeClasses = getThemeClasses();

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
  const iconMap: { [key: string]: React.ElementType | undefined } = {
    FaAmbulance,
    FaInfoCircle,
    FaFire,
    FaCarCrash,
    FaShieldAlt,
  };


  // Memoized combined safe alerts list
  const allSafeAlerts = useMemo(() => {
    const combined = [...userSafeAlerts, ...crisisAlerts];
    // Remove duplicates by ID and sort
    const uniqueAlerts = Array.from(new Map(combined.map(alert => [alert.id, alert])).values());
    return uniqueAlerts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [userSafeAlerts, crisisAlerts]);

  // Memoized unread notification count
  const unreadNotifications = useMemo(
    () => notifications.filter((n) => !n.read),
    [notifications]
  );
  // Calculate total pages and current page alerts for safe alerts
  const totalSafePages = Math.ceil(allSafeAlerts.length / alertsPerPage);
  const indexOfLastSafeAlert = safeAlertsPage * alertsPerPage;
  const indexOfFirstSafeAlert = indexOfLastSafeAlert - alertsPerPage;
  const currentSafeAlerts = allSafeAlerts.slice(indexOfFirstSafeAlert, indexOfLastSafeAlert);

  // Calculate total pages and current page alerts for pending alerts
  const totalPendingPages = Math.ceil(pendingCrisisAlerts.length / alertsPerPage);
  const indexOfLastPendingAlert = pendingAlertsPage * alertsPerPage;
  const indexOfFirstPendingAlert = indexOfLastPendingAlert - alertsPerPage;
  const currentPendingAlerts = pendingCrisisAlerts.slice(indexOfFirstPendingAlert, indexOfLastPendingAlert);

  // Handle page changes for different sections
  // Helper functions for auto-dismiss messages
  const setAutoDismissError = (message: string) => {
    // Clear existing timeout
    if (errorTimeoutId) {
      clearTimeout(errorTimeoutId);
    }

    setError(message);

    // Set new timeout to clear error after 5 seconds
    const timeoutId = setTimeout(() => {
      setError(null);
      setErrorTimeoutId(null);
    }, 5000);

    setErrorTimeoutId(timeoutId);
  };

  const setAutoDismissSuccess = (message: string) => {
    // Clear existing timeout
    if (successTimeoutId) {
      clearTimeout(successTimeoutId);
    }

    setSuccess(message);

    // Set new timeout to clear success after 5 seconds
    const timeoutId = setTimeout(() => {
      setSuccess(null);
      setSuccessTimeoutId(null);
    }, 5000);

    setSuccessTimeoutId(timeoutId);
  };

  const handleEmergencyPageChange = (pageNumber: number) => {
    setEmergencyPage(pageNumber);
  };

  const handleSafeAlertsPageChange = (pageNumber: number) => {
    setSafeAlertsPage(pageNumber);
  };

  const handlePendingAlertsPageChange = (pageNumber: number) => {
    setPendingAlertsPage(pageNumber);
  };

  const randomLocation = (centerLat: number, centerLng: number, radiusKm: number): Location => {
    const r = radiusKm / 111;
    const u = Math.random();
    const v = Math.random();
    const w = r * Math.sqrt(u);
    const t = 2 * Math.PI * v;
    const x = w * Math.cos(t);
    const y = w * Math.sin(t);
    const newLat = centerLat + y;
    const newLng = centerLng + x / Math.cos((centerLat * Math.PI) / 180);
    return { lat: newLat, lng: newLng };
  };

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, currentChatRecipient]);

  const fetchAllUsers = async (): Promise<SearchResult[]> => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("user_id, name, email, avatar");
      if (error) throw new Error(`Users fetch error: ${error.message}`);
      return (data || []).map(user => ({
        id: user.user_id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        connectionStatus: null
      }));
    } catch (error: any) {
      console.error("Error fetching users:", error);
      setAutoDismissError(`Failed to fetch users: ${error.message}`);
      return [];
    }
  };

  const fetchUserConnections = async (userId: string): Promise<SearchResult[]> => {
    try {
      // First, get all connections for the user
      const { data: connectionsData, error: connectionsError } = await supabase
        .from("connections")
        .select("user1_id, user2_id")
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

      if (connectionsError) throw new Error(`Connections fetch error: ${connectionsError.message}`);

      if (!connectionsData || connectionsData.length === 0) {
        return [];
      }

      // Extract all unique user IDs from connections
      const connectionUserIds = new Set<string>();
      connectionsData.forEach((connection) => {
        if (connection.user1_id !== userId) {
          connectionUserIds.add(connection.user1_id);
        }
        if (connection.user2_id !== userId) {
          connectionUserIds.add(connection.user2_id);
        }
      });

      // Fetch user details for all connection IDs
      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("user_id, name, email, avatar")
        .in("user_id", Array.from(connectionUserIds));

      if (usersError) throw new Error(`Users fetch error: ${usersError.message}`);

      // Convert to SearchResult format
      const connections: SearchResult[] = (usersData || []).map((user) => ({
        id: user.user_id,
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      }));

      return connections;
    } catch (error: any) {
      console.error("Error fetching user connections:", error);
      setAutoDismissError(`Failed to fetch connections: ${error.message}`);
      return [];
    }
  };

  const getCrisisType = async (crisisId: number | null | undefined): Promise<string> => {
    if (!crisisId) return "general";

    try {
      const { data: crisisData, error } = await supabase
        .from("crisis_alerts")
        .select("type")
        .eq("id", crisisId)
        .single();

      if (error) {
        console.error("Error fetching crisis type:", error);
        return "general";
      }

      return crisisData?.type || "general";
    } catch (error) {
      console.error("Error fetching crisis type:", error);
      return "general";
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length < 1) {
      setSearchResults([]);
      // Keep panel open while typing; just clear results for short queries
      return;
    }
    try {
      const { data, error } = await supabase
        .from("users")
        .select("user_id, name, email, avatar")
        .ilike("name", `%${query}%`)
        .neq("user_id", userProfile?.id);

      if (error) throw new Error(`Search error: ${error.message}`);

      if (!data) {
        setSearchResults([]);
        setShowSearchResults(true);
        return; // Early exit if no users are found
      }

      // Get IDs of search results
      const userIds = data.map(user => user.user_id);

      // Fetch pending connection requests involving the current user and the search results
      const { data: requests, error: requestError } = await supabase
        .from('connection_requests')
        .select('sender_id, recipient_id, status')
        .in('status', ['pending'])
        .or(`sender_id.in.(${userIds.join(',')}),recipient_id.in.(${userIds.join(',')})`)
        .or(`sender_id.eq.${userProfile?.id},recipient_id.eq.${userProfile?.id}`);

      if (requestError) console.error('Error fetching connection requests:', requestError);

      const sentRequestIds = new Set(requests?.filter(req => req.sender_id === userProfile?.id).map(req => req.recipient_id) || []);
      const receivedRequestIds = new Set(requests?.filter(req => req.recipient_id === userProfile?.id).map(req => req.sender_id) || []);

      const resultsWithStatus = data.map((user) => ({
        id: user.user_id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        connectionStatus: isConnected(user.user_id)
          ? 'connected' as const
          : sentRequestIds.has(user.user_id)
            ? 'request_sent' as const
            : receivedRequestIds.has(user.user_id)
              ? 'request_received' as const
              : null
      }));

      setSearchResults(resultsWithStatus);
      setShowSearchResults(true);
    } catch (error: any) {
      console.error("Error searching users:", error);
      setAutoDismissError(`Failed to search users: ${error.message}`);
    }
  };
  const getConnectedSafeUsers = (markedSafeUsers: { user_id: string; name: string }[] | undefined): string[] => {
    if (!markedSafeUsers || !connections) return [];
    return markedSafeUsers
      .filter((safeUser) =>
        connections.some((connection) => connection.connected_user_id === safeUser.user_id)
      )
      .map((safeUser) => safeUser.name)
      .filter((name, index, self) => self.indexOf(name) === index); // Remove duplicates
  };

  const handleSendConnectionRequest = async (recipientId: string) => {
    try {
      if (!recipientId) {
        throw new Error("Recipient ID is missing");
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user");

      // Check for any existing request regardless of status
      const { data: anyRequest } = await supabase
        .from("connection_requests")
        .select("*")
        .eq("sender_id", user.id)
        .eq("recipient_id", recipientId);

      // If there's a rejected request, delete it to allow resending
      if (anyRequest && anyRequest.length > 0) {
        const rejectedRequest = anyRequest.find(req => req.status === "rejected");
        const pendingRequest = anyRequest.find(req => req.status === "pending");

        if (pendingRequest) {
          setAutoDismissError("Connection request already pending.");
          return;
        }

        if (rejectedRequest) {
          const { error: deleteError } = await supabase
            .from("connection_requests")
            .delete()
            .eq("id", rejectedRequest.id);

          if (deleteError) {
            throw new Error(`Failed to clear previous request: ${deleteError.message}`);
          }
        }
      }

      const { data: existingConnection } = await supabase
        .from("connections")
        .select("*")
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .or(`user1_id.eq.${recipientId},user2_id.eq.${recipientId}`)
        .single();

      if (existingConnection) {
        setAutoDismissError("You are already connected with this user.");
        return;
      }

      const newRequest = {
        sender_id: user.id,
        recipient_id: recipientId,
        status: "pending",
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("connection_requests")
        .insert(newRequest);
      if (error) throw new Error(`Connection request error: ${error.message}`);

      const { data: senderData } = await supabase
        .from("users")
        .select("name")
        .eq("user_id", user.id)
        .single();

      const { data: recipientData } = await supabase
        .from("users")
        .select("name")
        .eq("user_id", recipientId)
        .single();

      // Use RPC function to insert notification to bypass RLS
      const { error: notifError } = await supabase.rpc("create_notification", {
        recipient_id: recipientId,
        notif_type: "connection_request",
        notif_message: `${userProfile?.name} has sent you a connection request.`,
        sender_id: user.id,
      });

      if (notifError) {
        console.error("Notification error:", notifError);
      }


      setError(null);
      setShowProfile(false);
      setShowSearchResults(false);
      setSearchQuery("");
      setAutoDismissSuccess("Connection request sent successfully!");

      // Update UI to show "Connection Request Sent" status
      if (selectedSearchProfile && selectedSearchProfile.id === recipientId) {
        setSelectedSearchProfile({
          ...selectedSearchProfile,
          connectionStatus: "request_sent"
        });
      }
    } catch (error: any) {
      console.error("Error sending connection request:", error);
      setError(
        error.message === "Recipient ID is missing"
          ? "Cannot send connection request: No user selected."
          : `Failed to send connection request: ${error.message}`
      );
    }
  };

  const handleRemoveConnection = async (userId: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user");

      // This is correct for your table structure. It deletes the record
      // regardless of who initiated the connection.
      const { error: deleteError } = await supabase
        .from("connections")
        .delete()
        .or(
          `and(user1_id.eq.${user.id},user2_id.eq.${userId}),and(user1_id.eq.${userId},user2_id.eq.${user.id})`
        );

      if (deleteError) {
        throw new Error(`Failed to remove connection: ${deleteError.message}`);
      }

      // Update the connections list
      setConnections(connections.filter(conn => conn.connected_user_id !== userId));

      // Update the search results if the user is in the search results
      if (searchResults.length > 0) {
        setSearchResults(searchResults.map(profile =>
          profile.id === userId
            ? { ...profile, connectionStatus: null }
            : profile
        ));
      }

      // Update the selected profile if it's the one we're removing connection from
      if (selectedSearchProfile && selectedSearchProfile.id === userId) {
        setSelectedSearchProfile({
          ...selectedSearchProfile,
          connectionStatus: null
        });
      }

      // Close the profile view
      setShowProfile(false);

      // Show success message
      setAutoDismissSuccess("Connection removed successfully");
    } catch (error: any) {
      console.error("Error removing connection:", error);
      setAutoDismissError(`Failed to remove connection: ${error.message}`);
    }
  };

  const handleConnectionRequestAction = async (
    requestId: number,
    action: "accepted" | "rejected"
  ) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user");

      const { data: requestData } = await supabase
        .from("connection_requests")
        .select("sender_id, recipient_id")
        .eq("id", requestId)
        .single();

      if (!requestData) throw new Error("Connection request not found");

      const { error } = await supabase
        .from("connection_requests")
        .update({ status: action })
        .eq("id", requestId)
        .eq("recipient_id", user.id);
      if (error)
        throw new Error(`Connection request update error: ${error.message}`);

      // Remove the request from the UI immediately
      setConnectionRequests((prev) =>
        prev.filter((req) => req.id !== requestId)
      );

      // Close the connection requests menu if there are no more requests
      if (connectionRequests.length <= 1) {
        setShowConnectionRequestsMenu(false);
      }

      if (action === "accepted") {
        const { data: senderData } = await supabase
          .from("users")
          .select("name, avatar, user_id")
          .eq("user_id", requestData.sender_id)
          .single();
        const { data: recipientData } = await supabase
          .from("users")
          .select("name")
          .eq("user_id", requestData.recipient_id)
          .single();

        // Create notification for the current user (the one who accepted)
        const { error: selfNotificationError } = await supabase.rpc(
          "create_notification",
          {
            recipient_id: user.id,
            notification_type: "connection_accepted",
            message_text: `You are now connected with ${senderData?.name || "User"}.`,
            sender_id: requestData.sender_id,
          }
        );
        if (selfNotificationError) {
          console.error("Self-notification error:", selfNotificationError);
        }
        // Send notification to the sender that their request was accepted
        const { error: notificationError } = await supabase
          .rpc('create_notification', {
            recipient_id: requestData.sender_id,
            notification_type: "connection_accepted",
            message_text: `${recipientData?.name || "User"
              } accepted your connection request.`,
            sender_id: user.id
          });

        if (notificationError) {
          console.error("Notification error:", notificationError);
        }

        const newConnection = {
          user1_id:
            user.id < requestData.sender_id ? user.id : requestData.sender_id,
          user2_id:
            user.id < requestData.sender_id ? requestData.sender_id : user.id,
          created_at: new Date().toISOString(),
        };
        const { error: connectionError } = await supabase
          .from("connections")
          .insert(newConnection);
        if (connectionError) {
          throw new Error(
            `Connection insertion error: ${connectionError.message}`
          );
        }

        const { data: connectionsData, error: connectionsError } =
          await supabase
            .from("connections")
            // Corrected to fetch bidirectionally
            .select("id, user1_id, user2_id")
            .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);
        if (connectionsError) {
          throw new Error(
            `Connections fetch error: ${connectionsError.message}`
          );
        }

        const formattedConnections: Connection[] = [];
        for (const conn of connectionsData || []) {
          const isUser1 = conn.user1_id === user.id;
          const connectedUserId = isUser1 ? conn.user2_id : conn.user1_id;
          const { data: connectedUser, error: userError } = await supabase
            .from("users")
            .select("name, avatar")
            .eq("user_id", connectedUserId)
            .single();
          if (userError) {
            console.error(
              `Error fetching user ${connectedUserId}:`,
              userError
            );
            continue;
          }
          formattedConnections.push({
            id: conn.id,
            name: connectedUser?.name || "Unknown User",
            avatar: connectedUser?.avatar || null,
            connected_user_id: connectedUserId,
            is_online: false,
          });
        }
        setConnections(formattedConnections);
      }
    } catch (error: any) {
      console.error(`Error ${action} connection request:`, error);
      setAutoDismissError(`Failed to ${action} connection request: ${error.message}`);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setAutoDismissError('Please select an image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setAutoDismissError('File size must be less than 5MB');
        return;
      }

      setSelectedFile(file);

      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const uploadImageToSupabase = async (file: File): Promise<string> => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user");

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(filePath, file);

      if (uploadError) throw new Error(`Upload error: ${uploadError.message}`);

      const { data: { publicUrl } } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  const handleEditProfile = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user");

      let avatarUrl = editProfileData.avatar || userProfile?.avatar;

      // Upload new image if selected
      if (selectedFile) {
        avatarUrl = await uploadImageToSupabase(selectedFile);
      }

      const { error } = await supabase
        .from("users")
        .update({
          name: editProfileData.name || userProfile?.name,
          avatar: avatarUrl,
        })
        .eq("user_id", user.id);
      if (error) throw new Error(`Profile update error: ${error.message}`);

      setUserProfile((prev) =>
        prev
          ? {
            ...prev,
            name: editProfileData.name || prev.name,
          }
          : prev
      );
      setActiveUser(editProfileData.name || userProfile?.name || "User");
      setShowEditProfile(false);
      setEditProfileData({});
      setSelectedFile(null);
      setPreviewUrl(null);
      alert("Profile updated successfully!");
    } catch (error: any) {
      console.error("Error updating profile:", error);
      setAutoDismissError(`Failed to update profile: ${error.message}`);
    }
  };

  // Load theme from localStorage on component mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  // Save theme.Data to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("theme", theme);
    // Update document class for global theme
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      document.body.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.body.classList.remove("dark");
    }
  }, [theme]);

  // Cleanup preview URL when component unmounts or modal closes
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Cleanup when edit modal closes
  useEffect(() => {
    if (!showEditProfile && previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  }, [showEditProfile, previewUrl]);

  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();
        if (sessionError) {
          throw new Error(`Session fetch error: ${sessionError.message}`);
        }

        if (!session) {
          navigate("/login");
          return;
        }

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
        if (userError || !user) {
          throw new Error("No authenticated user found");
        }

        // Reset states for new user to prevent stale data
        setCrisisAlert(null);
        setIsSafe(false);
        setCrisisAlerts([]);
        setUserSafeAlerts([]);
        setPendingCrisisAlerts([]);

        const { data: profileData, error: profileError } = await supabase
          .from("users")
          .select("user_id, name, first_name, email, role, avatar")
          .eq("user_id", user.id)
          .single();
        if (profileError) {
          throw new Error(`Profile fetch error: ${profileError.message}`);
        }
        if (profileData) {
          setActiveUser(profileData.first_name || profileData.name || "User");
          setUserProfile({
            id: profileData.user_id,
            name: profileData.name || "User",
            email: profileData.email,
            role: profileData.role || "user",
            avatar: profileData.avatar,
            first_name: profileData.first_name || undefined,
          });
        }

        const fetchCrisisAlerts = async (user: any, connectionIds: string[]): Promise<CrisisAlert[]> => {
          try {
            const { data: crisisAlertsData, error: crisisAlertsError } = await supabase
              .from("crisis_alerts")
              .select("*, users!user_id(name)")
              .neq("type", "Safe")
              .in("user_id", [...connectionIds, user.id])
              .order("created_at", { ascending: false });

            if (crisisAlertsError) {
              console.error("Crisis alerts fetch error:", crisisAlertsError);
              throw new Error(`Crisis alerts fetch error: ${crisisAlertsError.message}`);
            }

            console.log("Fetched crisis alerts:", crisisAlertsData);

            const formattedCrisisAlerts: CrisisAlert[] = [];
            for (const alert of crisisAlertsData || []) {
              const { data: markedSafeData, error: markedSafeError } = await supabase
                .from("crisis_alerts")
                .select("user_id, users!user_id(name)")
                .eq("type", "Safe")
                .eq("related_crisis_id", alert.id);

              if (markedSafeError) {
                console.error(`Error fetching safe users for crisis ${alert.id}:`, markedSafeError);
                continue;
              }

              console.log(`Safe users for crisis ${alert.id}:`, markedSafeData);

              const markedSafeUsers: { user_id: string; name: string }[] = (markedSafeData || []).map(
                (safeEntry) => ({
                  user_id: safeEntry.user_id || "unknown",
                  name: (safeEntry.users as any)?.name || "Unknown User",
                })
              );

              formattedCrisisAlerts.push({
                ...alert,
                reporter: alert.users?.name || "Unknown User",
                marked_safe_users: markedSafeUsers,
                responded_safe: markedSafeUsers.some((u) => u.user_id === user.id),
              });
            }

            const sortedAlerts = formattedCrisisAlerts.sort(
              (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
            console.log("Formatted crisis alerts:", sortedAlerts);
            return sortedAlerts;
          } catch (error: any) {
            console.error("Error in fetchCrisisAlerts:", error);
            return [];
          }
        };

        const { data: connectionsData, error: connectionsError } =
          await supabase
            .from("connections")
            .select("id, user1_id, user2_id")
            .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);
        if (connectionsError) {
          throw new Error(
            `Connections fetch error: ${connectionsError.message}`
          );
        }

        const formattedConnections: Connection[] = [];
        const connectionIds: string[] = [];
        for (const conn of connectionsData || []) {
          const isUser1 = conn.user1_id === user.id;
          const connectedUserId = isUser1 ? conn.user2_id : conn.user1_id;
          connectionIds.push(connectedUserId);
          const { data: connectedUser, error: userError } = await supabase
            .from("users")
            .select("name, avatar")
            .eq("user_id", connectedUserId)
            .single();
          if (userError) {
            console.error(`Error fetching user ${connectedUserId}:`, userError);
            continue;
          }
          formattedConnections.push({
            id: conn.id,
            name: connectedUser?.name || "Unknown User",
            avatar: connectedUser?.avatar || null,
            connected_user_id: connectedUserId,
            is_online: false,
          });
        }
        setConnections(formattedConnections);

        const { data: requestsData, error: requestsError } = await supabase
          .from("connection_requests")
          .select("id, sender_id, recipient_id, status, created_at")
          .eq("recipient_id", user.id)
          .eq("status", "pending");
        if (requestsError) {
          throw new Error(
            `Connection requests fetch error: ${requestsError.message}`
          );
        }

        const formattedRequests: ConnectionRequest[] = [];
        for (const req of requestsData || []) {
          const { data: senderData, error: senderError } = await supabase
            .from("users")
            .select("name, avatar")
            .eq("user_id", req.sender_id)
            .single();
          if (senderError) {
            console.error(
              `Error fetching sender ${req.sender_id}:`,
              senderError
            );
            continue;
          }
          formattedRequests.push({
            id: req.id,
            sender_id: req.sender_id,
            recipient_id: req.recipient_id,
            status: req.status,
            created_at: req.created_at,
            sender_name: senderData?.name || "Unknown User",
            sender_avatar: senderData?.avatar || null,
          });
        }
        setConnectionRequests(formattedRequests);

        const { data: emergenciesData, error: emergenciesError } =
          await supabase
            .from("emergencies")
            .select("*")
            .order("created_at", { ascending: false });
        if (emergenciesError) {
          throw new Error(
            `Emergencies fetch error: ${emergenciesError.message}`
          );
        }
        const filteredEmergencies =
          emergencyFilter === "nearby"
            ? emergenciesData?.filter((emergency) => {
              const distance =
                Math.sqrt(
                  Math.pow(emergency.location.lat - userLocation.lat, 2) +
                  Math.pow(emergency.location.lng - userLocation.lng, 2)
                ) * 111;
              return distance <= 5;
            }) || []
            : emergenciesData || [];
        setEmergencies(filteredEmergencies);

        const { data: tipsData, error: tipsError } = await supabase
          .from("safety_tips")
          .select("*");
        if (tipsError) {
          throw new Error(`Safety tips fetch error: ${tipsError.message}`);
        }
        setSafetyTips(tipsData || []);

        const { data: notificationsData, error: notificationsError } =
          await supabase
            .from("notifications")
            .select("id, user_id, type, notification_type, message, read, created_at").eq("user_id", user.id)
            .order("created_at", { ascending: false });
        if (notificationsError) {
          throw new Error(
            `Notifications fetch error: ${notificationsError.message}`
          );
        }
        setNotifications(notificationsData || []);

        const { data: messagesData, error: messagesError } = await supabase
          .from("messages")
          .select(
            "*, sender:users!sender_id(name), receiver:users!receiver_id(name)"
          )
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);
        if (messagesError) {
          throw new Error(`Messages fetch error: ${messagesError.message}`);
        }

        const decryptedMessages =
          messagesData?.map((msg) => {
            try {
              const bytes = CryptoJS.AES.decrypt(msg.content, secretKey);
              const plaintext = bytes.toString(CryptoJS.enc.Utf8);
              return {
                ...msg,
                content: plaintext,
                sender_name: msg.sender?.name || "Unknown User",
                receiver_name: msg.receiver?.name || "Unknown User",
              };
            } catch (e) {
              console.error("Failed to decrypt message:", e);
              return { ...msg, content: "Unable to decrypt message" };
            }
          }) || [];
        setMessages(decryptedMessages);

        const { data: crisisAlertData, error: crisisAlertError } = await supabase
          .from("crisis_alerts")
          .select("*")
          .eq("user_id", user.id)
          .neq("type", "Safe")
          .order("created_at", { ascending: false })
          .limit(1);
        if (crisisAlertError) {
          throw new Error(`Crisis alert fetch error: ${crisisAlertError.message}`);
        }
        setCrisisAlert(crisisAlertData[0] || null);
        setIsSafe(false);

        const { data: userSafeAlertsData, error: userSafeAlertsError } =
          await supabase
            .from("crisis_alerts")
            .select("*")
            .eq("user_id", user.id)
            .eq("type", "Safe")
            .order("created_at", { ascending: false });
        if (userSafeAlertsError) {
          throw new Error(
            `User safe alerts fetch error: ${userSafeAlertsError.message}`
          );
        }
        setUserSafeAlerts(userSafeAlertsData || []);

        // Fetch pending crisis alerts (non-Safe alerts from connections or system, where user has not marked safe)
        const { data: pendingCrisisData, error: pendingCrisisError } = await supabase
          .from("crisis_alerts")
          .select("*")
          .neq("type", "Safe")
          .in("user_id", [...connectionIds, user.id])
          .order("created_at", { ascending: false });
        if (pendingCrisisError) {
          throw new Error(`Pending crisis alerts fetch error: ${pendingCrisisError.message}`);
        }

        // Filter pending: exclude those where user has marked safe
        const userSafeIds = userSafeAlertsData.map((safe) => safe.related_crisis_id).filter(Boolean);
        const filteredPending = (pendingCrisisData || []).filter(
          (alert) => !userSafeIds.includes(alert.id)
        );
        setPendingCrisisAlerts(filteredPending);

        // Fetch safe alerts from connections for sidebar
        const { data: crisisAlertsData, error: crisisAlertsError } = await supabase
          .from("crisis_alerts")
          .select("*, users!user_id(name)")
          .eq("type", "Safe")
          .in("user_id", connectionIds)
          .order("created_at", { ascending: false });
        if (crisisAlertsError) {
          throw new Error(
            `Crisis alerts fetch error: ${crisisAlertsError.message}`
          );
        }

        const formattedCrisisAlerts: CrisisAlert[] = crisisAlertsData?.map((alert) => ({
          ...alert,
          reporter: alert.users?.name || "Unknown User",
          marked_safe_users: [{ user_id: alert.user_id, name: alert.users?.name || "Unknown User" }],
          responded_safe: alert.user_id === user.id,
        })) || [];

        setCrisisAlerts(
          formattedCrisisAlerts.sort((a, b) => {
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          })
        );

        const notificationSubscription = supabase
          .channel("notifications_dashboard")
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "notifications",
              filter: `user_id=eq.${user.id}`,
            },
            (payload) => {
              console.log("Raw notification payload:", payload);
              if (payload.new.user_id === user.id) {
                setNotifications((prev) => {
                  if (prev.some((n) => n.id === payload.new.id)) {
                    return prev;
                  }
                  return [payload.new as Notification, ...prev].slice(0, 50);
                });
              }
            }
          )
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "notifications",
              filter: `user_id=eq.${user.id}`,
            },
            (payload) => {
              // Only process if this notification is for the current user
              if (payload.new.user_id === user.id) {
                setNotifications((prev) =>
                  prev.map((n) =>
                    n.id === payload.new.id ? { ...n, read: payload.new.read } : n
                  )
                );
              }
            }
          )
          .subscribe((status, err) => {
            console.log("Notification status:", status, err || "");
          });

        const connectionRequestSubscription = supabase
          .channel("connection_requests_dashboard")
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "connection_requests",
              filter: `recipient_id=eq.${user.id}`,
            },
            async (payload) => {
              console.log("Raw connection request payload:", payload);
              const newRequest = payload.new as any;
              const { data: senderData, error: senderError } = await supabase
                .from("users")
                .select("name, avatar")
                .eq("user_id", newRequest.sender_id)
                .single();
              if (senderError) {
                console.error(
                  `Error fetching sender ${newRequest.sender_id}:`,
                  senderError
                );
                return;
              }
              if (newRequest.recipient_id === user.id) {
                setConnectionRequests((prev) => [
                  {
                    id: newRequest.id,
                    sender_id: newRequest.sender_id,
                    recipient_id: newRequest.recipient_id,
                    status: newRequest.status,
                    created_at: newRequest.created_at,
                    sender_name: senderData?.name || "User",
                    sender_avatar: senderData?.avatar || null,
                  },
                  ...prev,
                ]);
                setNotifications((prev) => [
                  {
                    id: newRequest.id,
                    user_id: newRequest.recipient_id,
                    type: "connection_request",
                    notification_type: "connection_request",
                    message: `${senderData?.name || "User"
                      } sent a connection request to ${userProfile?.name || "User"
                      }.`,
                    read: false,
                    created_at: newRequest.created_at,
                  },
                  ...prev,
                ]);
              }
            }
          )
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "connection_requests",
              filter: `recipient_id=eq.${user.id}`
            },
            (payload) => {
              setConnectionRequests((prev) =>
                prev.map((req) =>
                  req.id === payload.new.id
                    ? { ...req, status: payload.new.status }
                    : req
                )
              );
            }
          )
          .subscribe((status, err) => {
            console.log("Connection request status:", status, err || "");
          });

        const messageSubscription = supabase
          .channel("messages")
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "messages",
              filter: `receiver_id=eq.${user.id}`,
            },
            async (payload) => {
              console.log("Raw message payload:", payload);
              const newMessage = payload.new as any;
              const { data: senderData } = await supabase
                .from("users")
                .select("name")
                .eq("user_id", newMessage.sender_id)
                .single();
              const { data: receiverData } = await supabase
                .from("users")
                .select("name")
                .eq("user_id", newMessage.receiver_id)
                .single();
              setMessages((prev) => [
                {
                  id: newMessage.id,
                  sender_id: newMessage.sender_id,
                  receiver_id: newMessage.receiver_id,
                  content: newMessage.content,
                  timestamp: newMessage.timestamp,
                  sender_name: senderData?.name || "Unknown User",
                  receiver_name: receiverData?.name || "Unknown User",
                },
                ...prev,
              ]);
            }
          )
          .subscribe((status, err) => {
            console.log("Message status:", status, err || "");
          });

        const crisisAlertSubscription = supabase
          .channel("crisis_alerts_dashboard")
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "crisis_alerts",
              filter: `user_id=in.(${[user.id, ...connectionIds].join(',')})`,
            },
            async (payload) => {
              console.log("Raw crisis alert payload:", payload);
              const newAlert = payload.new as CrisisAlert;

              const { data: userData, error: userError } = await supabase
                .from("users")
                .select("name")
                .eq("user_id", newAlert.user_id)
                .single();

              if (userError) {
                console.error("Error fetching user data for alert:", userError);
              }

              const safeUser: { user_id: string; name: string } = {
                user_id: newAlert.user_id || "unknown",
                name: userData?.name || "Unknown User",
              };

              console.log("Safe user for alert:", safeUser);

              if (newAlert.user_id !== user.id) {
                if (newAlert.type === "Safe" && newAlert.user_id && connectionIds.includes(newAlert.user_id)) {
                  setCrisisAlerts((prev: CrisisAlert[]): CrisisAlert[] =>
                    prev
                      .map((crisis) =>
                        crisis.id === newAlert.related_crisis_id
                          ? {
                            ...crisis,
                            marked_safe_users: [
                              ...(crisis.marked_safe_users || []),
                              safeUser,
                            ],
                          }
                          : crisis
                      )
                      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                      .slice(0, 6)
                  );

                  setSelectedCrisisAlert((prev: CrisisAlert | null): CrisisAlert | null =>
                    prev && prev.id === newAlert.related_crisis_id
                      ? {
                        ...prev,
                        marked_safe_users: [
                          ...(prev.marked_safe_users || []),
                          safeUser,
                        ],
                      }
                      : prev
                  );

                  // Add notification for connection marking themselves safe
                  const crisisType = await getCrisisType(newAlert.related_crisis_id);
                  const connectionSafeNotification = {
                    id: Date.now(),
                    user_id: user.id,
                    type: "connection_safe",
                    notification_type: "connection_safe",
                    message: `${safeUser.name} marked themselves as safe for ${crisisType} crisis`,
                    read: false,
                    created_at: new Date().toISOString(),
                  };

                  setNotifications((prev) => [connectionSafeNotification, ...prev]);

                  console.log("Updated crisisAlerts and selectedCrisisAlert with safe user:", safeUser);
                } else if (newAlert.type !== "Safe") {
                  const { data: safeForThis, error: safeError } = await supabase
                    .from("crisis_alerts")
                    .select("id")
                    .eq("type", "Safe")
                    .eq("related_crisis_id", newAlert.id)
                    .eq("user_id", user.id);
                  if (safeError) {
                    console.error("Error checking safe status:", safeError);
                  }
                  if (!safeForThis || safeForThis.length === 0) {
                    setPendingCrisisAlerts((prev) => [
                      { ...newAlert, reporter: safeUser.name },
                      ...prev,
                    ]);
                    console.log("Added to pendingCrisisAlerts:", newAlert);
                  }
                }
              } else if (newAlert.type === "Safe") {
                setUserSafeAlerts((prev) => {
                  if (prev.some((alert) => alert.id === newAlert.id)) {
                    return prev;
                  }
                  return [newAlert, ...prev];
                });

                setPendingCrisisAlerts((prev) => prev.filter((p) => p.id !== newAlert.related_crisis_id));

                setCrisisAlerts((prev: CrisisAlert[]): CrisisAlert[] =>
                  prev
                    .map((crisis) =>
                      crisis.id === newAlert.related_crisis_id
                        ? {
                          ...crisis,
                          responded_safe: true,
                          marked_safe_users: [
                            ...(crisis.marked_safe_users || []),
                            safeUser,
                          ],
                        }
                        : crisis
                    )
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .slice(0, 6)
                );

                setSelectedCrisisAlert((prev: CrisisAlert | null): CrisisAlert | null =>
                  prev && prev.id === newAlert.related_crisis_id
                    ? {
                      ...prev,
                      responded_safe: true,
                      marked_safe_users: [
                        ...(prev.marked_safe_users || []),
                        safeUser,
                      ],
                    }
                    : prev
                );
                console.log("User marked safe, updated states:", safeUser);
              }
            }
          )
          .on(
            "postgres_changes",
            {
              event: "DELETE",
              schema: "public",
              table: "crisis_alerts",
            },
            async (payload) => {
              const deletedAlert = payload.old as CrisisAlert;
              console.log("Deleted alert:", deletedAlert);

              setUserSafeAlerts((prev) => prev.filter((s) => s.id !== deletedAlert.id));

              // Add notification if a connection unmarked themselves as safe
              if (deletedAlert.type === "Safe" && deletedAlert.user_id !== user.id && deletedAlert.user_id && connectionIds.includes(deletedAlert.user_id)) {
                const { data: userData, error: userError } = await supabase
                  .from("users")
                  .select("name")
                  .eq("user_id", deletedAlert.user_id)
                  .single();

                if (!userError && userData) {
                  const crisisType = await getCrisisType(deletedAlert.related_crisis_id);
                  const connectionUnsafeNotification = {
                    id: Date.now(),
                    user_id: user.id,
                    type: "connection_unsafe",
                    notification_type: "connection_unsafe",
                    message: `${userData.name} unmarked themselves as safe for ${crisisType} crisis`,
                    read: false,
                    created_at: new Date().toISOString(),
                  };

                  setNotifications((prev) => [connectionUnsafeNotification, ...prev]);
                }
              }

              if (deletedAlert.related_crisis_id) {
                const { data: crisisData, error: crisisError } = await supabase
                  .from("crisis_alerts")
                  .select("*")
                  .eq("id", deletedAlert.related_crisis_id)
                  .single();
                if (crisisError) {
                  console.error("Error fetching crisis data for deletion:", crisisError);
                }
                if (crisisData) {
                  setPendingCrisisAlerts((prev) => {
                    if (!prev.some((p) => p.id === crisisData.id)) {
                      return [...prev, crisisData];
                    }
                    return prev;
                  });
                }

                setCrisisAlerts((prev: CrisisAlert[]): CrisisAlert[] =>
                  prev
                    .map((crisis) =>
                      crisis.id === deletedAlert.related_crisis_id
                        ? {
                          ...crisis,
                          marked_safe_users: crisis.marked_safe_users?.filter(
                            (u) => u.user_id !== deletedAlert.user_id
                          ) || [],
                          responded_safe: crisis.user_id === user.id ? false : crisis.responded_safe,
                        }
                        : crisis
                    )
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                );

                setSelectedCrisisAlert((prev: CrisisAlert | null): CrisisAlert | null =>
                  prev && prev.id === deletedAlert.related_crisis_id
                    ? {
                      ...prev,
                      marked_safe_users: prev.marked_safe_users?.filter(
                        (u) => u.user_id !== deletedAlert.user_id
                      ) || [],
                      responded_safe: prev.user_id === user.id ? false : prev.responded_safe,
                    }
                    : prev
                );
                console.log("Updated states after deletion:", deletedAlert.user_id);
              }
            }
          )
          .subscribe((status, err) => {
            console.log("Crisis alert status:", status, err || "");
          });

        return () => {
          supabase.removeChannel(notificationSubscription);
          supabase.removeChannel(connectionRequestSubscription);
          supabase.removeChannel(messageSubscription);
          supabase.removeChannel(crisisAlertSubscription);
        };
      } catch (err: any) {
        console.error("Error fetching data:", err);
        setAutoDismissError(`Failed to load dashboard data: ${err.message}`);
        if (
          err.message.includes("Session fetch error") ||
          err.message.includes("No authenticated user")
        ) {
          navigate("/login");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_OUT") {
          navigate("/login");
        } else if (!session) {
          navigate("/login");
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate, userLocation, emergencyFilter]);

  const refreshFeed = async () => {
    setIsLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user");

      const { data, error } = await supabase
        .from("emergencies")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw new Error(`Refresh emergencies error: ${error.message}`);
      const filteredEmergencies =
        emergencyFilter === "nearby"
          ? data?.filter((emergency) => {
            const distance =
              Math.sqrt(
                Math.pow(emergency.location.lat - userLocation.lat, 2) +
                Math.pow(emergency.location.lng - userLocation.lng, 2)
              ) * 111;
            return distance <= 5;
          }) || []
          : data || [];
      setEmergencies(filteredEmergencies);
    } catch (error: any) {
      console.error("Error refreshing emergencies:", error);
      setAutoDismissError(`Failed to refresh emergencies: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmergencyAlert = async (type: string) => {
    try {
      console.log("Starting emergency alert process for type:", type);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user");

      console.log("User authenticated:", user.id);

      // Create crisis alert data
      const crisisAlertData = {
        user_id: user.id,
        type,
        reporter: activeUser || "User",
        is_self: true,
        created_at: new Date().toISOString(),
        location: userLocation,
        responded_safe: false,
      };

      console.log("Crisis alert data:", crisisAlertData);

      // Insert crisis alert into database
      const { data: insertedAlert, error: alertError } = await supabase
        .from("crisis_alerts")
        .insert(crisisAlertData)
        .select()
        .single();

      if (alertError) {
        console.error("Crisis alert insert error:", alertError);
        setAutoDismissError(`Failed to create crisis alert: ${alertError.message}`);
        return;
      }

      console.log("Crisis alert created successfully:", insertedAlert);

      // Also insert into emergencies table for admin notifications
      const emergencyData = {
        user_id: user.id,
        name: activeUser || "User",
        avatar: userProfile?.avatar || null,
        emergency_type: type,
        message: `Urgent ${type} alert triggered!`,
        location: userLocation,
        created_at: new Date().toISOString(),
      };

      const { data: insertedEmergency, error: emergencyError } = await supabase
        .from("emergencies")
        .insert(emergencyData)
        .select()
        .single();

      if (emergencyError) {
        console.error("Emergency insert error:", emergencyError);
        setAutoDismissError(`Failed to create emergency record: ${emergencyError.message}`);
        // Don't throw error here as crisis alert was already created successfully
      } else {
        console.log("Emergency record created successfully:", insertedEmergency);
      }

      // Create emergency data for local state
      const newEmergency = {
        id: insertedEmergency?.id || insertedAlert.id, // Use emergency ID if available, fallback to alert ID
        user_id: user.id,
        name: activeUser || "User",
        avatar: userProfile?.avatar || null,
        emergency_type: type,
        message: `Urgent ${type} alert triggered!`,
        location: userLocation,
        created_at: new Date().toISOString(),
      };

      // Send notifications to connected users
      try {
        const userConnections = await fetchUserConnections(user.id);
        const notifications = userConnections
          .map((connection) => ({
            user_id: connection.id,
            type: "emergency",
            notification_type: "emergency",
            message: `${activeUser || "User"} triggered a ${type} alert at Lat: ${userLocation.lat
              }, Lng: ${userLocation.lng}!`,
            read: false,
            created_at: new Date().toISOString(),
          }));

        if (notifications.length > 0) {
          // Insert notifications
          for (const notification of notifications) {
            const { error: notificationError } = await supabase
              .from('notifications')
              .insert({
                user_id: notification.user_id,
                type: notification.type,
                notification_type: notification.notification_type || "emergency",
                message: notification.message,
                read: false,
                created_at: new Date().toISOString(),
                cleared_by: []
              });
            if (notificationError) {
              console.error("Notification error:", notificationError);
              // Continue even if notification fails
            }
          }
        }
      } catch (notificationError) {
        console.error("Error sending notifications:", notificationError);
        // Continue even if notifications fail
      }

      // Update local state
      setCrisisAlert(insertedAlert);
      setIsSafe(false);
      setSelectedAlertType(type);
      setShowAlertConfirm(true);

      // Add to pending alerts
      setPendingCrisisAlerts((prev) => [insertedAlert, ...prev]);

      // Add to emergencies list if it matches current filter
      if (
        emergencyFilter === "all" ||
        (emergencyFilter === "nearby" &&
          Math.sqrt(
            Math.pow(newEmergency.location.lat - userLocation.lat, 2) +
            Math.pow(newEmergency.location.lng - userLocation.lng, 2)
          ) *
          111 <=
          5)
      ) {
        setEmergencies((prev) => [newEmergency, ...prev]);
      }

      setAutoDismissSuccess(`${type} emergency alerted successfully!`);
      console.log("Emergency alert process completed successfully");

    } catch (error: any) {
      console.error("Error creating emergency alert:", error);
      setAutoDismissError(`Failed to create emergency alert: ${error.message}`);
    }
  };

  const handleMarkSafe = async (crisisId?: number) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user");

      const query = supabase
        .from("crisis_alerts")
        .select("*")
        .eq("user_id", user.id)
        .eq("type", "Safe");
      if (crisisId) {
        query.eq("related_crisis_id", crisisId);
      } else {
        query.is("related_crisis_id", null);
      }
      const { data: existingSafeAlert } = await query.limit(1);

      if (existingSafeAlert && existingSafeAlert.length > 0) {
        const { error } = await supabase
          .from("crisis_alerts")
          .delete()
          .eq("id", existingSafeAlert[0].id);
        if (error) throw new Error(`Unmark safe error: ${error.message}`);

        setUserSafeAlerts((prev) => prev.filter((alert) => alert.id !== existingSafeAlert[0].id));
        setCrisisAlerts((prev: CrisisAlert[]): CrisisAlert[] =>
          prev
            .map((crisis) =>
              crisis.id === crisisId
                ? {
                  ...crisis,
                  responded_safe: crisis.user_id === user.id ? false : crisis.responded_safe,
                  marked_safe_users: crisis.marked_safe_users?.filter((u) => u.user_id !== user.id) || [],
                }
                : crisis
            )
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        );
        setSelectedCrisisAlert((prev: CrisisAlert | null): CrisisAlert | null =>
          prev && prev.id === crisisId
            ? {
              ...prev,
              responded_safe: prev.user_id === user.id ? false : prev.responded_safe,
              marked_safe_users: prev.marked_safe_users?.filter((u) => u.user_id !== user.id) || [],
            }
            : prev
        );

        if (!crisisId) {
          setIsSafe(false);
        } else {
          const { data: crisisData } = await supabase
            .from("crisis_alerts")
            .select("*")
            .eq("id", crisisId)
            .single();
          if (crisisData) {
            setPendingCrisisAlerts((prev) => {
              if (!prev.some((p) => p.id === crisisData.id)) {
                return [...prev, crisisData];
              }
              return prev;
            });
          }
        }

      } else {
        const newAlert = {
          user_id: user.id,
          type: "Safe",
          reporter: activeUser || "User",
          is_self: true,
          created_at: new Date().toISOString(),
          location: userLocation,
          responded_safe: true,
          related_crisis_id: crisisId || null,
        };

        const { data: insertedAlert, error } = await supabase
          .from("crisis_alerts")
          .insert(newAlert)
          .select()
          .single();
        if (error) throw new Error(`Mark safe error: ${error.message}`);

        setUserSafeAlerts((prev) => {
          if (prev.some((alert) => alert.id === insertedAlert.id)) {
            return prev;
          }
          return [insertedAlert, ...prev];
        });

        const safeUser = {
          user_id: user.id,
          name: activeUser || "User",
        };

        setCrisisAlerts((prev: CrisisAlert[]): CrisisAlert[] =>
          prev
            .map((crisis) =>
              crisis.id === crisisId
                ? {
                  ...crisis,
                  responded_safe: crisis.user_id === user.id ? true : crisis.responded_safe,
                  marked_safe_users: [
                    ...(crisis.marked_safe_users || []),
                    safeUser,
                  ],
                }
                : crisis
            )
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        );

        setSelectedCrisisAlert((prev: CrisisAlert | null): CrisisAlert | null =>
          prev && prev.id === crisisId
            ? {
              ...prev,
              responded_safe: prev.user_id === user.id ? true : prev.responded_safe,
              marked_safe_users: [
                ...(prev.marked_safe_users || []),
                safeUser,
              ],
            }
            : prev
        );

        if (!crisisId) {
          setIsSafe(true);
        } else {
          setPendingCrisisAlerts((prev) => prev.filter((p) => p.id !== crisisId));
        }
      }
    } catch (error: any) {
      console.error("Error toggling safe status:", error);
      setAutoDismissError(`Failed to toggle safe status: ${error.message}`);
    }
  };

  const clearAllNotifications = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user");

      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("user_id", user.id);
      if (error) throw new Error(`Clear notifications error: ${error.message}`);

      setNotifications([]);
    } catch (error: any) {
      console.error("Error clearing notifications:", error);
      setAutoDismissError(`Failed to clear notifications: ${error.message}`);
    }
  };

  const markAllAsRead = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user");

      const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
      if (unreadIds.length === 0) return;

      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .in("id", unreadIds);

      if (error) throw new Error(`Mark all as read error: ${error.message}`);
    } catch (error: any) {
      console.error("Error marking all notifications as read:", error);
      setAutoDismissError(`Failed to mark all as read: ${error.message}`);
    }
  };
  const resetCrisisAlert = () => {
    setCrisisAlert(null);
    setIsSafe(false);
    setShowAlertConfirm(false);
  };

  const handleNavigation = (tab: string) => {
    setActiveTab(tab);
    setShowMessages(tab === "message");
    setShowReport(tab === "report");
    setShowChatList(true);
    setShowConnectionOptions(false);
  };

  const handleProfileAction = (action: string) => {
    setShowProfileMenu(false);
    switch (action) {
      case "profile":
        setSelectedSearchProfile(userProfile);
        setShowProfile(true);
        break;
      case "settings":
        setShowSettings(true);
        break;
      case "logout":
        setShowLogoutConfirm(true);
        break;
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw new Error(`Logout error: ${error.message}`);
      localStorage.removeItem("supabase.auth.token");
      navigate("/login");
    } catch (error: any) {
      console.error("Error logging out:", error);
      setAutoDismissError(`Failed to log out: ${error.message}`);
    }
  };

  const markNotificationAsRead = async (id: number) => {
    try {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );

      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", id);
      if (error) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: false } : n))
        );
        throw new Error(`Notification update error: ${error.message}`);
      }
    } catch (error: any) {
      console.error("Error marking notification as read:", error);
      setAutoDismissError(`Failed to mark notification as read: ${error.message}`);
    }
  };

  const handleViewLocation = (emergency: Emergency) => {
    setSelectedLocation(emergency.location);
    setSelectedEmergency(emergency);
    setShowLocationView(true);
  };

  const handleCallAssistance = (emergency: Emergency) => {
    setSelectedEmergencyForAction(emergency);
    setShowCallConfirm(true);
  };

  const handleReport = (emergency: Emergency) => {
    setSelectedEmergencyForAction(emergency);
    setShowReportConfirm(true);
  };

  const initiateCall = () => {
    window.open("tel:911", "_blank");
    setShowCallConfirm(false);
  };

  const submitReport = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || !selectedEmergencyForAction)
        throw new Error("No user or emergency selected");

      const newNotification = {
        user_id: user.id,
        type: "report",
        notification_type: "report",
        message: `Reported ${selectedEmergencyForAction.emergency_type} by ${selectedEmergencyForAction.name}`,
        read: false,
        created_at: new Date().toISOString(),
      };
      const { error } = await supabase
        .from("notifications")
        .insert(newNotification);
      if (error) throw new Error(`Report notification error: ${error.message}`);
      setShowReportConfirm(false);
    } catch (error: any) {
      console.error("Error submitting report:", error);
      setAutoDismissError(`Failed to submit report: ${error.message}`);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedConnection) return;
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user");

      const { data: receiverData } = await supabase
        .from("users")
        .select("name")
        .eq("user_id", selectedConnection.connected_user_id)
        .single();

      const encryptedMessage = CryptoJS.AES.encrypt(
        messageText,
        secretKey
      ).toString();

      const newMessage = {
        id: Date.now(), // Add missing id field
        sender_id: user.id,
        receiver_id: selectedConnection.connected_user_id, // Send encrypted content
        content: encryptedMessage,
        timestamp: new Date().toISOString(),
        sender_name: userProfile?.name || "User",
        receiver_name: receiverData?.name || "User",
      };

      const { error } = await supabase.from("messages").insert({
        sender_id: newMessage.sender_id,
        receiver_id: newMessage.receiver_id,
        content: newMessage.content, // This is already the encryptedMessage
        timestamp: newMessage.timestamp
      });
      if (error) throw new Error(`Message send error: ${error.message}`);
      // Decrypt for local display
      const bytes = CryptoJS.AES.decrypt(newMessage.content, secretKey);
      const plaintext = bytes.toString(CryptoJS.enc.Utf8);
      setMessages([...messages, { ...newMessage, content: plaintext }]);
      setMessageText("");
      setMessageSent(true);
      setTimeout(() => setMessageSent(false), 1500);
    } catch (error: any) {
      console.error("Error sending message:", error);
      setAutoDismissError(`Failed to send message: ${error.message}`);
    }
  };

  const handleSelectConnection = (connection: Connection) => {
    setSelectedConnection(connection);
    setCurrentChatRecipient(connection.name);
    setShowChatList(false);
    setShowMessages(true);
    setActiveTab("message");
  };

  const handleConnectionAction = (action: string, connection: Connection) => {
    setShowConnectionOptions(false);
    if (action === "message") {
      setSelectedConnection(connection);
      setCurrentChatRecipient(connection.name);
      setShowChatList(false);
      setShowMessages(true);
      setActiveTab("message");
    } else if (action === "profile") {
      setSelectedSearchProfile({
        id: connection.connected_user_id,
        name: connection.name,
        email: "N/A",
        avatar: connection.avatar,
      });
      setShowProfile(true);
    }
  };

  const getMessagesForRecipient = (recipientId: string) => {
    return messages
      .filter(
        (msg) =>
          (msg.sender_id === userProfile?.id &&
            msg.receiver_id === recipientId) ||
          (msg.sender_id === recipientId && msg.receiver_id === userProfile?.id)
      )
      .sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
  };

  const isConnected = (userId: string) => {
    return connections.some(
      (conn) => conn.connected_user_id === userId
    );
  };

  return (
    <div className={`h-screen overflow-hidden ${themeClasses.background} flex flex-col transition-colors duration-300`}>
      {/* Navbar */}
      <div className={`${themeClasses.navbar} border-b p-2 sm:p-2 flex flex-col sm:flex-row items-center justify-between  relative transition-colors duration-300`}>
        <div className="flex items-center w-full sm:w-auto mb-4 sm:mb-0 space-x-4">
          <img src={logoImage} className="h-10 w-auto sm:h-16 md:h-20" alt="Logo" />
          {/* Search Bar */}
          <div className="flex-1 max-w-xs">
            <div className="relative">
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className={`w-full ${themeClasses.input} rounded-2xl px-4 py-2 pl-10 text-sm border-2 ${themeClasses.border} focus:ring-[#4ECDC4] focus:border-[#4ECDC4] outline-none transition-all duration-300 font-bold tracking-wide`}
              />
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#4ECDC4]" size={16} />
              {searchQuery.trim().length >= 2 && (
                <div className={`absolute top-full left-0 right-0 mt-2 ${themeClasses.searchDropdown} rounded-2xl border-2 ${themeClasses.border} z-50 max-h-60 overflow-y-auto`}>
                  <div className="py-2">
                    {searchResults.length > 0 ? (
                      searchResults.map((user) => (
                        <div
                          key={user.id}
                          className={`px-4 h-12 ${themeClasses.hover} transition-colors duration-200 cursor-pointer flex items-center space-x-3 w-full`}
                          onClick={() => {
                            setSelectedSearchProfile(user);
                            setShowProfile(true);
                            setSearchQuery("");
                          }}
                        >
                          <div className="w-10 h-10 flex-shrink-0 rounded-full bg-[#2B2B2B] flex items-center justify-center text-white">
                            {user.avatar ? (
                              <img
                                src={user.avatar}
                                className="w-full h-full rounded-full"
                                alt={user.name}
                              />
                            ) : (
                              <FaUser className="text-white" />
                            )}
                          </div>
                          <div className="min-w-0 w-full flex flex-col justify-center">
                            <p className={`${themeClasses.textPrimary} font-black truncate tracking-wide`}>{user.name}</p>
                            <p className={`text-sm ${themeClasses.textSecondary} truncate font-bold tracking-wide`}>{user.email}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className={`px-4 py-2 ${themeClasses.textSecondary} font-bold tracking-wide`}>No users found.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center space-x-4 sm:space-x-8 sm:absolute sm:left-1/2 sm:transform sm:-translate-x-1/2">
          <button
            onClick={() => handleNavigation("home")}
            className={`flex flex-col items-center px-3 py-2 rounded-xl border-b-2 transition-all duration-300 ${activeTab === "home"
              ? "text-[#4ECDC4] border-[#4ECDC4] bg-[#4ECDC4]/10 font-bold "
              : `${themeClasses.textSecondary} border-transparent hover:text-[#4ECDC4] hover:border-[#4ECDC4]/50 hover:bg-[#4ECDC4]/5 hover:scale-105`
              }`}
          >
            <FaHome size={20} />
            <span className="text-xs mt-1">Home</span>
          </button>
          <button
            onClick={() => handleNavigation("message")}
            className={`flex flex-col items-center px-3 py-2 rounded-xl border-b-2 transition-all duration-300 ${activeTab === "message"
              ? "text-[#4ECDC4] border-[#4ECDC4] bg-[#4ECDC4]/10 font-bold "
              : `${themeClasses.textSecondary} border-transparent hover:text-[#4ECDC4] hover:border-[#4ECDC4]/50 hover:bg-[#4ECDC4]/5 hover:scale-105`
              }`}
          >
            <FaEnvelope size={20} />
            <span className="text-xs mt-1">Message</span>
          </button>
          <button
            onClick={() => handleNavigation("report")}
            className={`flex flex-col items-center px-3 py-2 rounded-xl border-b-2 transition-all duration-300 ${activeTab === "report"
              ? "text-[#4ECDC4] border-[#4ECDC4] bg-[#4ECDC4]/10 font-bold "
              : `${themeClasses.textSecondary} border-transparent hover:text-[#4ECDC4] hover:border-[#4ECDC4]/50 hover:bg-[#4ECDC4]/5 hover:scale-105`
              }`}
          >
            <FaExclamationTriangle size={20} />
            <span className="text-xs mt-1">Report</span>
          </button>
        </div>

        <div className="flex items-center space-x-4 mt-4 sm:mt-0">
          <div className="relative">
            <button
              onClick={() => {
                setShowConnectionRequestsMenu(!showConnectionRequestsMenu);
                setShowNotifications(false);
              }}
              className="relative focus:outline-none hover:bg-gray-100 rounded-full p-2 transition-all duration-300 hover:scale-110"
            >
              <FaUserPlus size={20} className="text-[#4ECDC4]" />
              {connectionRequests.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#4ECDC4] text-white rounded-full h-5 w-5 flex items-center justify-center text-xs">
                  {connectionRequests.length}
                </span>
              )}
            </button>
            {showConnectionRequestsMenu && (
              <div className={`absolute right-0 mt-2 w-full sm:w-80 ${themeClasses.connectionRequestDropdown} rounded-2xl  py-2 z-50 animate-in fade-in duration-300 border hover:border-[#4ECDC4]/20 overflow-hidden`}>
                <div className={`px-4 py-3 border-b ${themeClasses.border} flex justify-between items-center`}>
                  <h3 className="text-lg font-bold text-[#4ECDC4]">
                    Connection Requests
                  </h3>
                </div>
                <div className="max-h-96 overflow-y-auto overflow-x-hidden">
                  {connectionRequests.length > 0 ? (
                    connectionRequests.map((request) => (
                      <div
                        key={request.id}
                        className={`px-3 py-3 flex items-center justify-between gap-2 ${themeClasses.hover} transition-all duration-300`}
                      >
                        <div className="flex items-center space-x-3 min-w-0 flex-1">
                          <div className="w-10 h-10 rounded-full bg-[#2B2B2B] flex items-center justify-center text-white flex-shrink-0 overflow-hidden">
                            {request.sender_avatar ? (
                              <img
                                src={request.sender_avatar}
                                className="w-full h-full rounded-full object-cover"
                                alt={request.sender_name}
                              />
                            ) : (
                              <FaUser className="text-white" />
                            )}
                          </div>
                          <p className={`${themeClasses.textPrimary} text-sm truncate`}>
                            {request.sender_name} wants to connect
                          </p>
                        </div>
                        <div className="flex space-x-1 flex-shrink-0">
                          <button
                            onClick={() =>
                              handleConnectionRequestAction(
                                request.id,
                                "accepted"
                              )
                            }
                            className="bg-[#4ECDC4] hover:bg-[#3abfb2] text-white px-2 py-1 rounded-lg text-xs hover:scale-105 transition-all duration-300"
                          >
                            <FaCheck className="inline mr-1" /> Accept
                          </button>
                          <button
                            onClick={() =>
                              handleConnectionRequestAction(
                                request.id,
                                "rejected"
                              )
                            }
                            className="bg-[#E63946] hover:bg-[#a33d16] text-white px-2 py-1 rounded-lg text-xs hover:scale-105 transition-all duration-300"
                          >
                            <FaTimes className="inline mr-1" /> Reject
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className={`px-4 py-3 ${themeClasses.textSecondary}`}>No connection requests.</p>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowConnectionRequestsMenu(false);
              }}
              className="relative focus:outline-none hover:bg-gray-100 rounded-full p-2 transition-all duration-300 hover:scale-110"
            >
              <FaBell size={20} className="text-[#FFD166]" />
              {unreadNotifications.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#E63946] text-white rounded-full h-5 w-5 flex items-center justify-center text-xs">
                  {unreadNotifications.length}
                </span>
              )}
            </button>
            {showNotifications && (
              <div className={`absolute right-0 mt-2 w-full sm:w-80 ${themeClasses.notificationDropdown} rounded-2xl  z-50 animate-in fade-in duration-300 border hover:border-[#4ECDC4]/20`}>
                <div className={`px-4 py-3 border-b ${themeClasses.border} flex justify-between items-center`}>
                  <h3 className="text-lg font-bold text-[#4ECDC4]">
                    Notifications
                  </h3>
                  <button
                    onClick={markAllAsRead}
                    className={`text-sm text-blue-600 hover:text-blue-800 transition-colors duration-200 ${unreadNotifications.length === 0
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                      }`}
                  >
                    Mark all as read
                  </button>
                </div>
                <div className={`flex border-b ${themeClasses.border}`}>
                  <button
                    onClick={() => setNotificationTab("unread")}
                    className={`flex-1 py-2 text-sm font-medium ${notificationTab === "unread"
                      ? "border-b-2 border-[#4ECDC4] text-[#4ECDC4]"
                      : `${themeClasses.textSecondary} hover:${themeClasses.textPrimary}`
                      }`}
                  >
                    Unread
                  </button>
                  <button
                    onClick={() => setNotificationTab("all")}
                    className={`flex-1 py-2 text-sm font-medium ${notificationTab === "all"
                      ? "border-b-2 border-[#4ECDC4] text-[#4ECDC4]"
                      : `${themeClasses.textSecondary} hover:${themeClasses.textPrimary}`
                      }`}
                  >
                    All
                  </button>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {(() => {
                    const filteredNotifications = notificationTab === "unread" ? unreadNotifications : notifications;

                    if (filteredNotifications.length === 0) {
                      return (
                        <div className={`px-4 py-3 text-center ${themeClasses.textSecondary}`}>
                          No {notificationTab} notifications
                        </div>
                      );
                    }

                    return filteredNotifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`px-4 py-3 ${themeClasses.hover} border-b ${themeClasses.border} last:border-b-0 transition-colors ${notification.read ? themeClasses.hover : themeClasses.cardBackground
                          }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p
                              className={`text-sm ${notification.read
                                ? themeClasses.textSecondary
                                : `${themeClasses.textPrimary} font-medium`
                                }`}
                            >
                              {notification.message}
                            </p>
                            <p className={`text-xs ${themeClasses.textSecondary} mt-1`}>
                              {new Date(
                                notification.created_at
                              ).toLocaleString()}
                            </p>
                          </div>
                          {!notification.read && (
                            <button
                              onClick={() =>
                                markNotificationAsRead(notification.id)
                              }
                              className="ml-2 text-xs text-blue-600 hover:underline"
                            >
                              Mark as read
                            </button>
                          )}
                        </div>
                      </div>
                    ));
                  })()}
                  {connectionRequests.length > 0 && (
                    <div className={`px-4 py-3 text-center ${themeClasses.textSecondary} border-t ${themeClasses.border}`}>You have {connectionRequests.length} pending connection request{connectionRequests.length > 1 ? 's' : ''}.</div>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center space-x-3 focus:outline-none hover:bg-gray-100 rounded-xl px-4 py-2 transition-all duration-300 hover:scale-100"
            >
              <div className="flex items-center space-x-3">
                <div className={`${themeClasses.textPrimary} font-bold text-[#2B2B2B]/100 text-md`}>
                  {isLoading ? "Loading..." : (userProfile?.first_name || "User")}
                </div>
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center overflow-hidden">
                    {userProfile?.avatar ? (
                      <img
                        src={userProfile.avatar}
                        className="w-full h-full rounded-full object-cover"
                        alt="Profile"
                      />
                    ) : (
                      <FaUser className="text-gray-500" size={20} />
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full border border-gray-200 flex items-center justify-center">
                    <span
                      className={`text-xs transition-transform duration-300 ${showProfileMenu ? "rotate-180" : ""}`}
                    >
                      <FaChevronDown size={10} />
                    </span>
                  </div>
                </div>
              </div>
            </button>
            {showProfileMenu && (
              <div className={`absolute right-0 mt-2 w-48 ${themeClasses.profileDropdown} rounded-2xl  py-2 z-50 animate-in fade-in duration-300 border hover:border-[#4ECDC4]/20`}>
                <button
                  onClick={() => handleProfileAction("profile")}
                  className={`w-full px-4 py-2 text-left ${themeClasses.textPrimary} ${themeClasses.hover} hover:scale-100 transition-all duration-300 flex items-center rounded-2xl`}
                >
                  <FaUser size={16} className="mr-2" />
                  Profile
                </button>
                <button
                  onClick={() => handleProfileAction("settings")}
                  className={`w-full px-4 py-2 text-left ${themeClasses.textPrimary} ${themeClasses.hover} hover:scale-100 transition-all duration-300 flex items-center rounded-2xl`}
                >
                  <FaCog size={16} className="mr-2" />
                  Settings
                </button>
                <div className={`border-t ${themeClasses.border} my-1`}></div>
                <button
                  onClick={() => handleProfileAction("logout")}
                  className={`w-full px-4 py-2 text-left text-[#E63946] ${themeClasses.hover} hover:scale-100 transition-all duration-300 flex items-center rounded-2xl`}
                >
                  <FaSignOutAlt size={16} className="mr-2" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row flex-1 relative px-4 sm:px-6 gap-4 sm:gap-6 pt-4 sm:pt-6">
        {/* Left Sidebar */}
        <div className="w-full lg:w-1/4 flex flex-col space-y-4 sm:space-y-6 min-h-0">
          {/* Make the left sidebar content fixed in layout but scrollable on hover */}
          <div className="h-full scrollbar-hidden scroll-on-hover space-y-4" style={{ maxHeight: 'calc(100vh - 140px)' }}>
            <div className={`${themeClasses.deviceCard} ${themeClasses.border} rounded-2xl border-2 p-4 sm:p-6 hover:border-[#4ECDC4]/50 transition-all duration-300 cursor-pointer`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className={`text-xl sm:text-2xl font-bold ${themeClasses.deviceCardText}`}>Your Device</h2>
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="text-2xl">📱</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-white/10 rounded-xl">
                  <span className={`${themeClasses.deviceCardText}/90 font-medium`}>Device ID:</span>
                  <span className={`${themeClasses.deviceCardText} font-bold`}>01-JD-C24</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/10 rounded-xl">
                  <span className={`${themeClasses.deviceCardText}/90 font-medium`}>Status:</span>
                  <span
                    className={`font-bold px-3 py-1 rounded-full text-sm ${deviceStatus === "Active"
                      ? "bg-green-500 text-white"
                      : "bg-red-500 text-white"
                      }`}
                  >
                    {deviceStatus}
                  </span>
                </div>
                <button
                  className={`w-full py-3 px-4 rounded-xl font-bold text-white transition-all duration-300 transform hover:scale-105  ${deviceStatus === "Active"
                    ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                    : "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                    }`}
                  onClick={() =>
                    setDeviceStatus(deviceStatus === "Active" ? "Inactive" : "Active")
                  }
                >
                  {deviceStatus === "Active" ? "Deactivate Device" : "Activate Device"}
                </button>
              </div>
            </div>
            <div className={`${themeClasses.connectionCard} ${themeClasses.border} rounded-2xl border-2 p-4 sm:p-6 transition-all duration-300 hover:border-[#4ECDC4]/50 overflow-hidden`}>
              <h2 className={`text-xl sm:text-2xl font-bold ${themeClasses.textPrimary} mb-4`}>
                Connections
              </h2>
              {isLoading ? (
                <p className={themeClasses.textSecondary}>Loading connections...</p>
              ) : connections.length > 0 ? (
                connections.map((connection) => (
                  <div
                    key={connection.id}
                    className={`flex items-center justify-between space-x-4 mb-2 cursor-pointer ${themeClasses.hover} p-2 rounded-2xl hover:scale-105 transition-all duration-300`}
                    onClick={() => handleSelectConnection(connection)}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-full bg-[#4ECDC4] flex items-center justify-center text-white">
                        {connection.avatar ? (
                          <img
                            src={connection.avatar}
                            className="w-full h-full rounded-full"
                            alt={connection.name}
                          />
                        ) : (
                          <FaUser className="text-white" />
                        )}
                      </div>
                      <span className={`${themeClasses.textPrimary} font-bold`}>{connection.name}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedConnection(connection);
                        setShowConnectionOptions(true);
                      }}
                      className={`${themeClasses.textSecondary} hover:text-[#4ECDC4] transition-colors duration-200`}
                    >
                      <FaCog size={16} />
                    </button>
                  </div>
                ))
              ) : (
                <p className={themeClasses.textSecondary}>No connections found.</p>
              )}
            </div>
            <div className={`${themeClasses.cardBackground} ${themeClasses.border} rounded-2xl border-2 p-4 sm:p-6 transition-all duration-300 hover:border-[#4ECDC4]/50`}>
              <h2 className={`text-xl sm:text-2xl font-bold ${themeClasses.textPrimary} mb-4`}>
                Safety Tips
              </h2>
              {isLoading ? (
                <p className={themeClasses.textSecondary}>Loading safety tips...</p>
              ) : safetyTips.length > 0 ? (
                safetyTips.map((tip) => (
                  <div
                    key={tip.id}
                    className={`flex items-center space-x-4 mb-2 p-2 rounded-2xl ${themeClasses.hover} hover:scale-105 transition-all duration-300 cursor-pointer`}
                    onClick={() => {
                      setSelectedSafetyTip(tip);
                      setShowSafetyTipModal(true);
                    }}
                  >
                    <div className="w-10 h-10 rounded-full bg-[#4ECDC4] flex items-center justify-center text-white">
                      {iconMap[tip.icon] ? (
                        React.createElement(iconMap[tip.icon] || FaInfoCircle)
                      ) : (
                        <FaInfoCircle />
                      )}
                    </div>
                    <p className={`${themeClasses.textPrimary} font-bold`}>{tip.name}</p>
                  </div>
                ))
              ) : (
                <p className={themeClasses.textSecondary}>No safety tips available.</p>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="w-full lg:w-2/4 p-4 sm:p-6 min-h-0">
          {/* Center column: fixed in page layout, inner content scrolls on hover */}
          <div className="h-full scrollbar-hidden scroll-on-hover space-y-4" style={{ maxHeight: 'calc(100vh - 140px)' }}>
            <div className={`${themeClasses.welcomeCard} ${themeClasses.border} rounded-2xl border-2 p-4 sm:p-6 mb-4 sm:mb-6 flex items-center justify-center transition-all duration-300 hover:border-[#4ECDC4]/50`}>
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-14 rounded-full ${theme === "dark" ? "bg-gray-600" : "bg-black/20"} flex items-center justify-center ${theme === "dark" ? "text-white" : "text-black"} text-xl`}>
                  {userProfile?.avatar ? (
                    <img
                      src={userProfile.avatar}
                      className="w-full h-full rounded-full"
                      alt="Profile"
                    />
                  ) : (
                    <FaUser className={theme === "dark" ? "text-white" : "text-white"} />
                  )}
                </div>
                <div>
                  <span className={`${theme === "dark" ? "text-white" : "text-white"} text-lg sm:text-xl font-bold`}>
                    Welcome, {isLoading ? "..." : (userProfile?.first_name || userProfile?.first_name || "User")}!
                  </span>
                </div>
              </div>
            </div>
            {error && (
              <div className={`${theme === "dark" ? "bg-red-900/50 border-red-600 text-red-300" : "bg-red-100 border-red-400 text-red-700"} border px-4 py-3 rounded-2xl mb-4 sm:mb-6  transition-all duration-300`}>
                {error}
              </div>
            )}
            {success && (
              <div className={`${theme === "dark" ? "bg-green-900/50 border-green-600 text-green-300" : "bg-green-100 border-green-400 text-green-700"} border px-4 py-3 rounded-2xl mb-4 sm:mb-6  transition-all duration-300`}>
                {success}
              </div>
            )}
            {activeTab === "home" && (
              <div className={`${themeClasses.emergencyCard} ${themeClasses.border} rounded-2xl border-2 p-4 sm:p-6 transition-all duration-300 hover:border-[#4ECDC4]/50`}>
                <div className="flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-6">
                  <h2 className={`text-xl sm:text-2xl font-bold ${themeClasses.textPrimary}`}>
                    Recent Emergencies
                  </h2>
                  <div className="flex flex-wrap space-x-2 mt-2 sm:mt-0">
                    <button
                      onClick={() => setEmergencyFilter("nearby")}
                      className={`px-3 py-1 rounded-lg transition-all duration-300 hover:scale-105 ${emergencyFilter === "nearby"
                        ? "bg-[#4ECDC4] hover:bg-[#3abfb2] text-white"
                        : `${themeClasses.buttonSecondary}`
                        }`}
                    >
                      Nearby (5km)
                    </button>
                    <button
                      onClick={() => setEmergencyFilter("all")}
                      className={`px-3 py-1 rounded-lg transition-all duration-300 hover:scale-105 ${emergencyFilter === "all"
                        ? "bg-[#4ECDC4] hover:bg-[#3abfb2] text-white"
                        : `${themeClasses.buttonSecondary}`
                        }`}
                    >
                      All
                    </button>
                    <button
                      onClick={refreshFeed}
                      className="bg-[#FFD166] hover:bg-[#d88e00] text-white px-3 py-1 rounded-lg hover:scale-105 transition-all duration-300"
                    >
                      Refresh
                    </button>
                  </div>
                </div>
                {isLoading ? (
                  <p className={themeClasses.textSecondary}>Loading emergencies...</p>
                ) : emergencies.length > 0 ? (
                  <div>
                    {emergencies.map((emergency) => (
                      <div
                        key={emergency.id}
                        className={`${themeClasses.cardBackground} ${themeClasses.border} rounded-2xl border-2 p-3 sm:p-4 mb-2 sm:mb-4 hover:scale-105 transition-all duration-300 hover:border-[#4ECDC4]/50 cursor-pointer`}
                      >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                          <div className="w-10 h-10 rounded-full bg-[#4ECDC4] flex items-center justify-center text-white">
                            {emergency.avatar ? (
                              <img
                                src={emergency.avatar}
                                className="w-full h-full rounded-full"
                                alt={emergency.name}
                              />
                            ) : (
                              <span>🚨</span>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-[#4ECDC4]">{emergency.emergency_type}</p>
                            <p className={`text-sm ${themeClasses.textPrimary}`}>{emergency.message}</p>
                            <p className={`text-sm ${themeClasses.textSecondary}`}>Reported by {emergency.name} on {new Date(emergency.created_at).toLocaleString()}</p>
                          </div>
                          <div className="flex space-x-2 sm:space-x-3">
                            <button
                              onClick={() => handleViewLocation(emergency)}
                              className="bg-[#4ECDC4] hover:bg-[#3abfb2] text-white px-3 py-1 sm:px-4 sm:py-2 rounded-lg text-sm hover:scale-105 transition-all duration-300 flex items-center"
                            >
                              <FaMapMarkerAlt className="mr-1 sm:mr-2" />
                              View
                            </button>
                            <button
                              onClick={() => handleCallAssistance(emergency)}
                              className="bg-[#FFD166] hover:bg-[#d88e00] text-white px-3 py-1 sm:px-4 sm:py-2 rounded-lg text-sm hover:scale-105 transition-all duration-300 flex items-center"
                            >
                              <FaPhone className="mr-1 sm:mr-2" />
                              Call
                            </button>
                            <button
                              onClick={() => handleReport(emergency)}
                              className="bg-[#E63946] hover:bg-[#a33d16] text-white px-3 py-1 sm:px-4 sm:py-2 rounded-lg text-sm hover:scale-105 transition-all duration-300 flex items-center"
                            >
                              <FaExclamationTriangle className="mr-1 sm:mr-2" />
                              Report
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={themeClasses.textSecondary}>No emergencies found.</p>
                )}
              </div>
            )}
            {activeTab === "message" && (
              <div className={`${themeClasses.messageCard} ${themeClasses.border} rounded-2xl border-2 p-4 sm:p-6 transition-all duration-300 hover:border-[#4ECDC4]/50`}>
                {showChatList ? (
                  <>
                    <h2 className={`flex justify-center text-xl sm:text-2xl font-bold ${themeClasses.textPrimary} mb-4`}>
                      Messages
                    </h2>
                    {isLoading ? (
                      <p className={themeClasses.textSecondary}>Loading messages...</p>
                    ) : connections.length > 0 ? (
                      connections.map((connection) => (
                        <div
                          key={connection.id}
                          className={`flex items-center justify-between space-x-4 mb-2 cursor-pointer ${themeClasses.hover} p-2 rounded-2xl hover:scale-105 transition-all duration-300`}
                          onClick={() => handleSelectConnection(connection)}
                        >
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 rounded-full bg-[#4ECDC4] flex items-center justify-center text-white">
                              {connection.avatar ? (
                                <img
                                  src={connection.avatar}
                                  className="w-full h-full rounded-full"
                                  alt={connection.name}
                                />
                              ) : (
                                <FaUser className="text-white" />
                              )}
                            </div>
                            <span className={`${themeClasses.textPrimary} font-bold`}>{connection.name}</span>
                          </div>
                          <span
                            className={`h-3 w-3 rounded-full ${connection.is_online ? "bg-green-500" : "bg-gray-400"
                              }`}
                          ></span>
                        </div>
                      ))
                    ) : (
                      <p className={themeClasses.textSecondary}>No connections to message.</p>
                    )}
                  </>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <button
                          onClick={() => setShowChatList(true)}
                          className="text-[#4ECDC4] hover:text-[#3abfb2] flex items-center transition-all duration-300 hover:scale-105 mr-3"
                          aria-label="Back to conversations"
                        >
                          <FaArrowLeft className="" />
                        </button>
                        <h2 className={`text-xl sm:text-2xl font-bold text-[#4ECDC4]`}>
                          {currentChatRecipient}
                        </h2>
                      </div>
                    </div>
                    <div
                      ref={chatContainerRef}
                      className={`h-96 overflow-y-auto ${themeClasses.chatBackground} rounded-2xl p-4 mb-4`}
                    >
                      {getMessagesForRecipient(selectedConnection?.connected_user_id || "").map(
                        (message, index, messages) => {
                          const currentMessage = message;
                          const previousMessage = index > 0 ? messages[index - 1] : null;

                          // Check if this is a new message (within last 5 minutes)
                          const isNewMessage = () => {
                            const messageTime = new Date(currentMessage.timestamp).getTime();
                            const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
                            return messageTime > fiveMinutesAgo;
                          };

                          // Check if we should show date separator
                          const shouldShowDateSeparator = () => {
                            if (!previousMessage) return true;
                            const currentDate = new Date(currentMessage.timestamp).toDateString();
                            const previousDate = new Date(previousMessage.timestamp).toDateString();
                            return currentDate !== previousDate;
                          };

                          // Format date for separator
                          const formatDateSeparator = (timestamp: string) => {
                            const date = new Date(timestamp);
                            const today = new Date();
                            const yesterday = new Date(today);
                            yesterday.setDate(yesterday.getDate() - 1);

                            if (date.toDateString() === today.toDateString()) {
                              return "Today";
                            } else if (date.toDateString() === yesterday.toDateString()) {
                              return "Yesterday";
                            } else {
                              return date.toLocaleDateString();
                            }
                          };

                          return (
                            <div key={message.id}>
                              {shouldShowDateSeparator() && (
                                <div className="flex items-center justify-center my-4">
                                  <div className={`px-3 py-1 rounded-full text-xs ${themeClasses.textSecondary} bg-gray-200/50 ${theme === "dark" ? "bg-gray-700/50" : "bg-gray-200/50"}`}>
                                    {formatDateSeparator(currentMessage.timestamp)}
                                  </div>
                                </div>
                              )}

                              {isNewMessage() && index === messages.length - 1 && (
                                <div className="flex items-center justify-center my-2">
                                  <div className="px-3 py-1 rounded-full text-xs bg-green-100 text-green-600 border border-green-200">
                                    ✨ New Message
                                  </div>
                                </div>
                              )}

                              <div
                                className={`flex ${message.sender_id === userProfile?.id
                                  ? "justify-end"
                                  : "justify-start"
                                  } mb-2`}
                              >
                                <div
                                  className={`max-w-xs sm:max-w-md p-3 rounded-2xl ${message.sender_id === userProfile?.id
                                    ? "bg-[#4ECDC4] text-white"
                                    : `${themeClasses.messageBubble} ${themeClasses.textPrimary}`
                                    } ${isNewMessage() ? "ring-2 ring-green-300 ring-opacity-50" : ""}`}
                                >
                                  <p className="text-sm">{message.content}</p>
                                  <div className={`flex items-center justify-between text-xs mt-1 ${message.sender_id === userProfile?.id ? "text-gray-400" : themeClasses.textTertiary}`}>
                                    <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
                                    {isNewMessage() && (
                                      <span className="text-green-400">●</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        placeholder="Type a message..."
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                        className={`flex-1 ${themeClasses.input} rounded-2xl px-4 py-2 text-sm border focus:ring-[#4ECDC4] focus:border-[#4ECDC4] transition-all duration-300`}
                      />
                      <button
                        onClick={handleSendMessage}
                        className="bg-[#4ECDC4] hover:bg-[#3abfb2] text-white p-2 rounded-full hover:scale-105 transition-all duration-300"
                      >
                        <FaPaperPlane size={16} />
                      </button>
                    </div>
                    {messageSent && (
                      <p className="text-green-500 text-sm mt-2 animate-in fade-in duration-300">
                        Message sent!
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
            {activeTab === "report" && (
              <div className={`${themeClasses.reportCard} ${themeClasses.border} rounded-2xl border-2 p-4 sm:p-6 transition-all duration-300 hover:border-[#4ECDC4]/50`}>
                <h2 className={`text-xl sm:text-2xl font-bold ${themeClasses.textPrimary} mb-4`}>
                  Report an Emergency
                </h2>
                {!userProfile && (
                  <div className="mb-4 p-3 bg-yellow-100 text-yellow-800 rounded-lg">
                    <p className="text-sm">Please wait while we load your profile...</p>
                  </div>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {[
                    { type: "Medical", icon: FaAmbulance },
                    { type: "General", icon: FaInfoCircle },
                    { type: "Fire", icon: FaFire },
                    { type: "Accident", icon: FaCarCrash },
                    { type: "Crime", icon: FaShieldAlt },
                  ].map(({ type, icon: Icon }) => (
                    <button
                      key={type}
                      onClick={() => {
                        if (!userProfile) {
                          setAutoDismissError("Please wait for your profile to load before reporting an emergency.");
                          return;
                        }
                        console.log("Emergency button clicked for type:", type);
                        setSelectedAlertType(type);
                        setSelectedCrisisAlert(null); // Reset to ensure new report
                        setShowCrisisModal(true);
                        console.log("Crisis modal should now be visible");
                      }}
                      disabled={!userProfile}
                      className={`${!userProfile ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#E63946] hover:scale-105 hover:border-red-500'} text-white p-4 rounded-2xl border-2 border-red-600 flex flex-col items-center justify-center transition-all duration-300`}
                    >
                      <Icon size={24} className="mb-2" />
                      <span className="text-sm font-bold">{type}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-full lg:w-1/4 flex flex-col space-y-4 sm:space-y-6 min-h-0">
          {/* Right sidebar scrollable on hover */}
          <div className="h-full scrollbar-hidden scroll-on-hover space-y-4" style={{ maxHeight: 'calc(100vh - 140px)' }}>
            <div className={`${themeClasses.alertCard} ${themeClasses.border} rounded-2xl border-2 p-4 sm:p-6 transition-all duration-300 hover:border-[#4ECDC4]/50`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className={`text-xl sm:text-2xl font-bold ${themeClasses.textPrimary}`}>Safe Alerts</h2>
                <div className="flex items-center space-x-2">
                  <div className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                    {allSafeAlerts.length}
                  </div>
                  <button
                    onClick={() => {
                      // Scroll to top of safe alerts
                      const container = document.querySelector('.safe-alerts-container');
                      if (container) container.scrollTop = 0;
                    }}
                    className="p-1 text-gray-400 hover:text-[#4ECDC4] transition-colors duration-200"
                  >
                    <FaArrowLeft size={12} />
                  </button>
                </div>
              </div>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4ECDC4]"></div>
                  <p className={`${themeClasses.textSecondary} ml-2`}>Loading alerts...</p>
                </div>
              ) : allSafeAlerts.length > 0 ? (
                <div className="safe-alerts-container max-h-64 overflow-y-auto overflow-x-hidden space-y-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  {allSafeAlerts.map((alert, index) => (
                    <div
                      key={alert.id}
                      className={`group relative flex items-center justify-between space-x-4 p-3 rounded-2xl ${themeClasses.hover} hover:scale-[1.02] transition-all duration-300 cursor-pointer border border-transparent hover:border-[#4ECDC4]/20`}
                      onClick={async () => {
                        setSelectedCrisisAlert(alert);
                        if (alert.type === "Safe" && alert.related_crisis_id) {
                          const crisisType = await getCrisisType(alert.related_crisis_id);
                          setOriginalCrisisType(crisisType);
                        } else {
                          setOriginalCrisisType(alert.type);
                        }
                        setShowCrisisModal(true);
                      }}
                    >
                      {/* New message indicator */}
                      {index === 0 && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      )}

                      <div className="flex items-center space-x-3 min-w-0 flex-1">
                        <div className="relative">
                          <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-full group-hover:scale-110 transition-transform duration-300">
                            <FaCheckDouble size={16} className="text-green-600" />
                          </div>
                          {alert.user_id === userProfile?.id && (
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#4ECDC4] rounded-full flex items-center justify-center">
                              <span className="text-white text-xs font-bold">U</span>
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          {alert.user_id === userProfile?.id ? (
                            <p className={`${themeClasses.textPrimary} font-bold truncate`}>You marked yourself safe</p>
                          ) : (
                            <p className={`${themeClasses.textPrimary} font-bold truncate`}>{alert.reporter} marked themselves safe</p>
                          )}
                          <div className="flex items-center space-x-2">
                            <p className={`text-xs ${themeClasses.textSecondary} truncate`}>
                              {new Date(alert.created_at).toLocaleDateString()}
                            </p>
                            <span className="text-xs text-gray-400">•</span>
                            <p className={`text-xs ${themeClasses.textSecondary}`}>
                              {new Date(alert.created_at).toLocaleTimeString()}
                            </p>
                          </div>
                          {/* Status indicator */}
                          <div className="flex items-center space-x-1 mt-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-xs text-green-600 font-medium">Safe</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col space-y-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkSafe(alert.user_id === userProfile?.id ? alert.related_crisis_id : undefined);
                          }}
                          className="bg-[#E63946] hover:bg-[#a33d16] text-white px-2 py-1 rounded-lg text-xs hover:scale-105 transition-all duration-300 flex items-center space-x-1"
                        >
                          <FaTimes size={8} />
                          <span>Unmark</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Quick view details
                            setSelectedCrisisAlert(alert);
                            setShowCrisisModal(true);
                          }}
                          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded-lg text-xs hover:scale-105 transition-all duration-300 flex items-center space-x-1"
                        >
                          <FaEye size={8} />
                          <span>View</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <FaCheckDouble size={24} className="text-green-600" />
                  </div>
                  <p className={`${themeClasses.textSecondary} mb-2`}>No safe alerts</p>
                  <p className="text-xs text-gray-400">Users will appear here when they mark themselves safe</p>
                </div>
              )}
            </div>
            <div className={`${themeClasses.alertCard} ${themeClasses.border} rounded-2xl border-2 p-4 sm:p-6 transition-all duration-300 hover:border-[#4ECDC4]/50 overflow-hidden`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className={`text-xl sm:text-2xl font-bold ${themeClasses.textPrimary}`}>Pending Crisis Alerts</h2>
                <div className="flex items-center space-x-2">
                  <div className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                    {pendingCrisisAlerts.length}
                  </div>
                  <button
                    onClick={() => {
                      // Scroll to top of pending alerts
                      const container = document.querySelector('.pending-alerts-container');
                      if (container) container.scrollTop = 0;
                    }}
                    className="p-1 text-gray-400 hover:text-[#4ECDC4] transition-colors duration-200"
                  >
                    <FaArrowLeft size={12} />
                  </button>
                </div>
              </div>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
                  <p className={`${themeClasses.textSecondary} ml-2`}>Loading pending alerts...</p>
                </div>
              ) : pendingCrisisAlerts.length > 0 ? (
                <div className="pending-alerts-container max-h-64 overflow-y-auto overflow-x-hidden space-y-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  {pendingCrisisAlerts.map((alert, index) => {
                    const AlertIcon = iconMap[alert.type] || FaExclamationTriangle;
                    const alertColors = {
                      'Medical': 'bg-red-100 text-red-600',
                      'Fire': 'bg-orange-100 text-orange-600',
                      'Accident': 'bg-yellow-100 text-yellow-600',
                      'Crime': 'bg-purple-100 text-purple-600',
                      'General': 'bg-blue-100 text-blue-600'
                    };
                    const colorClass = alertColors[alert.type as keyof typeof alertColors] || 'bg-gray-100 text-gray-600';

                    return (
                      <div
                        key={alert.id}
                        className={`group relative flex items-center justify-between space-x-4 p-3 rounded-2xl ${themeClasses.hover} hover:scale-[1.02] transition-all duration-300 cursor-pointer border border-transparent hover:border-red-200`}
                        onClick={async () => {
                          setSelectedCrisisAlert(alert);
                          if (alert.type === "Safe" && alert.related_crisis_id) {
                            const crisisType = await getCrisisType(alert.related_crisis_id);
                            setOriginalCrisisType(crisisType);
                          } else {
                            setOriginalCrisisType(alert.type);
                          }
                          setShowCrisisModal(true);
                        }}
                      >
                        {/* Urgent indicator for recent alerts */}
                        {index === 0 && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                        )}

                        <div className="flex items-center space-x-3 min-w-0 flex-1">
                          <div className="relative">
                            <div className={`flex items-center justify-center w-10 h-10 ${colorClass} rounded-full group-hover:scale-110 transition-transform duration-300`}>
                              <AlertIcon size={16} />
                            </div>
                            {/* Priority indicator */}
                            {index < 3 && (
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs font-bold">{index + 1}</span>
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center space-x-2">
                              <p className={`${themeClasses.textPrimary} font-bold truncate`}>{alert.type} Alert</p>
                              <span className={`px-2 py-1 ${colorClass} rounded-full text-xs font-medium`}>
                                {alert.type}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <p className={`text-xs ${themeClasses.textSecondary} truncate`}>
                                Reported by {alert.reporter}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <p className={`text-xs ${themeClasses.textSecondary} truncate`}>
                                {new Date(alert.created_at).toLocaleDateString()}
                              </p>
                              <span className="text-xs text-gray-400">•</span>
                              <p className={`text-xs ${themeClasses.textSecondary}`}>
                                {new Date(alert.created_at).toLocaleTimeString()}
                              </p>
                            </div>
                            {/* Urgency indicator */}
                            <div className="flex items-center space-x-1 mt-1">
                              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                              <span className="text-xs text-red-600 font-medium">Pending Response</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col space-y-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkSafe(alert.id);
                            }}
                            className="bg-[#4ECDC4] hover:bg-[#3abfb2] text-white px-2 py-1 rounded-lg text-xs hover:scale-105 transition-all duration-300 flex items-center space-x-1"
                          >
                            <FaCheckDouble size={8} />
                            <span>Safe</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // Quick view details
                              setSelectedCrisisAlert(alert);
                              setShowCrisisModal(true);
                            }}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded-lg text-xs hover:scale-105 transition-all duration-300 flex items-center space-x-1"
                          >
                            <FaEye size={8} />
                            <span>View</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <FaCheckDouble size={24} className="text-green-600" />
                  </div>
                  <p className={`${themeClasses.textSecondary} mb-2`}>No pending alerts</p>
                  <p className="text-xs text-gray-400">All crisis alerts have been addressed</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`${themeClasses.modal} ${themeClasses.border} rounded-2xl p-6 w-full max-w-md border-2 transition-all duration-300 animate-in fade-in zoom-in`}>
            <h2 className="text-xl font-bold text-[#4ECDC4] mb-4">Confirm Logout</h2>
            <p className={`${themeClasses.textSecondary} mb-6`}>Are you sure you want to log out?</p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className={`${themeClasses.hover} ${themeClasses.textPrimary} px-4 py-2 rounded-lg hover:scale-105 transition-all duration-300`}
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="bg-[#E63946] hover:bg-[#a33d16] text-white px-4 py-2 rounded-lg hover:scale-105 transition-all duration-300"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
      {showProfile && selectedSearchProfile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`${themeClasses.modal} ${themeClasses.border} rounded-2xl p-6 w-full max-w-lg border-2 transition-all duration-300 animate-in fade-in zoom-in`}>
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-20 h-20 rounded-full bg-[#4ECDC4] flex items-center justify-center text-white border-4 border-white ">
                {selectedSearchProfile.avatar ? (
                  <img
                    src={selectedSearchProfile.avatar}
                    className="w-full h-full rounded-full object-cover"
                    alt={selectedSearchProfile.name}
                  />
                ) : (
                  <span className="text-2xl"><FaUser size={30} /></span>
                )}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-[#4ECDC4] mb-1">
                  {selectedSearchProfile.name}
                </h2>
                <p className={`${themeClasses.textSecondary} mb-2`}>{selectedSearchProfile.email}</p>
                {selectedSearchProfile.id === userProfile?.id && (
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-green-600 font-medium">Online</span>
                  </div>
                )}
              </div>
            </div>

            {/* User Statistics */}
            {selectedSearchProfile.id === userProfile?.id && (
              <div className="mb-6">
                <h3 className={`text-lg font-bold ${themeClasses.textPrimary} mb-4`}>Your Activity Stats</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className={`${themeClasses.cardBackground} rounded-xl p-4 border ${themeClasses.border} text-center hover: transition-all duration-300`}>
                    <div className="text-2xl font-bold text-green-600 mb-1">
                      {userSafeAlerts.length}
                    </div>
                    <div className={`text-sm ${themeClasses.textSecondary}`}>
                      Times Marked Safe
                    </div>
                    <div className={`text-xs ${themeClasses.textTertiary} mt-1`}>
                      Safety Score: {userSafeAlerts.length > 5 ? 'Excellent' : userSafeAlerts.length > 2 ? 'Good' : 'Getting Started'}
                    </div>
                  </div>
                  <div className={`${themeClasses.cardBackground} rounded-xl p-4 border ${themeClasses.border} text-center hover: transition-all duration-300`}>
                    <div className="text-2xl font-bold text-red-600 mb-1">
                      {pendingCrisisAlerts.filter(alert => alert.user_id === userProfile?.id).length}
                    </div>
                    <div className={`text-sm ${themeClasses.textSecondary}`}>
                      Crisis Alerts Sent
                    </div>
                    <div className={`text-xs ${themeClasses.textTertiary} mt-1`}>
                      Emergency Reports
                    </div>
                  </div>
                  <div className={`${themeClasses.cardBackground} rounded-xl p-4 border ${themeClasses.border} text-center hover: transition-all duration-300`}>
                    <div className="text-2xl font-bold text-blue-600 mb-1">
                      {connections.length}
                    </div>
                    <div className={`text-sm ${themeClasses.textSecondary}`}>
                      Connections
                    </div>
                    <div className={`text-xs ${themeClasses.textTertiary} mt-1`}>
                      Network Size
                    </div>
                  </div>
                  <div className={`${themeClasses.cardBackground} rounded-xl p-4 border ${themeClasses.border} text-center hover: transition-all duration-300`}>
                    <div className="text-2xl font-bold text-purple-600 mb-1">
                      {messages.filter(msg => msg.sender_id === userProfile?.id).length}
                    </div>
                    <div className={`text-sm ${themeClasses.textSecondary}`}>
                      Messages Sent
                    </div>
                    <div className={`text-xs ${themeClasses.textTertiary} mt-1`}>
                      Communication
                    </div>
                  </div>
                </div>

                {/* Additional Stats */}
                <div className="grid grid-cols-3 gap-3 mt-4">
                  <div className={`${themeClasses.cardBackground} rounded-lg p-3 border ${themeClasses.border} text-center`}>
                    <div className="text-lg font-bold text-orange-600">
                      {notifications.filter(n => !n.read).length}
                    </div>
                    <div className={`text-xs ${themeClasses.textSecondary}`}>Unread</div>
                  </div>
                  <div className={`${themeClasses.cardBackground} rounded-lg p-3 border ${themeClasses.border} text-center`}>
                    <div className="text-lg font-bold text-teal-600">
                      {allSafeAlerts.length}
                    </div>
                    <div className={`text-xs ${themeClasses.textSecondary}`}>Total Safe</div>
                  </div>
                  <div className={`${themeClasses.cardBackground} rounded-lg p-3 border ${themeClasses.border} text-center`}>
                    <div className="text-lg font-bold text-indigo-600">
                      {emergencies.length}
                    </div>
                    <div className={`text-xs ${themeClasses.textSecondary}`}>Emergencies</div>
                  </div>
                </div>
              </div>
            )}

            {/* Connection Stats for Other Users */}
            {selectedSearchProfile.id !== userProfile?.id && (
              <div className="mb-6">
                <h3 className={`text-lg font-bold ${themeClasses.textPrimary} mb-4`}>Connection Info</h3>
                <div className={`${themeClasses.cardBackground} rounded-xl p-4 border ${themeClasses.border} mb-4`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className={`font-medium ${themeClasses.textPrimary}`}>
                        Connection Status
                      </div>
                      <div className={`text-sm ${themeClasses.textSecondary} mt-1`}>
                        {isConnected(selectedSearchProfile.id)
                          ? "Connected"
                          : selectedSearchProfile.connectionStatus === "request_sent"
                            ? "Request Sent"
                            : selectedSearchProfile.connectionStatus === "request_received"
                              ? "Request Received"
                              : "Not Connected"
                        }
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${isConnected(selectedSearchProfile.id)
                      ? "bg-green-100 text-green-800"
                      : selectedSearchProfile.connectionStatus === "request_sent"
                        ? "bg-yellow-100 text-yellow-800"
                        : selectedSearchProfile.connectionStatus === "request_received"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                      }`}>
                      {isConnected(selectedSearchProfile.id)
                        ? "✓ Connected"
                        : selectedSearchProfile.connectionStatus === "request_sent"
                          ? "⏳ Pending"
                          : selectedSearchProfile.connectionStatus === "request_received"
                            ? "📨 Request"
                            : "○ Not Connected"
                      }
                    </div>
                  </div>
                </div>

                {/* Other User's Activity Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className={`${themeClasses.cardBackground} rounded-lg p-3 border ${themeClasses.border} text-center`}>
                    <div className="text-lg font-bold text-green-600">
                      {allSafeAlerts.filter(alert => alert.user_id === selectedSearchProfile.id).length}
                    </div>
                    <div className={`text-xs ${themeClasses.textSecondary}`}>Safe Alerts</div>
                  </div>
                  <div className={`${themeClasses.cardBackground} rounded-lg p-3 border ${themeClasses.border} text-center`}>
                    <div className="text-lg font-bold text-blue-600">
                      {messages.filter(msg => msg.sender_id === selectedSearchProfile.id).length}
                    </div>
                    <div className={`text-xs ${themeClasses.textSecondary}`}>Messages</div>
                  </div>
                  <div className={`${themeClasses.cardBackground} rounded-lg p-3 border ${themeClasses.border} text-center`}>
                    <div className="text-lg font-bold text-orange-600">
                      {pendingCrisisAlerts.filter(alert => alert.user_id === selectedSearchProfile.id).length}
                    </div>
                    <div className={`text-xs ${themeClasses.textSecondary}`}>Crisis Reports</div>
                  </div>
                  <div className={`${themeClasses.cardBackground} rounded-lg p-3 border ${themeClasses.border} text-center`}>
                    <div className="text-lg font-bold text-purple-600">
                      {connections.filter(conn => conn.connected_user_id === selectedSearchProfile.id).length}
                    </div>
                    <div className={`text-xs ${themeClasses.textSecondary}`}>Connections</div>
                  </div>
                </div>
              </div>
            )}

            {selectedSearchProfile.id !== userProfile?.id && (
              <>
                {isConnected(selectedSearchProfile.id) ? (
                  <button
                    onClick={() => handleRemoveConnection(selectedSearchProfile.id)}
                    className="w-full bg-[#E63946] hover:bg-[#a33d16] text-white px-4 py-2 rounded-lg hover:scale-105 transition-all duration-300 flex items-center justify-center"
                  >
                    <FaUserMinus className="mr-2" />
                    Remove Connection
                  </button>
                ) : (
                  <>
                    {selectedSearchProfile.connectionStatus === "request_sent" ? (
                      <div className="w-full bg-gray-500 text-white px-4 py-2 rounded-lg flex items-center justify-center">
                        <FaCheck className="mr-2" />
                        Connection Request Sent
                      </div>
                    ) : (
                      <button
                        onClick={() => handleSendConnectionRequest(selectedSearchProfile.id)}
                        className="w-full bg-[#4ECDC4] hover:bg-[#3abfb2] text-white px-4 py-2 rounded-lg hover:scale-105 transition-all duration-300 flex items-center justify-center"
                      >
                        <FaUserPlus className="mr-2" />
                        Send Connection Request
                      </button>
                    )}
                  </>
                )}
              </>
            )}
            {selectedSearchProfile.id === userProfile?.id && (
              <button
                onClick={() => {
                  setShowProfile(false);
                  setShowEditProfile(true);
                  setEditProfileData({
                    name: userProfile?.name,
                    avatar: userProfile?.avatar,
                  });
                }}
                className="w-full bg-[#FFD166] hover:bg-[#d88e00] text-white px-4 py-2 rounded-lg hover:scale-105 transition-all duration-300 flex items-center justify-center"
              >
                <FaEdit className="mr-2" />
                Edit Profile
              </button>
            )}
            <button
              onClick={() => setShowProfile(false)}
              className={`w-full ${themeClasses.hover} ${themeClasses.textPrimary} px-4 py-2 rounded-lg mt-4 hover:scale-105 transition-all duration-300`}
            >
              Close
            </button>
          </div>
        </div>
      )}
      {showEditProfile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`${themeClasses.modal} ${themeClasses.border} rounded-2xl p-6 w-full max-w-md border-2 transition-all duration-300 animate-in fade-in zoom-in`}>
            <h2 className="text-xl font-bold text-[#4ECDC4] mb-4">Edit Profile</h2>
            <div className="space-y-6">
              <div>
                <label className={`block ${themeClasses.textSecondary} mb-1`}>Name</label>
                <input
                  type="text"
                  value={editProfileData.name || userProfile?.name || ""}
                  onChange={(e) =>
                    setEditProfileData({ ...editProfileData, name: e.target.value })
                  }
                  className={`w-full ${themeClasses.input} rounded-2xl px-4 py-2 text-sm border focus:ring-[#4ECDC4] focus:border-[#4ECDC4] transition-all duration-300`}
                />
              </div>

              {/* Profile Picture Upload */}
              <div>
                <label className={`block ${themeClasses.textSecondary} mb-3`}>Profile Picture</label>

                {/* Current/Preview Image */}
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-20 h-20 rounded-full bg-[#4ECDC4] flex items-center justify-center text-white overflow-hidden">
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        className="w-full h-full rounded-full object-cover"
                        alt="Profile preview"
                      />
                    ) : userProfile?.avatar ? (
                      <img
                        src={userProfile.avatar}
                        className="w-full h-full rounded-full object-cover"
                        alt="Current profile"
                      />
                    ) : (
                      <FaUser size={24} />
                    )}
                  </div>
                  <div>
                    <div className={`text-sm ${themeClasses.textPrimary} font-medium`}>
                      {previewUrl ? "New Image Selected" : "Current Profile Picture"}
                    </div>
                    <div className={`text-xs ${themeClasses.textSecondary}`}>
                      {selectedFile ? `${selectedFile.name} (${(selectedFile.size / 1024 / 1024).toFixed(2)} MB)` : "No file selected"}
                    </div>
                  </div>
                </div>

                {/* File Upload Input */}
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="profile-picture-upload"
                  />
                  <label
                    htmlFor="profile-picture-upload"
                    className={`${themeClasses.cardBackground} ${themeClasses.border} border-2 border-dashed rounded-2xl p-6 cursor-pointer hover:border-[#4ECDC4] transition-all duration-300 flex flex-col items-center justify-center text-center`}
                  >
                    <div className="text-3xl mb-2">📷</div>
                    <div className={`text-sm ${themeClasses.textPrimary} font-medium mb-1`}>
                      Click to upload profile picture
                    </div>
                    <div className={`text-xs ${themeClasses.textSecondary}`}>
                      PNG, JPG, GIF up to 5MB
                    </div>
                  </label>
                </div>

                {/* Remove Image Button */}
                {(selectedFile || userProfile?.avatar) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl(null);
                      setEditProfileData({ ...editProfileData, avatar: "" });
                    }}
                    className="mt-3 text-sm text-red-600 hover:text-red-800 transition-colors duration-200"
                  >
                    Remove current image
                  </button>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => {
                  setShowEditProfile(false);
                  setSelectedFile(null);
                  setPreviewUrl(null);
                  setEditProfileData({});
                }}
                className={`${themeClasses.hover} ${themeClasses.textPrimary} px-4 py-2 rounded-lg hover:scale-105 transition-all duration-300`}
              >
                Cancel
              </button>
              <button
                onClick={handleEditProfile}
                disabled={!editProfileData.name && !selectedFile}
                className={`px-4 py-2 rounded-lg hover:scale-105 transition-all duration-300 ${editProfileData.name || selectedFile
                  ? "bg-[#4ECDC4] hover:bg-[#3abfb2] text-white"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`${themeClasses.modal} ${themeClasses.border} rounded-2xl p-6 w-full max-w-md border-2 transition-all duration-300 animate-in fade-in zoom-in`}>
            <h2 className={`text-xl font-bold text-[#4ECDC4] mb-4`}>Settings</h2>
            <div className="space-y-4">
              <div>
                <label className={`block ${themeClasses.textSecondary} mb-1`}>Notifications</label>
                <select className={`w-full ${themeClasses.input} rounded-2xl px-4 py-2 text-sm border focus:ring-[#4ECDC4] focus:border-[#4ECDC4] transition-all duration-300`}>
                  <option>Enabled</option>
                  <option>Disabled</option>
                </select>
              </div>
              <div>
                <label className={`block ${themeClasses.textSecondary} mb-1`}>Theme</label>
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value as "light" | "dark")}
                  className={`w-full ${themeClasses.input} rounded-2xl px-4 py-2 text-sm border focus:ring-[#4ECDC4] focus:border-[#4ECDC4] transition-all duration-300`}
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>
            </div>
            <button
              onClick={() => setShowSettings(false)}
              className={`w-full ${themeClasses.hover} ${themeClasses.textPrimary} px-4 py-2 rounded-lg mt-6 hover:scale-105 transition-all duration-300`}
            >
              Close
            </button>
          </div>
        </div>
      )}
      {showLocationView && selectedEmergency && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`${themeClasses.modal} ${themeClasses.border} rounded-2xl p-6 w-full max-w-md border-2 transition-all duration-300 animate-in fade-in zoom-in`}>
            <h2 className="text-xl font-bold text-[#4ECDC4] mb-4">
              Emergency Location
            </h2>
            <p className={`${themeClasses.textSecondary} mb-4`}>
              {selectedEmergency.emergency_type} reported by {selectedEmergency.name}
            </p>
            <div className={`${themeClasses.input} rounded-2xl p-4 mb-4`}>
              <img
                src={mapImage}
                alt="Map"
                className="w-full h-48 object-cover rounded-2xl"
              />
              <p className={`text-sm ${themeClasses.textSecondary} mt-2`}>
                Lat: {selectedLocation?.lat.toFixed(4)}, Lng: {selectedLocation?.lng.toFixed(4)}
              </p>
            </div>
            <button
              onClick={() => setShowLocationView(false)}
              className={`w-full ${themeClasses.hover} ${themeClasses.textPrimary} px-4 py-2 rounded-lg hover:scale-105 transition-all duration-300`}
            >
              Close
            </button>
          </div>
        </div>
      )}
      {showCallConfirm && selectedEmergencyForAction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`${themeClasses.modal} ${themeClasses.border} rounded-2xl p-6 w-full max-w-md border-2 transition-all duration-300 animate-in fade-in zoom-in`}>
            <h2 className="text-xl font-bold text-[#4ECDC4] mb-4">
              Confirm Call
            </h2>
            <p className={`${themeClasses.textSecondary} mb-6`}>
              Call assistance for {selectedEmergencyForAction.emergency_type} reported by {selectedEmergencyForAction.name}?
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowCallConfirm(false)}
                className={`${themeClasses.buttonSecondary} px-4 py-2 rounded-lg hover:scale-105 transition-all duration-300`}
              >
                Cancel
              </button>
              <button
                onClick={initiateCall}
                className="bg-[#FFD166] hover:bg-[#d88e00] text-white px-4 py-2 rounded-lg hover:scale-105 transition-all duration-300"
              >
                Call
              </button>
            </div>
          </div>
        </div>
      )}
      {showReportConfirm && selectedEmergencyForAction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`${themeClasses.modal} ${themeClasses.border} rounded-2xl p-6 w-full max-w-md border-2 transition-all duration-300 animate-in fade-in zoom-in`}>
            <h2 className="text-xl font-bold text-[#4ECDC4] mb-4">
              Confirm Report
            </h2>
            <p className={`${themeClasses.textSecondary} mb-6`}>
              Report {selectedEmergencyForAction.emergency_type} by {selectedEmergencyForAction.name}?
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowReportConfirm(false)}
                className={`${themeClasses.buttonSecondary} px-4 py-2 rounded-lg hover:scale-105 transition-all duration-300`}
              >
                Cancel
              </button>
              <button
                onClick={submitReport}
                className="bg-[#E63946] hover:bg-[#a33d16] text-white px-4 py-2 rounded-lg hover:scale-105 transition-all duration-300"
              >
                Report
              </button>
            </div>
          </div>
        </div>
      )}

      {showCrisisModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`${themeClasses.modal} ${themeClasses.border} rounded-2xl p-6 w-full max-w-md border-2 transition-all duration-300 animate-in fade-in zoom-in`}>
            {selectedCrisisAlert ? (
              <>
                <h2 className="text-xl font-bold text-[#4ECDC4] mb-4">
                  Crisis Details
                </h2>
                <p className={`${themeClasses.textSecondary} mb-2`}>
                  <strong>Type:</strong> {selectedCrisisAlert.type === "Safe" ? originalCrisisType : selectedCrisisAlert.type}
                </p>
                <p className={`${themeClasses.textSecondary} mb-2`}>
                  <strong>Reported by:</strong> {selectedCrisisAlert.reporter}
                </p>
                <p className={`${themeClasses.textSecondary} mb-2`}>
                  <strong>Time:</strong>{" "}
                  {new Date(selectedCrisisAlert.created_at).toLocaleString()}
                </p>
                <p className={`${themeClasses.textSecondary} mb-2`}>
                  <strong>Location:</strong> Lat: {selectedCrisisAlert.location.lat.toFixed(4)}, Lng: {selectedCrisisAlert.location.lng.toFixed(4)}
                </p>
                <div className={`${themeClasses.textSecondary} mb-4`}>
                  <strong>Connections Marked Safe:</strong>
                  {getConnectedSafeUsers(selectedCrisisAlert.marked_safe_users).length > 0 ? (
                    <ul className="list-disc list-inside mt-2">
                      {getConnectedSafeUsers(selectedCrisisAlert.marked_safe_users).map((name, index) => (
                        <li key={index} className={`text-sm ${themeClasses.textPrimary}`}>{name}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className={`text-sm ${themeClasses.textSecondary} mt-2`}>No connections have marked themselves safe.</p>
                  )}
                </div>
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => {
                      setShowCrisisModal(false);
                      setSelectedCrisisAlert(null); // Reset to prevent accidental state retention
                    }}
                    className={`${themeClasses.buttonSecondary} px-4 py-2 rounded-lg hover:scale-105 transition-all duration-300`}
                  >
                    Close
                  </button>
                  {!selectedCrisisAlert.responded_safe && (
                    <button
                      onClick={() => handleMarkSafe(selectedCrisisAlert.id)}
                      className="bg-[#4ECDC4] hover:bg-[#3abfb2] text-white px-4 py-2 rounded-lg hover:scale-105 transition-all duration-300"
                    >
                      Mark Safe
                    </button>
                  )}
                </div>
              </>
            ) : (
              <>
                <h2 className="text-xl font-bold text-[#4ECDC4] mb-4">
                  Confirm Emergency
                </h2>
                <p className={`${themeClasses.textSecondary} mb-6`}>
                  Are you sure you want to trigger a {selectedAlertType} emergency alert at your location (Lat: {userLocation.lat.toFixed(4)}, Lng: {userLocation.lng.toFixed(4)})?
                </p>
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => {
                      setShowCrisisModal(false);
                      setSelectedAlertType(null); // Reset to prevent state retention
                    }}
                    className={`${themeClasses.buttonSecondary} px-4 py-2 rounded-lg hover:scale-105 transition-all duration-300`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      console.log("Confirm emergency button clicked for type:", selectedAlertType);
                      if (selectedAlertType) {
                        console.log("Calling handleEmergencyAlert with type:", selectedAlertType);
                        handleEmergencyAlert(selectedAlertType);
                        setShowCrisisModal(false);
                        setSelectedAlertType(null);
                      }
                    }}
                    className="bg-[#E63946] hover:bg-[#a33d16] text-white px-4 py-2 rounded-lg hover:scale-105 transition-all duration-300"
                  >
                    Confirm
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      {showAlertConfirm && crisisAlert && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`${themeClasses.modal} ${themeClasses.border} rounded-2xl p-6 w-full max-w-md border-2 transition-all duration-300 animate-in fade-in zoom-in`}>
            <h2 className="text-xl font-bold text-[#4ECDC4] mb-4">
              Emergency Alert Triggered
            </h2>
            <p className={`${themeClasses.textSecondary} mb-2`}>
              <strong>Type:</strong> {crisisAlert.type}
            </p>
            <p className={`${themeClasses.textSecondary} mb-2`}>
              <strong>Location:</strong> Lat: {crisisAlert.location.lat.toFixed(4)}, Lng: {crisisAlert.location.lng.toFixed(4)}
            </p>
            <p className={`${themeClasses.textSecondary} mb-6`}>
              {isSafe
                ? "You have marked yourself as safe."
                : "You can mark yourself as safe when the situation is resolved."}
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={resetCrisisAlert}
                className={`${themeClasses.buttonSecondary} px-4 py-2 rounded-lg hover:scale-105 transition-all duration-300`}
              >
                Close
              </button>
              {!isSafe && (
                <button
                  onClick={() => handleMarkSafe(crisisAlert.id)}
                  className="bg-[#4ECDC4] hover:bg-[#3abfb2] text-white px-4 py-2 rounded-lg hover:scale-105 transition-all duration-300"
                >
                  Mark Safe
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      {showSafetyTipModal && selectedSafetyTip && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`${themeClasses.modal} ${themeClasses.border} rounded-2xl p-6 w-full max-w-md border-2 transition-all duration-300 animate-in fade-in zoom-in`}>
            <h2 className="text-xl font-bold text-[#4ECDC4] mb-4">{selectedSafetyTip.name}</h2>
            <p className={`${themeClasses.textSecondary} mb-6`}>{selectedSafetyTip.content}</p>
            <button
              onClick={() => setShowSafetyTipModal(false)}
              className={`w-full ${themeClasses.buttonSecondary} px-4 py-2 rounded-lg hover:scale-105 transition-all duration-300`}
            >
              Close
            </button>
          </div>
        </div>
      )}
      {showConnectionOptions && selectedConnection && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`${themeClasses.modal} ${themeClasses.border} rounded-2xl p-6 w-full max-w-md border-2 transition-all duration-300 animate-in fade-in zoom-in`}>
            <h2 className="text-xl font-bold text-[#4ECDC4] mb-4">
              Connection Options
            </h2>
            <button
              onClick={() => handleConnectionAction("message", selectedConnection)}
              className="w-full bg-[#4ECDC4] hover:bg-[#3abfb2] text-white px-4 py-2 rounded-lg mb-2 hover:scale-105 transition-all duration-300 flex items-center"
            >
              <FaEnvelope className="mr-2" />
              Message
            </button>
            <button
              onClick={() => handleConnectionAction("profile", selectedConnection)}
              className="w-full bg-[#FFD166] hover:bg-[#d88e00] text-white px-4 py-2 rounded-lg mb-2 hover:scale-105 transition-all duration-300 flex items-center"
            >
              <FaUser className="mr-2" />
              View Profile
            </button>
            <button
              onClick={() => setShowConnectionOptions(false)}
              className={`w-full ${themeClasses.buttonSecondary} px-4 py-2 rounded-lg hover:scale-105 transition-all duration-300`}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;