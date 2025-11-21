export function PartsTable({ title, count, headers, data, emptyMessage }) {
  const renderTableData = () => {
    if (!data || data.length === 0) {
      return (
        <tr className="empty-state">
          <td colSpan={headers.length}>{emptyMessage}</td>
        </tr>
      );
    }

    return data.map((row, index) => (
      <tr key={index}>
        <td>{row.sku}</td>
        <td>{row.orderDescription}</td>
        <td>{row.orderQuantity}</td>
        {row.dbName !== undefined && <td>{row.dbName}</td>}
        {row.dbQuantity !== undefined && <td>{row.dbQuantity}</td>}
      </tr>
    ));
  };

  return (
    <div className="result-panel">
      <h3>{title} (<span>{count}</span>)</h3>
      <table>
        <thead>
          <tr>
            {headers.map((header, index) => (
              <th key={index}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {renderTableData()}
        </tbody>
      </table>
    </div>
  );
}