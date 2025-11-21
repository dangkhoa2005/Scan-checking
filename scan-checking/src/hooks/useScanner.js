import { useState, useEffect } from 'react';
import { normalizeSku } from '../utils/sku.js';

export function useScanner(expectedProducts) {
  const [scannedCounts, setScannedCounts] = useState({});
  const [logs, setLogs] = useState('');

  useEffect(() => {
    const initialCounts = {};
    expectedProducts.forEach(p => {
      const skuKey = p._normalizedSku || normalizeSku(p["Product SKU"]);
      if (skuKey) {
        initialCounts[skuKey] = 0;
      }
    });
    setScannedCounts(initialCounts);
  }, [expectedProducts]);

  const handleScanInput = (rawSku) => {
    const normalizedSku = normalizeSku(rawSku);
    if (!normalizedSku) {
      setLogs(prev => prev + `⚠️ SKU không hợp lệ: ${rawSku}\n`);
      return;
    }

    const expectedMap = {};
    expectedProducts.forEach(p => {
      const skuKey = p._normalizedSku || normalizeSku(p["Product SKU"]);
      if (skuKey) {
        expectedMap[skuKey] = p;
      }
    });

    if (expectedMap[normalizedSku]) {
      setScannedCounts(prev => ({
        ...prev,
        [normalizedSku]: (prev[normalizedSku] || 0) + 1
      }));
      
      const expectedQty = parseFloat(expectedMap[normalizedSku]["Quantity"]);
      const currentQty = (scannedCounts[normalizedSku] || 0) + 1;
      setLogs(prev => prev + `✔️ ${expectedMap[normalizedSku]["Product Description"]} (${currentQty}/${expectedQty})\n`);
    } else {
      setLogs(prev => prev + `❌ SKU does not exist: ${rawSku}\n`);
    }
  };

  const generateReport = () => {
    const expectedMap = {};
    expectedProducts.forEach(p => {
      const skuKey = p._normalizedSku || normalizeSku(p["Product SKU"]);
      if (skuKey) {
        expectedMap[skuKey] = p;
      }
    });

    let report = `\n📊 Check list:\n`;
    for (const sku in expectedMap) {
      const expectedQty = parseFloat(expectedMap[sku]["Quantity"]);
      const scannedQty = scannedCounts[sku] || 0;
      const status = scannedQty >= expectedQty ? "✅" : "❌";
      report += `${status} ${expectedMap[sku]["Product Description"]}: ${scannedQty}/${expectedQty}\n`;
    }
    setLogs(prev => prev + report);
  };

  return {
    scannedCounts,
    logs,
    handleScanInput,
    generateReport
  };
}