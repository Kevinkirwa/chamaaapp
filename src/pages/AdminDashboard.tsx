import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import SuperAdminDashboard from '../components/admin/SuperAdminDashboard';
import ChamaAdminDashboard from '../components/admin/ChamaAdminDashboard';
import { Shield, Users } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-600">Access denied</p>
      </div>
    );
  }

  // Super Admin Dashboard
  if (user.role === 'super_admin') {
    return <SuperAdminDashboard />;
  }

  // Regular Admin Dashboard (for Chama admins)
  if (user.role === 'admin') {
    return (
      <div className="space-y-8">
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Users className="w-12 h-12 text-blue-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Chama Admin Dashboard</h3>
          <p className="text-gray-600 mb-6">
            Select a specific Chama to view its admin dashboard
          </p>
          <p className="text-sm text-gray-500">
            Navigate to a Chama from your dashboard to access admin features
          </p>
        </div>
      </div>
    );
  }

  // Regular members don't have admin access
  return (
    <div className="text-center py-16">
      <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <Shield className="w-12 h-12 text-red-600" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
      <p className="text-gray-600">
        You don't have admin privileges to access this page.
      </p>
    </div>
  );
};

export default AdminDashboard;