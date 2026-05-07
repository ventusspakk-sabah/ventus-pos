"use client";
import React, { useState, useEffect } from 'react';
import Dexie from 'dexie';
import { 
  ShoppingCart, BarChart3, Database, Download, 
  FileSpreadsheet, Trash2, CheckCircle, Search, Settings, LogOut 
} from 'lucide-react';

// 1. 資料庫結構 (對標 Ch 7.1 數據導出需求)
const db = new Dexie('VentusPOS_V13');
db.version(1).stores({
  receipts: '++id, timestamp, total, paymentMethod, items',
  inventory: '++id, name, price, stock'
});

export default function ExportPOS() {
  const [view, setView] = useState('pos'); // 'pos', 'reports', 'admin'
  const [cart, setCart] = useState([]);
  const [history, setHistory] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [isCheckedOut, setIsCheckedOut] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setHistory(await db.receipts.toArray());
      setInventory(await db.inventory.toArray());
    };
    loadData();
  }, [view, isCheckedOut]);

  const handleCharge = async () => {
    if (cart.length === 0) return;
    await db.receipts.add({
      timestamp: new Date().toISOString(),
      total: cart.reduce((a, c) => a + c.price, 0),
      paymentMethod: '現金',
      items: JSON.stringify(cart)
    });
    setIsCheckedOut(true);
    setCart([]);
  };

  // 核心邏輯：CSV 格式化導出 (對標 Ch 3.6)
  const exportToCSV = (data, fileName) => {
    if (data.length === 0) return alert('目前沒有數據可供導出');
    
    // 取得欄位標頭
    const headers = Object.keys(data[0]).join(',');
    // 轉換每一行數據
    const rows = data.map(item => 
      Object.values(item).map(val => `"${String(val).replace(/"/g, '""')}"`).join(',')
    );
    const csvContent = "data:text/csv;charset=utf-8,\ufeff" + [headers, ...rows].join('\n');
    
    // 觸發下載
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `${fileName}_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      {/* 側邊導航 */}
      <div className="w-20 bg-slate-900 flex flex-col items-center py-8 space-y-10 text-white shadow-2xl">
        <button onClick={() => setView('pos')} className={`p-3 rounded-2xl ${view === 'pos' ? 'bg-blue-600 shadow-lg' : 'text-slate-500'}`}><ShoppingCart size={28} /></button>
        <button onClick={() => setView('reports')} className={`p-3 rounded-2xl ${view === 'reports' ? 'bg-blue-600 shadow-lg' : 'text-slate-500'}`}><BarChart3 size={28} /></button>
        <button onClick={() => setView('admin')} className={`p-3 rounded-2xl ${view === 'admin' ? 'bg-blue-600 shadow-lg' : 'text-slate-500'}`}><Database size={28} /></button>
        <div className="mt-auto text-slate-500"><Settings size={28} /></div>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        {view === 'pos' && (
          <div className="flex-1 flex">
            {/* 銷售介面 */}
            <div className="flex-1 p-6 grid grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto">
              {[ {id:1, name:'拿鐵', price:120}, {id:2, name:'美式', price:90} ].map(p => (
                <button key={p.id} onClick={() => setCart([...cart, p])} className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 h-44 flex flex-col justify-between text-left active:scale-95 transition-all">
                  <span className="font-black text-2xl">{p.name}</span>
                  <span className="text-blue-600 font-black text-2xl font-mono">$ {p.price}</span>
                </button>
              ))}
            </div>
            <div className="w-96 bg-white border-l shadow-2xl p-6 flex flex-col">
              <h2 className="text-2xl font-black mb-8 italic tracking-tighter">當前單據</h2>
              <div className="flex-1 overflow-y-auto space-y-3">
                {cart.map((item, i) => <div key={i} className="p-4 bg-slate-50 rounded-2xl font-bold flex justify-between"><span>{item.name}</span><span>$ {item.price}</span></div>)}
              </div>
              <button onClick={handleCharge} className="w-full mt-6 py-6 bg-slate-900 text-white rounded-3xl font-black text-xl">確認收銀</button>
            </div>
          </div>
        )}

        {view === 'admin' && (
          <div className="flex-1 p-12 overflow-y-auto">
            {/* 數據管理與導出介面 (對標 Ch 3.6) */}
            <div className="max-w-4xl mx-auto">
              <h1 className="text-4xl font-black mb-2 italic tracking-tighter uppercase">Data Management</h1>
              <p className="text-slate-400 font-bold mb-10">將 POS 內的營業數據導出至 Excel 進行分析</p>

              <div className="grid grid-cols-2 gap-8 mb-12">
                {/* 銷售報表導出卡片 */}
                <div className="bg-white p-10 rounded-[50px] shadow-sm border border-slate-100 flex flex-col justify-between h-80">
                  <div>
                    <div className="bg-green-100 text-green-600 w-16 h-16 rounded-3xl flex items-center justify-center mb-6">
                      <FileSpreadsheet size={32} />
                    </div>
                    <h3 className="text-2xl font-black mb-2">銷售流水明細</h3>
                    <p className="text-slate-400 text-sm font-bold">包含所有收據編號、時間、金額與支付方式</p>
                  </div>
                  <button 
                    onClick={() => exportToCSV(history, 'Sales_Report')}
                    className="w-full py-4 bg-green-600 text-white rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-green-700 transition-all"
                  >
                    <Download size={20} /> 導出 CSV (Excel)
                  </button>
                </div>

                {/* 庫存清單導出卡片 */}
                <div className="bg-white p-10 rounded-[50px] shadow-sm border border-slate-100 flex flex-col justify-between h-80">
                  <div>
                    <div className="bg-blue-100 text-blue-600 w-16 h-16 rounded-3xl flex items-center justify-center mb-6">
                      <Package size={32} />
                    </div>
                    <h3 className="text-2xl font-black mb-2">商品庫存清單</h3>
                    <p className="text-slate-400 text-sm font-bold">當前所有商品的庫存餘額、價格與 SKU</p>
                  </div>
                  <button 
                    onClick={() => exportToCSV(inventory, 'Inventory_List')}
                    className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-blue-700 transition-all"
                  >
                    <Download size={20} /> 導出 CSV (Excel)
                  </button>
                </div>
              </div>

              {/* 危險區域：清除數據 */}
              <div className="bg-red-50 p-8 rounded-[40px] border-2 border-red-100 flex items-center justify-between">
                <div>
                  <h4 className="text-red-600 font-black text-xl mb-1 flex items-center gap-2"><Trash2 size={20}/> 重置系統資料庫</h4>
                  <p className="text-red-400 text-sm font-bold">這將永久刪除所有歷史收據與設置，請務必先導出備份。</p>
                </div>
                <button 
                  onClick={async () => { if(confirm('確定要清空所有數據？')){ await db.receipts.clear(); alert('已清空'); setView('pos'); }}}
                  className="px-8 py-3 bg-red-600 text-white rounded-xl font-black text-sm"
                >
                  執行清空
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {isCheckedOut && (
        <div className="fixed inset-0 bg-blue-600 flex flex-col items-center justify-center z-50 text-white">
          <CheckCircle size={100} className="mb-6 animate-bounce" />
          <h1 className="text-4xl font-black mb-10">交易完成</h1>
          <button onClick={() => setIsCheckedOut(false)} className="px-12 py-4 bg-white text-blue-600 rounded-2xl font-black text-xl">下一筆</button>
        </div>
      )}
    </div>
  );
}
