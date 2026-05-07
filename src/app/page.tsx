"use client";
import React, { useState, useEffect } from 'react';
import Dexie from 'dexie';
import { 
  ShoppingCart, CreditCard, Banknote, Smartphone, 
  Tag, Percent, CheckCircle, Trash2, X, ChevronRight 
} from 'lucide-react';

// 1. 資料庫結構：加入支付與折扣欄位 (對標 Ch 2.5)
const db = new Dexie('VentusPOS_V9');
db.version(1).stores({
  receipts: '++id, timestamp, subtotal, discount, tax, total, paymentMethod, staff',
  inventory: 'id, name, price, stock, modifiers',
});

export default function PaymentPOS() {
  const [cart, setCart] = useState([]);
  const [products, setProducts] = useState([]);
  const [activeDiscount, setActiveDiscount] = useState({ name: '無折扣', value: 0, type: 'percent' });
  const [showPayModal, setShowPayModal] = useState(false);
  const [isCheckedOut, setIsCheckedOut] = useState(false);

  useEffect(() => {
    const init = async () => {
      if (await db.inventory.count() === 0) {
        await db.inventory.bulkAdd([
          { id: 1, name: '耶加雪菲 手沖', price: 160, stock: 40 },
          { id: 2, name: '法式千層派', price: 140, stock: 25 },
          { id: 3, name: '拿鐵咖啡', price: 120, stock: 60 }
        ]);
      }
      setProducts(await db.inventory.toArray());
    };
    init();
  }, [isCheckedOut]);

  const addToCart = (p) => {
    const exist = cart.find(x => x.id === p.id);
    setCart(exist ? cart.map(x => x.id === p.id ? {...exist, qty: exist.qty + 1} : x) : [...cart, {...p, qty: 1}]);
  };

  // 財務計算引擎 (對標 Ch 2.6)
  const subtotal = cart.reduce((a, c) => a + c.price * c.qty, 0);
  const discountAmount = activeDiscount.type === 'percent' 
    ? subtotal * (activeDiscount.value / 100) 
    : activeDiscount.value;
  const taxableAmount = subtotal - discountAmount;
  const tax = Math.round(taxableAmount * 0.05);
  const total = taxableAmount + tax;

  const processPayment = async (method) => {
    await db.receipts.add({
      timestamp: new Date().toISOString(),
      subtotal,
      discount: discountAmount,
      tax,
      total,
      paymentMethod: method,
      staff: '店長 Leo'
    });
    // 扣庫存邏輯
    for (const item of cart) {
      await db.inventory.where('id').equals(item.id).modify(x => { x.stock -= item.qty; });
    }
    setShowPayModal(false);
    setIsCheckedOut(true);
    setCart([]);
    setActiveDiscount({ name: '無折扣', value: 0, type: 'percent' });
  };

  return (
    <div className="flex h-screen bg-slate-100 text-slate-900 font-sans overflow-hidden">
      {/* 商品區域 */}
      <div className="flex-1 p-6 grid grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto">
        {products.map(p => (
          <button key={p.id} onClick={() => addToCart(p)} className="bg-white p-6 rounded-[40px] shadow-sm border-2 border-transparent active:border-blue-500 h-44 flex flex-col justify-between text-left transition-all">
            <span className="font-black text-2xl">{p.name}</span>
            <span className="text-blue-600 font-black text-2xl font-mono">$ {p.price}</span>
          </button>
        ))}
      </div>

      {/* 結帳面板 */}
      <div className="w-[450px] bg-white border-l shadow-2xl flex flex-col">
        <div className="p-8 border-b flex justify-between items-center bg-white">
          <h2 className="font-black text-2xl italic tracking-tighter">PAYMENT & TAX</h2>
          <button onClick={() => setCart([])} className="text-slate-300 hover:text-red-500"><Trash2 size={24}/></button>
        </div>

        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {cart.map(item => (
            <div key={item.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-3xl border border-slate-100">
              <span className="font-bold text-lg">{item.name} x{item.qty}</span>
              <span className="font-mono font-black">$ {item.price * item.qty}</span>
            </div>
          ))}
        </div>

        {/* 折扣選擇區 (對標 Ch 2.6) */}
        <div className="p-6 border-t space-y-4 bg-white">
          <div className="flex gap-2">
            {[
              { name: '無折扣', value: 0, type: 'percent' },
              { name: '九折', value: 10, type: 'percent' },
              { name: '折 50', value: 50, type: 'fixed' }
            ].map(d => (
              <button 
                key={d.name}
                onClick={() => setActiveDiscount(d)}
                className={`flex-1 py-3 rounded-2xl font-bold text-sm transition-all border-2 ${activeDiscount.name === d.name ? 'bg-blue-600 border-blue-600 text-white' : 'bg-slate-50 border-slate-100 text-slate-500'}`}
              >
                {d.name}
              </button>
            ))}
          </div>

          {/* 財務摘要 */}
          <div className="space-y-2 px-2 text-slate-500 font-bold">
            <div className="flex justify-between"><span>小計</span><span>$ {subtotal}</span></div>
            <div className="flex justify-between text-red-500"><span>折扣 ({activeDiscount.name})</span><span>- $ {discountAmount}</span></div>
            <div className="flex justify-between"><span>稅額 (5%)</span><span>$ {tax}</span></div>
            <div className="flex justify-between text-4xl font-black text-slate-900 pt-4 border-t-2 border-dashed">
              <span>總額</span><span className="text-blue-600">$ {total}</span>
            </div>
          </div>

          <button 
            onClick={() => cart.length > 0 && setShowPayModal(true)}
            className="w-full mt-6 py-6 bg-blue-600 text-white rounded-[30px] font-black text-2xl shadow-xl shadow-blue-500/20 active:scale-95 transition-all"
          >
            選擇支付方式
          </button>
        </div>
      </div>

      {/* 支付選擇彈窗 (對標 Ch 2.5) */}
      {showPayModal && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-50 flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-xl rounded-[50px] shadow-2xl p-10 animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-3xl font-black italic">選擇結帳方式</h3>
              <button onClick={() => setShowPayModal(false)} className="bg-slate-100 p-3 rounded-full"><X/></button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <button onClick={() => processPayment('現金')} className="flex items-center p-8 bg-green-50 border-2 border-green-100 rounded-[32px] hover:border-green-500 transition-all group">
                <div className="bg-green-500 p-4 rounded-2xl text-white mr-6 group-hover:scale-110 transition-transform"><Banknote size={32}/></div>
                <div className="text-left"><div className="text-2xl font-black text-green-900">現金支付</div><div className="text-green-600 font-bold font-mono">CASH</div></div>
                <ChevronRight className="ml-auto text-green-300" />
              </button>

              <button onClick={() => processPayment('信用卡')} className="flex items-center p-8 bg-blue-50 border-2 border-blue-100 rounded-[32px] hover:border-blue-500 transition-all group">
                <div className="bg-blue-500 p-4 rounded-2xl text-white mr-6 group-hover:scale-110 transition-transform"><CreditCard size={32}/></div>
                <div className="text-left"><div className="text-2xl font-black text-blue-900">信用卡 / 簽帳卡</div><div className="text-blue-600 font-bold font-mono">CARD</div></div>
                <ChevronRight className="ml-auto text-blue-300" />
              </button>

              <button onClick={() => processPayment('行動支付')} className="flex items-center p-8 bg-purple-50 border-2 border-purple-100 rounded-[32px] hover:border-purple-500 transition-all group">
                <div className="bg-purple-500 p-4 rounded-2xl text-white mr-6 group-hover:scale-110 transition-transform"><Smartphone size={32}/></div>
                <div className="text-left"><div className="text-2xl font-black text-purple-900">行動支付 / 錢包</div><div className="text-purple-600 font-bold font-mono">MOBILE</div></div>
                <ChevronRight className="ml-auto text-purple-300" />
              </button>
            </div>
            
            <div className="mt-10 text-center font-black text-slate-400 text-xl tracking-widest">應收金額: $ {total}</div>
          </div>
        </div>
      )}

      {isCheckedOut && (
        <div className="fixed inset-0 bg-blue-600 flex flex-col items-center justify-center z-[100] text-white">
          <CheckCircle size={120} className="mb-6 animate-bounce" />
          <h1 className="text-5xl font-black mb-10 text-center">交易已完成！<br/><span className="text-2xl opacity-70">報表已更新支付分流</span></h1>
          <button onClick={() => setIsCheckedOut(false)} className="px-16 py-5 bg-white text-blue-600 rounded-3xl font-black text-2xl shadow-2xl">開始下一筆</button>
        </div>
      )}
    </div>
  );
}
