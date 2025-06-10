import React from 'react';
import { Shield, Zap, Users, TrendingUp, Clock, Award } from 'lucide-react';

const Benefits: React.FC = () => {
  const benefits = [
    {
      icon: Shield,
      title: 'Secure & Trustworthy',
      description: 'Bank-level encryption and M-PESA integration ensure your money is always safe.',
      stats: '99.9% Uptime'
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Instant contributions and automated payouts. No waiting, no delays.',
      stats: '<3 sec Processing'
    },
    {
      icon: Users,
      title: 'Community Driven',
      description: 'Build stronger relationships while achieving financial goals together.',
      stats: '10K+ Active Users'
    },
    {
      icon: TrendingUp,
      title: 'Proven Results',
      description: 'Members save 40% more compared to individual savings accounts.',
      stats: '40% More Savings'
    },
    {
      icon: Clock,
      title: 'Always Available',
      description: '24/7 access to your Chama dashboard and contribution history.',
      stats: '24/7 Access'
    },
    {
      icon: Award,
      title: 'Award Winning',
      description: 'Recognized as the best fintech solution for community savings.',
      stats: '5 Star Rating'
    }
  ];

  return (
    <div className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Why Choose M-Chama?
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We've reimagined traditional savings groups for the digital age, 
            combining community trust with modern technology.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="group relative bg-gradient-to-br from-white to-gray-50 rounded-2xl p-8 border border-gray-200 hover:border-green-300 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              {/* Background Gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center mb-6 group-hover:from-green-500 group-hover:to-green-600 transition-all duration-300">
                  <benefit.icon className="w-8 h-8 text-green-600 group-hover:text-white transition-colors duration-300" />
                </div>
                
                <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-green-800 transition-colors">
                  {benefit.title}
                </h3>
                
                <p className="text-gray-600 leading-relaxed mb-4 group-hover:text-gray-700 transition-colors">
                  {benefit.description}
                </p>
                
                <div className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium group-hover:bg-green-200 transition-colors">
                  {benefit.stats}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Testimonial Section */}
        <div className="mt-20 bg-gradient-to-r from-green-600 to-blue-600 rounded-3xl p-12 text-center text-white">
          <div className="max-w-4xl mx-auto">
            <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-8">
              <span className="text-4xl">💬</span>
            </div>
            <blockquote className="text-2xl font-medium mb-6 leading-relaxed">
              "M-Chama has transformed how our community saves money. We've saved over KSh 500,000 
              in just 8 months, and the transparency gives everyone peace of mind."
            </blockquote>
            <div className="flex items-center justify-center space-x-4">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full"></div>
              <div className="text-left">
                <p className="font-semibold">Sarah Wanjiku</p>
                <p className="text-green-200">Chama Admin, Nairobi</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Benefits;