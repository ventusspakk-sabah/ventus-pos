"use client";
import React, { useState, useEffect } from 'react';
import Dexie from 'dexie';
import { 
  ShoppingCart, History, RotateCcw, Package, 
  Search, CheckCircle, X, ArrowLeft, Trash2, Calendar
} from 'lucide-react';

// 1. 資料庫結構：加入退款狀態支援 (對標 Ch 2.13)
const db = new Dexie('VentusPOS_V10');
db.version(1).stores({
  receipts: '++id, timestamp, total, items, status, paymentMethod',
  inventory: 'id, name, price, stock'
});

export default function RefundPOS() {
  const [view, setView] = useState('pos'); // 'pos' 或 'history'
  const [cart, setCart] = useState([]);
  const [products, setProducts] = useState([]);
  const [history, setHistory] = useState([]);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [isCheckedOut, setIsCheckedOut] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (await db.inventory.count() === 0) {
        await db.inventory.bulkAdd([
          { id: 1, name: '拿鐵咖啡', price: 120, stock: 50 },
          { id: 2, name: '法式千層', price: 150, stock: 30 },
          { id: 3, name: '美式咖啡', price: 90, stock: 100 }
        ]);
      }
      setProducts(await db.inventory.toArray());
      setHistory(await db.receipts.toArray());
    };
    load();
  }, [view, isCheckedOut]);

  const addToCart = (p) => {
    const exist = cart.find(x => x.id === p.id);
    setCart(exist ? cart.map(x => x.id === p.id ? {...exist, qty: exist.qty + 1} : x) : [...cart, {...p, qty: 1}]);
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
        total,
        items: [...cart],
        status: 'COMPLETED',
        paymentMethod: '現金'
      });
    });
    setIsCheckedOut(true);
    setCart([]);
  };

  // 核心邏輯：專業退款流程 (對標 Ch 2.13)
  const handleRefund = async (receipt) => {
    if (!confirm('確定要執行全額退款？這將會恢復對應的庫存數量。')) return;

    await db.transaction('rw', db.inventory, db.receipts, async () => {
      // 1. 恢復庫存
      for (const item of receipt.items) {
        await db.inventory.where('id').equals(item.id).modify(x => { x.stock += item.qty; });
      }
      // 2. 標記單據狀態
      await db.receipts.update(receipt.id, { status: 'REFUNDED' });
    });

    setSelectedReceipt(null);
    setHistory(await db.receipts.toArray());
    alert('退款成功，庫存已回滾。');
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      {/* 導覽列 */}
      <div className="w-20 bg-slate-900 flex flex-col items-center py-8 space-y-10 text-white">
        <button onClick={() => setView('pos')} className={`p-3 rounded-2xl ${view === 'pos' ? 'bg-blue-600' : 'text-slate-500'}`}><ShoppingCart size={28} /></button>
        <button onClick={() => setView('history')} className={`p-3 rounded-2xl ${view === 'history' ? 'bg-blue-600' : 'text-slate-500'}`}><History size={28} /></button>
        <div className="mt-auto text-slate-500"><Package size={28} /></div>
      </div>

      {view === 'pos' ? (
        <div className="flex-1 flex">
          {/* POS 銷售介面 */}
          <div className="flex-1 p-6 grid grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto">
            {products.map(p => (
              <button key={p.id} onClick={() => addToCart(p)} className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 active:scale-95 text-left h-44 flex flex-col justify-between">
                <span className="font-black text-2xl">{p.name}</span>
                <div className="flex justify-between items-end">
                  <span className="text-blue-600 font-black text-3xl font-mono">$ {p.price}</span>
                  <span className="text-xs font-bold text-slate-400 italic">在庫: {p.stock}</span>
                </div>
              </button>
            ))}
          </div>
          <div className="w-96 bg-white border-l p-6 flex flex-col shadow-2xl">
            <h2 className="text-2xl font-black mb-8 italic tracking-tighter">新帳單</h2>
            <div className="flex-1 overflow-y-auto space-y-3">
              {cart.map(item => (
                <div key={item.id} className="flex justify-between p-4 bg-slate-50 rounded-2xl font-bold">
                  <span>{item.name} x{item.qty}</span>
                  <span>$ {item.price * item.qty}</span>
                </div>
              ))}
            </div>
            <div className="pt-6 border-t">
              <div className="flex justify-between text-4xl font-black mb-8">
                <span>總計</span><span className="text-blue-600">$ {cart.reduce((a,c)=>a+c.price*c.qty,0)}</span>
              </div>
              <button onClick={handleCharge} className="w-full py-6 bg-slate-900 text-white rounded-3xl font-black text-2xl shadow-xl active:scale-95 transition-all">確認收款</button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 p-8 bg-white overflow-y-auto">
          {/* 交易管理介面 (對標 Ch 2.11) */}
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-black mb-10 italic tracking-tighter">交易履歷管理</h1>
            <div className="space-y-4">
              {history.slice().reverse().map(receipt => (
                <button 
                  key={receipt.id} 
                  onClick={() => setSelectedReceipt(receipt)}
                  className={`w-full p-6 rounded-[32px] flex justify-between items-center transition-all border-2 ${receipt.status === 'REFUNDED' ? 'bg-slate-50 border-transparent opacity-60' : 'bg-white border-slate-100 hover:border-blue-500 shadow-sm'}`}
                >
                  <div className="text-left">
                    <div className="flex items-center gap-3">
                      <span className="font-black text-xl">收據 #00{receipt.id}</span>
                      {receipt.status === 'REFUNDED' && <span className="bg-red-100 text-red-600 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">已退款</span>}
                    </div>
                    <div className="text-slate-400 text-sm font-bold flex items-center gap-2 mt-1">
                      <Calendar size={14}/> {new Date(receipt.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-2xl font-black font-mono">$ {receipt.total}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 單據詳情與退款彈窗 */}
      {selectedReceipt && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-50 flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="p-8 border-b flex justify-between items-center bg-slate-50">
              <h3 className="text-2xl font-black">收據詳情 #00{selectedReceipt.id}</h3>
              <button onClick={() => setSelectedReceipt(null)} className="p-2 bg-white rounded-full shadow-sm"><X size={24}/></button>
            </div>
            <div className="p-8 space-y-4 max-h-[50vh] overflow-y-auto">
              {selectedReceipt.items.map((item, i) => (
                <div key={i} className="flex justify-between font-bold text-lg">
                  <span>{item.name} x{item.qty}</span>
                  <span className="font-mono">$ {item.price * item.qty}</span>
                </div>
              ))}
              <div className="border-t pt-4 mt-6">
                <div className="flex justify-between text-2xl font-black">
                  <span>實收總額</span>
                  <span className="text-blue-600">$ {selectedReceipt.total}</span>
                </div>
                <div className="text-slate-400 text-sm mt-1 font-bold">支付方式：{selectedReceipt.paymentMethod}</div>
              </div>
            </div>
            <div className="p-8 bg-slate-50">
              {selectedReceipt.status !== 'REFUNDED' ? (
                <button 
                  onClick={() => handleRefund(selectedReceipt)}
                  className="w-full py-5 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-black text-xl shadow-lg shadow-red-500/20 flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <RotateCcw size={24} /> 執行退款
                </button>
              ) : (
                <div className="w-full py-5 bg-slate-200 text-slate-400 rounded-2xl font-black text-xl text-center cursor-not-allowed">此單已完成退款</div>
              )}
            </div>
          </div>
        </div>
      )}

      {isCheckedOut && (
        <div className="fixed inset-0 bg-blue-600 flex flex-col items-center justify-center z-[100] text-white">
          <CheckCircle size={100} className="mb-6 animate-bounce" />
          <h1 className="text-5xl font-black mb-10">交易完成</h1>
          <button onClick={() => setIsCheckedOut(false)} className="px-16 py-5 bg-white text-blue-600 rounded-3xl font-black text-2xl">下一筆</button>
        </div>
      )}
    </div>
  );
}
