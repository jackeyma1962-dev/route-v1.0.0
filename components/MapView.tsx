import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { RouteOption } from '../types';

// Fix for default marker icons in React-Leaflet
const iconUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
const iconRetinaUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png';
const shadowUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';

const customIcon = new L.Icon({
    iconUrl,
    iconRetinaUrl,
    shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Component to handle map bounds updates
const MapController: React.FC<{ stops: RouteOption['stops'], path?: RouteOption['path'] }> = ({ stops, path }) => {
  const map = useMap();

  useEffect(() => {
    // 優先使用 path 計算邊界，因為它包含所有轉折點，範圍更精確
    if (path && path.length > 0) {
      const bounds = L.latLngBounds(path.map(p => [p.lat, p.lng]));
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (stops.length > 0) {
      const bounds = L.latLngBounds(stops.map(s => [s.coordinates.lat, s.coordinates.lng]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [stops, path, map]);

  return null;
};

interface MapViewProps {
  activeRoute: RouteOption | null;
}

export const MapView: React.FC<MapViewProps> = ({ activeRoute }) => {
  const defaultCenter = { lat: 25.0330, lng: 121.5654 }; // Default to Taipei

  // Simple polyline color
  const purpleOptions = { color: '#4f46e5', weight: 5, opacity: 0.8 };

  return (
    <div className="h-full w-full relative z-0">
      <MapContainer
        center={[defaultCenter.lat, defaultCenter.lng]}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        
        {activeRoute && (
          <>
            <MapController stops={activeRoute.stops} path={activeRoute.path} />
            
            {/* 優先繪製真實路徑 (activeRoute.path)，如果沒有則退化回直線 (activeRoute.stops) */}
            <Polyline 
              positions={
                activeRoute.path 
                  ? activeRoute.path.map(p => [p.lat, p.lng]) 
                  : activeRoute.stops.map(s => [s.coordinates.lat, s.coordinates.lng])
              }
              pathOptions={purpleOptions}
            />

            {activeRoute.stops.map((stop, idx) => (
              <Marker 
                key={idx} 
                position={[stop.coordinates.lat, stop.coordinates.lng]}
                icon={customIcon}
              >
                <Popup className="font-sans">
                   <div className="p-1">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded text-white mb-1 inline-block ${
                        stop.type === 'start' ? 'bg-green-500' : 
                        stop.type === 'end' ? 'bg-pink-500' : 'bg-indigo-500'
                      }`}>
                        {stop.type === 'start' ? '起點' : stop.type === 'end' ? '終點' : '休息點'}
                      </span>
                      <h3 className="font-bold text-sm text-slate-800">{stop.name}</h3>
                      <p className="text-xs text-slate-500">{stop.description}</p>
                   </div>
                </Popup>
              </Marker>
            ))}
          </>
        )}
      </MapContainer>
      
      {/* Decorative Gradient Overlay */}
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-white/80 to-transparent pointer-events-none z-[400] md:hidden" />
    </div>
  );
};