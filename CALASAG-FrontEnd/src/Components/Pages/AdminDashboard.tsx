import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

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

interface GeofenceAlert {
    id: number;
    location: string;
    type: 'entry' | 'exit' | 'violation';
    severity: 'low' | 'medium' | 'high';
    status: 'active' | 'resolved';
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
    const [activeTab, setActiveTab] = useState<string>("dashboard");
    const [showLogoutConfirm, setShowLogoutConfirm] = useState<boolean>(false);
    const [showIncidentDetails, setShowIncidentDetails] = useState<boolean>(false);
    const [selectedIncident, setSelectedIncident] = useState<IncidentReport | null>(null);
    const [showSafetyTipModal, setShowSafetyTipModal] = useState<boolean>(false);
    const [showGeofenceDetails, setShowGeofenceDetails] = useState<boolean>(false);
    const [selectedGeofence, setSelectedGeofence] = useState<GeofenceAlert | null>(null);
    const [showSafetyTipDetails, setShowSafetyTipDetails] = useState<boolean>(false);
    const [selectedSafetyTip, setSelectedSafetyTip] = useState<SafetyTip | null>(null);
    const [showAddUserModal, setShowAddUserModal] = useState<boolean>(false);
    const [showUserDetails, setShowUserDetails] = useState<boolean>(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [showProfileSettings, setShowProfileSettings] = useState<boolean>(false);

    const [users, setUsers] = useState<User[]>([
        { id: 1, name: "User One", email: "user1@calasag.com", status: "active", lastLogin: "2024-03-20 10:30", reports: 5 },
        { id: 2, name: "User Two", email: "user2@calasag.com", status: "active", lastLogin: "2024-03-19 15:45", reports: 3 },
        { id: 3, name: "User Three", email: "user3@calasag.com", status: "inactive", lastLogin: "2024-03-18 09:15", reports: 0 },
    ]);

    // Add current user state
    const [currentUser] = useState({
        name: "Admin",
        email: "admin@calasag.com",
        role: "Administrator"
    });

    const [incidents, setIncidents] = useState<IncidentReport[]>([
        { id: 1, title: "Suspicious Activity", description: "Unusual behavior observed in parking lot", location: "Main Parking", severity: "high", status: "pending", reportedBy: "User One", date: "2024-03-20" },
        { id: 2, title: "Emergency Response", description: "Medical emergency in Building A", location: "Building A", severity: "critical", status: "reviewing", reportedBy: "User Two", date: "2024-03-20" },
    ]);

    const [safetyTips, setSafetyTips] = useState<SafetyTip[]>([
        { id: 1, title: "Emergency Preparedness", content: "Always keep emergency contacts handy", category: "emergency", status: "published", date: "2024-03-20" },
        { id: 2, title: "Personal Safety", content: "Stay aware of your surroundings", category: "prevention", status: "published", date: "2024-03-19" },
    ]);

    const [geofenceAlerts, setGeofenceAlerts] = useState<GeofenceAlert[]>([
        { id: 1, location: "Restricted Area A", type: "violation", severity: "high", status: "active", date: "2024-03-20" },
        { id: 2, location: "Building B", type: "entry", severity: "low", status: "resolved", date: "2024-03-19" },
    ]);

    const [communityContent, setCommunityContent] = useState<CommunityContent[]>([
        { id: 1, type: "post", content: "Safety concern in Library", author: "User One", status: "pending", date: "2024-03-20" },
        { id: 2, type: "feedback", content: "Great security measures", author: "User Two", status: "approved", date: "2024-03-19" },
    ]);

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

    const handleSafetyTipAction = (tipId: number, action: 'publish' | 'archive') => {
        setSafetyTips(safetyTips.map(tip =>
            tip.id === tipId
                ? { ...tip, status: action === 'publish' ? 'published' : 'archived' }
                : tip
        ));
    };

    const handleGeofenceAction = (alertId: number, action: 'resolve' | 'escalate') => {
        setGeofenceAlerts(geofenceAlerts.map(alert =>
            alert.id === alertId
                ? { ...alert, status: action === 'resolve' ? 'resolved' : 'active' }
                : alert
        ));
    };

    const handleContentModeration = (contentId: number, action: 'approve' | 'reject') => {
        setCommunityContent(communityContent.map(content =>
            content.id === contentId
                ? { ...content, status: action === 'approve' ? 'approved' : 'rejected' }
                : content
        ));
    };

    const renderContent = () => {
        switch (activeTab) {
            case "dashboard":
                return (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {/* Total Users Card */}
                        <div className="bg-[#f8eed4] p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                            onClick={() => setActiveTab("users")}>
                            <h3 className="text-lg font-semibold text-[#005524] mb-2">Total Users</h3>
                            <p className="text-3xl font-bold">{users.length}</p>
                            <p className="text-sm text-gray-500 mt-2">Click to view all users</p>
                        </div>

                        {/* Active Users Card */}
                        <div className="bg-[#f8eed4] p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                            onClick={() => setActiveTab("users")}>
                            <h3 className="text-lg font-semibold text-[#005524] mb-2">Active Users</h3>
                            <p className="text-3xl font-bold">{users.filter(u => u.status === 'active').length}</p>
                            <p className="text-sm text-gray-500 mt-2">Currently active</p>
                        </div>

                        {/* Critical Incidents Card */}
                        <div className="bg-[#f8eed4] p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                            onClick={() => setActiveTab("incidents")}>
                            <h3 className="text-lg font-semibold text-[#005524] mb-2">Critical Incidents</h3>
                            <p className="text-3xl font-bold">{incidents.filter(i => i.severity === 'critical').length}</p>
                            <p className="text-sm text-gray-500 mt-2">Requires immediate attention</p>
                        </div>

                        {/* Active Alerts Card */}
                        <div className="bg-[#f8eed4] p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                            onClick={() => setActiveTab("geofencing")}>
                            <h3 className="text-lg font-semibold text-[#005524] mb-2">Active Alerts</h3>
                            <p className="text-3xl font-bold">{geofenceAlerts.filter(g => g.status === 'active').length}</p>
                            <p className="text-sm text-gray-500 mt-2">Active geofence alerts</p>
                        </div>

                        {/* Recent Activity Section */}
                        <div className="col-span-full bg-[#f8eed4] rounded-lg shadow-md p-6 mt-6">
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
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${incident.severity === 'critical' ? 'bg-red-100 text-red-800' :
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
            case "users":
                return (
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-semibold text-[#005524]">User Management</h2>
                            <button
                                onClick={() => setShowAddUserModal(true)}
                                className="bg-[#005524] text-white px-4 py-2 rounded-lg hover:bg-[#004015]"
                            >
                                Add New User
                            </button>
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
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
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
                                                    className="text-blue-600 hover:text-blue-900"
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
            case "incidents":
                return (
                    <div className="bg-[#f8eed4] rounded-lg shadow-md p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-semibold text-[#005524]">Incident Reports</h2>
                        </div>
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
                                <tbody className="bg-[#f8eed4] divide-y divide-gray-200">
                                    {incidents.map((incident) => (
                                        <tr key={incident.id}>
                                            <td className="px-6 py-4 whitespace-nowrap">{incident.title}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${incident.severity === 'critical' ? 'bg-red-100 text-red-800' :
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
                                                    className="text-blue-600 hover:text-blue-800"
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
                    <div className="bg-[#f8eed4] rounded-lg shadow-md p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-semibold text-[#005524]">Safety Tips</h2>
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
                                <tbody className="bg-[#f8eed4] divide-y divide-gray-200">
                                    {safetyTips.map((tip) => (
                                        <tr key={tip.id}>
                                            <td className="px-6 py-4 whitespace-nowrap">{tip.title}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${tip.category === 'emergency' ? 'bg-red-100 text-red-800' :
                                                    tip.category === 'prevention' ? 'bg-blue-100 text-blue-800' :
                                                        'bg-green-100 text-green-800'
                                                    }`}>
                                                    {tip.category}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${tip.status === 'published' ? 'bg-green-100 text-green-800' :
                                                    tip.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
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
                                                    className="text-blue-600 hover:text-blue-800"
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
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case "geofencing":
                return (
                    <div className="bg-[#f8eed4] rounded-lg shadow-md p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-semibold text-[#005524]">Geofence Alerts</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead>
                                    <tr className="bg-gray-50">
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Severity</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-[#f8eed4] divide-y divide-gray-200">
                                    {geofenceAlerts.map((alert) => (
                                        <tr key={alert.id}>
                                            <td className="px-6 py-4 whitespace-nowrap">{alert.location}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{alert.type}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${alert.severity === 'high' ? 'bg-red-100 text-red-800' :
                                                    alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-green-100 text-green-800'
                                                    }`}>
                                                    {alert.severity}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${alert.status === 'active' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                                    }`}>
                                                    {alert.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">{alert.date}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <button
                                                    onClick={() => {
                                                        setSelectedGeofence(alert);
                                                        setShowGeofenceDetails(true);
                                                    }}
                                                    className="text-blue-600 hover:text-blue-800"
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
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-white flex">
            {/* Sidebar */}
            <div className="bg-[#005524] text-white w-72 min-h-screen flex flex-col shadow-lg">
                <div className="p-6 flex flex-col items-center border-b border-[#333]">
                    {/* Admin Profile Section */}
                    <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#005524] to-[#f8eed4] flex items-center justify-center text-[#232323] text-3xl font-bold mb-3 shadow-lg">
                        {currentUser.name.charAt(0)}
                    </div>
                    <div className="text-center">
                        <h2 className="font-semibold text-lg text-white">{currentUser.name}</h2>
                        <p className="text-sm text-gray-400">{currentUser.email}</p>
                        <p className="text-xs text-[#f9a01b] font-semibold">{currentUser.role}</p>
                    </div>
                </div>
                <nav className="flex-1 flex flex-col gap-2 mt-8 px-4">
                    <button
                        onClick={() => setActiveTab("dashboard")}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-base font-medium ${activeTab === "dashboard" ? 'bg-gradient-to-r from-[#f9a01b] to-[#f8eed4] text-[#232323]' : 'hover:bg-[#f69f00]'}`}
                    >
                        <span className="material-icons"></span> Dashboard
                    </button>
                    <button
                        onClick={() => setActiveTab("incidents")}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-base font-medium ${activeTab === "incidents" ? 'bg-gradient-to-r from-[#f9a01b] to-[#f8eed4] text-[#232323]' : 'hover:bg-[#f69f00]'}`}
                    >
                        <span className="material-icons"></span> Incident Reports
                    </button>
                    <button
                        onClick={() => setActiveTab("safety-tips")}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-base font-medium ${activeTab === "safety-tips" ? 'bg-gradient-to-r from-[#f9a01b] to-[#f8eed4] text-[#232323]' : 'hover:bg-[#f69f00]'}`}
                    >
                        <span className="material-icons"></span> Safety Tips
                    </button>
                    <button
                        onClick={() => setActiveTab("geofencing")}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-base font-medium ${activeTab === "geofencing" ? 'bg-gradient-to-r from-[#f9a01b] to-[#f8eed4] text-[#232323]' : 'hover:bg-[#f69f00]'}`}
                    >
                        <span className="material-icons"></span> Geofence Alerts
                    </button>
                </nav>
                {/* Bottom Buttons */}
                <div className="p-6 border-t border-[#333] mt-auto">
                    <button
                        onClick={() => setShowProfileSettings(true)}
                        className="w-full flex items-center gap-2 px-4 py-2 text-white hover:bg-[#f69f00] rounded-lg transition-colors mb-2"
                    >
                        <span className="material-icons"></span> Profile Settings
                    </button>
                    <button
                        onClick={() => setShowLogoutConfirm(true)}
                        className="w-full flex items-center gap-2 px-4 py-2 text-white hover:bg-[#f69f00] rounded-lg transition-colors"
                    >
                        <span className="material-icons"></span> Logout
                    </button>
                </div>
            </div>
            {/* Main Content */}
            <div className="flex-1 flex flex-col">
                {/* Top Navigation Bar */}
                <div className="bg-[#005524] border-b border-[#333] p-6 flex items-center justify-between shadow-sm">
                    <h1 className="text-2xl font-bold text-[#f9a01b] tracking-wide">Hi, Admin!</h1>
                </div>
                {/* Content Area */}
                <div className="flex-1 p-8">
                    {renderContent()}
                </div>
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

            {/* Geofence Details Modal */}
            {showGeofenceDetails && selectedGeofence && (
                <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-2xl font-bold text-[#005524] mb-4">Geofence Alert Details</h2>
                        <div className="space-y-4">
                            <div>
                                <h3 className="font-semibold text-gray-700">Location</h3>
                                <p className="text-gray-600">{selectedGeofence.location}</p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-700">Type</h3>
                                <p className="text-gray-600">{selectedGeofence.type}</p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-700">Severity</h3>
                                <p className="text-gray-600">{selectedGeofence.severity}</p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-700">Date</h3>
                                <p className="text-gray-600">{selectedGeofence.date}</p>
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end space-x-4">
                            {selectedGeofence.severity === 'high' && (
                                <button
                                    onClick={() => handleGeofenceAction(selectedGeofence.id, 'escalate')}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                >
                                    Escalate
                                </button>
                            )}
                            <button
                                onClick={() => handleGeofenceAction(selectedGeofence.id, 'resolve')}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                            >
                                Resolve
                            </button>
                            <button
                                onClick={() => setShowGeofenceDetails(false)}
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
                        <form className="space-y-4">
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2">Title</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#005524]"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2">Content</label>
                                <textarea
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#005524]"
                                    rows={4}
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2">Category</label>
                                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#005524]">
                                    <option value="general">General</option>
                                    <option value="emergency">Emergency</option>
                                    <option value="prevention">Prevention</option>
                                </select>
                            </div>
                            <div className="flex justify-end space-x-4">
                                <button
                                    type="button"
                                    onClick={() => setShowSafetyTipModal(false)}
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
                                    onClick={() => {
                                        handleSafetyTipAction(selectedSafetyTip.id, 'archive');
                                        setShowSafetyTipDetails(false);
                                    }}
                                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                                >
                                    Archive
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
                    <div className="bg-[#f69f00] rounded-lg p-6 w-full max-w-md">
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

            {/* Add User Modal */}
            {showAddUserModal && (
                <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-2xl font-bold text-[#005524] mb-4">Add New User</h2>
                        <form className="space-y-4">
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2">Name</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#005524]"
                                    placeholder="Enter user's name"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2">Email</label>
                                <input
                                    type="email"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#005524]"
                                    placeholder="Enter user's email"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2">Initial Password</label>
                                <input
                                    type="password"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#005524]"
                                    placeholder="Enter initial password"
                                />
                            </div>
                            <div className="flex justify-end space-x-4">
                                <button
                                    type="button"
                                    onClick={() => setShowAddUserModal(false)}
                                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-[#005524] text-white rounded-lg hover:bg-[#004015]"
                                >
                                    Add User
                                </button>
                            </div>
                        </form>
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

            {/* Profile Settings Modal */}
            {showProfileSettings && (
                <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-2xl font-bold text-[#005524] mb-4">Profile Settings</h2>
                        <form className="space-y-4">
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2">Name</label>
                                <input
                                    type="text"
                                    defaultValue={currentUser.name}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#005524]"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2">Email</label>
                                <input
                                    type="email"
                                    defaultValue={currentUser.email}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#005524]"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2">New Password</label>
                                <input
                                    type="password"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#005524]"
                                    placeholder="Enter new password"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2">Confirm Password</label>
                                <input
                                    type="password"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#005524]"
                                    placeholder="Confirm new password"
                                />
                            </div>
                            <div className="flex justify-end space-x-4">
                                <button
                                    type="button"
                                    onClick={() => setShowProfileSettings(false)}
                                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-[#005524] text-white rounded-lg hover:bg-[#004015]"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard; 