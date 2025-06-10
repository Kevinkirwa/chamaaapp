import React, { useState, useEffect } from 'react';
import { X, Users, FileText, DollarSign, AlertCircle, Shield, CheckCircle } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface CreateChamaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateChamaModal: React.FC<CreateChamaModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    contributionAmount: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [verificationStatus, setVerificationStatus] = useState<{
    canCreateChamas: boolean;
    verificationRequest: any;
    role: string;
  } | null>(null);
  const [requestingVerification, setRequestingVerification] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchVerificationStatus();
    }
  }, [isOpen]);

  const fetchVerificationStatus = async () => {
    try {
      const response = await axios.get('/api/chamas/verification-status');
      if (response.data.success) {
        setVerificationStatus(response.data);
      }
    } catch (error: any) {
      console.error('Error fetching verification status:', error);
    }
  };

  const requestVerification = async () => {
    setRequestingVerification(true);
    try {
      const response = await axios.post('/api/chamas/request-verification');
      if (response.data.success) {
        toast.success('Verification request submitted successfully!');
        fetchVerificationStatus();
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to submit verification request';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setRequestingVerification(false);
    }
  };

  if (!isOpen) return null;

  // Show verification required screen
  if (verificationStatus && !verificationStatus.canCreateChamas) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Verification Required</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Approval Required to Create Chamas
              </h3>
              <p className="text-gray-600">
                To maintain security and prevent spam, only verified users can create new Chamas.
              </p>
            </div>

            {verificationStatus.verificationRequest.status === 'none' && (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Why do we require verification?</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Prevents spam and fake Chamas</li>
                    <li>• Ensures serious commitment to savings groups</li>
                    <li>• Maintains trust within the community</li>
                    <li>• Protects all members from fraud</li>
                  </ul>
                </div>

                <button
                  onClick={requestVerification}
                  disabled={requestingVerification}
                  className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {requestingVerification ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Submitting Request...</span>
                    </div>
                  ) : (
                    'Request Verification'
                  )}
                </button>
              </div>
            )}

            {verificationStatus.verificationRequest.status === 'pending' && (
              <div className="text-center">
                <div className="w-16 h-16 bg-yellow-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-yellow-600" />
                </div>
                <h4 className="font-medium text-gray-900 mb-2">Verification Pending</h4>
                <p className="text-gray-600 mb-4">
                  Your verification request is being reviewed by our admin team. 
                  You'll be notified once it's approved.
                </p>
                <p className="text-sm text-gray-500">
                  Submitted on {new Date(verificationStatus.verificationRequest.requestedAt).toLocaleDateString()}
                </p>
              </div>
            )}

            {verificationStatus.verificationRequest.status === 'rejected' && (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <X className="w-8 h-8 text-red-600" />
                  </div>
                  <h4 className="font-medium text-gray-900 mb-2">Verification Rejected</h4>
                  <p className="text-gray-600 mb-4">
                    Your verification request was not approved.
                  </p>
                  {verificationStatus.verificationRequest.rejectionReason && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                      <p className="text-sm text-red-800">
                        <strong>Reason:</strong> {verificationStatus.verificationRequest.rejectionReason}
                      </p>
                    </div>
                  )}
                </div>

                <button
                  onClick={requestVerification}
                  disabled={requestingVerification}
                  className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {requestingVerification ? 'Submitting...' : 'Request Verification Again'}
                </button>
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                You can still join existing Chamas using invite codes while waiting for verification.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Client-side validation
    if (!formData.name.trim()) {
      setError('Chama name is required');
      setLoading(false);
      return;
    }

    if (!formData.description.trim()) {
      setError('Description is required');
      setLoading(false);
      return;
    }

    const amount = parseFloat(formData.contributionAmount);
    if (!amount || amount < 100) {
      setError('Contribution amount must be at least KSh 100');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post('/api/chamas', {
        name: formData.name.trim(),
        description: formData.description.trim(),
        contributionAmount: amount
      });

      if (response.data.success) {
        toast.success('Chama created successfully!');
        onSuccess();
        onClose();
        setFormData({ name: '', description: '', contributionAmount: '' });
        setError('');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to create chama';
      setError(errorMessage);
      
      if (error.response?.data?.requiresVerification) {
        fetchVerificationStatus();
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setError(''); // Clear error when user starts typing
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({ name: '', description: '', contributionAmount: '' });
      setError('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-semibold text-gray-900">Create New Chama</h2>
            {verificationStatus?.canCreateChamas && (
              <div className="flex items-center space-x-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                <CheckCircle className="w-3 h-3" />
                <span>Verified</span>
              </div>
            )}
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Display */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-red-800 text-sm font-medium">Error</p>
                <p className="text-red-700 text-sm mt-1">{error}</p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chama Name
            </label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                placeholder="Enter chama name"
                required
                disabled={loading}
                maxLength={100}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all resize-none"
                placeholder="Describe your chama's purpose"
                required
                disabled={loading}
                maxLength={500}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {formData.description.length}/500 characters
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Monthly Contribution (KSh)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="number"
                name="contributionAmount"
                value={formData.contributionAmount}
                onChange={handleChange}
                min="100"
                max="1000000"
                step="50"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                placeholder="1000"
                required
                disabled={loading}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Minimum amount is KSh 100, maximum is KSh 1,000,000
            </p>
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating...</span>
                </div>
              ) : (
                'Create Chama'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateChamaModal;