"use client";
import React, { useState, useEffect } from 'react';
import Dexie from 'dexie';
import { 
  ShoppingCart, Globe, ChevronRight, CheckCircle, 
  Settings, Package, BarChart3, Languages, X, Trash2 
} from 'lucide-react';

// 1. 翻譯字典 (對標國際化專業規範)
const i18n = {
  zh: {
    shop_name: "VENTUS 專業收銀",
    pos: "銷售模式",
    inventory: "庫存管理",
    total: "總計金額",
    charge: "確認收款",
    sync: "雲端同步",
    language: "切換語言",
    items: "商品明細",
    success: "交易成功",
    next: "下一筆交易"
  },
  en: {
    shop_name: "VENTUS PRO POS",
    pos: "Sales Mode",
    inventory: "Inventory",
    total: "Total Amount",
    charge: "Charge Now",
    sync: "Cloud Sync",
    language: "Language",
    items: "Order Items",
    success: "Success!",
    next: "Next Sale"
  }
};

const db = new Dexie('VentusPOS_V20');
db.version(1).stores({
  settings: 'key, value',
  receipts: '++id, total, timestamp'
});

export default function I18nPOS() {
  const [lang, setLang] = useState('zh');
  const 
git push origin main
cat <<EOF > src/app/page.tsx
"use client";
import React, { useState, useEffect } from 'react';
import Dexie from 'dexie';
import { 
  ShoppingCart, Globe, ChevronRight, CheckCircle, 
  Settings, Package, BarChart3, Languages, X, Trash2 
} from 'lucide-react';

// 1. 翻譯字典 (對標國際化專業規範)
const i18n = {
  zh: {
    shop_name: "VENTUS 專業收銀",
    pos: "銷售模式",
    inventory: "庫存管理",
    total: "總計金額",
    charge: "確認收款",
    sync: "雲端同步",
    language: "切換語言",
    items: "商品明細",
    success: "交易成功",
    next: "下一筆交易"
  },
  en: {
    shop_name: "VENTUS PRO POS",
    pos: "Sales Mode",
    inventory: "Inventory",
    total: "Total Amount",
    charge: "Charge Now",
    sync: "Cloud Sync",
    language: "Language",
    items: "Order Items",
    success: "Success!",
    next: "Next Sale"
  }
};

const db = new Dexie('VentusPOS_V20');
db.version(1).stores({
  settings: 'key, value',
  receipts: '++id, total, timestamp'
});

export default function I18nPOS() {
  const [lang, setLang] = useState('zh');
  const [cart, setCart] = useState([]);
  const [isCheckedOut, setIsCheckedOut] = useState(false);

  // 語系持久化讀取
  useEffect(() => {
    const loadLang = async () => {
      const saved = await db.settings.get('app_lang');
      if (saved) setLang(saved.value);
    };
    loadLang();
  }, []);

  const toggleLang = async () => {
    const newLang = lang === 'zh' ? 'en' : 'zh';
    setLang(newLang);
    await db.settings.put({ key: 'app_lang', value: newLang });
  };

  // 翻譯輔助函式
  const t = (key) => i18n[lang][key] || key;

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      {/* 側邊導覽列 */}
      <div className="w-24 bg-slate-950 flex flex-col items-center py-10 space-y-12 text-white shadow-2xl">
        <div className="bg-blue-600 p-4 rounded-3xl shadow-lg"><ShoppingCart size={32} /></div>
        <button onClick={toggleLang} className="text-slate-500 hover:text-blue-400 transition-all">
          <Languages size={32} />
        </button>
        <div className="mt-auto text-slate-500"><Settings size={32} /></div>
      </div>

      <div className="flex-1 flex flex-col">
        {/* 頂部 Header */}
        <header className="h-24 bg-white border-b px-12 flex items-center justify-between shadow-sm">
          <div className="flex flex-col">
            <h1 className="text-3xl font-black italic tracking-tighter text-slate-900">
              {t('shop_name')}
            </h1>
            <span className="text-[10px] font-black text-blue-500 tracking-widest uppercase">
              Global Edition v20
            </span>
          </div>

          <div className="flex items-center gap-6">
             <button 
               onClick={toggleLang}
               className="flex items-center gap-2 bg-slate-100 px-6 py-3 rounded-2xl font-black text-sm active:scale-95 transition-all"
             >
               <Globe size={18} className="text-blue-500" />
               {lang === 'zh' ? 'ENGLISH' : '繁體中文'}
             </button>
          </div>
        </header>

        <main className="flex-1 p-10 flex">
          {/* 商品區展示簡化版 */}
          <div className="flex-1 grid grid-cols-2 gap-8 pr-10">
            {[1, 2].map(i => (
              <button 
                key={i} 
                onClick={() => setCart([...cart, { id: i, name: i === 1 ? 'Latte' : 'Cake', price: 100 }])}
                className="bg-white p-10 rounded-[50px] shadow-sm border border-slate-100 flex flex-col justify-between h-56 text-left hover:border-blue-500 transition-all"
              >
                <span className="font-black text-3xl">{i === 1 ? '拿鐵咖啡' : '精緻蛋糕'}</span>
                <span className="text-blue-600 font-black text-4xl font-mono">$ 100</span>
              </button>
            ))}
          </div>

          {/* 結帳側欄 (全語系連動) */}
          <div className="w-[450px] bg-white rounded-[60px] shadow-2xl border flex flex-col overflow-hidden">
            <div className="p-10 border-b bg-slate-50">
              <h2 className="text-2xl font-black italic tracking-tighter uppercase">{t('items')}</h2>
            </div>
            
            <div className="flex-1 p-6 overflow-y-auto space-y-4">
              {cart.map((item, idx) => (
                <div key={idx} className="flex justify-between p-5 bg-slate-100 rounded-3xl font-bold">
                  <span>{item.name}</span><span>$ {item.price}</span>
                </div>
              ))}
            </div>

            <div className="p-10 bg-slate-950 text-white">
              <div className="flex justify-between text-5xl font-black mb-10 tracking-tighter">
                <span className="text-slate-500 text-2xl uppercase">{t('total')}</span>
                <span className="text-blue-400">$ {cart.reduce((a,c)=>a+c.price,0)}</span>
              </div>
              <button 
                onClick={() => setIsCheckedOut(true)}
                className="w-full py-7 bg-blue-600 rounded-[35px] font-black text-2xl shadow-xl shadow-blue-500/20 active:scale-95 transition-all"
              >
                {t('charge')}
              </button>
            </div>
          </div>
        </main>
      </div>

      {/* 結帳成功 (語系連動彈窗) */}
      {isCheckedOut && (
        <div className="fixed inset-0 bg-blue-600 flex flex-col items-center justify-center z-[100] text-white">
          <CheckCircle size={150} className="mb-10 animate-bounce" />
          <h1 className="text-7xl font-black mb-12 italic tracking-tighter">{t('success')}</h1>
          <button 
            onClick={() => {setIsCheckedOut(false); setCart([]);}} 
            className="px-24 py-8 bg-white text-blue-600 rounded-[40px] font-black text-3xl shadow-2xl active:scale-95 transition-all"
          >
            {t('next')}
          </button>
        </div>
      )}
    </div>
  );
}
