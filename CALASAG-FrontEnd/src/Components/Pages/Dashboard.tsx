import React, { useState } from "react";
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
} from "react-icons/fa";
import logoImage from "../Images/no-bg-logo.png";
import mapImage from "../Images/ph-map.png";

interface Location {
  lat: number;
  lng: number;
}

interface Emergency {
  id: number;
  name: string;
  avatar: string;
  emergency: string;
  message: string;
  location: Location;
}

interface Connection {
  id: number;
  name: string;
  avatar: string;
}

interface Type {
  id: number;
  name: string;
}

interface Notification {
  id: number;
  message: string;
  time: string;
  read: boolean;
}

interface Message {
  id: number;
  sender: string;
  receiver: string;
  content: string;
  timestamp: string;
}

interface CrisisAlert {
  type: string;
  reporter: string;
  isSelf: boolean;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeUser, setActiveUser] = useState<string>("Juan Dela Cruz");
  const [activeTab, setActiveTab] = useState<string>("home");
  const [showMessages, setShowMessages] = useState<boolean>(false);
  const [showReport, setShowReport] = useState<boolean>(false);
  const [showProfileMenu, setShowProfileMenu] = useState<boolean>(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [showProfile, setShowProfile] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showLocationView, setShowLocationView] = useState<boolean>(false);
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
  const [crisisAlert, setCrisisAlert] = useState<CrisisAlert>({
    type: "Fire",
    reporter: "Justine Mae Dolor",
    isSelf: false,
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentChatRecipient, setCurrentChatRecipient] = useState<string>("");
  const [showChatList, setShowChatList] = useState<boolean>(true);
  const [selectedConnection, setSelectedConnection] =
    useState<Connection | null>(null);
  const [connectionTab, setConnectionTab] = useState<"profile" | "message">(
    "profile"
  );
  const [messageText, setMessageText] = useState("");
  const [messageSent, setMessageSent] = useState(false);

  const [emergencies, setEmergencies] = useState<Emergency[]>([
    {
      id: 1,
      name: "Jonathan Ray Sicat",
      avatar: "/avatars/myah.png",
      emergency: "Needs Ambulance - Medical Emergency",
      message: "I AM INVOLVED IN A MOTORCYCLE ACCIDENT!!!",
      location: { lat: 13.767783, lng: 121.063503 },
    },
    {
      id: 2,
      name: "Dawn Emmanuel Aguila",
      avatar: "/avatars/olli.png",
      emergency: "Reporting Incident",
      message: "Car Crash at SLEX",
      location: { lat: 13.788724, lng: 121.060253 },
    },
    {
      id: 3,
      name: "Justine Mae Dolor",
      avatar: "/avatars/jess.png",
      emergency: "Fire Alert",
      message: "Fire in the building!",
      location: { lat: 13.7565, lng: 121.0583 },
    },
    {
      id: 4,
      name: "German Gerrich Cardona",
      avatar: "/avatars/john.png",
      emergency: "Lost Child",
      message: "Child missing in the park.",
      location: { lat: 52.3737, lng: 4.899 },
    },
    {
      id: 5,
      name: "Justin Anthony Aleta",
      avatar: "/avatars/elli.png",
      emergency: "Car Accident",
      message: "Need assistance at the intersection.",
      location: { lat: 13.788724, lng: 121.060253 },
    },
    {
      id: 6,
      name: "Hyacinth Louisse Almiro",
      avatar: "/avatars/bo.png",
      emergency: "Looking for help",
      message: "I need car guy",
      location: { lat: 13.788724, lng: 121.060253 },
    },
    {
      id: 7,
      name: "Jix Jimrei Ilao",
      avatar: "/avatars/nataniel.png",
      emergency: "Looking for Andy",
      message: "I need car girl",
      location: { lat: 13.767783, lng: 121.063503 },
    },
  ]);

  const [connections, setConnections] = useState<Connection[]>([
    { id: 1, name: "Jonathan Ray Sicat", avatar: "/avatars/jess.png" },
    { id: 2, name: "Dawn Emmanuel Aguila", avatar: "/avatars/john.png" },
    { id: 3, name: "Justine Mae Dolor", avatar: "/avatars/olli.png" },
    { id: 4, name: "Hyacinth Louisse Almiro", avatar: "/avatars/elli.png" },
    { id: 5, name: "Julius Caniete", avatar: "/avatars/bo.png" },
    { id: 6, name: "German Gerrich Cardona", avatar: "/avatars/nikita.png" },
    { id: 7, name: "Justin Anthony Aleta", avatar: "/avatars/nataniel.png" },
    { id: 8, name: "Jix Jimrei Ilao", avatar: "/avatars/ayisha.png" },
  ]);

  const [type, setType] = useState<Type[]>([
    { id: 1, name: "Medical Emergency" },
    { id: 2, name: "Missing Person" },
    { id: 3, name: "Fire" },
    { id: 4, name: "Accident" },
    { id: 5, name: "Theft" },
    { id: 6, name: "General Assistance" },
  ]);

  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 1,
      message: "New emergency reported in your area",
      time: "5 minutes ago",
      read: false,
    },
    {
      id: 2,
      message: "Your connection Vin Vernon Perez is nearby",
      time: "10 minutes ago",
      read: false,
    },
  ]);

  const [deviceStatus, setDeviceStatus] = useState<"Active" | "Inactive">(
    "Active"
  );

  const handleEmergencyAlert = (type: string) => {
    setCrisisAlert({
      type,
      reporter: activeUser,
      isSelf: true,
    });
    setIsSafe(false);
    setSelectedAlertType(type);
    setShowAlertConfirm(true);
  };

  const resetCrisisAlert = () => {
    setIsSafe(false);
    setCrisisAlert({
      type: "Fire",
      reporter: "Justine Mae Dolor",
      isSelf: false,
    });
  };

  const refreshFeed = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setEmergencies((prevEmergencies) => {
        const shuffled = [...prevEmergencies].sort(() => Math.random() - 0.5);
        return shuffled;
      });
      setIsRefreshing(false);
    }, 1000);
  };

  const handleNavigation = (tab: string) => {
    setActiveTab(tab);
    switch (tab) {
      case "home":
        setShowMessages(false);
        setShowReport(false);
        refreshFeed();
        break;
      case "message":
        setShowMessages(true);
        setShowReport(false);
        break;
      case "report":
        setShowMessages(false);
        setShowReport(true);
        break;
    }
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

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  const markNotificationAsRead = (id: number) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
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

  const submitReport = () => {
    console.log("Report submitted for:", selectedEmergencyForAction);
    setShowReportConfirm(false);
  };

  const handleSendMessage = (receiver: string, content: string) => {
    const newMessage: Message = {
      id: messages.length + 1,
      sender: activeUser,
      receiver: receiver,
      content: content,
      timestamp: new Date().toLocaleTimeString(),
    };
    setMessages([...messages, newMessage]);
    setMessageSent(true);
    setCurrentChatRecipient(receiver);
    setShowChatList(true);
    setTimeout(() => {
      setMessageSent(false);
      setMessageText("");
      setSelectedConnection(null);
    }, 1500);
  };

  const getUniqueChatRecipients = () => {
    const recipients = new Set<string>();
    messages.forEach((message) => {
      if (message.sender === activeUser) {
        recipients.add(message.receiver);
      } else {
        recipients.add(message.sender);
      }
    });
    return Array.from(recipients);
  };

  const getLastMessage = (recipient: string) => {
    const relevantMessages = messages.filter(
      (msg) =>
        (msg.sender === activeUser && msg.receiver === recipient) ||
        (msg.sender === recipient && msg.receiver === activeUser)
    );
    return relevantMessages[relevantMessages.length - 1];
  };

  return (
    <div className="min-h-screen bg-[#f8eed4] flex flex-col">
      {/* Top Navigation Bar */}
      <div className="bg-[#f8eed4] border-b border-gray-300 p-2 flex items-center justify-between shadow-sm">
        <div className="flex items-center">
          <img src={logoImage} className="h-10 w-auto" alt="Logo" />
          <div className="ml-auto relative">
            <input
              type="text"
              placeholder="Search..."
              className="bg-white rounded-lg px-3 py-1 w-40 text-sm border border-gray-300"
            />
            <button className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500">
              <FaSearch size={16} />
            </button>
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
            <span className={`text-xl ${isRefreshing ? "animate-spin" : ""}`}>
              {isRefreshing ? "🔄" : <FaHome size={20} />}
            </span>
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
            <span className="text-xl">
              <FaBell size={20} />
            </span>
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
            <span className="text-xl">
              <FaExclamationTriangle size={20} />
            </span>
            <span className="text-xs mt-1">Report</span>
          </button>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative focus:outline-none hover:bg-gray-100 rounded-full p-2 transition-colors duration-200"
            >
              <span className="text-[#f69f00]">
                <FaBell size={20} />
              </span>
              {notifications.filter((n) => !n.read).length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full h-4 w-4 flex items-center justify-center text-xs">
                  {notifications.filter((n) => !n.read).length}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg py-1 z-50">
                <div className="px-4 py-2 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-700">
                    Notifications
                  </h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`px-4 py-3 hover:bg-gray-50 cursor-pointer ${
                        !notification.read ? "bg-blue-50" : ""
                      }`}
                      onClick={() => markNotificationAsRead(notification.id)}
                    >
                      <p className="text-gray-800">{notification.message}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {notification.time}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center space-x-2 focus:outline-none hover:bg-gray-100 rounded-lg px-2 py-1 transition-colors duration-200"
            >
              <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-white hover:bg-gray-400 transition-colors duration-200">
                👤
              </div>
              <div className="flex items-center text-[#005524]">
                <span className="font-medium">{activeUser}</span>
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
                  <span className="mr-2">
                    <FaUser size={16} />
                  </span>{" "}
                  Profile
                </button>
                <button
                  onClick={() => handleProfileAction("settings")}
                  className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center"
                >
                  <span className="mr-2">
                    <FaCog size={16} />
                  </span>{" "}
                  Settings
                </button>
                <div className="border-t border-gray-200 my-1"></div>
                <button
                  onClick={() => handleProfileAction("logout")}
                  className="w-full px-4 py-2 text-left text-red-600 hover:bg-gray-100 flex items-center"
                >
                  <span className="mr-2">
                    <FaSignOutAlt size={16} />
                  </span>{" "}
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 relative">
        {/* Left Side - Map & Device Info */}
        <div className="w-1/4 p-4 flex flex-col space-y-4">
          <div className="bg-[#005524] rounded-lg shadow-md p-3 h-fit">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-bold text-white">Your Location</h2>
              <button className="text-white">⋮</button>
            </div>
            <div className="bg-gray-200 rounded relative">
              <div className="w-full">
                <img
                  src={mapImage}
                  alt="Map location"
                  className="w-full rounded"
                />
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  📍
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#005524] rounded-lg shadow-md p-4">
            <h2 className="text-xl font-bold text-white mb-4">Your Device</h2>
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 p-2 rounded-lg">
                <span className="text-white text-2xl">📱</span>
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-white/90 font-medium">ID:</span>
                  <span className="text-white">01-JM-C24</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-white/90 font-medium">Status:</span>
                  <span
                    className={`font-medium ${
                      deviceStatus === "Active"
                        ? "text-[#f69f00]"
                        : "text-[#be4c1d]"
                    }`}
                  >
                    {deviceStatus}
                  </span>
                </div>
              </div>
              <button
                className={`rounded-lg flex-1 ${
                  deviceStatus === "Active"
                    ? "bg-[#be4c1d] hover:bg-[#004015]"
                    : "bg-[#f69f00] hover:bg-[#be4c1d]"
                } text-white py-2 px-4 flex items-center justify-center transition-colors`}
                onClick={() =>
                  setDeviceStatus(
                    deviceStatus === "Active" ? "Inactive" : "Active"
                  )
                }
              >
                {deviceStatus === "Active" ? "Deactivate" : "Activate"}
              </button>
            </div>
          </div>
          <div className="bg-[#005524] rounded-lg shadow-md p-4">
            <h2 className="text-2xl font-bold text-white mb-4">Safety Tips</h2>
            <div className="space-y-2">
              {type.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center p-2 rounded-lg bg-white/10 hover:bg-white/20 cursor-pointer transition-colors duration-200"
                >
                  <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-white">
                    SOS
                  </div>
                  <span className="text-white ml-3">
                    {item.name || "Unknown Type"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="w-2/4 p-4">
          <div className="bg-[#005524] border border-gray-300 rounded-lg p-4 mb-4 flex items-center justify-center">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-white text-xl">
                👤
              </div>
              <div>
                <span className="text-white text-lg font-medium">
                  {activeUser}
                </span>
              </div>
            </div>
          </div>

          {emergencies.map((emergency) => (
            <div
              key={emergency.id}
              className="bg-[#f8eed4] border border-gray-800 rounded-lg mb-4 overflow-hidden"
            >
              <div className="bg-[#f8eed4] p-4 flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-white">
                  👤
                </div>
                <div>
                  <h3 className="text-[#005524] font-medium">
                    {emergency.name}
                  </h3>
                  <p className="text-sm text-gray-600">{emergency.emergency}</p>
                </div>
                <div className="ml-auto">
                  <button
                    onClick={() => handleViewLocation(emergency)}
                    className="flex items-center text-green-600 text-sm hover:text-green-700 transition-colors"
                  >
                    <span className="mr-1">
                      <FaMapMarkerAlt size={16} />
                    </span>{" "}
                    View Location
                  </button>
                </div>
              </div>
              <div className="px-4 py-2 border-t border-gray-800">
                <h4 className="text-xl font-bold text-[#005524] mb-2">
                  {emergency.message}
                </h4>
              </div>
              <div className="flex border-t border-gray-300">
                <button
                  onClick={() => handleCallAssistance(emergency)}
                  className="flex-1 bg-[#005524] text-white py-2 px-4 flex items-center justify-center hover:bg-[#004015] transition-colors"
                >
                  <span className="mr-2">
                    <FaPhone size={16} />
                  </span>{" "}
                  Call Assistance
                </button>
                <button
                  onClick={() => handleReport(emergency)}
                  className="flex-1 bg-[#be4c1d] text-white py-2 px-4 flex items-center justify-center hover:bg-[#a33d16] transition-colors"
                >
                  <span className="mr-2">
                    <FaExclamationTriangle size={16} />
                  </span>{" "}
                  Report
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Right Side - Connections */}
        <div className="w-1/4 p-4">
          <div className="w-full bg-[#005524] rounded-lg p-4 mb-4">
            <h3 className="text-lg font-bold text-white mb-1">
              Crisis Response
            </h3>
            <p className="text-sm text-white mb-3 text-center">
              Respond to nearby emergencies or mark yourself as safe.
            </p>
            {isSafe ? (
              <div className="flex flex-col items-center justify-center gap-2 text-[#f69f00] font-semibold">
                <FaCheck className="text-2xl" />
                You are marked as Safe
                <button
                  className="text-xs text-[#be4c1d] underline hover:text-red-700"
                  onClick={resetCrisisAlert}
                >
                  Undo
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <p className="text-white font-semibold">
                  {crisisAlert.isSelf
                    ? `You reported a ${crisisAlert.type} Alert`
                    : `${crisisAlert.type} Alert reported by ${crisisAlert.reporter} nearby`}
                </p>
                <button
                  className="bg-[#f69f00] hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors"
                  onClick={() => setIsSafe(true)}
                >
                  <FaCheck /> I am Safe
                </button>
              </div>
            )}
          </div>
          <div className="bg-[#005524] rounded-lg shadow-md p-4">
            <h2 className="text-2xl font-bold text-white mb-4">Connections</h2>
            <div className="space-y-2">
              {connections.map((connection) => (
                <div
                  key={connection.id}
                  className="flex items-center p-2 rounded-lg bg-white/10 hover:bg-white/20 cursor-pointer transition-colors duration-200"
                  onClick={() => setSelectedConnection(connection)}
                >
                  <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-white">
                    👤
                  </div>
                  <span className="text-white ml-3">{connection.name}</span>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <h3 className="text-lg font-bold text-white mb-2">
                Physical IoT Device Buttons
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleEmergencyAlert("Fire")}
                  className="bg-red-600 text-white py-2 px-3 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center text-sm"
                >
                  <FaFire className="mr-1" /> Fire Alert
                </button>
                <button
                  onClick={() => handleEmergencyAlert("Police")}
                  className="bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center text-sm"
                >
                  <FaShieldAlt className="mr-1" /> Police Alert
                </button>
                <button
                  onClick={() => handleEmergencyAlert("Accident")}
                  className="bg-yellow-600 text-white py-2 px-3 rounded-lg hover:bg-yellow-700 transition-colors flex items-center justify-center text-sm"
                >
                  <FaCarCrash className="mr-1" /> Accident Alert
                </button>
                <button
                  onClick={() => handleEmergencyAlert("Medical")}
                  className="bg-green-600 text-white py-2 px-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center text-sm"
                >
                  <FaAmbulance className="mr-1" /> Medical Alert
                </button>
              </div>
            </div>
          </div>
          {selectedConnection && (
            <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-96 shadow-xl">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-[#005524]">
                    Connection Details
                  </h2>
                  <button
                    onClick={() => {
                      setSelectedConnection(null);
                      setConnectionTab("profile");
                      setMessageText("");
                      setMessageSent(false);
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-20 h-20 rounded-full bg-gray-300 flex items-center justify-center text-white text-3xl">
                    👤
                  </div>
                  <div className="text-center">
                    <h3 className="text-xl font-semibold text-gray-800">
                      {selectedConnection.name}
                    </h3>
                  </div>
                  <div className="flex justify-center gap-4 mb-2">
                    <button
                      className={`px-4 py-1 rounded-full font-medium text-sm transition-colors ${
                        connectionTab === "profile"
                          ? "bg-[#005524] text-white"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                      onClick={() => setConnectionTab("profile")}
                    >
                      Profile
                    </button>
                    <button
                      className={`px-4 py-1 rounded-full font-medium text-sm transition-colors ${
                        connectionTab === "message"
                          ? "bg-[#005524] text-white"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                      onClick={() => setConnectionTab("message")}
                    >
                      Message
                    </button>
                  </div>
                  {connectionTab === "profile" && (
                    <div className="w-full text-left">
                      <div className="mb-2">
                        <span className="font-semibold text-gray-700">
                          <span className="inline-block mr-2">
                            <FaEnvelope size={16} />
                          </span>
                          Email:
                        </span>{" "}
                        <span className="text-gray-600">user@calasag.com</span>
                      </div>
                      <div className="mb-2">
                        <span className="font-semibold text-gray-700">
                          <span className="inline-block mr-2">
                            <FaPhoneAlt size={16} />
                          </span>
                          Phone:
                        </span>{" "}
                        <span className="text-gray-600">+63 900 000 0000</span>
                      </div>
                      <div className="mb-2">
                        <span className="font-semibold text-gray-700">
                          <span className="inline-block mr-2">
                            <FaInfoCircle size={16} />
                          </span>
                          Status:
                        </span>{" "}
                        <span className="text-green-600">Active</span>
                      </div>
                      <div className="mb-2">
                        <span className="font-semibold text-gray-700">
                          <span className="inline-block mr-2">
                            <FaInfoCircle size={16} />
                          </span>
                          About:
                        </span>{" "}
                        <span className="text-gray-600">
                          This is a placeholder profile. More info can be added
                          here.
                        </span>
                      </div>
                    </div>
                  )}
                  {connectionTab === "message" && (
                    <div className="w-full flex flex-col items-center">
                      {messageSent ? (
                        <div className="text-green-600 font-semibold mb-2">
                          Message sent!
                        </div>
                      ) : (
                        <>
                          <textarea
                            className="w-full border border-gray-300 rounded-lg p-2 mb-2 focus:outline-none focus:ring-2 focus:ring-[#005524]"
                            rows={3}
                            placeholder={`Message to ${selectedConnection.name}`}
                            value={messageText}
                            onChange={(e) => setMessageText(e.target.value)}
                          />
                          <button
                            className="bg-[#005524] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#004015] transition-colors"
                            onClick={() =>
                              handleSendMessage(
                                selectedConnection.name,
                                messageText
                              )
                            }
                            disabled={!messageText.trim()}
                          >
                            Send
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {showMessages && (
          <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-[600px] max-h-[80vh] overflow-y-auto shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center">
                  {!showChatList && (
                    <button
                      onClick={() => setShowChatList(true)}
                      className="mr-4 text-gray-500 hover:text-gray-700"
                    >
                      ←
                    </button>
                  )}
                  <h2 className="text-2xl font-bold text-[#005524]">
                    {showChatList ? "Messages" : `${currentChatRecipient}`}
                  </h2>
                </div>
                <button
                  onClick={() => {
                    setShowMessages(false);
                    setShowChatList(true);
                    setCurrentChatRecipient("");
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              {showChatList ? (
                <div className="space-y-2">
                  {getUniqueChatRecipients().length === 0 ? (
                    <p className="text-gray-600">No conversations yet.</p>
                  ) : (
                    getUniqueChatRecipients().map((recipient) => {
                      const lastMessage = getLastMessage(recipient);
                      return (
                        <div
                          key={recipient}
                          onClick={() => {
                            setCurrentChatRecipient(recipient);
                            setShowChatList(false);
                          }}
                          className="p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-white">
                              👤
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start">
                                <h3 className="font-medium text-gray-900">
                                  {recipient}
                                </h3>
                                <span className="text-xs text-gray-500">
                                  {lastMessage?.timestamp}
                                </span>
                              </div>
                              <p className="text-sm text-gray-500 truncate">
                                {lastMessage?.content || "No messages yet"}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {messages
                    .filter(
                      (message) =>
                        (message.sender === activeUser &&
                          message.receiver === currentChatRecipient) ||
                        (message.sender === currentChatRecipient &&
                          message.receiver === activeUser)
                    )
                    .map((message) => (
                      <div
                        key={message.id}
                        className={`p-3 rounded-lg ${
                          message.sender === activeUser
                            ? "bg-[#005524] text-white ml-auto"
                            : "bg-gray-100 text-gray-800"
                        } max-w-[80%]`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-medium text-sm">
                            {message.sender === activeUser
                              ? "You"
                              : message.sender}
                          </span>
                          <span className="text-xs opacity-75">
                            {message.timestamp}
                          </span>
                        </div>
                        <p className="text-sm">{message.content}</p>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}

        {showReport && (
          <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96 max-h-[80vh] overflow-y-auto shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-[#005524]">
                  Report an Emergency
                </h2>
                <button
                  onClick={() => setShowReport(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <form className="space-y-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Emergency Type
                  </label>
                  <select className="w-full p-2 border border-gray-300 rounded-lg">
                    <option>Medical Emergency</option>
                    <option>Fire</option>
                    <option>Accident</option>
                    <option>Crime</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Description
                  </label>
                  <textarea
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    rows={4}
                    placeholder="Describe the emergency situation..."
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    placeholder="Enter your location"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-[#005524] text-white py-2 px-4 rounded-lg hover:bg-[#004015] transition-colors"
                >
                  Submit Report
                </button>
              </form>
            </div>
          </div>
        )}

        {showLogoutConfirm && (
          <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50">
            <div className="bg-[#f69f00] rounded-lg p-6 w-96 shadow-xl">
              <h2 className="text-2xl font-bold text-[#005524] mb-4">
                Confirm Logout
              </h2>
              <p className="text-gray-600 mb-6">
                Are you sure you want to logout?
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 bg-[#005524] text-white py-2 px-4 rounded-lg hover:bg-[#004015] transition-colors"
                >
                  Logout
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
                  onClick={() => setShowProfile(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className="w-24 h-24 rounded-full bg-gray-300 flex items-center justify-center text-white text-4xl">
                    👤
                  </div>
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-gray-800">
                    {activeUser}
                  </h3>
                  <p className="text-gray-500">Member since 2024</p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="text-gray-600">Email</span>
                    <span className="text-gray-800">user@example.com</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="text-gray-600">Phone</span>
                    <span className="text-gray-800">+63 123 456 7890</span>
                  </div>
                </div>
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
                  ✕
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
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-700">Privacy</h3>
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-gray-600">Location Sharing</span>
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
              </div>
            </div>
          </div>
        )}

        {showLocationView && selectedLocation && selectedEmergency && (
          <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-[600px] shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-[#005524]">
                  Emergency Location
                </h2>
                <button
                  onClick={() => setShowLocationView(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-4">
                <div className="bg-gray-100 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 mb-2">
                    {selectedEmergency.name}
                  </h3>
                  <p className="text-gray-600">{selectedEmergency.emergency}</p>
                  <p className="text-gray-600 mt-1">
                    {selectedEmergency.message}
                  </p>
                </div>
                <div className="relative h-[400px] bg-gray-200 rounded-lg overflow-hidden">
                  <img
                    src={mapImage}
                    alt="Map location"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="bg-red-500 text-white px-3 py-1 rounded-full shadow-lg">
                      📍 Emergency Location
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Latitude:</span>{" "}
                    {selectedLocation.lat}
                  </div>
                  <div>
                    <span className="font-medium">Longitude:</span>{" "}
                    {selectedLocation.lng}
                  </div>
                </div>
                <div className="flex space-x-4">
                  <button
                    onClick={() =>
                      window.open(
                        `https://www.google.com/maps?q=${selectedLocation.lat},${selectedLocation.lng}`,
                        "_blank"
                      )
                    }
                    className="flex-1 bg-[#005524] text-white py-2 px-4 rounded-lg hover:bg-[#004015] transition-colors flex items-center justify-center"
                  >
                    <span className="mr-2">
                      <FaMapMarkedAlt size={16} />
                    </span>{" "}
                    Open in Maps
                  </button>
                  <button
                    onClick={() => setShowLocationView(false)}
                    className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showCallConfirm && selectedEmergencyForAction && (
          <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96 shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-[#005524]">
                  Call Assistance
                </h2>
                <button
                  onClick={() => setShowCallConfirm(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-4">
                <p className="text-gray-600">
                  Are you sure you want to call emergency assistance for{" "}
                  {selectedEmergencyForAction.name}'s{" "}
                  {selectedEmergencyForAction.emergency}?
                </p>
                <div className="bg-gray-100 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">
                    This will initiate a call to emergency services. Please
                    ensure this is a genuine emergency.
                  </p>
                </div>
                <div className="flex space-x-4">
                  <button
                    onClick={() => setShowCallConfirm(false)}
                    className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={initiateCall}
                    className="flex-1 bg-[#005524] text-white py-2 px-4 rounded-lg hover:bg-[#004015] transition-colors flex items-center justify-center"
                  >
                    📞 Call Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showAlertConfirm && selectedAlertType && (
          <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96 shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-[#005524]">
                  Emergency Alert
                </h2>
                <button
                  onClick={() => {
                    setShowAlertConfirm(false);
                    setSelectedAlertType(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-4">
                <p className="text-gray-600">
                  You have triggered this {selectedAlertType} alert.
                </p>
                <div className="bg-gray-100 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">
                    Your alert has been sent to nearby users and emergency
                    services.
                  </p>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      setShowAlertConfirm(false);
                      setSelectedAlertType(null);
                    }}
                    className="bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showReportConfirm && selectedEmergencyForAction && (
          <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96 shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-[#005524]">
                  Report Emergency
                </h2>
                <button
                  onClick={() => setShowReportConfirm(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-4">
                <p className="text-gray-600">
                  You are about to report {selectedEmergencyForAction.name}'s{" "}
                  {selectedEmergencyForAction.emergency}.
                </p>
                <div className="space-y-2">
                  <label className="block text-gray-700 font-medium">
                    Additional Details
                  </label>
                  <textarea
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    rows={3}
                    placeholder="Add any additional information about the emergency..."
                  />
                </div>
                <div className="flex space-x-4">
                  <button
                    onClick={() => setShowReportConfirm(false)}
                    className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitReport}
                    className="flex-1 bg-[#be4c1d] text-white py-2 px-4 rounded-lg hover:bg-[#a33d16] transition-colors flex items-center justify-center"
                  >
                    Submit Report
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
