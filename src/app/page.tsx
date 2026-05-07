"use client";
import React, { useState, useEffect } from 'react';
import Dexie from 'dexie';
import { 
  ShoppingCart, columns, Users, Divide, 
  CreditCard, Banknote, CheckCircle, X, Plus, Minus, Info 
} from 'lucide-react';

// 1. 資料庫結構：支持單筆訂單多重支付 (對標 Ch 2.15)
const db = new Dexie('VentusPOS_V23');
db.version(1).stores({
  orders: '++id, total, paidAmount, status, tableId',
  payments: '++id, orderId, method, amount, timestamp'
});

export default function SplitPaymentPOS() {
  const [cart, setCart] = useState([
    { id: 1, name: '戰斧牛排', price: 1200, qty: 1 },
    { id: 2, name: '波爾多紅酒', price: 800, qty: 1 }
  ]);
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [splitCount, setSplitCount] = useState(2);
  const [paidSoFar, setPaidSoFar] = useState(0);
  const [isCheckedOut, setIsCheckedOut] = useState(false);

  const total = cart.reduce((a, c) => a + c.price * c.qty, 0);
  const remaining = total - paidSoFar;

  const handlePartialPayment = (method, amount) => {
    const nextAmount = paidSoFar + amount;
    if (nextAmount >= total) {
      setPaidSoFar(total);
      setIsCheckedOut(true);
    } else {
      setPaidSoFar(nextAmount);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      {/* 側邊導航 */}
      <div className="w-24 bg-slate-950 flex flex-col items-center py-10 space-y-12 text-white">
        <div className="bg-blue-600 p-4 rounded-3xl"><ShoppingCart size={32} /></div>
        <button onClick={() => setShowSplitModal(true)} className="text-slate-500 hover:text-white transition-all">
          <Divide size={32} />
        </button>
        <div className="mt-auto text-slate-600 font-black text-xs uppercase tracking-tighter italic">V23 Build</div>
      </div>

      <div className="flex-1 flex">
        {/* 左側購物車預覽 */}
        <div className="flex-1 p-12 flex flex-col">
          <header className="mb-10 flex justify-between items-end">
            <div>
              <h1 className="text-4xl font-black italic tracking-tighter uppercase">Order Checkout</h1>
              <p className="text-slate-400 font-bold">正在處理拆單結帳邏輯...</p>
            </div>
            <div className="flex items-center gap-2 bg-white px-6 py-3 rounded-2xl shadow-sm border">
               <Info size={16} className="text-blue-500" />
               <span className="text-sm font-bold text-slate-500 tracking-tight">訂單編號: #8892</span>
            </div>
          </header>

          <div className="flex-1 bg-white rounded-[60px] shadow-sm border p-10 overflow-y-auto space-y-6">
            {cart.map(item => (
              <div key={item.id} className="flex justify-between items-center border-b border-dashed pb-6">
                <div>
                  <h3 className="text-2xl font-black">{item.name}</h3>
                  <p className="text-slate-400 font-mono text-sm font-bold">$ {item.price} x {item.qty}</p>
                </div>
                <span className="text-2xl font-black font-mono">$ {item.price * item.qty}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 右側專業結帳面板 (拆帳核心) */}
        <div className="w-[500px] bg-white border-l shadow-2xl flex flex-col relative">
          <div className="p-10 border-b flex justify-between items-center bg-slate-50">
            <h2 className="text-2xl font-black italic">結帳摘要</h2>
            <div className="bg-blue-600 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Active</div>
          </div>

          <div className="flex-1 p-10 flex flex-col justify-center space-y-8">
            <div className="text-center">
              <span className="text-slate-400 font-bold uppercase tracking-widest text-xs">總計金額</span>
              <div className="text-6xl font-black tracking-tighter text-slate-900 mt-2">$ {total}</div>
            </div>

            {/* 餘額顯示 (對標 Ch 2.15) */}
            <div className="bg-slate-900 rounded-[40px] p-8 text-white relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold opacity-50 uppercase">已付金額</span>
                  <span className="text-green-400 font-black font-mono">$ {paidSoFar}</span>
                </div>
                <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden mb-6">
                  <div className="bg-blue-500 h-full transition-all duration-500" style={{ width: `${(paidSoFar / total) * 100}%` }}></div>
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-lg font-bold">待收餘額</span>
                  <span className="text-4xl font-black text-blue-400 font-mono">$ {remaining}</span>
                </div>
              </div>
            </div>

            {/* 支付按鈕群 */}
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => handlePartialPayment('CASH', remaining)} className="p-6 bg-slate-50 border-2 border-slate-100 rounded-3xl flex flex-col items-center gap-2 active:scale-95 transition-all">
                <Banknote size={24} className="text-green-500" />
                <span className="font-bold text-sm">現金支付</span>
              </button>
              <button onClick={() => handlePartialPayment('CARD', remaining)} className="p-6 bg-slate-50 border-2 border-slate-100 rounded-3xl flex flex-col items-center gap-2 active:scale-95 transition-all">
                <CreditCard size={24} className="text-blue-500" />
                <span className="font-bold text-sm">刷卡支付</span>
              </button>
            </div>
            
            <button onClick={() => setShowSplitModal(true)} className="w-full py-5 bg-white border-2 border-blue-600 text-blue-600 rounded-3xl font-black text-xl flex items-center justify-center gap-2">
              <Divide size={24}/> 進行拆單結帳
            </button>
          </div>
        </div>
      </div>

      {/* 拆單計算器彈窗 (對標 Ch 2.15.1) */}
      {showSplitModal && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-50 flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-lg rounded-[60px] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-10 border-b flex justify-between items-center bg-slate-50">
              <h3 className="text-3xl font-black italic">均分拆帳計算</h3>
              <button onClick={() => setShowSplitModal(false)}><X size={32}/></button>
            </div>
            <div className="p-10 space-y-10">
              <div className="flex flex-col items-center">
                <span className="text-slate-400 font-bold mb-4 uppercase tracking-widest text-xs">拆分人數</span>
                <div className="flex items-center gap-8">
                  <button onClick={() => setSplitCount(Math.max(2, splitCount - 1))} className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 active:bg-blue-500 active:text-white"><Minus/></button>
                  <span className="text-6xl font-black font-mono">{splitCount}</span>
                  <button onClick={() => setSplitCount(splitCount + 1)} className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 active:bg-blue-500 active:text-white"><Plus/></button>
                </div>
              </div>
              <div className="bg-blue-600 p-8 rounded-[40px] text-white text-center">
                <span className="font-bold opacity-60 block mb-2 uppercase text-xs">每人應付 (Per Person)</span>
                <div className="text-5xl font-black font-mono">$ {(total / splitCount).toFixed(0)}</div>
              </div>
              <button onClick={() => { handlePartialPayment('SPLIT', total/splitCount); setShowSplitModal(false); }} className="w-full py-6 bg-slate-900 text-white rounded-3xl font-black text-2xl">收一筆並關閉</button>
            </div>
          </div>
        </div>
      )}

      {isCheckedOut && (
        <div className="fixed inset-0 bg-blue-600 flex flex-col items-center justify-center z-[100] text-white">
          <CheckCircle size={150} className="mb-10 animate-bounce text-white" />
          <h1 className="text-7xl font-black mb-12 italic tracking-tighter">結帳完畢</h1>
          <button onClick={() => {setIsCheckedOut(false); setPaidSoFar(0);}} className="px-24 py-8 bg-white text-blue-600 rounded-[40px] font-black text-3xl shadow-2xl">下一筆訂單</button>
        </div>
      )}
    </div>
  );
}
