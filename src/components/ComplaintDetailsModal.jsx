import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, MapPin, Image as ImageIcon, Send, AlertCircle, Clock, CheckCircle } from 'lucide-react';

export default function ComplaintDetailsModal({ complaint, onClose, onUpdate }) {
  const { user } = useAuth();
  const [status, setStatus] = useState(complaint.status);
  const [priority, setPriority] = useState(complaint.priority);
  const [assignedStaffId, setAssignedStaffId] = useState(complaint.assignedStaffId || '');
  const [note, setNote] = useState('');
  const [notes, setNotes] = useState([]);
  const [staffMembers, setStaffMembers] = useState([]);

  // staff accessing complaint details

  useEffect(() => {
    const storedNotes = JSON.parse(localStorage.getItem('complaint_notes') || '[]');
    const complaintNotes = storedNotes.filter((n) => n.complaintId === complaint.id);
    setNotes(complaintNotes);

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const staff = users.filter((u) => u.role === 'staff' || u.role === 'admin');
    setStaffMembers(staff);
  }, [complaint.id]);       //showing that staff users are accessing the data

  const handleAddNote = () => {
    if (!note.trim()) return;

    const newNote = {
      id: `note-${Date.now()}`,
      complaintId: complaint.id,
      note: note.trim(),
      staffId: user.id,
      staffName: user.name,
      createdAt: new Date().toISOString(),
    };

    const storedNotes = JSON.parse(localStorage.getItem('complaint_notes') || '[]');  //notes adding part
    storedNotes.push(newNote);
    localStorage.setItem('complaint_notes', JSON.stringify(storedNotes));

    setNotes([...notes, newNote]);
    setNote('');
  };

  const handleUpdate = () => {  //updating complaint information
    const selectedStaff = staffMembers.find(s => s.id === assignedStaffId);
    const updatedComplaint = {
      ...complaint,
      status,
      priority,
      assignedStaffId: assignedStaffId || undefined,
      assignedStaffName: selectedStaff?.name,
      updatedAt: new Date().toISOString(),
      resolvedAt: status === 'resolved' ? new Date().toISOString() : complaint.resolvedAt,
    };

    onUpdate(updatedComplaint);
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
                  src={complaint.photoUrl}
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
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg py-3 px-4 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="">Unassigned</option>
                  {staffMembers.map(staff => (
                    <option key={staff.id} value={staff.id}>
                      {staff.name} ({staff.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={handleUpdate}
              className="mt-4 w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-3 rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all shadow-lg shadow-blue-500/50 font-medium"
            >
              Update Complaint
            </button>
          </div>

          <div className="bg-slate-900/50 rounded-lg p-6 border border-slate-700/50">
            <h4 className="text-lg font-semibold text-white mb-4">Notes & Updates</h4>

            <div className="space-y-3 mb-4">
              {notes.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-4">No notes yet</p>
              ) : (
                notes.map(noteItem => (
                  <div key={noteItem.id} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
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
                placeholder="Add a note..."
                className="flex-1 bg-slate-800 border border-slate-600 rounded-lg py-3 px-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <button
                onClick={handleAddNote}
                className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors font-medium flex items-center gap-2"
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