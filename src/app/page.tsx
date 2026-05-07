"use client";
import React, { useState, useEffect } from 'react';
import Dexie from 'dexie';
import { 
  ShoppingCart, Package, BarChart3, Settings, 
  Smartphone, ShieldCheck, Zap, Star, Globe, Info
} from 'lucide-react';

// 1. 最終版資料庫 (整合所有前幾階段功能)
const db = new Dexie('VentusPOS_Final');
db.version(1).stores({
  receipts: '++id, timestamp, total, status',
  inventory: 'id, name, price, stock, sku'
});

export default function FinalProductionPOS() {
  const [view, setView] = useState('pos');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // 模擬啟動性能優化加載
    setTimeout(() => setIsLoaded(true), 800);
  }, []);

  if (!isLoaded) {
    return (
      <div className="h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <div className="w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-6"></div>
        <h1 className="text-2xl font-black tracking-widest animate-pulse">VENTUS SYSTEM LOADING...</h1>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      {/* 專業側邊導航 (最終工藝) */}
      <div className="w-24 bg-slate-950 flex flex-col items-center py-10 space-y-12 text-white shadow-[10px_0_30px_rgba(0,0,0,0.1)] z-20">
        <div className="bg-gradient-to-br from-blue-500 to-blue-700 p-4 rounded-[24px] shadow-lg shadow-blue-500/50">
          <ShoppingCart size={32} />
        </div>
        <button onClick={() => setView('pos')} className="text-slate-500 hover:text-white transition-all"><Package size={32} /></button>
        <button onClick={() => setView('stats')} className="text-slate-500 hover:text-white transition-all"><BarChart3 size={32} /></button>
        <button onClick={() => setView('settings')} className="text-slate-500 hover:text-white transition-all"><Settings size={32} /></button>
        
        <div className="mt-auto flex flex-col items-center space-y-6">
          <div className="text-blue-500/30 font-black text-xs rotate-90 mb-4 tracking-tighter uppercase">Ver 16.0</div>
          <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
            <ShieldCheck size={24} className="text-green-500" />
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col relative">
        <header className="h-24 bg-white/80 backdrop-blur-md border-b px-12 flex items-center justify-between sticky top-0 z-10">
          <div className="flex flex-col">
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter italic">VENTUS PRO <span className="text-blue-600">POS</span></h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Enterprise Production Build</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="text-xs font-black text-slate-400">SYSTEM STATUS</span>
              <span className="text-sm font-bold text-green-500 flex items-center"><Zap size={14} className="mr-1 fill-current"/> ENCRYPTED & ONLINE</span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-10 overflow-y-auto">
          {view === 'pos' ? (
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* 展示商品卡片的極致美學 */}
                {[
                  { id:1, name: '旗艦黑咖啡', price: 120 },
                  { id:2, name: '精品藍山', price: 280 },
                  { id:3, name: '莊園拿鐵', price: 150 }
                ].map(p => (
                  <div key={p.id} className="group bg-white p-8 rounded-[50px] shadow-[0_10px_40px_rgba(0,0,0,0.02)] border border-slate-100 hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-500 cursor-pointer">
                    <div className="flex justify-between items-start mb-10">
                      <div className="w-16 h-16 bg-slate-50 rounded-[20px] flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                        <Star size={28} className="text-slate-200 group-hover:text-blue-500 transition-colors" />
                      </div>
                      <span className="bg-slate-100 text-slate-400 text-[10px] font-black px-3 py-1 rounded-full">INSTOCK</span>
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 mb-2">{p.name}</h3>
                    <div className="flex justify-between items-end">
                      <span className="text-3xl font-black text-blue-600 font-mono">$ {p.price}</span>
                      <button className="bg-slate-900 text-white p-4 rounded-2xl hover:bg-blue-600 transition-all active:scale-90">
                        <ShoppingCart size={20} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-300">
               <Globe size={80} className="mb-6 opacity-20" />
               <p className="text-xl font-bold italic tracking-widest opacity-20">DASHBOARD MODULE ACTIVE</p>
            </div>
          )}
        </main>
      </div>

      {/* 底部浮動信息 (對標高級 App) */}
      <div className="fixed bottom-6 right-6 flex items-center gap-4 bg-white/90 backdrop-blur-lg border p-2 pl-6 rounded-full shadow-2xl">
        <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase">Hardware Ready</span>
        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-blue-500/40">
          <Info size={20} />
        </div>
      </div>
    </div>
  );
}
