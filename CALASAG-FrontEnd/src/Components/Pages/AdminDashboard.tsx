import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUserCircle, FaBell, FaMoon, FaSun, FaSearch, FaChevronDown, FaChevronLeft, FaChevronRight, FaTable, FaChartBar, FaKey, FaCalendarAlt, FaFileAlt, FaCubes, FaLock, FaUser, FaHome, FaCog } from 'react-icons/fa';
import logoImage from "../Images/no-bg-logo.png";

// Import Chart.js components
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title as ChartTitle } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, ChartTitle);

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

    // State to manage dropdown open/close in sidebar
    const [openSidebarDropdown, setOpenSidebarDropdown] = useState<string | null>(null);

    // Settings-related states
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
                    backgroundColor: ['#005524', '#f69f00'], // CALASAG green and orange
                    borderColor: ['#ffffff', '#ffffff'],
                    borderWidth: 1,
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
                    backgroundColor: ['#34d399', '#fbc02d', '#f56565', '#c53030'], // Example colors: green, yellow, red-orange, darker red
                    borderColor: ['#ffffff', '#ffffff', '#ffffff', '#ffffff'],
                    borderWidth: 1,
                },
            ],
        };

        const chartOptions = {
            responsive: true,
            maintainAspectRatio: false, // Allow charts to resize freely
            plugins: {
                legend: {
                    position: 'bottom' as const,
                },
                title: {
                    display: false,
                    text: 'Chart Title',
                },
            },
        };

        switch (activeTab) {
            case "dashboard":
                return (
                    <div className="p-4">
                        {/* Top Metric Cards */}
                        <div className="grid grid-cols-1 gap-6 mb-6 md:grid-cols-2 lg:grid-cols-3">
                            {/* Total Users Metric Card */}
                            <div className="bg-[#f8eed4] p-4 rounded-lg shadow-md flex items-center">
                                <div className="flex-shrink-0 bg-[#005524] text-white p-3 rounded-md mr-4">
                                    <FaUser size={24} />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Total Users</p>
                                    <p className="text-2xl font-bold text-gray-900">{users.length}</p>
                                </div>
                            </div>

                            {/* Active Users Metric Card */}
                            <div className="bg-[#f8eed4] p-4 rounded-lg shadow-md flex items-center">
                                <div className="flex-shrink-0 bg-[#f69f00] text-white p-3 rounded-md mr-4">
                                    <FaUser size={24} />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Active Users</p>
                                    <p className="text-2xl font-bold text-gray-900">{users.filter(u => u.status === 'active').length}</p>
                                </div>
                            </div>

                            {/* Critical Incidents Metric Card */}
                            <div className="bg-[#f8eed4] p-4 rounded-lg shadow-md flex items-center">
                                <div className="flex-shrink-0 bg-red-600 text-white p-3 rounded-md mr-4">
                                    <FaBell size={24} />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Critical Incidents</p>
                                    <p className="text-2xl font-bold text-gray-900">{incidents.filter(i => i.severity === 'critical').length}</p>
                                </div>
                            </div>
                        </div>

                        {/* Charts Section */}
                        <div className="grid grid-cols-1 gap-6 mb-6 md:grid-cols-2">
                            {/* User Status Distribution Chart */}
                            <div className="bg-[#f8eed4] p-6 rounded-lg shadow-md">
                                <h3 className="text-lg font-semibold text-[#005524] mb-4">User Status Distribution</h3>
                                <div style={{ height: '300px' }}>
                                    <Pie data={userStatusData} options={chartOptions} />
                                </div>
                            </div>

                            {/* Incident Severity Chart */}
                            <div className="bg-[#f8eed4] p-6 rounded-lg shadow-md">
                                <h3 className="text-lg font-semibold text-[#005524] mb-4">Incident Severity Breakdown</h3>
                                <div style={{ height: '300px' }}>
                                    <Bar data={incidentSeverityData} options={chartOptions} />
                                </div>
                            </div>
                        </div>

                        {/* Recent Activity Section */}
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <h2 className="text-xl font-semibold text-[#005524] mb-4">Recent Activity</h2>
                            <div className="space-y-4">
                                {incidents.slice(0, 3).map((incident) => (
                                    <div key={incident.id} className="flex items-center space-x-4 p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
                                        onClick={() => {
                                            setSelectedIncident(incident);
                                            setShowIncidentDetails(true);
                                        }}>
                                        <div className="flex-1">
                                            <h3 className="font-medium">{incident.title}</h3>
                                            <p className="text-sm text-gray-500">{incident.location} • {incident.date}</p>
                                        </div>
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${incident.severity === 'critical' ? 'text-red-800' :
                                            incident.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                                                'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {incident.severity}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );

            case "users": // Original case for the full user table
                return (
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-semibold text-[#005524]">All Users (Table View)</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead>
                                    <tr className="bg-gray-50">
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Login</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reports</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {users.map((user) => (
                                        <tr key={user.id}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="w-12 h-12 flex items-center justify-center text-white font-bold bg-[#f9a01b] text-xl"
                                                        style={{ width: '48px', height: '48px', borderRadius: '50%' }}
                                                    >
                                                        {user.name.charAt(0)}
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${user.status === 'active' ? 'text-green-800' : 'text-red-800'
                                                    }`}>
                                                    {user.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.lastLogin}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.reports}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                                <button
                                                    onClick={() => handleToggleUserStatus(user.id)}
                                                    className={`${user.status === 'active'
                                                        ? 'text-red-600 hover:text-red-900'
                                                        : 'text-green-600 hover:text-green-900'
                                                        }`}
                                                >
                                                    {user.status === 'active' ? 'Deactivate' : 'Activate'}
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setSelectedUser(user);
                                                        setShowUserDetails(true);
                                                    }}
                                                    className="text-[#f69f00] hover:text-[#be4c1d]"
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
                    <>
                        <h2 className="text-xl font-semibold text-[#005524] mb-4">All Users</h2>
                        <div className="space-y-4">
                            {users.map((user, index) => (
                                <div key={user.id} className={`flex items-center space-x-4 p-3 hover:bg-gray-50 rounded-lg ${index < users.length - 1 ? 'border-b border-gray-200 pb-4' : ''}`}>
                                    <div className="w-10 h-10 rounded-full bg-[#f9a01b] flex items-center justify-center text-white font-bold">
                                        {user.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="font-medium">{user.name}</h3>
                                        <p className="text-sm text-gray-500">{user.email} • Status: {user.status} • Last Login: {user.lastLogin}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                );

            case "active-users-list": // Case for displaying only active users as a list
                return (
                    <>
                        <h2 className="text-xl font-semibold text-[#005524] mb-4">Active Users</h2>
                        <div className="space-y-4">
                            {users.filter(user => user.status === 'active').map((user, index, arr) => (
                                <div key={user.id} className={`flex items-center space-x-4 p-3 hover:bg-gray-50 rounded-lg ${index < arr.length - 1 ? 'border-b border-gray-200 pb-4' : ''}`}>
                                    <div className="w-10 h-10 rounded-full bg-[#f9a01b] flex items-center justify-center text-white font-bold">
                                        {user.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="font-medium">{user.name}</h3>
                                        <p className="text-sm text-gray-500">{user.email} • Last Login: {user.lastLogin}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                );

            case "incidents":
                return (
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead>
                                    <tr className="bg-gray-50">
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Severity</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {incidents.map((incident) => (
                                        <tr key={incident.id}>
                                            <td className="px-6 py-4 whitespace-nowrap">{incident.title}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${incident.severity === 'critical' ? 'text-red-800' :
                                                    incident.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                                                        incident.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-green-100 text-green-800'
                                                    }`}>
                                                    {incident.severity}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">{incident.status}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{incident.date}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <button
                                                    onClick={() => {
                                                        setSelectedIncident(incident);
                                                        setShowIncidentDetails(true);
                                                    }}
                                                    className="text-[#f69f00] hover:text-[#be4c1d]"
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
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex justify-end mb-6">
                            <button
                                onClick={() => setShowSafetyTipModal(true)}
                                className="bg-[#005524] text-white px-4 py-2 rounded-lg hover:bg-[#004015]"
                            >
                                Add New Tip
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead>
                                    <tr className="bg-gray-50">
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {safetyTips.map((tip) => (
                                        <tr key={tip.id}>
                                            <td className="px-6 py-4 whitespace-nowrap">{tip.title}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${tip.category === 'emergency' ? 'text-red-800' :
                                                    tip.category === 'prevention' ? 'text-[#f69f00]' :
                                                        'bg-green-100 text-green-800'
                                                    }`}>
                                                    {tip.category}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${tip.status === 'published' ? 'text-green-800' :
                                                    tip.status === 'draft' ? 'text-yellow-800' :
                                                        'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {tip.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">{tip.date}</td>
                                            <td className="px-6 py-4 whitespace-nowrap space-x-2">
                                                <button
                                                    onClick={() => {
                                                        setSelectedSafetyTip(tip);
                                                        setShowSafetyTipDetails(true);
                                                    }}
                                                    className="text-[#f69f00] hover:text-[#be4c1d]"
                                                >
                                                    View
                                                </button>
                                                {tip.status === 'draft' && (
                                                    <button
                                                        onClick={() => handleSafetyTipAction(tip.id, 'publish')}
                                                        className="text-green-600 hover:text-green-800"
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
                        {/* Personal Information Section */}
                        <div className="border-b border-gray-200 pb-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-[#005524]">Personal Information</h3>
                                {!isEditingPersonal ? (
                                    <button
                                        onClick={() => setIsEditingPersonal(true)}
                                        className="px-4 py-2 bg-[#005524] text-white rounded-lg hover:bg-opacity-90 transition-colors"
                                    >
                                        Edit
                                    </button>
                                ) : (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setIsEditingPersonal(false)}
                                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={() => setIsEditingPersonal(false)}
                                            className="px-4 py-2 bg-[#005524] text-white rounded-lg hover:bg-opacity-90 transition-colors"
                                        >
                                            Save
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                    <input
                                        type="text"
                                        value={personalInfo.name}
                                        disabled={!isEditingPersonal}
                                        onChange={e => setPersonalInfo({ ...personalInfo, name: e.target.value })}
                                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#005524] focus:border-transparent ${!isEditingPersonal ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={personalInfo.email}
                                        disabled={!isEditingPersonal}
                                        onChange={e => setPersonalInfo({ ...personalInfo, email: e.target.value })}
                                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#005524] focus:border-transparent ${!isEditingPersonal ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Security Section */}
                        <div className="border-b border-gray-200 pb-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-[#005524]">Security</h3>
                                {!isEditingSecurity ? (
                                    <button
                                        onClick={() => setIsEditingSecurity(true)}
                                        className="px-4 py-2 bg-[#005524] text-white rounded-lg hover:bg-opacity-90 transition-colors"
                                    >
                                        Edit
                                    </button>
                                ) : (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setIsEditingSecurity(false)}
                                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={() => setIsEditingSecurity(false)}
                                            className="px-4 py-2 bg-[#005524] text-white rounded-lg hover:bg-opacity-90 transition-colors"
                                        >
                                            Save
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                                    <input
                                        type="password"
                                        value={securityInfo.currentPassword}
                                        disabled={!isEditingSecurity}
                                        onChange={e => setSecurityInfo({ ...securityInfo, currentPassword: e.target.value })}
                                        placeholder="Enter current password"
                                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#005524] focus:border-transparent ${!isEditingSecurity ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                                    <input
                                        type="password"
                                        value={securityInfo.newPassword}
                                        disabled={!isEditingSecurity}
                                        onChange={e => setSecurityInfo({ ...securityInfo, newPassword: e.target.value })}
                                        placeholder="Enter new password"
                                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#005524] focus:border-transparent ${!isEditingSecurity ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                                    <input
                                        type="password"
                                        value={securityInfo.confirmPassword}
                                        disabled={!isEditingSecurity}
                                        onChange={e => setSecurityInfo({ ...securityInfo, confirmPassword: e.target.value })}
                                        placeholder="Confirm new password"
                                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#005524] focus:border-transparent ${!isEditingSecurity ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* General Settings Section */}
                        <div>
                            <h3 className="text-lg font-semibold text-[#005524] mb-4">General Settings</h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-700">Notifications</h4>
                                        <p className="text-sm text-gray-500">Enable/disable notifications</p>
                                    </div>
                                    <button
                                        onClick={() => setNotifications(!notifications)}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${notifications ? 'bg-[#005524]' : 'bg-gray-200'}`}
                                    >
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${notifications ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-700">Email Notifications</h4>
                                        <p className="text-sm text-gray-500">Receive email notifications for updates</p>
                                    </div>
                                    <button
                                        onClick={() => setEmailNotifications(!emailNotifications)}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${emailNotifications ? 'bg-[#005524]' : 'bg-gray-200'}`}
                                    >
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${emailNotifications ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Save Button */}
                        <div className="flex justify-end">
                            <button
                                className="px-4 py-2 bg-[#005524] text-white rounded-lg hover:bg-opacity-90 transition-colors"
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
            <aside className={`transition-all duration-300 ${isSidebarCollapsed ? 'w-20' : 'w-64'} bg-[#fff] border-r border-gray-200 min-h-screen flex flex-col shadow-lg z-30 fixed inset-y-0 left-0`}>
                <div className="flex items-center justify-between px-5 py-5.5 border-b border-gray-100">
                    <div className="flex items-center gap-1">
                        <img src={logoImage} alt="CALASAG Logo" className="h-7 w-auto object-contain" />
                        {!isSidebarCollapsed && (
                            <span className="text-lg font-bold text-[#005524] ml-1">CALASAG</span>
                        )}
                    </div>
                    <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="text-gray-400 hover:text-[#005524]">
                        {isSidebarCollapsed ? <FaChevronRight size={16} /> : <FaChevronLeft size={16} />}
                    </button>
                </div>

                <nav className="flex-1 flex flex-col gap-2 p-4">
                    <button
                        onClick={() => setActiveTab("dashboard")}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-base font-medium 
                        ${activeTab === "dashboard"
                                ? 'bg-white text-[#005524] shadow-sm border border-gray-100'
                                : 'text-gray-700 hover:bg-white hover:text-[#005524] hover:shadow-sm hover:translate-x-1'}`}
                    >
                        <FaHome size={20} /> {!isSidebarCollapsed && 'Dashboard'}
                    </button>

                    {/* Users Management Dropdown */}
                    <div className="">
                        <button
                            onClick={() => {
                                if (isSidebarCollapsed) {
                                    // Optionally, open the dropdown after expanding
                                    setOpenSidebarDropdown('users-management');
                                } else {
                                    setOpenSidebarDropdown(openSidebarDropdown === 'users-management' ? null : 'users-management');
                                }
                            }}
                            className={`flex items-center w-full gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-base font-medium whitespace-nowrap
                            ${activeTab === "users" ? 'bg-white text-[#005524] shadow-sm border border-gray-100' : 'text-gray-700 hover:bg-white hover:text-[#005524] hover:shadow-sm hover:translate-x-1'}
                            ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}
                            `}
                        >
                            <div className="flex items-center gap-3">
                                <FaUser size={20} /> {!isSidebarCollapsed && 'Users Management'}
                            </div>
                            {!isSidebarCollapsed && <FaChevronDown className={`transform transition-transform ${openSidebarDropdown === 'users-management' ? 'rotate-180' : ''}`} />}
                        </button>
                        {openSidebarDropdown === 'users-management' && !isSidebarCollapsed && (
                            <div className="ml-6 mt-2 space-y-2 border-l border-gray-200 pl-4">
                                <button
                                    onClick={() => setActiveTab("users")}
                                    className={`w-full text-left px-2 py-1 rounded-lg text-sm transition-colors duration-200
                                    ${activeTab === 'users' ? 'text-[#005524] font-semibold' : 'text-gray-700 hover:text-[#005524]'}`}
                                >
                                    View Full User Table
                                </button>
                                <button
                                    onClick={() => setActiveTab("total-users-list")}
                                    className={`w-full text-left px-2 py-1 rounded-lg text-sm transition-colors duration-200
                                    ${activeTab === 'total-users-list' ? 'text-[#005524] font-semibold' : 'text-gray-700 hover:text-[#005524]'}`}
                                >
                                    Total Users List
                                </button>
                                <button
                                    onClick={() => setActiveTab("active-users-list")}
                                    className={`w-full text-left px-2 py-1 rounded-lg text-sm transition-colors duration-200
                                    ${activeTab === 'active-users-list' ? 'text-[#005524] font-semibold' : 'text-gray-700 hover:text-[#005524]'}`}
                                >
                                    Active Users List
                                </button>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => setActiveTab("incidents")}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-base font-medium 
                        ${activeTab === "incidents"
                                ? 'bg-white text-[#005524] shadow-sm border border-gray-100'
                                : 'text-gray-700 hover:bg-white hover:text-[#005524] hover:shadow-sm hover:translate-x-1'}`}
                    >
                        <FaBell size={20} /> {!isSidebarCollapsed && 'Incident Reports'}
                    </button>
                    <button
                        onClick={() => setActiveTab("safety-tips")}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-base font-medium 
                        ${activeTab === "safety-tips"
                                ? 'bg-white text-[#005524] shadow-sm border border-gray-100'
                                : 'text-gray-700 hover:bg-white hover:text-[#005524] hover:shadow-sm hover:translate-x-1'}`}
                    >
                        <FaFileAlt size={20} /> {!isSidebarCollapsed && 'Safety Tips'}
                    </button>

                </nav>

                <div className="p-4 border-t border-gray-100">
                    <button
                        onClick={() => setActiveTab("settings")}
                        className="w-full flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-white hover:text-[#005524] hover:shadow-sm hover:translate-x-1 rounded-lg transition-all duration-200 mb-2"
                    >
                        <FaCog size={20} /> {!isSidebarCollapsed && 'Settings'}
                    </button>
                    <button
                        onClick={() => setShowLogoutConfirm(true)}
                        className="w-full flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-white hover:text-[#005524] hover:shadow-sm hover:translate-x-1 rounded-lg transition-all duration-200"
                    >
                        <FaLock size={20} /> {!isSidebarCollapsed && 'Logout'}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
                {/* Top Navigation Bar */}
                <header className="sticky top-0 z-20 bg-white border-b border-gray-200 flex items-center justify-between px-6 py-3 shadow-sm">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="md:hidden text-gray-400 hover:text-[#005524]">
                            <FaChevronRight size={16} />
                        </button>
                        <h1 className="text-xl font-semibold text-[#005524]">
                            {activeTab === 'dashboard' && 'Dashboard'}
                            {activeTab === 'incidents' && 'Incident Reports'}
                            {activeTab === 'safety-tips' && 'Safety Tips'}
                            {activeTab === 'settings' && 'Settings'}
                        </h1>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <button
                                onClick={() => setShowNotifications((prev) => !prev)}
                                className="text-gray-400 hover:text-[#005524] transition-colors duration-200 text-xl relative"
                            >
                                <FaBell size={20} />
                                {notificationsList.length > 0 && (
                                    <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
                                )}
                            </button>
                            {showNotifications && (
                                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                                    <div className="px-4 py-2 border-b border-gray-200">
                                        <h3 className="text-lg font-semibold text-[#005524]">Notifications</h3>
                                    </div>
                                    <div className="max-h-96 overflow-y-auto">
                                        {notificationsList.length > 0 ? (
                                            notificationsList.map((notification) => (
                                                <div
                                                    key={notification.id}
                                                    className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
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
                                        <div className="px-4 py-2 border-t border-gray-200">
                                            <button
                                                onClick={() => {
                                                    // Clear notifications logic here
                                                    setNotificationsList([]);
                                                    setShowNotifications(false);
                                                }}
                                                className="text-sm text-[#005524] hover:text-[#004015] w-full text-center"
                                            >
                                                Clear all notifications
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="relative">
                            <button
                                onClick={() => setShowProfileSettings(true)}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white hover:shadow-sm transition-all duration-200 focus:outline-none"
                            >
                                <img
                                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}`}
                                    alt="avatar"
                                    className="w-8 h-8 rounded-full border-2 border-gray-200"
                                />
                                <span className="hidden md:inline text-gray-700 font-medium">{currentUser.name}</span>
                            </button>
                        </div>
                    </div>
                </header>

                {/* Main Content Area */}
                <main className="flex-1 p-6 md:p-8 bg-gray-50">
                    <div className="max-w-[1600px] mx-auto">
                        {/* Card-like container for main content */}
                        <div className="bg-white rounded-xl shadow-sm p-6 md:p-8">
                            {renderContent()}
                        </div>
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