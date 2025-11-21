import { useEffect, useRef } from 'react';

export function ScanInput({ onScanInput, onGenerateReport }) {
  const inputRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Enter" && inputRef.current) {
        const value = inputRef.current.value.trim();
        inputRef.current.value = "";
        if (value) {
          onScanInput(value);
        }
      }
      if (e.key === "F2") {
        onGenerateReport();
      }
    };

    const input = inputRef.current;
    if (input) {
      input.addEventListener("keydown", handleKeyDown);
      return () => input.removeEventListener("keydown", handleKeyDown);
    }
  }, [onScanInput, onGenerateReport]);

  return (
    <input 
      ref={inputRef}
      placeholder="Scan mã SKU và nhấn Enter" 
      autoFocus 
    />
  );
}