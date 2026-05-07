"use client";
import React, { useState, useEffect } from 'react';
import Dexie from 'dexie';
import { 
  ShoppingCart, Layers, List, Package, 
  CheckCircle, ChevronRight, X, Trash2, Settings, BarChart3 
} from 'lucide-react';

// 1. 資料庫結構：支持商品規格變體 (對標 Ch 3.2)
const db = new Dexie('VentusPOS_V14');
db.version(1).stores({
  inventory: 'id, name, type', // type: 'single' 或 'variants'
  variants: '++id, productId, sizeName, price, stock',
  receipts: '++id, timestamp, total, items'
});

export default function VariantPOS() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null); // 控制規格選擇彈窗
  const [isCheckedOut, setIsCheckedOut] = useState(false);

  useEffect(() => {
    const init = async () => {
      if (await db.inventory.count() === 0) {
        // 初始化多規格商品數據
        await db.inventory.add({ id: 101, name: '招牌拿鐵', type: 'variants' });
        await db.variants.bulkAdd([
          { productId: 101, sizeName: '大杯 (L)', price: 150, stock: 20 },
          { productId: 101, sizeName: '中杯 (M)', price: 120, stock: 45 }
        ]);
        
        await db.inventory.add({ id: 202, name: '經典美式', type: 'variants' });
        await db.variants.bulkAdd([
          { productId: 202, sizeName: '大杯 (L)', price: 110, stock: 30 },
          { productId: 202, sizeName: '中杯 (M)', price: 90, stock: 50 }
        ]);
      }
      const inv = await db.inventory.toArray();
      const withVariants = await Promise.all(inv.map(async p => ({
        ...p,
        variants: await db.variants.where('productId').equals(p.id).toArray()
      })));
      setProducts(withVariants);
    };
    init();
  }, [isCheckedOut]);

  const addToCart = (product, variant) => {
    const cartId = `${product.id}-${variant.id}`;
    const exist = cart.find(x => x.cartId === cartId);
    
    if (exist) {
      setCart(cart.map(x => x.cartId === cartId ? {...x, qty: x.qty + 1} : x));
    } else {
      setCart([...cart, { 
        cartId, 
        name: product.name, 
        variantName: variant.sizeName, 
        price: variant.price, 
        variantId: variant.id,
        qty: 1 
      }]);
    }
    setSelectedProduct(null);
  };

  const handleCharge = async () => {
    if (cart.length === 0) return;
    await db.transaction('rw', db.variants, db.receipts, async () => {
      for (const item of cart) {
        await db.variants.where('id').equals(item.variantId).modify(x => { x.stock -= item.qty; });
      }
      await db.receipts.add({
        timestamp: new Date().toISOString(),
        total: cart.reduce((a,c) => a + c.price*c.qty, 0),
        items: JSON.stringify(cart)
      });
    });
    setIsCheckedOut(true);
    setCart([]);
  };

  return (
    <div className="flex h-screen bg-slate-100 text-slate-900 font-sans overflow-hidden">
      {/* 側邊導航 */}
      <div className="w-24 bg-slate-900 flex flex-col items-center py-10 space-y-12 text-white shadow-2xl">
        <div className="bg-blue-600 p-4 rounded-3xl shadow-lg shadow-blue-500/40"><ShoppingCart size={32} /></div>
        <div className="text-slate-500 hover:text-white transition-colors"><Layers size={32} /></div>
        <div className="text-slate-500 hover:text-white transition-colors"><BarChart3 size={32} /></div>
        <div className="mt-auto text-slate-500"><Settings size={32} /></div>
      </div>

      <div className="flex-1 flex flex-col">
        <header className="h-24 bg-white border-b px-10 flex items-center justify-between shadow-sm">
          <h2 className="font-black text-3xl text-slate-800 tracking-tighter italic">VENTUS VARIANTS</h2>
          <div className="flex items-center gap-4">
             <div className="bg-slate-100 p-3 rounded-2xl text-slate-400"><List size={20}/></div>
             <div className="bg-slate-100 p-3 rounded-2xl text-slate-400"><Package size={20}/></div>
          </div>
        </header>

        {/* 商品展示區 (對標 Ch 3.2) */}
        <div className="flex-1 p-8 grid grid-cols-2 lg:grid-cols-3 gap-8 overflow-y-auto">
          {products.map(p => (
            <button 
              key={p.id} 
              onClick={() => setSelectedProduct(p)}
              className="bg-white p-8 rounded-[48px] shadow-sm border-2 border-transparent hover:border-blue-500 hover:bg-blue-50/30 transition-all text-left flex flex-col justify-between h-52 group"
            >
              <div>
                <div className="font-black text-2xl text-slate-800 group-hover:text-blue-600 transition-colors">{p.name}</div>
                <div className="mt-2 flex gap-2">
                  {p.variants.map(v => (
                    <span key={v.id} className="text-[10px] font-bold bg-slate-100 text-slate-400 px-2 py-1 rounded-full">{v.sizeName}</span>
                  ))}
                </div>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-slate-400 text-sm font-bold">多規格可選</span>
                <ChevronRight size={24} className="text-blue-500" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 結帳側欄 */}
      <div className="w-[450px] bg-white border-l shadow-2xl flex flex-col">
        <div className="p-8 border-b flex justify-between items-center">
          <h3 className="font-black text-2xl italic">當前單據</h3>
          <button onClick={() => setCart([])} className="text-slate-300 hover:text-red-500"><Trash2 size={24}/></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {cart.map(item => (
            <div key={item.cartId} className="p-5 bg-slate-50 rounded-[32px] border border-slate-100">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-black text-xl">{item.name}</div>
                  <div className="text-blue-500 font-bold text-sm">{item.variantName}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-black text-xl">$ {item.price * item.qty}</div>
                  <div className="text-xs text-slate-400 font-bold">x {item.qty}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="p-10 bg-slate-900 text-white rounded-t-[60px]">
          <div className="flex justify-between text-5xl font-black mb-10 tracking-tighter">
            <span>總額</span><span className="text-blue-400">$ {cart.reduce((a,c)=>a+c.price*c.qty,0)}</span>
          </div>
          <button onClick={handleCharge} className="w-full py-7 bg-blue-600 rounded-[30px] font-black text-2xl shadow-xl shadow-blue-500/20 active:scale-95 transition-all">確認結帳</button>
        </div>
      </div>

      {/* 規格選擇彈窗 (對標 Ch 3.2.1) */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-md z-50 flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-xl rounded-[60px] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-12 border-b bg-slate-50 flex justify-between items-center">
              <div>
                <h3 className="text-4xl font-black">{selectedProduct.name}</h3>
                <p className="text-slate-400 font-bold mt-2 uppercase tracking-widest text-xs text-blue-500">請選擇規格變體</p>
              </div>
              <button onClick={() => setSelectedProduct(null)} className="p-4 bg-white rounded-full shadow-sm hover:bg-red-50 hover:text-red-500 transition-all"><X size={32}/></button>
            </div>
            <div className="p-10 space-y-4">
              {selectedProduct.variants.map(v => (
                <button 
                  key={v.id} 
                  onClick={() => addToCart(selectedProduct, v)}
                  disabled={v.stock <= 0}
                  className={`w-full p-8 rounded-[40px] border-2 flex justify-between items-center transition-all ${v.stock > 0 ? 'bg-slate-50 border-slate-100 hover:border-blue-500 hover:bg-blue-50 active:scale-95' : 'opacity-40 grayscale cursor-not-allowed'}`}
                >
                  <div className="text-left">
                    <div className="font-black text-2xl">{v.sizeName}</div>
                    <div className={`text-xs font-bold ${v.stock <= 5 ? 'text-red-500' : 'text-slate-400'}`}>庫存剩餘: {v.stock}</div>
                  </div>
                  <div className="text-blue-600 font-black text-3xl font-mono">$ {v.price}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {isCheckedOut && (
        <div className="fixed inset-0 bg-blue-600 flex flex-col items-center justify-center z-[100] text-white">
          <CheckCircle size={150} className="mb-10 animate-bounce" />
          <h1 className="text-6xl font-black mb-12 italic">收款完畢</h1>
          <button onClick={() => setIsCheckedOut(false)} className="px-20 py-6 bg-white text-blue-600 rounded-[35px] font-black text-3xl shadow-2xl">下一筆交易</button>
        </div>
      )}
    </div>
  );
}
