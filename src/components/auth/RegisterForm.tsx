import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { User, Mail, Phone, Lock, Eye, EyeOff, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface RegisterFormProps {
  onToggleForm: () => void;
  onBackToHome?: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onToggleForm, onBackToHome }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});
  const { register } = useAuth();

  const validateField = (name: string, value: string) => {
    const errors: {[key: string]: string} = {};

    switch (name) {
      case 'name':
        if (!value.trim()) {
          errors.name = 'Name is required';
        } else if (value.trim().length < 2) {
          errors.name = 'Name must be at least 2 characters';
        }
        break;
      case 'email':
        if (!value) {
          errors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errors.email = 'Please enter a valid email address';
        }
        break;
      case 'phone':
        if (!value) {
          errors.phone = 'Phone number is required';
        } else {
          // Format phone number
          let formatted = value.replace(/\D/g, '');
          if (formatted.startsWith('0')) {
            formatted = '254' + formatted.slice(1);
          } else if (formatted.startsWith('254')) {
            // Already formatted
          } else if (formatted.length === 9) {
            formatted = '254' + formatted;
          }
          
          if (!/^254\d{9}$/.test(formatted)) {
            errors.phone = 'Please enter a valid Kenyan phone number (e.g., 0712345678)';
          }
        }
        break;
      case 'password':
        if (!value) {
          errors.password = 'Password is required';
        } else if (value.length < 6) {
          errors.password = 'Password must be at least 6 characters';
        }
        break;
    }

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setFieldErrors({});

    // Validate all fields
    let allErrors: {[key: string]: string} = {};
    Object.keys(formData).forEach(key => {
      const fieldErrors = validateField(key, formData[key as keyof typeof formData]);
      allErrors = { ...allErrors, ...fieldErrors };
    });

    if (Object.keys(allErrors).length > 0) {
      setFieldErrors(allErrors);
      setError('Please fix the errors below');
      setLoading(false);
      return;
    }

    try {
      await register(formData.name, formData.email, formData.phone, formData.password);
      // Success toast is handled in AuthContext
    } catch (error: any) {
      const errorMessage = error.message || 'Registration failed. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    setError(''); // Clear general error when user starts typing
    
    // Clear field-specific error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const errors = validateField(name, value);
    setFieldErrors(prev => ({ ...prev, ...errors }));
  };

  const getFieldStatus = (fieldName: string) => {
    if (fieldErrors[fieldName]) return 'error';
    if (formData[fieldName as keyof typeof formData] && !fieldErrors[fieldName]) return 'success';
    return 'default';
  };

  const getFieldClasses = (fieldName: string) => {
    const status = getFieldStatus(fieldName);
    const baseClasses = "w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent transition-all";
    
    switch (status) {
      case 'error':
        return `${baseClasses} border-red-300 bg-red-50 focus:ring-red-500`;
      case 'success':
        return `${baseClasses} border-green-300 bg-green-50 focus:ring-green-500`;
      default:
        return `${baseClasses} border-gray-300 focus:ring-green-500`;
    }
  };

  return (
    <div className="w-full max-w-md">
      {/* Back to Home Button */}
      {onBackToHome && (
        <button
          onClick={onBackToHome}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>
      )}

      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-green-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <User className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900">Join M-Chama</h2>
        <p className="text-gray-600 mt-2">Create your account to start saving together</p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-red-800 text-sm font-medium">Registration Failed</p>
            <p className="text-red-700 text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Full Name
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              onBlur={handleBlur}
              className={getFieldClasses('name')}
              placeholder="Enter your full name"
              required
              disabled={loading}
            />
            {getFieldStatus('name') === 'success' && (
              <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500 w-5 h-5" />
            )}
          </div>
          {fieldErrors.name && (
            <p className="text-red-600 text-sm mt-1">{fieldErrors.name}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              className={getFieldClasses('email')}
              placeholder="Enter your email"
              required
              disabled={loading}
            />
            {getFieldStatus('email') === 'success' && (
              <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500 w-5 h-5" />
            )}
          </div>
          {fieldErrors.email && (
            <p className="text-red-600 text-sm mt-1">{fieldErrors.email}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              onBlur={handleBlur}
              className={getFieldClasses('phone')}
              placeholder="0712345678 or 254712345678"
              required
              disabled={loading}
            />
            {getFieldStatus('phone') === 'success' && (
              <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500 w-5 h-5" />
            )}
          </div>
          {fieldErrors.phone && (
            <p className="text-red-600 text-sm mt-1">{fieldErrors.phone}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            This number will be used for M-PESA transactions
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              onBlur={handleBlur}
              className={getFieldClasses('password')}
              placeholder="Create a strong password"
              required
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              disabled={loading}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {fieldErrors.password && (
            <p className="text-red-600 text-sm mt-1">{fieldErrors.password}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Must be at least 6 characters long
          </p>
        </div>

        <button
          type="submit"
          disabled={loading || Object.keys(fieldErrors).length > 0}
          className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 px-4 rounded-lg font-medium hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 disabled:transform-none"
        >
          {loading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Creating Account...</span>
            </div>
          ) : (
            'Create Account'
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-gray-600">
          Already have an account?{' '}
          <button
            onClick={onToggleForm}
            className="text-green-600 hover:text-green-700 font-medium transition-colors"
            disabled={loading}
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
};

export default RegisterForm;