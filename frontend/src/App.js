import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [poInput, setPoInput] = useState('');
  const [inputFormat, setInputFormat] = useState('x12'); // 'x12' or 'json'
  const [vicsVersion, setVicsVersion] = useState('4010'); // '4010' or '5010'
  const [asnResult, setAsnResult] = useState(null);
  const [invoiceResult, setInvoiceResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationStatus, setValidationStatus] = useState(null);

  // Real-time validation
  useEffect(() => {
    if (!poInput.trim()) {
      setValidationStatus(null);
      return;
    }

    const validateInput = () => {
      try {
        if (inputFormat === 'x12') {
          const validation = validateX12Format(poInput, vicsVersion);
          setValidationStatus(validation);
        } else {
          const validation = validateJSONFormat(poInput);
          setValidationStatus(validation);
        }
      } catch (e) {
        setValidationStatus({
          valid: false,
          errors: [e.message],
          warnings: []
        });
      }
    };

    const debounce = setTimeout(validateInput, 500);
    return () => clearTimeout(debounce);
  }, [poInput, inputFormat, vicsVersion]);

  // X12 Validation
  const validateX12Format = (text, version) => {
    const errors = [];
    const warnings = [];
    
    const cleanText = text.replace(/[\r\n]+/g, '').trim();
    
    // Check if it starts with ISA
    if (!cleanText.startsWith('ISA')) {
      errors.push('X12 must start with ISA segment');
    }
    
    // Check for required segments
    const segments = cleanText.split('~').filter(s => s.length > 0);
    const segmentTypes = segments.map(s => s.substring(0, 3));
    
    // ISA check
    if (!segmentTypes.includes('ISA')) {
      errors.push('Missing ISA (Interchange Control Header) segment');
    }
    
    // GS check
    if (!segmentTypes.includes('GS*')) {
      errors.push('Missing GS (Functional Group Header) segment');
    }
    
    // ST check
    if (!segmentTypes.includes('ST*')) {
      errors.push('Missing ST (Transaction Set Header) segment');
    }
    
    // BEG check for 850 PO
    if (!segmentTypes.includes('BEG')) {
      errors.push('Missing BEG (Beginning Segment for Purchase Order) segment');
    }
    
    // Check for PO1 items
    const hasItems = segmentTypes.some(s => s === 'PO1');
    if (!hasItems) {
      warnings.push('No PO1 (Purchase Order Line Item) segments found');
    }
    
    // Version-specific validation
    if (version === '4010') {
      const isa = segments.find(s => s.startsWith('ISA'));
      if (isa && !isa.includes('00401')) {
        warnings.push('ISA version should be 00401 for VICS 4010');
      }
      
      const gs = segments.find(s => s.startsWith('GS'));
      if (gs && !gs.includes('004010')) {
        warnings.push('GS version should be 004010 for VICS 4010');
      }
    } else if (version === '5010') {
      const isa = segments.find(s => s.startsWith('ISA'));
      if (isa && !isa.includes('00501')) {
        warnings.push('ISA version should be 00501 for VICS 5010');
      }
      
      const gs = segments.find(s => s.startsWith('GS'));
      if (gs && !gs.includes('005010')) {
        warnings.push('GS version should be 005010 for VICS 5010');
      }
    }
    
    // Check for proper termination
    if (!segmentTypes.includes('SE*')) {
      errors.push('Missing SE (Transaction Set Trailer) segment');
    }
    if (!segmentTypes.includes('GE*')) {
      errors.push('Missing GE (Functional Group Trailer) segment');
    }
    if (!segmentTypes.includes('IEA')) {
      errors.push('Missing IEA (Interchange Control Trailer) segment');
    }
    
    // Check segment delimiter
    if (!cleanText.includes('~')) {
      errors.push('Missing segment delimiter (~)');
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  };

  // JSON Validation
  const validateJSONFormat = (text) => {
    const errors = [];
    const warnings = [];
    
    try {
      const data = JSON.parse(text);
      
      // Check required fields
      if (!data.poNumber) {
        errors.push('Missing required field: poNumber');
      }
      
      if (!data.items || !Array.isArray(data.items)) {
        errors.push('Missing or invalid field: items (must be an array)');
      } else {
        if (data.items.length === 0) {
          warnings.push('Items array is empty');
        }
        
        // Validate each item
        data.items.forEach((item, index) => {
          if (!item.sku) {
            errors.push(`Item ${index + 1}: Missing SKU`);
          }
          if (!item.quantity && item.quantity !== 0) {
            errors.push(`Item ${index + 1}: Missing quantity`);
          }
          if (item.quantity <= 0) {
            warnings.push(`Item ${index + 1}: Quantity should be greater than 0`);
          }
          if (!item.price && item.price !== 0) {
            warnings.push(`Item ${index + 1}: Missing price (required for invoice generation)`);
          }
        });
      }
      
      // Check optional but recommended fields
      if (!data.shipTo) {
        warnings.push('Missing shipTo information (will use default)');
      }
      
      if (!data.billTo) {
        warnings.push('Missing billTo information (will use shipTo as default)');
      }
      
    } catch (e) {
      errors.push('Invalid JSON format: ' + e.message);
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  };

  // Sample data
  const sampleX12_4010 = `ISA*00*          *00*          *ZZ*SENDERID       *ZZ*RECEIVERID     *250115*1200*U*00401*000000001*0*T*>~
GS*PO*SENDERID*RECEIVERID*20250115*1200*1*X*004010~
ST*850*0001~
BEG*00*NE*PO123456**20250115~
N1*ST*BASELWAY PLAZA*92*1000~
PO1*1*100*EA*25.50**VC*SKU12345~
PO1*2*50*EA*42.00**VC*SKU67890~
CTT*2~
SE*8*0001~
GE*1*1~
IEA*1*000000001~`;

  const sampleX12_5010 = `ISA*00*          *00*          *ZZ*SENDERID       *ZZ*RECEIVERID     *250115*1200*U*00501*000000001*0*T*>~
GS*PO*SENDERID*RECEIVERID*20250115*1200*1*X*005010~
ST*850*0001~
BEG*00*NE*PO123456**20250115~
N1*ST*BASELWAY PLAZA*92*1000~
PO1*1*100*EA*25.50**VC*SKU12345~
PO1*2*50*EA*42.00**VC*SKU67890~
CTT*2~
SE*8*0001~
GE*1*1~
IEA*1*000000001~`;

  const sampleJSON = `{
  "poNumber": "PO123456",
  "shipTo": {
    "name": "BASELWAY PLAZA",
    "id": "1000"
  },
  "billTo": {
    "name": "BASELWAY PLAZA",
    "id": "1000"
  },
  "items": [
    {
      "sku": "SKU12345",
      "quantity": 100,
      "price": 25.50
    },
    {
      "sku": "SKU67890",
      "quantity": 50,
      "price": 42.00
    }
  ]
}`;

  const downloadFile = (content, filename) => {
    const element = document.createElement("a");
    const file = new Blob([content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('✅ Copied to clipboard!');
    }).catch(() => {
      alert('❌ Failed to copy');
    });
  };

  const parseX12toJS = (ediText) => {
    try {
      const cleanEdi = ediText.replace(/[\r\n]+/g, '').trim();
      const segments = cleanEdi.split('~').filter(s => s.length > 0);
      const beg = segments.find(s => s.startsWith('BEG'))?.split('*');
      const n1st = segments.find(s => s.startsWith('N1*ST'))?.split('*');
      const n1bt = segments.find(s => s.startsWith('N1*BT'))?.split('*');
      
      const items = [];
      segments.forEach(seg => {
        if (seg.startsWith('PO1')) {
          const p = seg.split('*');
          items.push({
            sku: p[7] || p[9] || "SKU-ERR",
            quantity: parseInt(p[2]) || 0,
            price: parseFloat(p[4]) || 0
          });
        }
      });

      return { 
        poNumber: beg ? beg[3] : "ERR",
        shipTo: n1st ? { name: n1st[2], id: n1st[4] } : { name: "RETAIL DC", id: "0001" },
        billTo: n1bt ? { name: n1bt[2], id: n1bt[4] } : null,
        items: items 
      };
    } catch (e) { 
      throw new Error('Invalid X12 format: ' + e.message);
    }
  };

  const handleGenerate856 = async () => {
    if (!poInput.trim()) {
      setError('❌ Please enter PO data');
      return;
    }

    if (validationStatus && !validationStatus.valid) {
      setError('❌ Please fix validation errors before generating ASN');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      let poData;
      
      if (inputFormat === 'x12') {
        poData = parseX12toJS(poInput);
      } else {
        poData = JSON.parse(poInput);
      }

      const res = await fetch('http://localhost:5000/api/generate-856', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ po: poData, vicsVersion }),
      });
      
      if (!res.ok) throw new Error('Server error');
      
      const data = await res.json();
      setAsnResult(data);
      
    } catch (err) { 
      setError(`❌ Error: ${err.message}`);
    } finally { 
      setLoading(false); 
    }
  };

  const handleGenerate810 = async () => {
    if (!asnResult) {
      setError('❌ Please generate 856 ASN first');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      let poData;
      
      if (inputFormat === 'x12') {
        poData = parseX12toJS(poInput);
      } else {
        poData = JSON.parse(poInput);
      }

      const res = await fetch('http://localhost:5000/api/generate-810', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          asn: asnResult.json, 
          po: poData,
          vicsVersion 
        }),
      });
      
      if (!res.ok) throw new Error('Server error');
      
      const data = await res.json();
      setInvoiceResult(data);
      
    } catch (err) { 
      setError(`❌ Error: ${err.message}`);
    } finally { 
      setLoading(false); 
    }
  };

  const clearAll = () => {
    setPoInput('');
    setAsnResult(null);
    setInvoiceResult(null);
    setError('');
    setValidationStatus(null);
  };

  const loadSampleData = () => {
    if (inputFormat === 'x12') {
      setPoInput(vicsVersion === '4010' ? sampleX12_4010 : sampleX12_5010);
    } else {
      setPoInput(sampleJSON);
    }
    setError('');
  };

  return (
    <div className="App">
      <div className="container">
        {/* Header */}
        <header className="header">
          <div className="header-content">
            <h1 className="title">
              <span className="icon">💎</span>
              VICS EDI Suite
            </h1>
            <p className="subtitle">Advanced Ship Notice (856) & Invoice (810) Generator</p>
          </div>
        </header>

        {/* Format Selection Bar */}
        <div className="format-selection-bar">
          <div className="format-group">
            <label className="format-label">Input Format:</label>
            <select 
              value={inputFormat} 
              onChange={(e) => setInputFormat(e.target.value)}
              className="format-select"
            >
              <option value="x12">X12 EDI</option>
              <option value="json">JSON</option>
            </select>
          </div>

          <div className="format-group">
            <label className="format-label">VICS Version:</label>
            <select 
              value={vicsVersion} 
              onChange={(e) => setVicsVersion(e.target.value)}
              className="format-select"
            >
              <option value="4010">VICS 4010</option>
              <option value="5010">VICS 5010</option>
            </select>
          </div>

          <div className="format-actions">
            <button onClick={loadSampleData} className="btn btn-sample">
              📋 Load Sample
            </button>
            <button onClick={clearAll} className="btn btn-clear">
              🗑️ Clear All
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="error-banner">
            {error}
          </div>
        )}

        {/* Validation Status */}
        {validationStatus && (
          <div className={`validation-panel ${validationStatus.valid ? 'valid' : 'invalid'}`}>
            <div className="validation-header">
              {validationStatus.valid ? (
                <span className="validation-icon">✅ Valid {inputFormat.toUpperCase()} Format</span>
              ) : (
                <span className="validation-icon">❌ Validation Failed</span>
              )}
            </div>
            
            {validationStatus.errors.length > 0 && (
              <div className="validation-errors">
                <strong>Errors:</strong>
                <ul>
                  {validationStatus.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {validationStatus.warnings.length > 0 && (
              <div className="validation-warnings">
                <strong>Warnings:</strong>
                <ul>
                  {validationStatus.warnings.map((warn, i) => (
                    <li key={i}>{warn}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Single Input Area */}
        <div className="single-input-section">
          <div className="input-header">
            <label className="input-label">
              850 Purchase Order ({inputFormat === 'x12' ? 'X12 EDI' : 'JSON'})
            </label>
            <span className="input-hint">
              Paste your 850 PO in {inputFormat.toUpperCase()} format
            </span>
          </div>
          <textarea 
            rows="15" 
            value={poInput} 
            onChange={(e) => setPoInput(e.target.value)} 
            placeholder={`Paste your 850 Purchase Order in ${inputFormat.toUpperCase()} format here...`}
            className="input-textarea large"
          />
        </div>

        {/* Generation Buttons */}
        <div className="button-grid">
          <button 
            onClick={handleGenerate856} 
            disabled={loading || (validationStatus && !validationStatus.valid)}
            className="btn btn-primary btn-asn"
          >
            {loading ? '⏳ Processing...' : '📦 Generate 856 ASN'}
          </button>
          <button 
            onClick={handleGenerate810} 
            disabled={loading || !asnResult}
            className="btn btn-primary btn-invoice"
          >
            {loading ? '⏳ Processing...' : '💰 Generate 810 Invoice'}
          </button>
        </div>

        {/* ASN Result */}
        {asnResult && (
          <div className="result-container">
            <div className="result-header">
              <h2 className="result-title">
                ✅ {asnResult.title} Created
              </h2>
              <div className="result-actions">
                <button 
                  onClick={() => copyToClipboard(asnResult.x12)} 
                  className="btn btn-secondary"
                >
                  📋 Copy
                </button>
                <button 
                  onClick={() => downloadFile(asnResult.x12, `856_ASN_${asnResult.json.asnNumber}.edi`)} 
                  className="btn btn-download"
                >
                  ⬇️ Download
                </button>
              </div>
            </div>
            <pre className="result-output">{asnResult.x12}</pre>
          </div>
        )}

        {/* Invoice Result */}
        {invoiceResult && (
          <div className="result-container">
            <div className="result-header">
              <h2 className="result-title">
                ✅ {invoiceResult.title} Created
              </h2>
              <div className="result-actions">
                <button 
                  onClick={() => copyToClipboard(invoiceResult.x12)} 
                  className="btn btn-secondary"
                >
                  📋 Copy
                </button>
                <button 
                  onClick={() => downloadFile(invoiceResult.x12, `810_Invoice_${invoiceResult.json.invoiceNumber}.edi`)} 
                  className="btn btn-download"
                >
                  ⬇️ Download
                </button>
              </div>
            </div>
            <pre className="result-output">{invoiceResult.x12}</pre>
          </div>
        )}

        {/* Footer */}
        <footer className="footer">
          <p>Built with React & Node.js | VICS 4010/5010 Compliant | Real-time Validation</p>
        </footer>
      </div>
    </div>
  );
}

export default App;