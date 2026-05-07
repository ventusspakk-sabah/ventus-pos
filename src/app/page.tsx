"use client";
import React, { useState, useEffect } from 'react';
import Dexie from 'dexie';
import { 
  ShoppingCart, Lock, Unlock, Banknote, 
  ArrowUpRight, ArrowDownLeft, FileText, CheckCircle, X, LogOut 
} from 'lucide-react';

// 1. 資料庫結構：加入班次與現金變動紀錄 (對標 Ch 7.6)
const db = new Dexie('VentusPOS_V11');
db.version(1).stores({
  shifts: '++id, openedAt, closedAt, startingCash, actualCash, status',
  cashMovements: '++id, shiftId, type, amount, reason, timestamp',
  receipts: '++id, shiftId, total, paymentMethod, status'
});

export default function ShiftPOS() {
  const [currentShift, setCurrentShift] = useState(null);
  const [startingCashInput, setStartingCashInput] = useState('');
  const [actualCashInput, setActualCashInput] = useState('');
  const [isClosingShift, setIsClosingShift] = useState(false);
  const [shiftStats, setShiftStats] = useState({ cashSales: 0, paidIn: 0, paidOut: 0 });

  // 1:1 複刻班次檢查邏輯
  useEffect(() => {
    const checkShift = async () => {
      const active = await db.shifts.where('status').equals('OPEN').first();
      if (active) {
        setCurrentShift(active);
        // 計算該班次的即時數據
        const cashSales = await db.receipts.where('shiftId').equals(active.id).and(r => r.paymentMethod === '現金' && r.status === 'COMPLETED').toArray();
        const movements = await db.cashMovements.where('shiftId').equals(active.id).toArray();
        
        setShiftStats({
          cashSales: cashSales.reduce((a, b) => a + b.total, 0),
          paidIn: movements.filter(m => m.type === 'IN').reduce((a, b) => a + b.amount, 0),
          paidOut: movements.filter(m => m.type === 'OUT').reduce((a, b) => a + b.amount, 0)
        });
      } else {
        setCurrentShift(null);
      }
    };
    checkShift();
  }, [isClosingShift]);

  const handleOpenShift = async () => {
    const cash = parseFloat(startingCashInput) || 0;
    const id = await db.shifts.add({
      openedAt: new Date().toISOString(),
      startingCash: cash,
      status: 'OPEN'
    });
    setStartingCashInput('');
    setCurrentShift({ id, startingCash: cash, status: 'OPEN' });
  };

  const handleCloseShift = async () => {
    const actual = parseFloat(actualCashInput) || 0;
    await db.shifts.update(currentShift.id, {
      closedAt: new Date().toISOString(),
      actualCash: actual,
      status: 'CLOSED'
    });
    setActualCashInput('');
    setIsClosingShift(false);
    setCurrentShift(null);
    alert('班次已關閉，財務審計紀錄已存檔。');
  };

  const expectedCash = currentShift ? 
    currentShift.startingCash + shiftStats.cashSales + shiftStats.paidIn - shiftStats.paidOut : 0;

  // --- 開班畫面 ---
  if (!currentShift) {
    return (
      <div className="h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-6">
        <Lock size={64} className="text-yellow-500 mb-6" />
        <h1 className="text-4xl font-black italic mb-2">POS 班次鎖定</h1>
        <p className="text-slate-400 mb-10 text-center">開始收銀前，請先輸入抽屜內的開班備用金 (Starting Cash)</p>
        <div className="w-full max-w-sm">
          <input 
            type="number" 
            placeholder="輸入開班金額..." 
            className="w-full p-6 bg-slate-800 rounded-3xl text-3xl font-bold text-center mb-6 outline-none border-2 border-transparent focus:border-blue-500"
            value={startingCashInput}
            onChange={(e) => setStartingCashInput(e.target.value)}
          />
          <button onClick={handleOpenShift} className="w-full py-5 bg-blue-600 rounded-3xl font-black text-2xl shadow-xl shadow-blue-500/20 active:scale-95 transition-all">
            開班 (OPEN SHIFT)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-100 font-sans overflow-hidden">
      {/* 側邊導航 */}
      <div className="w-20 bg-slate-900 flex flex-col items-center py-8 space-y-10 text-white shadow-2xl">
        <div className="bg-blue-600 p-3 rounded-2xl"><ShoppingCart size={28} /></div>
        <button onClick={() => setIsClosingShift(true)} className="text-slate-500 hover:text-white"><FileText size={28} /></button>
        <div className="mt-auto text-slate-500"><LogOut size={28} /></div>
      </div>

      <div className="flex-1 flex flex-col">
        <header className="h-20 bg-white border-b px-8 flex items-center justify-between shadow-sm">
          <div className="flex flex-col">
            <h2 className="font-black text-2xl text-slate-800">銷售畫面</h2>
            <span className="text-xs font-bold text-green-500 uppercase tracking-widest">● 班次運行中</span>
          </div>
          <div className="bg-slate-100 px-6 py-2 rounded-2xl flex items-center">
            <Banknote size={18} className="mr-2 text-slate-400" />
            <span className="text-sm font-bold text-slate-600">預期現金: $ {expectedCash}</span>
          </div>
        </header>

        {/* 商品區略 (與前幾版一致) */}
        <div className="flex-1 p-10 flex items-center justify-center text-slate-300 italic font-bold">
          [ 點擊商品並進行收銀，產生的現金銷售將計入此班次 ]
        </div>
      </div>

      {/* 結班 Z-Report 彈窗 (對標 Ch 7.6) */}
      {isClosingShift && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-50 flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-lg rounded-[48px] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in duration-300">
            <div className="p-10 border-b flex justify-between items-center bg-slate-50">
              <h3 className="text-3xl font-black italic tracking-tighter">班次結算報告 (Z-Report)</h3>
              <button onClick={() => setIsClosingShift(false)}><X size={32}/></button>
            </div>
            
            <div className="p-10 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-6 bg-slate-50 rounded-3xl">
                  <span className="text-xs font-bold text-slate-400 block mb-2 uppercase">開班備用金</span>
                  <span className="text-2xl font-black text-slate-800">$ {currentShift.startingCash}</span>
                </div>
                <div className="p-6 bg-blue-50 rounded-3xl">
                  <span className="text-xs font-bold text-blue-400 block mb-2 uppercase">現金銷售</span>
                  <span className="text-2xl font-black text-blue-600">$ {shiftStats.cashSales}</span>
                </div>
              </div>

              <div className="border-t-2 border-dashed border-slate-100 pt-6 space-y-4">
                <div className="flex justify-between font-bold text-slate-600 px-2">
                  <span>預期抽屜現金</span>
                  <span className="font-mono text-xl">$ {expectedCash}</span>
                </div>
                <div className="bg-slate-900 p-8 rounded-[40px] text-white">
                  <span className="text-xs font-bold opacity-60 block mb-3 uppercase text-center">結班實點金額 (Actual Cash)</span>
                  <input 
                    type="number"
                    className="w-full bg-transparent text-center text-5xl font-black outline-none border-b-2 border-blue-500 pb-2 mb-4"
                    value={actualCashInput}
                    onChange={(e) => setActualCashInput(e.target.value)}
                  />
                  {actualCashInput && (
                    <div className={`text-center font-bold ${(parseFloat(actualCashInput) - expectedCash) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      差異: $ {parseFloat(actualCashInput) - expectedCash}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-10 pt-0">
              <button 
                onClick={handleCloseShift}
                className="w-full py-6 bg-red-500 hover:bg-red-600 text-white rounded-3xl font-black text-2xl shadow-xl shadow-red-500/20 active:scale-95 transition-all"
              >
                關閉班次並登出
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
