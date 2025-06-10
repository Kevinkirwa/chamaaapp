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
  Calendar,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Phone,
  User,
  MapPin,
  Camera,
  X
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
  pendingVerifications: number;
  verifiedUsers: number;
  verificationRate: number;
  roleDistribution: Array<{ _id: string; count: number }>;
  verificationStats: Array<{ _id: string; count: number }>;
}

interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  isActive: boolean;
  canCreateChamas: boolean;
  isVerified: boolean;
  createdAt: string;
  verificationRequest: {
    status: string;
    requestedAt?: string;
    rejectionReason?: string;
    nationalId?: {
      idNumber: string;
      fullName: string;
      dateOfBirth: string;
      placeOfBirth: string;
    };
    documents?: {
      idFrontPhoto: string;
      idBackPhoto: string;
      selfiePhoto: string;
      uploadedAt: string;
    };
    phoneVerification?: {
      isPhoneRegisteredWithId: boolean;
      phoneOwnerName?: string;
    };
    adminNotes?: string;
    riskAssessment?: {
      score: number;
      factors: Array<{ factor: string; score: number; description: string }>;
    };
  };
  stats: {
    chamasAsAdmin: number;
    chamasAsMember: number;
    totalContributions: number;
    totalPayouts: number;
  };
  verificationProgress: number;
}

interface VerificationRequest {
  _id: string;
  name: string;
  email: string;
  phone: string;
  verificationRequest: {
    status: string;
    requestedAt: string;
    nationalId: {
      idNumber: string;
      fullName: string;
      dateOfBirth: string;
      placeOfBirth: string;
    };
    documents: {
      idFrontPhoto: string;
      idBackPhoto: string;
      selfiePhoto: string;
      uploadedAt: string;
    };
  };
  verificationProgress: number;
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
  const [verificationRequests, setVerificationRequests] = useState<VerificationRequest[]>([]);
  const [selectedVerification, setSelectedVerification] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'chamas' | 'verifications'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [reviewData, setReviewData] = useState({
    adminNotes: '',
    riskScore: 50,
    phoneVerified: false,
    phoneOwnerName: ''
  });

  useEffect(() => {
    fetchOverview();
  }, []);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'chamas') {
      fetchChamas();
    } else if (activeTab === 'verifications') {
      fetchVerificationRequests();
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

  const fetchVerificationRequests = async () => {
    try {
      const response = await axios.get('/api/admin/verification-requests');
      if (response.data.success) {
        setVerificationRequests(response.data.requests);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch verification requests');
    }
  };

  const fetchVerificationDetails = async (userId: string) => {
    try {
      const response = await axios.get(`/api/admin/verification-requests/${userId}`);
      if (response.data.success) {
        setSelectedVerification(response.data.user);
        // Pre-fill review data
        const verification = response.data.user.verificationRequest;
        setReviewData({
          adminNotes: verification.adminNotes || '',
          riskScore: verification.riskAssessment?.score || 50,
          phoneVerified: verification.phoneVerification?.isPhoneRegisteredWithId || false,
          phoneOwnerName: verification.phoneVerification?.phoneOwnerName || ''
        });
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch verification details');
    }
  };

  const handleVerificationRequest = async (userId: string, action: 'approve' | 'reject', rejectionReason?: string) => {
    try {
      const response = await axios.patch(`/api/admin/verification-requests/${userId}`, {
        action,
        rejectionReason,
        adminNotes: reviewData.adminNotes,
        riskScore: reviewData.riskScore,
        riskFactors: [], // Could be expanded to include detailed risk factors
        phoneVerified: reviewData.phoneVerified,
        phoneOwnerName: reviewData.phoneOwnerName
      });

      if (response.data.success) {
        toast.success(`Verification request ${action}d successfully`);
        fetchVerificationRequests();
        fetchOverview();
        setSelectedVerification(null);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Failed to ${action} verification request`);
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

  const grantChamaPermission = async (userId: string) => {
    try {
      const response = await axios.patch(`/api/admin/users/${userId}/grant-chama-permission`);

      if (response.data.success) {
        toast.success('Chama creation permission granted successfully');
        fetchUsers();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to grant permission');
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
          <p className="text-gray-600 mt-2">Manage the entire M-Chama system with document verification</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'users', label: 'Users', icon: Users },
            { id: 'chamas', label: 'Chamas', icon: Building2 },
            { id: 'verifications', label: `ID Verifications ${overview?.pendingVerifications ? `(${overview.pendingVerifications})` : ''}`, icon: Shield }
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
                  <p className="text-sm text-gray-500">{overview.verificationRate}% verified</p>
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
                  <p className="text-sm font-medium text-gray-600">Pending Verifications</p>
                  <p className="text-3xl font-bold text-gray-900">{overview.pendingVerifications}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Verification Statistics */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">User Role Distribution</h3>
              <div className="grid grid-cols-2 gap-4">
                {overview.roleDistribution.map((role) => (
                  <div key={role._id} className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">{role.count}</p>
                    <p className="text-sm text-gray-600 capitalize">{role._id.replace('_', ' ')}s</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Verification Status</h3>
              <div className="grid grid-cols-2 gap-4">
                {overview.verificationStats.map((stat) => (
                  <div key={stat._id} className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">{stat.count}</p>
                    <p className="text-sm text-gray-600 capitalize">
                      {stat._id === 'none' ? 'Not Started' : stat._id}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Verifications Tab */}
      {activeTab === 'verifications' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              ID Verification Requests ({verificationRequests.length})
            </h3>
            
            {verificationRequests.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <p className="text-gray-600">No pending verification requests</p>
              </div>
            ) : (
              <div className="space-y-4">
                {verificationRequests.map((request) => (
                  <div key={request._id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <div>
                            <h4 className="font-medium text-gray-900">{request.name}</h4>
                            <p className="text-sm text-gray-600">{request.email}</p>
                            <p className="text-sm text-gray-600">{request.phone}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-medium text-gray-700">ID Number</p>
                            <p className="text-lg font-mono font-bold text-gray-900">
                              {request.verificationRequest.nationalId.idNumber}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-medium text-gray-700">Progress</p>
                            <div className="w-16 h-16 relative">
                              <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                                <path
                                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                  fill="none"
                                  stroke="#e5e7eb"
                                  strokeWidth="2"
                                />
                                <path
                                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                  fill="none"
                                  stroke="#10b981"
                                  strokeWidth="2"
                                  strokeDasharray={`${request.verificationProgress}, 100`}
                                />
                              </svg>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-sm font-bold text-gray-900">{request.verificationProgress}%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Submitted: {new Date(request.verificationRequest.requestedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => fetchVerificationDetails(request._id)}
                          className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          <span>Review</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Verification Review Modal */}
      {selectedVerification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">ID Verification Review</h2>
              <button
                onClick={() => setSelectedVerification(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 grid md:grid-cols-2 gap-8">
              {/* User Information */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <User className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Full Name</p>
                        <p className="font-medium">{selectedVerification.verificationRequest.nationalId?.fullName}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <FileText className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">National ID</p>
                        <p className="font-mono font-bold">{selectedVerification.verificationRequest.nationalId?.idNumber}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Date of Birth</p>
                        <p className="font-medium">
                          {selectedVerification.verificationRequest.nationalId?.dateOfBirth ? 
                            new Date(selectedVerification.verificationRequest.nationalId.dateOfBirth).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <MapPin className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Place of Birth</p>
                        <p className="font-medium">{selectedVerification.verificationRequest.nationalId?.placeOfBirth}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Phone className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Phone Number</p>
                        <p className="font-medium">{selectedVerification.phone}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Review Form */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Admin Review</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Verification
                      </label>
                      <div className="flex items-center space-x-4">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={reviewData.phoneVerified}
                            onChange={(e) => setReviewData(prev => ({ ...prev, phoneVerified: e.target.checked }))}
                            className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">Phone registered with this ID</span>
                        </label>
                      </div>
                      {reviewData.phoneVerified && (
                        <input
                          type="text"
                          value={reviewData.phoneOwnerName}
                          onChange={(e) => setReviewData(prev => ({ ...prev, phoneOwnerName: e.target.value }))}
                          className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="Phone owner name (if different)"
                        />
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Risk Score: {reviewData.riskScore}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={reviewData.riskScore}
                        onChange={(e) => setReviewData(prev => ({ ...prev, riskScore: parseInt(e.target.value) }))}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Low Risk</span>
                        <span>High Risk</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Admin Notes
                      </label>
                      <textarea
                        value={reviewData.adminNotes}
                        onChange={(e) => setReviewData(prev => ({ ...prev, adminNotes: e.target.value }))}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Add notes about the verification review..."
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Document Images */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Uploaded Documents</h3>
                  
                  {/* ID Front */}
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">National ID - Front</p>
                    {selectedVerification.verificationRequest.documents?.idFrontPhoto ? (
                      <img 
                        src={selectedVerification.verificationRequest.documents.idFrontPhoto}
                        alt="ID Front"
                        className="w-full h-48 object-cover rounded-lg border border-gray-300 cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => window.open(selectedVerification.verificationRequest.documents!.idFrontPhoto, '_blank')}
                      />
                    ) : (
                      <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                        <p className="text-gray-500">No image uploaded</p>
                      </div>
                    )}
                  </div>

                  {/* ID Back */}
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">National ID - Back</p>
                    {selectedVerification.verificationRequest.documents?.idBackPhoto ? (
                      <img 
                        src={selectedVerification.verificationRequest.documents.idBackPhoto}
                        alt="ID Back"
                        className="w-full h-48 object-cover rounded-lg border border-gray-300 cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => window.open(selectedVerification.verificationRequest.documents!.idBackPhoto, '_blank')}
                      />
                    ) : (
                      <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                        <p className="text-gray-500">No image uploaded</p>
                      </div>
                    )}
                  </div>

                  {/* Selfie */}
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Selfie Photo</p>
                    {selectedVerification.verificationRequest.documents?.selfiePhoto ? (
                      <img 
                        src={selectedVerification.verificationRequest.documents.selfiePhoto}
                        alt="Selfie"
                        className="w-full h-48 object-cover rounded-lg border border-gray-300 cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => window.open(selectedVerification.verificationRequest.documents!.selfiePhoto, '_blank')}
                      />
                    ) : (
                      <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                        <p className="text-gray-500">No image uploaded</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => {
                  const reason = prompt('Rejection reason:');
                  if (reason) {
                    handleVerificationRequest(selectedVerification._id, 'reject', reason);
                  }
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <XCircle className="w-4 h-4" />
                <span>Reject</span>
              </button>
              <button
                onClick={() => handleVerificationRequest(selectedVerification._id, 'approve')}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Approve</span>
              </button>
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
              <option value="chama_creator">Chama Creators</option>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Verification</th>
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
                          user.role === 'chama_creator' ? 'bg-green-100 text-green-800' :
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
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col space-y-1">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 relative">
                              <svg className="w-8 h-8 transform -rotate-90" viewBox="0 0 36 36">
                                <path
                                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                  fill="none"
                                  stroke="#e5e7eb"
                                  strokeWidth="3"
                                />
                                <path
                                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                  fill="none"
                                  stroke="#10b981"
                                  strokeWidth="3"
                                  strokeDasharray={`${user.verificationProgress}, 100`}
                                />
                              </svg>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-xs font-bold text-gray-900">{user.verificationProgress}%</span>
                              </div>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              user.verificationRequest.status === 'approved' ? 'bg-green-100 text-green-800' :
                              user.verificationRequest.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              user.verificationRequest.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {user.verificationRequest.status === 'none' ? 'Not Started' : user.verificationRequest.status}
                            </span>
                          </div>
                          {user.canCreateChamas && (
                            <span className="inline-flex px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                              Can Create Chamas
                            </span>
                          )}
                        </div>
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
                        
                        {!user.canCreateChamas && (
                          <button
                            onClick={() => grantChamaPermission(user._id)}
                            className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200"
                          >
                            <Shield className="w-3 h-3 mr-1" />
                            Grant Permission
                          </button>
                        )}
                        
                        {user.role === 'member' && (
                          <button
                            onClick={() => promoteUser(user._id, 'admin')}
                            className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-700 hover:bg-purple-200"
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