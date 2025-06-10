import React from 'react';
import { Users, Calendar, DollarSign, ArrowRight } from 'lucide-react';

interface ChamaCardProps {
  chama: {
    id: number;
    name: string;
    description: string;
    contribution_amount: number;
    current_cycle: number;
    admin_name?: string;
  };
  memberCount: number;
  onClick: () => void;
}

const ChamaCard: React.FC<ChamaCardProps> = ({ chama, memberCount, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200 cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
            {chama.name}
          </h3>
          <p className="text-sm text-gray-600 mt-1">{chama.description}</p>
        </div>
        <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-green-600 group-hover:translate-x-1 transition-all" />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Members</p>
            <p className="text-sm font-medium text-gray-900">{memberCount}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
            <Calendar className="w-4 h-4 text-orange-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Cycle</p>
            <p className="text-sm font-medium text-gray-900">{chama.current_cycle}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
            <DollarSign className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Amount</p>
            <p className="text-sm font-medium text-gray-900">KSh {chama.contribution_amount}</p>
          </div>
        </div>
      </div>

      {chama.admin_name && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-500">Admin: <span className="font-medium">{chama.admin_name}</span></p>
        </div>
      )}
    </div>
  );
};

export default ChamaCard;