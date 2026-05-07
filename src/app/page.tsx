"use client";
import React, { useState, useEffect, useMemo } from 'react';
import Dexie from 'dexie';
import { 
  ShoppingCart, LayoutGrid, Users, Utensils, 
  Scan, Globe, RefreshCw, BarChart3, Settings, 
  CheckCircle, Divide, Trash2, X, Plus, Minus, Banknote, CreditCard, Clock, Tag
} from 'lucide-react';

// 1. 統一資料庫引擎 (Master Database)
const db = new Dexie('VentusPOS_Final_Master');
db.version(1).stores({
  inventory: 'id, name, price, sku, stock',
  orders: '++id, tableId, total, paidAmount, status, timestamp, items',
  tables: 'id, name, status, seats',
  settings: 'key, value'
});

export default function VentusMasterPOS() {
  // --- 全域狀態 ---
  const [view, setView] = useState('floor'); // floor (桌位), pos (點餐), kds (廚房), checkout (結帳)
  const [tables, setTables] = useState([]);
  const [activeTable, setActiveTable] = useState(null);
  const [cart, setCart] = useState([]);
  const [paidSoFar, setPaidSoFar] = useState(0);
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [splitCount, setSplitCount] = useState(2);
  const [isCheckedOut, setIsCheckedOut] = useState(false);

  // --- 初始化數據 ---
  useEffect(() => {
    const init = async () => {
      if (await db.tables.count() === 0) {
        await db.tables.bulkAdd([
          { id: 1, name: 'A01', status: 'free', seats: 2 },
          { id: 2, name: 'A02', status: 'occupied', seats: 4 },
          { id: 3, name: 'B01', status: 'free', seats: 6 },
          { id: 4, name: 'VIP-1', status: 'free', seats: 8 }
        ]);
      }
      setTables(await db.tables.toArray());
    };
    init();
  }, [view, isCheckedOut]);

  // --- 核心計算 ---
  const subtotal = useMemo(() => cart.reduce((a, c) => a + (c.price * (c.qty || 1)), 0), [cart]);
  const remaining = subtotal - paidSoFar;

  // --- 動作邏輯 ---
  const selectTable = (table) => {
    setActiveTable(table);
    setView('pos');
  };

  const addToCart = (p) => {
    const exist = cart.find(x => x.id === p.id);
    if (exist) {
      setCart(cart.map(x => x.id === p.id ? {...x, qty: x.qty + 1} : x));
    } else {
      setCart([...cart, {...p, qty: 1}]);
    }
  };

  const handlePayment = async (amount) => {
    const nextAmount = paidSoFar + amount;
    if (nextAmount >= subtotal) {
      setPaidSoFar(subtotal);
      // 結帳存檔
      await db.orders.add({
        tableId: activeTable?.id,
        total: subtotal,
        status: 'paid',
        timestamp: new Date().toISOString(),
        items: JSON.stringify(cart)
      });
      if (activeTable) await db.tables.update(activeTable.id, { status: 'free' });
      setIsCheckedOut(true);
    } else {
      setPaidSoFar(nextAmount);
    }
  };

  return (
    <div className="flex h-screen bg-slate-900 text-white font-sans overflow-hidden">
      {/* 1. 旗艦導航欄 */}
      <nav className="w-20 bg-black flex flex-col items-center py-8 space-y-10 shadow-2xl z-50">
        <button onClick={() => setView('floor')} className={`p-3 rounded-2xl transition-all ${view === 'floor' ? 'bg-blue-600 text-white' : 'text-slate-600'}`}><LayoutGrid size={28}/></button>
        <button onClick={() => setView('pos')} className={`p-3 rounded-2xl transition-all ${view === 'pos' ? 'bg-blue-600 text-white' : 'text-slate-600'}`}><ShoppingCart size={28}/></button>
        <button onClick={() => setView('kds')} className={`p-3 rounded-2xl transition-all ${view === 'kds' ? 'bg-orange-600 text-white' : 'text-slate-600'}`}><Utensils size={28}/></button>
        <div className="mt-auto text-slate-800"><Settings size={28}/></div>
      </nav>

      {/* 2. 主內容區 */}
      <div className="flex-1 flex flex-col bg-slate-100 text-slate-900 overflow-hidden">
        <header className="h-20 bg-white border-b px-8 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-black italic tracking-tighter">VENTUS <span className="text-blue-600">PRO</span></h1>
            {activeTable && <span className="bg-blue-50 text-blue-600 px-4 py-1 rounded-full text-xs font-black">TABLE: {activeTable.name}</span>}
          </div>
          <div className="flex items-center gap-3">
             <div className="bg-green-50 text-green-600 px-3 py-1 rounded-full text-[10px] font-bold flex items-center"><RefreshCw size={12} className="mr-1"/> CLOUD ONLINE</div>
          </div>
        </header>

        <main className="flex-1 p-8 overflow-y-auto">
          {view === 'floor' && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {tables.map(t => (
                <button key={t.id} onClick={() => selectTable(t)} className={`h-48 rounded-[40px] border-2 transition-all flex flex-col items-center justify-center gap-3 ${t.status === 'occupied' ? 'bg-orange-50 border-orange-200' : 'bg-white border-transparent shadow-sm'}`}>
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${t.status === 'occupied' ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-300'}`}><Users size={24}/></div>
                  <div className="text-center"><div className="font-black text-xl">{t.name}</div><div className="text-[10px] font-bold opacity-30">{t.seats} SEATS</div></div>
                </button>
              ))}
            </div>
          )}

          {view === 'pos' && (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
              {[ {id:101, name:'極上戰斧牛排', price:1200}, {id:102, name:'典藏波爾多', price:800}, {id:103, name:'松露薯條', price:250} ].map(p => (
                <button key={p.id} onClick={() => addToCart(p)} className="bg-white p-8 rounded-[40px] shadow-sm border border-transparent active:border-blue-500 text-left flex flex-col justify-between h-44">
                  <span className="font-black text-xl">{p.name}</span>
                  <span className="text-blue-600 font-black text-2xl font-mono">$ {p.price}</span>
                </button>
              ))}
            </div>
          )}

          {view === 'kds' && (
            <div className="flex flex-col items-center justify-center h-full opacity-20"><Utensils size={100}/><p className="font-black mt-4 uppercase tracking-widest">Kitchen Display Active</p></div>
          )}
        </main>
      </div>

      {/* 3. 結帳側欄 (整合 V23 拆帳邏輯) */}
      <aside className={`w-[400px] bg-white border-l shadow-2xl flex flex-col text-slate-900 transition-all ${view === 'floor' ? 'translate-x-full' : ''}`}>
        <div className="p-8 border-b flex justify-between items-center bg-slate-50/50">
          <h2 className="text-xl font-black italic">TICKET</h2>
          <button onClick={() => setCart([])}><Trash2 size={20} className="text-slate-300"/></button>
        </div>

        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {cart.map((item, i) => (
            <div key={i} className="flex justify-between items-center font-bold bg-slate-50 p-4 rounded-2xl">
              <span>{item.name} x{item.qty}</span>
              <span className="font-mono text-blue-600">$ {item.price * item.qty}</span>
            </div>
          ))}
        </div>

        {/* 支付區域 */}
        <div className="p-8 bg-slate-950 text-white rounded-t-[48px] shadow-2xl">
           <div className="flex justify-between text-xs font-bold opacity-40 uppercase tracking-widest mb-2">Remaining</div>
           <div className="text-5xl font-black mb-8 text-blue-400 font-mono tracking-tighter">$ {remaining}</div>
           
           <div className="grid grid-cols-2 gap-3 mb-6">
             <button onClick={() => handlePayment(remaining)} className="py-4 bg-white/10 rounded-2xl flex items-center justify-center gap-2 font-bold hover:bg-white/20"><Banknote size={18}/> 現金</button>
             <button onClick={() => handlePayment(remaining)} className="py-4 bg-white/10 rounded-2xl flex items-center justify-center gap-2 font-bold hover:bg-white/20"><CreditCard size={18}/> 刷卡</button>
           </div>

           <button onClick={() => setShowSplitModal(true)} className="w-full py-5 bg-blue-600 rounded-3xl font-black text-lg flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95 transition-all">
             <Divide size={20}/> 拆單結帳
           </button>
        </div>
      </aside>

      {/* 拆單 Modal */}
      {showSplitModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-lg rounded-[50px] shadow-2xl overflow-hidden text-slate-900">
            <div className="p-10 border-b flex justify-between items-center">
              <h3 className="text-3xl font-black italic">拆分帳單</h3>
              <button onClick={() => setShowSplitModal(false)}><X size={32}/></button>
            </div>
            <div className="p-10 space-y-10">
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-8">
                  <button onClick={() => setSplitCount(Math.max(2, splitCount-1))} className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center"><Minus/></button>
                  <span className="text-6xl font-black">{splitCount}</span>
                  <button onClick={() => setSplitCount(splitCount+1)} className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center"><Plus/></button>
                </div>
              </div>
              <div className="bg-blue-600 p-8 rounded-[35px] text-white text-center">
                <span className="text-xs font-bold opacity-60 uppercase">每人應付</span>
                <div className="text-5xl font-black font-mono">$ {(subtotal / splitCount).toFixed(0)}</div>
              </div>
              <button onClick={() => { handlePayment(subtotal/splitCount); setShowSplitModal(false); }} className="w-full py-6 bg-slate-900 text-white rounded-3xl font-black text-xl">收一筆並關閉</button>
            </div>
          </div>
        </div>
      )}

      {isCheckedOut && (
        <div className="fixed inset-0 bg-blue-600 flex flex-col items-center justify-center z-[200] text-white">
          <CheckCircle size={150} className="mb-10 animate-bounce" />
          <h1 className="text-7xl font-black mb-10 italic tracking-tighter uppercase">Paid Success</h1>
          <button onClick={() => {setIsCheckedOut(false); setView('floor'); setCart([]); setPaidSoFar(0);}} className="px-20 py-6 bg-white text-blue-600 rounded-[35px] font-black text-3xl shadow-2xl">NEXT ORDER</button>
        </div>
      )}
    </div>
  );
}
