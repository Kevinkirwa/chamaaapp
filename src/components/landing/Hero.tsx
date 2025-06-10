import React from 'react';
import { Users, Shield, Smartphone, TrendingUp, ArrowRight } from 'lucide-react';

interface HeroProps {
  onGetStarted: () => void;
}

const Hero: React.FC<HeroProps> = ({ onGetStarted }) => {
  return (
    <div className="relative bg-gradient-to-br from-green-50 via-white to-blue-50 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-96 h-96 bg-green-600 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-orange-600 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-500"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start space-x-2 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-green-700 rounded-2xl flex items-center justify-center">
                <Users className="w-7 h-7 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">M-Chama</span>
            </div>

            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Save Together,
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600"> Grow Together</span>
            </h1>

            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Join the digital revolution of traditional savings groups. Create or join a Chama, 
              contribute monthly, and receive rotating payouts - all powered by secure M-PESA integration.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12">
              <button
                onClick={onGetStarted}
                className="group bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-green-700 hover:to-green-800 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                Get Started Free
                <ArrowRight className="inline-block ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-xl font-semibold text-lg hover:border-gray-400 hover:bg-gray-50 transition-all">
                Watch Demo
              </button>
            </div>

            {/* Trust Indicators */}
            <div className="flex items-center justify-center lg:justify-start space-x-8 text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4 text-green-600" />
                <span>Bank-level Security</span>
              </div>
              <div className="flex items-center space-x-2">
                <Smartphone className="w-4 h-4 text-blue-600" />
                <span>M-PESA Integrated</span>
              </div>
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-orange-600" />
                <span>Proven Results</span>
              </div>
            </div>
          </div>

          {/* Right Content - App Preview */}
          <div className="relative">
            <div className="relative mx-auto w-80 h-96 bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-2 shadow-2xl">
              <div className="w-full h-full bg-white rounded-2xl overflow-hidden">
                {/* Mock App Interface */}
                <div className="bg-gradient-to-r from-green-600 to-green-700 p-4 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Users className="w-5 h-5" />
                      <span className="font-semibold">M-Chama</span>
                    </div>
                    <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full"></div>
                  </div>
                </div>
                
                <div className="p-4 space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-green-800">Family Savings</span>
                      <span className="text-xs text-green-600">Active</span>
                    </div>
                    <div className="mt-2 text-xs text-green-700">KSh 5,000 • 8 Members</div>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-blue-800">Business Group</span>
                      <span className="text-xs text-blue-600">Cycle 3</span>
                    </div>
                    <div className="mt-2 text-xs text-blue-700">KSh 10,000 • 12 Members</div>
                  </div>
                  
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-orange-800">Investment Club</span>
                      <span className="text-xs text-orange-600">Your Turn</span>
                    </div>
                    <div className="mt-2 text-xs text-orange-700">KSh 15,000 • 6 Members</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Elements */}
            <div className="absolute -top-4 -right-4 w-20 h-20 bg-green-100 rounded-full flex items-center justify-center animate-bounce">
              <span className="text-2xl">💰</span>
            </div>
            <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center animate-pulse">
              <span className="text-xl">📱</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;