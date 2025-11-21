export function AddPartsButton({ onAddParts, isLoading, missingPartsCount }) {
  if (missingPartsCount === 0) {
    return null;
  }

  return (
    <button 
      onClick={onAddParts}
      disabled={isLoading}
      className="add-parts-btn"
    >
      {isLoading ? (
        <>
          <div className="spinner">⏳</div>
          Adding to DB...
        </>
      ) : (
        <>
          <span>➕</span>
          Add {missingPartsCount} Parts to DB
        </>
      )}
    </button>
  );
}