export function DatabaseControls({ onFetchDatabase, isLoading, isFileReady, dbStatus }) {
  return (
    <div>
      <button 
        disabled={!isFileReady || isLoading}
        onClick={onFetchDatabase}
      >
        Fetch từ database
      </button>
      <div className={dbStatus.type}>
        {dbStatus.message}
      </div>
    </div>
  );
}