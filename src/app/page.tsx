"use client";
import React, { useState, useEffect, useMemo } from 'react';
import Dexie from 'dexie';
import { 
  ShoppingCart, Utensils, Clock, CheckCircle2, 
  Timer, ChevronRight, LayoutDashboard, Bell, X, Trash2
} from 'lucide-react';

// 1. 資料庫結構：加入訂單狀態欄位 (對標 Ch 9.2)
const db = new Dexie('VentusPOS_V19');
db.version(1).stores({
  orders: '++id, timestamp, items, total, status, waitTime', // status: 'pending', 'preparing', 'ready'
});

export default function KitchenPOS() {
  const [view, setView] = useState('pos'); // 'pos' 或 'kds'
  const [orders, setOrders] = useState([]);
  const [cart, setCart] = useState([]);
  const [isCheckedOut, setIsCheckedOut] = useState(false);

  // 定時刷新：讓廚房看到最新訂單並更新等待時間
  useEffect(() => {
    const fetchOrders = async () => {
      const allOrders = await db.orders.toArray();
      setOrders(allOrders);
    };
    fetchOrders();
    const interval = setInterval(fetchOrders, 3000);
    return () => clearInterval(interval);
  }, [view, isCheckedOut]);

  const handleCharge = async () => {
    if (cart.length === 0) return;
    await db.orders.add({
      timestamp: new Date().toISOString(),
      items: JSON.stringify(cart),
      total: cart.reduce((a, c) => a + c.price, 0),
      status: 'pending'
    });
    setIsCheckedOut(true);
    setCart([]);
  };

  const updateStatus = async (id, newStatus) => {
    await db.orders.update(id, { status: newStatus });
    setOrders(await db.orders.toArray());
  };

  return (
    <div className="flex h-screen bg-slate-950 text-white font-sans overflow-hidden">
      {/* 側邊切換欄 (對標專業 KDS 介面) */}
      <div className="w-24 bg-black flex flex-col items-center py-10 space-y-12 shadow-[5px_0_30px_rgba(0,0,0,0.5)] z-20">
        <button onClick={() => setView('pos')} className={`p-4 rounded-[24px] transition-all ${view === 'pos' ? 'bg-blue-600 shadow-lg shadow-blue-500/50' : 'text-slate-600'}`}>
          <ShoppingCart size={32} />
        </button>
        <button onClick={() => setView('kds')} className={`p-4 rounded-[24px] transition-all ${view === 'kds' ? 'bg-orange-600 shadow-lg shadow-orange-500/50' : 'text-slate-600'}`}>
          <Utensils size={32} />
        </button>
        <div className="mt-auto flex flex-col items-center gap-6">
           <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 animate-pulse">
             <Bell size={24} className="text-orange-400" />
           </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-slate-50 text-slate-900">
        {view === 'pos' ? (
          <div className="flex-1 flex">
            {/* 收銀模式介面 */}
            <div className="flex-1 p-8 grid grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto">
              {[ {id:1, name:'厚切豬排飯', price:180}, {id:2, name:'招牌咖啡', price:120} ].map(p => (
                <button key={p.id} onClick={() => setCart([...cart, p])} className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 h-44 flex flex-col justify-between text-left active:scale-95 transition-all">
                  <span className="font-black text-2xl text-slate-800">{p.name}</span>
                  <span className="text-blue-600 font-black text-2xl font-mono">$ {p.price}</span>
                </button>
              ))}
            </div>
            <div className="w-96 bg-white border-l shadow-2xl p-8 flex flex-col">
              <h2 className="text-2xl font-black mb-8 italic tracking-tighter uppercase">New Ticket</h2>
              <div className="flex-1 overflow-y-auto space-y-4">
                {cart.map((item, i) => <div key={i} className="p-4 bg-slate-50 rounded-2xl font-bold flex justify-between"><span>{item.name}</span><span>$ {item.price}</span></div>)}
              </div>
              <button onClick={handleCharge} className="w-full mt-6 py-6 bg-slate-900 text-white rounded-3xl font-black text-xl shadow-xl active:scale-95 transition-all">發送到廚房</button>
            </div>
          </div>
        ) : (
          <div className="flex-1 p-8 bg-slate-900 overflow-hidden flex flex-col">
            {/* KDS 廚房模式介面 (對標 Ch 9.2.1) */}
            <header className="flex justify-between items-end mb-10">
              <h1 className="text-4xl font-black text-white italic tracking-tighter">KDS <span className="text-orange-500">MONITOR</span></h1>
              <div className="flex gap-4">
                 <div className="bg-slate-800 px-6 py-2 rounded-full text-xs font-bold text-orange-400 border border-orange-500/30 uppercase tracking-widest">廚房系統運行中</div>
              </div>
            </header>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 overflow-y-auto pb-10">
              {orders.filter(o => o.status !== 'ready').map(order => (
                <div key={order.id} className={`bg-white rounded-[40px] p-8 flex flex-col justify-between shadow-2xl border-l-[12px] ${order.status === 'preparing' ? 'border-orange-500' : 'border-blue-500'}`}>
                  <div>
                    <div className="flex justify-between items-start mb-6">
                      <span className="font-black text-3xl">#00{order.id}</span>
                      <div className="flex items-center text-slate-400 font-bold text-sm">
                        <Clock size={16} className="mr-1" />
                        {new Date(order.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                    <div className="space-y-3 mb-8">
                      {JSON.parse(order.items).map((item, idx) => (
                        <div key={idx} className="flex justify-between text-xl font-bold text-slate-700">
                          <span>• {item.name}</span>
                          <span className="text-slate-300">x1</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    {order.status === 'pending' ? (
                      <button 
                        onClick={() => updateStatus(order.id, 'preparing')}
                        className="flex-1 py-5 bg-blue-600 text-white rounded-2xl font-black text-lg shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                      >
                        開始製作
                      </button>
                    ) : (
                      <button 
                        onClick={() => updateStatus(order.id, 'ready')}
                        className="flex-1 py-5 bg-green-500 text-white rounded-2xl font-black text-lg shadow-lg shadow-green-500/20 active:scale-95 transition-all"
                      >
                        完成出餐
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {isCheckedOut && (
        <div className="fixed inset-0 bg-blue-600 flex flex-col items-center justify-center z-[100] text-white">
          <CheckCircle2 size={120} className="mb-6 animate-bounce" />
          <h1 className="text-5xl font-black mb-10">單據已送往廚房</h1>
          <button onClick={() => setIsCheckedOut(false)} className="px-16 py-5 bg-white text-blue-600 rounded-3xl font-black text-2xl shadow-2xl">返回收銀</button>
        </div>
      )}
    </div>
  );
}
