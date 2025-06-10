import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Building2, 
  DollarSign, 
  TrendingUp, 
  Search, 
  Filter,
  Eye,
  UserCheck,
  UserX,
  Shield,
  BarChart3,
  Calendar
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface SystemOverview {
  totalUsers: number;
  totalChamas: number;
  totalContributions: number;
  totalPayouts: number;
  totalContributionAmount: number;
  totalPayoutAmount: number;
  systemBalance: number;
  roleDistribution: Array<{ _id: string; count: number }>;
}

interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  stats: {
    chamasAsAdmin: number;
    chamasAsMember: number;
    totalContributions: number;
    totalPayouts: number;
  };
}

interface Chama {
  _id: string;
  name: string;
  description: string;
  contributionAmount: number;
  status: string;
  admin: {
    name: string;
    email: string;
  };
  stats: {
    memberCount: number;
    totalContributions: number;
    totalPayouts: number;
    totalAmount: number;
  };
}

const SuperAdminDashboard: React.FC = () => {
  const [overview, setOverview] = useState<SystemOverview | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [chamas, setChamas] = useState<Chama[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'chamas'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    fetchOverview();
  }, []);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'chamas') {
      fetchChamas();
    }
  }, [activeTab, searchTerm, filterRole, filterStatus]);

  const fetchOverview = async () => {
    try {
      const response = await axios.get('/api/admin/overview');
      if (response.data.success) {
        setOverview(response.data.overview);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch overview');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (filterRole) params.append('role', filterRole);

      const response = await axios.get(`/api/admin/users?${params}`);
      if (response.data.success) {
        setUsers(response.data.users);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch users');
    }
  };

  const fetchChamas = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (filterStatus) params.append('status', filterStatus);

      const response = await axios.get(`/api/admin/chamas?${params}`);
      if (response.data.success) {
        setChamas(response.data.chamas);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch chamas');
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const response = await axios.patch(`/api/admin/users/${userId}/status`, {
        isActive: !currentStatus
      });

      if (response.data.success) {
        toast.success(`User ${!currentStatus ? 'activated' : 'suspended'} successfully`);
        fetchUsers();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update user status');
    }
  };

  const promoteUser = async (userId: string, newRole: string) => {
    try {
      const response = await axios.patch(`/api/admin/users/${userId}/promote`, {
        role: newRole
      });

      if (response.data.success) {
        toast.success(`User role updated to ${newRole} successfully`);
        fetchUsers();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update user role');
    }
  };

  const updateChamaStatus = async (chamaId: string, newStatus: string) => {
    try {
      const response = await axios.patch(`/api/admin/chamas/${chamaId}/status`, {
        status: newStatus
      });

      if (response.data.success) {
        toast.success(`Chama status updated to ${newStatus} successfully`);
        fetchChamas();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update chama status');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
            <Shield className="w-8 h-8 text-green-600" />
            <span>Super Admin Dashboard</span>
          </h1>
          <p className="text-gray-600 mt-2">Manage the entire M-Chama system</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'users', label: 'Users', icon: Users },
            { id: 'chamas', label: 'Chamas', icon: Building2 }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-green-600 text-green-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && overview && (
        <div className="space-y-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-3xl font-bold text-gray-900">{overview.totalUsers}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Chamas</p>
                  <p className="text-3xl font-bold text-gray-900">{overview.totalChamas}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Contributions</p>
                  <p className="text-3xl font-bold text-gray-900">KSh {overview.totalContributionAmount.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">System Balance</p>
                  <p className="text-3xl font-bold text-gray-900">KSh {overview.systemBalance.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Role Distribution */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">User Role Distribution</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {overview.roleDistribution.map((role) => (
                <div key={role._id} className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900">{role.count}</p>
                  <p className="text-sm text-gray-600 capitalize">{role._id}s</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Search users..."
              />
            </div>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">All Roles</option>
              <option value="member">Members</option>
              <option value="admin">Admins</option>
              <option value="super_admin">Super Admins</option>
            </select>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stats</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                          <div className="text-sm text-gray-500">{user.phone}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.role === 'super_admin' ? 'bg-purple-100 text-purple-800' :
                          user.role === 'admin' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {user.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {user.isActive ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>Admin: {user.stats.chamasAsAdmin}</div>
                        <div>Member: {user.stats.chamasAsMember}</div>
                        <div>Contributions: {user.stats.totalContributions}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => toggleUserStatus(user._id, user.isActive)}
                          className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-medium ${
                            user.isActive 
                              ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          {user.isActive ? <UserX className="w-3 h-3 mr-1" /> : <UserCheck className="w-3 h-3 mr-1" />}
                          {user.isActive ? 'Suspend' : 'Activate'}
                        </button>
                        {user.role === 'member' && (
                          <button
                            onClick={() => promoteUser(user._id, 'admin')}
                            className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200"
                          >
                            <Shield className="w-3 h-3 mr-1" />
                            Promote
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Chamas Tab */}
      {activeTab === 'chamas' && (
        <div className="space-y-6">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Search chamas..."
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Chamas Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {chamas.map((chama) => (
              <div key={chama._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{chama.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{chama.description}</p>
                  </div>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    chama.status === 'active' ? 'bg-green-100 text-green-800' :
                    chama.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {chama.status}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Admin:</span>
                    <span className="font-medium">{chama.admin.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Members:</span>
                    <span className="font-medium">{chama.stats.memberCount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Contribution:</span>
                    <span className="font-medium">KSh {chama.contributionAmount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Amount:</span>
                    <span className="font-medium">KSh {chama.stats.totalAmount.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => updateChamaStatus(chama._id, chama.status === 'active' ? 'paused' : 'active')}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium ${
                      chama.status === 'active'
                        ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {chama.status === 'active' ? 'Pause' : 'Activate'}
                  </button>
                  <button className="flex-1 px-3 py-2 rounded-lg text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200">
                    <Eye className="w-3 h-3 inline mr-1" />
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminDashboard;