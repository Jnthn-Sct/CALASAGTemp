import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
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

interface Notification {
  id: number;
  message: string;
  time: string;
  read: boolean;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeUser, setActiveUser] = useState<string>("Justine Mae Dolor");
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
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [selectedEmergency, setSelectedEmergency] = useState<Emergency | null>(null);
  const [showCallConfirm, setShowCallConfirm] = useState<boolean>(false);
  const [showReportConfirm, setShowReportConfirm] = useState<boolean>(false);
  const [selectedEmergencyForAction, setSelectedEmergencyForAction] = useState<Emergency | null>(null);
  const [emergencies, setEmergencies] = useState<Emergency[]>([
    {
      id: 1,
      name: "Jonathan Ray Sicat",
      avatar: "/avatars/myah.png",
      emergency: "Needs Ambulance - Medical Emergency",
      message: "I NEED HELP!!!",
      location: { lat: 52.3733, lng: 4.8978 },
    },
    {
      id: 2,
      name: "Dawn Emmanuel Aguila",
      avatar: "/avatars/olli.png",
      emergency: "Reporting Incident",
      message: "Car Crash at SLEX",
      location: { lat: 52.3731, lng: 4.8972 },
    },
    {
      id: 3,
      name: "Hyacinth Louisse Almiro",
      avatar: "/avatars/jess.png",
      emergency: "Fire Alert",
      message: "Fire in the building!",
      location: { lat: 52.3735, lng: 4.8980 },
    },
    {
      id: 4,
      name: "German Gerrich Cardona",
      avatar: "/avatars/john.png",
      emergency: "Lost Child",
      message: "Child missing in the park.",
      location: { lat: 52.3737, lng: 4.8990 },
    },
    {
      id: 5,
      name: "Justin Anthony Aleta",
      avatar: "/avatars/elli.png",
      emergency: "Car Accident",
      message: "Need assistance at the intersection.",
      location: { lat: 52.3740, lng: 4.9000 },
    },
    {
      id: 6,
      name: "Andy Girl",
      avatar: "/avatars/bo.png",
      emergency: "Looking for help",
      message: "I need car guy",
      location: { lat: 52.3742, lng: 4.9010 },
    },
    {
      id: 7,
      name: "Jix Jimrei Ilao",
      avatar: "/avatars/nataniel.png",
      emergency: "Looking for Andy",
      message: "I need car girl",
      location: { lat: 52.3745, lng: 4.9020 },
    },
  ]);

  const [connections, setConnections] = useState<Connection[]>([
    { id: 1, name: "Jonathan Ray Sicat", avatar: "/avatars/jess.png" },
    { id: 2, name: "Dawn Emmanuel Aguila", avatar: "/avatars/john.png" },
    { id: 3, name: "Hyacinth Louisse Almiro", avatar: "/avatars/olli.png" },
    { id: 4, name: "Justin Anthony Aleta", avatar: "/avatars/elli.png" },
    { id: 5, name: "Julius Caniete", avatar: "/avatars/bo.png" },
    { id: 6, name: "German Gerrich Cardona", avatar: "/avatars/nikita.png" },
    { id: 7, name: "Jix Jimrei Ilao", avatar: "/avatars/nataniel.png" },
    { id: 8, name: "Andy Girl", avatar: "/avatars/ayisha.png" },
  ]);

  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 1,
      message: "New emergency reported in your area",
      time: "5 minutes ago",
      read: false
    },
    {
      id: 2,
      message: "Your connection Andy Girl is nearby",
      time: "10 minutes ago",
      read: false
    }
  ]);

  const refreshFeed = () => {
    setIsRefreshing(true);
    // Simulate API call with setTimeout
    setTimeout(() => {
      setEmergencies(prevEmergencies => {
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
    localStorage.removeItem('user');
    navigate('/login');
  };

  const markNotificationAsRead = (id: number) => {
    setNotifications(prev =>
      prev.map(notification =>
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
    window.open('tel:911', '_blank');
    setShowCallConfirm(false);
  };

  const submitReport = () => {
    // Here you would typically send the report to your backend
    console.log('Report submitted for:', selectedEmergencyForAction);
    setShowReportConfirm(false);
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
              🔍
            </button>
          </div>
        </div>

        <div className="flex items-center justify-center space-x-8">
          <button
            onClick={() => handleNavigation("home")}
            className={`flex flex-col items-center transition-colors duration-200 ${activeTab === "home" ? "text-[#005524]" : "text-gray-500 hover:text-[#005524]"
              }`}
          >
            <span className={`text-xl ${isRefreshing ? 'animate-spin' : ''}`}>
              {isRefreshing ? '🔄' : '🏠'}
            </span>
            <span className="text-xs mt-1">Home</span>
          </button>
          <button
            onClick={() => handleNavigation("message")}
            className={`flex flex-col items-center transition-colors duration-200 ${activeTab === "message" ? "text-[#005524]" : "text-gray-500 hover:text-[#005524]"
              }`}
          >
            <span className="text-xl">💬</span>
            <span className="text-xs mt-1">Message</span>
          </button>
          <button
            onClick={() => handleNavigation("report")}
            className={`flex flex-col items-center transition-colors duration-200 ${activeTab === "report" ? "text-[#005524]" : "text-gray-500 hover:text-[#005524]"
              }`}
          >
            <span className="text-xl">⚠️</span>
            <span className="text-xs mt-1">Report</span>
          </button>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative focus:outline-none hover:bg-gray-100 rounded-full p-2 transition-colors duration-200"
            >
              <span>🔔</span>
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full h-4 w-4 flex items-center justify-center text-xs">
                  {notifications.filter(n => !n.read).length}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg py-1 z-50">
                <div className="px-4 py-2 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-700">Notifications</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.map(notification => (
                    <div
                      key={notification.id}
                      className={`px-4 py-3 hover:bg-gray-50 cursor-pointer ${!notification.read ? 'bg-blue-50' : ''}`}
                      onClick={() => markNotificationAsRead(notification.id)}
                    >
                      <p className="text-gray-800">{notification.message}</p>
                      <p className="text-sm text-gray-500 mt-1">{notification.time}</p>
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
                <span className={`ml-1 transition-transform duration-200 ${showProfileMenu ? 'rotate-180' : ''}`}>▼</span>
              </div>
            </button>

            {/* Profile Dropdown Menu */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-50">
                <button
                  onClick={() => handleProfileAction("profile")}
                  className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center"
                >
                  <span className="mr-2">👤</span>
                  Profile
                </button>
                <button
                  onClick={() => handleProfileAction("settings")}
                  className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center"
                >
                  <span className="mr-2">⚙️</span>
                  Settings
                </button>
                <div className="border-t border-gray-200 my-1"></div>
                <button
                  onClick={() => handleProfileAction("logout")}
                  className="w-full px-4 py-2 text-left text-red-600 hover:bg-gray-100 flex items-center"
                >
                  <span className="mr-2">🚪</span>
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
          {/* Map Component */}
          <div className="bg-[#be4c1d] rounded-lg shadow-md p-3 h-fit">
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

          {/* Device Info */}
          <div className="bg-[#be4c1d] rounded-lg shadow-md p-4">
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
                  <span className="text-white font-medium">Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="w-2/4 p-4">
          {/* User Info Card */}
          <div className="bg-[#be4c1d] border border-gray-300 rounded-lg p-4 mb-4 flex items-center justify-center">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-white text-xl">
                👤
              </div>
              <div>
                <span className="text-white text-lg font-medium">{activeUser}</span>
              </div>
            </div>
          </div>

          {/* Emergency Cards */}
          {emergencies.map((emergency) => (
            <div key={emergency.id} className="bg-[#f8eed4] border border-gray-300 rounded-lg mb-4 overflow-hidden">
              <div className="bg-[#f8eed4] p-4 flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-white">
                  👤
                </div>
                <div>
                  <h3 className="text-[#005524] font-medium">{emergency.name}</h3>
                  <p className="text-sm text-gray-600">{emergency.emergency}</p>
                </div>
                <div className="ml-auto">
                  <button
                    onClick={() => handleViewLocation(emergency)}
                    className="flex items-center text-green-600 text-sm hover:text-green-700 transition-colors"
                  >
                    📍 View Location
                  </button>
                </div>
              </div>
              <div className="px-4 py-2 border-t border-gray-300">
                <h4 className="text-xl font-bold text-[#005524] mb-2">{emergency.message}</h4>
              </div>
              <div className="flex border-t border-gray-300">
                <button
                  onClick={() => handleCallAssistance(emergency)}
                  className="flex-1 bg-[#005524] text-white py-2 px-4 flex items-center justify-center hover:bg-[#004015] transition-colors"
                >
                  📞 Call Assistance
                </button>
                <button
                  onClick={() => handleReport(emergency)}
                  className="flex-1 bg-[#be4c1d] text-white py-2 px-4 flex items-center justify-center hover:bg-[#a33d16] transition-colors"
                >
                  ⚠️ Report
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Right Side - Connections */}
        <div className="w-1/4 p-4">
          <div className="bg-[#be4c1d] rounded-lg shadow-md p-4">
            <h2 className="text-2xl font-bold text-white mb-4">Connections</h2>
            <div className="space-y-2">
              {connections.map((connection) => (
                <div
                  key={connection.id}
                  className="flex items-center p-2 rounded-lg bg-white/10 hover:bg-white/20 cursor-pointer transition-colors duration-200"
                >
                  <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-white">
                    👤
                  </div>
                  <span className="text-white ml-3">{connection.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Messages Modal */}
        {showMessages && (
          <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96 max-h-[80vh] overflow-y-auto shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-[#005524]">Messages</h2>
                <button
                  onClick={() => setShowMessages(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-4">
                <p className="text-gray-600">Your messages will appear here.</p>
                {/* Add your messages content here */}
              </div>
            </div>
          </div>
        )}

        {/* Report Modal */}
        {showReport && (
          <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96 max-h-[80vh] overflow-y-auto shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-[#005524]">Report an Emergency</h2>
                <button
                  onClick={() => setShowReport(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <form className="space-y-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Emergency Type</label>
                  <select className="w-full p-2 border border-gray-300 rounded-lg">
                    <option>Medical Emergency</option>
                    <option>Fire</option>
                    <option>Accident</option>
                    <option>Crime</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Description</label>
                  <textarea
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    rows={4}
                    placeholder="Describe the emergency situation..."
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Location</label>
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

        {/* Logout Confirmation Modal */}
        {showLogoutConfirm && (
          <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96 shadow-xl">
              <h2 className="text-2xl font-bold text-[#005524] mb-4">Confirm Logout</h2>
              <p className="text-gray-600 mb-6">Are you sure you want to logout?</p>
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

        {/* Profile Modal */}
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
                  <h3 className="text-xl font-semibold text-gray-800">{activeUser}</h3>
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

        {/* Settings Modal */}
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
                    <span className="text-gray-600">Push Notifications</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#005524]"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-gray-600">Email Notifications</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#005524]"></div>
                    </label>
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-700">Privacy</h3>
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-gray-600">Location Sharing</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#005524]"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Location View Modal */}
        {showLocationView && selectedLocation && selectedEmergency && (
          <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-[600px] shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-[#005524]">Emergency Location</h2>
                <button
                  onClick={() => setShowLocationView(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-4">
                <div className="bg-gray-100 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 mb-2">{selectedEmergency.name}</h3>
                  <p className="text-gray-600">{selectedEmergency.emergency}</p>
                  <p className="text-gray-600 mt-1">{selectedEmergency.message}</p>
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
                    <span className="font-medium">Latitude:</span> {selectedLocation.lat}
                  </div>
                  <div>
                    <span className="font-medium">Longitude:</span> {selectedLocation.lng}
                  </div>
                </div>
                <div className="flex space-x-4">
                  <button
                    onClick={() => window.open(`https://www.google.com/maps?q=${selectedLocation.lat},${selectedLocation.lng}`, '_blank')}
                    className="flex-1 bg-[#005524] text-white py-2 px-4 rounded-lg hover:bg-[#004015] transition-colors flex items-center justify-center"
                  >
                    🗺️ Open in Maps
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

        {/* Call Assistance Confirmation Modal */}
        {showCallConfirm && selectedEmergencyForAction && (
          <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96 shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-[#005524]">Call Assistance</h2>
                <button
                  onClick={() => setShowCallConfirm(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-4">
                <p className="text-gray-600">
                  Are you sure you want to call emergency assistance for {selectedEmergencyForAction.name}'s {selectedEmergencyForAction.emergency}?
                </p>
                <div className="bg-gray-100 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">
                    This will initiate a call to emergency services. Please ensure this is a genuine emergency.
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

        {/* Report Confirmation Modal */}
        {showReportConfirm && selectedEmergencyForAction && (
          <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96 shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-[#005524]">Report Emergency</h2>
                <button
                  onClick={() => setShowReportConfirm(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-4">
                <p className="text-gray-600">
                  You are about to report {selectedEmergencyForAction.name}'s {selectedEmergencyForAction.emergency}.
                </p>
                <div className="space-y-2">
                  <label className="block text-gray-700 font-medium">Additional Details</label>
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