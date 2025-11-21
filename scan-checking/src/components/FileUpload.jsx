export function FileUpload({ onFileChange, fileStatus }) {
  return (
    <div>
      <h3>📥 Tải lên file CSV sản phẩm</h3>
      <input 
        type="file" 
        accept=".csv" 
        onChange={onFileChange}
      />
      <pre>{fileStatus}</pre>
    </div>
  );
}