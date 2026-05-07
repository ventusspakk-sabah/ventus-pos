"use client";
import React, { useState, useEffect } from 'react';
import Dexie from 'dexie';
import { 
  ShoppingCart, Package, Users, BarChart3, 
  Plus, X, Check, Coffee, Utensils, CheckCircle, Trash2 
} from 'lucide-react';

// 1. 資料庫結構：加入客製化選項支援
const db = new Dexie('VentusPOS_V8');
db.version(1).stores({
  receipts: '++id, timestamp, total, staff, items',
  inventory: 'id, name, price, stock, modifiers',
});

export default function ModifierPOS() {
  const [cart, setCart] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null); // 控制客製化彈窗
  const [activeModifiers, setActiveModifiers] = useState([]);
  const [isCheckedOut, setIsCheckedOut] = useState(false);

  useEffect(() => {
    const init = async () => {
      if (await db.inventory.count() === 0) {
        await db.inventory.bulkAdd([
          { 
            id: 1, name: '拿鐵咖啡', price: 120, stock: 50, 
            modifiers: [
              { name: '去冰', price: 0 }, { name: '熱飲', price: 0 },
              { name: '燕麥奶', price: 20 }, { name: '加一份濃縮', price: 30 }
            ] 
          },
          { 
            id: 2, name: '經典牛肉堡', price: 180, stock: 30,
            modifiers: [
              { name: '加起司', price: 15 }, { name: '不要生菜', price: 0 }, { name: '加倍肉片', price: 60 }
            ]
          },
          { id: 3, name: '錫蘭紅茶', price: 60, stock: 100, modifiers: [] }
        ]);
      }
      setProducts(await db.inventory.toArray());
    };
    init();
  }, [isCheckedOut]);

  // 處理點擊商品
  const handleItemClick = (p) => {
    if (p.modifiers && p.modifiers.length > 0) {
      setSelectedItem(p);
      setActiveModifiers([]);
    } else {
      addToCart(p, []);
    }
  };

  // 加入購物車 (包含客製化資訊)
  const addToCart = (product, mods) => {
    const modTotal = mods.reduce((a, b) => a + b.price, 0);
    const finalPrice = product.price + modTotal;
    const cartId = `${product.id}-${mods.map(m => m.name).join('-')}`;

    setCart(curr => {
      const exist = curr.find(x => x.cartId === cartId);
      if (exist) {
        return curr.map(x => x.cartId === cartId ? {...x, qty: x.qty + 1} : x);
      }
      return [...curr, { ...product, cartId, qty: 1, finalPrice, selectedMods: mods }];
    });
    setSelectedItem(null);
  };

  const total = cart.reduce((a, c) => a + c.finalPrice * c.qty, 0);

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      {/* 導覽列 */}
      <div className="w-20 bg-slate-900 flex flex-col items-center py-8 space-y-10 text-white shadow-2xl">
        <div className="bg-blue-600 p-3 rounded-2xl shadow-lg"><ShoppingCart size={28} /></div>
        <div className="text-slate-500"><Package size={28} /></div>
        <div className="text-slate-500"><Users size={28} /></div>
        <div className="text-slate-500 mt-auto"><BarChart3 size={28} /></div>
      </div>

      <div className="flex-1 flex">
        {/* 商品展示區 */}
        <div className="flex-1 p-6 grid grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto">
          {products.map(p => (
            <button 
              key={p.id} 
              onClick={() => handleItemClick(p)}
              className="bg-white p-6 rounded-[40px] shadow-sm border border-slate-100 hover:border-blue-500 active:scale-95 text-left h-48 flex flex-col justify-between transition-all relative overflow-hidden"
            >
              <div>
                <div className="font-black text-2xl text-slate-800">{p.name}</div>
                {p.modifiers?.length > 0 && <span className="text-[10px] bg-slate-100 text-slate-400 px-2 py-1 rounded-full mt-2 inline-block">可客製化</span>}
              </div>
              <div className="text-blue-600 font-black text-3xl font-mono">$ {p.price}</div>
            </button>
          ))}
        </div>

        {/* 結帳側欄 (對標 Ch 2.2.2) */}
        <div className="w-[400px] bg-white border-l shadow-2xl flex flex-col">
          <div className="p-8 border-b flex justify-between items-center">
            <h2 className="font-black text-2xl italic tracking-tighter">當前單據</h2>
            <button onClick={() => setCart([])} className="text-slate-300 hover:text-red-500"><Trash2 size={20}/></button>
          </div>
          
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {cart.map(item => (
              <div key={item.cartId} className="bg-slate-50 p-5 rounded-[32px] border border-slate-100">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-black text-lg">{item.name} <span className="text-blue-500">x{item.qty}</span></span>
                  <span className="font-mono font-black text-lg">$ {item.finalPrice * item.qty}</span>
                </div>
                {item.selectedMods.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {item.selectedMods.map(m => (
                      <span key={m.name} className="text-[11px] bg-white border border-slate-200 text-slate-500 px-2 py-1 rounded-lg">+{m.name}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="p-8 bg-slate-900 text-white rounded-t-[50px] shadow-2xl">
            <div className="flex justify-between text-5xl font-black mb-8 tracking-tighter">
              <span>總額</span>
              <span className="text-blue-400">$ {total}</span>
            </div>
            <button 
              onClick={() => setIsCheckedOut(true)}
              className="w-full py-6 bg-blue-600 hover:bg-blue-500 rounded-[24px] font-black text-2xl shadow-xl shadow-blue-500/20 active:scale-95 transition-all"
            >
              確認結帳
            </button>
          </div>
        </div>
      </div>

      {/* 客製化 Modifiers 彈窗 (對標 Ch 2.16) */}
      {selectedItem && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-50 flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-lg rounded-[48px] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in duration-200">
            <div className="p-10 border-b flex justify-between items-center">
              <div>
                <h3 className="text-3xl font-black">{selectedItem.name}</h3>
                <p className="text-slate-400 font-bold">請選擇客製化選項</p>
              </div>
              <button onClick={() => setSelectedItem(null)} className="bg-slate-100 p-3 rounded-full"><X size={24}/></button>
            </div>
            
            <div className="flex-1 p-8 overflow-y-auto space-y-4">
              {selectedItem.modifiers.map(mod => {
                const isSelected = activeModifiers.find(m => m.name === mod.name);
                return (
                  <button 
                    key={mod.name}
                    onClick={() => {
                      setActiveModifiers(prev => 
                        isSelected ? prev.filter(m => m.name !== mod.name) : [...prev, mod]
                      );
                    }}
                    className={`w-full p-6 rounded-3xl border-2 flex justify-between items-center transition-all ${isSelected ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-slate-100 bg-slate-50'}`}
                  >
                    <span className={`font-black text-xl ${isSelected ? 'text-blue-600' : 'text-slate-600'}`}>{mod.name}</span>
                    <span className="font-mono font-bold">
                      {mod.price > 0 ? `+$ ${mod.price}` : '免費'}
                      {isSelected && <Check size={20} className="inline ml-3 text-blue-500" />}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="p-10 bg-slate-50 border-t">
              <button 
                onClick={() => addToCart(selectedItem, activeModifiers)}
                className="w-full py-6 bg-slate-900 text-white rounded-3xl font-black text-2xl shadow-xl active:scale-95 transition-all"
              >
                加入帳單 (+$ {activeModifiers.reduce((a,b)=>a+b.price, 0)})
              </button>
            </div>
          </div>
        </div>
      )}

      {isCheckedOut && (
        <div className="fixed inset-0 bg-blue-600 flex flex-col items-center justify-center z-[100] text-white">
          <CheckCircle size={120} className="mb-6 animate-bounce" />
          <h1 className="text-5xl font-black mb-10 text-center tracking-tighter">收款完畢！<br/><span className="text-2xl opacity-70">客製化明細已存檔</span></h1>
          <button onClick={() => {setIsCheckedOut(false); setCart([]);}} className="px-16 py-5 bg-white text-blue-600 rounded-3xl font-black text-2xl shadow-2xl">下一筆交易</button>
        </div>
      )}
    </div>
  );
}
