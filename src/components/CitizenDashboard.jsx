import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, AlertCircle, Clock, CheckCircle, MapPin, Image as ImageIcon, Filter, Map } from 'lucide-react';
import ComplaintForm from './ComplaintForm';
import Heatmap from './Heatmap';

export default function CitizenDashboard() {
  const { user, getAuthHeaders, API_BASE_URL } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);

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
        setComplaints(data); // This now shows ALL complaints from API
      }
    } catch (error) {
      console.error('Failed to load complaints:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleComplaintSubmit = async (newComplaint) => {
    try {
      const formData = new FormData();
      formData.append('title', newComplaint.title);
      formData.append('description', newComplaint.description);
      formData.append('category', newComplaint.category);
      
      if (newComplaint.locationLat) {
        formData.append('locationLat', newComplaint.locationLat);
      }
      if (newComplaint.locationLng) {
        formData.append('locationLng', newComplaint.locationLng);
      }
      if (newComplaint.photoFile) {
        formData.append('photo', newComplaint.photoFile);
      }

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/complaints`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const createdComplaint = await response.json();
        setComplaints([createdComplaint, ...complaints]);
        setShowForm(false);
      } else {
        throw new Error('Failed to create complaint');
      }
    } catch (error) {
      console.error('Failed to submit complaint:', error);
      alert('Failed to submit complaint. Please try again.');
    }
  };

  const filteredComplaints = filter === 'all'
    ? complaints
    : complaints.filter(c => c.status === filter);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white">Loading complaints...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Community Complaints</h1>
          <p className="text-slate-400">View and track all community grievances</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowHeatmap(true)}
            className="flex items-center gap-2 bg-slate-700/50 text-slate-300 px-5 py-3 rounded-lg hover:bg-slate-700 transition-all font-medium border border-slate-600"
          >
            <Map className="w-5 h-5" />
            Heatmap
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-6 py-3 rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all shadow-lg shadow-blue-500/50 font-medium"
          >
            <Plus className="w-5 h-5" />
            New Complaint
          </button>
        </div>
      </div>

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
        <div className="flex items-center gap-4 mb-6">
          <Filter className="w-5 h-5 text-slate-400" />
          <div className="flex gap-2">
            {['all', 'open', 'in_progress', 'resolved'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filter === status
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
              <p className="text-slate-500 text-sm mt-2">
                {filter === 'all' ? 'Submit your first complaint to get started' : `No ${filter} complaints`}
              </p>
            </div>
          ) : (
            filteredComplaints.map((complaint) => (
              <div
                key={complaint._id}
                className="bg-slate-900/50 rounded-lg border border-slate-700/50 p-6 hover:border-blue-500/50 transition-all"
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
                    </div>
                    <p className="text-slate-400 text-sm mb-3">{complaint.description}</p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="px-2 py-1 bg-slate-700/50 text-slate-300 rounded">
                        {getCategoryLabel(complaint.category)}
                      </span>
                      <span className="text-slate-500">
                        {new Date(complaint.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                      {complaint.locationLat && complaint.locationLng && (
                        <span className="flex items-center gap-1 text-slate-400">
                          <MapPin className="w-4 h-4" />
                          Location Pinned
                        </span>
                      )}
                      {complaint.photoUrl && (
                        <span className="flex items-center gap-1 text-slate-400">
                          <ImageIcon className="w-4 h-4" />
                          Photo Attached
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
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {showForm && (
        <ComplaintForm
          onClose={() => setShowForm(false)}
          onSubmit={handleComplaintSubmit}
        />
      )}

      {showHeatmap && (
        <Heatmap onClose={() => setShowHeatmap(false)} />
      )}
    </div>
  );
}
