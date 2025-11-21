import { PartsTable } from './PartsTable.jsx';
import { AddPartsButton } from './AddPartsButton.jsx';

export function ResultsGrid({ availableParts, missingParts, onAddParts, isLoading }) {
  const availableHeaders = ["SKU", "Description", "Required", "DB Name", "DB Stock"];
  const missingHeaders = ["SKU", "Description", "Required"];

  return (
    <div className="results-grid">
      <PartsTable 
        title="✅ Available in Database"
        count={availableParts.length}
        headers={availableHeaders}
        data={availableParts}
        emptyMessage="No SKUs found in database."
        variant="success"
      />
      <div className="result-panel">
        <h3>⚠️ Missing from Database (<span>{missingParts.length}</span>)</h3>
        <AddPartsButton 
          onAddParts={onAddParts}
          isLoading={isLoading}
          missingPartsCount={missingParts.length}
        />
        <table>
          <thead>
            <tr>
              {missingHeaders.map((header, index) => (
                <th key={index}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {!missingParts || missingParts.length === 0 ? (
              <tr>
                <td colSpan={missingHeaders.length} className="empty-state">
                  🎉 All SKUs exist in database!
                </td>
              </tr>
            ) : (
              missingParts.map((row, index) => (
                <tr key={index}>
                  <td>{row.sku}</td>
                  <td>{row.orderDescription}</td>
                  <td>{row.orderQuantity}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}