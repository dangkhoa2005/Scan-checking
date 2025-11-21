export function DatabaseControls({ onFetchDatabase, isLoading, isFileReady, dbStatus }) {
  return (
    <div>
      <h3 className="section-title">🔄 Database Sync</h3>
      <button 
        disabled={!isFileReady || isLoading}
        onClick={onFetchDatabase}
      >
        {isLoading ? (
          <>
            <div className="spinner">⏳</div>
            Fetching...
          </>
        ) : (
          <>
            <span>🔍</span>
            Fetch from Database
          </>
        )}
      </button>
      {dbStatus.message && (
        <div className={`status-message ${dbStatus.type}`}>
          {dbStatus.message}
        </div>
      )}
    </div>
  );
}