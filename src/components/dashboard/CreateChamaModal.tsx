import React, { useState, useEffect } from 'react';
import { X, Users, FileText, DollarSign, AlertCircle, Shield, CheckCircle, Upload, Camera, User, Calendar, MapPin, Phone } from 'lucide-react';
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
    verificationProgress: number;
    hasCompleteDocuments: boolean;
    role: string;
  } | null>(null);
  const [requestingVerification, setRequestingVerification] = useState(false);
  const [showVerificationForm, setShowVerificationForm] = useState(false);
  
  // Verification form data
  const [verificationData, setVerificationData] = useState({
    nationalId: '',
    fullName: '',
    dateOfBirth: '',
    placeOfBirth: '',
    idFrontPhoto: '',
    idBackPhoto: '',
    selfiePhoto: ''
  });

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

  const handleFileUpload = (field: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        setVerificationData(prev => ({
          ...prev,
          [field]: base64
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const requestVerification = async () => {
    setRequestingVerification(true);
    setError('');

    try {
      // Validate all fields
      if (!verificationData.nationalId || !verificationData.fullName || 
          !verificationData.dateOfBirth || !verificationData.placeOfBirth) {
        setError('All personal details are required');
        setRequestingVerification(false);
        return;
      }

      if (!verificationData.idFrontPhoto || !verificationData.idBackPhoto || !verificationData.selfiePhoto) {
        setError('All document photos are required');
        setRequestingVerification(false);
        return;
      }

      // Validate National ID format
      if (!/^\d{8}$/.test(verificationData.nationalId)) {
        setError('Please enter a valid 8-digit Kenya National ID number');
        setRequestingVerification(false);
        return;
      }

      const response = await axios.post('/api/chamas/request-verification', verificationData);
      if (response.data.success) {
        toast.success('Verification request with documents submitted successfully!');
        fetchVerificationStatus();
        setShowVerificationForm(false);
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
        <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Kenya National ID Verification Required</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6">
            {!showVerificationForm ? (
              <div>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-8 h-8 text-orange-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Document Verification Required
                  </h3>
                  <p className="text-gray-600">
                    To create Chamas and ensure accountability, you must verify your identity with Kenya National ID documents.
                  </p>
                </div>

                {verificationStatus.verificationRequest.status === 'none' && (
                  <div className="space-y-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-medium text-blue-900 mb-2">Required Documents:</h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Kenya National ID (Front Photo)</li>
                        <li>• Kenya National ID (Back Photo)</li>
                        <li>• Clear Selfie Photo</li>
                        <li>• Phone number registered with the ID</li>
                      </ul>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <h4 className="font-medium text-yellow-900 mb-2">Why we require this:</h4>
                      <ul className="text-sm text-yellow-800 space-y-1">
                        <li>• Prevents fraud and fake accounts</li>
                        <li>• Ensures accountability in financial groups</li>
                        <li>• Protects all members from scams</li>
                        <li>• Maintains trust in the community</li>
                        <li>• Complies with financial regulations</li>
                      </ul>
                    </div>

                    <button
                      onClick={() => setShowVerificationForm(true)}
                      className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all"
                    >
                      Start Verification Process
                    </button>
                  </div>
                )}

                {verificationStatus.verificationRequest.status === 'pending' && (
                  <div className="text-center">
                    <div className="w-16 h-16 bg-yellow-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <AlertCircle className="w-8 h-8 text-yellow-600" />
                    </div>
                    <h4 className="font-medium text-gray-900 mb-2">Verification Under Review</h4>
                    <p className="text-gray-600 mb-4">
                      Your documents are being reviewed by our admin team. 
                      You'll be notified once verification is complete.
                    </p>
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span>Verification Progress</span>
                        <span>{verificationStatus.verificationProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${verificationStatus.verificationProgress}%` }}
                        ></div>
                      </div>
                    </div>
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
                      onClick={() => setShowVerificationForm(true)}
                      className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all"
                    >
                      Submit New Verification Request
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Submit Your Verification Documents
                  </h3>
                  <p className="text-gray-600">
                    Please provide accurate information and clear photos of your documents
                  </p>
                </div>

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

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Personal Information */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900 flex items-center">
                      <User className="w-4 h-4 mr-2" />
                      Personal Information
                    </h4>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Kenya National ID Number
                      </label>
                      <input
                        type="text"
                        value={verificationData.nationalId}
                        onChange={(e) => setVerificationData(prev => ({ ...prev, nationalId: e.target.value.replace(/\D/g, '').slice(0, 8) }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="12345678"
                        maxLength={8}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name (as on ID)
                      </label>
                      <input
                        type="text"
                        value={verificationData.fullName}
                        onChange={(e) => setVerificationData(prev => ({ ...prev, fullName: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="John Doe Mwangi"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date of Birth
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="date"
                          value={verificationData.dateOfBirth}
                          onChange={(e) => setVerificationData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Place of Birth
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="text"
                          value={verificationData.placeOfBirth}
                          onChange={(e) => setVerificationData(prev => ({ ...prev, placeOfBirth: e.target.value }))}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Nairobi, Kenya"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Document Uploads */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900 flex items-center">
                      <Camera className="w-4 h-4 mr-2" />
                      Document Photos
                    </h4>

                    {/* ID Front Photo */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        National ID Front Photo
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
                        {verificationData.idFrontPhoto ? (
                          <div className="space-y-2">
                            <img 
                              src={verificationData.idFrontPhoto} 
                              alt="ID Front" 
                              className="w-full h-32 object-cover rounded-lg"
                            />
                            <p className="text-sm text-green-600">✓ Front photo uploaded</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Upload className="w-8 h-8 text-gray-400 mx-auto" />
                            <p className="text-sm text-gray-600">Upload front side of your ID</p>
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileUpload('idFrontPhoto', e)}
                          className="hidden"
                          id="idFrontPhoto"
                        />
                        <label
                          htmlFor="idFrontPhoto"
                          className="mt-2 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
                        >
                          Choose File
                        </label>
                      </div>
                    </div>

                    {/* ID Back Photo */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        National ID Back Photo
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
                        {verificationData.idBackPhoto ? (
                          <div className="space-y-2">
                            <img 
                              src={verificationData.idBackPhoto} 
                              alt="ID Back" 
                              className="w-full h-32 object-cover rounded-lg"
                            />
                            <p className="text-sm text-green-600">✓ Back photo uploaded</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Upload className="w-8 h-8 text-gray-400 mx-auto" />
                            <p className="text-sm text-gray-600">Upload back side of your ID</p>
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileUpload('idBackPhoto', e)}
                          className="hidden"
                          id="idBackPhoto"
                        />
                        <label
                          htmlFor="idBackPhoto"
                          className="mt-2 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
                        >
                          Choose File
                        </label>
                      </div>
                    </div>

                    {/* Selfie Photo */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Selfie Photo
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
                        {verificationData.selfiePhoto ? (
                          <div className="space-y-2">
                            <img 
                              src={verificationData.selfiePhoto} 
                              alt="Selfie" 
                              className="w-full h-32 object-cover rounded-lg"
                            />
                            <p className="text-sm text-green-600">✓ Selfie uploaded</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Camera className="w-8 h-8 text-gray-400 mx-auto" />
                            <p className="text-sm text-gray-600">Upload a clear selfie photo</p>
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileUpload('selfiePhoto', e)}
                          className="hidden"
                          id="selfiePhoto"
                        />
                        <label
                          htmlFor="selfiePhoto"
                          className="mt-2 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
                        >
                          Choose File
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-medium text-yellow-900 mb-2">Important Notes:</h4>
                  <ul className="text-sm text-yellow-800 space-y-1">
                    <li>• Ensure all photos are clear and readable</li>
                    <li>• Your phone number must be registered with this National ID</li>
                    <li>• Verification typically takes 24-48 hours</li>
                    <li>• False information will result in permanent account suspension</li>
                  </ul>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowVerificationForm(false)}
                    disabled={requestingVerification}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Back
                  </button>
                  <button
                    onClick={requestVerification}
                    disabled={requestingVerification}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {requestingVerification ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Submitting...</span>
                      </div>
                    ) : (
                      'Submit Verification Request'
                    )}
                  </button>
                </div>
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
    if (!amount || amount < 1) {
      setError('Contribution amount must be at least KSh 1');
      setLoading(false);
      return;
    }

    // UPDATED: Removed maximum limit for testing purposes
    if (amount > 10000000) {
      setError('Contribution amount cannot exceed KSh 10,000,000');
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
                min="1"
                max="10000000"
                step="1"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                placeholder="1"
                required
                disabled={loading}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Minimum amount is KSh 1, maximum is KSh 10,000,000 (perfect for testing!)
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