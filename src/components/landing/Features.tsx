import React from 'react';
import { Users, Shield, Smartphone, TrendingUp, Clock, CreditCard, BarChart3, Bell } from 'lucide-react';

const Features: React.FC = () => {
  const features = [
    {
      icon: Users,
      title: 'Create or Join Groups',
      description: 'Start your own Chama or join existing groups with simple invite codes. Build trust within your community.',
      color: 'green'
    },
    {
      icon: Smartphone,
      title: 'M-PESA Integration',
      description: 'Seamless payments through M-PESA STK Push. No cash handling, no bank visits - just simple mobile payments.',
      color: 'blue'
    },
    {
      icon: TrendingUp,
      title: 'Rotating Payouts',
      description: 'Fair and transparent rotation system. Everyone contributes, everyone receives - building wealth together.',
      color: 'orange'
    },
    {
      icon: Shield,
      title: 'Secure & Transparent',
      description: 'Bank-level security with complete transparency. Track every contribution and payout in real-time.',
      color: 'purple'
    },
    {
      icon: Clock,
      title: 'Automated Cycles',
      description: 'Smart automation handles cycle management, payout calculations, and member notifications.',
      color: 'indigo'
    },
    {
      icon: BarChart3,
      title: 'Progress Tracking',
      description: 'Visual dashboards show group progress, contribution history, and upcoming payouts at a glance.',
      color: 'teal'
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      green: 'bg-green-100 text-green-600 group-hover:bg-green-600 group-hover:text-white',
      blue: 'bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white',
      orange: 'bg-orange-100 text-orange-600 group-hover:bg-orange-600 group-hover:text-white',
      purple: 'bg-purple-100 text-purple-600 group-hover:bg-purple-600 group-hover:text-white',
      indigo: 'bg-indigo-100 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white',
      teal: 'bg-teal-100 text-teal-600 group-hover:bg-teal-600 group-hover:text-white'
    };
    return colors[color as keyof typeof colors] || colors.green;
  };

  return (
    <div className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Everything You Need for
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600"> Group Savings</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            M-Chama combines traditional community savings with modern technology, 
            making it easier than ever to save and grow wealth together.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group bg-white rounded-2xl p-8 border border-gray-200 hover:border-gray-300 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
            >
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300 ${getColorClasses(feature.color)}`}>
                <feature.icon className="w-8 h-8 transition-colors duration-300" />
              </div>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-gray-800">
                {feature.title}
              </h3>
              
              <p className="text-gray-600 leading-relaxed group-hover:text-gray-700">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Features;