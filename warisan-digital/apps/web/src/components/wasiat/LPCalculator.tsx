"use client";

import { useLegitimePortie } from "@/hooks/useLegitimePortie";

interface AhliWaris {
  persentaseBps: number;
  isLegitimePortie: boolean;
  nama?: string;
}

interface LPCalculatorProps {
  ahliWarisList: AhliWaris[];
  jumlahAnakSah: number;
}

/**
 * LPCalculator Component
 * Real-time Legitieme Portie calculator dengan visual feedback
 * Menampilkan persentase LP vs bebas dan status compliance
 */
export function LPCalculator({
  ahliWarisList,
  jumlahAnakSah,
}: LPCalculatorProps) {
  const lpResult = useLegitimePortie(ahliWarisList, jumlahAnakSah);

  // Calculate percentages for visual display
  const lpPercentage = Math.round((lpResult.totalLPBps / 10000) * 100);
  const bebasPercentage = Math.round((lpResult.bebasPortieBps / 10000) * 100);

  const statusColor = lpResult.isValid
    ? "bg-green-100 border-green-300"
    : "bg-red-100 border-red-300";
  const statusTextColor = lpResult.isValid ? "text-green-700" : "text-red-700";

  return (
    <div className={`border rounded-lg p-4 ${statusColor}`}>
      <div className="mb-4">
        <h3 className="font-semibold text-lg mb-2">Legitieme Portie</h3>
        <p className="text-sm text-gray-700 mb-3">
          Pasal 914 KUHPerdata - Bagian Mutlak Ahli Waris
        </p>
      </div>

      {/* Progress bar untuk LP vs Bebas */}
      <div className="mb-4">
        <div className="flex justify-between mb-1 text-sm">
          <span className="font-medium">Alokasi Warisan</span>
          <span className={lpResult.isValid ? "text-green-600" : "text-red-600"}>
            Total: {(lpResult.totalBps / 10000 * 100).toFixed(1)}%
          </span>
        </div>
        <div className="flex h-6 bg-gray-200 rounded overflow-hidden">
          {/* LP Portion */}
          <div
            className="bg-blue-500 flex items-center justify-center text-white text-xs font-bold"
            style={{ width: `${lpPercentage}%` }}
          >
            {lpPercentage > 10 && "LP"}
          </div>
          {/* Free Portion */}
          <div
            className="bg-gray-400 flex items-center justify-center text-white text-xs font-bold"
            style={{ width: `${bebasPercentage}%` }}
          >
            {bebasPercentage > 10 && "Bebas"}
          </div>
        </div>
      </div>

      {/* Breakdown */}
      <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
        <div className="bg-white bg-opacity-60 p-2 rounded">
          <p className="text-gray-600">Porsi LP (Mutlak)</p>
          <p className="font-semibold text-lg">
            {((lpResult.totalLPBps / 10000) * 100).toFixed(1)}%
          </p>
        </div>
        <div className="bg-white bg-opacity-60 p-2 rounded">
          <p className="text-gray-600">Porsi Bebas</p>
          <p className="font-semibold text-lg">
            {((lpResult.bebasPortieBps / 10000) * 100).toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Status */}
      <div className={`p-2 rounded text-sm ${statusTextColor}`}>
        {lpResult.isValid ? (
          <p>✅ Sesuai dengan KUHPerdata Pasal 914</p>
        ) : (
          <p>
            ❌ LP kurang{" "}
            {((lpResult.kekuranganBps / 10000) * 100).toFixed(1)}%
            {lpResult.kekuranganBps > 0
              ? ` (minimum ${((lpResult.minLPBps / 10000) * 100).toFixed(1)}%)`
              : ""}
          </p>
        )}
      </div>

      {/* Ahli Waris Details */}
      <div className="mt-4 pt-4 border-t border-opacity-30">
        <h4 className="font-medium text-sm mb-2">Alokasi per Ahli Waris</h4>
        <div className="space-y-2 text-sm">
          {ahliWarisList.map((aw, idx) => (
            <div key={idx} className="flex justify-between items-center">
              <span>
                {aw.nama || `Ahli Waris ${idx + 1}`}{" "}
                {aw.isLegitimePortie && (
                  <span className="text-xs bg-blue-200 text-blue-700 px-2 py-1 rounded ml-1">
                    LP
                  </span>
                )}
              </span>
              <span className="font-semibold">
                {((aw.persentaseBps / 10000) * 100).toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Legal Reference */}
      <div className="mt-3 pt-3 border-t border-opacity-30 text-xs text-gray-600">
        <p>{lpResult.pasalReferensi}</p>
      </div>
    </div>
  );
}
