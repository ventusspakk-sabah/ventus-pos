"use client";
import React, { useState, useEffect } from 'react';
import Dexie from 'dexie';
import { 
  ShoppingCart, Cloud, CloudOff, CloudSync, 
  Database, ShieldCheck, RefreshCw, Server, Wifi, Globe, Settings 
} from 'lucide-react';

// 1. 資料庫結構：加入同步版本號 (對標 Ch 8.1)
const db = new Dexie('VentusPOS_V18');
db.version(1).stores({
  receipts: '++id, timestamp, total, isSynced',
  inventory: 'id, name, price, stock, lastUpdated',
});

export default function CloudSyncPOS() {
  const [syncStatus, setSyncStatus] = useState('idle'); // 'idle', 'syncing', 'success', 'error'
  const [pendingCount, setPendingCount] = useState(0);
  const [isCheckedOut, setIsCheckedOut] = useState(false);

  // 模擬檢查未同步數據
  useEffect(() => {
    const checkSync = async () => {
      const unsynced = await db.receipts.where('isSynced').equals(0).count();
      setPendingCount(unsynced);
    };
    checkSync();
  }, [isCheckedOut, syncStatus]);

  // 核心：雲端同步引擎 (對標 Ch 8.2)
  const triggerSync = async () => {
    setSyncStatus('syncing');
    
    // 模擬網路延遲與 API 呼叫
    setTimeout(async () => {
      try {
        const unsyncedReceipts = await db.receipts.where('isSynced').equals(0).toArray();
        
        // 這裡未來會接 fetch('https://your-api.com/sync', ...)
        console.log("正在上傳數據至雲端...", unsyncedReceipts);
        
        // 標記為已同步
        await db.receipts.where('isSynced').equals(0).modify({ isSynced: 1 });
        
        setSyncStatus('success');
        setTimeout(() => setSyncStatus('idle'), 3000);
      } catch (e) {
        setSyncStatus('error');
      }
    }, 2000);
  };

  const handleCharge = async () => {
    await db.receipts.add({
      timestamp: new Date().toISOString(),
      total: 100, // 簡化展示
      isSynced: 0
    });
    setIsCheckedOut(true);
  };

  return (
    <div className="flex h-screen bg-slate-950 text-white font-sans overflow-hidden">
      {/* 側邊導航 */}
      <div className="w-24 bg-black flex flex-col items-center py-10 space-y-12">
        <div className="bg-blue-600 p-4 rounded-3xl"><ShoppingCart size={32} /></div>
        <button onClick={triggerSync} className={`p-4 rounded-3xl transition-all ${syncStatus === 'syncing' ? 'animate-spin text-blue-400' : 'text-slate-500 hover:text-white'}`}>
          <CloudSync size={32} />
        </button>
        <div className="mt-auto text-slate-500"><Settings size={32} /></div>
      </div>

      <div className="flex-1 flex flex-col bg-slate-50 text-slate-900">
        <header className="h-24 bg-white border-b px-12 flex items-center justify-between">
          <div className="flex flex-col">
            <h1 className="text-3xl font-black italic tracking-tighter">VENTUS <span className="text-blue-600">CLOUD</span></h1>
            <div className="flex items-center mt-1">
              <div className={`w-2 h-2 rounded-full mr-2 ${syncStatus === 'success' ? 'bg-green-500' : 'bg-blue-500 animate-pulse'}`}></div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {syncStatus === 'syncing' ? '數據傳輸中...' : `待同步單據: ${pendingCount}`}
              </span>
            </div>
          </div>

          <div className="flex gap-4">
             <button onClick={triggerSync} className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold shadow-xl active:scale-95 transition-all">
               {syncStatus === 'syncing' ? <RefreshCw size={18} className="animate-spin"/> : <Cloud size={18}/>}
               立即同步
             </button>
          </div>
        </header>

        <main className="flex-1 p-12 overflow-y-auto">
          {/* 同步狀態看板 */}
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="grid grid-cols-3 gap-8">
              <div className="bg-white p-10 rounded-[50px] shadow-sm border border-slate-100">
                <div className="text-blue-500 mb-4"><Server size={32}/></div>
                <div className="text-3xl font-black mb-1 font-mono">{pendingCount}</div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">本地待同步</div>
              </div>
              <div className="bg-white p-10 rounded-[50px] shadow-sm border border-slate-100">
                <div className="text-green-500 mb-4"><ShieldCheck size={32}/></div>
                <div className="text-3xl font-black mb-1 font-mono">100%</div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">系統健康度</div>
              </div>
              <div className="bg-white p-10 rounded-[50px] shadow-sm border border-slate-100">
                <div className="text-purple-500 mb-4"><Globe size={32}/></div>
                <div className="text-3xl font-black mb-1 font-mono">ASIA-1</div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">目前伺服器</div>
              </div>
            </div>

            {/* 同步日誌預覽 */}
            <div className="bg-slate-900 rounded-[40px] p-10 text-white shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-10"><Database size={120}/></div>
               <h3 className="text-xl font-black mb-6 flex items-center">
                 <RefreshCw size={20} className="mr-3 text-blue-500" /> 同步日誌 (Cloud Logs)
               </h3>
               <div className="space-y-4 font-mono text-sm opacity-80">
                 <div className="flex gap-4"><span className="text-blue-400">[INFO]</span><span>系統檢測到 {pendingCount} 筆新數據。</span></div>
                 <div className="flex gap-4"><span className="text-green-400">[READY]</span><span>加密通道已建立 (AES-256)。</span></div>
                 {syncStatus === 'syncing' && <div className="flex gap-4"><span className="text-yellow-400">[WAIT]</span><span>正在上傳單據數據至雲端集線器...</span></div>}
                 {syncStatus === 'success' && <div className="flex gap-4"><span className="text-green-400">[DONE]</span><span>所有本地數據已與雲端同步完成。</span></div>}
               </div>
            </div>

            <button onClick={handleCharge} className="w-full py-8 bg-blue-600 text-white rounded-[32px] font-black text-2xl shadow-xl shadow-blue-500/20 active:scale-95 transition-all">
              測試收銀 (產生待同步數據)
            </button>
          </div>
        </main>
      </div>

      {isCheckedOut && (
        <div className="fixed inset-0 bg-blue-600 flex flex-col items-center justify-center z-[100] text-white">
          <CheckCircle size={120} className="mb-6 animate-bounce" />
          <h1 className="text-5xl font-black mb-10">本地存檔成功</h1>
          <button onClick={() => setIsCheckedOut(false)} className="px-16 py-5 bg-white text-blue-600 rounded-3xl font-black text-2xl shadow-2xl">返回</button>
        </div>
      )}
    </div>
  );
}
