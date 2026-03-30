import { useState, useEffect } from 'react';
import { BarChart3, Clock, CheckCircle, AlertCircle, TrendingUp, FileText, ArrowLeft, Loader } from 'lucide-react';

export default function TransparencyPortal({ onBack }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const API_BASE_URL = 'http://localhost:5000/api';

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch(`${API_BASE_URL}/public/stats`);

      if (!response.ok) throw new Error('Failed to load statistics');

      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
      setError('Failed to load public statistics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryLabel = (category) => {
    if (!category) return 'Unknown';
    return category.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'broken_pathway': return 'from-orange-500 to-amber-500';
      case 'water_leakage': return 'from-blue-500 to-cyan-500';
      case 'garbage': return 'from-green-500 to-emerald-500';
      case 'electrical': return 'from-yellow-500 to-orange-500';
      case 'other': return 'from-purple-500 to-pink-500';
      default: return 'from-slate-500 to-slate-400';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="flex items-center gap-3 text-white">
          <Loader className="w-8 h-8 animate-spin text-blue-400" />
          <span className="text-lg">Loading public statistics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <p className="text-red-400 text-lg mb-4">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={loadStats}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Retry
            </button>
            <button
              onClick={onBack}
              className="px-6 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  const maxCategoryCount = stats ? Math.max(...Object.values(stats.categoryBreakdown), 1) : 1;
  const totalForStatus = stats?.totalComplaints || 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiIHN0cm9rZT0iIzMzMyIgb3BhY2l0eT0iLjEiLz48L2c+PC9zdmc+')] opacity-20"></div>

      {/* Header */}
      <header className="relative bg-slate-800/50 backdrop-blur-xl border-b border-slate-700/50 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <BarChart3 className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Transparency Portal</h1>
                <p className="text-slate-400 text-sm">Resolve Wagon — Public Dashboard</p>
              </div>
            </div>
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </button>
          </div>
        </div>
      </header>

      <main className="relative max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Hero Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Total Complaints */}
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-400" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white">{stats.totalComplaints}</p>
            <p className="text-slate-400 text-sm mt-1">Total Complaints</p>
          </div>

          {/* Resolution Rate */}
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-emerald-700/50 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white">{stats.resolutionRate}%</p>
            <p className="text-slate-400 text-sm mt-1">Resolution Rate</p>
          </div>

          {/* Avg Resolution Time */}
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-cyan-700/50 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-cyan-500/10 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white">
              {stats.averageResolutionTimeHours > 0 ? `${stats.averageResolutionTimeHours}h` : 'N/A'}
            </p>
            <p className="text-slate-400 text-sm mt-1">Avg Resolution Time</p>
          </div>

          {/* Open Complaints */}
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-orange-700/50 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-orange-400" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white">{stats.statusBreakdown.open || 0}</p>
            <p className="text-slate-400 text-sm mt-1">Open Complaints</p>
          </div>
        </div>

        {/* Status Breakdown & Category Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Status Breakdown */}
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 p-6">
            <h3 className="text-lg font-semibold text-white mb-6">Status Breakdown</h3>
            <div className="space-y-5">
              {[
                { key: 'open', label: 'Open', color: 'bg-orange-500', textColor: 'text-orange-400' },
                { key: 'in_progress', label: 'In Progress', color: 'bg-blue-500', textColor: 'text-blue-400' },
                { key: 'resolved', label: 'Resolved', color: 'bg-green-500', textColor: 'text-green-400' },
              ].map(item => {
                const count = stats.statusBreakdown[item.key] || 0;
                const percentage = totalForStatus > 0 ? Math.round((count / totalForStatus) * 100) : 0;
                return (
                  <div key={item.key}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm font-medium ${item.textColor}`}>{item.label}</span>
                      <span className="text-sm text-slate-300">{count} ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-slate-700/50 rounded-full h-3">
                      <div
                        className={`${item.color} h-3 rounded-full transition-all duration-700`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 p-6">
            <h3 className="text-lg font-semibold text-white mb-6">Category Breakdown</h3>
            <div className="space-y-4">
              {Object.entries(stats.categoryBreakdown).map(([category, count]) => {
                const percentage = Math.round((count / maxCategoryCount) * 100);
                return (
                  <div key={category}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-300">{getCategoryLabel(category)}</span>
                      <span className="text-sm text-slate-400">{count}</span>
                    </div>
                    <div className="w-full bg-slate-700/50 rounded-full h-3">
                      <div
                        className={`bg-gradient-to-r ${getCategoryColor(category)} h-3 rounded-full transition-all duration-700`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
              {Object.keys(stats.categoryBreakdown).length === 0 && (
                <p className="text-slate-500 text-sm text-center py-4">No category data available</p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pt-4 border-t border-slate-700/50">
          <p className="text-slate-500 text-sm">
            Public transparency data for Resolve Wagon Grievance System • Updated in real-time
          </p>
        </div>
      </main>
    </div>
  );
}
