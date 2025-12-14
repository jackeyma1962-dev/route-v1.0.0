import React from 'react';
import { MapPin, Navigation, Timer } from 'lucide-react';
import { UserInput } from '../types';

interface InputFormProps {
  input: UserInput;
  setInput: React.Dispatch<React.SetStateAction<UserInput>>;
  onSubmit: () => void;
  isLoading: boolean;
}

export const InputForm: React.FC<InputFormProps> = ({ input, setInput, onSubmit, isLoading }) => {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MapPin className="h-5 w-5 text-indigo-500 group-focus-within:text-indigo-600 transition-colors" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl leading-5 bg-slate-50 text-black placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm"
            placeholder="起點 (例如: 台北 101)"
            value={input.origin}
            onChange={(e) => setInput({ ...input, origin: e.target.value })}
          />
        </div>

        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Navigation className="h-5 w-5 text-pink-500 group-focus-within:text-pink-600 transition-colors" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl leading-5 bg-slate-50 text-black placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all shadow-sm"
            placeholder="終點 (例如: 西門町)"
            value={input.destination}
            onChange={(e) => setInput({ ...input, destination: e.target.value })}
          />
        </div>
      </div>

      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
            <Timer className="w-4 h-4 text-slate-500" />
            休息間隔
          </label>
          <span className="text-sm font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-md">
            每 {input.interval} 公里
          </span>
        </div>
        <input
          type="range"
          min="0.5"
          max="5.0"
          step="0.5"
          value={input.interval}
          onChange={(e) => setInput({ ...input, interval: parseFloat(e.target.value) })}
          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
        />
        <div className="flex justify-between text-xs text-slate-400 mt-1">
          <span>0.5 km</span>
          <span>5 km</span>
        </div>
      </div>

      <button
        onClick={onSubmit}
        disabled={isLoading || !input.origin || !input.destination}
        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-[0.98]"
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            正在規劃路線...
          </span>
        ) : (
          "搜尋路線"
        )}
      </button>
    </div>
  );
};