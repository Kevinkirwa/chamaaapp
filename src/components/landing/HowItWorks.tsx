import React from 'react';
import { UserPlus, Users, CreditCard, TrendingUp } from 'lucide-react';

const HowItWorks: React.FC = () => {
  const steps = [
    {
      icon: UserPlus,
      title: 'Join or Create',
      description: 'Sign up and either create your own Chama or join an existing group using an invite code.',
      color: 'from-green-500 to-green-600'
    },
    {
      icon: Users,
      title: 'Build Your Group',
      description: 'Invite friends, family, or colleagues. Set contribution amounts and payout schedules together.',
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: CreditCard,
      title: 'Contribute Monthly',
      description: 'Make secure contributions via M-PESA. Track payments and see real-time group progress.',
      color: 'from-orange-500 to-orange-600'
    },
    {
      icon: TrendingUp,
      title: 'Receive Payouts',
      description: 'Get your turn to receive the full group contribution. Build wealth through community support.',
      color: 'from-purple-500 to-purple-600'
    }
  ];

  return (
    <div className="py-20 bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            How M-Chama Works
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Simple, transparent, and effective. Join thousands who are already building wealth through community savings.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              {/* Connection Line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-16 left-full w-full h-0.5 bg-gradient-to-r from-gray-300 to-gray-200 z-0"></div>
              )}
              
              <div className="relative bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 z-10">
                <div className={`w-16 h-16 bg-gradient-to-r ${step.color} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg`}>
                  <step.icon className="w-8 h-8 text-white" />
                </div>
                
                <div className="absolute -top-3 -right-3 w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                  {index + 1}
                </div>
                
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {step.title}
                </h3>
                
                <p className="text-gray-600 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">Ready to Start Saving?</h3>
            <p className="text-green-100 mb-6 text-lg">
              Join thousands of Kenyans who are building wealth through community savings.
            </p>
            <button className="bg-white text-green-600 px-8 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-colors transform hover:scale-105">
              Create Your First Chama
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowItWorks;