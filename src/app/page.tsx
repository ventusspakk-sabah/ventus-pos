"use client";
import React, { useState, useEffect } from 'react';
import Dexie from 'dexie';
import { 
  ShoppingCart, LayoutGrid, Users, UtensilsCrossed, 
  CheckCircle, X, Trash2, ArrowRightLeft, Clock, Info
} from 'lucide-react';

// 1. 資料庫結構：加入桌位狀態支援 (對標 Ch 2.14)
const db = new Dexie('VentusPOS_V22');
db.version(1).stores({
  tables: 'id, name, status, seats, orderId', // status: 'free', 'occupied', 'dirty'
  orders: '++id, tableId, items, total, timestamp',
  inventory: 'id, name, price'
});

export default function FloorPlanPOS() {
  const [view, setView] = useState('floor'); // 'floor' 或 'pos'
  const [tables, setTables] = useState([]);
  const [activeTable, setActiveTable] = useState(null);
  const [cart, setCart] = useState([]);
  const [isCheckedOut, setIsCheckedOut] = useState(false);

  useEffect(() => {
    const initTables = async () => {
      const count = await db.tables.count();
      if (count === 0) {
        await db.tables.bulkAdd([
          { id: 1, name: 'A01', status: 'free', seats: 2 },
          { id: 2, name: 'A02', status: 'occupied', seats: 4 },
          { id: 3, name: 'B01', status: 'free', seats: 6 },
          { id: 4, name: 'B02', status: 'free', seats: 2 },
          { id: 5, name: 'VIP-1', status: 'occupied', seats: 8 },
          { id: 6, name: 'VIP-2', status: 'free', seats: 8 }
        ]);
      }
      setTables(await db.tables.toArray());
    };
    initTables();
  }, [view, isCheckedOut]);

  // 核心：選擇桌位並掛帳
  const handleTableClick = (table) => {
    setActiveTable(table);
    setView('pos');
    // 如果是佔用中，未來這裡可以加載歷史掛帳單據
  };

  const handleCharge = async () => {
    if (cart.length === 0) return;
    await db.transaction('rw', db.tables, async () => {
      await db.tables.update(activeTable.id, { status: 'free' }); // 結帳後釋放桌位
    });
    setIsCheckedOut(true);
    setCart([]);
  };

  return (
    <div className="flex h-screen bg-slate-900 text-white font-sans overflow-hidden">
      {/* 側邊導航 */}
      <div className="w-24 bg-black flex flex-col items-center py-10 space-y-12">
        <button onClick={() => setView('floor')} className={`p-4 rounded-3xl transition-all ${view === 'floor' ? 'bg-blue-600 shadow-lg shadow-blue-500/50' : 'text-slate-600'}`}>
          <LayoutGrid size={32} />
        </button>
        <button onClick={() => setView('pos')} className={`p-4 rounded-3xl transition-all ${view === 'pos' ? 'bg-blue-600 shadow-lg shadow-blue-500/50' : 'text-slate-600'}`}>
          <ShoppingCart size={32} />
        </button>
        <div className="mt-auto text-slate-600"><Users size={32} /></div>
      </div>

      <div className="flex-1 flex flex-col bg-slate-100 text-slate-900">
        <header className="h-24 bg-white border-b px-12 flex items-center justify-between">
          <div className="flex flex-col">
            <h1 className="text-3xl font-black italic tracking-tighter">VENTUS <span className="text-blue-600">FLOOR</span></h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Table Management System</p>
          </div>
          {activeTable && (
            <div className="flex items-center bg-blue-50 px-6 py-2 rounded-2xl border border-blue-100">
              <UtensilsCrossed size={18} className="mr-3 text-blue-600" />
              <span className="font-black text-blue-900">目前桌號: {activeTable.name}</span>
            </div>
          )}
        </header>

        <main className="flex-1 p-10 overflow-y-auto">
          {view === 'floor' ? (
            <div className="max-w-5xl mx-auto">
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-2xl font-black tracking-tighter italic">餐廳佈局概覽</h2>
                <div className="flex gap-4">
                  <div className="flex items-center text-xs font-bold text-slate-400"><div className="w-3 h-3 bg-white border rounded-full mr-2"></div> 空桌</div>
                  <div className="flex items-center text-xs font-bold text-orange-500"><div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div> 用餐中</div>
                </div>
              </div>

              {/* 桌位佈局圖 (對標 Ch 2.14) */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                {tables.map(table => (
                  <button 
                    key={table.id}
                    onClick={() => handleTableClick(table)}
                    className={`p-8 rounded-[50px] shadow-sm border-2 transition-all flex flex-col items-center justify-center space-y-4 h-56 ${table.status === 'occupied' ? 'bg-orange-50 border-orange-200' : 'bg-white border-transparent active:border-blue-500'}`}
                  >
                    <div className={`w-16 h-16 rounded-3xl flex items-center justify-center ${table.status === 'occupied' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30' : 'bg-slate-100 text-slate-400'}`}>
                       {table.status === 'occupied' ? <Clock size={32}/> : <LayoutGrid size={32}/>}
                    </div>
                    <div className="text-center">
                      <div className="font-black text-2xl text-slate-800">{table.name}</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase">{table.seats} SEATS</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex gap-8">
               {/* 銷售模式 (簡化版) */}
               <div className="flex-1 grid grid-cols-2 gap-6">
                 {[ {id:1, name:'厚切和牛堡', price:380}, {id:2, name:'經典松露麵', price:420} ].map(p => (
                   <button key={p.id} onClick={() => setCart([...cart, p])} className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100 flex flex-col justify-between h-56 text-left active:scale-95 transition-all">
                     <span className="font-black text-3xl">{p.name}</span>
                     <span className="text-blue-600 font-black text-4xl font-mono">$ {p.price}</span>
                   </button>
                 ))}
               </div>
               
               {/* 側邊掛帳單 */}
               <div className="w-[450px] bg-white rounded-[60px] shadow-2xl border flex flex-col">
                  <div className="p-10 border-b flex justify-between items-center bg-slate-50">
                    <h3 className="font-black text-2xl italic">TABLE {activeTable?.name}</h3>
                    <button onClick={() => setView('floor')}><ArrowRightLeft className="text-slate-400"/></button>
                  </div>
                  <div className="flex-1 p-8 overflow-y-auto space-y-4">
                    {cart.map((item, i) => <div key={i} className="p-4 bg-slate-100 rounded-3xl font-bold flex justify-between"><span>{item.name}</span><span>$ {item.price}</span></div>)}
                  </div>
                  <div className="p-10 bg-slate-950 text-white rounded-t-[60px]">
                    <div className="flex justify-between text-5xl font-black mb-10 tracking-tighter">
                      <span className="text-white text-3xl">TOTAL</span>
                      <span className="text-blue-400">$ {cart.reduce((a,c)=>a+c.price,0)}</span>
                    </div>
                    <button onClick={handleCharge} className="w-full py-7 bg-blue-600 rounded-[35px] font-black text-2xl shadow-xl active:scale-95 transition-all">
                      完成結帳 (CHECK OUT)
                    </button>
                  </div>
               </div>
            </div>
          )}
        </main>
      </div>

      {isCheckedOut && (
        <div className="fixed inset-0 bg-blue-600 flex flex-col items-center justify-center z-[100] text-white">
          <CheckCircle size={150} className="mb-10 animate-bounce" />
          <h1 className="text-6xl font-black mb-12 italic tracking-tighter">桌位已釋放</h1>
          <button onClick={() => {setIsCheckedOut(false); setView('floor');}} className="px-24 py-8 bg-white text-blue-600 rounded-[40px] font-black text-3xl shadow-2xl">返回桌圖</button>
        </div>
      )}
    </div>
  );
}
