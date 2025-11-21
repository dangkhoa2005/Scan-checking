import { useState } from 'react';
import { fetchDatabaseParts, addPartsToDatabase } from '../services/api.js';
import { normalizeSku } from '../utils/sku.js';

export function useDatabase() {
  const [dbStatus, setDbStatus] = useState({ message: "Chưa có dữ liệu để đối chiếu.", type: "info" });
  const [isLoading, setIsLoading] = useState(false);
  const [availableParts, setAvailableParts] = useState([]);
  const [missingParts, setMissingParts] = useState([]);

  const splitPartsByAvailability = (orderParts, dbParts) => {
    const dbMap = {};
    dbParts.forEach(part => {
      const skuKey = normalizeSku(part.sku);
      if (!skuKey) return;
      dbMap[skuKey] = part;
    });

    const available = [];
    const missing = [];

    orderParts.forEach(part => {
      const skuKey = part._normalizedSku || normalizeSku(part["Product SKU"]);
      if (!skuKey) return;
      const dbMatch = dbMap[skuKey];

      if (dbMatch) {
        available.push({
          sku: skuKey,
          orderDescription: part["Product Description"] || "",
          orderQuantity: part["Quantity"] || "",
          dbName: dbMatch.product_name || "",
          dbQuantity: dbMatch.quantity ?? ""
        });
      } else {
        missing.push({
          sku: skuKey,
          orderDescription: part["Product Description"] || "",
          orderQuantity: part["Quantity"] || ""
        });
      }
    });

    return { available, missing };
  };

  const handleFetchFromDatabase = async (expectedProducts) => {
    if (!expectedProducts.length) {
      setDbStatus({ message: "Vui lòng tải file CSV trước khi fetch.", type: "error" });
      return;
    }

    setDbStatus({ message: "Đang fetch dữ liệu từ database...", type: "info" });
    setIsLoading(true);

    try {
      const databaseParts = await fetchDatabaseParts();
      const { available, missing } = splitPartsByAvailability(expectedProducts, databaseParts);

      setAvailableParts(available);
      setMissingParts(missing);
      setDbStatus({ 
        message: `Hoàn tất đối chiếu: ${available.length} có sẵn, ${missing.length} chưa có.`, 
        type: "success" 
      });
    } catch (error) {
      console.error("Fetch database error", error);
      setDbStatus({ message: "Không thể fetch dữ liệu database. Vui lòng thử lại.", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMissingParts = async () => {
    if (!missingParts.length) {
      setDbStatus({ message: "Không có parts nào để thêm vào database.", type: "info" });
      return;
    }

    setDbStatus({ message: "Đang thêm parts vào database...", type: "info" });
    setIsLoading(true);

    try {
      const partsToAdd = missingParts.map(part => ({
        sku: part.sku,
        product_name: part.orderDescription,
        quantity: parseInt(part.orderQuantity) || 0
      }));

      await addPartsToDatabase(partsToAdd);
      setDbStatus({ 
        message: `Đã thêm thành công ${missingParts.length} parts vào database.`, 
        type: "success" 
      });
      
      setAvailableParts(prev => [...prev, ...missingParts.map(part => ({
        ...part,
        dbName: part.orderDescription,
        dbQuantity: part.orderQuantity
      }))]);
      setMissingParts([]);
      
    } catch (error) {
      console.error("Add parts error", error);
      setDbStatus({ 
        message: `Không thể thêm parts vào database: ${error.message}`, 
        type: "error" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetData = () => {
    setAvailableParts([]);
    setMissingParts([]);
    setDbStatus({ message: "Chưa có dữ liệu để đối chiếu.", type: "info" });
  };

  return {
    dbStatus,
    isLoading,
    availableParts,
    missingParts,
    handleFetchFromDatabase,
    handleAddMissingParts,
    resetData
  };
}