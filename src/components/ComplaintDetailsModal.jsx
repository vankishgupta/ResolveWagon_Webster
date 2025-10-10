import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, MapPin, Image as ImageIcon, Send, AlertCircle, Clock, CheckCircle, Lock } from 'lucide-react';

export default function ComplaintDetailsModal({ complaint, onClose, onUpdate }) {
  const { user, getAuthHeaders, API_BASE_URL } = useAuth();
  const [status, setStatus] = useState(complaint.status);
  const [priority, setPriority] = useState(complaint.priority);
  const [assignedStaffId, setAssignedStaffId] = useState(complaint.assignedStaffId || '');
  const [note, setNote] = useState('');
  const [notes, setNotes] = useState([]);
  const [staffMembers, setStaffMembers] = useState([]);

  useEffect(() => {
    loadNotes();
    loadStaffMembers();
  }, [complaint._id]);

  // Check if current user can edit this complaint
  const canEditComplaint = () => {
    return user?.role === 'admin' || 
           !complaint.assignedStaffId || 
           complaint.assignedStaffId === user?.id;
  };

  const loadNotes = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/complaints/${complaint._id}/notes`, {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setNotes(data);
      }
    } catch (error) {
      console.error('Failed to load notes:', error);
    }
  };

  const loadStaffMembers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/staff`, {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setStaffMembers(data);
      }
    } catch (error) {
      console.error('Failed to load staff members:', error);
    }
  };

  const handleAddNote = async () => {
    if (!note.trim()) return;

    // Check if user can add notes
    if (!canEditComplaint()) {
      alert(`This complaint is locked and assigned to ${complaint.assignedStaffName}. Only the assigned staff can add notes.`);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/complaints/${complaint._id}/notes`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ note: note.trim() })
      });

      if (response.ok) {
        const newNote = await response.json();
        setNotes([...notes, newNote]);
        setNote('');
      } else {
        throw new Error('Failed to add note');
      }
    } catch (error) {
      console.error('Failed to add note:', error);
      alert('Failed to add note. Please try again.');
    }
  };

  const handleUpdate = async () => {
    // Check if user can update complaint
    if (!canEditComplaint()) {
      alert(`This complaint is locked and assigned to ${complaint.assignedStaffName}. Only the assigned staff can update this complaint.`);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/complaints/${complaint._id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          status,
          priority,
          assignedStaffId: assignedStaffId || undefined
        })
      });

      if (response.ok) {
        const updatedComplaint = await response.json();
        onUpdate(updatedComplaint);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update complaint');
      }
    } catch (error) {
      console.error('Failed to update complaint:', error);
      alert(error.message || 'Failed to update complaint. Please try again.');
    }
  };

  const getStatusIcon = (statusValue) => {
    switch (statusValue) {
      case 'open': return <AlertCircle className="w-5 h-5" />;
      case 'in_progress': return <Clock className="w-5 h-5" />;
      case 'resolved': return <CheckCircle className="w-5 h-5" />;
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
    return `https://resolve-wagon-backend-webster.vercel.app/${photoUrl}`;
  };

  const isComplaintLocked = !canEditComplaint();

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-2xl border border-slate-700 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-6 flex items-center justify-between z-10">
          <h2 className="text-2xl font-bold text-white">Complaint Details</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 bg-slate-700 hover:bg-slate-600 rounded-lg flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-slate-300" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Complaint locked warning */}
          {isComplaintLocked && (
            <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-yellow-400">
                <Lock className="w-5 h-5" />
                <span className="font-medium">Complaint Locked</span>
              </div>
              <p className="text-yellow-300 text-sm mt-1">
                This complaint is assigned to <span className="font-semibold">{complaint.assignedStaffName}</span>. 
                Only the assigned staff can update this complaint.
              </p>
            </div>
          )}

          <div className="bg-slate-900/50 rounded-lg p-6 border border-slate-700/50">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">{complaint.title}</h3>
                <div className="flex items-center gap-3 text-sm mb-3">
                  <span className="px-2 py-1 bg-slate-700/50 text-slate-300 rounded">
                    {getCategoryLabel(complaint.category)}
                  </span>
                  <span className="text-slate-400">
                    Submitted by: <span className="text-slate-300 font-medium">{complaint.citizenName}</span>
                  </span>
                </div>
              </div>
              {complaint.priority === 'high' && (
                <span className="px-3 py-1 bg-red-500/10 text-red-400 text-sm font-medium rounded border border-red-500/50">
                  HIGH PRIORITY
                </span>
              )}
            </div>

            <p className="text-slate-300 mb-4">{complaint.description}</p>

            <div className="flex items-center gap-4 text-sm text-slate-400">
              <span>
                Created: {new Date(complaint.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
              {complaint.resolvedAt && (
                <span>
                  Resolved: {new Date(complaint.resolvedAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              )}
            </div>

            {(complaint.locationLat && complaint.locationLng) && (
              <div className="mt-4 pt-4 border-t border-slate-700/50">
                <div className="flex items-center gap-2 text-slate-300">
                  <MapPin className="w-5 h-5 text-blue-400" />
                  <span className="font-medium">Location:</span>
                  <span className="text-slate-400">
                    {complaint.locationLat.toFixed(6)}, {complaint.locationLng.toFixed(6)}
                  </span>
                </div>
              </div>
            )}

            {complaint.photoUrl && (
              <div className="mt-4 pt-4 border-t border-slate-700/50">
                <div className="flex items-center gap-2 text-slate-300 mb-3">
                  <ImageIcon className="w-5 h-5 text-blue-400" />
                  <span className="font-medium">Attached Photo</span>
                </div>
                <img
                  src={getPhotoUrl(complaint.photoUrl)}
                  alt="Complaint"
                  className="rounded-lg max-h-64 object-cover border border-slate-700"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>

          <div className="bg-slate-900/50 rounded-lg p-6 border border-slate-700/50">
            <h4 className="text-lg font-semibold text-white mb-4">Update Status</h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Status
                </label>
                <div className="relative">
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    disabled={isComplaintLocked}
                    className={`w-full border rounded-lg py-3 px-4 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      isComplaintLocked 
                        ? 'bg-slate-700/50 border-slate-600 cursor-not-allowed' 
                        : 'bg-slate-800 border-slate-600'
                    }`}
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    {getStatusIcon(status)}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                    disabled={isComplaintLocked}
                    className={`w-full border rounded-lg py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      isComplaintLocked 
                        ? 'bg-slate-700/50 border-slate-600 cursor-not-allowed' 
                        : 'bg-slate-800 border-slate-600'
                    }`}
                >
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Assign Staff
                </label>
                <select
                  value={assignedStaffId}
                  onChange={(e) => setAssignedStaffId(e.target.value)}
                  disabled={isComplaintLocked}
                  className={`w-full border rounded-lg py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    isComplaintLocked 
                      ? 'bg-slate-700/50 border-slate-600 cursor-not-allowed' 
                      : 'bg-slate-800 border-slate-600'
                  }`}
                >
                  <option value="">Unassigned</option>
                  {staffMembers.map(staff => (
                    staff.role === "staff" && (
                    <option key={staff._id} value={staff._id}>
                      {staff.name} ({staff.role})
                    </option>
                    )
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={handleUpdate}
              disabled={isComplaintLocked}
              className={`mt-4 w-full py-3 rounded-lg transition-all font-medium ${
                isComplaintLocked
                  ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600 shadow-lg shadow-blue-500/50'
              }`}
            >
              {isComplaintLocked ? 'Complaint Locked' : 'Update Complaint'}
            </button>
          </div>

          <div className="bg-slate-900/50 rounded-lg p-6 border border-slate-700/50">
            <h4 className="text-lg font-semibold text-white mb-4">Notes & Updates</h4>

            <div className="space-y-3 mb-4">
              {notes.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-4">No notes yet</p>
              ) : (
                notes.map(noteItem => (
                  <div key={noteItem._id} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-slate-300 font-medium">{noteItem.staffName}</span>
                      <span className="text-slate-500 text-xs">
                        {new Date(noteItem.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <p className="text-slate-400 text-sm">{noteItem.note}</p>
                  </div>
                ))
              )}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                placeholder={isComplaintLocked ? "Complaint locked - cannot add notes" : "Add a note..."}
                disabled={isComplaintLocked}
                className={`flex-1 border rounded-lg py-3 px-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                  isComplaintLocked
                    ? 'bg-slate-700/50 border-slate-600 cursor-not-allowed'
                    : 'bg-slate-800 border-slate-600'
                }`}
              />
              <button
                onClick={handleAddNote}
                disabled={isComplaintLocked || !note.trim()}
                className={`px-6 py-3 rounded-lg transition-colors font-medium flex items-center gap-2 ${
                  isComplaintLocked
                    ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                <Send className="w-5 h-5" />
                Add Note
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
