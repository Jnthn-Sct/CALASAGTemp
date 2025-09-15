import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUserCircle, FaBell, FaMoon, FaSun, FaChevronDown, FaChevronLeft, FaChevronRight, FaTable, FaChartBar, FaKey, FaCalendarAlt, FaFileAlt, FaCubes, FaLock, FaUser, FaHome, FaCog, FaMapMarkerAlt, FaShieldAlt, FaExclamationTriangle, FaCheckCircle, FaClock, FaEye, FaEdit, FaTrash, FaPlus, FaFilter, FaDownload } from 'react-icons/fa';
import logoImage from "../Images/no-bg-logo.png";

// Import Chart.js components
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title as ChartTitle, LineElement, PointElement } from 'chart.js';
import { Pie, Bar, Line } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, ChartTitle, LineElement, PointElement);

interface User {
    id: number;
    name: string;
    email: string;
    status: 'active' | 'inactive';
    lastLogin: string;
    reports: number;
}

interface IncidentReport {
    id: number;
    title: string;
    description: string;
    location: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    status: 'pending' | 'reviewing' | 'resolved';
    reportedBy: string;
    date: string;
}

interface SafetyTip {
    id: number;
    title: string;
    content: string;
    category: 'general' | 'emergency' | 'prevention';
    status: 'draft' | 'published' | 'archived';
    date: string;
}

interface CommunityContent {
    id: number;
    type: 'post' | 'comment' | 'feedback';
    content: string;
    author: string;
    status: 'pending' | 'approved' | 'rejected';
    date: string;
}

const AdminDashboard: React.FC = () => {
    const navigate = useNavigate();

    // Define currentUser as a constant at the beginning
    const currentUser = {
        name: "Admin",
        email: "admin@calasag.com",
        role: "Administrator"
    };

    const [activeTab, setActiveTab] = useState<string>("dashboard");
    const [showLogoutConfirm, setShowLogoutConfirm] = useState<boolean>(false);
    const [showIncidentDetails, setShowIncidentDetails] = useState<boolean>(false);
    const [selectedIncident, setSelectedIncident] = useState<IncidentReport | null>(null);
    const [showSafetyTipModal, setShowSafetyTipModal] = useState<boolean>(false);
    const [showSafetyTipDetails, setShowSafetyTipDetails] = useState<boolean>(false);
    const [selectedSafetyTip, setSelectedSafetyTip] = useState<SafetyTip | null>(null);
    const [showAddUserModal, setShowAddUserModal] = useState<boolean>(false);
    const [showUserDetails, setShowUserDetails] = useState<boolean>(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [showProfileSettings, setShowProfileSettings] = useState<boolean>(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
    const [showNotifications, setShowNotifications] = useState<boolean>(false);
    const [notificationsList, setNotificationsList] = useState([
        { id: 1, message: 'New incident reported', time: '2 mins ago' },
        { id: 2, message: 'Safety tip published', time: '1 hour ago' },
    ]);

    const [openSidebarDropdown, setOpenSidebarDropdown] = useState<string | null>(null);

    const [isEditingPersonal, setIsEditingPersonal] = useState(false);
    const [isEditingSecurity, setIsEditingSecurity] = useState(false);
    const [personalInfo, setPersonalInfo] = useState({
        name: currentUser.name,
        email: currentUser.email
    });
    const [securityInfo, setSecurityInfo] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [notifications, setNotifications] = useState(false);
    const [emailNotifications, setEmailNotifications] = useState(false);

    const [users, setUsers] = useState<User[]>([
        { id: 1, name: "User One", email: "user1@calasag.com", status: "active", lastLogin: "2024-03-20 10:30", reports: 5 },
        { id: 2, name: "User Two", email: "user2@calasag.com", status: "active", lastLogin: "2024-03-19 15:45", reports: 3 },
        { id: 3, name: "User Three", email: "user3@calasag.com", status: "inactive", lastLogin: "2024-03-18 09:15", reports: 0 },
    ]);

    const [incidents, setIncidents] = useState<IncidentReport[]>([
        { id: 1, title: "Suspicious Activity", description: "Unusual behavior observed in parking lot", location: "Main Parking", severity: "high", status: "pending", reportedBy: "User One", date: "2024-03-20" },
        { id: 2, title: "Emergency Response", description: "Medical emergency in Building A", location: "Building A", severity: "critical", status: "reviewing", reportedBy: "User Two", date: "2024-03-20" },
    ]);

    const [safetyTips, setSafetyTips] = useState<SafetyTip[]>([
        { id: 1, title: "Medical Emergency", content: "Stay calm and assess the situation", category: "emergency", status: "published", date: "2024-03-20" },
        { id: 2, title: "Missing Person", content: "Report to authorities immediately", category: "prevention", status: "published", date: "2024-03-19" },
        { id: 3, title: "Accident", content: "Secure the scenes.", category: "emergency", status: "published", date: "2024-03-20" },
    ]);

    const [communityContent, setCommunityContent] = useState<CommunityContent[]>([
        { id: 1, type: "post", content: "Safety concern in Library", author: "User One", status: "pending", date: "2024-03-20" },
        { id: 2, type: "feedback", content: "Great security measures", author: "User Two", status: "approved", date: "2024-03-19" },
    ]);

    const [newSafetyTip, setNewSafetyTip] = useState({
        title: '',
        content: '',
        category: 'general'
    });

    const handleLogout = () => {
        localStorage.removeItem('userRole');
        navigate('/login');
    };

    const handleToggleUserStatus = (userId: number) => {
        setUsers(users.map(user =>
            user.id === userId
                ? { ...user, status: user.status === 'active' ? 'inactive' : 'active' }
                : user
        ));
        setShowUserDetails(false);
    };

    const handleIncidentAction = (incidentId: number, action: 'review' | 'resolve' | 'escalate') => {
        // Handle incident actions
        console.log(`Incident ${incidentId} ${action}`);
        setShowIncidentDetails(false);
    };

    const handleSafetyTipAction = (tipId: number, action: 'publish' | 'archive' | 'unarchive') => {
        setSafetyTips(safetyTips.map(tip =>
            tip.id === tipId
                ? { ...tip, status: action === 'publish' ? 'published' : action === 'archive' ? 'archived' : 'draft' }
                : tip
        ));
    };

    const handleContentModeration = (contentId: number, action: 'approve' | 'reject') => {
        setCommunityContent(communityContent.map(content =>
            content.id === contentId
                ? { ...content, status: action === 'approve' ? 'approved' : 'rejected' }
                : content
        ));
    };

    const handleAddSafetyTip = (e: React.FormEvent) => {
        e.preventDefault();
        const newTip: SafetyTip = {
            id: safetyTips.length + 1,
            title: newSafetyTip.title,
            content: newSafetyTip.content,
            category: newSafetyTip.category as SafetyTip['category'],
            status: 'draft',
            date: new Date().toISOString().split('T')[0]
        };
        setSafetyTips([...safetyTips, newTip]);
        setShowSafetyTipModal(false);
        setNewSafetyTip({ title: '', content: '', category: 'general' });
    };

    const renderContent = () => {
        // Prepare data for charts
        const userStatusData = {
            labels: ['Active', 'Inactive'],
            datasets: [
                {
                    data: [users.filter(u => u.status === 'active').length, users.filter(u => u.status === 'inactive').length],
                    backgroundColor: ['#005524', '#f69f00'],
                    borderColor: ['#ffffff', '#ffffff'],
                    borderWidth: 2,
                },
            ],
        };

        const incidentSeverityData = {
            labels: ['Low', 'Medium', 'High', 'Critical'],
            datasets: [
                {
                    label: 'Number of Incidents',
                    data: [
                        incidents.filter(i => i.severity === 'low').length,
                        incidents.filter(i => i.severity === 'medium').length,
                        incidents.filter(i => i.severity === 'high').length,
                        incidents.filter(i => i.severity === 'critical').length,
                    ],
                    backgroundColor: ['#34d399', '#fbc02d', '#f56565', '#c53030'],
                    borderColor: ['#ffffff', '#ffffff', '#ffffff', '#ffffff'],
                    borderWidth: 2,
                },
            ],
        };

        const salesData = {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            datasets: [
                {
                    label: 'Incident Reports',
                    data: [12, 19, 15, 25, 22, 30, 28, 35, 32, 40, 38, 45],
                    borderColor: '#005524',
                    backgroundColor: 'rgba(0, 85, 36, 0.1)',
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
                    position: 'bottom' as const,
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
                        color: 'rgba(0, 0, 0, 0.05)',
                    },
                },
                x: {
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)',
                    },
                },
            },
        };

        switch (activeTab) {
            case "dashboard":
                return (
                    <div className="space-y-8">
                        {/* Top Metric Cards */}
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                            {/* Total Users */}
                            <div className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-[#005524]/20">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600 mb-1">TOTAL USERS</p>
                                        <p className="text-3xl font-bold text-gray-900">{users.length}</p>
                                        <p className="text-sm text-green-600 mt-1">+12% since last month</p>
                                    </div>
                                    <div className="w-12 h-12 bg-gradient-to-br from-[#005524] to-[#004015] rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                                        <FaUser size={20} />
                                    </div>
                                </div>
                            </div>

                            {/* Active Users */}
                            <div className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-[#f69f00]/20">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600 mb-1">ACTIVE USERS</p>
                                        <p className="text-3xl font-bold text-gray-900">{users.filter(u => u.status === 'active').length}</p>
                                        <p className="text-sm text-green-600 mt-1">+8% since last week</p>
                                    </div>
                                    <div className="w-12 h-12 bg-gradient-to-br from-[#f69f00] to-[#be4c1d] rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                                        <FaUser size={20} />
                                    </div>
                                </div>
                            </div>

                            {/* Critical Incidents */}
                            <div className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-red-500/20">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600 mb-1">CRITICAL INCIDENTS</p>
                                        <p className="text-3xl font-bold text-gray-900">{incidents.filter(i => i.severity === 'critical').length}</p>
                                        <p className="text-sm text-red-600 mt-1">-5% since yesterday</p>
                                    </div>
                                    <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                                        <FaExclamationTriangle size={20} />
                                    </div>
                                </div>
                            </div>

                            {/* Safety Tips */}
                            <div className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-blue-500/20">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600 mb-1">SAFETY TIPS</p>
                                        <p className="text-3xl font-bold text-gray-900">{safetyTips.length}</p>
                                        <p className="text-sm text-blue-600 mt-1">+15% this quarter</p>
                                    </div>
                                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                                        <FaShieldAlt size={20} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Charts Section */}
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                            {/* Sales Overview Chart */}
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900">Incident Reports Overview</h3>
                                        <p className="text-sm text-gray-600">4% more in 2024</p>
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
                                    <Line data={salesData} options={chartOptions} />
                                </div>
                            </div>

                            {/* User Status Distribution */}
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-lg font-semibold text-gray-900">User Status Distribution</h3>
                                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                                        <FaDownload size={16} />
                                    </button>
                                </div>
                                <div style={{ height: '300px' }}>
                                    <Pie data={userStatusData} options={chartOptions} />
                                </div>
                            </div>
                        </div>

                        {/* Bottom Section */}
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                            {/* Team Members */}
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-lg font-semibold text-gray-900">Recent Users</h3>
                                    <button className="text-[#005524] hover:text-[#004015] text-sm font-medium">
                                        View all
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    {users.slice(0, 3).map((user) => (
                                        <div key={user.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer group">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-[#005524] to-[#f69f00] rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                                    {user.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">{user.name}</p>
                                                    <p className="text-sm text-gray-500">{user.email}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.status === 'active'
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-red-100 text-red-800'
                                                    }`}>
                                                    {user.status === 'active' ? 'ONLINE' : 'OFFLINE'}
                                                </span>
                                                <button className="p-1 text-gray-400 hover:text-[#005524] opacity-0 group-hover:opacity-100 transition-all duration-300">
                                                    <FaPlus size={12} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Recent Activity */}
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                                    <button className="text-[#005524] hover:text-[#004015] text-sm font-medium">
                                        View all
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    {incidents.slice(0, 3).map((incident) => (
                                        <div key={incident.id}
                                            className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer group"
                                            onClick={() => {
                                                setSelectedIncident(incident);
                                                setShowIncidentDetails(true);
                                            }}>
                                            <div className="flex items-center space-x-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${incident.severity === 'critical' ? 'bg-red-100' :
                                                    incident.severity === 'high' ? 'bg-orange-100' :
                                                        'bg-yellow-100'
                                                    }`}>
                                                    <FaBell size={12} className={
                                                        incident.severity === 'critical' ? 'text-red-600' :
                                                            incident.severity === 'high' ? 'text-orange-600' :
                                                                'text-yellow-600'
                                                    } />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">{incident.title}</p>
                                                    <p className="text-sm text-gray-500">{incident.location}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <span className="text-xs text-gray-400">{incident.date}</span>
                                                <button className="p-1 text-gray-400 hover:text-[#005524] opacity-0 group-hover:opacity-100 transition-all duration-300">
                                                    <FaEye size={12} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Progress Track */}
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-lg font-semibold text-gray-900">System Status</h3>
                                    <button className="text-[#005524] hover:text-[#004015] text-sm font-medium">
                                        Details
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                                    <FaShieldAlt size={12} className="text-blue-600" />
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

            case "users": // Original case for the full user table
                return (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-semibold text-gray-900">All Users (Table View)</h2>
                            <div className="flex items-center gap-3">
                                <button className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-2">
                                    <FaFilter size={14} />
                                    Filter
                                </button>
                                <button className="px-4 py-2 bg-[#005524] text-white rounded-lg hover:bg-[#004d20] transition-colors flex items-center gap-2">
                                    <FaPlus size={14} />
                                    Add User
                                </button>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead>
                                    <tr className="border-b border-gray-200">
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Last Login</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Reports</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {users.map((user) => (
                                        <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="w-10 h-10 bg-gradient-to-br from-[#005524] to-[#f69f00] rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                                        {user.name.charAt(0)}
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.email}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${user.status === 'active'
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-red-100 text-red-800'
                                                    }`}>
                                                    {user.status === 'active' ? 'ONLINE' : 'OFFLINE'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.lastLogin}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.reports}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                                <button
                                                    onClick={() => handleToggleUserStatus(user.id)}
                                                    className={`px-3 py-1 rounded-lg transition-colors ${user.status === 'active'
                                                        ? 'text-red-600 hover:text-red-800 hover:bg-red-50'
                                                        : 'text-green-600 hover:text-green-800 hover:bg-green-50'
                                                        }`}
                                                >
                                                    {user.status === 'active' ? 'Deactivate' : 'Activate'}
                                                </button>
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
                        <h2 className="text-xl font-semibold text-gray-900 mb-6">All Users</h2>
                        <div className="space-y-4">
                            {users.map((user, index) => (
                                <div key={user.id} className={`flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-colors ${index < users.length - 1 ? 'border-b border-gray-100 pb-4' : ''}`}>
                                    <div className="flex items-center space-x-4">
                                        <div className="w-12 h-12 bg-gradient-to-br from-[#005524] to-[#f69f00] rounded-full flex items-center justify-center text-white font-semibold">
                                            {user.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-gray-900">{user.name}</h3>
                                            <p className="text-sm text-gray-600">{user.email} • Status: {user.status} • Last Login: {user.lastLogin}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${user.status === 'active'
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                            }`}>
                                            {user.status === 'active' ? 'ONLINE' : 'OFFLINE'}
                                        </span>
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
                        <h2 className="text-xl font-semibold text-gray-900 mb-6">Active Users</h2>
                        <div className="space-y-4">
                            {users.filter(user => user.status === 'active').map((user, index, arr) => (
                                <div key={user.id} className={`flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-colors ${index < arr.length - 1 ? 'border-b border-gray-100 pb-4' : ''}`}>
                                    <div className="flex items-center space-x-4">
                                        <div className="w-12 h-12 bg-gradient-to-br from-[#005524] to-[#f69f00] rounded-full flex items-center justify-center text-white font-semibold">
                                            {user.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-gray-900">{user.name}</h3>
                                            <p className="text-sm text-gray-600">{user.email} • Last Login: {user.lastLogin}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            ONLINE
                                        </span>
                                        <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                                            <FaEye size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case "incidents":
                return (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-semibold text-gray-900">Incident Reports</h2>
                            <div className="flex items-center gap-3">
                                <button className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-2">
                                    <FaFilter size={14} />
                                    Filter
                                </button>
                                <button className="px-4 py-2 bg-[#005524] text-white rounded-lg hover:bg-[#004d20] transition-colors flex items-center gap-2">
                                    <FaPlus size={14} />
                                    New Report
                                </button>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead>
                                    <tr className="border-b border-gray-200">
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Title</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Severity</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {incidents.map((incident) => (
                                        <tr key={incident.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {incident.title}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${incident.severity === 'critical' ? 'bg-red-100 text-red-800' :
                                                    incident.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                                                        incident.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-green-100 text-green-800'
                                                    }`}>
                                                    {incident.severity}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${incident.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                    incident.status === 'reviewing' ? 'bg-blue-100 text-blue-800' :
                                                        'bg-green-100 text-green-800'
                                                    }`}>
                                                    {incident.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{incident.date}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <button
                                                    onClick={() => {
                                                        setSelectedIncident(incident);
                                                        setShowIncidentDetails(true);
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
            case "safety-tips":
                return (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-semibold text-gray-900">Safety Tips</h2>
                            <button
                                onClick={() => setShowSafetyTipModal(true)}
                                className="px-4 py-2 bg-[#005524] text-white rounded-lg hover:bg-[#004d20] transition-colors flex items-center gap-2"
                            >
                                <FaPlus size={14} />
                                Add New Tip
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead>
                                    <tr className="border-b border-gray-200">
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Title</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Category</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {safetyTips.map((tip) => (
                                        <tr key={tip.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {tip.title}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${tip.category === 'emergency' ? 'bg-red-100 text-red-800' :
                                                    tip.category === 'prevention' ? 'bg-orange-100 text-orange-800' :
                                                        'bg-green-100 text-green-800'
                                                    }`}>
                                                    {tip.category}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${tip.status === 'published' ? 'bg-green-100 text-green-800' :
                                                    tip.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {tip.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{tip.date}</td>
                                            <td className="px-6 py-4 whitespace-nowrap space-x-2">
                                                <button
                                                    onClick={() => {
                                                        setSelectedSafetyTip(tip);
                                                        setShowSafetyTipDetails(true);
                                                    }}
                                                    className="px-3 py-1 rounded-lg text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-colors"
                                                >
                                                    View
                                                </button>
                                                {tip.status === 'draft' && (
                                                    <button
                                                        onClick={() => handleSafetyTipAction(tip.id, 'publish')}
                                                        className="px-3 py-1 rounded-lg text-green-600 hover:text-green-800 hover:bg-green-50 transition-colors"
                                                    >
                                                        Publish
                                                    </button>
                                                )}
                                                {tip.status === 'published' && (
                                                    <button
                                                        onClick={() => handleSafetyTipAction(tip.id, 'archive')}
                                                        className="text-gray-600 hover:text-gray-800"
                                                    >
                                                        Archive
                                                    </button>
                                                )}
                                                {tip.status === 'archived' && (
                                                    <button
                                                        onClick={() => handleSafetyTipAction(tip.id, 'unarchive')}
                                                        className="text-blue-600 hover:text-blue-800"
                                                    >
                                                        Unarchive
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case "settings":
                return (
                    <div className="space-y-6">
                        {/* Profile Settings */}
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
                                        <button type="button" className="px-4 py-2 bg-[#005524] text-white rounded-lg hover:bg-[#004d20]">
                                            Save Changes
                                        </button>
                                    </div>
                                )}
                            </form>
                        </div>
                        {/* Security Settings */}
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
                                            <button type="button" className="px-4 py-2 bg-[#005524] text-white rounded-lg hover:bg-[#004d20]">
                                                Change Password
                                            </button>
                                        </div>
                                    </>
                                )}
                            </form>
                        </div>

                        {/* General Settings Section */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
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
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-all duration-200 ${notifications ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-900">Email Notifications</h4>
                                        <p className="text-sm text-gray-600">Receive email notifications for updates</p>
                                    </div>
                                    <button
                                        onClick={() => setEmailNotifications(!emailNotifications)}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${emailNotifications ? 'bg-[#005524]' : 'bg-gray-200'}`}
                                    >
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-all duration-200 ${emailNotifications ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Save Button */}
                        <div className="flex justify-end">
                            <button
                                className="px-6 py-3 bg-[#005524] text-white rounded-lg hover:bg-[#004d20] transition-colors font-medium"
                            >
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
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <aside className={`transition-all duration-300 ${isSidebarCollapsed ? 'w-20' : 'w-64'} bg-white border-r border-gray-200 min-h-screen flex flex-col shadow-sm z-30 fixed inset-y-0 left-0`}>
                <div className="flex items-center justify-between px-6 py-6 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <img src={logoImage} alt="CALASAG Logo" className="h-8 w-auto object-contain" />
                        {!isSidebarCollapsed && (
                            <span className="text-xl font-bold text-gray-900">CALASAG</span>
                        )}
                    </div>
                    <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="text-gray-400 hover:text-gray-600 transition-colors">
                        {isSidebarCollapsed ? <FaChevronRight size={16} /> : <FaChevronLeft size={16} />}
                    </button>
                </div>

                <nav className="flex-1 flex flex-col gap-1 p-4 bg-white/60 backdrop-blur-sm rounded-r-3xl shadow-inner border-r border-gray-100">
                    <button
                        onClick={() => setActiveTab("dashboard")}
                        className={`relative flex items-center gap-3 px-4 py-3 rounded-r-full transition-all duration-200 text-sm font-medium overflow-hidden group
                        ${activeTab === "dashboard" ? 'bg-[#E7F6EE] text-[#005524]' : 'text-gray-700 hover:bg-[#F1FAF4] hover:text-[#005524]'}
                        `}
                    >
                        <span className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-r-full transition-all duration-200 ${activeTab === 'dashboard' ? 'bg-[#005524]' : 'bg-transparent group-hover:bg-[#CDE6D3]'}`} />
                        <div className="relative flex items-center gap-3 z-10">
                            <FaHome size={18} />
                            {!isSidebarCollapsed && 'Dashboard'}
                        </div>
                    </button>

                    <button
                        onClick={() => {
                            if (isSidebarCollapsed) {
                                setOpenSidebarDropdown('users-management');
                            } else {
                                setOpenSidebarDropdown(openSidebarDropdown === 'users-management' ? null : 'users-management');
                            }
                        }}
                        className={`relative flex items-center w-full gap-3 px-4 py-3 rounded-r-full transition-all duration-200 text-sm font-medium group
                        ${['users','total-users-list','active-users-list'].includes(activeTab) ? 'bg-[#E7F6EE] text-[#005524]' : 'text-gray-700 hover:bg-[#F1FAF4] hover:text-[#005524]'}
                        ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}
                    >
                        <span className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-r-full transition-all duration-200 ${['users','total-users-list','active-users-list'].includes(activeTab) ? 'bg-[#005524]' : 'bg-transparent group-hover:bg-[#CDE6D3]'}`} />
                        <div className="relative flex items-center gap-3 z-10">
                            <FaUser size={18} />
                            {!isSidebarCollapsed && 'Users Management'}
                        </div>
                        {!isSidebarCollapsed && <FaChevronDown className={`transform transition-transform duration-200 ${openSidebarDropdown === 'users-management' ? 'rotate-180' : ''}`} />}
                    </button>
                    {openSidebarDropdown === 'users-management' && !isSidebarCollapsed && (
                        <div className="ml-6 mt-2 space-y-1">
                            <button
                                onClick={() => setActiveTab("users")}
                                className={`w-full text-left px-3 py-2 rounded-l-full rounded-r-lg text-sm transition-colors duration-200 pl-6
                                ${activeTab === 'users' ? 'text-[#005524] font-medium bg-[#E7F6EE]' : 'text-gray-600 hover:text-[#005524] hover:bg-[#F1FAF4]'}`}
                            >
                                View Full User Table
                            </button>
                            <button
                                onClick={() => setActiveTab("total-users-list")}
                                className={`w-full text-left px-3 py-2 rounded-l-full rounded-r-lg text-sm transition-colors duration-200 pl-6
                                ${activeTab === 'total-users-list' ? 'text-[#005524] font-medium bg-[#E7F6EE]' : 'text-gray-600 hover:text-[#005524] hover:bg-[#F1FAF4]'}`}
                            >
                                Total Users List
                            </button>
                            <button
                                onClick={() => setActiveTab("active-users-list")}
                                className={`w-full text-left px-3 py-2 rounded-l-full rounded-r-lg text-sm transition-colors duration-200 pl-6
                                ${activeTab === 'active-users-list' ? 'text-[#005524] font-medium bg-[#E7F6EE]' : 'text-gray-600 hover:text-[#005524] hover:bg-[#F1FAF4]'}`}
                            >
                                Active Users List
                            </button>
                        </div>
                    )}

                    <button
                        onClick={() => setActiveTab("incidents")}
                        className={`relative flex items-center gap-3 px-4 py-3 rounded-r-full transition-all duration-200 text-sm font-medium group
                        ${activeTab === "incidents" ? 'bg-[#E7F6EE] text-[#005524]' : 'text-gray-700 hover:bg-[#F1FAF4] hover:text-[#005524]'}
                        `}
                    >
                        <span className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-r-full transition-all duration-200 ${activeTab === 'incidents' ? 'bg-[#005524]' : 'bg-transparent group-hover:bg-[#CDE6D3]'}`} />
                        <div className="relative flex items-center gap-3 z-10">
                            <FaBell size={18} />
                            {!isSidebarCollapsed && 'Incident Reports'}
                        </div>
                    </button>

                    <button
                        onClick={() => setActiveTab("safety-tips")}
                        className={`relative flex items-center gap-3 px-4 py-3 rounded-r-full transition-all duration-200 text-sm font-medium group
                        ${activeTab === "safety-tips" ? 'bg-[#E7F6EE] text-[#005524]' : 'text-gray-700 hover:bg-[#F1FAF4] hover:text-[#005524]'}
                        `}
                    >
                        <span className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-r-full transition-all duration-200 ${activeTab === 'safety-tips' ? 'bg-[#005524]' : 'bg-transparent group-hover:bg-[#CDE6D3]'}`} />
                        <div className="relative flex items-center gap-3 z-10">
                            <FaFileAlt size={18} />
                            {!isSidebarCollapsed && 'Safety Tips'}
                        </div>
                    </button>

                    <button
                        onClick={() => setActiveTab("settings")}
                        className={`relative flex items-center gap-3 px-4 py-3 rounded-r-full transition-all duration-200 text-sm font-medium group
                        ${activeTab === 'settings' ? 'bg-[#E7F6EE] text-[#005524]' : 'text-gray-700 hover:bg-[#F1FAF4] hover:text-[#005524]'}
                        `}
                    >
                        <span className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-r-full transition-all duration-200 ${activeTab === 'settings' ? 'bg-[#005524]' : 'bg-transparent group-hover:bg-[#CDE6D3]'}`} />
                        <div className="relative flex items-center gap-3 z-10">
                            <FaCog size={18} />
                            {!isSidebarCollapsed && 'Settings'}
                        </div>
                    </button>
                </nav>

                <div className="p-4 border-t border-gray-100">
                    <button
                        onClick={() => setShowLogoutConfirm(true)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-all duration-200 group"
                    >
                        <FaLock size={18} />
                        {!isSidebarCollapsed && 'Logout'}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
                {/* Top Navigation Bar */}
                <header className="sticky top-0 z-20 bg-white border-b border-gray-200 flex items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="md:hidden text-gray-400 hover:text-gray-600 transition-colors">
                            <FaChevronRight size={16} />
                        </button>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span>Dashboard</span>
                            <FaChevronRight size={12} />
                            <span className="text-gray-900 font-medium">
                                {activeTab === 'users' && 'User Management'}
                                {activeTab === 'incidents' && 'Incident Reports'}
                                {activeTab === 'safety-tips' && 'Safety Tips'}
                                {activeTab === 'settings' && 'Settings'}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Notifications */}
                        <div className="relative">
                            <button
                                onClick={() => setShowNotifications((prev) => !prev)}
                                className="text-gray-400 hover:text-gray-600 transition-colors relative"
                            >
                                <FaBell size={18} />
                                {notificationsList.length > 0 && (
                                    <span className="absolute -top-1 -right-1 block h-2 w-2 rounded-full bg-red-500"></span>
                                )}
                            </button>
                            {showNotifications && (
                                <div className="absolute right-0 mt-3 w-80 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                                    <div className="px-4 py-3 border-b border-gray-100">
                                        <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                                    </div>
                                    <div className="max-h-96 overflow-y-auto">
                                        {notificationsList.length > 0 ? (
                                            notificationsList.map((notification) => (
                                                <div
                                                    key={notification.id}
                                                    className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                                                >
                                                    <p className="text-sm text-gray-800">{notification.message}</p>
                                                    <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="px-4 py-3 text-center text-gray-500">
                                                No new notifications
                                            </div>
                                        )}
                                    </div>
                                    {notificationsList.length > 0 && (
                                        <div className="px-4 py-2 border-t border-gray-100">
                                            <button
                                                onClick={() => {
                                                    setNotificationsList([]);
                                                    setShowNotifications(false);
                                                }}
                                                className="text-sm text-blue-600 hover:text-blue-700 w-full text-center"
                                            >
                                                Clear all notifications
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Profile */}
                        <div className="relative">
                            <button
                                onClick={() => setShowProfileSettings(true)}
                                className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none"
                            >
                                <img
                                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=005524&color=fff`}
                                    alt="avatar"
                                    className="w-8 h-8 rounded-full border border-gray-200"
                                />
                                <span className="hidden md:inline text-gray-700 font-medium">{currentUser.name}</span>
                            </button>
                        </div>
                    </div>
                </header>

                {/* Main Content Area */}
                <main className="flex-1 p-6 bg-gray-50">
                    <div className="max-w-7xl mx-auto">
                        {renderContent()}
                    </div>
                </main>
            </div>

            {/* Incident Details Modal */}
            {showIncidentDetails && selectedIncident && (
                <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-2xl font-bold text-[#005524] mb-4">Incident Details</h2>
                        <div className="space-y-4">
                            <div>
                                <h3 className="font-semibold text-gray-700">Title</h3>
                                <p className="text-gray-600">{selectedIncident.title}</p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-700">Description</h3>
                                <p className="text-gray-600">{selectedIncident.description}</p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-700">Location</h3>
                                <p className="text-gray-600">{selectedIncident.location}</p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-700">Severity</h3>
                                <p className="text-gray-600">{selectedIncident.severity}</p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-700">Reported By</h3>
                                <p className="text-gray-600">{selectedIncident.reportedBy}</p>
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end space-x-4">
                            {selectedIncident.severity === 'critical' && (
                                <button
                                    onClick={() => handleIncidentAction(selectedIncident.id, 'escalate')}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                >
                                    Escalate to Authorities
                                </button>
                            )}
                            <button
                                onClick={() => handleIncidentAction(selectedIncident.id, 'resolve')}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                            >
                                Mark as Resolved
                            </button>
                            <button
                                onClick={() => setShowIncidentDetails(false)}
                                className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Safety Tip Modal */}
            {showSafetyTipModal && (
                <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-2xl font-bold text-[#005524] mb-4">Add Safety Tip</h2>
                        <form onSubmit={handleAddSafetyTip} className="space-y-4">
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2">Title</label>
                                <input
                                    type="text"
                                    value={newSafetyTip.title}
                                    onChange={(e) => setNewSafetyTip({ ...newSafetyTip, title: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#005524]"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2">Content</label>
                                <textarea
                                    value={newSafetyTip.content}
                                    onChange={(e) => setNewSafetyTip({ ...newSafetyTip, content: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#005524]"
                                    rows={4}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2">Category</label>
                                <select
                                    value={newSafetyTip.category}
                                    onChange={(e) => setNewSafetyTip({ ...newSafetyTip, category: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#005524]"
                                    required
                                >
                                    <option value="accident">Accident</option>
                                    <option value="emergency">Emergency</option>
                                    <option value="prevention">Prevention</option>
                                    <option value="general-assistance">General Assistance</option>
                                </select>
                            </div>
                            <div className="flex justify-end space-x-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowSafetyTipModal(false);
                                        setNewSafetyTip({ title: '', content: '', category: 'general' });
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
                        <h2 className="text-2xl font-bold text-[#005524] mb-4">Safety Tip Details</h2>
                        <div className="space-y-4">
                            <div>
                                <h3 className="font-semibold text-gray-700">Title</h3>
                                <p className="text-gray-600">{selectedSafetyTip.title}</p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-700">Content</h3>
                                <p className="text-gray-600">{selectedSafetyTip.content}</p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-700">Category</h3>
                                <p className="text-gray-600">{selectedSafetyTip.category}</p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-700">Status</h3>
                                <p className="text-gray-600">{selectedSafetyTip.status}</p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-700">Date</h3>
                                <p className="text-gray-600">{selectedSafetyTip.date}</p>
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end space-x-4">
                            {selectedSafetyTip.status === 'draft' && (
                                <button
                                    onClick={() => {
                                        handleSafetyTipAction(selectedSafetyTip.id, 'publish');
                                        setShowSafetyTipDetails(false);
                                    }}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                >
                                    Publish
                                </button>
                            )}
                            {selectedSafetyTip.status === 'published' && (
                                <button
                                    onClick={() => handleSafetyTipAction(selectedSafetyTip.id, 'archive')}
                                    className="text-gray-600 hover:text-gray-800"
                                >
                                    Archive
                                </button>
                            )}
                            {selectedSafetyTip.status === 'archived' && (
                                <button
                                    onClick={() => handleSafetyTipAction(selectedSafetyTip.id, 'unarchive')}
                                    className="text-blue-600 hover:text-blue-800"
                                >
                                    Unarchive
                                </button>
                            )}
                            <button
                                onClick={() => setShowSafetyTipDetails(false)}
                                className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Logout Confirmation Modal */}
            {showLogoutConfirm && (
                <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg border border-gray-200">
                        <h2 className="text-2xl font-bold text-[#005524] mb-4">Confirm Logout</h2>
                        <p className="text-gray-600 mb-6">Are you sure you want to logout?</p>
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
                        <h2 className="text-2xl font-bold text-[#005524] mb-4">User Details</h2>
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
                            <div>
                                <h3 className="font-semibold text-gray-700">Status</h3>
                                <p className="text-gray-600">{selectedUser.status}</p>
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
                                className={`px-4 py-2 rounded-lg ${selectedUser.status === 'active'
                                    ? 'bg-red-600 text-white hover:bg-red-700'
                                    : 'bg-green-600 text-white hover:bg-green-700'
                                    }`}
                            >
                                {selectedUser.status === 'active' ? 'Deactivate User' : 'Activate User'}
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