import { ScanInput } from './components/ScanInput.jsx';
import { LogOutput } from './components/LogOutput.jsx';
import { FileUpload } from './components/FileUpload.jsx';
import { DatabaseControls } from './components/DatabaseControls.jsx';
import { ResultsGrid } from './components/ResultsGrid.jsx';
import { useCsvHandler } from './hooks/useCsvHandler.js';
import { useDatabase } from './hooks/useDatabase.js';
import { useScanner } from './hooks/useScanner.js';
import './App.css'

function App() {
  const { expectedProducts, fileStatus, isFileReady, handleCsvUpload } = useCsvHandler();
  const { dbStatus, isLoading, availableParts, missingParts, handleFetchFromDatabase, handleAddMissingParts, resetData } = useDatabase();
  const { logs, handleScanInput, generateReport } = useScanner(expectedProducts);

  const onFileChange = (event) => {
    const file = event.target.files[0];
    resetData();
    handleCsvUpload(file);
  };

  const onFetchDatabase = () => {
    handleFetchFromDatabase(expectedProducts);
  };

  const onAddParts = () => {
    handleAddMissingParts();
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">📦 Mobile Sentrix Order</h1>
        <p className="app-subtitle">Warehouse Management & Inventory Checker</p>
      </header>

      <main className="main-content">
        <div className="control-panel">
          <div className="section">
            <h3 className="section-title">🔍 SKU Scanner</h3>
            <ScanInput 
              onScanInput={handleScanInput}
              onGenerateReport={generateReport}
            />
            <LogOutput logs={logs} />
          </div>
          
          <div className="section">
            <FileUpload 
              onFileChange={onFileChange}
              fileStatus={fileStatus}
            />
          </div>
          
          <div className="section">
            <DatabaseControls 
              onFetchDatabase={onFetchDatabase}
              isLoading={isLoading}
              isFileReady={isFileReady}
              dbStatus={dbStatus}
            />
          </div>
        </div>

        <div className="results-section">
          <div className="results-header">
            <h2 className="results-title">📊 Inventory Analysis</h2>
          </div>
          <ResultsGrid 
            availableParts={availableParts}
            missingParts={missingParts}
            onAddParts={onAddParts}
            isLoading={isLoading}
          />
        </div>
      </main>
    </div>
  )
}

export default App
