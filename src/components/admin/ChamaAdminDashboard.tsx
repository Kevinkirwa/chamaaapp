import React, { useState, useEffect } from 'react';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  Settings,
  UserPlus
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface ChamaStats {
  memberCount: number;
  currentCycle: number;
  totalContributed: number;
  totalPaidOut: number;
  currentCycleProgress: number;
  currentCycleTarget: number;
  currentReceiver: any;
}

interface Contribution {
  _id: string;
  user: {
    name: string;
    email: string;
    phone: string;
  };
  amount: number;
  status: string;
  mpesaCode?: string;
  createdAt: string;
}

interface Payout {
  _id: string;
  recipient: {
    name: string;
    email: string;
    phone: string;
  };
  amount: number;
  cycle: number;
  status: string;
  mpesaCode?: string;
  createdAt: string;
}

interface ChamaAdminDashboardProps {
  chamaId: string;
}

const ChamaAdminDashboard: React.FC<ChamaAdminDashboardProps> = ({ chamaId }) => {
  const [chama, setChama] = useState<any>(null);
  const [stats, setStats] = useState<ChamaStats | null>(null);
  const [contributions, setContributions] = useState<{
    current: Contribution[];
    all: Contribution[];
  }>({ current: [], all: [] });
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'contributions' | 'payouts' | 'members'>('overview');

  useEffect(() => {
    fetchChamaDashboard();
  }, [chamaId]);

  const fetchChamaDashboard = async () => {
    try {
      const response = await axios.get(`/api/admin/chama/${chamaId}/dashboard`);
      if (response.data.success) {
        setChama(response.data.chama);
        setStats(response.data.stats);
        setContributions(response.data.contributions);
        setPayouts(response.data.payouts);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch chama dashboard');
    } finally {
      setLoading(false);
    }
  };

  const forceCycleCompletion = async () => {
    try {
      const response = await axios.post(`/api/admin/chamas/${chamaId}/force-cycle`);
      if (response.data.success) {
        toast.success('Cycle completed successfully');
        fetchChamaDashboard();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to complete cycle');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!chama || !stats) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-600">Chama not found or access denied</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{chama.name}</h1>
          <p className="text-gray-600 mt-2">{chama.description}</p>
          <div className="flex items-center space-x-4 mt-2">
            <span className="text-sm text-gray-500">Invite Code: <span className="font-mono font-bold">{chama.inviteCode}</span></span>
            <span className="text-sm text-gray-500">Cycle {stats.currentCycle}</span>
          </div>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={forceCycleCompletion}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            Force Complete Cycle
          </button>
          <button className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
            <Settings className="w-4 h-4 inline mr-2" />
            Settings
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Members</p>
              <p className="text-3xl font-bold text-gray-900">{stats.memberCount}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Current Cycle</p>
              <p className="text-3xl font-bold text-gray-900">{stats.currentCycle}</p>
              <p className="text-sm text-gray-500">{stats.currentCycleProgress}/{stats.currentCycleTarget} contributed</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Contributed</p>
              <p className="text-3xl font-bold text-gray-900">KSh {stats.totalContributed.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Paid Out</p>
              <p className="text-3xl font-bold text-gray-900">KSh {stats.totalPaidOut.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Current Receiver */}
      {stats.currentReceiver && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Current Receiver</h3>
              <p className="text-gray-600">{stats.currentReceiver.user.name}</p>
              <p className="text-sm text-gray-500">{stats.currentReceiver.user.email}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Expected Amount</p>
              <p className="text-2xl font-bold text-green-600">KSh {(chama.contributionAmount * stats.memberCount).toLocaleString()}</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progress</span>
              <span>{stats.currentCycleProgress}/{stats.currentCycleTarget}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(stats.currentCycleProgress / stats.currentCycleTarget) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'contributions', label: 'Contributions' },
            { id: 'payouts', label: 'Payouts' },
            { id: 'members', label: 'Members' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-green-600 text-green-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Contributions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Contributions</h3>
            <div className="space-y-3">
              {contributions.all.slice(0, 5).map((contribution) => (
                <div key={contribution._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{contribution.user.name}</p>
                    <p className="text-sm text-gray-500">KSh {contribution.amount}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {contribution.status === 'completed' ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : contribution.status === 'failed' ? (
                      <XCircle className="w-5 h-5 text-red-600" />
                    ) : (
                      <Clock className="w-5 h-5 text-yellow-600" />
                    )}
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      contribution.status === 'completed' ? 'bg-green-100 text-green-800' :
                      contribution.status === 'failed' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {contribution.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Payouts */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Payouts</h3>
            <div className="space-y-3">
              {payouts.slice(0, 5).map((payout) => (
                <div key={payout._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{payout.recipient.name}</p>
                    <p className="text-sm text-gray-500">Cycle {payout.cycle} • KSh {payout.amount.toLocaleString()}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {payout.status === 'completed' ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : payout.status === 'failed' ? (
                      <XCircle className="w-5 h-5 text-red-600" />
                    ) : (
                      <Clock className="w-5 h-5 text-yellow-600" />
                    )}
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      payout.status === 'completed' ? 'bg-green-100 text-green-800' :
                      payout.status === 'failed' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {payout.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'members' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Members ({chama.members.length})</h3>
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              <UserPlus className="w-4 h-4 inline mr-2" />
              Add Member
            </button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {chama.members.map((member: any, index: number) => (
              <div key={member.user._id} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{member.user.name}</h4>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    Order #{member.payoutOrder}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{member.user.email}</p>
                <p className="text-sm text-gray-600">{member.user.phone}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    Joined {new Date(member.joinedAt).toLocaleDateString()}
                  </span>
                  {member.hasReceived && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      Received
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChamaAdminDashboard;