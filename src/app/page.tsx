"use client";
import React, { useState, useEffect } from 'react';
import Dexie from 'dexie';
import { 
  ShoppingCart, Settings, Printer, Store, 
  MapPin, Phone, MessageSquare, CheckCircle, Trash2, X 
} from 'lucide-react';

// 1. 資料庫結構：加入系統設置表
const db = new Dexie('VentusPOS_V12');
db.version(1).stores({
  receipts: '++id, timestamp, total, items',
  settings: 'key, value'
});

export default function BrandedPOS() {
  const [view, setView] = useState('pos'); // 'pos' 或 'settings'
  const [cart, setCart] = useState([]);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [lastReceipt, setLastReceipt] = useState(null);
  
  // 店鋪設置狀態 (對標 Ch 2.8)
  const [shopSettings, setShopSettings] = useState({
    name: 'VENTUS CAFE',
    address: '台北市信義區忠孝東路五段',
    phone: '02-2345-6789',
    footer: '謝謝惠顧，歡迎再次光臨！'
  });

  useEffect(() => {
    const loadSettings = async () => {
      const saved = await db.settings.get('shop_info');
      if (saved) setShopSettings(saved.value);
    };
    loadSettings();
  }, [view]);

  const saveSettings = async (newSettings) => {
    setShopSettings(newSettings);
    await db.settings.put({ key: 'shop_info', value: newSettings });
    alert('設置已更新！');
  };

  const handleCharge = async () => {
    if (cart.length === 0) return;
    const receipt = {
      timestamp: new Date().toISOString(),
      items: [...cart],
      total: cart.reduce((a, c) => a + c.price * c.qty, 0),
      shop: { ...shopSettings }
    };
    await db.receipts.add(receipt);
    setLastReceipt(receipt);
    setIsReceiptOpen(true);
    setCart([]);
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      {/* 側邊導航 */}
      <div className="w-20 bg-slate-900 flex flex-col items-center py-8 space-y-10 text-white shadow-2xl">
        <button onClick={() => setView('pos')} className={`p-3 rounded-2xl ${view === 'pos' ? 'bg-blue-600 shadow-lg shadow-blue-500/50' : 'text-slate-500'}`}><ShoppingCart size={28} /></button>
        <button onClick={() => setView('settings')} className={`p-3 rounded-2xl ${view === 'settings' ? 'bg-blue-600 shadow-lg shadow-blue-500/50' : 'text-slate-500'}`}><Settings size={28} /></button>
        <div className="mt-auto text-slate-500"><Printer size={28} /></div>
      </div>

      {view === 'pos' ? (
        <div className="flex-1 flex">
          {/* POS 銷售介面 */}
          <div className="flex-1 p-6 grid grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto">
            {[
              { id: 1, name: '招牌拿鐵', price: 120 },
              { id: 2, name: '手沖耶加', price: 160 },
              { id: 3, name: '提拉米蘇', price: 150 }
            ].map(p => (
              <button key={p.id} onClick={() => setCart([...cart, {...p, qty: 1}])} className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 active:scale-95 text-left h-44 flex flex-col justify-between">
                <span className="font-black text-2xl tracking-tighter">{p.name}</span>
                <span className="text-blue-600 font-black text-3xl font-mono">$ {p.price}</span>
              </button>
            ))}
          </div>

          {/* 結帳側欄 */}
          <div className="w-96 bg-white border-l shadow-2xl flex flex-col">
            <div className="p-8 border-b bg-slate-50">
              <h2 className="text-xl font-black italic tracking-tighter">{shopSettings.name}</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.map((item, idx) => (
                <div key={idx} className="flex justify-between p-4 bg-slate-50 rounded-2xl font-bold">
                  <span>{item.name} x1</span>
                  <span>$ {item.price}</span>
                </div>
              ))}
            </div>
            <div className="p-8 bg-slate-900 text-white rounded-t-[50px]">
              <div className="flex justify-between text-4xl font-black mb-8">
                <span>總額</span><span className="text-blue-400">$ {cart.reduce((a,c)=>a+c.price,0)}</span>
              </div>
              <button onClick={handleCharge} className="w-full py-6 bg-blue-600 rounded-3xl font-black text-2xl active:scale-95 transition-all">確認收款</button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 p-12 bg-white overflow-y-auto">
          {/* 店鋪設置介面 (對標 Ch 2.8) */}
          <div className="max-w-2xl mx-auto space-y-10">
            <h1 className="text-4xl font-black tracking-tighter italic">店鋪與收據設置</h1>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">店鋪名稱</label>
                <input className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-blue-500 outline-none text-lg font-bold" 
                  value={shopSettings.name} onChange={(e) => setShopSettings({...shopSettings, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">店鋪地址</label>
                <input className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-blue-500 outline-none font-bold" 
                  value={shopSettings.address} onChange={(e) => setShopSettings({...shopSettings, address: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">聯絡電話</label>
                <input className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-blue-500 outline-none font-bold font-mono" 
                  value={shopSettings.phone} onChange={(e) => setShopSettings({...shopSettings, phone: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">收據腳註 (Footer)</label>
                <textarea className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-blue-500 outline-none font-bold h-32" 
                  value={shopSettings.footer} onChange={(e) => setShopSettings({...shopSettings, footer: e.target.value})} />
              </div>
              <button onClick={() => saveSettings(shopSettings)} className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black text-xl shadow-xl">保存所有設置</button>
            </div>
          </div>
        </div>
      )}

      {/* 專業熱敏收據預覽彈窗 */}
      {isReceiptOpen && lastReceipt && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-xs rounded-lg shadow-2xl p-6 font-mono text-xs overflow-hidden animate-in slide-in-from-bottom duration-300">
            <div className="text-center space-y-1 mb-6">
              <h3 className="text-xl font-bold uppercase">{lastReceipt.shop.name}</h3>
              <p>{lastReceipt.shop.address}</p>
              <p>TEL: {lastReceipt.shop.phone}</p>
              <div className="border-b-2 border-dashed border-slate-200 pt-4"></div>
            </div>
            
            <div className="space-y-2 mb-6">
              {lastReceipt.items.map((item, idx) => (
                <div key={idx} className="flex justify-between">
                  <span>{item.name} x{item.qty}</span>
                  <span>{item.price * item.qty}</span>
                </div>
              ))}
            </div>

            <div className="border-t-2 border-dashed border-slate-200 pt-4 space-y-1">
              <div className="flex justify-between text-lg font-bold">
                <span>TOTAL</span><span>$ {lastReceipt.total}</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-4 text-center">--- {new Date(lastReceipt.timestamp).toLocaleString()} ---</p>
              <p className="mt-4 text-center italic">{lastReceipt.shop.footer}</p>
            </div>

            <button onClick={() => setIsReceiptOpen(false)} className="w-full mt-8 py-3 bg-slate-900 text-white rounded-lg font-bold text-sm">關閉預覽</button>
          </div>
        </div>
      )}
    </div>
  );
}
