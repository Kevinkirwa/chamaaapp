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
  Info,
  Smartphone,
  Shield,
  Star,
  Gift,
  Loader,
  Building2,
  ArrowDownCircle,
  ArrowUpCircle,
  RefreshCw,
  X
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
  checkoutRequestId?: string;
  statusMessage?: string;
  nextAction?: string;
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
  userIsMember?: boolean;
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
  
  // NEW: Track pending payment
  const [pendingContribution, setPendingContribution] = useState<Contribution | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);

  useEffect(() => {
    if (chamaId) {
      fetchChamaDetails();
      fetchMessages();
    }
  }, [chamaId]);

  // NEW: Auto-check payment status for pending payments
  useEffect(() => {
    let statusInterval: NodeJS.Timeout;

    if (pendingContribution && (pendingContribution.status === 'pending' || pendingContribution.status === 'processing')) {
      statusInterval = setInterval(() => {
        checkContributionStatus(pendingContribution._id);
      }, 5000); // Check every 5 seconds
    }

    return () => {
      if (statusInterval) {
        clearInterval(statusInterval);
      }
    };
  }, [pendingContribution]);

  const fetchChamaDetails = async () => {
    try {
      console.log('🔍 Fetching chama details for:', chamaId);
      const response = await axios.get(`/api/chamas/${chamaId}`);
      if (response.data.success) {
        const chamaData = response.data.chama;
        const statsData = response.data.stats;
        
        console.log('✅ Chama data received:', {
          name: chamaData.name,
          userIsMember: chamaData.userIsMember,
          isAdmin: chamaData.isAdmin,
          memberCount: chamaData.members.length,
          userMember: statsData.userMember
        });
        
        setChama(chamaData);
        setContributions(response.data.contributions);
        
        // Check for pending contribution
        const userPendingContribution = response.data.contributions.find((c: Contribution) => 
          c.user.email === user?.email && 
          c.cycle === chamaData.currentCycle && 
          (c.status === 'pending' || c.status === 'processing')
        );
        
        if (userPendingContribution) {
          setPendingContribution(userPendingContribution);
          console.log('⏳ Found pending contribution:', userPendingContribution._id);
        } else {
          setPendingContribution(null);
        }
        
        // Set user's receiving phone from their member data
        if (statsData.userMember) {
          setReceivingPhone(statsData.userMember.receivingPhone || user?.phone || '');
        } else {
          // Fallback: find user in members array
          const currentUserMember = chamaData.members.find(
            (m: Member) => m.user._id === user?._id
          );
          if (currentUserMember) {
            setReceivingPhone(currentUserMember.receivingPhone || user?.phone || '');
          }
        }
      }
    } catch (error: any) {
      console.error('❌ Error fetching chama details:', error);
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

  // NEW: Check contribution status
  const checkContributionStatus = async (contributionId: string) => {
    try {
      setCheckingStatus(true);
      const response = await axios.get(`/api/contributions/${contributionId}/status`);
      if (response.data.success) {
        const updatedContribution = response.data.contribution;
        
        // Update pending contribution
        setPendingContribution(updatedContribution);
        
        // If status changed to completed, failed, or cancelled, refresh the page
        if (['completed', 'failed', 'cancelled'].includes(updatedContribution.status)) {
          console.log(`✅ Payment status changed to: ${updatedContribution.status}`);
          
          if (updatedContribution.status === 'completed') {
            toast.success('🎉 Payment completed successfully!');
          } else if (updatedContribution.status === 'cancelled') {
            toast.error('❌ Payment was cancelled');
          } else if (updatedContribution.status === 'failed') {
            toast.error(`❌ Payment failed: ${updatedContribution.failureReason || 'Unknown error'}`);
          }
          
          // Refresh chama details
          setTimeout(() => {
            fetchChamaDetails();
          }, 1000);
        }
      }
    } catch (error: any) {
      console.error('Error checking contribution status:', error);
    } finally {
      setCheckingStatus(false);
    }
  };

  // NEW: Cancel pending payment
  const cancelPendingPayment = async () => {
    if (!pendingContribution) return;

    try {
      const response = await axios.post(`/api/contributions/${pendingContribution._id}/cancel`);
      if (response.data.success) {
        toast.success('Payment cancelled successfully');
        setPendingContribution(null);
        fetchChamaDetails();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to cancel payment');
    }
  };

  // NEW: Simulate payment success (development only)
  const simulatePaymentSuccess = async () => {
    if (!pendingContribution || process.env.NODE_ENV === 'production') return;

    try {
      const response = await axios.post(`/api/contributions/${pendingContribution._id}/simulate-success`);
      if (response.data.success) {
        toast.success('🧪 Payment success simulated');
        // Status will be updated by the auto-check interval
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to simulate payment');
    }
  };

  const handleContribution = async () => {
    if (!phoneNumber) {
      toast.error('Please enter your phone number');
      return;
    }

    // Validate phone number format
    const cleanPhone = phoneNumber.replace(/\s+/g, '');
    if (!/^(0\d{9}|254\d{9}|\+254\d{9})$/.test(cleanPhone)) {
      toast.error('Please enter a valid Kenyan phone number (e.g., 0712345678)');
      return;
    }

    setContributionLoading(true);
    try {
      const response = await axios.post('/api/contributions', {
        chamaId,
        phoneNumber: cleanPhone
      });

      if (response.data.success) {
        // Enhanced success message with payment info
        const { isCurrentReceiver, paymentInfo, contribution } = response.data;
        
        // Set the pending contribution for status tracking
        setPendingContribution(contribution);
        
        if (isCurrentReceiver) {
          toast.success(
            `🎯 STK Push sent! You'll contribute KSh ${paymentInfo.amount.toLocaleString()} and receive KSh ${paymentInfo.totalPayout.toLocaleString()} (Net gain: KSh ${paymentInfo.netGain.toLocaleString()})`,
            { duration: 8000 }
          );
        } else {
          toast.success('📱 STK Push sent to your phone! Please enter your M-PESA PIN to complete the payment.', { duration: 6000 });
        }
        
        // Show payment info modal for a few seconds
        setShowPaymentInfo(true);
        setTimeout(() => setShowPaymentInfo(false), 10000);
        
        fetchChamaDetails();
      }
    } catch (error: any) {
      console.error('❌ Contribution error:', error);
      
      if (error.response?.data?.contributionId) {
        // There's already a payment in progress
        const contributionId = error.response.data.contributionId;
        checkContributionStatus(contributionId);
      }
      
      if (error.response?.data?.troubleshooting) {
        // Show detailed troubleshooting info
        const troubleshooting = error.response.data.troubleshooting;
        toast.error(error.response.data.message, { duration: 6000 });
        
        setTimeout(() => {
          toast.info(`💡 Troubleshooting: ${troubleshooting.checkPhone}`, { duration: 5000 });
        }, 2000);
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
        toast.success('🎉 Chama started successfully! Member ordering has been finalized.');
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
        toast.success('📱 Receiving phone number updated successfully');
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
      toast.success('📋 Invite code copied to clipboard!');
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
        toast.success('📤 Invite message copied to clipboard!');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your Chama...</p>
        </div>
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

  // ENHANCED: Better member detection
  const currentUserMember = chama.members.find(m => m.user._id === user?._id);
  const isUserMember = !!currentUserMember || chama.isAdmin || chama.userIsMember;
  
  const hasContributedThisCycle = contributions.some(c => 
    c.user.email === user?.email && c.cycle === chama.currentCycle && c.status === 'completed'
  );
  
  const currentReceiver = chama.members.find(m => 
    m.payoutOrder === chama.currentCycle && !m.hasReceived
  );
  
  const completedContributions = contributions.filter(c => c.status === 'completed').length;
  const totalRequired = chama.members.length;
  const isCurrentReceiver = currentReceiver?.user._id === user?._id;

  // FIXED: More comprehensive check for showing contribution section
  const shouldShowContribution = () => {
    // Must be a member
    if (!isUserMember) {
      console.log('❌ Not showing contribution: User is not a member');
      return false;
    }
    
    // Must not have contributed this cycle
    if (hasContributedThisCycle) {
      console.log('❌ Not showing contribution: Already contributed this cycle');
      return false;
    }
    
    // Must not have pending payment
    if (pendingContribution) {
      console.log('❌ Not showing contribution: Payment in progress');
      return false;
    }
    
    // Chama must be started (ordering finalized)
    if (!chama.isOrderingFinalized) {
      console.log('❌ Not showing contribution: Chama not started yet');
      return false;
    }
    
    console.log('✅ Showing contribution section');
    return true;
  };

  // NEW: Pending Payment Section
  const PendingPaymentSection = () => {
    if (!pendingContribution) return null;

    return (
      <div className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-2xl p-8 text-white shadow-2xl mb-8">
        <div className="text-center">
          <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <Clock className="w-10 h-10 text-white" />
          </div>
          
          <h2 className="text-3xl font-bold mb-4">⏳ PAYMENT IN PROGRESS</h2>
          
          <div className="bg-white bg-opacity-20 backdrop-blur-md rounded-2xl p-6 mb-6">
            <p className="text-xl mb-4">
              {pendingContribution.statusMessage || 'Waiting for payment completion...'}
            </p>
            
            <div className="text-lg text-yellow-200 mb-4">
              <strong>Next Action:</strong> {pendingContribution.nextAction || 'Check your phone for M-PESA notification'}
            </div>
            
            <div className="flex items-center justify-center space-x-4 text-sm">
              <div className="flex items-center space-x-2">
                <Smartphone className="w-4 h-4" />
                <span>Amount: KSh {chama.contributionAmount.toLocaleString()}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>Status: {pendingContribution.status}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-center space-x-4">
            <button
              onClick={() => checkContributionStatus(pendingContribution._id)}
              disabled={checkingStatus}
              className="flex items-center space-x-2 px-6 py-3 bg-white bg-opacity-20 text-white rounded-xl hover:bg-opacity-30 disabled:opacity-50 transition-all"
            >
              <RefreshCw className={`w-5 h-5 ${checkingStatus ? 'animate-spin' : ''}`} />
              <span>{checkingStatus ? 'Checking...' : 'Check Status'}</span>
            </button>
            
            <button
              onClick={cancelPendingPayment}
              className="flex items-center space-x-2 px-6 py-3 bg-red-600 bg-opacity-80 text-white rounded-xl hover:bg-opacity-100 transition-all"
            >
              <X className="w-5 h-5" />
              <span>Cancel Payment</span>
            </button>
            
            {process.env.NODE_ENV !== 'production' && (
              <button
                onClick={simulatePaymentSuccess}
                className="flex items-center space-x-2 px-6 py-3 bg-green-600 bg-opacity-80 text-white rounded-xl hover:bg-opacity-100 transition-all"
              >
                <CheckCircle className="w-5 h-5" />
                <span>🧪 Simulate Success</span>
              </button>
            )}
          </div>
          
          <div className="mt-6 text-white text-opacity-90">
            <p className="text-sm">
              💡 If you cancelled the payment on your phone, click "Cancel Payment" above
            </p>
            <p className="text-xs mt-2">
              Payment will automatically timeout after 5 minutes if not completed
            </p>
          </div>
        </div>
      </div>
    );
  };

  // ENHANCED CONTRIBUTION COMPONENT - BEAUTIFUL DESIGN WITH BUSINESS ACCOUNT EXPLANATION
  const ContributionSection = () => {
    if (!shouldShowContribution()) {
      return null;
    }

    return (
      <div className="relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-green-500 to-teal-500 opacity-90"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-green-400 via-blue-500 to-purple-500 opacity-70 animate-pulse"></div>
        
        <div className="relative bg-white bg-opacity-10 backdrop-blur-sm rounded-3xl p-8 text-white shadow-2xl border border-white border-opacity-20 mb-8">
          <div className="text-center">
            {/* Animated Icon */}
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className="absolute inset-0 bg-white bg-opacity-20 rounded-full animate-ping"></div>
              <div className="relative w-24 h-24 bg-white bg-opacity-30 rounded-full flex items-center justify-center">
                {isCurrentReceiver ? (
                  <Gift className="w-12 h-12 text-white animate-bounce" />
                ) : (
                  <Building2 className="w-12 h-12 text-white animate-pulse" />
                )}
              </div>
            </div>

            {/* Dynamic Title */}
            <h2 className="text-4xl font-bold mb-4 animate-fade-in">
              {isCurrentReceiver ? (
                <>🎯 YOUR GOLDEN MOMENT!</>
              ) : (
                <>💳 CONTRIBUTE TO THE POT!</>
              )}
            </h2>

            {/* Business Account Explanation */}
            <div className="bg-white bg-opacity-20 backdrop-blur-md rounded-2xl p-6 mb-6 border border-white border-opacity-30">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <Building2 className="w-6 h-6 text-yellow-300" />
                <h3 className="text-xl font-bold text-yellow-300">How M-Chama Works</h3>
                <Shield className="w-6 h-6 text-yellow-300" />
              </div>
              
              <div className="grid md:grid-cols-2 gap-6 text-left">
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <ArrowUpCircle className="w-5 h-5 text-green-300 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-green-200">1. You Pay to M-Chama</p>
                      <p className="text-sm text-white text-opacity-90">Your KSh {chama.contributionAmount.toLocaleString()} goes to our secure business account</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <Users className="w-5 h-5 text-blue-300 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-blue-200">2. All Members Contribute</p>
                      <p className="text-sm text-white text-opacity-90">We collect from all {chama.members.length} members safely</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <ArrowDownCircle className="w-5 h-5 text-purple-300 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-purple-200">3. Automatic Payout</p>
                      <p className="text-sm text-white text-opacity-90">We send KSh {(chama.contributionAmount * chama.members.length).toLocaleString()} to {isCurrentReceiver ? 'you' : currentReceiver?.user.name}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <Shield className="w-5 h-5 text-yellow-300 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-yellow-200">4. 100% Secure</p>
                      <p className="text-sm text-white text-opacity-90">Licensed business account with full audit trail</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <p className="text-xl mb-6 text-white text-opacity-90 leading-relaxed">
              {isCurrentReceiver ? (
                <>
                  You'll contribute <span className="font-bold">KSh {chama.contributionAmount.toLocaleString()}</span> to the M-Chama business account and receive{' '}
                  <span className="font-bold text-yellow-300">KSh {(chama.contributionAmount * chama.members.length).toLocaleString()}</span> when everyone pays!
                  <br />
                  <span className="text-lg text-yellow-200">
                    Net gain: KSh {((chama.contributionAmount * chama.members.length) - chama.contributionAmount).toLocaleString()} 🎉
                  </span>
                </>
              ) : (
                <>
                  Help <span className="font-bold text-yellow-300">{currentReceiver?.user.name}</span> by contributing{' '}
                  <span className="font-bold">KSh {chama.contributionAmount.toLocaleString()}</span> to the secure M-Chama business account.
                  <br />
                  <span className="text-lg text-blue-200">
                    Your money is safe and will be automatically sent to {currentReceiver?.user.name} when everyone contributes.
                  </span>
                </>
              )}
            </p>
            
            {/* Enhanced Payment Form */}
            <div className="bg-white bg-opacity-20 backdrop-blur-md rounded-2xl p-6 max-w-md mx-auto border border-white border-opacity-30">
              <div className="space-y-6">
                {/* Phone Input */}
                <div>
                  <label className="block text-white text-sm font-medium mb-3 flex items-center justify-center space-x-2">
                    <Smartphone className="w-4 h-4" />
                    <span>Your M-PESA Phone Number</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 rounded-xl text-gray-900 placeholder-gray-500 focus:ring-4 focus:ring-white focus:ring-opacity-50 focus:outline-none text-lg font-medium border-2 border-white border-opacity-30"
                      placeholder="0712345678"
                    />
                  </div>
                  <p className="text-xs text-white text-opacity-70 mt-2 flex items-center justify-center space-x-1">
                    <Shield className="w-3 h-3" />
                    <span>Secure payment to M-Chama business account</span>
                  </p>
                </div>

                {/* Payment Button */}
                <button
                  onClick={handleContribution}
                  disabled={contributionLoading || !phoneNumber}
                  className="w-full bg-white text-blue-600 px-8 py-5 rounded-xl font-bold text-xl hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 disabled:transform-none shadow-2xl border-4 border-white border-opacity-50"
                >
                  {contributionLoading ? (
                    <div className="flex items-center justify-center space-x-3">
                      <Loader className="w-6 h-6 animate-spin" />
                      <span>Processing Payment...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-3">
                      <Building2 className="w-6 h-6" />
                      <span>PAY KSh {chama.contributionAmount.toLocaleString()}</span>
                      <Star className="w-6 h-6 text-yellow-500" />
                    </div>
                  )}
                </button>
              </div>
            </div>
            
            {/* Progress Info */}
            <div className="mt-6 text-white text-opacity-90">
              <div className="flex items-center justify-center space-x-6 text-sm">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>{completedContributions} paid</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4" />
                  <span>{totalRequired - completedContributions} remaining</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4" />
                  <span>KSh {(chama.contributionAmount * chama.members.length).toLocaleString()} total</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // SUCCESS STATE - Already contributed
  const SuccessSection = () => {
    if (!hasContributedThisCycle || !chama.isOrderingFinalized) return null;

    return (
      <div className="bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl p-8 text-white shadow-2xl mb-8">
        <div className="text-center">
          <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold mb-4">✅ CONTRIBUTION COMPLETE!</h2>
          <p className="text-xl mb-4 text-green-100">
            Thank you for contributing KSh {chama.contributionAmount.toLocaleString()} to Cycle {chama.currentCycle}
          </p>
          <div className="bg-white bg-opacity-20 rounded-xl p-4 inline-block">
            <p className="text-lg font-bold">
              {completedContributions}/{totalRequired} members have paid to M-Chama business account
            </p>
            {completedContributions === totalRequired ? (
              <p className="text-green-200 mt-2">🎉 All paid! Automatic payout processing to {currentReceiver?.user.name}.</p>
            ) : (
              <p className="text-blue-200 mt-2">Waiting for {totalRequired - completedContributions} more members to contribute</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  // DEBUG SECTION - Shows current state for troubleshooting
  const DebugSection = () => {
    if (process.env.NODE_ENV !== 'development') return null;

    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
        <h4 className="font-bold text-yellow-800">Debug Info:</h4>
        <div className="text-sm text-yellow-700 mt-2">
          <p>• User is member: {isUserMember ? '✅' : '❌'}</p>
          <p>• Current user member object: {currentUserMember ? '✅' : '❌'}</p>
          <p>• Chama.userIsMember: {chama.userIsMember ? '✅' : '❌'}</p>
          <p>• Is admin: {chama.isAdmin ? '✅' : '❌'}</p>
          <p>• Has contributed this cycle: {hasContributedThisCycle ? '✅' : '❌'}</p>
          <p>• Has pending payment: {pendingContribution ? '✅' : '❌'}</p>
          <p>• Chama is started: {chama.isOrderingFinalized ? '✅' : '❌'}</p>
          <p>• Should show contribution: {shouldShowContribution() ? '✅' : '❌'}</p>
          <p>• Current cycle: {chama.currentCycle}</p>
          <p>• Contributions count: {contributions.length}</p>
          <p>• User email: {user?.email}</p>
          <p>• Member count: {chama.members.length}</p>
          {pendingContribution && (
            <p>• Pending payment status: {pendingContribution.status}</p>
          )}
        </div>
      </div>
    );
  };

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

      {/* DEBUG SECTION */}
      <DebugSection />

      {/* PAYMENT SECTIONS - ALWAYS VISIBLE WHEN NEEDED */}
      <PendingPaymentSection />
      <SuccessSection />
      <ContributionSection />

      {/* Payment Info Alert */}
      {showPaymentInfo && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <Info className="w-6 h-6 text-blue-600 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-blue-800">M-Chama Payment Process</h3>
              <div className="text-blue-700 mt-2 space-y-2">
                <p>📱 <strong>Step 1:</strong> STK Push sent to your phone</p>
                <p>🔐 <strong>Step 2:</strong> Enter your M-PESA PIN to pay M-Chama business account</p>
                <p>✅ <strong>Step 3:</strong> Payment confirmed and recorded automatically</p>
                <p>💰 <strong>Step 4:</strong> {isCurrentReceiver ? 'You receive automatic payout when everyone pays' : 'Receiver gets automatic payout when cycle completes'}</p>
                <p>🏢 <strong>Security:</strong> All money flows through licensed M-Chama business account</p>
                <p>📞 <strong>Callback URL:</strong> https://chamaaapp.onrender.com/api/mpesa/callback/contribution</p>
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
                    <li>All members can start making contributions to M-Chama business account</li>
                    <li>Automatic payouts will be processed when cycles complete</li>
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
      {isUserMember && (
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
                  <p className="text-gray-600">When it's your turn, M-Chama will send money to:</p>
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
                ? '🎉 All members have contributed! Automatic payout will be processed to the receiver.'
                : `${totalRequired - completedContributions} more ${totalRequired - completedContributions === 1 ? 'member needs' : 'members need'} to contribute.`
              }
            </p>
          </div>
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
                  {contribution.statusMessage && (
                    <p className="text-xs text-blue-600">{contribution.statusMessage}</p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {contribution.status === 'completed' ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : contribution.status === 'failed' ? (
                    <XCircle className="w-5 h-5 text-red-600" />
                  ) : contribution.status === 'cancelled' ? (
                    <X className="w-5 h-5 text-orange-600" />
                  ) : (
                    <Clock className="w-5 h-5 text-yellow-600" />
                  )}
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    contribution.status === 'completed' ? 'bg-green-100 text-green-800' :
                    contribution.status === 'failed' ? 'bg-red-100 text-red-800' :
                    contribution.status === 'cancelled' ? 'bg-orange-100 text-orange-800' :
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
                <p className="text-sm text-gray-500">Be the first to contribute to the M-Chama business account!</p>
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