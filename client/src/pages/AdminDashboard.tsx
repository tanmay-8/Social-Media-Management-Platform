import { useEffect, useState } from 'react';
import { Users, Calendar, FileText, TrendingUp, Activity, DollarSign } from 'lucide-react';
import { adminService } from '../services/adminService';
import type { Stats } from '../types';

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    activeSubscriptions: 0,
    totalFestivals: 0,
    scheduledPosts: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await adminService.getStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      title: 'Active Subscriptions',
      value: stats.activeSubscriptions,
      icon: DollarSign,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
    },
    {
      title: 'Total Festivals',
      value: stats.totalFestivals,
      icon: Calendar,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
    },
    {
      title: 'Scheduled Posts',
      value: stats.scheduledPosts,
      icon: FileText,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-600 mt-1">Welcome to the admin control panel</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`${card.bgColor} p-3 rounded-lg`}>
                  <Icon className={`w-6 h-6 ${card.textColor}`} />
                </div>
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1">{card.title}</p>
                <p className="text-3xl font-bold text-slate-900">{card.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-600" />
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/admin/users"
            className="p-4 rounded-lg border-2 border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-all group"
          >
            <Users className="w-8 h-8 text-slate-600 group-hover:text-blue-600 mb-2" />
            <h3 className="font-semibold text-slate-900 group-hover:text-blue-600">Manage Users</h3>
            <p className="text-sm text-slate-600 mt-1">View and edit user accounts</p>
          </a>
          
          <a
            href="/admin/festivals"
            className="p-4 rounded-lg border-2 border-slate-200 hover:border-purple-500 hover:bg-purple-50 transition-all group"
          >
            <Calendar className="w-8 h-8 text-slate-600 group-hover:text-purple-600 mb-2" />
            <h3 className="font-semibold text-slate-900 group-hover:text-purple-600">Manage Festivals</h3>
            <p className="text-sm text-slate-600 mt-1">Add or edit festival dates</p>
          </a>
          
          <a
            href="/admin/settings"
            className="p-4 rounded-lg border-2 border-slate-200 hover:border-green-500 hover:bg-green-50 transition-all group"
          >
            <Activity className="w-8 h-8 text-slate-600 group-hover:text-green-600 mb-2" />
            <h3 className="font-semibold text-slate-900 group-hover:text-green-600">System Settings</h3>
            <p className="text-sm text-slate-600 mt-1">Configure platform settings</p>
          </a>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Recent Activity</h2>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900">New user registered</p>
                <p className="text-xs text-slate-500">2 minutes ago</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
