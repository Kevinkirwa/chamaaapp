import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Users, 
  DollarSign, 
  Calendar, 
  Share2, 
  Settings,
  CreditCard,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Phone,
  Copy,
  MessageCircle,
  Send,
  Shuffle,
  AlertCircle,
  Edit3,
  Bell,
  Target,
  Zap,
  Info
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

interface Member {
  user: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  payoutOrder: number;
  hasReceived: boolean;
  joinedAt: string;
  totalContributed: number;
  receivingPhone: string;
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
  cycle: number;
}

interface Message {
  _id: string;
  sender: {
    _id: string;
    name: string;
    email: string;
  };
  content: string;
  messageType: string;
  createdAt: string;
}

interface ChamaData {
  _id: string;
  name: string;
  description: string;
  contributionAmount: number;
  currentCycle: number;
  inviteCode: string;
  isOrderingFinalized: boolean;
  orderingDate?: string;
  admin: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  members: Member[];
  isAdmin: boolean;
}

const ChamaDetails: React.FC = () => {
  const { chamaId } = useParams<{ chamaId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [chama, setChama] = useState<ChamaData | null>(null);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [contributionLoading, setContributionLoading] = useState(false);
  const [finalizeLoading, setFinalizeLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState(user?.phone || '');
  const [receivingPhone, setReceivingPhone] = useState('');
  const [editingPhone, setEditingPhone] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'contributions' | 'chat'>('overview');
  const [showPaymentInfo, setShowPaymentInfo] = useState(false);

  useEffect(() => {
    if (chamaId) {
      fetchChamaDetails();
      fetchMessages();
    }
  }, [chamaId]);

  const fetchChamaDetails = async () => {
    try {
      const response = await axios.get(`/api/chamas/${chamaId}`);
      if (response.data.success) {
        setChama(response.data.chama);
        setContributions(response.data.contributions);
        
        // Set user's receiving phone
        const currentUserMember = response.data.chama.members.find(
          (m: Member) => m.user._id === user?._id
        );
        if (currentUserMember) {
          setReceivingPhone(currentUserMember.receivingPhone);
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch chama details');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await axios.get(`/api/chamas/${chamaId}/messages`);
      if (response.data.success) {
        setMessages(response.data.messages);
      }
    } catch (error: any) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleContribution = async () => {
    if (!phoneNumber) {
      toast.error('Please enter your phone number');
      return;
    }

    setContributionLoading(true);
    try {
      const response = await axios.post('/api/contributions', {
        chamaId,
        phoneNumber
      });

      if (response.data.success) {
        if (response.data.isCurrentReceiver) {
          // Special message for current receiver
          toast.success(response.data.message, { duration: 6000 });
          
          // Show additional info about the collection process
          setShowPaymentInfo(true);
          setTimeout(() => setShowPaymentInfo(false), 10000);
        } else {
          toast.success('STK Push sent! Please complete payment on your phone.');
        }
        fetchChamaDetails();
      }
    } catch (error: any) {
      if (error.response?.data?.isCurrentReceiver) {
        // Special handling for current receiver trying to pay to own number
        toast.error(error.response.data.message, { duration: 8000 });
        
        // Show suggestion
        const suggestion = error.response.data.suggestion;
        if (suggestion) {
          setTimeout(() => {
            toast.info(suggestion, { duration: 10000 });
          }, 2000);
        }
      } else {
        toast.error(error.response?.data?.message || 'Failed to initiate contribution');
      }
    } finally {
      setContributionLoading(false);
    }
  };

  const handleFinalizeOrdering = async () => {
    if (!chama) return;

    // Check if all members have receiving phone numbers
    const membersWithoutPhone = chama.members.filter(member => !member.receivingPhone);
    
    if (membersWithoutPhone.length > 0) {
      const memberNames = membersWithoutPhone.map(m => m.user.name).join(', ');
      const confirmMessage = `Some members (${memberNames}) haven't set their receiving phone numbers. We'll use their login phone numbers as default. They can update this later. Continue?`;
      
      if (!window.confirm(confirmMessage)) {
        return;
      }
    }

    setFinalizeLoading(true);
    try {
      const response = await axios.post(`/api/chamas/${chamaId}/finalize-ordering`);
      if (response.data.success) {
        toast.success('Chama started successfully! Member ordering has been finalized.');
        fetchChamaDetails();
        fetchMessages();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to start chama');
    } finally {
      setFinalizeLoading(false);
    }
  };

  const handleUpdateReceivingPhone = async () => {
    if (!receivingPhone) {
      toast.error('Please enter a phone number');
      return;
    }

    try {
      const response = await axios.patch(`/api/chamas/${chamaId}/update-phone`, {
        receivingPhone
      });

      if (response.data.success) {
        toast.success('Receiving phone number updated successfully');
        setEditingPhone(false);
        fetchChamaDetails();
        fetchMessages(); // Refresh to see the update notification
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update phone number');
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    setSendingMessage(true);
    try {
      const response = await axios.post(`/api/chamas/${chamaId}/messages`, {
        content: newMessage.trim()
      });

      if (response.data.success) {
        setMessages(prev => [...prev, response.data.message]);
        setNewMessage('');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const copyInviteCode = () => {
    if (chama) {
      navigator.clipboard.writeText(chama.inviteCode);
      toast.success('Invite code copied to clipboard!');
    }
  };

  const shareInviteLink = () => {
    if (chama) {
      const message = `Join my Chama "${chama.name}" on M-Chama! Use invite code: ${chama.inviteCode}\n\nVisit: https://dainty-kitten-f03bb6.netlify.app`;
      if (navigator.share) {
        navigator.share({
          title: 'Join My Chama',
          text: message,
          url: 'https://dainty-kitten-f03bb6.netlify.app'
        });
      } else {
        navigator.clipboard.writeText(message);
        toast.success('Invite message copied to clipboard!');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!chama) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-600">Chama not found</p>
      </div>
    );
  }

  const currentUserMember = chama.members.find(m => m.user._id === user?._id);
  const hasContributedThisCycle = contributions.some(c => 
    c.user.email === user?.email && c.cycle === chama.currentCycle && c.status === 'completed'
  );
  const currentReceiver = chama.members.find(m => 
    m.payoutOrder === chama.currentCycle && !m.hasReceived
  );
  const completedContributions = contributions.filter(c => c.status === 'completed').length;
  const totalRequired = chama.members.length;
  const isCurrentReceiver = currentReceiver?.user._id === user?._id;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </button>
        </div>
        
        {chama.isAdmin && (
          <div className="flex space-x-3">
            {!chama.isOrderingFinalized && (
              <button
                onClick={handleFinalizeOrdering}
                disabled={finalizeLoading || chama.members.length < 2}
                className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Shuffle className="w-4 h-4" />
                <span>{finalizeLoading ? 'Starting...' : 'Start Chama'}</span>
              </button>
            )}
            <button
              onClick={shareInviteLink}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Share2 className="w-4 h-4" />
              <span>Share Invite</span>
            </button>
            <button className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>
          </div>
        )}
      </div>

      {/* Payment Info Alert */}
      {showPaymentInfo && isCurrentReceiver && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <Info className="w-6 h-6 text-blue-600 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-blue-800">How Your Payment Works</h3>
              <div className="text-blue-700 mt-2 space-y-2">
                <p>Since it's your turn to receive, here's how the payment process works:</p>
                <ol className="list-decimal list-inside space-y-1 ml-4">
                  <li>Your contribution goes to admin <strong>{chama.admin.name}</strong> at {chama.admin.phone}</li>
                  <li>Admin collects all contributions from all members</li>
                  <li>When everyone has paid, you receive the full amount (KSh {(chama.contributionAmount * chama.members.length).toLocaleString()}) at {receivingPhone}</li>
                  <li>Net gain: KSh {((chama.contributionAmount * chama.members.length) - chama.contributionAmount).toLocaleString()}</li>
                </ol>
                <p className="text-sm text-blue-600 mt-3">
                  💡 This system ensures fairness - everyone contributes, and you receive the full pot!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chama Status */}
      {!chama.isOrderingFinalized && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-6 h-6 text-yellow-600 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-yellow-800">Chama Not Started Yet</h3>
              <p className="text-yellow-700 mt-1">
                {chama.isAdmin 
                  ? `You have ${chama.members.length} members. Click "Start Chama" to randomly assign payout order and begin contributions.`
                  : 'Waiting for admin to start the chama and assign payout order.'
                }
              </p>
              {chama.members.length < 2 && chama.isAdmin && (
                <p className="text-yellow-600 text-sm mt-2">
                  ⚠️ You need at least 2 members to start the chama.
                </p>
              )}
              {chama.isAdmin && (
                <div className="mt-3">
                  <p className="text-yellow-700 text-sm">
                    <Bell className="w-4 h-4 inline mr-1" />
                    When you start the chama:
                  </p>
                  <ul className="text-yellow-600 text-sm mt-1 ml-5 list-disc">
                    <li>Members will be randomly assigned payout order</li>
                    <li>First receiver will be notified</li>
                    <li>All members can start making contributions</li>
                    <li>Members without receiving phone numbers will use their login phone</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Chama Info */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{chama.name}</h1>
            <p className="text-gray-600 mt-2">{chama.description}</p>
            <div className="flex items-center space-x-4 mt-4">
              <span className="text-sm text-gray-500">
                Admin: <span className="font-medium">{chama.admin.name}</span> ({chama.admin.phone})
              </span>
              <span className="text-sm text-gray-500">
                Cycle: <span className="font-medium">{chama.currentCycle}</span>
              </span>
              {chama.isOrderingFinalized && (
                <span className="text-sm text-green-600 font-medium">
                  ✅ Started {new Date(chama.orderingDate!).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
          
          <div className="text-right">
            <div className="bg-green-100 rounded-lg p-4">
              <p className="text-sm text-green-600 font-medium">Monthly Contribution</p>
              <p className="text-2xl font-bold text-green-800">KSh {chama.contributionAmount.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Invite Code */}
        <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700">Invite Code</p>
            <p className="text-2xl font-mono font-bold text-gray-900">{chama.inviteCode}</p>
          </div>
          <button
            onClick={copyInviteCode}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Copy className="w-4 h-4" />
            <span>Copy</span>
          </button>
        </div>
      </div>

      {/* Receiving Phone Number Setup */}
      {currentUserMember && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Receiving Phone Number</h3>
          <div className="flex items-center space-x-4">
            {editingPhone ? (
              <>
                <div className="flex-1">
                  <input
                    type="tel"
                    value={receivingPhone}
                    onChange={(e) => setReceivingPhone(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="254712345678"
                  />
                </div>
                <button
                  onClick={handleUpdateReceivingPhone}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingPhone(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <div className="flex-1">
                  <p className="text-gray-600">When it's your turn, you'll receive money at:</p>
                  <p className="text-lg font-mono font-bold text-gray-900">{receivingPhone}</p>
                  {receivingPhone === user?.phone && (
                    <p className="text-sm text-blue-600">📱 Using your login phone number</p>
                  )}
                </div>
                <button
                  onClick={() => setEditingPhone(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Edit</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Current Receiver & Cycle Progress */}
      {currentReceiver && chama.isOrderingFinalized && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border border-green-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Current Receiver - Cycle {chama.currentCycle}</h3>
              <p className="text-gray-600">{currentReceiver.user.name}</p>
              <p className="text-sm text-gray-500">{currentReceiver.user.email}</p>
              <p className="text-sm text-gray-500">Will receive at: {currentReceiver.receivingPhone}</p>
              {currentReceiver.user._id === user?._id && (
                <p className="text-sm font-medium text-green-600 mt-1">
                  🎯 It's your turn! You'll receive the payout when everyone contributes.
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Expected Amount</p>
              <p className="text-2xl font-bold text-green-600">
                KSh {(chama.contributionAmount * chama.members.length).toLocaleString()}
              </p>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Contribution Progress</span>
              <span>{completedContributions}/{totalRequired} members paid</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${(completedContributions / totalRequired) * 100}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {completedContributions === totalRequired 
                ? '🎉 All members have contributed! Payout will be processed automatically.'
                : `${totalRequired - completedContributions} more ${totalRequired - completedContributions === 1 ? 'member needs' : 'members need'} to contribute.`
              }
            </p>
          </div>
        </div>
      )}

      {/* ENHANCED CONTRIBUTION SECTION - ALWAYS SHOW IF CHAMA IS STARTED AND USER IS MEMBER */}
      {chama.isOrderingFinalized && currentUserMember && (
        <div className={`rounded-xl shadow-sm border p-6 ${
          hasContributedThisCycle 
            ? 'bg-green-50 border-green-200' 
            : 'bg-white border-orange-300 border-2'
        }`}>
          {hasContributedThisCycle ? (
            // Already Contributed
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-green-800 mb-2">
                ✅ You've Contributed This Cycle!
              </h3>
              <p className="text-green-700 mb-4">
                Thank you for contributing KSh {chama.contributionAmount.toLocaleString()} to Cycle {chama.currentCycle}.
              </p>
              <div className="bg-white rounded-lg p-4 inline-block">
                <p className="text-sm text-gray-600">Waiting for other members:</p>
                <p className="text-lg font-bold text-gray-900">
                  {completedContributions}/{totalRequired} members have paid
                </p>
                {completedContributions === totalRequired && (
                  <p className="text-sm text-green-600 mt-2">
                    🎉 All paid! Payout processing automatically.
                  </p>
                )}
              </div>
            </div>
          ) : (
            // Need to Contribute
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <Target className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {isCurrentReceiver ? '💰 Your Turn to Receive!' : '💳 Time to Contribute!'}
                  </h3>
                  <p className="text-gray-600">
                    {isCurrentReceiver 
                      ? `You'll receive KSh ${(chama.contributionAmount * chama.members.length).toLocaleString()} when everyone contributes (including you!)`
                      : `Help ${currentReceiver?.user.name} reach their goal by contributing now.`
                    }
                  </p>
                </div>
              </div>

              {/* Special note for current receiver */}
              {isCurrentReceiver && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start space-x-2">
                    <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div className="text-blue-800 text-sm">
                      <p className="font-medium">Payment Collection Process:</p>
                      <p className="mt-1">Your contribution will be collected by admin <strong>{chama.admin.name}</strong> at {chama.admin.phone}, then you'll receive the full payout at {receivingPhone}.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Contribution Form */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-end space-x-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Phone className="w-4 h-4 inline mr-1" />
                      M-PESA Phone Number
                    </label>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="254712345678"
                    />
                  </div>
                  <button
                    onClick={handleContribution}
                    disabled={contributionLoading || !phoneNumber}
                    className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-lg hover:from-orange-700 hover:to-orange-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 disabled:transform-none"
                  >
                    {contributionLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-5 h-5" />
                        <span>Pay KSh {chama.contributionAmount.toLocaleString()}</span>
                      </>
                    )}
                  </button>
                </div>
                
                <div className="mt-3 flex items-center justify-between text-sm">
                  <p className="text-gray-600">
                    💡 You'll receive an STK Push on your phone
                  </p>
                  <p className="text-orange-600 font-medium">
                    {totalRequired - completedContributions} more needed
                  </p>
                </div>
              </div>

              {/* Urgency Indicator */}
              {!isCurrentReceiver && (
                <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-blue-800 text-sm">
                    <Bell className="w-4 h-4 inline mr-1" />
                    <strong>{currentReceiver?.user.name}</strong> is waiting for their payout. 
                    Your contribution helps complete this cycle!
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'members', label: 'Members' },
            { id: 'contributions', label: 'Contributions' },
            { id: 'chat', label: 'Group Chat' }
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
              {tab.id === 'chat' && <MessageCircle className="w-4 h-4 inline ml-1" />}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Members</p>
                <p className="text-3xl font-bold text-gray-900">{chama.members.length}</p>
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
                <p className="text-3xl font-bold text-gray-900">{chama.currentCycle}</p>
                <p className="text-sm text-gray-500">{completedContributions}/{totalRequired} contributed</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Cycle Progress</p>
                <p className="text-3xl font-bold text-gray-900">
                  {Math.round((completedContributions / totalRequired) * 100)}%
                </p>
                <p className="text-sm text-gray-500">
                  {completedContributions === totalRequired ? 'Complete!' : 'In Progress'}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'members' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Members ({chama.members.length})
            {chama.isOrderingFinalized && (
              <span className="text-sm font-normal text-green-600 ml-2">
                ✅ Payout order finalized
              </span>
            )}
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {chama.members
              .sort((a, b) => a.payoutOrder - b.payoutOrder)
              .map((member) => {
                const hasContributed = contributions.some(c => 
                  c.user.email === member.user.email && c.cycle === chama.currentCycle && c.status === 'completed'
                );
                const isCurrentReceiver = member.payoutOrder === chama.currentCycle && !member.hasReceived;
                
                return (
                  <div 
                    key={member.user._id} 
                    className={`p-4 border rounded-lg ${
                      isCurrentReceiver 
                        ? 'border-green-300 bg-green-50' 
                        : hasContributed 
                        ? 'border-blue-300 bg-blue-50'
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{member.user.name}</h4>
                      <div className="flex space-x-1">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          chama.isOrderingFinalized 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {chama.isOrderingFinalized ? `#${member.payoutOrder}` : 'Pending'}
                        </span>
                        {isCurrentReceiver && (
                          <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
                            Current
                          </span>
                        )}
                        {hasContributed && (
                          <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                            Paid
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">{member.user.email}</p>
                    <p className="text-sm text-gray-600">Login: {member.user.phone}</p>
                    <p className="text-sm text-gray-600">Receives: {member.receivingPhone}</p>
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
                );
              })}
          </div>
        </div>
      )}

      {activeTab === 'contributions' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Contributions - Cycle {chama.currentCycle}
          </h3>
          <div className="space-y-3">
            {contributions.map((contribution) => (
              <div key={contribution._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{contribution.user.name}</p>
                  <p className="text-sm text-gray-500">
                    Cycle {contribution.cycle} • KSh {contribution.amount.toLocaleString()} • {new Date(contribution.createdAt).toLocaleDateString()}
                  </p>
                  {contribution.mpesaCode && (
                    <p className="text-xs text-gray-500">M-PESA: {contribution.mpesaCode}</p>
                  )}
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
            
            {contributions.length === 0 && (
              <div className="text-center py-8">
                <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No contributions yet for this cycle</p>
                <p className="text-sm text-gray-500">Be the first to contribute!</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'chat' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Group Chat</h3>
          
          {/* Messages */}
          <div className="h-96 overflow-y-auto border border-gray-200 rounded-lg p-4 mb-4 space-y-3">
            {messages.map((message) => (
              <div key={message._id} className={`flex ${
                message.sender._id === user?._id ? 'justify-end' : 'justify-start'
              }`}>
                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.messageType === 'system' 
                    ? 'bg-blue-100 text-blue-800 text-center w-full'
                    : message.sender._id === user?._id
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-900'
                }`}>
                  {message.messageType !== 'system' && message.sender._id !== user?._id && (
                    <p className="text-xs font-medium mb-1">{message.sender.name}</p>
                  )}
                  <p className="text-sm">{message.content}</p>
                  <p className={`text-xs mt-1 ${
                    message.messageType === 'system' 
                      ? 'text-blue-600'
                      : message.sender._id === user?._id 
                      ? 'text-green-200' 
                      : 'text-gray-500'
                  }`}>
                    {new Date(message.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Send Message */}
          <div className="flex space-x-3">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Type your message..."
              maxLength={1000}
              disabled={sendingMessage}
            />
            <button
              onClick={handleSendMessage}
              disabled={sendingMessage || !newMessage.trim()}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-4 h-4" />
              <span>{sendingMessage ? 'Sending...' : 'Send'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChamaDetails;