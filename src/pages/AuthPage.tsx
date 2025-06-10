import React, { useState } from 'react';
import LoginForm from '../components/auth/LoginForm';
import RegisterForm from '../components/auth/RegisterForm';

interface AuthPageProps {
  onBackToHome?: () => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onBackToHome }) => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {isLogin ? (
            <LoginForm 
              onToggleForm={() => setIsLogin(false)} 
              onBackToHome={onBackToHome}
            />
          ) : (
            <RegisterForm 
              onToggleForm={() => setIsLogin(true)} 
              onBackToHome={onBackToHome}
            />
          )}
        </div>
        
        <div className="text-center mt-8 text-sm text-gray-600">
          <p>Secure • Transparent • Community-Driven</p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;