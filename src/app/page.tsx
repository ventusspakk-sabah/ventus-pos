"use client";
import React, { useState, useEffect } from 'react';
import Dexie from 'dexie';
import { 
  ShoppingCart, Printer, Bluetooth, Globe, 
  Settings, CheckCircle, Wifi, RefreshCw, X, FileText 
} from 'lucide-react';

// 1. 資料庫結構：儲存印表機配置
const db = new Dexie('VentusPOS_V17');
db.version(1).stores({
  receipts: '++id, timestamp, total, items',
  printers: '++id, name, address, type' // type: 'bluetooth' or 'network'
});

export default function HardwarePOS() {
  const [isPrinting, setIsPrinting] = useState(false);
  const [printers, setPrinters] = useState([]);
  const [showPrinterPanel, setShowPrinterPanel] = useState(false);
  const [cart, setCart] = useState([]);
  const [isCheckedOut, setIsCheckedOut] = useState(false);

  useEffect(() => {
    const loadPrinters = async () => {
      setPrinters(await db.printers.toArray());
    };
    loadPrinters();
  }, [showPrinterPanel]);

  // 核心：ESC/POS 指令生成引擎 (對標 Ch 9.1)
  const generatePrintData = (receipt) => {
    let esc = "\x1B\x40"; // 初始化印表機
    esc += "\x1B\x61\x01"; // 居中對齊
    esc += "\x1B\x21\x30" + "VENTUS PRO POS\n"; // 倍高倍寬
    esc += "\x1B\x21\x00" + "--------------------------------\n";
    
    receipt.items.forEach(item => {
      esc += "\x1B\x61\x00"; // 左對齊
      esc += `${item.name.padEnd(20)} ${item.price}\n`;
    });
    
    esc += "\x1B\x61\x01" + "--------------------------------\n";
    esc += "\x1B\x21\x10" + `TOTAL: $ ${receipt.total}\n`;
    esc += "\x1B\x61\x01" + "\n謝謝惠顧\n\n\n\x1D\x56\x41\x03"; // 切紙指令
    return esc;
  };

  const handleCharge = async () => {
    if (cart.length === 0) return;
    const total = cart.reduce((a, c) => a + c.price, 0);
    const receipt = { timestamp: new Date().toISOString(), items: [...cart], total };
    
    setIsPrinting(true);
    // 模擬與硬體通訊
    setTimeout(async () => {
      console.log("發送 ESC/POS 數據:", generatePrintData(receipt));
      await db.receipts.add(receipt);
      setIsPrinting(false);
      setIsCheckedOut(true);
      setCart([]);
    }, 1500);
  };

  return (
    <div className="flex h-screen bg-slate-900 text-white font-sans overflow-hidden">
      {/* 側邊導航 */}
      <div className="w-24 bg-black flex flex-col items-center py-10 space-y-12">
        <div className="bg-blue-600 p-4 rounded-3xl shadow-lg"><ShoppingCart size={32} /></div>
        <button onClick={() => setShowPrinterPanel(true)} className="text-slate-500 hover:text-white transition-all">
          <Printer size={32} />
        </button>
        <div className="mt-auto text-slate-500"><Settings size={32} /></div>
      </div>

      <div className="flex-1 flex flex-col bg-slate-50 text-slate-900">
        <header className="h-24 bg-white border-b px-12 flex items-center justify-between shadow-sm">
          <h1 className="text-3xl font-black italic tracking-tighter">VENTUS <span className="text-blue-600">HARDWARE</span></h1>
          <div className="flex items-center gap-4">
             <div className="flex items-center text-xs font-bold text-green-500 bg-green-50 px-4 py-2 rounded-full border border-green-100">
               <Wifi size={14} className="mr-2" /> PRINTER ONLINE
             </div>
          </div>
        </header>

        <div className="flex-1 p-10 grid grid-cols-2 lg:grid-cols-3 gap-8 overflow-y-auto">
          {[ {id:1, name:'藍山精品', price:280}, {id:2, name:'招牌咖啡', price:120} ].map(p => (
            <button key={p.id} onClick={() => setCart([...cart, p])} className="bg-white p-8 rounded-[48px] shadow-sm border-2 border-transparent active:border-blue-500 flex flex-col justify-between h-48 transition-all">
              <span className="font-black text-2xl">{p.name}</span>
              <span className="text-blue-600 font-black text-3xl font-mono">$ {p.price}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 結帳側欄 */}
      <div className="w-[450px] bg-white border-l shadow-2xl flex flex-col text-slate-900">
        <div className="p-10 border-b flex justify-between items-center bg-slate-50">
          <h2 className="font-black text-2xl italic tracking-tighter">單據明細</h2>
          {isPrinting && <RefreshCw className="animate-spin text-blue-600" />}
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {cart.map((item, i) => (
            <div key={i} className="p-5 bg-white rounded-3xl border border-slate-100 font-bold flex justify-between shadow-sm">
              <span>{item.name}</span><span>$ {item.price}</span>
            </div>
          ))}
        </div>
        <div className="p-10 bg-slate-950 text-white rounded-t-[60px]">
          <div className="flex justify-between text-5xl font-black mb-10 tracking-tighter">
            <span>總額</span><span className="text-blue-400">$ {cart.reduce((a,c)=>a+c.price,0)}</span>
          </div>
          <button 
            onClick={handleCharge} 
            disabled={isPrinting}
            className={`w-full py-7 rounded-[30px] font-black text-2xl shadow-xl transition-all ${isPrinting ? 'bg-slate-700' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20 active:scale-95'}`}
          >
            {isPrinting ? '正在列印...' : '結帳並列印'}
          </button>
        </div>
      </div>

      {/* 印表機設置彈窗 (對標 Ch 2.8) */}
      {showPrinterPanel && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-2xl rounded-[60px] shadow-2xl overflow-hidden animate-in zoom-in duration-300 text-slate-900">
            <div className="p-10 border-b bg-slate-50 flex justify-between items-center">
              <h3 className="text-3xl font-black italic tracking-tighter">硬體連結中心</h3>
              <button onClick={() => setShowPrinterPanel(false)}><X size={32}/></button>
            </div>
            <div className="p-10 space-y-8">
              <div className="grid grid-cols-2 gap-6">
                <button className="p-8 bg-blue-50 border-2 border-blue-500 rounded-[40px] flex flex-col items-center gap-4">
                  <Bluetooth size={48} className="text-blue-600" />
                  <span className="font-black text-xl">藍牙印表機</span>
                </button>
                <button className="p-8 bg-slate-50 border-2 border-transparent rounded-[40px] flex flex-col items-center gap-4 opacity-50">
                  <Wifi size={48} className="text-slate-600" />
                  <span className="font-black text-xl">網路印表機</span>
                </button>
              </div>
              <div className="bg-slate-100 p-8 rounded-[40px]">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">搜尋到的設備</h4>
                <div className="flex justify-between items-center p-4 bg-white rounded-2xl border border-slate-200">
                  <div className="flex items-center gap-3">
                    <FileText size={20} className="text-blue-500" />
                    <span className="font-bold">Thermal Printer 58mm</span>
                  </div>
                  <span className="text-[10px] bg-green-500 text-white px-2 py-1 rounded-full font-black">已連線</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {isCheckedOut && (
        <div className="fixed inset-0 bg-blue-600 flex flex-col items-center justify-center z-[100] text-white">
          <CheckCircle size={150} className="mb-10 animate-bounce" />
          <h1 className="text-6xl font-black mb-10 text-center tracking-tighter">支付成功！<br/><span className="text-2xl opacity-70">收據已自動派送至印表機</span></h1>
          <button onClick={() => setIsCheckedOut(false)} className="px-20 py-6 bg-white text-blue-600 rounded-[35px] font-black text-3xl shadow-2xl">下一筆</button>
        </div>
      )}
    </div>
  );
}
