"use client";
import React, { useState, useEffect } from 'react';
import { ShoppingCart, Package, Plus, Minus, CheckCircle } from 'lucide-react';

export default function NativePOSApp() {
  const [cart, setCart] = useState([]);
  const [isCheckedOut, setIsCheckedOut] = useState(false);

  // 1:1 複刻專業商品目錄
  const products = [
    { id: 101, name: '拿鐵 (大)', price: 120, sku: 'COF-LAT-L' },
    { id: 102, name: '美式 (中)', price: 80, sku: 'COF-AME-M' },
    { id: 103, name: '卡布奇諾', price: 110, sku: 'COF-CAP' },
    { id: 104, name: '起司蛋糕', price: 150, sku: 'CAK-CHE' },
  ];

  const addToCart = (p) => {
    const exist = cart.find(x => x.id === p.id);
    if (exist) {
      setCart(cart.map(x => x.id === p.id ? {...exist, qty: exist.qty + 1} : x));
    } else {
      setCart([...cart, {...p, qty: 1}]);
    }
  };

  const total = cart.reduce((a, c) => a + c.price * c.qty, 0);

  return (
    <div className="flex h-screen bg-white text-slate-900 overflow-hidden">
      {/* 左側：商品選擇面板 */}
      <div className="flex-1 bg-slate-100 p-4 grid grid-cols-2 gap-4 overflow-y-auto">
        {products.map(p => (
          <button 
            key={p.id}
            onClick={() => addToCart(p)}
            className="bg-white p-6 rounded-2xl shadow-sm border-2 border-transparent active:border-blue-500 active:bg-blue-50 transition-all text-left"
          >
            <div className="text-xs text-slate-400 mb-1">{p.sku}</div>
            <div className="font-bold text-lg">{p.name}</div>
            <div className="mt-4 text-blue-600 font-mono font-black text-xl">$ {p.price}</div>
          </button>
        ))}
      </div>

      {/* 右側：固定結帳面板 */}
      <div className="w-80 border-l bg-white flex flex-col">
        <div className="p-6 border-b font-black text-2xl">帳單明細</div>
        
        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          {cart.map(item => (
            <div key={item.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg">
              <div>
                <div className="font-bold">{item.name}</div>
                <div className="text-sm text-slate-500">x {item.qty}</div>
              </div>
              <div className="font-mono font-bold">$ {item.price * item.qty}</div>
            </div>
          ))}
        </div>

        <div className="p-6 bg-slate-900 text-white rounded-t-3xl">
          <div className="flex justify-between mb-2 opacity-60"><span>小計</span><span>$ {total}</span></div>
          <div className="flex justify-between text-3xl font-black mb-6"><span>總計</span><span>$ {total}</span></div>
          <button 
            onClick={() => setIsCheckedOut(true)}
            className="w-full py-4 bg-blue-500 hover:bg-blue-400 rounded-xl font-black text-xl transition-colors"
          >
            結帳 CHARGE
          </button>
        </div>
      </div>

      {/* 結帳成功彈窗 (對標專業介面) */}
      {isCheckedOut && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-3xl p-10 max-w-sm w-full text-center">
            <CheckCircle size={80} className="text-green-500 mx-auto mb-6" />
            <h2 className="text-3xl font-black mb-2">收款成功</h2>
            <p className="text-slate-500 mb-8">收據已自動存入系統</p>
            <button 
              onClick={() => {setCart([]); setIsCheckedOut(false);}}
              className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold"
            >
              開始下一筆
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
