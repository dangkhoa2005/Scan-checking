export function FileUpload({ onFileChange, fileStatus }) {
  return (
    <div>
      <h3 className="section-title">📥 Upload CSV File</h3>
      <input 
        type="file" 
        accept=".csv" 
        onChange={onFileChange}
      />
      {fileStatus && <pre>{fileStatus}</pre>}
    </div>
  );
}