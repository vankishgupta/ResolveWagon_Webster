import { useAuth } from '../context/AuthContext';
import { LogOut, CircleUser as UserCircle } from 'lucide-react';

export default function Header() {
  const { user, logout } = useAuth();

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-red-500/10 text-red-400 border-red-500/50';
      case 'staff': return 'bg-blue-500/10 text-blue-400 border-blue-500/50';
      case 'citizen': return 'bg-green-500/10 text-green-400 border-green-500/50';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/50';
    }
  };

  return (
    <header className="bg-slate-800/50 backdrop-blur-xl border-b border-slate-700/50 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/50">
              <UserCircle className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Resolve Wagon</h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-slate-700/50 rounded-lg px-4 py-2">
              <div className="text-right">
                <p className="text-white font-medium text-sm">{user?.name}</p>
                <span className={`text-xs px-2 py-0.5 rounded border ${getRoleBadgeColor(user?.role || '')}`}>
                  {user?.role?.toUpperCase()}
                </span>
              </div>
              <button
                onClick={logout}
                className="w-9 h-9 bg-slate-600 hover:bg-slate-500 rounded-lg flex items-center justify-center transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4 text-slate-300" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
