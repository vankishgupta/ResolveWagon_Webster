import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, Clock, CheckCircle, Search, MapPin, Image as ImageIcon, Lock } from 'lucide-react';
import ComplaintDetailsModal from './ComplaintDetailsModal';

export default function StaffDashboard() {
  const { user, getAuthHeaders, API_BASE_URL } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadComplaints();
  }, []);

  const loadComplaints = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/complaints`, {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setComplaints(data);
      }
    } catch (error) {
      console.error('Failed to load complaints:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleComplaintUpdate = (updatedComplaint) => {
    setComplaints(complaints.map(c => 
      c._id === updatedComplaint._id ? updatedComplaint : c
    ));
    setSelectedComplaint(null);
  };

  // Check if complaint is assigned to current user
  const isAssignedToMe = (complaint) => {
    return complaint.assignedStaffId === user?.id;
  };

  // Check if complaint is assigned to someone else
  const isAssignedToOther = (complaint) => {
    return complaint.assignedStaffId && complaint.assignedStaffId !== user?.id;
  };

  const filteredComplaints = complaints.filter(complaint => {
    const matchesSearch =
      complaint.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      complaint.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      complaint.citizenName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || complaint.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-orange-500/10 text-orange-400 border-orange-500/50';
      case 'in_progress': return 'bg-blue-500/10 text-blue-400 border-blue-500/50';
      case 'resolved': return 'bg-green-500/10 text-green-400 border-green-500/50';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/50';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'open': return <AlertCircle className="w-4 h-4" />;
      case 'in_progress': return <Clock className="w-4 h-4" />;
      case 'resolved': return <CheckCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  const getCategoryLabel = (category) => {
    return category.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getPhotoUrl = (photoUrl) => {
    if (!photoUrl) return null;
    if (photoUrl.startsWith('http')) return photoUrl;
    return `https://resolvewagon-webster-1.onrender.com/${photoUrl}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white">Loading complaints...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">
          {user?.role === 'admin' ? 'Admin Dashboard' : 'Staff Dashboard'}
        </h1>
        <p className="text-slate-400">Manage and resolve citizen complaints</p>
      </div>

      {/* Stats cards remain the same */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-slate-700/50 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-slate-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{complaints.length}</p>
            </div>
          </div>
          <p className="text-slate-400 text-sm">Total Complaints</p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-orange-700/50 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {complaints.filter(c => c.status === 'open').length}
              </p>
            </div>
          </div>
          <p className="text-slate-400 text-sm">Open</p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-blue-700/50 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {complaints.filter(c => c.status === 'in_progress').length}
              </p>
            </div>
          </div>
          <p className="text-slate-400 text-sm">In Progress</p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-green-700/50 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {complaints.filter(c => c.status === 'resolved').length}
              </p>
            </div>
          </div>
          <p className="text-slate-400 text-sm">Resolved</p>
        </div>
      </div>

      <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-600 rounded-lg py-3 pl-11 pr-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Search complaints..."
            />
          </div>
          <div className="flex gap-2">
            {['all', 'open', 'in_progress', 'resolved'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                  statusFilter === status
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/50'
                    : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {status === 'all' ? 'All' : status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {filteredComplaints.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 text-lg">No complaints found</p>
            </div>
          ) : (
            filteredComplaints.map((complaint) => (
              <div
                key={complaint._id}
                onClick={() => setSelectedComplaint(complaint)}
                className="bg-slate-900/50 rounded-lg border border-slate-700/50 p-6 hover:border-blue-500/50 transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-white">{complaint.title}</h3>
                      {complaint.priority === 'high' && (
                        <span className="px-2 py-1 bg-red-500/10 text-red-400 text-xs font-medium rounded border border-red-500/50">
                          HIGH PRIORITY
                        </span>
                      )}
                      {/* Lock indicator for assigned complaints */}
                      {isAssignedToOther(complaint) && (
                        <span className="flex items-center gap-1 px-2 py-1 bg-yellow-500/10 text-yellow-400 text-xs font-medium rounded border border-yellow-500/50">
                          <Lock className="w-3 h-3" />
                          LOCKED
                        </span>
                      )}
                      {isAssignedToMe(complaint) && (
                        <span className="flex items-center gap-1 px-2 py-1 bg-green-500/10 text-green-400 text-xs font-medium rounded border border-green-500/50">
                          <Lock className="w-3 h-3" />
                          ASSIGNED TO YOU
                        </span>
                      )}
                    </div>
                    <p className="text-slate-400 text-sm mb-3 line-clamp-2">{complaint.description}</p>
                    <div className="flex items-center gap-4 text-sm flex-wrap">
                      <span className="px-2 py-1 bg-slate-700/50 text-slate-300 rounded">
                        {getCategoryLabel(complaint.category)}
                      </span>
                      <span className="text-slate-500">
                        By: <span className="text-slate-400">{complaint.citizenName}</span>
                      </span>
                      <span className="text-slate-500">
                        {new Date(complaint.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      {complaint.locationLat && complaint.locationLng && (
                        <span className="flex items-center gap-1 text-slate-400">
                          <MapPin className="w-4 h-4" />
                          Location
                        </span>
                      )}
                      {complaint.photoUrl && (
                        <span className="flex items-center gap-1 text-slate-400">
                          <ImageIcon className="w-4 h-4" />
                          Photo
                        </span>
                      )}
                    </div>
                  </div>
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${getStatusColor(complaint.status)}`}>
                    {getStatusIcon(complaint.status)}
                    <span className="text-sm font-medium capitalize">
                      {complaint.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                {complaint.assignedStaffName && (
                  <div className="flex items-center gap-2 text-sm text-slate-400 pt-3 border-t border-slate-700/50">
                    <span>Assigned to:</span>
                    <span className="text-slate-300 font-medium">{complaint.assignedStaffName}</span>
                    {isAssignedToOther(complaint) && (
                      <Lock className="w-4 h-4 text-yellow-400" />
                    )}
                    {isAssignedToMe(complaint) && (
                      <Lock className="w-4 h-4 text-green-400" />
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {selectedComplaint && (
        <ComplaintDetailsModal
          complaint={selectedComplaint}
          onClose={() => setSelectedComplaint(null)}
          onUpdate={handleComplaintUpdate}
        />
      )}
    </div>
  );
}
