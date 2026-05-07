"use client";
import React, { useState, useEffect } from 'react';
import Dexie from 'dexie';
import { 
  ShoppingCart, Scan, Keyboard, Package, 
  Search, CheckCircle, X, Trash2, Zap, AlertCircle 
} from 'lucide-react';

// 1. 資料庫結構：加入 SKU 條碼支援 (對標 Ch 2.4)
const db = new Dexie('VentusPOS_V15');
db.version(1).stores({
  inventory: 'id, name, price, sku, stock',
  receipts: '++id, timestamp, total, items'
});

export default function BarcodePOS() {
  const [cart, setCart] = useState([]);
  const [products, setProducts] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [manualSku, setManualSku] = useState('');
  const [isCheckedOut, setIsCheckedOut] = useState(false);

  useEffect(() => {
    const init = async () => {
      if (await db.inventory.count() === 0) {
        await db.inventory.bulkAdd([
          { id: 1, name: '可口可樂 330ml', price: 25, sku: '690123456789', stock: 100 },
          { id: 2, name: '樂事原味洋芋片', price: 45, sku: '471012345678', stock: 50 },
          { id: 3, name: '貝納頌拿鐵', price: 35, sku: '471098765432', stock: 80 }
        ]);
      }
      setProducts(await db.inventory.toArray());
    };
    init();
  }, [isCheckedOut]);

  // 核心：SKU 匹配入單邏輯
  const handleScanSuccess = async (scannedSku) => {
    const product = await db.inventory.where('sku').equals(scannedSku).first();
    if (product) {
      if (product.stock <= 0) return alert('此商品庫存不足');
      addToCart(product);
      // 這裡未來可以加入音效播放 logic
    } else {
      alert('找不到此條碼對應的商品: ' + scannedSku);
    }
    setIsScanning(false);
    setManualSku('');
  };

  const addToCart = (p) => {
    const exist = cart.find(x => x.id === p.id);
    setCart(exist ? cart.map(x => x.id === p.id ? {...exist, qty: exist.qty + 1} : x) : [...cart, {...p, qty: 1}]);
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      {/* 導覽列 */}
      <div className="w-20 bg-slate-900 flex flex-col items-center py-8 space-y-10 text-white shadow-2xl">
        <div className="bg-blue-600 p-3 rounded-2xl shadow-lg"><ShoppingCart size={28} /></div>
        <button onClick={() => setIsScanning(true)} className="text-slate-500 hover:text-blue-400 transition-colors">
          <Scan size={28} />
        </button>
        <div className="mt-auto text-slate-500"><Package size={28} /></div>
      </div>

      <div className="flex-1 flex flex-col">
        <header className="h-20 bg-white border-b px-8 flex items-center justify-between shadow-sm">
          <h2 className="font-black text-2xl tracking-tighter italic">VENTUS SCANNER</h2>
          {/* 掃描快捷按鈕 */}
          <button 
            onClick={() => setIsScanning(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-2xl font-black shadow-lg shadow-blue-500/30 active:scale-95 transition-all"
          >
            <Zap size={18} fill="currentColor" /> 開啟掃描槍
          </button>
        </header>

        {/* 商品與 SKU 列表 */}
        <div className="flex-1 p-6 grid grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto">
          {products.map(p => (
            <button key={p.id} onClick={() => addToCart(p)} className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 text-left h-44 flex flex-col justify-between hover:border-blue-500 transition-all">
              <div>
                <div className="font-black text-xl leading-tight">{p.name}</div>
                <div className="text-[10px] text-slate-400 font-mono mt-1">SKU: {p.sku}</div>
              </div>
              <div className="text-blue-600 font-black text-2xl font-mono">$ {p.price}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 結帳側欄 */}
      <div className="w-96 bg-white border-l shadow-2xl flex flex-col">
        <div className="p-8 border-b flex justify-between items-center">
          <h3 className="font-black text-xl italic">單據明細</h3>
          <button onClick={() => setCart([])} className="text-slate-300 hover:text-red-500"><Trash2 size={20}/></button>
        </div>
        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          {cart.map((item, i) => (
            <div key={i} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl font-bold border border-slate-100">
              <span>{item.name} x{item.qty}</span>
              <span>$ {item.price * item.qty}</span>
            </div>
          ))}
        </div>
        <div className="p-8 bg-slate-900 text-white rounded-t-[48px]">
          <div className="flex justify-between text-4xl font-black mb-8 tracking-tighter">
            <span>總額</span><span className="text-blue-400">$ {cart.reduce((a,c)=>a+c.price*c.qty,0)}</span>
          </div>
          <button onClick={() => setIsCheckedOut(true)} className="w-full py-6 bg-blue-600 rounded-3xl font-black text-2xl active:scale-95 transition-all shadow-xl shadow-blue-500/20">確認結帳</button>
        </div>
      </div>

      {/* 條碼掃描介面 (對標 Ch 2.4.1) */}
      {isScanning && (
        <div className="fixed inset-0 bg-black z-[100] flex flex-col">
          <div className="h-24 bg-black/50 backdrop-blur-md flex items-center justify-between px-8 text-white">
            <button onClick={() => setIsScanning(false)}><X size={32}/></button>
            <h3 className="text-xl font-black italic">正在掃描商品條碼...</h3>
            <div className="w-8"></div>
          </div>
          
          {/* 掃描框模擬視覺效果 */}
          <div className="flex-1 relative flex items-center justify-center">
            <div className="w-72 h-48 border-2 border-blue-500 rounded-3xl relative overflow-hidden">
              <div className="absolute inset-0 bg-blue-500/10 animate-pulse"></div>
              {/* 動態掃描線 */}
              <div className="absolute top-0 left-0 w-full h-1 bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,1)] animate-[scan_2s_infinite]"></div>
            </div>
            {/* 提示文字 */}
            <p className="absolute bottom-10 text-white/60 font-bold text-sm">請將條碼對準藍色框內</p>
          </div>

          <div className="p-10 bg-black/50 backdrop-blur-md">
            <div className="flex gap-4 mb-4">
              <input 
                placeholder="或手動輸入條碼..." 
                className="flex-1 bg-white/10 border border-white/20 rounded-2xl px-6 py-4 text-white outline-none focus:border-blue-500"
                value={manualSku}
                onChange={(e) => setManualSku(e.target.value)}
              />
              <button onClick={() => handleScanSuccess(manualSku)} className="bg-white text-black px-8 py-4 rounded-2xl font-bold">送出</button>
            </div>
            <p className="text-center text-xs text-white/30 italic">掃描功能需要 Camera 權限</p>
          </div>
        </div>
      )}

      {isCheckedOut && (
        <div className="fixed inset-0 bg-blue-600 flex flex-col items-center justify-center z-[200] text-white">
          <CheckCircle size={120} className="mb-6 animate-bounce" />
          <h1 className="text-5xl font-black mb-10 text-center tracking-tighter">交易成功！<br/><span className="text-2xl opacity-70">庫存已根據 SKU 同步扣除</span></h1>
          <button onClick={() => {setIsCheckedOut(false); setCart([]);}} className="px-16 py-5 bg-white text-blue-600 rounded-3xl font-black text-2xl shadow-2xl">下一筆</button>
        </div>
      )}

      <style jsx>{`
        @keyframes scan {
          0% { top: 0; }
          100% { top: 100%; }
        }
      `}</style>
    </div>
  );
}
