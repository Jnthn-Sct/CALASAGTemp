import React, { useState, useEffect, useRef } from "react";
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
} from "react-icons/fa";
import logoImage from "../Images/no-bg-logo.png";
import mapImage from "../Images/ph-map.png";
import { supabase } from "../../db";

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
}

interface ConnectionRequest {
  id: number;
  sender_id: string;
  receiver_id: string;
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
  content: string;
  is_read: boolean;
  created_at: string;
}

interface Message {
  id: number;
  sender_id: string;
  receiver_id: string;
  content: string;
  timestamp: string;
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
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showLocationView, setShowLocationView] = useState<boolean>(false);
  const [showConnectionOptions, setShowConnectionOptions] =
    useState<boolean>(false);
  const [selectedConnection, setSelectedConnection] =
    useState<Connection | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null
  );
  const [selectedEmergency, setSelectedEmergency] = useState<Emergency | null>(
    null
  );
  const [showCallConfirm, setShowCallConfirm] = useState<boolean>(false);
  const [showReportConfirm, setShowReportConfirm] = useState<boolean>(false);
  const [showAlertConfirm, setShowAlertConfirm] = useState<boolean>(false);
  const [selectedAlertType, setSelectedAlertType] = useState<string | null>(
    null
  );
  const [selectedEmergencyForAction, setSelectedEmergencyForAction] =
    useState<Emergency | null>(null);
  const [isSafe, setIsSafe] = useState<boolean>(false);
  const [crisisAlert, setCrisisAlert] = useState<CrisisAlert | null>(null);
  const [crisisAlerts, setCrisisAlerts] = useState<CrisisAlert[]>([]);
  const [userSafeAlerts, setUserSafeAlerts] = useState<CrisisAlert[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentChatRecipient, setCurrentChatRecipient] = useState<string>("");
  const [showChatList, setShowChatList] = useState<boolean>(true);
  const [messageText, setMessageText] = useState("");
  const [messageSent, setMessageSent] = useState(false);
  const [showSafetyTipModal, setShowSafetyTipModal] = useState<boolean>(false);
  const [selectedSafetyTip, setSelectedSafetyTip] = useState<SafetyTip | null>(
    null
  );
  const [emergencies, setEmergencies] = useState<Emergency[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [connectionRequests, setConnectionRequests] = useState<
    ConnectionRequest[]
  >([]);
  const [safetyTips, setSafetyTips] = useState<SafetyTip[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [deviceStatus, setDeviceStatus] = useState<"Active" | "Inactive">(
    "Active"
  );
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<Location>({
    lat: 14.5995,
    lng: 120.9842,
  });
  const [emergencyFilter, setEmergencyFilter] = useState<"nearby" | "all">(
    "nearby"
  );
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSearchResults, setShowSearchResults] = useState<boolean>(false);
  const [selectedSearchProfile, setSelectedSearchProfile] =
    useState<SearchResult | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const iconMap: { [key: string]: React.ElementType } = {
    FaAmbulance,
    FaInfoCircle,
    FaFire,
    FaCarCrash,
    FaShieldAlt,
  };

  const randomLocation = (
    centerLat: number,
    centerLng: number,
    radiusKm: number
  ): Location => {
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
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
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
      setSearchResults(data || []);
      setShowSearchResults(true);
    } catch (error: any) {
      console.error("Error searching users:", error);
      setError(`Failed to search users: ${error.message}`);
    }
  };

  const handleSendConnectionRequest = async (receiverId: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user");

      const { data: existingRequest } = await supabase
        .from("connection_requests")
        .select("*")
        .eq("sender_id", user.id)
        .eq("receiver_id", receiverId)
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
        .or(`user1_id.eq.${receiverId},user2_id.eq.${receiverId}`)
        .single();

      if (existingConnection) {
        setError("You are already connected with this user.");
        return;
      }

      const newRequest = {
        sender_id: user.id,
        receiver_id: receiverId,
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

      const { error: notificationError } = await supabase
        .from("notifications")
        .insert({
          user_id: receiverId,
          type: "connection_request",
          content: `${
            senderData?.name || "User"
          } sent you a connection request.`,
          is_read: false,
          created_at: new Date().toISOString(),
        });
      if (notificationError)
        throw new Error(`Notification error: ${notificationError.message}`);

      setError(null);
      setShowProfile(false);
      setShowSearchResults(false);
      setSearchQuery("");
      alert("Connection request sent successfully!");
    } catch (error: any) {
      console.error("Error sending connection request:", error);
      setError(`Failed to send connection request: ${error.message}`);
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
        .eq("receiver_id", user.id);
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
          .select("sender_id")
          .eq("id", requestId)
          .single();
        if (requestData) {
          const { data: senderData } = await supabase
            .from("users")
            .select("name, avatar")
            .eq("user_id", requestData.sender_id)
            .single();
          setNotifications((prev) => [
            {
              id: Date.now(),
              user_id: user.id,
              type: "connection_accepted",
              content: `You are now connected with ${
                senderData?.name || "User"
              }.`,
              is_read: false,
              created_at: new Date().toISOString(),
            },
            ...prev,
          ]);
        }
      }
    } catch (error: any) {
      console.error(`Error ${action} connection request:`, error);
      setError(`Failed to ${action} connection request: ${error.message}`);
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          console.error("No user found, redirecting to login");
          navigate("/login");
          return;
        }

        // Fetch user profile
        const { data: profileData, error: profileError } = await supabase
          .from("users")
          .select("user_id, name, email, role, avatar")
          .eq("user_id", user.id)
          .single();
        if (profileError)
          throw new Error(`Profile fetch error: ${profileError.message}`);
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

        // Fetch connections
        const { data: connectionsData, error: connectionsError } =
          await supabase
            .from("connections")
            .select("id, user1_id, user2_id")
            .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);
        if (connectionsError)
          throw new Error(
            `Connections fetch error: ${connectionsError.message}`
          );

        // Fetch user data for connected users
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
            console.error(`Error fetching user ${connectedUserId}:`, userError);
            continue; // Skip if user data can't be fetched
          }
          formattedConnections.push({
            id: conn.id,
            name: connectedUser?.name || "Unknown User",
            avatar: connectedUser?.avatar || null,
            connected_user_id: connectedUserId,
          });
        }
        setConnections(formattedConnections);

        // Fetch connection requests
        const { data: requestsData, error: requestsError } = await supabase
          .from("connection_requests")
          .select(
            `
            id,
            sender_id,
            receiver_id,
            status,
            created_at,
            users!connection_requests_sender_id_fkey (name, avatar)
          `
          )
          .eq("receiver_id", user.id)
          .eq("status", "pending");
        if (requestsError)
          throw new Error(
            `Connection requests fetch error: ${requestsError.message}`
          );

        const formattedRequests: ConnectionRequest[] =
          requestsData?.map((req: any) => ({
            id: req.id,
            sender_id: req.sender_id,
            receiver_id: req.receiver_id,
            status: req.status,
            created_at: req.created_at,
            sender_name: req.users?.name || "Unknown User",
            sender_avatar: req.users?.avatar || null,
          })) || [];
        setConnectionRequests(formattedRequests);

        // Fetch emergencies
        const { data: emergenciesData, error: emergenciesError } =
          await supabase
            .from("emergencies")
            .select("*")
            .order("created_at", { ascending: false });
        if (emergenciesError)
          throw new Error(
            `Emergencies fetch error: ${emergenciesError.message}`
          );
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

        // Fetch safety tips
        const { data: tipsData, error: tipsError } = await supabase
          .from("safety_tips")
          .select("*");
        if (tipsError)
          throw new Error(`Safety tips fetch error: ${tipsError.message}`);
        setSafetyTips(tipsData || []);

        // Fetch notifications
        const { data: notificationsData, error: notificationsError } =
          await supabase
            .from("notifications")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });
        if (notificationsError)
          throw new Error(
            `Notifications fetch error: ${notificationsError.message}`
          );
        setNotifications(notificationsData || []);

        // Fetch messages
        const { data: messagesData, error: messagesError } = await supabase
          .from("messages")
          .select("*")
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);
        if (messagesError)
          throw new Error(`Messages fetch error: ${messagesError.message}`);
        setMessages(messagesData || []);

        // Fetch crisis alerts
        const { data: alertsData, error: alertsError } = await supabase
          .from("crisis_alerts")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1);
        if (alertsError)
          throw new Error(`Crisis alerts fetch error: ${alertsError.message}`);
        setCrisisAlert(alertsData[0] || null);
        setIsSafe(alertsData[0]?.type === "Safe");

        // Fetch all crisis alerts
        const { data: crisisAlertsData, error: crisisAlertsError } =
          await supabase
            .from("crisis_alerts")
            .select("*")
            .neq("user_id", user.id);
        if (crisisAlertsError)
          throw new Error(
            `Crisis alerts fetch error: ${crisisAlertsError.message}`
          );
        setCrisisAlerts(crisisAlertsData || []);

        // Fetch user safe alerts
        const { data: userSafeAlertsData, error: userSafeAlertsError } =
          await supabase
            .from("crisis_alerts")
            .select("*")
            .eq("user_id", user.id)
            .eq("type", "Safe")
            .order("created_at", { ascending: false });
        if (userSafeAlertsError)
          throw new Error(
            `User safe alerts fetch error: ${userSafeAlertsError.message}`
          );
        setUserSafeAlerts(userSafeAlertsData || []);

        // Set up subscriptions
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
              console.log("New notification:", payload.new);
              setNotifications((prev) => {
                if (prev.some((n) => n.id === payload.new.id)) return prev;
                return [payload.new as Notification, ...prev].slice(0, 50);
              });
            }
          )
          .subscribe();

        const connectionRequestSubscription = supabase
          .channel("connection_requests")
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "connection_requests",
              filter: `receiver_id=eq.${user.id}`,
            },
            async (payload) => {
              console.log("New connection request:", payload.new);
              const newRequest = payload.new as any;
              const { data: senderData } = await supabase
                .from("users")
                .select("name, avatar")
                .eq("user_id", newRequest.sender_id)
                .single();
              setConnectionRequests((prev) => [
                {
                  id: newRequest.id,
                  sender_id: newRequest.sender_id,
                  receiver_id: newRequest.receiver_id,
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
                  user_id: newRequest.receiver_id,
                  type: "connection_request",
                  content: `${
                    senderData?.name || "User"
                  } sent you a connection request.`,
                  is_read: false,
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
              filter: `receiver_id=eq.${user.id}`,
            },
            (payload) => {
              console.log("Connection request updated:", payload.new);
              setConnectionRequests((prev) =>
                prev.map((req) =>
                  req.id === payload.new.id
                    ? { ...req, status: payload.new.status }
                    : req
                )
              );
            }
          )
          .subscribe();

        const connectionSubscription = supabase
          .channel("connections")
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "connections",
              filter: `user1_id=eq.${user.id},user2_id=eq.${user.id}`,
            },
            async (payload) => {
              console.log("New connection:", payload.new);
              const newConn = payload.new as any;
              const isUser1 = newConn.user1_id === user.id;
              const connectedUserId = isUser1
                ? newConn.user2_id
                : newConn.user1_id;
              const { data: connectedUserData } = await supabase
                .from("users")
                .select("name, avatar")
                .eq("user_id", connectedUserId)
                .single();
              setConnections((prev) => [
                {
                  id: newConn.id,
                  name: connectedUserData?.name || "User",
                  avatar: connectedUserData?.avatar || null,
                  connected_user_id: connectedUserId,
                },
                ...prev,
              ]);
            }
          )
          .subscribe();

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
              console.log("New message:", payload.new);
              const newMessage = payload.new as Message;
              setMessages((prev) => [...prev, newMessage]);
              const { data: senderData, error: senderError } = await supabase
                .from("users")
                .select("name")
                .eq("user_id", newMessage.sender_id)
                .single();
              if (senderError) {
                console.error("Error fetching sender name:", senderError);
                return;
              }
              const { error: notificationError } = await supabase
                .from("notifications")
                .insert({
                  user_id: user.id,
                  type: "message",
                  content: `New message from ${
                    senderData.name
                  }: ${newMessage.content.substring(0, 50)}...`,
                  is_read: false,
                  created_at: new Date().toISOString(),
                });
              if (notificationError) {
                console.error(
                  "Error inserting message notification:",
                  notificationError
                );
              }
            }
          )
          .subscribe();

        const crisisSubscription = supabase
          .channel("crisis_alerts")
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "crisis_alerts",
              filter: `user_id=neq.${user.id}`,
            },
            async (payload) => {
              const newAlert = payload.new as CrisisAlert;
              console.log(`Crisis alert ${newAlert.id} received`);
              if (payload.eventType === "INSERT") {
                setCrisisAlerts((prev) => [newAlert, ...prev]);
                if (newAlert.type !== "Safe") {
                  const { error: notificationError } = await supabase
                    .from("notifications")
                    .insert({
                      user_id: user.id,
                      type: "crisis_alert",
                      content: `${newAlert.reporter} reported a ${newAlert.type} crisis!`,
                      is_read: false,
                      created_at: new Date().toISOString(),
                    });
                  if (notificationError) {
                    console.error(
                      "Error inserting crisis notification:",
                      notificationError
                    );
                  }
                }
              } else if (
                payload.eventType === "UPDATE" &&
                newAlert.type === "Safe" &&
                newAlert.related_crisis_id
              ) {
                setCrisisAlerts((prev) =>
                  prev.map((crisis) =>
                    crisis.id === newAlert.related_crisis_id
                      ? { ...crisis, responded_safe: true }
                      : crisis
                  )
                );
              }
            }
          )
          .subscribe();

        const userSafeSubscription = supabase
          .channel("user_safe_alerts")
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "crisis_alerts",
              filter: `user_id=eq.${user.id},type=eq.Safe`,
            },
            (payload) => {
              const newAlert = payload.new as CrisisAlert;
              console.log(`User safe alert ${newAlert.id} received`);
              setUserSafeAlerts((prev) => [newAlert, ...prev]);
            }
          )
          .subscribe();

        const emergencySubscription = supabase
          .channel("emergencies")
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "emergencies",
            },
            async (payload) => {
              console.log("New emergency received:", payload.new);
              const newEmergency = payload.new as Emergency;
              const distance =
                Math.sqrt(
                  Math.pow(newEmergency.location.lat - userLocation.lat, 2) +
                    Math.pow(newEmergency.location.lng - userLocation.lng, 2)
                ) * 111;
              if (
                emergencyFilter === "all" ||
                (emergencyFilter === "nearby" && distance <= 5)
              ) {
                setEmergencies((prev) => [newEmergency, ...prev]);
                if (newEmergency.user_id !== user.id) {
                  const { error: notificationError } = await supabase
                    .from("notifications")
                    .insert({
                      user_id: user.id,
                      type: "emergency",
                      content: `${newEmergency.name} reported a ${newEmergency.emergency_type} emergency!`,
                      is_read: false,
                      created_at: new Date().toISOString(),
                    });
                  if (notificationError) {
                    console.error(
                      "Error inserting emergency notification:",
                      notificationError
                    );
                  }
                }
              }
            }
          )
          .subscribe();

        return () => {
          supabase.removeChannel(notificationSubscription);
          supabase.removeChannel(connectionRequestSubscription);
          supabase.removeChannel(connectionSubscription);
          supabase.removeChannel(messageSubscription);
          supabase.removeChannel(crisisSubscription);
          supabase.removeChannel(userSafeSubscription);
          supabase.removeChannel(emergencySubscription);
        };
      } catch (err: any) {
        console.error("Error fetching data:", err);
        setError(`Failed to load dashboard data: ${err.message}`);
        navigate("/login");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [navigate, userLocation, emergencyFilter]);

  const refreshFeed = async () => {
    setIsLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

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

      const { error: alertError } = await supabase
        .from("crisis_alerts")
        .insert(newAlert);
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
          content: `${activeUser || "User"} triggered a ${type} alert at Lat: ${
            userLocation.lat
          }, Lng: ${userLocation.lng}!`,
          is_read: false,
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

      setCrisisAlert(newAlert);
      setIsSafe(type === "Safe");
      if (type === "Safe") {
        setUserSafeAlerts((prev) => [newAlert, ...prev]);
      }
      setSelectedAlertType(type);
      setShowAlertConfirm(true);
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

      const newAlert = {
        user_id: user.id,
        type: "Safe",
        reporter: activeUser || "User",
        is_self: true,
        created_at: new Date().toISOString(),
        location: userLocation,
        responded_safe: crisisId ? true : false,
        related_crisis_id: crisisId || null,
      };
      const { error } = await supabase.from("crisis_alerts").insert(newAlert);
      if (error) throw new Error(`Mark safe error: ${error.message}`);
      setCrisisAlert(newAlert);
      setIsSafe(true);
      setUserSafeAlerts((prev) => [newAlert, ...prev]);
      setShowAlertConfirm(false);
      if (crisisId) {
        setCrisisAlerts((prev) =>
          prev.map((crisis) =>
            crisis.id === crisisId
              ? { ...crisis, responded_safe: true }
              : crisis
          )
        );
        const allUsers = await fetchAllUsers();
        const notifications = allUsers
          .filter((u) => u.id !== user.id)
          .map((u) => ({
            user_id: u.id,
            type: "safe_alert",
            content: `${
              activeUser || "User"
            } marked themselves as safe for crisis #${crisisId}`,
            is_read: false,
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
      console.error("Error marking safe:", error);
      setError(`Failed to mark as safe: ${error.message}`);
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
    setIsSafe(false);
    setCrisisAlert(null);
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
      await supabase.auth.signOut();
      localStorage.removeItem("supabase.auth.token");
      navigate("/login");
    } catch (error: any) {
      console.error("Error logging out:", error);
      setError(`Failed to log out: ${error.message}`);
    }
  };

  const markNotificationAsRead = async (id: number) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", id);
      if (error) throw new Error(`Notification update error: ${error.message}`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
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
        content: `Reported ${selectedEmergencyForAction.emergency_type} by ${selectedEmergencyForAction.name}`,
        is_read: false,
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

      const newMessage = {
        sender_id: user.id,
        receiver_id: selectedConnection.connected_user_id,
        content: messageText,
        timestamp: new Date().toISOString(),
      };

      const { error } = await supabase.from("messages").insert(newMessage);
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
    setShowConnectionOptions(true);
  };

  const handleConnectionAction = (action: string, connection: Connection) => {
    setShowConnectionOptions(false);
    if (action === "message") {
      setCurrentChatRecipient(connection.name);
      setShowChatList(false);
      setShowMessages(true);
      setActiveTab("message");
    } else if (action === "profile") {
      setShowProfile(true);
      setUserProfile({
        id: connection.connected_user_id,
        name: connection.name,
        email: "N/A",
        role: "N/A",
        avatar: connection.avatar,
      });
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

  return (
    <div className="min-h-screen bg-[#f8eed4] flex flex-col">
      <div className="bg-[#f8eed4] border-b border-gray-300 p-2 flex items-center justify-between shadow-sm">
        <div className="flex items-center">
          <img src={logoImage} className="h-10 w-auto" alt="Logo" />
          <div className="ml-4 relative">
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="bg-white rounded-lg px-3 py-1 w-40 text-sm border border-gray-300"
            />
            <button className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500">
              <FaSearch size={16} />
            </button>
            {showSearchResults && (
              <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                {searchResults.length > 0 ? (
                  searchResults.map((user) => (
                    <div
                      key={user.id}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center space-x-3"
                      onClick={() => {
                        setSelectedSearchProfile(user);
                        setShowProfile(true);
                        setShowSearchResults(false);
                        setSearchQuery("");
                      }}
                    >
                      <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-white">
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
                        <p className="text-gray-800 font-semibold">
                          {user.name}
                        </p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="px-4 py-2 text-gray-500">No users found.</p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-center space-x-8">
          <button
            onClick={() => handleNavigation("home")}
            className={`flex flex-col items-center transition-colors duration-200 ${
              activeTab === "home"
                ? "text-[#005524]"
                : "text-gray-500 hover:text-[#005524]"
            }`}
          >
            <FaHome size={20} />
            <span className="text-xs mt-1">Home</span>
          </button>
          <button
            onClick={() => handleNavigation("message")}
            className={`flex flex-col items-center transition-colors duration-200 ${
              activeTab === "message"
                ? "text-[#005524]"
                : "text-gray-500 hover:text-[#005524]"
            }`}
          >
            <FaEnvelope size={20} />
            <span className="text-xs mt-1">Message</span>
          </button>
          <button
            onClick={() => handleNavigation("report")}
            className={`flex flex-col items-center transition-colors duration-200 ${
              activeTab === "report"
                ? "text-[#005524]"
                : "text-gray-500 hover:text-[#005524]"
            }`}
          >
            <FaExclamationTriangle size={20} />
            <span className="text-xs mt-1">Report</span>
          </button>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative focus:outline-none hover:bg-gray-100 rounded-full p-2 transition-colors duration-200"
            >
              <FaBell size={20} className="text-[#f69f00]" />
              {notifications.filter((n) => !n.is_read).length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full h-4 w-4 flex items-center justify-center text-xs">
                  {notifications.filter((n) => !n.is_read).length}
                </span>
              )}
            </button>
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg py-1 z-50">
                <div className="px-4 py-2 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-700">
                    Notifications
                  </h3>
                  <button
                    onClick={clearAllNotifications}
                    className="text-sm text-red-500 hover:text-red-600"
                  >
                    Clear All
                  </button>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`px-4 py-3 hover:bg-gray-50 cursor-pointer ${
                          !notification.is_read ? "bg-blue-50" : ""
                        }`}
                        onClick={() => markNotificationAsRead(notification.id)}
                      >
                        <p className="text-gray-800 text-sm">
                          {notification.content}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(notification.created_at).toLocaleString()}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="px-4 py-3 text-gray-500">No notifications.</p>
                  )}
                  {connectionRequests.length > 0 && (
                    <div className="border-t border-gray-200 py-2">
                      <h3 className="px-4 py-2 text-lg font-semibold text-gray-700">
                        Connection Requests
                      </h3>
                      {connectionRequests.map((request) => (
                        <div
                          key={request.id}
                          className="px-4 py-3 flex items-center justify-between hover:bg-gray-50"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-white">
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
                            <p className="text-gray-800 text-sm">
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
                              className="bg-green-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-green-600"
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
                              className="bg-red-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-red-600"
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
              className="flex items-center space-x-2 focus:outline-none hover:bg-gray-100 rounded-lg px-2 py-1 transition-colors duration-200"
            >
              <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-white">
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
                <span className="font-medium">
                  {isLoading ? "Loading..." : activeUser || "User"}
                </span>
                <span
                  className={`ml-1 transition-transform duration-200 ${
                    showProfileMenu ? "rotate-180" : ""
                  }`}
                >
                  ▼
                </span>
              </div>
            </button>
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-50">
                <button
                  onClick={() => handleProfileAction("profile")}
                  className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center"
                >
                  <FaUser size={16} className="mr-2" />
                  Profile
                </button>
                <button
                  onClick={() => handleProfileAction("settings")}
                  className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center"
                >
                  <FaCog size={16} className="mr-2" />
                  Settings
                </button>
                <div className="border-t border-gray-200 my-1"></div>
                <button
                  onClick={() => handleProfileAction("logout")}
                  className="w-full px-4 py-2 text-left text-red-600 hover:bg-gray-100 flex items-center"
                >
                  <FaSignOutAlt size={16} className="mr-2" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-1 relative">
        <div className="w-1/4 p-4 flex flex-col space-y-4">
          <div className="bg-[#005524] rounded-lg shadow-md p-4">
            <h2 className="text-xl font-bold text-white mb-4">Welcome</h2>
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-white text-xl">
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
                <span className="text-white text-lg font-medium">
                  {isLoading ? "Loading..." : activeUser || "User"}
                </span>
                {userProfile && (
                  <p className="text-sm text-white/80">
                    Role: {userProfile.role}
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="bg-[#005524] rounded-lg shadow-md p-4">
            <h2 className="text-xl font-bold text-white mb-4">Connections</h2>
            {isLoading ? (
              <p className="text-white/80">Loading connections...</p>
            ) : connections.length > 0 ? (
              connections.map((connection) => (
                <div
                  key={connection.id}
                  className="flex items-center space-x-4 mb-2 cursor-pointer hover:bg-[#004015] p-2 rounded"
                  onClick={() => handleSelectConnection(connection)}
                >
                  <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-white">
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
                  <span className="text-white">{connection.name}</span>
                </div>
              ))
            ) : (
              <p className="text-white/80">No connections found.</p>
            )}
          </div>
        </div>

        <div className="w-2/4 p-4">
          <div className="bg-[#005524] border border-gray-300 rounded-lg p-4 mb-4 flex items-center justify-center">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-white text-xl">
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
                <span className="text-white text-lg font-medium">
                  Welcome, {isLoading ? "Loading..." : activeUser || "User"}!
                </span>
                {userProfile && (
                  <p className="text-sm text-white/80">
                    Role: {userProfile.role}
                  </p>
                )}
              </div>
            </div>
          </div>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}
          {activeTab === "home" && (
            <div className="bg-[#f8eed4] border border-gray-800 rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-[#005524]">
                  Recent Emergencies
                </h2>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setEmergencyFilter("nearby")}
                    className={`px-3 py-1 rounded-lg ${
                      emergencyFilter === "nearby"
                        ? "bg-[#005524] text-white"
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    Nearby (5km)
                  </button>
                  <button
                    onClick={() => setEmergencyFilter("all")}
                    className={`px-3 py-1 rounded-lg ${
                      emergencyFilter === "all"
                        ? "bg-[#005524] text-white"
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={refreshFeed}
                    className="bg-[#f69f00] text-white px-3 py-1 rounded-lg hover:bg-[#d88e00]"
                  >
                    Refresh
                  </button>
                </div>
              </div>
              {isLoading ? (
                <p>Loading emergencies...</p>
              ) : emergencies.length > 0 ? (
                emergencies.map((emergency) => (
                  <div
                    key={emergency.id}
                    className="bg-white rounded-lg p-3 mb-2 shadow-sm"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-white">
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
                        <p className="font-semibold text-gray-800">
                          {emergency.emergency_type}
                        </p>
                        <p className="text-sm text-gray-600">
                          {emergency.message}
                        </p>
                        <p className="text-sm text-gray-500">
                          Reported by {emergency.name} at Lat:{" "}
                          {emergency.location.lat}, Lng:{" "}
                          {emergency.location.lng}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(emergency.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewLocation(emergency)}
                          className="bg-[#005524] text-white px-3 py-1 rounded-lg text-sm hover:bg-[#004015]"
                        >
                          <FaMapMarkerAlt className="inline mr-1" /> View
                        </button>
                        <button
                          onClick={() => handleCallAssistance(emergency)}
                          className="bg-[#f69f00] text-white px-3 py-1 rounded-lg text-sm hover:bg-[#d88e00]"
                        >
                          <FaPhoneAlt className="inline mr-1" /> Call
                        </button>
                        <button
                          onClick={() => handleReport(emergency)}
                          className="bg-red-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-red-600"
                        >
                          <FaExclamationTriangle className="inline mr-1" />{" "}
                          Report
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p>No emergencies found.</p>
              )}
            </div>
          )}
          {activeTab === "report" && (
            <div className="bg-[#f8eed4] border border-gray-800 rounded-lg p-4">
              <h2 className="text-xl font-bold text-[#005524] mb-4">
                SOS Help
              </h2>
              <div className="flex space-x-4 mb-4">
                <button
                  onClick={() => handleEmergencyAlert("Fire")}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
                >
                  <FaFire className="inline mr-2" /> Fire
                </button>
                <button
                  onClick={() => handleEmergencyAlert("Medical")}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                >
                  <FaAmbulance className="inline mr-2" /> Medical
                </button>
                <button
                  onClick={() => handleEmergencyAlert("Crime")}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
                >
                  <FaShieldAlt className="inline mr-2" /> Crime
                </button>
                <button
                  onClick={() => handleEmergencyAlert("Accident")}
                  className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600"
                >
                  <FaCarCrash className="inline mr-2" /> Accident
                </button>
              </div>
              {crisisAlert && (
                <div className="mt-4 p-3 bg-white rounded-lg shadow-sm mb-4">
                  <p className="text-gray-800">
                    Your Active Alert: {crisisAlert.type}
                  </p>
                  <p className="text-sm text-gray-600">
                    Reported at{" "}
                    {new Date(crisisAlert.created_at).toLocaleString()}
                  </p>
                  {!isSafe && (
                    <button
                      onClick={() => handleMarkSafe()}
                      className="mt-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
                    >
                      <FaCheck className="inline mr-2" /> Mark Safe
                    </button>
                  )}
                  <button
                    onClick={resetCrisisAlert}
                    className="mt-2 ml-2 text-sm text-red-500 hover:text-red-600"
                  >
                    Clear Alert
                  </button>
                </div>
              )}
              <h2 className="text-xl font-bold text-[#005524] mb-4">
                Your Safe Alerts
              </h2>
              {isLoading ? (
                <p>Loading your safe alerts...</p>
              ) : userSafeAlerts.length > 0 ? (
                userSafeAlerts.map((crisis) => (
                  <div
                    key={crisis.id}
                    className="bg-white rounded-lg p-3 mb-2 shadow-sm"
                  >
                    <p className="font-semibold text-gray-800">{crisis.type}</p>
                    <p className="text-sm text-gray-600">
                      Reported by {crisis.reporter}
                    </p>
                    <p className="text-sm text-gray-500">
                      At Lat: {crisis.location.lat}, Lng: {crisis.location.lng}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(crisis.created_at).toLocaleString()}
                    </p>
                    {crisis.related_crisis_id && (
                      <p className="text-sm text-gray-500">
                        In response to crisis #{crisis.related_crisis_id}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <p>No safe alerts found.</p>
              )}
            </div>
          )}
        </div>

        <div className="w-1/4 p-4 flex flex-col space-y-4">
          <div className="bg-[#005524] rounded-lg shadow-md p-4">
            <h2 className="text-xl font-bold text-white mb-4">Safety Tips</h2>
            {isLoading ? (
              <p className="text-white/80">Loading safety tips...</p>
            ) : safetyTips.length > 0 ? (
              safetyTips.map((tip) => {
                const IconComponent = iconMap[tip.icon] || FaShieldAlt;
                return (
                  <div
                    key={tip.id}
                    className="flex items-center space-x-4 mb-2 cursor-pointer hover:bg-[#004015] p-2 rounded"
                    onClick={() => {
                      setSelectedSafetyTip(tip);
                      setShowSafetyTipModal(true);
                    }}
                  >
                    <IconComponent size={24} className="text-white" />
                    <div>
                      <p className="text-white font-semibold">{tip.name}</p>
                      <p className="text-white/80 text-sm">{tip.content}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-white/80">No safety tips available.</p>
            )}
          </div>
          <div className="bg-[#005524] rounded-lg shadow-md p-4">
            <h2 className="text-xl font-bold text-white mb-4">Crisis Alerts</h2>
            {isLoading ? (
              <p className="text-white/80">Loading alerts...</p>
            ) : crisisAlerts.length > 0 ? (
              <div className="max-h-80 overflow-y-auto">
                {crisisAlerts
                  .slice()
                  .reverse()
                  .map((crisis) => {
                    const hasUserMarkedSafe = userSafeAlerts.some(
                      (safeAlert) => safeAlert.related_crisis_id === crisis.id
                    );
                    return (
                      <div key={crisis.id} className="mb-4">
                        <p className="text-white font-semibold">
                          {crisis.type} by {crisis.reporter}
                        </p>
                        <p className="text-sm text-white/80">
                          {new Date(crisis.created_at).toLocaleString()}
                        </p>
                        <p className="text-sm text-white/80">
                          At Lat: {crisis.location.lat}, Lng:{" "}
                          {crisis.location.lng}
                        </p>
                        {hasUserMarkedSafe || crisis.responded_safe ? (
                          <p className="text-sm text-green-300">
                            {crisis.reporter} marked safe
                          </p>
                        ) : (
                          <button
                            onClick={() => handleMarkSafe(crisis.id)}
                            className="mt-2 bg-green-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-green-600"
                          >
                            <FaCheck className="inline mr-1" /> Mark Safe
                          </button>
                        )}
                      </div>
                    );
                  })}
              </div>
            ) : (
              <p className="text-white/80">No active alerts.</p>
            )}
          </div>
          {activeTab === "message" && (
            <div className="bg-[#005524] rounded-lg shadow-md p-4">
              <h2 className="text-xl font-bold text-white mb-4">Messages</h2>
              {showChatList ? (
                <div>
                  {isLoading ? (
                    <p className="text-white/80">Loading messages...</p>
                  ) : connections.length > 0 ? (
                    connections.map((connection) => (
                      <div
                        key={connection.id}
                        className="flex items-center space-x-4 mb-2 cursor-pointer hover:bg-[#004015] p-2 rounded"
                        onClick={() => handleSelectConnection(connection)}
                      >
                        <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-white">
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
                        <div>
                          <p className="text-white font-semibold">
                            {connection.name}
                          </p>
                          <p className="text-white/80 text-sm">
                            {getMessagesForRecipient(
                              connection.connected_user_id
                            )[0]?.content || "No messages yet"}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-white/80">No connections to message.</p>
                  )}
                </div>
              ) : (
                <div>
                  <div className="flex items-center space-x-4 mb-4">
                    <button
                      onClick={() => setShowChatList(true)}
                      className="text-white hover:text-white/80"
                    >
                      ← Back to Chat List
                    </button>
                    {selectedConnection && (
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-white">
                          {selectedConnection.avatar ? (
                            <img
                              src={selectedConnection.avatar}
                              className="w-full h-full rounded-full"
                              alt={selectedConnection.name}
                            />
                          ) : (
                            <span>👤</span>
                          )}
                        </div>
                        <span className="text-white font-semibold">
                          {selectedConnection.name}
                        </span>
                      </div>
                    )}
                  </div>
                  <div
                    ref={chatContainerRef}
                    className="bg-white rounded-lg p-4 max-h-80 overflow-y-auto border border-gray-300"
                  >
                    {selectedConnection &&
                      getMessagesForRecipient(
                        selectedConnection.connected_user_id
                      ).map((msg) => (
                        <div
                          key={msg.id}
                          className={`mb-3 flex ${
                            msg.sender_id === userProfile?.id
                              ? "justify-end"
                              : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-xs p-3 rounded-lg shadow-sm ${
                              msg.sender_id === userProfile?.id
                                ? "bg-[#005524] text-white"
                                : "bg-gray-200 text-gray-800"
                            }`}
                          >
                            <p>{msg.content}</p>
                            <p className="text-xs opacity-70 mt-1 text-right">
                              {new Date(msg.timestamp).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                  <div className="mt-4 flex items-center space-x-2">
                    <textarea
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 p-2 rounded-lg border border-gray-300 resize-none h-16"
                    />
                    <button
                      onClick={handleSendMessage}
                      className="bg-[#005524] text-white px-4 py-2 rounded-lg hover:bg-[#004015] disabled:opacity-50"
                      disabled={!messageText.trim() || !selectedConnection}
                    >
                      Send
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
      </div>

      {showConnectionOptions && selectedConnection && (
        <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-80 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-[#005524]">
                {selectedConnection.name}
              </h2>
              <button
                onClick={() => setShowConnectionOptions(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            </div>
            <div className="space-y-2">
              <button
                onClick={() =>
                  handleConnectionAction("profile", selectedConnection)
                }
                className="w-full bg-[#005524] text-white px-4 py-2 rounded-lg hover:bg-[#004015] flex items-center justify-center"
              >
                <FaUser className="mr-2" /> View Profile
              </button>
              <button
                onClick={() =>
                  handleConnectionAction("message", selectedConnection)
                }
                className="w-full bg-[#f69f00] text-white px-4 py-2 rounded-lg hover:bg-[#d88e00] flex items-center justify-center"
              >
                <FaEnvelope className="mr-2" /> Message
              </button>
            </div>
          </div>
        </div>
      )}

      {showProfile && (
        <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-[#005524]">Profile</h2>
              <button
                onClick={() => {
                  setShowProfile(false);
                  setSelectedSearchProfile(null);
                  if (userProfile?.id) {
                    setUserProfile(userProfile);
                  }
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="w-24 h-24 rounded-full bg-gray-300 flex items-center justify-center text-white text-4xl">
                  {selectedSearchProfile?.avatar || userProfile?.avatar ? (
                    <img
                      src={selectedSearchProfile?.avatar || userProfile?.avatar}
                      className="w-full h-full rounded-full"
                      alt="Profile"
                    />
                  ) : (
                    <span>👤</span>
                  )}
                </div>
              </div>
              <div className="text-center">
                <h3 className="text-xl font-semibold text-gray-800">
                  {isLoading
                    ? "Loading..."
                    : selectedSearchProfile?.name ||
                      userProfile?.name ||
                      "User"}
                </h3>
                <p className="text-gray-500">
                  Member since {new Date().getFullYear()}
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-gray-600">Email</span>
                  <span className="text-gray-800">
                    {selectedSearchProfile?.email ||
                      userProfile?.email ||
                      "N/A"}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-gray-600">Role</span>
                  <span className="text-gray-800">
                    {selectedSearchProfile?.role || userProfile?.role || "N/A"}
                  </span>
                </div>
              </div>
              {selectedSearchProfile &&
                selectedSearchProfile.id !== userProfile?.id && (
                  <button
                    onClick={() =>
                      handleSendConnectionRequest(selectedSearchProfile.id)
                    }
                    className="w-full bg-[#f69f00] text-white px-4 py-2 rounded-lg hover:bg-[#d88e00] flex items-center justify-center"
                  >
                    <FaUserPlus className="mr-2" /> Add Connection
                  </button>
                )}
              {error && <p className="text-red-500 text-sm">{error}</p>}
            </div>
          </div>
        </div>
      )}

      {showSettings && (
        <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-[#005524]">Settings</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-700">Notifications</h3>
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-gray-600">Email Notifications</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      defaultChecked
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#005524]"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-gray-600">Push Notifications</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      defaultChecked
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#005524]"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-gray-600">Push Notifications</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      defaultChecked
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#005524]"></div>
                  </label>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-700">Device Status</h3>
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-gray-600">Status</span>
                  <span
                    className={`text-sm ${
                      deviceStatus === "Active"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {deviceStatus}
                  </span>
                </div>
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
            </div>
          </div>
        </div>
      )}

      {showLocationView && selectedLocation && selectedEmergency && (
        <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-[#005524]">
                Emergency Location
              </h2>
              <button
                onClick={() => setShowLocationView(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            </div>
            <div className="space-y-4">
              <img
                src={mapImage}
                alt="Map"
                className="w-full h-48 rounded-lg object-cover"
              />
              <div>
                <p className="text-gray-800 font-semibold">
                  {selectedEmergency.emergency_type}
                </p>
                <p className="text-sm text-gray-600">
                  Reported by {selectedEmergency.name}
                </p>
                <p className="text-sm text-gray-600">
                  Lat: {selectedLocation.lat}, Lng: {selectedLocation.lng}
                </p>
                <p className="text-sm text-gray-500">
                  {new Date(selectedEmergency.created_at).toLocaleString()}
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleCallAssistance(selectedEmergency)}
                  className="flex-1 bg-[#f69f00] text-white px-4 py-2 rounded-lg hover:bg-[#d88e00]"
                >
                  <FaPhoneAlt className="inline mr-2" /> Call Assistance
                </button>
                <button
                  onClick={() => handleReport(selectedEmergency)}
                  className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
                >
                  <FaExclamationTriangle className="inline mr-2" /> Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCallConfirm && selectedEmergencyForAction && (
        <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-80 shadow-xl">
            <h2 className="text-xl font-bold text-[#005524] mb-4">
              Confirm Call
            </h2>
            <p className="text-gray-600 mb-4">
              Are you sure you want to call assistance for{" "}
              {selectedEmergencyForAction.emergency_type} reported by{" "}
              {selectedEmergencyForAction.name}?
            </p>
            <div className="flex space-x-2">
              <button
                onClick={initiateCall}
                className="flex-1 bg-[#f69f00] text-white px-4 py-2 rounded-lg hover:bg-[#d88e00]"
              >
                Yes
              </button>
              <button
                onClick={() => setShowCallConfirm(false)}
                className="flex-1 bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showReportConfirm && selectedEmergencyForAction && (
        <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-80 shadow-xl">
            <h2 className="text-xl font-bold text-[#005524] mb-4">
              Confirm Report
            </h2>
            <p className="text-gray-600 mb-4">
              Are you sure you want to report{" "}
              {selectedEmergencyForAction.emergency_type} by{" "}
              {selectedEmergencyForAction.name}?
            </p>
            <div className="flex space-x-2">
              <button
                onClick={submitReport}
                className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
              >
                Yes
              </button>
              <button
                onClick={() => setShowReportConfirm(false)}
                className="flex-1 bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showAlertConfirm && selectedAlertType && (
        <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-80 shadow-xl">
            <h2 className="text-xl font-bold text-[#005524] mb-4">
              Alert Sent
            </h2>
            <p className="text-gray-600 mb-4">
              Your {selectedAlertType} alert has been sent successfully.
            </p>
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  setShowAlertConfirm(false);
                  if (!isSafe) {
                    handleMarkSafe();
                  }
                }}
                className="flex-1 bg-[#005524] text-white px-4 py-2 rounded-lg hover:bg-[#004015]"
              >
                {isSafe ? "OK" : "Mark Safe"}
              </button>
              {!isSafe && (
                <button
                  onClick={() => setShowAlertConfirm(false)}
                  className="flex-1 bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showLogoutConfirm && (
        <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-80 shadow-xl">
            <h2 className="text-xl font-bold text-[#005524] mb-4">
              Confirm Logout
            </h2>
            <p className="text-gray-600 mb-4">
              Are you sure you want to log out?
            </p>
            <div className="flex space-x-2">
              <button
                onClick={handleLogout}
                className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
              >
                Yes
              </button>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showSafetyTipModal && selectedSafetyTip && (
        <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-[#005524]">
                {selectedSafetyTip.name}
              </h2>
              <button
                onClick={() => setShowSafetyTipModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex justify-center">
                {(() => {
                  const IconComponent =
                    iconMap[selectedSafetyTip.icon] || FaShieldAlt;
                  return <IconComponent size={48} className="text-[#005524]" />;
                })()}
              </div>
              <p className="text-gray-600">{selectedSafetyTip.content}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
