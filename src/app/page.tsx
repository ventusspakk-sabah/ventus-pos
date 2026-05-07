"use client";
import React, { useState, useEffect, useMemo } from 'react';
import Dexie from 'dexie';
import { ShoppingCart, History, Package, Search, ChevronRight, Printer, CheckCircle, Trash2 } from 'lucide-react';

const db = new Dexie('VentusPOS_V3');
db.version(1).stores({
  receipts: '++id, timestamp, total, items'
});

export default function UltimatePOS() {
  const [cart, setCart] = useState([]);
  const [activeCategory, setActiveCategory] = useState('全部');
  const [searchQuery, setSearchQuery] = useState('');
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [lastReceipt, setLastReceipt] = useState(null);

  const categories = ['全部', '咖啡', '茶飲', '甜點', '輕食'];
  const products = [
    { id: 1, name: '美式咖啡 (熱)', price: 80, cat: '咖啡' },
    { id: 2, name: '拿鐵咖啡 (冰)', price: 120, cat: '咖啡' },
    { id: 3, name: '手沖精品豆', price: 180, cat: '咖啡' },
    { id: 4, name: '錫蘭紅茶', price: 60, cat: '茶飲' },
    { id: 5, name: '小農鮮奶茶', price: 95, cat: '茶飲' },
    { id: 6, name: '提拉米蘇', price: 150, cat: '甜點' },
    { id: 7, name: '法式烤布蕾', price: 110, cat: '甜點' },
    { id: 8, name: '火腿起司三明治', price: 120, cat: '輕食' },
  ];

  // 搜尋與分類過濾邏輯
  const filteredProducts = useMemo(() => {
    return products.filter(p => 
      (activeCategory === '全部' || p.cat === activeCategory) &&
      p.name.includes(searchQuery)
    );
  }, [activeCategory, searchQuery]);

  const addToCart = (p) => {
    setCart(curr => {
      const exist = curr.find(x => x.id === p.id);
      return exist ? curr.map(x => x.id === p.id ? {...x, qty: x.qty + 1} : x) : [...curr, {...p, qty: 1}];
    });
  };

  const subtotal = cart.reduce((a, c) => a + c.price * c.qty, 0);
  const tax = Math.round(subtotal * 0.05);
  const total = subtotal + tax;

  const handleCharge = async () => {
    if (cart.length === 0) return;
    const receipt = { timestamp: new Date().toISOString(), items: [...cart], subtotal, tax, total };
    await db.receipts.add(receipt);
    setLastReceipt(receipt);
    setIsReceiptOpen(true);
    setCart([]);
  };

  return (
    <div className="flex h-screen bg-gray-100 text-slate-800 font-sans select-none">
      {/* 1. 左側分類與搜尋區 */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="bg-white p-4 shadow-sm border-b space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              className="w-full pl-10 pr-4 py-3 bg-gray-100 rounded-xl focus:ring-2 ring-blue-500 outline-none"
              placeholder="搜尋商品編號或名稱..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex space-x-2 overflow-x-auto pb-1 no-scrollbar">
            {categories.map(cat => (
              <button 
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-6 py-2 rounded-full whitespace-nowrap font-bold transition-all ${activeCategory === cat ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-slate-500 border'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto">
          {filteredProducts.map(p => (
            <button key={p.id} onClick={() => addToCart(p)} className="bg-white p-4 rounded-2xl shadow-sm border border-transparent active:border-blue-500 active:bg-blue-50 flex flex-col justify-between h-36 text-left transition-all">
              <span className="font-bold text-lg leading-tight">{p.name}</span>
              <span className="text-blue-600 font-black text-xl font-mono">$ {p.price}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 2. 右側單據面板 (對標 Ch 2.2.2) */}
      <div className="w-96 bg-white border-l shadow-2xl flex flex-col">
        <div className="p-6 border-b bg-gray-50 flex justify-between items-center">
          <h2 className="text-xl font-black italic tracking-tighter">VENTUS POS</h2>
          <button onClick={() => setCart([])} className="text-slate-300 hover:text-red-500"><Trash2 size={20}/></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-20"><ShoppingCart size={64}/><p className="mt-2 font-bold">待入單</p></div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                <div className="flex-1">
                  <div className="font-bold">{item.name}</div>
                  <div className="text-xs text-slate-400">$ {item.price} x {item.qty}</div>
                </div>
                <div className="font-mono font-bold">$ {item.price * item.qty}</div>
              </div>
            ))
          )}
        </div>

        <div className="p-6 bg-slate-900 text-white rounded-t-[40px] shadow-2xl">
          <div className="space-y-1 mb-6 opacity-80 text-sm">
            <div className="flex justify-between"><span>小計</span><span>$ {subtotal}</span></div>
            <div className="flex justify-between"><span>稅額 (5%)</span><span>$ {tax}</span></div>
          </div>
          <div className="flex justify-between text-4xl font-black mb-8 tracking-tighter">
            <span>總額</span><span className="text-blue-400">$ {total}</span>
          </div>
          <button onClick={handleCharge} className="w-full py-5 bg-blue-600 hover:bg-blue-500 rounded-2xl font-black text-2xl shadow-lg active:scale-95 transition-all">
            確認支付 (CHARGE)
          </button>
        </div>
      </div>

      {/* 3. 模擬熱敏收據彈窗 */}
      {isReceiptOpen && lastReceipt && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-lg overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 text-center border-b-2 border-dashed border-gray-200">
              <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
              <h3 className="text-2xl font-black">支付成功</h3>
              <p className="text-slate-400 font-mono text-sm">{new Date(lastReceipt.timestamp).toLocaleString()}</p>
            </div>
            
            <div className="p-8 font-mono text-sm space-y-2">
              <div className="text-center font-bold text-lg mb-4">--- 收據明細 ---</div>
              {lastReceipt.items.map(i => (
                <div key={i.id} className="flex justify-between">
                  <span>{i.name} x{i.qty}</span>
                  <span>{i.price * i.qty}</span>
                </div>
              ))}
              <div className="border-t border-dashed pt-4 mt-4 space-y-1">
                <div className="flex justify-between font-bold"><span>總計金額</span><span>$ {lastReceipt.total}</span></div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 flex gap-2">
              <button onClick={() => setIsReceiptOpen(false)} className="flex-1 py-4 bg-slate-900 text-white rounded-xl font-bold">完成</button>
              <button className="px-6 bg-blue-600 text-white rounded-xl"><Printer size={24}/></button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
