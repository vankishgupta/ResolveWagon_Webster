import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import { X, MapPin, Loader, Navigation } from 'lucide-react';

// Heatmap layer component using leaflet.heat
function HeatmapLayer({ points }) {
  const map = useMap();

  useEffect(() => {
    if (!points || points.length === 0) return;

    const heatLayer = L.heatLayer(points, {
      radius: 25,
      blur: 20,
      maxZoom: 17,
      max: 1.0,
      gradient: {
        0.2: '#2563eb',
        0.4: '#06b6d4',
        0.6: '#f59e0b',
        0.8: '#ef4444',
        1.0: '#dc2626'
      }
    }).addTo(map);

    return () => {
      map.removeLayer(heatLayer);
    };
  }, [map, points]);

  return null;
}

// Component to fly map to a new center when userLocation changes
function MapCenterUpdater({ center, zoom }) {
  const map = useMap();

  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom, { duration: 1.5 });
    }
  }, [map, center, zoom]);

  return null;
}

export default function Heatmap({ onClose }) {
  const { getAuthHeaders, API_BASE_URL } = useAuth();
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({ total: 0, open: 0, inProgress: 0, resolved: 0 });
  const [userLocation, setUserLocation] = useState(null);
  const [locatingUser, setLocatingUser] = useState(true);

  useEffect(() => {
    loadLocations();
    getUserLocation();
  }, []);

  const getUserLocation = () => {
    if (!navigator.geolocation) {
      setLocatingUser(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation([position.coords.latitude, position.coords.longitude]);
        setLocatingUser(false);
      },
      () => {
        // Silently fall back if user denies or geolocation fails
        setLocatingUser(false);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  };

  const loadLocations = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch(`${API_BASE_URL}/complaints/locations`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) throw new Error('Failed to load locations');

      const data = await response.json();

      // Count stats
      const statCounts = { total: data.length, open: 0, inProgress: 0, resolved: 0 };
      
      // Convert to heatmap points: [lat, lng, intensity]
      const heatPoints = data.map(complaint => {
        let intensity;
        switch (complaint.status) {
          case 'open':
            intensity = 1.0;
            statCounts.open++;
            break;
          case 'in_progress':
            intensity = 0.7;
            statCounts.inProgress++;
            break;
          case 'resolved':
            intensity = 0.3;
            statCounts.resolved++;
            break;
          default:
            intensity = 0.5;
        }
        return [complaint.locationLat, complaint.locationLng, intensity];
      });

      setPoints(heatPoints);
      setStats(statCounts);
    } catch (err) {
      console.error('Failed to load locations:', err);
      setError('Failed to load complaint locations');
    } finally {
      setLoading(false);
    }
  };

  // Priority: user's live location > average of complaint points > India center
  const getInitialCenter = () => {
    if (userLocation) return userLocation;
    if (points.length > 0) {
      const avgLat = points.reduce((sum, p) => sum + p[0], 0) / points.length;
      const avgLng = points.reduce((sum, p) => sum + p[1], 0) / points.length;
      return [avgLat, avgLng];
    }
    return [20.5937, 78.9629];
  };

  const getZoom = () => {
    if (userLocation) return 14; // Street-level when we have user position
    if (points.length > 0) return 12;
    return 5;
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-slate-800 border-b border-slate-700 p-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Complaint Heatmap</h2>
              <p className="text-slate-400 text-sm">
                {locatingUser ? 'Detecting your location...' : 
                 userLocation ? 'Centered on your location' : 'Showing complaint hotspots'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {userLocation && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 text-green-400 text-xs font-medium rounded-lg border border-green-500/30">
                <Navigation className="w-3 h-3" />
                Live Location
              </span>
            )}
            <button
              onClick={onClose}
              className="w-10 h-10 bg-slate-700 hover:bg-slate-600 rounded-lg flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-slate-300" />
            </button>
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-4 gap-3 px-6 py-3 bg-slate-800/80 border-b border-slate-700/50 shrink-0">
          <div className="text-center">
            <p className="text-lg font-bold text-white">{stats.total}</p>
            <p className="text-xs text-slate-400">Located</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-orange-400">{stats.open}</p>
            <p className="text-xs text-slate-400">Open</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-blue-400">{stats.inProgress}</p>
            <p className="text-xs text-slate-400">In Progress</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-green-400">{stats.resolved}</p>
            <p className="text-xs text-slate-400">Resolved</p>
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 relative min-h-[400px]">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 z-10">
              <div className="flex items-center gap-3 text-white">
                <Loader className="w-6 h-6 animate-spin" />
                <span>Loading heatmap data...</span>
              </div>
            </div>
          ) : error ? (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 z-10">
              <div className="text-center">
                <p className="text-red-400 mb-2">{error}</p>
                <button
                  onClick={loadLocations}
                  className="text-blue-400 hover:text-blue-300 text-sm"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : points.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 z-10">
              <div className="text-center">
                <MapPin className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">No location data available</p>
                <p className="text-slate-500 text-sm mt-1">Complaints need GPS coordinates to appear on the map</p>
              </div>
            </div>
          ) : null}
          <MapContainer
            center={getInitialCenter()}
            zoom={getZoom()}
            className="w-full h-full"
            style={{ minHeight: '400px', background: '#1e293b' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            {points.length > 0 && <HeatmapLayer points={points} />}
            {userLocation && <MapCenterUpdater center={userLocation} zoom={14} />}
          </MapContainer>
        </div>

        {/* Legend */}
        <div className="px-6 py-3 bg-slate-800 border-t border-slate-700/50 shrink-0">
          <div className="flex items-center justify-center gap-6 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-500"></span> High density (Open)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-500"></span> Medium density
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-blue-500"></span> Low density (Resolved)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
