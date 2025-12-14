import React, { useState } from 'react';
import { RouteOption, UserInput } from './types';
import { generateWalkingRoutes } from './services/geminiService';
import { InputForm } from './components/InputForm';
import { MapView } from './components/MapView';
import { RouteList } from './components/RouteList';
import { motion, AnimatePresence } from 'framer-motion';
import { Footprints, ChevronLeft } from 'lucide-react';

const App: React.FC = () => {
  const [input, setInput] = useState<UserInput>({
    origin: '',
    destination: '',
    interval: 1.5,
  });

  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [activeRouteIndex, setActiveRouteIndex] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [viewState, setViewState] = useState<'input' | 'results'>('input');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const generatedRoutes = await generateWalkingRoutes(
        input.origin,
        input.destination,
        input.interval
      );
      setRoutes(generatedRoutes);
      setViewState('results');
      setActiveRouteIndex(0);
    } catch (err: any) {
      setError(err.message || '無法產生路線');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setViewState('input');
    setRoutes([]);
  };

  return (
    <div className="flex h-screen w-screen bg-slate-50 overflow-hidden font-sans">
      
      {/* Sidebar / Floating Panel */}
      <div className="absolute z-20 top-0 left-0 h-full w-full md:w-[450px] bg-white shadow-2xl flex flex-col pointer-events-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-white">
            <div className="flex items-center gap-2">
                <div className="bg-indigo-600 p-2 rounded-lg text-white">
                    <Footprints className="h-6 w-6" />
                </div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">RestWalk</h1>
            </div>
            {viewState === 'results' && (
                 <button 
                 onClick={handleReset}
                 className="text-sm text-slate-500 hover:text-indigo-600 font-medium flex items-center gap-1 transition-colors"
               >
                 <ChevronLeft className="w-4 h-4" /> 重新搜尋
               </button>
            )}
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
            <AnimatePresence mode="wait">
                {viewState === 'input' ? (
                    <motion.div 
                        key="input"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="p-6"
                    >
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold text-slate-800 mb-2">規劃您的旅程</h2>
                            <p className="text-slate-500">
                                探索舒適的步行路線，並獲得智慧休息站點建議。
                            </p>
                        </div>
                        
                        <InputForm 
                            input={input} 
                            setInput={setInput} 
                            onSubmit={handleSubmit} 
                            isLoading={loading}
                        />

                        {error && (
                            <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
                                {error}
                            </div>
                        )}
                        
                        <div className="mt-12 p-5 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100/50">
                            <h4 className="font-semibold text-indigo-900 mb-2">使用說明</h4>
                            <ul className="space-y-2 text-sm text-indigo-700/80">
                                <li className="flex gap-2">• <span>輸入您的起點和終點</span></li>
                                <li className="flex gap-2">• <span>設定您偏好的休息距離間隔</span></li>
                                <li className="flex gap-2">• <span>AI 將自動計算最佳休息地點</span></li>
                            </ul>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div 
                        key="results"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="p-6"
                    >
                        <h2 className="text-lg font-bold text-slate-800 mb-4">推薦路線</h2>
                        
                        {/* Route Tabs */}
                        <div className="flex gap-2 mb-6 p-1 bg-slate-100 rounded-xl">
                            {routes.map((route, idx) => (
                                <button
                                    key={route.id}
                                    onClick={() => setActiveRouteIndex(idx)}
                                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                                        activeRouteIndex === idx 
                                        ? 'bg-white text-indigo-600 shadow-sm' 
                                        : 'text-slate-500 hover:text-slate-700'
                                    }`}
                                >
                                    方案 {idx + 1}
                                </button>
                            ))}
                        </div>

                        {routes[activeRouteIndex] && (
                            <RouteList route={routes[activeRouteIndex]} />
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-white text-center text-xs text-slate-400">
            由 Gemini 2.5 驅動 • 地圖資料 © OpenStreetMap
        </div>
      </div>

      {/* Main Map Area (Background on Mobile, Right side on Desktop) */}
      <div className="absolute inset-0 md:relative md:flex-1 bg-slate-200">
        <MapView activeRoute={routes[activeRouteIndex] || null} />
      </div>

    </div>
  );
};

export default App;