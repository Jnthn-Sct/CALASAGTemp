import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logoImage from "../Images/no-bg-logo.png";
import { FaUserCircle, FaBell, FaMoon, FaSun, FaSearch, FaChevronDown, FaChevronLeft, FaChevronRight, FaTable, FaChartBar, FaKey, FaCalendarAlt, FaFileAlt, FaCubes, FaLock, FaUser, FaHome, FaCog } from 'react-icons/fa';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

interface Admin {
    id: number;
    name: string;
    email: string;
    status: 'active' | 'inactive';
    lastLogin: string;
    permissions: string[];
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
    type: 'incident' | 'alert';
    title: string;
    status: 'pending' | 'reviewed' | 'resolved';
    date: string;
    priority: 'high' | 'medium' | 'low';
}

const SuperAdminDashboard: React.FC = () => {
    const navigate = useNavigate();
    const currentUser = JSON.parse(localStorage.getItem('user') || '{"name": "Super Admin", "email": "superadmin@calasag.com", "role": "Super Administrator"}');

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
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState<boolean>(false);
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
    const [showNotifications, setShowNotifications] = useState(false);
    const [notificationsList] = useState([
        { id: 1, message: 'New admin added', time: '2 mins ago' },
        { id: 2, message: 'Incident report resolved', time: '1 hour ago' },
    ]);

    const [featureUpdates] = useState<FeatureUpdate[]>([
        { id: 1, name: "New Alert System", description: "Implementation of real-time alert system", status: 'pending', date: "2024-03-20" },
        { id: 2, name: "UI Enhancement", description: "Dashboard redesign for better UX", status: 'approved', date: "2024-03-19" },
        { id: 3, name: "Security Update", description: "Critical security patches", status: 'pending', date: "2024-03-18" }
    ]);

    const [reports] = useState<Report[]>([
        { id: 1, type: 'incident', title: "System Outage Report", status: 'pending', date: "2024-03-20", priority: 'high' },
        { id: 2, type: 'alert', title: "Security Alert Report", status: 'resolved', date: "2024-03-18", priority: 'low' }
    ]);

    const [admins, setAdmins] = useState<Admin[]>([
        { id: 1, name: "Admin One", email: "admin1@calasag.com", status: "active", lastLogin: "2024-03-20 10:30", permissions: ['user_management', 'report_view'] },
        { id: 2, name: "Admin Two", email: "admin2@calasag.com", status: "active", lastLogin: "2024-03-19 15:45", permissions: ['user_management'] },
        { id: 3, name: "Admin Three", email: "admin3@calasag.com", status: "inactive", lastLogin: "2024-03-18 09:15", permissions: ['report_view'] },
    ]);

    // Chart data
    const incidentData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [
            {
                label: 'Incidents',
                data: [12, 19, 15, 25, 22, 30],
                borderColor: '#005524',
                backgroundColor: 'rgba(0, 85, 36, 0.1)',
                tension: 0.4,
                fill: true,
            },
        ],
    };

    const adminActivityData = {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [
            {
                label: 'Active Admins',
                data: [3, 4, 3, 5, 4, 2, 3],
                backgroundColor: '#005524',
            },
        ],
    };

    const reportDistributionData = {
        labels: ['Incidents', 'Alerts'],
        datasets: [
            {
                data: [45, 30],
                backgroundColor: [
                    '#005524',
                    '#f9a01b',
                    '#be4c1d',
                ],
                borderWidth: 0,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top' as const,
            },
        },
    };

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
                    <div className="space-y-6">
                        {/* Charts Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Incident Trends Chart */}
                            <div className="bg-[#f8eed4] p-6 rounded-xl shadow-sm border border-gray-200">
                                <h3 className="text-lg font-semibold text-[#005524] mb-4">Incident Trends</h3>
                                <div className="h-[300px]">
                                    <Line data={incidentData} options={chartOptions} />
                                </div>
                            </div>

                            {/* Admin Activity Chart */}
                            <div className="bg-[#f8eed4] p-6 rounded-xl shadow-sm border border-gray-200">
                                <h3 className="text-lg font-semibold text-[#005524] mb-4">Admin Activity</h3>
                                <div className="h-[300px]">
                                    <Bar data={adminActivityData} options={chartOptions} />
                                </div>
                            </div>

                            {/* Report Distribution Chart */}
                            <div className="bg-[#f8eed4] p-6 rounded-xl shadow-sm border border-gray-200">
                                <h3 className="text-lg font-semibold text-[#005524] mb-4">Report Distribution</h3>
                                <div className="h-[300px]">
                                    <Doughnut data={reportDistributionData} options={chartOptions} />
                                </div>
                            </div>

                            {/* Recent Activity */}
                            <div className="bg-[#f8eed4] p-6 rounded-xl shadow-sm border border-gray-200">
                                <h3 className="text-lg font-semibold text-[#005524] mb-4">Recent Activity</h3>
                                <div className="space-y-4">
                                    {notificationsList.map((notif) => (
                                        <div key={notif.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                            <div className="w-2 h-2 mt-2 rounded-full bg-[#005524]"></div>
                                            <div>
                                                <p className="text-sm text-gray-800">{notif.message}</p>
                                                <p className="text-xs text-gray-500">{notif.time}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case "admin-management":
                return (
                    <div>
                        <div className="flex justify-end mb-6">
                            <button
                                onClick={() => setShowAddAdmin(true)}
                                className="bg-[#005524] text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition-colors"
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
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {admins.map((admin) => (
                                        <tr key={admin.id} className="hover:bg-gray-50">
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
                            <tbody className="bg-white divide-y divide-gray-200">
                                {featureUpdates.map((update) => (
                                    <tr key={update.id} className="hover:bg-gray-50">
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
                );

            case "reports":
                return (
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
                            <tbody className="bg-white divide-y divide-gray-200">
                                {reports.map((report) => (
                                    <tr key={report.id} className="hover:bg-gray-50">
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
                                <h3 className="text-lg font-semibold text-[#005524] mb-4">Security</h3>
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
                        <div className="border-b border-gray-200 pb-6">
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

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            const notifDropdown = document.getElementById('notif-dropdown');
            if (notifDropdown && !notifDropdown.contains(event.target as Node)) {
                setShowNotifications(false);
            }
        }
        if (showNotifications) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showNotifications]);

    return (
        <div className="min-h-screen flex bg-white">
            {/* Sidebar */}
            <aside className={`fixed h-screen transition-all duration-300 ${isSidebarCollapsed ? 'w-20' : 'w-64'} bg-[#fff] border-r border-gray-200 flex flex-col shadow-lg z-30`}>
                <div className="flex items-center justify-between p-5.5 border-b border-gray-100">
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
                <nav className="flex flex-col gap-2 mt-4 px-2">
                    <button
                        onClick={() => setActiveTab('dashboard')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-base font-medium 
                        ${activeTab === 'dashboard'
                                ? 'bg-white text-[#005524] shadow-sm border border-gray-100'
                                : 'text-gray-700 hover:bg-white hover:text-[#005524] hover:shadow-sm hover:translate-x-1'}`}
                    >
                        <FaHome size={20} /> {!isSidebarCollapsed && 'Dashboard'}
                    </button>
                    <button
                        onClick={() => setActiveTab('admin-management')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-base font-medium 
                        ${activeTab === 'admin-management'
                                ? 'bg-white text-[#005524] shadow-sm border border-gray-100'
                                : 'text-gray-700 hover:bg-white hover:text-[#005524] hover:shadow-sm hover:translate-x-1'}`}
                    >
                        <FaUser size={20} /> {!isSidebarCollapsed && 'Admin Management'}
                    </button>
                    <button
                        onClick={() => setActiveTab('feature-updates')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-base font-medium 
                        ${activeTab === 'feature-updates'
                                ? 'bg-white text-[#005524] shadow-sm border border-gray-100'
                                : 'text-gray-700 hover:bg-white hover:text-[#005524] hover:shadow-sm hover:translate-x-1'}`}
                    >
                        <FaKey size={20} /> {!isSidebarCollapsed && 'Feature Updates'}
                    </button>
                    <button
                        onClick={() => setActiveTab('reports')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-base font-medium 
                        ${activeTab === 'reports'
                                ? 'bg-white text-[#005524] shadow-sm border border-gray-100'
                                : 'text-gray-700 hover:bg-white hover:text-[#005524] hover:shadow-sm hover:translate-x-1'}`}
                    >
                        <FaChartBar size={20} /> {!isSidebarCollapsed && 'Reports Analysis'}
                    </button>
                </nav>
                <div className="mt-auto p-4 border-t border-gray-100">
                    <button
                        onClick={() => setActiveTab('settings')}
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
            <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${isSidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
                {/* Top Navigation Bar */}
                <header className="sticky top-0 z-20 bg-white border-b border-gray-200 flex items-center justify-between px-6 py-3 shadow-sm">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="md:hidden text-gray-400 hover:text-[#005524]">
                            <FaChevronRight size={16} />
                        </button>
                        <h1 className="text-xl font-semibold text-[#005524]">
                            {activeTab === 'dashboard' && 'Dashboard'}
                            {activeTab === 'admin-management' && 'Admin Management'}
                            {activeTab === 'feature-updates' && 'Feature Updates'}
                            {activeTab === 'reports' && 'Reports Analysis'}
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
                                <div id="notif-dropdown" className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                                    <div className="p-4 border-b border-gray-100 font-semibold text-[#005524]">Notifications</div>
                                    <div className="max-h-64 overflow-y-auto">
                                        {notificationsList.length === 0 ? (
                                            <div className="p-4 text-gray-500 text-center">No notifications</div>
                                        ) : (
                                            notificationsList.map((notif) => (
                                                <div key={notif.id} className="px-4 py-3 border-b last:border-b-0 border-gray-100 hover:bg-gray-50 cursor-pointer">
                                                    <div className="text-sm text-gray-800">{notif.message}</div>
                                                    <div className="text-xs text-gray-400">{notif.time}</div>
                                                </div>
                                            ))
                                        )}
                                    </div>
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

            {/* Add Admin Modal */}
            {showAddAdmin && (
                <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg border border-gray-200">
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
                                    className="px-4 py-2 bg-[#005524] text-white rounded-lg hover:bg-opacity-90"
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
                                className="px-4 py-2 bg-[#005524] text-white rounded-lg hover:bg-opacity-90"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SuperAdminDashboard; 