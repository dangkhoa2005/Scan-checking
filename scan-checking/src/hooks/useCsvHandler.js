import { useState } from 'react';
import Papa from 'papaparse';
import { normalizeSku } from '../utils/sku.js';
import { EXCLUDE_KEYWORDS } from '../utils/constants.js';

export function useCsvHandler() {
  const [expectedProducts, setExpectedProducts] = useState([]);
  const [fileStatus, setFileStatus] = useState('');
  const [isFileReady, setIsFileReady] = useState(false);

  const handleCsvUpload = (file, onComplete) => {
    if (!file) {
      setExpectedProducts([]);
      setFileStatus("❗ Vui lòng chọn file CSV để tiếp tục.");
      setIsFileReady(false);
      return;
    }

    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      complete: function (results) {
        let headerRowIndex = -1;
        for (let i = 0; i < results.data.length; i++) {
          const row = results.data[i];
          if (row.some(cell => cell && cell.toString().includes("Product SKU"))) {
            headerRowIndex = i;
            break;
          }
        }

        if (headerRowIndex === -1) {
          setFileStatus(`❌ Không tìm thấy header "Product SKU" trong file.`);
          setIsFileReady(false);
          return;
        }

        const headers = results.data[headerRowIndex];
        const dataRows = results.data.slice(headerRowIndex + 1);

        const products = dataRows.map(row => {
          const obj = {};
          headers.forEach((header, index) => {
            if (header && row[index] !== undefined) {
              obj[header] = row[index];
            }
          });
          return obj;
        }).filter(obj => {
          const sku = obj["Product SKU"];
          if (!sku) return false;
          const skuStr = sku.toString().toLowerCase();
          return !EXCLUDE_KEYWORDS.some(keyword => skuStr.includes(keyword));
        }).map(product => {
          const normalizedSku = normalizeSku(product["Product SKU"]);
          return normalizedSku ? { ...product, _normalizedSku: normalizedSku } : null;
        }).filter(Boolean);

        if (!products.length) {
          setFileStatus(`❗ Không tìm thấy dòng sản phẩm hợp lệ trong file ${file.name}.`);
          setIsFileReady(false);
          return;
        }

        setFileStatus(`✅ Đã tải file ${file.name} với ${products.length} dòng.`);
        setExpectedProducts(products);
        setIsFileReady(true);
        console.log("🔍 Dữ liệu từ CSV:", products);
        
        if (onComplete) onComplete();
      }
    });
  };

  return {
    expectedProducts,
    fileStatus,
    isFileReady,
    handleCsvUpload
  };
}