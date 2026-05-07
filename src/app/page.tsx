"use client";
import React, { useState, useEffect } from 'react';
import Dexie from 'dexie';
import { ShoppingCart, History, Lock, User, CheckCircle, X, Delete } from 'lucide-react';

const db = new Dexie('VentusPOS_V4');
db.version(1).stores({
  receipts: '++id, timestamp, total, staff',
});

export default function SecurePOS() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [cart, setCart] = useState([]);
  const [isCheckedOut, setIsCheckedOut] = useState(false);

  // 模擬員工資料庫 (對標 Ch 5.1)
  const staffMembers = {
    '1234': { name: '店長 Leo', role: 'admin' },
    '0000': { name: '店員 小明', role: 'cashier' }
  };

  const handlePinInput = (num) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      if (newPin.length === 4) {
        if (staffMembers[newPin]) {
          setCurrentUser(staffMembers[newPin]);
          setIsAuthenticated(true);
          setPin('');
        } else {
          alert('密碼錯誤，請重新輸入');
          setPin('');
        }
      }
    }
  };

  const addToCart = (p) => {
    const exist = cart.find(x => x.id === p.id);
    if (exist) {
      setCart(cart.map(x => x.id === p.id ? {...exist, qty: exist.qty + 1} : x));
    } else {
      setCart([...cart, {...p, qty: 1, name: p.name, price: p.price}]);
    }
  };

  const handleCharge = async () => {
    if (cart.length === 0) return;
    await db.receipts.add({
      timestamp: new Date().toISOString(),
      total: cart.reduce((a, c) => a + c.price * c.qty, 0),
      staff: currentUser.name
    });
    setIsCheckedOut(true);
    setCart([]);
  };

  // --- 登入畫面 ---
  if (!isAuthenticated) {
    return (
      <div className="h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <Lock size={48} className="mb-6 text-blue-500" />
        <h1 className="text-3xl font-black mb-2 italic">VENTUS POS V4</h1>
        <p className="text-slate-400 mb-8">請輸入 4 位數 PIN 碼登入</p>
        
        {/* PIN 顯示點 */}
        <div className="flex space-x-4 mb-10">
          {[...Array(4)].map((_, i) => (
            <div key={i} className={`w-4 h-4 rounded-full border-2 border-blue-500 ${pin.length > i ? 'bg-blue-500' : ''}`}></div>
          ))}
        </div>

        {/* 數字鍵盤 (九宮格) */}
        <div className="grid grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
            <button key={n} onClick={() => handlePinInput(n)} className="w-20 h-20 rounded-full bg-slate-800 text-3xl font-bold active:bg-blue-600 transition-colors">{n}</button>
          ))}
          <div className="w-20 h-20"></div>
          <button onClick={() => handlePinInput(0)} className="w-20 h-20 rounded-full bg-slate-800 text-3xl font-bold active:bg-blue-600 transition-colors">0</button>
          <button onClick={() => setPin('')} className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center text-red-500"><Delete size={32}/></button>
        </div>
      </div>
    );
  }

  // --- POS 主畫面 ---
  return (
    <div className="flex h-screen bg-white">
      {/* 頂部狀態列 */}
      <div className="fixed top-0 left-0 right-0 h-12 bg-slate-100 border-b flex items-center justify-between px-6 z-10">
        <div className="flex items-center text-slate-500 text-sm font-bold">
          <User size={16} className="mr-2" /> {currentUser.name} ({currentUser.role})
        </div>
        <button onClick={() => setIsAuthenticated(false)} className="text-red-500 text-sm font-bold">登出</button>
      </div>

      <div className="flex-1 pt-12 flex">
        {/* 商品區 */}
        <div className="flex-1 p-6 grid grid-cols-3 gap-4 bg-slate-50 overflow-y-auto">
          {[
            { id: 1, name: '拿鐵咖啡', price: 120 },
            { id: 2, name: '美式咖啡', price: 90 },
            { id: 3, name: '起司蛋糕', price: 150 }
          ].map(p => (
            <button key={p.id} onClick={() => addToCart(p)} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 active:scale-95 text-left h-32 flex flex-col justify-between">
              <span className="font-bold text-lg">{p.name}</span>
              <span className="text-blue-600 font-black">$ {p.price}</span>
            </button>
          ))}
        </div>

        {/* 結帳區 */}
        <div className="w-96 border-l flex flex-col">
          <div className="p-6 border-b font-black text-xl">當前單據</div>
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {cart.map((item, idx) => (
              <div key={idx} className="flex justify-between font-bold bg-slate-100 p-3 rounded-xl">
                <span>{item.name} x{item.qty}</span>
                <span>$ {item.price * item.qty}</span>
              </div>
            ))}
          </div>
          <div className="p-6 bg-slate-900 text-white">
            <div className="flex justify-between text-3xl font-black mb-6">
              <span>總計</span>
              <span className="text-blue-400">$ {cart.reduce((a,c) => a + c.price*c.qty, 0)}</span>
            </div>
            <button onClick={handleCharge} className="w-full py-4 bg-blue-600 rounded-2xl font-bold text-xl">確認收款</button>
          </div>
        </div>
      </div>

      {isCheckedOut && (
        <div className="fixed inset-0 bg-blue-600 flex flex-col items-center justify-center z-50 text-white">
          <CheckCircle size={100} className="mb-6 animate-bounce" />
          <h2 className="text-4xl font-black">收款成功！</h2>
          <button onClick={() => setIsCheckedOut(false)} className="mt-10 px-10 py-3 bg-white text-blue-600 rounded-xl font-bold">下一筆</button>
        </div>
      )}
    </div>
  );
}
