import { PartsTable } from './PartsTable.jsx';

export function ResultsGrid({ availableParts, missingParts }) {
  const availableHeaders = ["Product SKU", "Mô tả đơn", "SL cần", "Tên DB", "SL DB"];
  const missingHeaders = ["Product SKU", "Mô tả đơn", "SL cần"];

  return (
    <div className="results-grid">
      <PartsTable 
        title="✅ Parts đã có trong database"
        count={availableParts.length}
        headers={availableHeaders}
        data={availableParts}
        emptyMessage="Không tìm thấy SKU nào trong database."
      />
      <PartsTable 
        title="⚠️ Parts chưa có trong database"
        count={missingParts.length}
        headers={missingHeaders}
        data={missingParts}
        emptyMessage="Tất cả SKU đều đã tồn tại trong database."
      />
    </div>
  );
}