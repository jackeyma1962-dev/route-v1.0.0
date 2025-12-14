import React from 'react';
import { RouteOption } from '../types';
import { Flag, MapPin, Coffee, Navigation } from 'lucide-react';

interface RouteListProps {
  route: RouteOption;
}

export const RouteList: React.FC<RouteListProps> = ({ route }) => {
  
  const handleOpenGoogleMaps = () => {
    if (!route.stops || route.stops.length < 2) return;

    const start = route.stops[0];
    const end = route.stops[route.stops.length - 1];
    const intermediateStops = route.stops.slice(1, -1);

    // Build query parameters
    const originParam = `${start.coordinates.lat},${start.coordinates.lng}`;
    const destParam = `${end.coordinates.lat},${end.coordinates.lng}`;
    
    let waypointsParam = '';
    if (intermediateStops.length > 0) {
      // Google Maps expects waypoints separated by pipe '|'
      const points = intermediateStops
        .map(stop => `${stop.coordinates.lat},${stop.coordinates.lng}`)
        .join('|');
      waypointsParam = `&waypoints=${points}`;
    }

    // Construct full URL
    const url = `https://www.google.com/maps/dir/?api=1&origin=${originParam}&destination=${destParam}${waypointsParam}&travelmode=walking`;
    
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
        <h3 className="font-bold text-indigo-900 text-lg mb-1">{route.name}</h3>
        <p className="text-sm text-indigo-700 mb-3 leading-relaxed">{route.description}</p>
        <div className="flex gap-4 text-xs font-semibold text-indigo-800 mb-4">
          <span className="bg-white px-2 py-1 rounded shadow-sm">{route.totalDistance}</span>
          <span className="bg-white px-2 py-1 rounded shadow-sm">{route.estimatedDuration}</span>
          <span className="bg-white px-2 py-1 rounded shadow-sm">{route.stops.length} 個站點</span>
        </div>

        <button 
          onClick={handleOpenGoogleMaps}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 px-4 rounded-lg text-sm font-medium transition-colors shadow-md shadow-indigo-200 active:scale-[0.98]"
        >
          <Navigation className="w-4 h-4" />
          開啟 Google Maps 導航
        </button>
      </div>

      <div className="relative pl-4 border-l-2 border-slate-200 ml-3 space-y-8">
        {route.stops.map((stop, idx) => (
          <div key={idx} className="relative group">
            {/* Timeline Dot */}
            <div className={`absolute -left-[21px] top-0 h-4 w-4 rounded-full border-2 border-white shadow-sm transition-transform group-hover:scale-110 ${
                stop.type === 'start' ? 'bg-green-500' :
                stop.type === 'end' ? 'bg-pink-500' : 'bg-indigo-500'
            }`} />

            <div className="flex items-start justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        {stop.type === 'start' && <MapPin className="w-4 h-4 text-green-600" />}
                        {stop.type === 'end' && <Flag className="w-4 h-4 text-pink-600" />}
                        {stop.type === 'rest' && <Coffee className="w-4 h-4 text-indigo-600" />}
                        <h4 className="font-bold text-slate-800">{stop.name}</h4>
                    </div>
                    <p className="text-sm text-slate-500 mb-1">{stop.description}</p>
                </div>
            </div>
            
            {idx < route.stops.length - 1 && (
                <div className="mt-2 inline-block px-2 py-0.5 bg-slate-100 text-[10px] font-medium text-slate-500 rounded-full">
                    距離下一站: {route.stops[idx + 1].distanceFromPrev}
                </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};