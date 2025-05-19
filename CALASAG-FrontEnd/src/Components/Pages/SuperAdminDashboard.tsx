import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface Admin {
    id: number;
    name: string;
    email: string;
    status: 'active' | 'inactive';
    lastLogin: string;
    permissions: string[];
}

interface SystemStats {
    activeAdmins: number;
    totalIncidents: number;
    responseTime: number;
}

interface FeatureUpdate {
    id: number;
    name: string;
    description: string;
    status: 'pending' | 'approved' | 'rejected';
    date: string;
}

interface Report {
    id: number;
    type: 'incident' | 'geofencing' | 'alert';
    title: string;
    status: 'pending' | 'reviewed' | 'resolved';
    date: string;
    priority: 'high' | 'medium' | 'low';
}

const SuperAdminDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<string>("dashboard");
    const [showLogoutConfirm, setShowLogoutConfirm] = useState<boolean>(false);
    const [showAddAdmin, setShowAddAdmin] = useState<boolean>(false);
    const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
    const [showPermissionsModal, setShowPermissionsModal] = useState<boolean>(false);
    const [showFeatureUpdateModal, setShowFeatureUpdateModal] = useState<boolean>(false);
    const [showReportDetails, setShowReportDetails] = useState<boolean>(false);
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
    const [showProfileSettings, setShowProfileSettings] = useState<boolean>(false);
    const [selectedDashboardCard, setSelectedDashboardCard] = useState<null | 'admins' | 'incidents' | 'responseTime'>(null);

    // Get current user from localStorage
    const currentUser = JSON.parse(localStorage.getItem('user') || '{"name": "Super Admin", "email": "superadmin@calasag.com", "role": "Super Administrator"}');

    const [systemStats] = useState<SystemStats>({
        activeAdmins: 3,
        totalIncidents: 25,
        responseTime: 120
    });

    const [featureUpdates] = useState<FeatureUpdate[]>([
        { id: 1, name: "New Alert System", description: "Implementation of real-time alert system", status: 'pending', date: "2024-03-20" },
        { id: 2, name: "UI Enhancement", description: "Dashboard redesign for better UX", status: 'approved', date: "2024-03-19" },
        { id: 3, name: "Security Update", description: "Critical security patches", status: 'pending', date: "2024-03-18" }
    ]);

    const [reports] = useState<Report[]>([
        { id: 1, type: 'incident', title: "System Outage Report", status: 'pending', date: "2024-03-20", priority: 'high' },
        { id: 2, type: 'geofencing', title: "Zone Violation Report", status: 'reviewed', date: "2024-03-19", priority: 'medium' },
        { id: 3, type: 'alert', title: "Security Alert Report", status: 'resolved', date: "2024-03-18", priority: 'low' }
    ]);

    const [admins, setAdmins] = useState<Admin[]>([
        { id: 1, name: "Admin One", email: "admin1@calasag.com", status: "active", lastLogin: "2024-03-20 10:30", permissions: ['user_management', 'report_view'] },
        { id: 2, name: "Admin Two", email: "admin2@calasag.com", status: "active", lastLogin: "2024-03-19 15:45", permissions: ['user_management'] },
        { id: 3, name: "Admin Three", email: "admin3@calasag.com", status: "inactive", lastLogin: "2024-03-18 09:15", permissions: ['report_view'] },
    ]);

    const handleLogout = () => {
        localStorage.removeItem('userRole');
        navigate('/login');
    };

    const handleAddAdmin = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setShowAddAdmin(false);
    };

    const handleToggleAdminStatus = (adminId: number) => {
        setAdmins(admins.map(admin =>
            admin.id === adminId
                ? { ...admin, status: admin.status === 'active' ? 'inactive' : 'active' }
                : admin
        ));
    };

    const handleUpdatePermissions = (adminId: number, permissions: string[]) => {
        setAdmins(admins.map(admin =>
            admin.id === adminId
                ? { ...admin, permissions }
                : admin
        ));
        setShowPermissionsModal(false);
    };

    const handleFeatureUpdate = (updateId: number, status: 'approved' | 'rejected') => {
        // Here you would typically make an API call to update the feature status
        console.log(`Feature update ${updateId} ${status}`);
        setShowFeatureUpdateModal(false);
    };

    const handleReportAction = (reportId: number, action: 'review' | 'resolve') => {
        // Here you would typically make an API call to update the report status
        console.log(`Report ${reportId} ${action}`);
        setShowReportDetails(false);
    };

    const renderContent = () => {
        switch (activeTab) {
            case "dashboard":
                return (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                            <div
                                className="bg-[#f8eed4] p-6 rounded-2xl shadow-lg flex flex-col items-start gap-2 cursor-pointer hover:scale-[1.03] hover:shadow-xl transition-transform"
                                onClick={() => setActiveTab('admin-management')}
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="material-icons text-[#005524] text-3xl"></span>
                                    <h3 className="text-lg font-semibold text-[#005524]">Active Admins</h3>
                                </div>
                                <p className="text-4xl font-bold text-[#232323]">{admins.filter(a => a.status === 'active').length}</p>
                            </div>
                            <div
                                className="bg-[#f8eed4] p-6 rounded-2xl shadow-lg flex flex-col items-start gap-2 cursor-pointer hover:scale-[1.03] hover:shadow-xl transition-transform"
                                onClick={() => setSelectedDashboardCard('incidents')}
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="material-icons text-[#f9a01b] text-3xl"></span>
                                    <h3 className="text-lg font-semibold text-[#f9a01b]">Total Incidents</h3>
                                </div>
                                <p className="text-4xl font-bold text-[#232323]">{systemStats.totalIncidents}</p>
                            </div>
                            <div
                                className="bg-[#f8eed4] p-6 rounded-2xl shadow-lg flex flex-col items-start gap-2 cursor-pointer hover:scale-[1.03] hover:shadow-xl transition-transform"
                                onClick={() => setSelectedDashboardCard('responseTime')}
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="material-icons text-[#be4c1d] text-3xl"></span>
                                    <h3 className="text-lg font-semibold text-[#be4c1d]">Response Time</h3>
                                </div>
                                <p className="text-4xl font-bold text-[#232323]">{systemStats.responseTime}ms</p>
                            </div>
                        </div>
                        {/* Dashboard Card Modal */}
                        {selectedDashboardCard && selectedDashboardCard !== 'admins' && (
                            <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50">
                                <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
                                    <div className="flex justify-between items-center mb-4">
                                        <h2 className="text-2xl font-bold text-[#005524]">
                                            {selectedDashboardCard === 'incidents' && 'Total Incidents'}
                                            {selectedDashboardCard === 'responseTime' && 'Response Time'}
                                        </h2>
                                        <button
                                            onClick={() => setSelectedDashboardCard(null)}
                                            className="text-gray-500 hover:text-gray-700"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                    <div>
                                        {selectedDashboardCard === 'incidents' && (
                                            <ul className="space-y-2">
                                                {reports.slice(0, 5).map(report => (
                                                    <li key={report.id} className="flex items-center gap-2">
                                                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">{report.type}</span>
                                                        <span className="font-medium">{report.title}</span>
                                                        <span className="text-xs text-gray-500 ml-2">{report.date}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                        {selectedDashboardCard === 'responseTime' && (
                                            <div className="text-center">
                                                <p className="text-4xl font-bold text-[#be4c1d] mb-2">{systemStats.responseTime}ms</p>
                                                <p className="text-gray-700">Average response time for the last 24 hours.</p>
                                                <div className="mt-4 text-sm text-gray-500">(You can add a chart or more analytics here.)</div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                );
            case "admin-management":
                return (
                    <div className="bg-[#f8eed4] rounded-lg shadow-md p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-semibold text-[#005524]">Admin Management</h2>
                            <button
                                onClick={() => setShowAddAdmin(true)}
                                className="bg-[#005524] text-white px-4 py-2 rounded-lg hover:bg-[#F9C835] transition-colors"
                            >
                                Add New Admin
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead>
                                    <tr className="bg-gray-50">
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Permissions</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-[#f8eed4] divide-y divide-gray-200">
                                    {admins.map((admin) => (
                                        <tr key={admin.id}>
                                            <td className="px-6 py-4 whitespace-nowrap">{admin.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{admin.email}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${admin.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                    {admin.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">{admin.lastLogin}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-wrap gap-1">
                                                    {admin.permissions.map((permission, index) => (
                                                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                                            {permission}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap space-x-2">
                                                <button
                                                    onClick={() => {
                                                        setSelectedAdmin(admin);
                                                        setShowPermissionsModal(true);
                                                    }}
                                                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                                                >
                                                    Permissions
                                                </button>
                                                <button
                                                    onClick={() => handleToggleAdminStatus(admin.id)}
                                                    className={`px-3 py-1 rounded ${admin.status === 'active'
                                                        ? 'bg-red-100 text-red-800 hover:bg-red-200'
                                                        : 'bg-green-100 text-green-800 hover:bg-green-200'
                                                        }`}
                                                >
                                                    {admin.status === 'active' ? 'Deactivate' : 'Activate'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case "feature-updates":
                return (
                    <div className="bg-[#f8eed4] rounded-lg shadow-md p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-semibold text-[#005524]">Feature Updates</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead>
                                    <tr className="bg-gray-50">
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-[#f8eed4] divide-y divide-gray-200">
                                    {featureUpdates.map((update) => (
                                        <tr key={update.id}>
                                            <td className="px-6 py-4 whitespace-nowrap">{update.name}</td>
                                            <td className="px-6 py-4">{update.description}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${update.status === 'approved' ? 'bg-green-100 text-green-800' :
                                                    update.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                                        'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                    {update.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">{update.date}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {update.status === 'pending' && (
                                                    <div className="space-x-2">
                                                        <button
                                                            onClick={() => handleFeatureUpdate(update.id, 'approved')}
                                                            className="px-3 py-1 bg-green-100 text-green-800 rounded hover:bg-green-200"
                                                        >
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => handleFeatureUpdate(update.id, 'rejected')}
                                                            className="px-3 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200"
                                                        >
                                                            Reject
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case "reports":
                return (
                    <div className="bg-[#f8eed4] rounded-lg shadow-md p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-semibold text-[#005524]">Reports Analysis</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead>
                                    <tr className="bg-gray-50">
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-[#f8eed4] divide-y divide-gray-200">
                                    {reports.map((report) => (
                                        <tr key={report.id}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                                                    {report.type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">{report.title}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${report.status === 'resolved' ? 'bg-green-100 text-green-800' :
                                                    report.status === 'reviewed' ? 'bg-blue-100 text-blue-800' :
                                                        'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                    {report.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${report.priority === 'high' ? 'bg-red-100 text-red-800' :
                                                    report.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-green-100 text-green-800'
                                                    }`}>
                                                    {report.priority}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">{report.date}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <button
                                                    onClick={() => {
                                                        setSelectedReport(report);
                                                        setShowReportDetails(true);
                                                    }}
                                                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
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
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-base font-medium ${activeTab === "dashboard" ? 'bg-gradient-to-tr from-[#005524] to-[#f8eed4] text-[#232323]' : 'hover:bg-[#f69f00]'}`}
                    >
                        <span className="text-xl">🏠</span> Dashboard
                    </button>
                    <button
                        onClick={() => setActiveTab("admin-management")}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-base font-medium ${activeTab === "admin-management" ? 'bg-gradient-to-tr from-[#005524] to-[#f8eed4] text-[#232323]' : 'hover:bg-[#f69f00]'}`}
                    >
                        <span className="text-xl">👥</span> Admin Management
                    </button>
                    <button
                        onClick={() => setActiveTab("feature-updates")}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-base font-medium ${activeTab === "feature-updates" ? 'bg-gradient-to-tr from-[#005524] to-[#f8eed4] text-[#232323]' : 'hover:bg-[#f69f00]'}`}
                    >
                        <span className="text-xl">🛠️</span> Feature Updates
                    </button>
                    <button
                        onClick={() => setActiveTab("reports")}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-base font-medium ${activeTab === "reports" ? 'bg-gradient-to-tr from-[#005524] to-[#f8eed4] text-[#232323]' : 'hover:bg-[#f69f00]'}`}
                    >
                        <span className="text-xl">📊</span> Reports Analysis
                    </button>
                </nav>
                {/* Bottom Buttons */}
                <div className="p-6 border-t border-[#333] mt-auto">
                    <button
                        onClick={() => setShowProfileSettings(true)}
                        className="w-full flex items-center gap-2 px-4 py-2 text-white hover:bg-[#f69f00] rounded-lg transition-colors mb-2"
                    >
                        <span className="text-xl">⚙️</span> Profile Settings
                    </button>
                    <button
                        onClick={() => setShowLogoutConfirm(true)}
                        className="w-full flex items-center gap-2 px-4 py-2 text-white hover:bg-[#f69f00] rounded-lg transition-colors"
                    >
                        <span className="text-xl">🚪</span> Logout
                    </button>
                </div>
            </div>
            {/* Main Content */}
            <div className="flex-1 flex flex-col">
                {/* Top Navigation Bar */}
                <div className="bg-[#005524] border-b border-[#333] p-6 flex items-center justify-between shadow-sm">
                    <h1 className="text-2xl font-bold text-[#f9a01b] tracking-wide">Hi, Super Admin!</h1>
                </div>
                {/* Content Area */}
                <div className="flex-1 p-8">
                    {renderContent()}
                </div>
            </div>

            {/* Add Admin Modal */}
            {showAddAdmin && (
                <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-2xl font-bold text-[#005524] mb-4">Add New Admin</h2>
                        <form onSubmit={handleAddAdmin}>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">Name</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#005524]"
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">Email</label>
                                <input
                                    type="email"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#005524]"
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">Password</label>
                                <input
                                    type="password"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#005524]"
                                    required
                                />
                            </div>
                            <div className="flex justify-end space-x-4">
                                <button
                                    type="button"
                                    onClick={() => setShowAddAdmin(false)}
                                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-[#005524] text-white rounded-lg hover:bg-[#004015]"
                                >
                                    Add Admin
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Permissions Modal */}
            {showPermissionsModal && selectedAdmin && (
                <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-2xl font-bold text-[#005524] mb-4">Manage Permissions</h2>
                        <p className="text-gray-600 mb-4">Admin: {selectedAdmin.name}</p>
                        <div className="space-y-4">
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="user_management"
                                    checked={selectedAdmin.permissions.includes('user_management')}
                                    onChange={(e) => {
                                        const newPermissions = e.target.checked
                                            ? [...selectedAdmin.permissions, 'user_management']
                                            : selectedAdmin.permissions.filter(p => p !== 'user_management');
                                        handleUpdatePermissions(selectedAdmin.id, newPermissions);
                                    }}
                                    className="mr-2"
                                />
                                <label htmlFor="user_management">User Management</label>
                            </div>
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="report_view"
                                    checked={selectedAdmin.permissions.includes('report_view')}
                                    onChange={(e) => {
                                        const newPermissions = e.target.checked
                                            ? [...selectedAdmin.permissions, 'report_view']
                                            : selectedAdmin.permissions.filter(p => p !== 'report_view');
                                        handleUpdatePermissions(selectedAdmin.id, newPermissions);
                                    }}
                                    className="mr-2"
                                />
                                <label htmlFor="report_view">Report View</label>
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={() => setShowPermissionsModal(false)}
                                className="px-4 py-2 bg-[#005524] text-white rounded-lg hover:bg-[#004015]"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Report Details Modal */}
            {showReportDetails && selectedReport && (
                <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-2xl font-bold text-[#005524] mb-4">Report Details</h2>
                        <div className="space-y-4">
                            <div>
                                <h3 className="font-semibold text-gray-700">Title</h3>
                                <p className="text-gray-600">{selectedReport.title}</p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-700">Type</h3>
                                <p className="text-gray-600">{selectedReport.type}</p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-700">Status</h3>
                                <p className="text-gray-600">{selectedReport.status}</p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-700">Priority</h3>
                                <p className="text-gray-600">{selectedReport.priority}</p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-700">Date</h3>
                                <p className="text-gray-600">{selectedReport.date}</p>
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end space-x-4">
                            {selectedReport.status === 'pending' && (
                                <>
                                    <button
                                        onClick={() => handleReportAction(selectedReport.id, 'review')}
                                        className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200"
                                    >
                                        Mark as Reviewed
                                    </button>
                                    <button
                                        onClick={() => handleReportAction(selectedReport.id, 'resolve')}
                                        className="px-4 py-2 bg-green-100 text-green-800 rounded-lg hover:bg-green-200"
                                    >
                                        Resolve
                                    </button>
                                </>
                            )}
                            <button
                                onClick={() => setShowReportDetails(false)}
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
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2">Confirm Password</label>
                                <input
                                    type="password"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#005524]"
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

export default SuperAdminDashboard; 