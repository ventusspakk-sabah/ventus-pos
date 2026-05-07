"use client";
import React, { useState, useEffect, useMemo } from 'react';
import Dexie from 'dexie';
import { 
  ShoppingCart, Tag, Zap, Clock, 
  Percent, CheckCircle, Trash2, Settings, Gift, BadgePercent 
} from 'lucide-react';

// 1. 資料庫結構：加入促銷規則表 (對標 Ch 2.6)
const db = new Dexie('VentusPOS_V21');
db.version(1).stores({
  inventory: 'id, name, price',
  promotions: '++id, name, type, value, startTime, endTime, days'
});

export default function PromotionPOS() {
  const [cart, setCart] = useState([]);
  const [activePromos, setActivePromos] = useState([]);
  const [isCheckedOut, setIsCheckedOut] = useState(false);

  // 初始化促銷規則 (範例：Happy Hour & 週末特惠)
  useEffect(() => {
    const initPromos = async () => {
      const count = await db.promotions.count();
      if (count === 0) {
        await db.promotions.bulkAdd([
          { 
            name: '午茶時光 85折', 
            type: 'percent', 
            value: 15, 
            startTime: '14:00', 
            endTime: '17:00', 
            days: [1, 2, 3, 4, 5] 
          },
          { 
            name: '週末蛋糕日 -50', 
            type: 'fixed', 
            value: 50, 
            startTime: '00:00', 
            endTime: '23:59', 
            days: [0, 6] 
          }
        ]);
      }
      setActivePromos(await db.promotions.toArray());
    };
    initPromos();
  }, []);

  // 核心：促銷匹配邏輯
  const currentPromo = useMemo(() => {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const currentDay = now.getDay();

    return activePromos.find(p => 
      p.days.includes(currentDay) && 
      currentTime >= p.startTime && 
      currentTime <= p.endTime
    );
  }, [activePromos]);

  const subtotal = cart.reduce((a, c) => a + c.price, 0);
  const discountAmount = currentPromo 
    ? (currentPromo.type === 'percent' ? subtotal * (currentPromo.value / 100) : currentPromo.value)
    : 0;
  const total = Math.max(0, subtotal - discountAmount);

  return (
    <div className="flex h-screen bg-slate-900 text-white font-sans overflow-hidden">
      {/* 側邊欄 */}
      <div className="w-24 bg-black flex flex-col items-center py-10 space-y-12">
        <div className="bg-blue-600 p-4 rounded-3xl"><ShoppingCart size={32} /></div>
        <div className="text-slate-600"><Tag size={32} /></div>
        <div className="mt-auto text-slate-600"><Settings size={32} /></div>
      </div>

      <div className="flex-1 flex flex-col bg-slate-50 text-slate-900">
        <header className="h-24 bg-white border-b px-12 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black italic tracking-tighter">VENTUS <span className="text-blue-600">PROMO</span></h1>
            {currentPromo && (
              <div className="flex items-center text-xs font-black text-orange-500 mt-1 animate-pulse">
                <Zap size={14} className="mr-1 fill-current" /> {currentPromo.name} 進行中
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-4 bg-slate-100 px-6 py-3 rounded-2xl">
            <Clock size={20} className="text-slate-400" />
            <span className="font-mono font-bold">{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
          </div>
        </header>

        <main className="flex-1 p-10 flex gap-8">
          <div className="flex-1 grid grid-cols-2 gap-8">
             {[ {id:1, name:'藍山拿鐵', price:180}, {id:2, name:'草莓千層', price:160} ].map(p => (
               <button key={p.id} onClick={() => setCart([...cart, p])} className="bg-white p-10 rounded-[50px] shadow-sm border-2 border-transparent active:border-blue-500 flex flex-col justify-between h-60 text-left transition-all relative overflow-hidden">
                 {currentPromo && <div className="absolute top-0 right-0 bg-orange-500 text-white px-6 py-2 rounded-bl-[30px] font-black text-xs">SALE</div>}
                 <span className="font-black text-3xl text-slate-800">{p.name}</span>
                 <span className="text-blue-600 font-black text-4xl font-mono">$ {p.price}</span>
               </button>
             ))}
          </div>

          {/* 結帳側欄 (具備自動折扣顯示) */}
          <div className="w-[450px] bg-white rounded-[60px] shadow-2xl border flex flex-col">
            <div className="p-10 border-b flex justify-between items-center bg-slate-50">
              <h3 className="font-black text-2xl italic tracking-tighter uppercase">Cart Summary</h3>
              <button onClick={() => setCart([])}><Trash2 className="text-slate-300" /></button>
            </div>
            
            <div className="flex-1 p-8 overflow-y-auto space-y-4">
              {cart.map((item, idx) => (
                <div key={idx} className="flex justify-between font-bold text-lg p-2 border-b border-dashed">
                  <span>{item.name}</span><span>$ {item.price}</span>
                </div>
              ))}
            </div>

            <div className="p-10 bg-slate-950 text-white rounded-t-[60px]">
              <div className="space-y-2 mb-8 opacity-60 font-bold">
                <div className="flex justify-between"><span>Subtotal</span><span>$ {subtotal}</span></div>
                {currentPromo && (
                  <div className="flex justify-between text-orange-400 italic">
                    <span className="flex items-center"><Gift size={16} className="mr-2"/> {currentPromo.name}</span>
                    <span>- $ {discountAmount.toFixed(0)}</span>
                  </div>
                )}
              </div>
              <div className="flex justify-between text-5xl font-black mb-10 tracking-tighter text-blue-400">
                <span className="text-white text-3xl">TOTAL</span>
                <span>$ {total.toFixed(0)}</span>
              </div>
              <button onClick={() => setIsCheckedOut(true)} className="w-full py-7 bg-blue-600 rounded-[35px] font-black text-2xl shadow-xl active:scale-95 transition-all">
                CHARGE NOW
              </button>
            </div>
          </div>
        </main>
      </div>

      {isCheckedOut && (
        <div className="fixed inset-0 bg-blue-600 flex flex-col items-center justify-center z-[100] text-white">
          <BadgePercent size={150} className="mb-10 animate-bounce text-blue-200" />
          <h1 className="text-7xl font-black mb-12 italic tracking-tighter text-center">
             {currentPromo ? 'PROMO APPLIED!' : 'PAYMENT SUCCESS'}
          </h1>
          <button onClick={() => {setIsCheckedOut(false); setCart([]);}} className="px-24 py-8 bg-white text-blue-600 rounded-[40px] font-black text-3xl shadow-2xl">
             NEXT SALE
          </button>
        </div>
      )}
    </div>
  );
}
