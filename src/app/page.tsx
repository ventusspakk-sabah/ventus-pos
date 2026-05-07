"use client";
import React, { useState, useEffect, useMemo } from 'react';
import Dexie from 'dexie';
import { 
  ShoppingCart, Package, BarChart3, History, 
  ArrowUpRight, Users, CheckCircle, LogOut, Search, Filter 
} from 'lucide-react';

// 1. 資料庫結構 (對標 Ch 7 報表邏輯)
const db = new Dexie('VentusPOS_V6');
db.version(1).stores({
  receipts: '++id, timestamp, total, staff, items',
  inventory: 'id, name, price, stock, lowStockAlert'
});

export default function AnalyticsPOS() {
  const [view, setView] = useState('pos'); // 'pos' 或 'reports'
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [history, setHistory] = useState([]);
  const [isCheckedOut, setIsCheckedOut] = useState(false);

  // 初始化與讀取數據
  useEffect(() => {
    const loadData = async () => {
      const count = await db.inventory.count();
      if (count === 0) {
        await db.inventory.bulkAdd([
          { id: 1, name: '拿鐵咖啡', price: 120, stock: 50, lowStockAlert: 10 },
          { id: 2, name: '美式咖啡', price: 90, stock: 80, lowStockAlert: 15 },
          { id: 3, name: '起司蛋糕', price: 150, stock: 20, lowStockAlert: 5 }
        ]);
      }
      setProducts(await db.inventory.toArray());
      setHistory(await db.receipts.toArray());
    };
    loadData();
  }, [isCheckedOut, view]);

  // 報表計算邏輯 (對標 Ch 7.1)
  const stats = useMemo(() => {
    const totalRevenue = history.reduce((a, b) => a + b.total, 0);
    const orderCount = history.length;
    const avgTicket = orderCount > 0 ? (totalRevenue / orderCount).toFixed(2) : 0;
    return { totalRevenue, orderCount, avgTicket };
  }, [history]);

  const addToCart = (p) => {
    if (p.stock <= 0) return;
    const exist = cart.find(x => x.id === p.id);
    if (exist) {
      setCart(cart.map(x => x.id === p.id ? {...exist, qty: exist.qty + 1} : x));
    } else {
      setCart([...cart, {...p, qty: 1}]);
    }
  };

  const handleCharge = async () => {
    if (cart.length === 0) return;
    const total = cart.reduce((a, c) => a + c.price * c.qty, 0);
    
    await db.transaction('rw', db.inventory, db.receipts, async () => {
      for (const item of cart) {
        await db.inventory.where('id').equals(item.id).modify(x => { x.stock -= item.qty; });
      }
      await db.receipts.add({
        timestamp: new Date().toISOString(),
        total: total,
        staff: '店長 Leo',
        items: [...cart]
      });
    });

    setIsCheckedOut(true);
    setCart([]);
  };

  if (!isAuthenticated) {
    return (
      <div className="h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <BarChart3 size={64} className="text-blue-500 mb-6" />
        <h1 className="text-4xl font-black italic mb-8">VENTUS V6 ANALYTICS</h1>
        <button onClick={() => setIsAuthenticated(true)} className="px-12 py-4 bg-blue-600 rounded-2xl font-black text-xl shadow-xl active:scale-95 transition-all">
          輸入 PIN 碼登入
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      {/* 側邊導航欄 */}
      <div className="w-20 bg-slate-900 flex flex-col items-center py-8 space-y-10 text-white">
        <button onClick={() => setView('pos')} className={`p-3 rounded-2xl transition-all ${view === 'pos' ? 'bg-blue-600 shadow-lg shadow-blue-500/40' : 'text-slate-500'}`}>
          <ShoppingCart size={28} />
        </button>
        <button onClick={() => setView('reports')} className={`p-3 rounded-2xl transition-all ${view === 'reports' ? 'bg-blue-600 shadow-lg shadow-blue-500/40' : 'text-slate-500'}`}>
          <BarChart3 size={28} />
        </button>
        <button onClick={() => setIsAuthenticated(false)} className="mt-auto text-slate-500 hover:text-red-500"><LogOut size={28} /></button>
      </div>

      {view === 'pos' ? (
        <div className="flex-1 flex">
          {/* POS 銷售介面 */}
          <div className="flex-1 p-6 grid grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto">
            {products.map(p => (
              <button key={p.id} onClick={() => addToCart(p)} disabled={p.stock <= 0} className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-200 active:scale-95 text-left h-40 flex flex-col justify-between">
                <span className="font-black text-xl text-slate-800">{p.name}</span>
                <div className="flex justify-between items-end">
                  <span className="text-blue-600 font-black text-2xl font-mono">$ {p.price}</span>
                  <span className="text-xs font-bold text-slate-400">庫存: {p.stock}</span>
                </div>
              </button>
            ))}
          </div>
          {/* 結帳側欄 */}
          <div className="w-96 bg-white border-l p-6 flex flex-col shadow-xl">
            <h2 className="text-2xl font-black mb-6 italic tracking-tighter">當前單據</h2>
            <div className="flex-1 overflow-y-auto space-y-3">
              {cart.map(item => (
                <div key={item.id} className="flex justify-between p-4 bg-slate-50 rounded-2xl font-bold">
                  <span>{item.name} x{item.qty}</span>
                  <span>$ {item.price * item.qty}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-6 border-t border-slate-100">
              <div className="flex justify-between text-4xl font-black mb-8">
                <span>總額</span><span className="text-blue-600">$ {cart.reduce((a,c)=>a+c.price*c.qty,0)}</span>
              </div>
              <button onClick={handleCharge} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-xl">確認收銀</button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 p-8 overflow-y-auto bg-white">
          {/* 數據分析報表介面 (對標 Ch 7.1) */}
          <div className="max-w-5xl mx-auto">
            <div className="flex justify-between items-end mb-10">
              <h1 className="text-4xl font-black tracking-tighter italic">銷售總覽 Analytics</h1>
              <div className="text-slate-400 font-bold">今日: {new Date().toLocaleDateString()}</div>
            </div>

            {/* 核心指標卡片 */}
            <div className="grid grid-cols-3 gap-6 mb-10">
              <div className="bg-blue-600 p-8 rounded-[40px] text-white shadow-xl shadow-blue-500/20">
                <div className="flex justify-between items-start mb-4">
                  <span className="font-bold opacity-80 uppercase tracking-widest text-xs">總營收額</span>
                  <ArrowUpRight size={20} />
                </div>
                <div className="text-4xl font-black font-mono">$ {stats.totalRevenue}</div>
              </div>
              <div className="bg-slate-900 p-8 rounded-[40px] text-white">
                <div className="flex justify-between items-start mb-4">
                  <span className="font-bold opacity-80 uppercase tracking-widest text-xs">訂單總數</span>
                  <ShoppingCart size={20} />
                </div>
                <div className="text-4xl font-black font-mono">{stats.orderCount}</div>
              </div>
              <div className="bg-white p-8 rounded-[40px] border-2 border-slate-100 shadow-sm">
                <div className="flex justify-between items-start mb-4 text-slate-400">
                  <span className="font-bold uppercase tracking-widest text-xs">平均客單價</span>
                  <Users size={20} />
                </div>
                <div className="text-4xl font-black font-mono text-slate-800">$ {stats.avgTicket}</div>
              </div>
            </div>

            {/* 最近單據列表 (對標 Ch 7.2) */}
            <h2 className="text-2xl font-black mb-6">最近收據紀錄</h2>
            <div className="space-y-4">
              {history.slice().reverse().map(receipt => (
                <div key={receipt.id} className="bg-slate-50 p-6 rounded-3xl flex justify-between items-center hover:bg-slate-100 transition-colors">
                  <div>
                    <div className="font-black text-lg">收據編號 #000{receipt.id}</div>
                    <div className="text-slate-400 text-sm font-bold">{new Date(receipt.timestamp).toLocaleTimeString()} • 收銀員: {receipt.staff}</div>
                  </div>
                  <div className="text-2xl font-black text-blue-600">$ {receipt.total}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {isCheckedOut && (
        <div className="fixed inset-0 bg-blue-600 flex flex-col items-center justify-center z-50 text-white animate-in fade-in duration-300">
          <CheckCircle size={100} className="mb-6 animate-bounce" />
          <h1 className="text-5xl font-black mb-10">收款成功</h1>
          <button onClick={() => setIsCheckedOut(false)} className="px-12 py-4 bg-white text-blue-600 rounded-2xl font-black text-xl">下一筆單</button>
        </div>
      )}
    </div>
  );
}
