"use client";
import React, { useState, useEffect, useMemo } from 'react';
import Dexie from 'dexie';
import { 
  ShoppingCart, BarChart3, Users, Package, 
  Search, UserPlus, UserCheck, Star, Trash2, CheckCircle, X, LogOut 
} from 'lucide-react';

// 1. 資料庫結構升級：加入顧客表 (對標 Ch 6.1)
const db = new Dexie('VentusPOS_V7');
db.version(1).stores({
  receipts: '++id, timestamp, total, staff, customerId',
  inventory: 'id, name, price, stock, lowStockAlert',
  customers: '++id, name, phone, email, points'
});

export default function LoyaltyPOS() {
  const [view, setView] = useState('pos');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [isCheckedOut, setIsCheckedOut] = useState(false);
  
  // CRM 狀態
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showCRM, setShowCRM] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [newCust, setNewCust] = useState({ name: '', phone: '' });

  useEffect(() => {
    const load = async () => {
      if (await db.inventory.count() === 0) {
        await db.inventory.bulkAdd([
          { id: 1, name: '拿鐵咖啡', price: 120, stock: 50, lowStockAlert: 5 },
          { id: 2, name: '美式咖啡', price: 90, stock: 100, lowStockAlert: 10 },
          { id: 3, name: '起司蛋糕', price: 150, stock: 20, lowStockAlert: 5 }
        ]);
      }
      setProducts(await db.inventory.toArray());
      setCustomers(await db.customers.toArray());
    };
    load();
  }, [isCheckedOut, showCRM]);

  const addToCart = (p) => {
    if (p.stock <= 0) return;
    const exist = cart.find(x => x.id === p.id);
    setCart(exist ? cart.map(x => x.id === p.id ? {...exist, qty: exist.qty + 1} : x) : [...cart, {...p, qty: 1}]);
  };

  const total = cart.reduce((a, c) => a + c.price * c.qty, 0);

  // 核心邏輯：結帳並更新顧客點數 (對標 Ch 6.2)
  const handleCharge = async () => {
    if (cart.length === 0) return;
    const earnedPoints = Math.floor(total / 100); // 每100元贈1點

    await db.transaction('rw', db.inventory, db.receipts, db.customers, async () => {
      // 扣庫存
      for (const item of cart) {
        await db.inventory.where('id').equals(item.id).modify(x => { x.stock -= item.qty; });
      }
      // 存收據
      await db.receipts.add({
        timestamp: new Date().toISOString(),
        total: total,
        staff: '店長 Leo',
        customerId: selectedCustomer?.id || null
      });
      // 更新顧客點數
      if (selectedCustomer) {
        await db.customers.where('id').equals(selectedCustomer.id).modify(x => {
          x.points = (x.points || 0) + earnedPoints;
        });
      }
    });

    setIsCheckedOut(true);
    setCart([]);
    setSelectedCustomer(null);
  };

  const addCustomer = async () => {
    if (!newCust.name || !newCust.phone) return;
    const id = await db.customers.add({ ...newCust, points: 0 });
    setNewCust({ name: '', phone: '' });
    setSelectedCustomer({ id, ...newCust, points: 0 });
    setShowCRM(false);
  };

  if (!isAuthenticated) return (
    <div className="h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
      <Users size={64} className="text-blue-500 mb-6" />
      <h1 className="text-4xl font-black italic mb-8">VENTUS CRM v7</h1>
      <button onClick={() => setIsAuthenticated(true)} className="px-12 py-4 bg-blue-600 rounded-2xl font-black text-xl shadow-xl">進入系統</button>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      {/* 側邊導航 */}
      <div className="w-20 bg-slate-900 flex flex-col items-center py-8 space-y-10 text-white shadow-2xl">
        <button onClick={() => setView('pos')} className={`p-3 rounded-2xl transition-all ${view === 'pos' ? 'bg-blue-600 shadow-lg' : 'text-slate-500'}`}><ShoppingCart size={28} /></button>
        <button onClick={() => setView('reports')} className={`p-3 rounded-2xl transition-all ${view === 'reports' ? 'bg-blue-600 shadow-lg' : 'text-slate-500'}`}><BarChart3 size={28} /></button>
        <button onClick={() => setIsAuthenticated(false)} className="mt-auto text-slate-500 hover:text-red-500"><LogOut size={28} /></button>
      </div>

      <div className="flex-1 flex">
        {/* 商品區 */}
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-20 bg-white border-b px-8 flex items-center justify-between shadow-sm">
            <h2 className="font-black text-2xl text-slate-800 tracking-tighter">POS 銷售</h2>
            {/* 顧客選擇器 (對標 Ch 2.2.1) */}
            <button 
              onClick={() => setShowCRM(true)}
              className={`flex items-center px-6 py-2 rounded-2xl border-2 transition-all ${selectedCustomer ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-slate-200 text-slate-400'}`}
            >
              {selectedCustomer ? <UserCheck size={20} className="mr-2" /> : <UserPlus size={20} className="mr-2" />}
              <span className="font-bold">{selectedCustomer ? selectedCustomer.name : '選擇顧客'}</span>
              {selectedCustomer && <span className="ml-2 bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded-full">{selectedCustomer.points} 點</span>}
            </button>
          </header>

          <div className="flex-1 p-6 grid grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto">
            {products.map(p => (
              <button key={p.id} onClick={() => addToCart(p)} disabled={p.stock <= 0} className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 hover:border-blue-500 active:scale-95 text-left h-44 flex flex-col justify-between transition-all">
                <span className="font-black text-xl text-slate-800">{p.name}</span>
                <div className="flex justify-between items-end">
                  <span className="text-blue-600 font-black text-3xl font-mono">$ {p.price}</span>
                  <span className="text-xs font-bold text-slate-400">庫存: {p.stock}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 結帳側欄 */}
        <div className="w-96 bg-white border-l shadow-2xl flex flex-col">
          <div className="p-8 border-b bg-slate-50 flex justify-between items-center">
            <h3 className="font-black text-xl">單據明細</h3>
            <button onClick={() => setCart([])} className="text-slate-300 hover:text-red-500"><Trash2 size={20}/></button>
          </div>
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {cart.map(item => (
              <div key={item.id} className="flex justify-between p-4 bg-slate-50 rounded-2xl font-bold border border-slate-100">
                <span>{item.name} x{item.qty}</span>
                <span>$ {item.price * item.qty}</span>
              </div>
            ))}
          </div>
          <div className="p-8 bg-slate-900 text-white rounded-t-[48px]">
            <div className="flex justify-between text-4xl font-black mb-8 tracking-tighter">
              <span>總額</span><span className="text-blue-400">$ {total}</span>
            </div>
            <button onClick={handleCharge} className="w-full py-6 bg-blue-600 hover:bg-blue-500 rounded-3xl font-black text-2xl shadow-xl shadow-blue-500/20 active:scale-95 transition-all">
              確認結帳
            </button>
          </div>
        </div>
      </div>

      {/* CRM 彈窗 (對標 Ch 6.3) */}
      {showCRM && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col h-[80vh]">
            <div className="p-8 border-b flex justify-between items-center">
              <h2 className="text-3xl font-black italic">顧客管理中心</h2>
              <button onClick={() => setShowCRM(false)}><X size={32}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              {/* 新增顧客 */}
              <div className="bg-slate-50 p-6 rounded-[32px] space-y-4">
                <h3 className="font-black text-lg">快速加入會員</h3>
                <div className="grid grid-cols-2 gap-4">
                  <input placeholder="顧客姓名" className="p-4 rounded-xl border focus:ring-2 ring-blue-500 outline-none" value={newCust.name} onChange={e=>setNewCust({...newCust, name: e.target.value})} />
                  <input placeholder="電話號碼" className="p-4 rounded-xl border focus:ring-2 ring-blue-500 outline-none" value={newCust.phone} onChange={e=>setNewCust({...newCust, phone: e.target.value})} />
                </div>
                <button onClick={addCustomer} className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold">建立並選取顧客</button>
              </div>
              {/* 會員列表 */}
              <div className="space-y-4">
                <h3 className="font-black text-lg">現有會員搜尋</h3>
                {customers.map(c => (
                  <button key={c.id} onClick={() => {setSelectedCustomer(c); setShowCRM(false);}} className="w-full bg-white border-2 border-slate-100 p-6 rounded-3xl flex justify-between items-center hover:border-blue-500 transition-all text-left">
                    <div>
                      <div className="font-black text-xl">{c.name}</div>
                      <div className="text-slate-400 font-bold">{c.phone}</div>
                    </div>
                    <div className="flex items-center text-blue-600 font-black text-xl bg-blue-50 px-4 py-2 rounded-xl">
                      <Star size={20} className="mr-2 fill-current" /> {c.points} 點
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {isCheckedOut && (
        <div className="fixed inset-0 bg-blue-600 flex flex-col items-center justify-center z-[100] text-white">
          <CheckCircle size={120} className="mb-6 animate-bounce" />
          <h1 className="text-5xl font-black mb-10 text-center">收款成功！<br/><span className="text-2xl opacity-70">點計已自動累計至會員帳戶</span></h1>
          <button onClick={() => setIsCheckedOut(false)} className="px-16 py-5 bg-white text-blue-600 rounded-3xl font-black text-2xl shadow-2xl">下一筆</button>
        </div>
      )}
    </div>
  );
}
