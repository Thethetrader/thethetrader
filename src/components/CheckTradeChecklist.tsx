import { useState } from 'react';

export default function CheckTradeChecklist() {
  // États pour les 5 critères
  const [b1, setB1] = useState(false);
  const [b2a, setB2a] = useState(false);
  const [b2b, setB2b] = useState(false);
  const [b3, setB3] = useState(false);
  const [rr, setRr] = useState(false);
  
  // Vérifier si tout est coché
  const allOk = b1 && b2a && b2b && b3 && rr;
  
  // Reset
  const handleReset = () => {
    setB1(false);
    setB2a(false);
    setB2b(false);
    setB3(false);
    setRr(false);
  };
  
  return (
    <div className="flex flex-col items-center justify-start p-4 pt-4 md:pt-8">
      <div className={`w-full max-w-sm backdrop-blur-sm rounded-lg p-4 border shadow-lg transition-colors ${
        allOk 
          ? 'bg-green-800/50 border-green-600/70' 
          : 'bg-red-800/50 border-red-600/70'
      }`}>
        <h2 className={`text-sm font-semibold mb-4 text-center uppercase tracking-wide ${
          allOk ? 'text-green-300' : 'text-red-300'
        }`}>TPLN CHECK</h2>
        
        {/* Checklist */}
        <div className="space-y-1 mb-4">
          <label className="flex items-center gap-3 p-2.5 cursor-pointer hover:bg-gray-800/50 transition-colors rounded">
            <span className="text-white text-base font-medium">
              ✓ B1 Accumulation
            </span>
            <input
              type="checkbox"
              checked={b1}
              onChange={(e) => setB1(e.target.checked)}
              className="ml-auto w-5 h-5 rounded border-gray-600 bg-gray-700 text-green-500 focus:ring-green-500 focus:ring-2"
            />
          </label>
          
          <label className="flex items-center gap-3 p-2.5 cursor-pointer hover:bg-gray-800/50 transition-colors rounded">
            <span className="text-white text-base font-medium">
              ✓ B2 Extrémité / Sweep ITHL + Disp
            </span>
            <input
              type="checkbox"
              checked={b2a}
              onChange={(e) => setB2a(e.target.checked)}
              className="ml-auto w-5 h-5 rounded border-gray-600 bg-gray-700 text-green-500 focus:ring-green-500 focus:ring-2"
            />
          </label>
          
          <label className="flex items-center gap-3 p-2.5 cursor-pointer hover:bg-gray-800/50 transition-colors rounded">
            <span className="text-white text-base font-medium">
              ✓ B2 Fake MSS / ITMSS
            </span>
            <input
              type="checkbox"
              checked={b2b}
              onChange={(e) => setB2b(e.target.checked)}
              className="ml-auto w-5 h-5 rounded border-gray-600 bg-gray-700 text-green-500 focus:ring-green-500 focus:ring-2"
            />
          </label>
          
          <label className="flex items-center gap-3 p-2.5 cursor-pointer hover:bg-gray-800/50 transition-colors rounded">
            <span className="text-white text-base font-medium">
              ✓ B3 Sweep ITHL (fin C2 / open C3)
            </span>
            <input
              type="checkbox"
              checked={b3}
              onChange={(e) => setB3(e.target.checked)}
              className="ml-auto w-5 h-5 rounded border-gray-600 bg-gray-700 text-green-500 focus:ring-green-500 focus:ring-2"
            />
          </label>
          
          <label className="flex items-center gap-3 p-2.5 cursor-pointer hover:bg-gray-800/50 transition-colors rounded">
            <span className="text-white text-base font-medium">
              ✓ RR ≥ 1:2
            </span>
            <input
              type="checkbox"
              checked={rr}
              onChange={(e) => setRr(e.target.checked)}
              className="ml-auto w-5 h-5 rounded border-gray-600 bg-gray-700 text-green-500 focus:ring-green-500 focus:ring-2"
            />
          </label>
        </div>
        
        {/* Bouton RESET */}
        <button
          onClick={handleReset}
          className="w-full py-2 px-3 rounded-md bg-gray-700/50 border border-gray-600/50 text-gray-300 hover:bg-gray-700 hover:border-gray-600 transition-colors text-sm font-medium"
        >
          ♻️ Reset
        </button>
      </div>
    </div>
  );
}
