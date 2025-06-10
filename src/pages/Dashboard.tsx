import React, { useState, useEffect } from 'react';
import { Plus, UserPlus, Search, TrendingUp, Users, DollarSign, AlertCircle, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import ChamaCard from '../components/dashboard/ChamaCard';
import CreateChamaModal from '../components/dashboard/CreateChamaModal';
import JoinChamaModal from '../components/dashboard/JoinChamaModal';

interface Chama {
  _id: string;
  name: string;
  description: string;
  contributionAmount: number;
  currentCycle: number;
  admin: {
    name: string;
    email: string;
  };
  memberCount: number;
  totalContributed: number;
  totalRequired: number;
  isAdmin: boolean;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [chamas, setChamas] = useState<Chama[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    totalChamas: 0,
    totalSavings: 0,
    activeContributions: 0
  });

  useEffect(() => {
    fetchChamas();
  }, []);

  const fetchChamas = async () => {
    try {
      setError('');
      const response = await axios.get('/api/chamas/my-chamas');
      if (response.data.success) {
        setChamas(response.data.chamas);
        calculateStats(response.data.chamas);
      } else {
        setError('Failed to load your Chamas');
      }
    } catch (error: any) {
      console.error('Error fetching chamas:', error);
      
      if (error.response?.status === 401) {
        setError('Session expired. Please login again.');
      } else if (error.response?.status === 403) {
        setError('You don\'t have permission to view Chamas.');
      } else if (!error.response) {
        setError('Unable to connect to server. Please check your internet connection.');
      } else {
        setError(error.response?.data?.message || 'Failed to load your Chamas');
      }
      
      toast.error(error.response?.data?.message || 'Failed to fetch chamas');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (chamasData: Chama[]) => {
    const totalChamas = chamasData.length;
    const totalSavings = chamasData.reduce((sum, chama) => 
      sum + (chama.contributionAmount * chama.memberCount * chama.currentCycle), 0
    );
    const activeContributions = chamasData.reduce((sum, chama) => 
      sum + chama.totalContributed, 0
    );

    setStats({
      totalChamas,
      totalSavings,
      activeContributions
    });
  };

  const filteredChamas = chamas.filter(chama =>
    chama.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chama.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleChamaClick = (chama: Chama) => {
    navigate(`/chama/${chama._id}`);
  };

  const handleRetry = () => {
    setLoading(true);
    fetchChamas();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your Chamas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to Load Chamas</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={handleRetry}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Chamas</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalChamas}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Savings</p>
              <p className="text-3xl font-bold text-gray-900">KSh {stats.totalSavings.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Contributions</p>
              <p className="text-3xl font-bold text-gray-900">{stats.activeContributions}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Chamas</h1>
          <p className="text-gray-600 mt-1">Manage your savings groups and contributions</p>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={() => setShowJoinModal(true)}
            className="flex items-center space-x-2 px-4 py-2 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span>Join Chama</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Chama</span>
          </button>
        </div>
      </div>

      {/* Search */}
      {chamas.length > 0 && (
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
            placeholder="Search chamas..."
          />
        </div>
      )}

      {/* Chamas Grid */}
      {filteredChamas.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredChamas.map((chama) => (
            <ChamaCard
              key={chama._id}
              chama={{
                id: chama._id,
                name: chama.name,
                description: chama.description,
                contribution_amount: chama.contributionAmount,
                current_cycle: chama.currentCycle,
                admin_name: chama.admin.name
              }}
              memberCount={chama.memberCount}
              onClick={() => handleChamaClick(chama)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Plus className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? 'No chamas found' : 'No chamas yet'}
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm 
              ? 'Try adjusting your search terms'
              : 'Create your first chama or join an existing one to get started'
            }
          </p>
          {!searchTerm && (
            <div className="flex justify-center space-x-3">
              <button
                onClick={() => setShowJoinModal(true)}
                className="flex items-center space-x-2 px-4 py-2 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                <span>Join Chama</span>
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Create Chama</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <CreateChamaModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={fetchChamas}
      />
      <JoinChamaModal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        onSuccess={fetchChamas}
      />
    </div>
  );
};

export default Dashboard;