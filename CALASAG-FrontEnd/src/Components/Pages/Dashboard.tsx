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
  FaTimes,
  FaEnvelope,
  FaPhoneAlt,
  FaInfoCircle,
  FaMapMarkedAlt,
  FaFire,
  FaShieldAlt,
  FaCarCrash,
  FaAmbulance,
  FaUserPlus,
  FaEdit,
  FaArrowLeft,
  FaPaperPlane,
} from "react-icons/fa";
import logoImage from "../Images/no-bg-logo.png";
import mapImage from "../Images/ph-map.png";
import { supabase } from "../../db";

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
}

interface SearchResult {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
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
  const [currentPage, setCurrentPage] = useState<number>(1);
  const alertsPerPage = 4;
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const iconMap: { [key: string]: React.ElementType } = {
    FaAmbulance,
    FaInfoCircle,
    FaFire,
    FaCarCrash,
    FaShieldAlt,
  };

  // Memoized unread notification count
  const unreadNotificationCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  // Calculate total pages and current page alerts for safe alerts
  const totalSafePages = Math.ceil(userSafeAlerts.length / alertsPerPage);
  const indexOfLastSafeAlert = currentPage * alertsPerPage;
  const indexOfFirstSafeAlert = indexOfLastSafeAlert - alertsPerPage;
  const currentSafeAlerts = userSafeAlerts.slice(indexOfFirstSafeAlert, indexOfLastSafeAlert);

  // Calculate total pages and current page alerts for pending alerts
  const totalPendingPages = Math.ceil(pendingCrisisAlerts.length / alertsPerPage);
  const indexOfLastPendingAlert = currentPage * alertsPerPage;
  const indexOfFirstPendingAlert = indexOfLastPendingAlert - alertsPerPage;
  const currentPendingAlerts = pendingCrisisAlerts.slice(indexOfFirstPendingAlert, indexOfLastPendingAlert);

  // Handle page change
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
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
      return data || [];
    } catch (error: any) {
      console.error("Error fetching users:", error);
      setError(`Failed to fetch users: ${error.message}`);
      return [];
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from("users")
        .select("user_id, name, email, avatar")
        .ilike("name", `%${query}%`)
        .neq("user_id", userProfile?.id);
      if (error) throw new Error(`Search error: ${error.message}`);
      setSearchResults(
        data?.map((user) => ({
          id: user.user_id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
        })) || []
      );
      setShowSearchResults(true);
    } catch (error: any) {
      console.error("Error searching users:", error);
      setError(`Failed to search users: ${error.message}`);
    }
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

      const { data: existingRequest } = await supabase
        .from("connection_requests")
        .select("*")
        .eq("sender_id", user.id)
        .eq("recipient_id", recipientId)
        .eq("status", "pending")
        .single();

      if (existingRequest) {
        setError("Connection request already pending.");
        return;
      }

      const { data: existingConnection } = await supabase
        .from("connections")
        .select("*")
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .or(`user1_id.eq.${recipientId},user2_id.eq.${recipientId}`)
        .single();

      if (existingConnection) {
        setError("You are already connected with this user.");
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

      const { error: notificationError } = await supabase
        .from("notifications")
        .insert({
          user_id: recipientId,
          type: "connection_request",
          message: `${
            senderData?.name || "User"
          } sent a connection request to ${recipientData?.name || "User"}.`,
          read: false,
          created_at: new Date().toISOString(),
        });
      if (notificationError) {
        throw new Error(`Notification error: ${notificationError.message}`);
      }

      setError(null);
      setShowProfile(false);
      setShowSearchResults(false);
      setSearchQuery("");
      alert("Connection request sent successfully!");
    } catch (error: any) {
      console.error("Error sending connection request:", error);
      setError(
        error.message === "Recipient ID is missing"
          ? "Cannot send connection request: No user selected."
          : `Failed to send connection request: ${error.message}`
      );
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

      const { error } = await supabase
        .from("connection_requests")
        .update({ status: action })
        .eq("id", requestId)
        .eq("recipient_id", user.id);
      if (error)
        throw new Error(`Connection request update error: ${error.message}`);

      setConnectionRequests((prev) =>
        prev.map((req) =>
          req.id === requestId ? { ...req, status: action } : req
        )
      );

      if (action === "accepted") {
        const { data: requestData } = await supabase
          .from("connection_requests")
          .select("sender_id, recipient_id")
          .eq("id", requestId)
          .single();
        if (requestData) {
          const { data: senderData } = await supabase
            .from("users")
            .select("name, avatar")
            .eq("user_id", requestData.sender_id)
            .single();
          const { data: recipientData } = await supabase
            .from("users")
            .select("name")
            .eq("user_id", requestData.recipient_id)
            .single();
          setNotifications((prev) => [
            {
              id: Date.now(),
              user_id: user.id,
              type: "connection_accepted",
              message: `${
                recipientData?.name || "User"
              } accepted a connection with ${senderData?.name || "User"}.`,
              read: false,
              created_at: new Date().toISOString(),
            },
            ...prev,
          ]);

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
      }
    } catch (error: any) {
      console.error(`Error ${action} connection request:`, error);
      setError(`Failed to ${action} connection request: ${error.message}`);
    }
  };

  const handleEditProfile = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user");

      const { error } = await supabase
        .from("users")
        .update({
          name: editProfileData.name || userProfile?.name,
          avatar: editProfileData.avatar || userProfile?.avatar,
        })
        .eq("user_id", user.id);
      if (error) throw new Error(`Profile update error: ${error.message}`);

      setUserProfile((prev) =>
        prev
          ? {
              ...prev,
              name: editProfileData.name || prev.name,
              avatar: editProfileData.avatar || prev.avatar,
            }
          : prev
      );
      setActiveUser(editProfileData.name || userProfile?.name || "User");
      setShowEditProfile(false);
      setEditProfileData({});
      alert("Profile updated successfully!");
    } catch (error: any) {
      console.error("Error updating profile:", error);
      setError(`Failed to update profile: ${error.message}`);
    }
  };

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
          .select("user_id, name, email, role, avatar")
          .eq("user_id", user.id)
          .single();
        if (profileError) {
          throw new Error(`Profile fetch error: ${profileError.message}`);
        }
        if (profileData) {
          setActiveUser(profileData.name || "User");
          setUserProfile({
            id: profileData.user_id,
            name: profileData.name || "User",
            email: profileData.email,
            role: profileData.role || "user",
            avatar: profileData.avatar,
          });
        }

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
            .select("*")
            .eq("user_id", user.id)
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
        setMessages(
          messagesData?.map((msg) => ({
            id: msg.id,
            sender_id: msg.sender_id,
            receiver_id: msg.receiver_id,
            content: msg.content,
            timestamp: msg.timestamp,
            sender_name: msg.sender?.name || "Unknown User",
            receiver_name: msg.receiver?.name || "Unknown User",
          })) || []
        );

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
          .channel("notifications")
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "notifications",
              filter: `user_id=eq.${user.id}`,
            },
            (payload) => {
              setNotifications((prev) => {
                if (prev.some((n) => n.id === payload.new.id)) {
                  return prev;
                }
                return [payload.new as Notification, ...prev].slice(0, 50);
              });
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
              setNotifications((prev) =>
                prev.map((n) =>
                  n.id === payload.new.id ? { ...n, read: payload.new.read } : n
                )
              );
            }
          )
          .subscribe((status, err) => {
            if (err) console.error("Notification subscription error:", err);
          });

        const connectionRequestSubscription = supabase
          .channel("connection_requests")
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "connection_requests",
              filter: `recipient_id=eq.${user.id}`,
            },
            async (payload) => {
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
                  message: `${
                    senderData?.name || "User"
                  } sent a connection request to ${
                    userProfile?.name || "User"
                  }.`,
                  read: false,
                  created_at: newRequest.created_at,
                },
                ...prev,
              ]);
            }
          )
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "connection_requests",
              filter: `recipient_id=eq.${user.id}`,
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
            if (err)
              console.error("Connection request subscription error:", err);
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
            if (err) console.error("Message subscription error:", err);
          });

        const crisisAlertSubscription = supabase
          .channel("crisis_alerts")
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "crisis_alerts",
            },
            async (payload) => {
              const newAlert = payload.new as CrisisAlert;
              if (newAlert.user_id !== user.id) {
                if (newAlert.type === "Safe" && connectionIds.includes(newAlert.user_id)) {
                  const { data: userData } = await supabase
                    .from("users")
                    .select("name")
                    .eq("user_id", newAlert.user_id)
                    .single();
                  setCrisisAlerts((prev) => [
                    {
                      ...newAlert,
                      reporter: userData?.name || "Unknown User",
                      marked_safe_users: [{ user_id: newAlert.user_id, name: userData?.name || "Unknown User" }],
                      responded_safe: newAlert.user_id === user.id,
                    },
                    ...prev,
                  ].sort((a, b) => {
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                  }).slice(0, 50));
                } else if (newAlert.type !== "Safe") {
                  // Check if user has already marked safe for this
                  const { data: safeForThis } = await supabase
                    .from("crisis_alerts")
                    .select("id")
                    .eq("type", "Safe")
                    .eq("related_crisis_id", newAlert.id)
                    .eq("user_id", user.id);
                  if (!safeForThis || safeForThis.length === 0) {
                    setPendingCrisisAlerts((prev) => [newAlert, ...prev]);
                  }
                }
              } else if (newAlert.type === "Safe") {
                setUserSafeAlerts((prev) => [newAlert, ...prev]);
                // Remove from pending if it was there
                setPendingCrisisAlerts((prev) => prev.filter(p => p.id !== newAlert.related_crisis_id));
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
            (payload) => {
              // Handle unmark safe: remove from userSafeAlerts and add back to pending if applicable
              setUserSafeAlerts((prev) => prev.filter(s => s.id !== payload.old.id));
              // Logic to add back to pending would require knowing the related_crisis_id
            }
          )
          .subscribe((status, err) => {
            if (err) console.error("Crisis alert subscription error:", err);
          });

        return () => {
          supabase.removeChannel(notificationSubscription);
          supabase.removeChannel(connectionRequestSubscription);
          supabase.removeChannel(messageSubscription);
          supabase.removeChannel(crisisAlertSubscription);
        };
      } catch (err: any) {
        console.error("Error fetching data:", err);
        setError(`Failed to load dashboard data: ${err.message}`);
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
      setError(`Failed to refresh emergencies: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmergencyAlert = async (type: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user");

      const newAlert = {
        user_id: user.id,
        type,
        reporter: activeUser || "User",
        is_self: true,
        created_at: new Date().toISOString(),
        location: userLocation,
        responded_safe: false,
      };

      const newEmergency = {
        user_id: user.id,
        name: activeUser || "User",
        avatar: userProfile?.avatar || null,
        emergency_type: type,
        message: `Urgent ${type} alert triggered!`,
        location: userLocation,
        created_at: new Date().toISOString(),
      };

      const { data: insertedAlert, error: alertError } = await supabase
        .from("crisis_alerts")
        .insert(newAlert)
        .select()
        .single();
      if (alertError)
        throw new Error(`Crisis alert insert error: ${alertError.message}`);

      const { error: emergencyError } = await supabase
        .from("emergencies")
        .insert(newEmergency);
      if (emergencyError)
        throw new Error(`Emergency insert error: ${emergencyError.message}`);

      const allUsers = await fetchAllUsers();
      const notifications = allUsers
        .filter((u) => u.id !== user.id)
        .map((u) => ({
          user_id: u.id,
          type: "emergency",
          message: `${activeUser || "User"} triggered a ${type} alert at Lat: ${
            userLocation.lat
          }, Lng: ${userLocation.lng}!`,
          read: false,
          created_at: new Date().toISOString(),
        }));

      if (notifications.length > 0) {
        const { error: notificationError } = await supabase
          .from("notifications")
          .insert(notifications);
        if (notificationError)
          throw new Error(
            `Notification insert error: ${notificationError.message}`
          );
      }

      setCrisisAlert(insertedAlert);
      setIsSafe(false);
      setSelectedAlertType(type);
      setShowAlertConfirm(true);
      // Add to pending if it's the user's own
      setPendingCrisisAlerts((prev) => [insertedAlert, ...prev]);
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
    } catch (error: any) {
      console.error("Error creating emergency alert:", error);
      setError(`Failed to create emergency alert: ${error.message}`);
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
      }
      const { data: existingSafeAlert } = await query.limit(1);

      if (existingSafeAlert && existingSafeAlert.length > 0) {
        // Unmark safe
        const { error } = await supabase
          .from("crisis_alerts")
          .delete()
          .eq("id", existingSafeAlert[0].id);
        if (error) throw new Error(`Unmark safe error: ${error.message}`);

        setCrisisAlerts((prev) =>
          prev.map((crisis) =>
            crisis.id === crisisId
              ? {
                  ...crisis,
                  responded_safe: false,
                  marked_safe_users: crisis.marked_safe_users?.filter(
                    (u) => u.user_id !== user.id
                  ) || [],
                }
              : crisis
          ).sort((a, b) => {
            if (a.responded_safe === b.responded_safe) {
              return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            }
            return a.responded_safe ? 1 : -1;
          })
        );

        setSelectedCrisisAlert((prev) =>
          prev && prev.id === crisisId
            ? {
                ...prev,
                responded_safe: false,
                marked_safe_users: prev.marked_safe_users?.filter(
                  (u) => u.user_id !== user.id
                ) || [],
              }
            : prev
        );

        if (!crisisId) {
          setIsSafe(false);
          setUserSafeAlerts((prev) =>
            prev.filter((alert) => alert.id !== existingSafeAlert[0].id)
          );
        }

        // Add back to pending if it was a crisis
        if (crisisId) {
          const { data: crisisData } = await supabase
            .from("crisis_alerts")
            .select("*")
            .eq("id", crisisId)
            .single();
          if (crisisData) {
            setPendingCrisisAlerts((prev) => [...prev, crisisData]);
          }
        }

        const allUsers = await fetchAllUsers();
        const notifications = allUsers
          .filter((u) => u.id !== user.id)
          .map((u) => ({
            user_id: u.id,
            type: "safe_alert_removed",
            message: `${
              activeUser || "User"
            } unmarked themselves as safe for crisis #${crisisId}`,
            read: false,
            created_at: new Date().toISOString(),
          }));

        if (notifications.length > 0) {
          const { error: notificationError } = await supabase
            .from("notifications")
            .insert(notifications);
          if (notificationError)
            throw new Error(
              `Notification insert error: ${notificationError.message}`
            );
        }
      } else {
        // Mark safe
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

        setCrisisAlerts((prev) =>
          prev.map((crisis) =>
            crisis.id === crisisId
              ? {
                  ...crisis,
                  responded_safe: true,
                  marked_safe_users: [
                    ...(crisis.marked_safe_users || []),
                    { user_id: user.id, name: activeUser || "User" },
                  ],
                }
              : crisis
          ).sort((a, b) => {
            if (a.responded_safe === b.responded_safe) {
              return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            }
            return a.responded_safe ? 1 : -1;
          })
        );

        setSelectedCrisisAlert((prev) =>
          prev && prev.id === crisisId
            ? {
                ...prev,
                responded_safe: true,
                marked_safe_users: [
                  ...(prev.marked_safe_users || []),
                  { user_id: user.id, name: activeUser || "User" },
                ],
              }
            : prev
        );

        setCrisisAlert(insertedAlert);
        if (!crisisId) {
          setIsSafe(true);
          setUserSafeAlerts((prev) => [insertedAlert, ...prev]);
        } else {
          setUserSafeAlerts((prev) => [insertedAlert, ...prev]);
          // Remove from pending
          setPendingCrisisAlerts((prev) => prev.filter(p => p.id !== crisisId));
        }

        const allUsers = await fetchAllUsers();
        const notifications = allUsers
          .filter((u) => u.id !== user.id)
          .map((u) => ({
            user_id: u.id,
            type: "safe_alert",
            message: `${
              activeUser || "User"
            } marked themselves as safe for crisis #${crisisId}`,
            read: false,
            created_at: new Date().toISOString(),
          }));

        if (notifications.length > 0) {
          const { error: notificationError } = await supabase
            .from("notifications")
            .insert(notifications);
          if (notificationError)
            throw new Error(
              `Notification insert error: ${notificationError.message}`
            );
        }
      }
    } catch (error: any) {
      console.error("Error toggling safe status:", error);
      setError(`Failed to toggle safe status: ${error.message}`);
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
      setError(`Failed to clear notifications: ${error.message}`);
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
      setError(`Failed to log out: ${error.message}`);
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
      setError(`Failed to mark notification as read: ${error.message}`);
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
      setError(`Failed to submit report: ${error.message}`);
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

      const newMessage = {
        sender_id: user.id,
        receiver_id: selectedConnection.connected_user_id,
        content: messageText,
        timestamp: new Date().toISOString(),
        sender_name: userProfile?.name || "User",
        receiver_name: receiverData?.name || "User",
      };

      const { error } = await supabase.from("messages").insert({
        sender_id: newMessage.sender_id,
        receiver_id: newMessage.receiver_id,
        content: newMessage.content,
        timestamp: newMessage.timestamp,
      });
      if (error) throw new Error(`Message send error: ${error.message}`);
      setMessages([...messages, newMessage]);
      setMessageText("");
      setMessageSent(true);
      setTimeout(() => setMessageSent(false), 1500);
    } catch (error: any) {
      console.error("Error sending message:", error);
      setError(`Failed to send message: ${error.message}`);
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
    <div className="min-h-screen bg-[#f8eed4] flex flex-col">
      {/* Navbar */}
      <div className="bg-[#f8eed4] border-b border-gray-300 p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between shadow-sm">
        <div className="flex items-center w-full sm:w-auto mb-4 sm:mb-0">
          <img src={logoImage} className="h-10 w-auto sm:h-12" alt="Logo" />
          <div className="ml-0 sm:ml-4 relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="bg-white rounded-2xl px-4 py-2 w-full text-sm border border-gray-100 focus:ring-[#005524] focus:border-[#005524] transition-all duration-300"
            />
            <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-[#005524] transition-colors duration-200">
              <FaSearch size={16} />
            </button>
            {showSearchResults && (
              <div className="absolute top-full left-0 mt-2 w-full sm:w-64 bg-white rounded-2xl shadow-xl z-50 max-h-60 overflow-y-auto animate-in fade-in duration-300 border border-gray-100 hover:border-[#005524]/20">
                {searchResults.length > 0 ? (
                  searchResults.map((user) => (
                    <div
                      key={user.id}
                      className="px-4 py-3 hover:bg-gray-50 hover:scale-105 transition-all duration-300 cursor-pointer flex items-center space-x-3 rounded-2xl"
                      onClick={() => {
                        setSelectedSearchProfile(user);
                        setShowProfile(true);
                        setShowSearchResults(false);
                        setSearchQuery("");
                      }}
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#005524] to-[#f69f00] flex items-center justify-center text-white">
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            className="w-full h-full rounded-full"
                            alt={user.name}
                          />
                        ) : (
                          <span>👤</span>
                        )}
                      </div>
                      <div>
                        <p className="text-[#005524] font-bold">{user.name}</p>
                        <p className="text-sm text-gray-600">{user.email}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="px-4 py-3 text-gray-600">No users found.</p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-center space-x-4 sm:space-x-8">
          <button
            onClick={() => handleNavigation("home")}
            className={`flex flex-col items-center transition-all duration-300 ${
              activeTab === "home"
                ? "text-[#005524]"
                : "text-gray-600 hover:text-[#005524] hover:scale-110"
            }`}
          >
            <FaHome size={20} />
            <span className="text-xs mt-1">Home</span>
          </button>
          <button
            onClick={() => handleNavigation("message")}
            className={`flex flex-col items-center transition-all duration-300 ${
              activeTab === "message"
                ? "text-[#005524]"
                : "text-gray-600 hover:text-[#005524] hover:scale-110"
            }`}
          >
            <FaEnvelope size={20} />
            <span className="text-xs mt-1">Message</span>
          </button>
          <button
            onClick={() => handleNavigation("report")}
            className={`flex flex-col items-center transition-all duration-300 ${
              activeTab === "report"
                ? "text-[#005524]"
                : "text-gray-600 hover:text-[#005524] hover:scale-110"
            }`}
          >
            <FaExclamationTriangle size={20} />
            <span className="text-xs mt-1">Report</span>
          </button>
        </div>

        <div className="flex items-center space-x-4 mt-4 sm:mt-0">
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative focus:outline-none hover:bg-gray-100 rounded-full p-2 transition-all duration-300 hover:scale-110"
            >
              <FaBell size={20} className="text-[#f69f00]" />
              {unreadNotificationCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#be4c1d] text-white rounded-full h-5 w-5 flex items-center justify-center text-xs">
                  {unreadNotificationCount}
                </span>
              )}
            </button>
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-full sm:w-80 bg-white rounded-2xl shadow-xl py-2 z-50 animate-in fade-in duration-300 border border-gray-100 hover:border-[#005524]/20">
                <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="text-lg font-bold text-[#005524]">
                    Notifications
                  </h3>
                  <button
                    onClick={clearAllNotifications}
                    className="text-sm text-[#be4c1d] hover:text-[#a33d16] transition-colors duration-200"
                  >
                    Clear All
                  </button>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`px-4 py-3 hover:bg-gray-50 hover:scale-105 transition-all duration-300 cursor-pointer rounded-2xl ${
                          !notification.read ? "bg-[#005524]/5" : ""
                        }`}
                        onClick={() => markNotificationAsRead(notification.id)}
                      >
                        <p className="text-gray-900 text-sm">{notification.message}</p>
                        <p className="text-xs text-gray-600">
                          {new Date(notification.created_at).toLocaleString()}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="px-4 py-3 text-gray-600">No notifications.</p>
                  )}
                  {connectionRequests.length > 0 && (
                    <div className="border-t border-gray-100 py-2">
                      <h3 className="px-4 py-2 text-lg font-bold text-[#005524]">
                        Connection Requests
                      </h3>
                      {connectionRequests.map((request) => (
                        <div
                          key={request.id}
                          className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 hover:scale-105 transition-all duration-300 rounded-2xl"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#005524] to-[#f69f00] flex items-center justify-center text-white">
                              {request.sender_avatar ? (
                                <img
                                  src={request.sender_avatar}
                                  className="w-full h-full rounded-full"
                                  alt={request.sender_name}
                                />
                              ) : (
                                <span>👤</span>
                              )}
                            </div>
                            <p className="text-gray-900 text-sm">
                              {request.sender_name} wants to connect
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() =>
                                handleConnectionRequestAction(
                                  request.id,
                                  "accepted"
                                )
                              }
                              className="bg-[#005524] hover:bg-[#004015] text-white px-3 py-1 rounded-lg text-sm hover:scale-105 transition-all duration-300"
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
                              className="bg-[#be4c1d] hover:bg-[#a33d16] text-white px-3 py-1 rounded-lg text-sm hover:scale-105 transition-all duration-300"
                            >
                              <FaTimes className="inline mr-1" /> Reject
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center space-x-2 focus:outline-none hover:bg-gray-100 rounded-2xl px-3 py-2 transition-all duration-300 hover:scale-105"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#005524] to-[#f69f00] flex items-center justify-center text-white">
                {userProfile?.avatar ? (
                  <img
                    src={userProfile.avatar}
                    className="w-full h-full rounded-full"
                    alt="Profile"
                  />
                ) : (
                  <span>👤</span>
                )}
              </div>
              <div className="flex items-center text-[#005524]">
                <span className="font-bold">
                  {isLoading ? "Loading..." : activeUser || "User"}
                </span>
                <span
                  className={`ml-2 transition-transform duration-300 ${
                    showProfileMenu ? "rotate-180" : ""
                  }`}
                >
                  ▼
                </span>
              </div>
            </button>
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl py-2 z-50 animate-in fade-in duration-300 border border-gray-100 hover:border-[#005524]/20">
                <button
                  onClick={() => handleProfileAction("profile")}
                  className="w-full px-4 py-2 text-left text-gray-900 hover:bg-gray-50 hover:scale-105 transition-all duration-300 flex items-center rounded-2xl"
                >
                  <FaUser size={16} className="mr-2" />
                  Profile
                </button>
                <button
                  onClick={() => handleProfileAction("settings")}
                  className="w-full px-4 py-2 text-left text-gray-900 hover:bg-gray-50 hover:scale-105 transition-all duration-300 flex items-center rounded-2xl"
                >
                  <FaCog size={16} className="mr-2" />
                  Settings
                </button>
                <div className="border-t border-gray-100 my-1"></div>
                <button
                  onClick={() => handleProfileAction("logout")}
                  className="w-full px-4 py-2 text-left text-[#be4c1d] hover:bg-gray-50 hover:scale-105 transition-all duration-300 flex items-center rounded-2xl"
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
      <div className="flex flex-col lg:flex-row flex-1 relative px-4 sm:px-6 gap-4 sm:gap-6">
        {/* Left Sidebar */}
        <div className="w-full lg:w-1/4 flex flex-col space-y-4 sm:space-y-6">
          <div className="bg-gradient-to-br from-[#005524] to-[#005524] rounded-2xl shadow-xl p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl sm:text-2xl font-bold text-white">Your Device</h2>
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <span className="text-2xl">📱</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white/10 rounded-xl">
                <span className="text-white/90 font-medium">Device ID:</span>
                <span className="text-white font-bold">01-JD-C24</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white/10 rounded-xl">
                <span className="text-white/90 font-medium">Status:</span>
                <span
                  className={`font-bold px-3 py-1 rounded-full text-sm ${
                    deviceStatus === "Active"
                      ? "bg-green-500 text-white"
                      : "bg-red-500 text-white"
                  }`}
                >
                  {deviceStatus}
                </span>
              </div>
              <button
                className={`w-full py-3 px-4 rounded-xl font-bold text-white transition-all duration-300 transform hover:scale-105 shadow-lg ${
                  deviceStatus === "Active"
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
          <div className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-6 shadow-xl transition-all duration-300 hover:shadow-2xl hover:border-[#005524]/20">
            <h2 className="text-xl sm:text-2xl font-bold text-[#005524] mb-4">
              Connections
            </h2>
            {isLoading ? (
              <p className="text-gray-600">Loading connections...</p>
            ) : connections.length > 0 ? (
              connections.map((connection) => (
                <div
                  key={connection.id}
                  className="flex items-center justify-between space-x-4 mb-2 cursor-pointer hover:bg-gray-50 p-2 rounded-2xl hover:scale-105 transition-all duration-300"
                  onClick={() => handleSelectConnection(connection)}
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#005524] to-[#f69f00] flex items-center justify-center text-white">
                      {connection.avatar ? (
                        <img
                          src={connection.avatar}
                          className="w-full h-full rounded-full"
                          alt={connection.name}
                        />
                      ) : (
                        <span>👤</span>
                      )}
                    </div>
                    <span className="text-gray-900 font-bold">{connection.name}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedConnection(connection);
                      setShowConnectionOptions(true);
                    }}
                    className="text-gray-600 hover:text-[#005524] transition-colors duration-200"
                  >
                    <FaCog size={16} />
                  </button>
                </div>
              ))
            ) : (
              <p className="text-gray-600">No connections found.</p>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="w-full lg:w-2/4 p-4 sm:p-6">
          <div className="bg-gradient-to-br from-[#005524] to-[#005524] rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6 flex items-center justify-center shadow-xl transition-all duration-300 hover:shadow-2xl hover:border-[#005524]/20 border border-gray-100">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white text-xl">
                {userProfile?.avatar ? (
                  <img
                    src={userProfile.avatar}
                    className="w-full h-full rounded-full"
                    alt="Profile"
                  />
                ) : (
                  <span>👤</span>
                )}
              </div>
              <div>
                <span className="text-white text-lg sm:text-xl font-bold">
                  Welcome, {isLoading ? "Loading..." : activeUser || "User"}!
                </span>
                {userProfile && (
                  <p className="text-sm text-white/90">Role: {userProfile.role}</p>
                )}
              </div>
            </div>
          </div>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-2xl mb-4 sm:mb-6 shadow-xl transition-all duration-300">
              {error}
            </div>
          )}
          {activeTab === "home" && (
            <div className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-6 shadow-xl transition-all duration-300 hover:shadow-2xl hover:border-[#005524]/20">
              <div className="flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-[#005524]">
                  Recent Emergencies
                </h2>
                <div className="flex flex-wrap space-x-2 mt-2 sm:mt-0">
                  <button
                    onClick={() => setEmergencyFilter("nearby")}
                    className={`px-3 py-1 rounded-lg transition-all duration-300 hover:scale-105 ${
                      emergencyFilter === "nearby"
                        ? "bg-[#005524] hover:bg-[#004015] text-white"
                        : "bg-gray-200 text-gray-900 hover:bg-gray-300"
                    }`}
                  >
                    Nearby (5km)
                  </button>
                  <button
                    onClick={() => setEmergencyFilter("all")}
                    className={`px-3 py-1 rounded-lg transition-all duration-300 hover:scale-105 ${
                      emergencyFilter === "all"
                        ? "bg-[#005524] hover:bg-[#004015] text-white"
                        : "bg-gray-200 text-gray-900 hover:bg-gray-300"
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={refreshFeed}
                    className="bg-[#f69f00] hover:bg-[#d88e00] text-white px-3 py-1 rounded-lg hover:scale-105 transition-all duration-300"
                  >
                    Refresh
                  </button>
                </div>
              </div>
              {isLoading ? (
                <p className="text-gray-600">Loading emergencies...</p>
              ) : emergencies.length > 0 ? (
                <div>
                  {(() => {
                    const emergenciesPerPage = 4;
                    const totalEmergencyPages = Math.ceil(
                      emergencies.length / emergenciesPerPage
                    );
                    const indexOfLastEmergency = currentPage * emergenciesPerPage;
                    const indexOfFirstEmergency = indexOfLastEmergency - emergenciesPerPage;
                    const currentEmergencies = emergencies.slice(
                      indexOfFirstEmergency,
                      indexOfLastEmergency
                    );

                    return (
                      <>
                        {currentEmergencies.map((emergency) => (
                          <div
                            key={emergency.id}
                            className="bg-white rounded-2xl p-3 sm:p-4 mb-2 sm:mb-4 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 border border-gray-100 hover:border-[#005524]/20"
                          >
                            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#005524] to-[#f69f00] flex items-center justify-center text-white">
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
                                <p className="font-bold text-[#005524]">
                                  {emergency.emergency_type}
                                </p>
                                <p className="text-sm text-gray-900">
                                  {emergency.message}
                                </p>
                                <p className="text-sm text-gray-600">
                                  Reported by {emergency.name} at Lat:{" "}
                                  {emergency.location.lat}, Lng: {emergency.location.lng}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {new Date(emergency.created_at).toLocaleString()}
                                </p>
                              </div>
                              <div className="flex flex-col space-y-2 w-full sm:w-auto">
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    onClick={() => handleViewLocation(emergency)}
                                    className="bg-[#005524] hover:bg-[#004015] text-white px-3 py-1 rounded-lg text-sm hover:scale-105 transition-all duration-300 flex-1 sm:flex-none"
                                  >
                                    <FaMapMarkerAlt className="inline mr-1" /> View
                                  </button>
                                  <button
                                    onClick={() => handleCallAssistance(emergency)}
                                    className="bg-[#005524] hover:bg-[#004015] text-white px-3 py-1 rounded-lg text-sm hover:scale-105 transition-all duration-300 flex-1 sm:flex-none"
                                  >
                                    <FaPhoneAlt className="inline mr-1" /> Call Assistance
                                  </button>
                                </div>
                                <div className="border-t border-gray-100 my-1"></div>
                                <button
                                  onClick={() => handleReport(emergency)}
                                  className="bg-[#be4c1d] hover:bg-[#a33d16] text-white px-3 py-1 rounded-lg text-sm hover:scale-105 transition-all duration-300"
                                >
                                  <FaExclamationTriangle className="inline mr-1" /> Report
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                        {totalEmergencyPages > 1 && (
                          <div className="flex justify-center items-center space-x-2 mt-4">
                            <button
                              onClick={() => handlePageChange(currentPage - 1)}
                              disabled={currentPage === 1}
                              className={`px-3 py-1 rounded-lg transition-all duration-300 hover:scale-105 ${
                                currentPage === 1
                                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                  : "bg-[#005524] hover:bg-[#004015] text-white"
                              }`}
                            >
                              Previous
                            </button>
                            {[...Array(totalEmergencyPages)].map((_, index) => (
                              <button
                                key={index + 1}
                                onClick={() => handlePageChange(index + 1)}
                                className={`px-3 py-1 rounded-lg transition-all duration-300 hover:scale-105 ${
                                  currentPage === index + 1
                                    ? "bg-[#005524] text-white"
                                    : "bg-gray-200 text-gray-900 hover:bg-gray-300"
                                }`}
                              >
                                {index + 1}
                              </button>
                            ))}
                            <button
                              onClick={() => handlePageChange(currentPage + 1)}
                              disabled={currentPage === totalEmergencyPages}
                              className={`px-3 py-1 rounded-lg transition-all duration-300 hover:scale-105 ${
                                currentPage === totalEmergencyPages
                                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                  : "bg-[#005524] hover:bg-[#004015] text-white"
                              }`}
                            >
                              Next
                            </button>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              ) : (
                <p className="text-gray-600">No emergencies found.</p>
              )}
            </div>
          )}
          {activeTab === "report" && (
            <div className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-6 shadow-xl transition-all duration-300 hover:shadow-2xl hover:border-[#005524]/20">
              <h2 className="text-xl sm:text-2xl font-bold text-[#005524] mb-4 sm:mb-6">
                SOS Help
              </h2>
              <div className="flex flex-wrap gap-2 sm:gap-4 mb-4 sm:mb-6">
                <button
                  onClick={() => handleEmergencyAlert("Fire")}
                  className="bg-[#be4c1d] hover:bg-[#a33d16] text-white px-4 py-2 rounded-lg hover:scale-105 transition-all duration-300 flex-1 sm:flex-none"
                >
                  <FaFire className="inline mr-2" /> Fire
                </button>
                <button
                  onClick={() => handleEmergencyAlert("Medical")}
                  className="bg-[#005524] hover:bg-[#004015] text-white px-4 py-2 rounded-lg hover:scale-105 transition-all duration-300 flex-1 sm:flex-none"
                >
                  <FaAmbulance className="inline mr-2" /> Medical
                </button>
                <button
                  onClick={() => handleEmergencyAlert("Crime")}
                  className="bg-[#005524] hover:bg-[#004015] text-white px-4 py-2 rounded-lg hover:scale-105 transition-all duration-300 flex-1 sm:flex-none"
                >
                  <FaShieldAlt className="inline mr-2" /> Crime
                </button>
                <button
                  onClick={() => handleEmergencyAlert("Accident")}
                  className="bg-[#f69f00] hover:bg-[#d88e00] text-white px-4 py-2 rounded-lg hover:scale-105 transition-all duration-300 flex-1 sm:flex-none"
                >
                  <FaCarCrash className="inline mr-2" /> Accident
                </button>
              </div>
              {crisisAlert && crisisAlert.type !== "Safe" && !isSafe && (
                <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-[#005524]/20">
                  <p className="text-gray-900 font-bold">
                    Your Active Alert: {crisisAlert.type}
                  </p>
                  <p className="text-sm text-gray-600">
                    Reported at {new Date(crisisAlert.created_at).toLocaleString()}
                  </p>
                  <div className="mt-2 flex space-x-2">
                    <button
                      onClick={() => handleMarkSafe(crisisAlert.id)}
                      className="bg-[#005524] hover:bg-[#004015] text-white px-4 py-2 rounded-lg hover:scale-105 transition-all duration-300 flex-1 sm:flex-none"
                    >
                      <FaCheck className="inline mr-2" /> Mark Safe
                    </button>
                    <button
                      onClick={resetCrisisAlert}
                      className="bg-[#be4c1d] hover:bg-[#a33d16] text-white px-4 py-2 rounded-lg hover:scale-105 transition-all duration-300 flex-1 sm:flex-none"
                    >
                      <FaTimes className="inline mr-2" /> Clear Alert
                    </button>
                  </div>
                </div>
              )}
              <h2 className="text-xl sm:text-2xl font-bold text-[#005524] mt-6 mb-4 sm:mb-6">
                Your Safe Alerts
              </h2>
              {isLoading ? (
                <p className="text-gray-600">Loading safe alerts...</p>
              ) : (
                <div>
                  {/* Pending Crisis Alerts */}
                  {pendingCrisisAlerts.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-bold text-[#005524] mb-4">Pending Incidents</h3>
                      {currentPendingAlerts.map((alert) => (
                        <div
                          key={alert.id}
                          className="bg-yellow-50 rounded-2xl p-3 sm:p-4 mb-2 sm:mb-4 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 border border-yellow-200 hover:border-[#005524]/20"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-yellow-500 to-yellow-600 flex items-center justify-center text-white">
                                <FaExclamationTriangle />
                              </div>
                              <div>
                                <p className="font-bold text-[#005524]">{alert.type} Incident</p>
                                <p className="text-sm text-gray-600">
                                  Reported by {alert.reporter} at {new Date(alert.created_at).toLocaleString()}
                                </p>
                                <p className="text-sm text-gray-600">
                                  Location: Lat: {alert.location.lat}, Lng: {alert.location.lng}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => handleMarkSafe(alert.id)}
                              className="bg-[#005524] hover:bg-[#004015] text-white px-4 py-2 rounded-lg hover:scale-105 transition-all duration-300"
                            >
                              <FaCheck className="inline mr-2" /> Mark Safe
                            </button>
                          </div>
                        </div>
                      ))}
                      {totalPendingPages > 1 && (
                        <div className="flex justify-center items-center space-x-2 mt-4">
                          <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className={`px-3 py-1 rounded-lg transition-all duration-300 hover:scale-105 ${
                              currentPage === 1
                                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                : "bg-[#005524] hover:bg-[#004015] text-white"
                            }`}
                          >
                            Previous
                          </button>
                          {[...Array(totalPendingPages)].map((_, index) => (
                            <button
                              key={index + 1}
                              onClick={() => handlePageChange(index + 1)}
                              className={`px-3 py-1 rounded-lg transition-all duration-300 hover:scale-105 ${
                                currentPage === index + 1
                                  ? "bg-[#005524] text-white"
                                  : "bg-gray-200 text-gray-900 hover:bg-gray-300"
                              }`}
                            >
                              {index + 1}
                            </button>
                          ))}
                          <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPendingPages}
                            className={`px-3 py-1 rounded-lg transition-all duration-300 hover:scale-105 ${
                              currentPage === totalPendingPages
                                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                : "bg-[#005524] hover:bg-[#004015] text-white"
                            }`}
                          >
                            Next
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  {/* Safe History */}
                  {userSafeAlerts.length > 0 ? (
                    <div>
                      <h3 className="text-lg font-bold text-green-600 mb-4">Safe History</h3>
                      {currentSafeAlerts.map((alert) => {
                        // Find related crisis
                        const relatedCrisis = pendingCrisisAlerts.find(c => c.id === alert.related_crisis_id) || crisisAlert || { type: 'General', reporter: 'System' };
                        return (
                          <div
                            key={alert.id}
                            className="bg-green-50 rounded-2xl p-3 sm:p-4 mb-2 sm:mb-4 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 border border-green-200 hover:border-[#005524]/20"
                          >
                            <div className="flex items-center space-x-4">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center text-white">
                                <FaCheck />
                              </div>
                              <div className="flex-1">
                                <p className="text-gray-900 font-bold text-green-500">
                                  You marked yourself safe
                                </p>
                                <p className="text-sm text-gray-600">
                                  Incident: {relatedCrisis.type}
                                </p>
                                <p className="text-sm text-gray-600">
                                  Reported by: {relatedCrisis.reporter} at {new Date(alert.created_at).toLocaleString()}
                                </p>
                                <p className="text-sm text-gray-600">
                                  Location: Lat: {alert.location.lat}, Lng: {alert.location.lng}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {totalSafePages > 1 && (
                        <div className="flex justify-center items-center space-x-2 mt-4">
                          <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className={`px-3 py-1 rounded-lg transition-all duration-300 hover:scale-105 ${
                              currentPage === 1
                                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                : "bg-[#005524] hover:bg-[#004015] text-white"
                            }`}
                          >
                            Previous
                          </button>
                          {[...Array(totalSafePages)].map((_, index) => (
                            <button
                              key={index + 1}
                              onClick={() => handlePageChange(index + 1)}
                              className={`px-3 py-1 rounded-lg transition-all duration-300 hover:scale-105 ${
                                currentPage === index + 1
                                  ? "bg-[#005524] text-white"
                                  : "bg-gray-200 text-gray-900 hover:bg-gray-300"
                              }`}
                            >
                              {index + 1}
                            </button>
                          ))}
                          <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalSafePages}
                            className={`px-3 py-1 rounded-lg transition-all duration-300 hover:scale-105 ${
                              currentPage === totalSafePages
                                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                : "bg-[#005524] hover:bg-[#004015] text-white"
                            }`}
                          >
                            Next
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-600">No safe alerts found.</p>
                  )}
                </div>
              )}
            </div>
          )}
          {activeTab === "message" && (
            <div className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-6 shadow-xl transition-all duration-300 hover:shadow-2xl hover:border-[#005524]/20">
              {showChatList ? (
                <>
                  <h2 className="text-xl sm:text-2xl font-bold text-[#005524] mb-4 sm:mb-6">
                    Messages
                  </h2>
                  {connections.length > 0 ? (
                    connections.map((connection) => (
                      <div
                        key={connection.id}
                        className="flex items-center justify-between space-x-4 mb-2 cursor-pointer hover:bg-gray-50 p-2 rounded-2xl hover:scale-105 transition-all duration-300"
                        onClick={() => handleSelectConnection(connection)}
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#005524] to-[#f69f00] flex items-center justify-center text-white">
                            {connection.avatar ? (
                              <img
                                src={connection.avatar}
                                className="w-full h-full rounded-full"
                                alt={connection.name}
                              />
                            ) : (
                              <span>👤</span>
                            )}
                          </div>
                          <span className="text-gray-900 font-bold">{connection.name}</span>
                        </div>
                        <span
                          className={`h-3 w-3 rounded-full ${
                            connection.is_online ? "bg-green-500" : "bg-gray-400"
                          }`}
                        ></span>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-600">No connections to message.</p>
                  )}
                </>
              ) : (
                <div>
                  <div className="flex items-center mb-4 sm:mb-6">
                    <button
                      onClick={() => setShowChatList(true)}
                      className="text-[#005524] hover:text-[#004015] mr-4 hover:scale-105 transition-all duration-300"
                    >
                      <FaArrowLeft size={20} />
                    </button>
                    <h2 className="text-xl sm:text-2xl font-bold text-[#005524]">
                      Chat with {currentChatRecipient}
                    </h2>
                  </div>
                  <div
                    className="h-96 overflow-y-auto mb-4 sm:mb-6 p-4 bg-gray-50 rounded-2xl"
                    ref={chatContainerRef}
                  >
                    {getMessagesForRecipient(selectedConnection?.connected_user_id || "").map(
                      (msg) => (
                        <div
                          key={msg.id}
                          className={`mb-4 flex ${
                            msg.sender_id === userProfile?.id ? "justify-end" : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-xs sm:max-w-md p-3 rounded-2xl ${
                              msg.sender_id === userProfile?.id
                                ? "bg-[#005524] text-white"
                                : "bg-gray-200 text-gray-900"
                            }`}
                          >
                            <p className="text-sm">{msg.content}</p>
                            <p className="text-xs opacity-70">
                              {new Date(msg.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 bg-gray-100 rounded-2xl px-4 py-2 text-sm border border-gray-100 focus:ring-[#005524] focus:border-[#005524] transition-all duration-300"
                    />
                    <button
                      onClick={handleSendMessage}
                      className="bg-[#005524] hover:bg-[#004015] text-white px-4 py-2 rounded-lg hover:scale-105 transition-all duration-300"
                    >
                      <FaPaperPlane />
                    </button>
                  </div>
                  {messageSent && (
                    <p className="text-green-500 text-sm mt-2">Message sent!</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="w-full lg:w-1/4 p-4 sm:p-6">
          <div className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-6 shadow-xl transition-all duration-300 hover:shadow-2xl hover:border-[#005524]/20">
            <h2 className="text-xl sm:text-2xl font-bold text-[#005524] mb-4 sm:mb-6">
              Crisis Alerts
            </h2>
            {isLoading ? (
              <p className="text-gray-600">Loading crisis alerts...</p>
            ) : crisisAlerts.length > 0 ? (
              <>
                {crisisAlerts.slice((currentPage - 1) * alertsPerPage, currentPage * alertsPerPage).map((alert) => (
                  <div
                    key={alert.id}
                    className="bg-white rounded-2xl p-3 sm:p-4 mb-2 sm:mb-4 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 border border-gray-100 hover:border-[#005524]/20 cursor-pointer"
                    onClick={() => {
                      setSelectedCrisisAlert(alert);
                      setShowCrisisModal(true);
                    }}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center text-white">
                        <FaCheck />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-green-500">
                          {alert.reporter} Marked Safe
                        </p>
                        <p className="text-sm text-gray-600">
                          Incident: {alert.related_crisis_id ? `Crisis #${alert.related_crisis_id}` : 'General Safety'}
                        </p>
                        <p className="text-sm text-gray-600">
                          Location: Lat: {alert.location.lat}, Lng: {alert.location.lng}
                        </p>
                        <p className="text-sm text-gray-600">
                          {new Date(alert.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {Math.ceil(crisisAlerts.length / alertsPerPage) > 1 && (
                  <div className="flex justify-center items-center space-x-2 mt-4">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`px-3 py-1 rounded-lg transition-all duration-300 hover:scale-105 ${
                        currentPage === 1
                          ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                          : "bg-[#005524] hover:bg-[#004015] text-white"
                      }`}
                    >
                      Previous
                    </button>
                    {[...Array(Math.ceil(crisisAlerts.length / alertsPerPage))].map((_, index) => (
                      <button
                        key={index + 1}
                        onClick={() => handlePageChange(index + 1)}
                        className={`px-3 py-1 rounded-lg transition-all duration-300 hover:scale-105 ${
                          currentPage === index + 1
                            ? "bg-[#005524] text-white"
                            : "bg-gray-200 text-gray-900 hover:bg-gray-300"
                        }`}
                      >
                        {index + 1}
                      </button>
                    ))}
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === Math.ceil(crisisAlerts.length / alertsPerPage)}
                      className={`px-3 py-1 rounded-lg transition-all duration-300 hover:scale-105 ${
                        currentPage === Math.ceil(crisisAlerts.length / alertsPerPage)
                          ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                          : "bg-[#005524] hover:bg-[#004015] text-white"
                      }`}
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            ) : (
              <p className="text-gray-600">No safe alerts from connections found.</p>
            )}
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-6 mt-4 sm:mt-6 shadow-xl transition-all duration-300 hover:shadow-2xl hover:border-[#005524]/20">
            <h2 className="text-xl sm:text-2xl font-bold text-[#005524] mb-4 sm:mb-6">
              Safety Tips
            </h2>
            {isLoading ? (
              <p className="text-gray-600">Loading safety tips...</p>
            ) : safetyTips.length > 0 ? (
              safetyTips.map((tip) => (
                <div
                  key={tip.id}
                  className="bg-white rounded-2xl p-3 sm:p-4 mb-2 sm:mb-4 cursor-pointer hover:bg-gray-50 hover:scale-105 transition-all duration-300 border border-gray-100 hover:border-[#005524]/20"
                  onClick={() => {
                    setSelectedSafetyTip(tip);
                    setShowSafetyTipModal(true);
                  }}
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#005524] to-[#f69f00] flex items-center justify-center text-white">
                      {iconMap[tip.icon] ? (
                        React.createElement(iconMap[tip.icon])
                      ) : (
                        <FaInfoCircle />
                      )}
                    </div>
                    <p className="text-gray-900 font-bold">{tip.name}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-600">No safety tips available.</p>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showCrisisModal && selectedCrisisAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl p-6 sm:p-8 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg sm:text-xl font-bold text-[#005524]">
                Crisis Details
              </h3>
              <button
                onClick={() => setShowCrisisModal(false)}
                className="text-gray-600 hover:text-[#005524] transition-colors duration-200"
              >
                <FaTimes size={20} />
              </button>
            </div>
            <div className="space-y-2">
              <p className="text-gray-900 font-bold">
                Reporter: {selectedCrisisAlert.reporter}
              </p>
              <p className="text-sm text-gray-600">
                Type: {selectedCrisisAlert.type}
              </p>
              <p className="text-sm text-gray-600">
                Location: Lat: {selectedCrisisAlert.location.lat}, Lng: {selectedCrisisAlert.location.lng}
              </p>
              <p className="text-sm text-gray-600">
                Time: {new Date(selectedCrisisAlert.created_at).toLocaleString()}
              </p>
              <div className="mt-4">
                <p className="text-sm font-bold text-[#005524]">
                  Who has already marked safe:
                </p>
                {selectedCrisisAlert.marked_safe_users && selectedCrisisAlert.marked_safe_users.length > 0 ? (
                  <ul className="mt-2 space-y-1">
                    {selectedCrisisAlert.marked_safe_users.map((user) => (
                      <li key={user.user_id} className="text-sm text-gray-600">
                        - {user.name} ✅
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-600">
                    No connections have marked safe yet.
                  </p>
                )}
              </div>
            </div>
            <div className="flex space-x-2 mt-6">
              {!selectedCrisisAlert.responded_safe && (
                <button
                  onClick={() => handleMarkSafe(selectedCrisisAlert.id)}
                  className="flex-1 bg-[#005524] hover:bg-[#004015] text-white px-4 py-2 rounded-lg hover:scale-105 transition-all duration-300"
                >
                  <FaCheck className="inline mr-2" /> Mark Safe
                </button>
              )}
              {selectedCrisisAlert.responded_safe && (
                <p className="flex-1 text-center text-green-600 font-bold py-2">You are safe ✅</p>
              )}
              <button
                onClick={() => setShowCrisisModal(false)}
                className="flex-1 bg-[#be4c1d] hover:bg-[#a33d16] text-white px-4 py-2 rounded-lg hover:scale-105 transition-all duration-300"
              >
                <FaTimes className="inline mr-2" /> Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showConnectionOptions && selectedConnection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl p-6 sm:p-8 w-full max-w-md shadow-xl">
            <h3 className="text-lg sm:text-xl font-bold text-[#005524] mb-4">
              Connection Options
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => handleConnectionAction("message", selectedConnection)}
                className="w-full bg-[#005524] hover:bg-[#004015] text-white px-4 py-2 rounded-lg hover:scale-105 transition-all duration-300"
              >
                <FaEnvelope className="inline mr-2" /> Message
              </button>
              <button
                onClick={() => handleConnectionAction("profile", selectedConnection)}
                className="w-full bg-[#005524] hover:bg-[#004015] text-white px-4 py-2 rounded-lg hover:scale-105 transition-all duration-300"
              >
                <FaUser className="inline mr-2" /> View Profile
              </button>
              <button
                onClick={() => setShowConnectionOptions(false)}
                className="w-full bg-[#be4c1d] hover:bg-[#a33d16] text-white px-4 py-2 rounded-lg hover:scale-105 transition-all duration-300"
              >
                <FaTimes className="inline mr-2" /> Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showProfile && selectedSearchProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl p-6 sm:p-8 w-full max-w-md shadow-xl">
            <h3 className="text-lg sm:text-xl font-bold text-[#005524] mb-4">
              User Profile
            </h3>
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[#005524] to-[#f69f00] flex items-center justify-center text-white">
                {selectedSearchProfile.avatar ? (
                  <img
                    src={selectedSearchProfile.avatar}
                    className="w-full h-full rounded-full"
                    alt={selectedSearchProfile.name}
                  />
                ) : (
                  <span>👤</span>
                )}
              </div>
              <div>
                <p className="text-gray-900 font-bold">{selectedSearchProfile.name}</p>
                <p className="text-sm text-gray-600">{selectedSearchProfile.email}</p>
              </div>
            </div>
            {selectedSearchProfile.id !== userProfile?.id && (
              <button
                onClick={() => handleSendConnectionRequest(selectedSearchProfile.id)}
                className="w-full bg-[#005524] hover:bg-[#004015] text-white px-4 py-2 rounded-lg hover:scale-105 transition-all duration-300"
                disabled={isConnected(selectedSearchProfile.id)}
              >
                <FaUserPlus className="inline mr-2" />
                {isConnected(selectedSearchProfile.id)
                  ? "Connected"
                  : "Send Connection Request"}
              </button>
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
                className="w-full bg-[#005524] hover:bg-[#004015] text-white px-4 py-2 rounded-lg hover:scale-105 transition-all duration-300"
              >
                <FaEdit className="inline mr-2" /> Edit Profile
              </button>
            )}
            <button
              onClick={() => setShowProfile(false)}
              className="w-full bg-[#be4c1d] hover:bg-[#a33d16] text-white px-4 py-2 rounded-lg mt-2 hover:scale-105 transition-all duration-300"
            >
              <FaTimes className="inline mr-2" /> Close
            </button>
          </div>
        </div>
      )}

      {showEditProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl p-6 sm:p-8 w-full max-w-md shadow-xl">
            <h3 className="text-lg sm:text-xl font-bold text-[#005524] mb-4">
              Edit Profile
            </h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Name"
                value={editProfileData.name || ""}
                onChange={(e) =>
                  setEditProfileData({ ...editProfileData, name: e.target.value })
                }
                className="w-full bg-gray-100 rounded-2xl px-4 py-2 text-sm border border-gray-100 focus:ring-[#005524] focus:border-[#005524] transition-all duration-300"
              />
              <input
                type="text"
                placeholder="Avatar URL"
                value={editProfileData.avatar || ""}
                onChange={(e) =>
                  setEditProfileData({ ...editProfileData, avatar: e.target.value })
                }
                className="w-full bg-gray-100 rounded-2xl px-4 py-2 text-sm border border-gray-100 focus:ring-[#005524] focus:border-[#005524] transition-all duration-300"
              />
              <button
                onClick={handleEditProfile}
                className="w-full bg-[#005524] hover:bg-[#004015] text-white px-4 py-2 rounded-lg hover:scale-105 transition-all duration-300"
              >
                Save Changes
              </button>
              <button
                onClick={() => setShowEditProfile(false)}
                className="w-full bg-[#be4c1d] hover:bg-[#a33d16] text-white px-4 py-2 rounded-lg hover:scale-105 transition-all duration-300"
              >
                <FaTimes className="inline mr-2" /> Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl p-6 sm:p-8 w-full max-w-md shadow-xl">
            <h3 className="text-lg sm:text-xl font-bold text-[#005524] mb-4">
              Settings
            </h3>
            <div className="space-y-4">
              <p className="text-gray-600">Settings options coming soon!</p>
              <button
                onClick={() => setShowSettings(false)}
                className="w-full bg-[#be4c1d] hover:bg-[#a33d16] text-white px-4 py-2 rounded-lg hover:scale-105 transition-all duration-300"
              >
                <FaTimes className="inline mr-2" /> Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl p-6 sm:p-8 w-full max-w-md shadow-xl">
            <h3 className="text-lg sm:text-xl font-bold text-[#005524] mb-4">
              Confirm Logout
            </h3>
            <p className="text-gray-600 mb-4">Are you sure you want to log out?</p>
            <div className="flex space-x-2">
              <button
                onClick={handleLogout}
                className="flex-1 bg-[#be4c1d] hover:bg-[#a33d16] text-white px-4 py-2 rounded-lg hover:scale-105 transition-all duration-300"
              >
                <FaSignOutAlt className="inline mr-2" /> Logout
              </button>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 px-4 py-2 rounded-lg hover:scale-105 transition-all duration-300"
              >
                <FaTimes className="inline mr-2" /> Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showLocationView && selectedEmergency && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl p-6 sm:p-8 w-full max-w-md shadow-xl">
            <h3 className="text-lg sm:text-xl font-bold text-[#005524] mb-4">
              Emergency Location
            </h3>
            <img
              src={mapImage}
              className="w-full h-48 rounded-lg mb-4"
              alt="Map"
            />
            <p className="text-gray-900 font-bold">{selectedEmergency.emergency_type}</p>
            <p className="text-sm text-gray-600">
              Reported by {selectedEmergency.name} at Lat: {selectedLocation?.lat}, Lng:{" "}
              {selectedLocation?.lng}
            </p>
            <button
              onClick={() => setShowLocationView(false)}
              className="w-full bg-[#be4c1d] hover:bg-[#a33d16] text-white px-4 py-2 rounded-lg mt-4 hover:scale-105 transition-all duration-300"
            >
              <FaTimes className="inline mr-2" /> Close
            </button>
          </div>
        </div>
      )}

      {showCallConfirm && selectedEmergencyForAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl p-6 sm:p-8 w-full max-w-md shadow-xl">
            <h3 className="text-lg sm:text-xl font-bold text-[#005524] mb-4">
              Confirm Call
            </h3>
            <p className="text-gray-600 mb-4">
              Call emergency services for {selectedEmergencyForAction.emergency_type} reported by{" "}
              {selectedEmergencyForAction.name}?
            </p>
            <div className="flex space-x-2">
              <button
                onClick={initiateCall}
                className="flex-1 bg-[#005524] hover:bg-[#004015] text-white px-4 py-2 rounded-lg hover:scale-105 transition-all duration-300"
              >
                <FaPhoneAlt className="inline mr-2" /> Call
              </button>
              <button
                onClick={() => setShowCallConfirm(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 px-4 py-2 rounded-lg hover:scale-105 transition-all duration-300"
              >
                <FaTimes className="inline mr-2" /> Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showReportConfirm && selectedEmergencyForAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl p-6 sm:p-8 w-full max-w-md shadow-xl">
            <h3 className="text-lg sm:text-xl font-bold text-[#005524] mb-4">
              Confirm Report
            </h3>
            <p className="text-gray-600 mb-4">
              Report {selectedEmergencyForAction.emergency_type} by{" "}
              {selectedEmergencyForAction.name}?
            </p>
            <div className="flex space-x-2">
              <button
                onClick={submitReport}
                className="flex-1 bg-[#be4c1d] hover:bg-[#a33d16] text-white px-4 py-2 rounded-lg hover:scale-105 transition-all duration-300"
              >
                <FaExclamationTriangle className="inline mr-2" /> Report
              </button>
              <button
                onClick={() => setShowReportConfirm(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 px-4 py-2 rounded-lg hover:scale-105 transition-all duration-300"
              >
                <FaTimes className="inline mr-2" /> Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showAlertConfirm && selectedAlertType && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl p-6 sm:p-8 w-full max-w-md shadow-xl">
            <h3 className="text-lg sm:text-xl font-bold text-[#005524] mb-4">
              Alert Sent
            </h3>
            <p className="text-gray-600 mb-4">
              Your {selectedAlertType} alert has been sent to your connections.
            </p>
            <button
              onClick={() => setShowAlertConfirm(false)}
              className="w-full bg-[#005524] hover:bg-[#004015] text-white px-4 py-2 rounded-lg hover:scale-105 transition-all duration-300"
            >
              <FaCheck className="inline mr-2" /> OK
            </button>
          </div>
        </div>
      )}

      {showSafetyTipModal && selectedSafetyTip && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl p-6 sm:p-8 w-full max-w-md shadow-xl">
            <h3 className="text-lg sm:text-xl font-bold text-[#005524] mb-4">
              {selectedSafetyTip.name}
            </h3>
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#005524] to-[#f69f00] flex items-center justify-center text-white">
                {iconMap[selectedSafetyTip.icon] ? (
                  React.createElement(iconMap[selectedSafetyTip.icon])
                ) : (
                  <FaInfoCircle />
                )}
              </div>
              <p className="text-gray-600">{selectedSafetyTip.content}</p>
            </div>
            <button
              onClick={() => setShowSafetyTipModal(false)}
              className="w-full bg-[#be4c1d] hover:bg-[#a33d16] text-white px-4 py-2 rounded-lg hover:scale-105 transition-all duration-300"
            >
              <FaTimes className="inline mr-2" /> Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;