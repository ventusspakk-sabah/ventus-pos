"use client";
import React, { useState, useEffect } from 'react';
import Dexie from 'dexie';
import { 
  ShoppingCart, Divide, Users, 
  CreditCard, Banknote, CheckCircle, X, Plus, Minus, Info 
} from 'lucide-react';

// 1. 資料庫結構：支持單筆訂單多重支付
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
        <div className="bg-blue-600 p-4 rounded-3xl shadow-lg shadow-blue-500/20"><ShoppingCart size={32} /></div>
        <button onClick={() => setShowSplitModal(true)} className="text-slate-500 hover:text-white transition-all">
          <Divide size={32} />
        </button>
        <div className="mt-auto text-slate-600 font-black text-xs uppercase tracking-tighter italic">V23 BUILD</div>
      </div>

      <div className="flex-1 flex">
        {/* 左側購物車預覽 */}
        <div className="flex-1 p-12 flex flex-col">
          <header className="mb-10 flex justify-between items-end">
            <div>
              <h1 className="text-4xl font-black italic tracking-tighter uppercase text-slate-900">Order Checkout</h1>
              <p className="text-slate-400 font-bold mt-1 uppercase text-xs tracking-[0.2em]">Ventus Pro Systems</p>
            </div>
            <div className="flex items-center gap-2 bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-100">
               <Info size={16} className="text-blue-500" />
               <span className="text-sm font-bold text-slate-500 tracking-tight">訂單編號: #8892</span>
            </div>
          </header>

          <div className="flex-1 bg-white rounded-[60px] shadow-[0_10px_50px_rgba(0,0,0,0.03)] border border-slate-100 p-10 overflow-y-auto space-y-6">
            {cart.map(item => (
              <div key={item.id} className="flex justify-between items-center border-b border-slate-50 pb-6">
                <div>
                  <h3 className="text-2xl font-black text-slate-800">{item.name}</h3>
                  <p className="text-slate-400 font-mono text-sm font-bold uppercase tracking-widest">$ {item.price} x {item.qty}</p>
                </div>
                <span className="text-2xl font-black font-mono text-slate-900">$ {item.price * item.qty}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 右側專業結帳面板 */}
        <div className="w-[500px] bg-white border-l border-slate-100 shadow-2xl flex flex-col relative">
          <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
            <h2 className="text-2xl font-black italic tracking-tighter">結帳摘要</h2>
            <div className="bg-blue-600 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse">Processing</div>
          </div>

          <div className="flex-1 p-10 flex flex-col justify-center space-y-10">
            <div className="text-center">
              <span className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px]">Grand Total</span>
              <div className="text-7xl font-black tracking-tighter text-slate-900 mt-2">$ {total}</div>
            </div>

            {/* 餘額顯示進度條 */}
            <div className="bg-slate-950 rounded-[40px] p-8 text-white relative overflow-hidden shadow-2xl">
              <div className="relative z-10">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-black opacity-40 uppercase tracking-widest">已付金額</span>
                  <span className="text-green-400 font-black font-mono text-xl">$ {paidSoFar}</span>
                </div>
                <div className="w-full bg-white/5 h-3 rounded-full overflow-hidden mb-6 border border-white/5">
                  <div className="bg-gradient-to-r from-blue-600 to-blue-400 h-full transition-all duration-700 ease-out" style={{ width: `${(paidSoFar / total) * 100}%` }}></div>
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-lg font-black italic tracking-tighter text-slate-400">待收餘額</span>
                  <span className="text-5xl font-black text-blue-500 font-mono tracking-tighter">$ {remaining}</span>
                </div>
              </div>
            </div>

            {/* 支付按鈕群 */}
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => handlePartialPayment('CASH', remaining)} className="p-8 bg-slate-50 border-2 border-transparent hover:border-green-500 rounded-[35px] flex flex-col items-center gap-3 active:scale-95 transition-all group">
                <div className="bg-white p-4 rounded-2xl shadow-sm group-hover:bg-green-500 group-hover:text-white transition-colors"><Banknote size={28} /></div>
                <span className="font-black text-xs uppercase tracking-widest">現金支付</span>
              </button>
              <button onClick={() => handlePartialPayment('CARD', remaining)} className="p-8 bg-slate-50 border-2 border-transparent hover:border-blue-500 rounded-[35px] flex flex-col items-center gap-3 active:scale-95 transition-all group">
                <div className="bg-white p-4 rounded-2xl shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-colors"><CreditCard size={28} /></div>
                <span className="font-black text-xs uppercase tracking-widest">刷卡支付</span>
              </button>
            </div>
            
            <button onClick={() => setShowSplitModal(true)} className="w-full py-6 bg-white border-2 border-slate-900 text-slate-900 rounded-[30px] font-black text-xl flex items-center justify-center gap-3 hover:bg-slate-900 hover:text-white transition-all shadow-lg shadow-slate-200">
              <Divide size={24}/> 進行拆單結帳
            </button>
          </div>
        </div>
      </div>

      {/* 拆單計算器彈窗 */}
      {showSplitModal && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-50 flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-lg rounded-[60px] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-3xl font-black italic tracking-tighter">均分拆帳</h3>
              <button onClick={() => setShowSplitModal(false)} className="p-3 hover:bg-red-50 hover:text-red-500 rounded-full transition-all"><X size={32}/></button>
            </div>
            <div className="p-10 space-y-10">
              <div className="flex flex-col items-center">
                <span className="text-slate-400 font-black mb-6 uppercase tracking-[0.3em] text-[10px]">Split Count</span>
                <div className="flex items-center gap-10">
                  <button onClick={() => setSplitCount(Math.max(2, splitCount - 1))} className="w-20 h-20 bg-slate-100 rounded-[30px] flex items-center justify-center text-slate-900 hover:bg-slate-900 hover:text-white transition-all active:scale-90"><Minus size={32}/></button>
                  <span className="text-7xl font-black font-mono text-slate-900">{splitCount}</span>
                  <button onClick={() => setSplitCount(splitCount + 1)} className="w-20 h-20 bg-slate-100 rounded-[30px] flex items-center justify-center text-slate-900 hover:bg-slate-900 hover:text-white transition-all active:scale-90"><Plus size={32}/></button>
                </div>
              </div>
              <div className="bg-blue-600 p-10 rounded-[45px] text-white text-center shadow-xl shadow-blue-500/30">
                <span className="font-black opacity-50 block mb-2 uppercase text-[10px] tracking-widest">Per Person</span>
                <div className="text-6xl font-black font-mono tracking-tighter">$ {(total / splitCount).toFixed(0)}</div>
              </div>
              <button onClick={() => { handlePartialPayment('SPLIT', total/splitCount); setShowSplitModal(false); }} className="w-full py-7 bg-slate-950 text-white rounded-[30px] font-black text-2xl shadow-2xl active:scale-95 transition-all">收一筆並關閉</button>
            </div>
          </div>
        </div>
      )}

      {isCheckedOut && (
        <div className="fixed inset-0 bg-blue-600 flex flex-col items-center justify-center z-[100] text-white">
          <CheckCircle size={180} className="mb-10 animate-bounce text-white" />
          <h1 className="text-8xl font-black mb-12 italic tracking-tighter">結帳完畢</h1>
          <button onClick={() => {setIsCheckedOut(false); setPaidSoFar(0);}} className="px-24 py-8 bg-white text-blue-600 rounded-[40px] font-black text-4xl shadow-2xl active:scale-95 transition-all">下一筆訂單</button>
        </div>
      )}
    </div>
  );
}
