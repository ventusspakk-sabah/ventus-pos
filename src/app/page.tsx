"use client";
import React, { useState, useEffect } from 'react';
import Dexie from 'dexie';
import { ShoppingCart, Package, AlertTriangle, CheckCircle, User, LogOut, Search } from 'lucide-react';

// 1. 資料庫升級：加入庫存管理 (對標 Ch 3.4)
const db = new Dexie('VentusPOS_V5');
db.version(1).stores({
  receipts: '++id, timestamp, total, staff',
  inventory: 'id, name, price, stock, lowStockAlert'
});

export default function InventoryPOS() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [isCheckedOut, setIsCheckedOut] = useState(false);
  const [pin, setPin] = useState('');

  // 初始化商品與庫存數據
  useEffect(() => {
    const initData = async () => {
      const count = await db.inventory.count();
      if (count === 0) {
        await db.inventory.bulkAdd([
          { id: 1, name: '拿鐵咖啡', price: 120, stock: 50, lowStockAlert: 10 },
          { id: 2, name: '美式咖啡', price: 90, stock: 100, lowStockAlert: 20 },
          { id: 3, name: '起司蛋糕', price: 150, stock: 5, lowStockAlert: 3 },
          { id: 4, name: '手工餅乾', price: 45, stock: 0, lowStockAlert: 5 }
        ]);
      }
      const allItems = await db.inventory.toArray();
      setProducts(allItems);
    };
    initData();
  }, [isCheckedOut]);

  const handlePinInput = (num) => {
    const newPin = pin + num;
    setPin(newPin);
    if (newPin.length === 4) {
      if (newPin === '1234') {
        setCurrentUser({ name: '店長 Leo' });
        setIsAuthenticated(true);
      } else {
        alert('PIN 碼錯誤');
      }
      setPin('');
    }
  };

  const addToCart = (p) => {
    if (p.stock <= 0) return; // 售罄攔截
    const exist = cart.find(x => x.id === p.id);
    if (exist) {
      if (exist.qty >= p.stock) return; // 超過庫存攔截
      setCart(cart.map(x => x.id === p.id ? {...exist, qty: exist.qty + 1} : x));
    } else {
      setCart([...cart, {...p, qty: 1}]);
    }
  };

  // 核心邏輯：結帳並更新庫存 (對標 Ch 4.1)
  const handleCharge = async () => {
    if (cart.length === 0) return;
    
    await db.transaction('rw', db.inventory, db.receipts, async () => {
      for (const item of cart) {
        await db.inventory.where('id').equals(item.id).modify(x => {
          x.stock -= item.qty;
        });
      }
      await db.receipts.add({
        timestamp: new Date().toISOString(),
        total: cart.reduce((a, c) => a + c.price * c.qty, 0),
        staff: currentUser.name
      });
    });

    setIsCheckedOut(true);
    setCart([]);
  };

  if (!isAuthenticated) {
    return (
      <div className="h-screen bg-slate-900 flex flex-col items-center justify-center text-white font-sans">
        <Package size={60} className="text-blue-500 mb-4" />
        <h1 className="text-4xl font-black italic mb-10">VENTUS V5</h1>
        <div className="flex space-x-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className={`w-5 h-5 rounded-full border-2 border-blue-400 ${pin.length > i ? 'bg-blue-400' : ''}`}></div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-6">
          {[1,2,3,4,5,6,7,8,9,0].map(n => (
            <button key={n} onClick={() => handlePinInput(n)} className="w-20 h-20 bg-slate-800 rounded-full text-3xl font-bold active:bg-blue-600 transition-colors">{n}</button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-100 font-sans overflow-hidden">
      {/* 導覽列 */}
      <div className="w-20 bg-white border-r flex flex-col items-center py-6 space-y-8 shadow-sm">
        <div className="text-blue-600"><ShoppingCart size={32} /></div>
        <div className="text-slate-300"><Package size={32} /></div>
        <button onClick={() => setIsAuthenticated(false)} className="mt-auto text-slate-300 hover:text-red-500"><LogOut size={32} /></button>
      </div>

      {/* 商品與庫存區 */}
      <div className="flex-1 flex flex-col">
        <header className="h-16 bg-white border-b px-8 flex items-center justify-between shadow-sm">
          <h2 className="font-black text-xl text-slate-800 tracking-tighter">庫存監控系統</h2>
          <div className="flex items-center text-sm font-bold bg-slate-100 px-4 py-2 rounded-full text-slate-500">
            <User size={16} className="mr-2" /> {currentUser.name}
          </div>
        </header>

        <div className="flex-1 p-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto">
          {products.map(p => (
            <button 
              key={p.id} 
              onClick={() => addToCart(p)}
              disabled={p.stock <= 0}
              className={`relative bg-white p-6 rounded-[32px] shadow-sm border-2 transition-all text-left flex flex-col justify-between h-44 ${p.stock <= 0 ? 'opacity-50 grayscale' : 'active:scale-95 border-transparent active:border-blue-500'}`}
            >
              <div>
                <div className="font-black text-xl leading-tight text-slate-800">{p.name}</div>
                {/* 庫存預警標籤 */}
                <div className={`mt-2 inline-flex items-center text-xs font-bold px-2 py-1 rounded-lg ${p.stock <= p.lowStockAlert ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                  {p.stock <= p.lowStockAlert && <AlertTriangle size={12} className="mr-1" />}
                  剩餘: {p.stock}
                </div>
              </div>
              <div className="text-blue-600 font-black text-2xl font-mono">$ {p.price}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 結帳側欄 */}
      <div className="w-96 bg-white border-l shadow-2xl flex flex-col">
        <div className="p-6 border-b font-black text-2xl italic tracking-tighter">當前 Ticket</div>
        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          {cart.map(item => (
            <div key={item.id} className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="font-bold">{item.name} <span className="text-blue-500 ml-1">x{item.qty}</span></div>
              <div className="font-mono font-bold text-slate-600">$ {item.price * item.qty}</div>
            </div>
          ))}
        </div>
        <div className="p-8 bg-slate-900 text-white rounded-t-[48px]">
          <div className="flex justify-between text-4xl font-black mb-8 tracking-tighter">
            <span>總計</span>
            <span className="text-blue-400">$ {cart.reduce((a,c) => a + c.price*c.qty, 0)}</span>
          </div>
          <button onClick={handleCharge} className="w-full py-5 bg-blue-600 hover:bg-blue-500 rounded-3xl font-black text-2xl shadow-xl active:scale-95 transition-all">
            確認收款
          </button>
        </div>
      </div>

      {isCheckedOut && (
        <div className="fixed inset-0 bg-blue-600 flex flex-col items-center justify-center z-50 text-white">
          <CheckCircle size={100} className="mb-6 animate-bounce" />
          <h1 className="text-4xl font-black mb-10 text-center">交易完成<br/><span className="text-xl opacity-70">庫存已自動同步扣除</span></h1>
          <button onClick={() => setIsCheckedOut(false)} className="px-12 py-4 bg-white text-blue-600 rounded-2xl font-black text-xl shadow-2xl">下一筆</button>
        </div>
      )}
    </div>
  );
}
