import React from 'react';
import { ArrowRight, Users, Shield, Smartphone } from 'lucide-react';

interface CTAProps {
  onGetStarted: () => void;
}

const CTA: React.FC<CTAProps> = ({ onGetStarted }) => {
  return (
    <div className="py-20 bg-gradient-to-br from-gray-900 via-green-900 to-blue-900 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-green-400 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-5xl font-bold text-white mb-6 leading-tight">
            Start Your Savings Journey
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-400"> Today</span>
          </h2>
          
          <p className="text-xl text-gray-300 mb-12 leading-relaxed">
            Join thousands of Kenyans who are building wealth through community savings. 
            Create your first Chama in less than 2 minutes.
          </p>

          {/* Feature Highlights */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-green-500 bg-opacity-20 rounded-2xl flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Easy Setup</h3>
              <p className="text-gray-400 text-sm">Create or join a Chama in minutes</p>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-blue-500 bg-opacity-20 rounded-2xl flex items-center justify-center mb-4">
                <Smartphone className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">M-PESA Ready</h3>
              <p className="text-gray-400 text-sm">Seamless mobile money integration</p>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-purple-500 bg-opacity-20 rounded-2xl flex items-center justify-center mb-4">
                <Shield className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">100% Secure</h3>
              <p className="text-gray-400 text-sm">Bank-level security for your money</p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <button
              onClick={onGetStarted}
              className="group bg-gradient-to-r from-green-500 to-green-600 text-white px-10 py-4 rounded-xl font-semibold text-lg hover:from-green-600 hover:to-green-700 transition-all transform hover:scale-105 shadow-2xl hover:shadow-green-500/25"
            >
              Start Saving Now
              <ArrowRight className="inline-block ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            
            <button className="border-2 border-white border-opacity-30 text-white px-10 py-4 rounded-xl font-semibold text-lg hover:bg-white hover:bg-opacity-10 transition-all">
              Schedule Demo
            </button>
          </div>

          {/* Trust Indicators */}
          <div className="mt-12 pt-8 border-t border-white border-opacity-20">
            <p className="text-gray-400 mb-4">Trusted by over 10,000 Kenyans</p>
            <div className="flex items-center justify-center space-x-8 text-white text-opacity-60">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">⭐</span>
                <span>4.9/5 Rating</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-2xl">🔒</span>
                <span>SSL Secured</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-2xl">📱</span>
                <span>Mobile First</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CTA;