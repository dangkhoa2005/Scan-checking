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
  const { dbStatus, isLoading, availableParts, missingParts, handleFetchFromDatabase, resetData } = useDatabase();
  const { logs, handleScanInput, generateReport } = useScanner(expectedProducts);

  const onFileChange = (event) => {
    const file = event.target.files[0];
    resetData();
    handleCsvUpload(file);
  };

  const onFetchDatabase = () => {
    handleFetchFromDatabase(expectedProducts);
  };

  return (
    <div>
      <h2>📦 Mobile Sentrix Order</h2>
      <ScanInput 
        onScanInput={handleScanInput}
        onGenerateReport={generateReport}
      />
      <LogOutput logs={logs} />
      
      <FileUpload 
        onFileChange={onFileChange}
        fileStatus={fileStatus}
      />
      
      <DatabaseControls 
        onFetchDatabase={onFetchDatabase}
        isLoading={isLoading}
        isFileReady={isFileReady}
        dbStatus={dbStatus}
      />
      
      <ResultsGrid 
        availableParts={availableParts}
        missingParts={missingParts}
      />
    </div>
  )
}

export default App
