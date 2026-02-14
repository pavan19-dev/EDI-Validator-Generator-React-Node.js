import React, { useState, useEffect } from 'react';
import {
  Container, Box, Typography, TextField, Button, Card, CardContent,
  Tabs, Tab, Chip, Alert, Snackbar, IconButton,
  Select, MenuItem, FormControl, InputLabel, Paper, Stepper, Step,
  StepLabel, CircularProgress, Tooltip, Stack, ThemeProvider, createTheme, CssBaseline
} from '@mui/material';
import {
  ContentCopy, Download, Delete, CheckCircle,
  Error, Info, Receipt, LocalShipping,
  SwapHoriz, DataObject, Code
} from '@mui/icons-material';

// Dark theme configuration
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9',
    },
    secondary: {
      main: '#ce93d8',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
  },
  typography: {
    fontFamily: '"Outfit", "Roboto", "Helvetica", "Arial", sans-serif',
    h3: {
      fontWeight: 700,
    },
    h6: {
      fontWeight: 600,
    },
    subtitle1: {
      fontWeight: 400,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
  },
});

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index} style={{ paddingTop: 24 }}>
      {value === index && children}
    </div>
  );
}

function App() {
  const [poInput, setPoInput] = useState('');
  const [inputFormat, setInputFormat] = useState('x12');
  const [vicsVersion, setVicsVersion] = useState('4010');
  const [asnResult, setAsnResult] = useState(null);
  const [invoiceResult, setInvoiceResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [validationStatus, setValidationStatus] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Converter State
  const [converterInput, setConverterInput] = useState('');
  const [converterOutput, setConverterOutput] = useState('');
  const [conversionDirection, setConversionDirection] = useState('x12-to-json'); // or 'json-to-x12'

  const steps = ['Enter Purchase Order', 'Generate ASN', 'Generate Invoice'];

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

    if (!cleanText.startsWith('ISA')) {
      errors.push('X12 must start with ISA segment');
    }

    const segments = cleanText.split('~').filter(s => s.length > 0);
    const segmentTypes = segments.map(s => s.substring(0, 3));

    if (!segmentTypes.includes('ISA')) errors.push('Missing ISA segment');
    if (!segmentTypes.includes('GS*')) errors.push('Missing GS segment');
    if (!segmentTypes.includes('ST*')) errors.push('Missing ST segment');
    if (!segmentTypes.includes('BEG')) errors.push('Missing BEG segment');

    const hasItems = segmentTypes.some(s => s === 'PO1');
    if (!hasItems) warnings.push('No PO1 segments found');

    if (version === '4010') {
      const isa = segments.find(s => s.startsWith('ISA'));
      if (isa && !isa.includes('00401')) warnings.push('ISA version should be 00401 for VICS 4010');
    } else if (version === '5010') {
      const isa = segments.find(s => s.startsWith('ISA'));
      if (isa && !isa.includes('00501')) warnings.push('ISA version should be 00501 for VICS 5010');
    }

    if (!segmentTypes.includes('SE*')) errors.push('Missing SE segment');
    if (!segmentTypes.includes('GE*')) errors.push('Missing GE segment');
    if (!segmentTypes.includes('IEA')) errors.push('Missing IEA segment');
    if (!cleanText.includes('~')) errors.push('Missing segment delimiter (~)');

    return { valid: errors.length === 0, errors, warnings };
  };

  // JSON Validation
  const validateJSONFormat = (text) => {
    const errors = [];
    const warnings = [];

    try {
      const data = JSON.parse(text);

      if (!data.poNumber) errors.push('Missing required field: poNumber');

      if (!data.items || !Array.isArray(data.items)) {
        errors.push('Missing or invalid field: items (must be an array)');
      } else {
        if (data.items.length === 0) warnings.push('Items array is empty');

        data.items.forEach((item, index) => {
          if (!item.sku) errors.push(`Item ${index + 1}: Missing SKU`);
          if (!item.quantity && item.quantity !== 0) errors.push(`Item ${index + 1}: Missing quantity`);
          if (item.quantity <= 0) warnings.push(`Item ${index + 1}: Quantity should be greater than 0`);
          if (!item.price && item.price !== 0) warnings.push(`Item ${index + 1}: Missing price`);
        });
      }

      if (!data.shipTo) warnings.push('Missing shipTo information');
      if (!data.billTo) warnings.push('Missing billTo information');

    } catch (e) {
      errors.push('Invalid JSON format: ' + e.message);
    }

    return { valid: errors.length === 0, errors, warnings };
  };

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
    showSnackbar('File downloaded successfully', 'success');
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      showSnackbar('Copied to clipboard!', 'success');
    }).catch(() => {
      showSnackbar('Failed to copy', 'error');
    });
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
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

  // Generic X12 to JSON Converter
  const convertX12toJSON = (x12) => {
    try {
      const cleanX12 = x12.replace(/[\r\n]+/g, '').trim();
      if (!cleanX12) return [];

      const segments = cleanX12.split('~').filter(s => s.length > 0);
      return segments.map(segment => {
        const elements = segment.split('*');
        const tag = elements.shift(); // Remove first element (tag)
        return { tag, elements };
      });
    } catch (e) {
      throw new Error('Failed to parse X12: ' + e.message);
    }
  };

  // Generic JSON to X12 Converter
  const convertJSONtoX12 = (jsonString) => {
    try {
      const data = JSON.parse(jsonString);
      if (!Array.isArray(data)) throw new Error('Root must be an array of segments');

      return data.map(seg => {
        if (!seg.tag || !Array.isArray(seg.elements)) throw new Error('Invalid segment format');
        return `${seg.tag}*${seg.elements.join('*')}~`;
      }).join('\n');
    } catch (e) {
      throw new Error('Failed to generate X12: ' + e.message);
    }
  };

  const handleConvert = () => {
    if (!converterInput.trim()) {
      showSnackbar('Please enter input data', 'error');
      return;
    }

    try {
      let result;
      if (conversionDirection === 'x12-to-json') {
        const json = convertX12toJSON(converterInput);
        result = JSON.stringify(json, null, 2);
        showSnackbar('Converted X12 to JSON successfully!', 'success');
      } else {
        result = convertJSONtoX12(converterInput);
        showSnackbar('Converted JSON to X12 successfully!', 'success');
      }
      setConverterOutput(result);
    } catch (e) {
      showSnackbar(e.message, 'error');
    }
  };

  const loadConverterSample = () => {
    if (conversionDirection === 'x12-to-json') {
      setConverterInput(sampleX12_4010);
    } else {
      const sample = [
        { "tag": "ISA", "elements": ["00", "          ", "00", "          ", "ZZ", "SENDERID       ", "ZZ", "RECEIVERID     ", "250115", "1200", "U", "00401", "000000001", "0", "T", ">"] },
        { "tag": "GS", "elements": ["PO", "SENDERID", "RECEIVERID", "20250115", "1200", "1", "X", "004010"] },
        { "tag": "ST", "elements": ["850", "0001"] },
        { "tag": "BEG", "elements": ["00", "NE", "PO123456", "", "20250115"] }
      ];
      setConverterInput(JSON.stringify(sample, null, 2));
    }
    showSnackbar('Sample loaded', 'info');
  };

  const handleGenerate856 = async () => {
    if (!poInput.trim()) {
      showSnackbar('Please enter PO data', 'error');
      return;
    }

    if (validationStatus && !validationStatus.valid) {
      showSnackbar('Please fix validation errors before generating ASN', 'error');
      return;
    }

    setLoading(true);

    try {
      let poData;

      if (inputFormat === 'x12') {
        poData = parseX12toJS(poInput);
      } else {
        poData = JSON.parse(poInput);
      }

      const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/generate-856`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ po: poData, vicsVersion }),
      });

      if (!res.ok) throw new Error('Server error');

      const data = await res.json();
      setAsnResult(data);
      setActiveStep(1);
      setTabValue(1);
      showSnackbar('856 ASN generated successfully!', 'success');

    } catch (err) {
      showSnackbar(`Error: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate810 = async () => {
    if (!asnResult) {
      showSnackbar('Please generate 856 ASN first', 'error');
      return;
    }

    setLoading(true);

    try {
      let poData;

      if (inputFormat === 'x12') {
        poData = parseX12toJS(poInput);
      } else {
        poData = JSON.parse(poInput);
      }

      const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/generate-810`, {
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
      setActiveStep(2);
      setTabValue(2);
      showSnackbar('810 Invoice generated successfully!', 'success');

    } catch (err) {
      showSnackbar(`Error: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const clearAll = () => {
    setPoInput('');
    setAsnResult(null);
    setInvoiceResult(null);
    setValidationStatus(null);
    setActiveStep(0);
    setTabValue(0);
    showSnackbar('All data cleared', 'info');
  };

  const loadSampleData = () => {
    if (inputFormat === 'x12') {
      setPoInput(vicsVersion === '4010' ? sampleX12_4010 : sampleX12_5010);
    } else {
      setPoInput(sampleJSON);
    }
    showSnackbar('Sample data loaded', 'info');
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: 4 }}>
        <Container maxWidth="lg">
          {/* Header */}
          <Paper elevation={0} sx={{ p: 4, mb: 3, bgcolor: 'background.paper', borderRadius: 2 }}>
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
              EDI Validator and Generator
            </Typography>
            <Typography variant="subtitle1" sx={{ color: 'text.secondary' }}>
              Advanced Ship Notice (856) & Invoice (810) Generator
            </Typography>
          </Paper>

          {/* Stepper */}
          <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
            <Stepper activeStep={activeStep}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </Paper>

          {/* Format Selection */}
          <Card sx={{ mb: 3, borderRadius: 2 }} elevation={0}>
            <CardContent>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                <FormControl sx={{ minWidth: 200 }}>
                  <InputLabel>Input Format</InputLabel>
                  <Select value={inputFormat} onChange={(e) => setInputFormat(e.target.value)} label="Input Format">
                    <MenuItem value="x12">X12 EDI</MenuItem>
                    <MenuItem value="json">JSON</MenuItem>
                  </Select>
                </FormControl>

                <FormControl sx={{ minWidth: 200 }}>
                  <InputLabel>VICS Version</InputLabel>
                  <Select value={vicsVersion} onChange={(e) => setVicsVersion(e.target.value)} label="VICS Version">
                    <MenuItem value="4010">VICS 4010</MenuItem>
                    <MenuItem value="5010">VICS 5010</MenuItem>
                  </Select>
                </FormControl>

                <Box sx={{ flexGrow: 1 }} />

                <Button variant="outlined" onClick={loadSampleData} startIcon={<Info />}>
                  Load Sample
                </Button>
                <Button variant="outlined" color="error" onClick={clearAll} startIcon={<Delete />}>
                  Clear All
                </Button>
              </Stack>
            </CardContent>
          </Card>

          {/* Validation Status */}
          {validationStatus && (
            <Alert
              severity={validationStatus.valid ? 'success' : 'error'}
              sx={{ mb: 3, borderRadius: 2 }}
              icon={validationStatus.valid ? <CheckCircle /> : <Error />}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                {validationStatus.valid ? `Valid ${inputFormat.toUpperCase()} Format` : 'Validation Failed'}
              </Typography>

              {validationStatus.errors.length > 0 && (
                <Box sx={{ mb: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>Errors:</Typography>
                  {validationStatus.errors.map((err, i) => (
                    <Chip key={i} label={err} size="small" color="error" sx={{ m: 0.5 }} />
                  ))}
                </Box>
              )}

              {validationStatus.warnings.length > 0 && (
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>Warnings:</Typography>
                  {validationStatus.warnings.map((warn, i) => (
                    <Chip key={i} label={warn} size="small" color="warning" sx={{ m: 0.5 }} />
                  ))}
                </Box>
              )}
            </Alert>
          )}

          {/* Tabs */}
          <Paper elevation={0} sx={{ borderRadius: 2 }}>
            <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} variant="fullWidth">
              <Tab label="Input" />
              <Tab label="ASN Result" disabled={!asnResult} />
              <Tab label="Invoice Result" disabled={!invoiceResult} />
              <Tab label="Converter Tool" icon={<SwapHoriz />} iconPosition="start" />
            </Tabs>

            {/* Input Tab */}
            <TabPanel value={tabValue} index={0}>
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  850 Purchase Order ({inputFormat === 'x12' ? 'X12 EDI' : 'JSON'})
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={15}
                  value={poInput}
                  onChange={(e) => setPoInput(e.target.value)}
                  placeholder={`Paste your 850 Purchase Order in ${inputFormat.toUpperCase()} format here...`}
                  variant="outlined"
                  sx={{
                    mb: 2,
                    '& .MuiInputBase-root': {
                      bgcolor: 'background.default',
                      fontFamily: '"Roboto Mono", "Courier New", monospace',
                      fontSize: '0.9rem',
                    },
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.12)',
                    }
                  }}
                />
                <Stack direction="row" spacing={2}>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={handleGenerate856}
                    disabled={loading || (validationStatus && !validationStatus.valid)}
                    startIcon={loading ? <CircularProgress size={20} /> : <LocalShipping />}
                    sx={{ flex: 1 }}
                  >
                    {loading ? 'Processing...' : 'Generate 856 ASN'}
                  </Button>
                  <Button
                    variant="contained"
                    size="large"
                    color="secondary"
                    onClick={handleGenerate810}
                    disabled={loading || !asnResult}
                    startIcon={loading ? <CircularProgress size={20} /> : <Receipt />}
                    sx={{ flex: 1 }}
                  >
                    {loading ? 'Processing...' : 'Generate 810 Invoice'}
                  </Button>
                </Stack>
              </Box>
            </TabPanel>

            {/* ASN Result Tab */}
            <TabPanel value={tabValue} index={1}>
              {asnResult && (
                <Box sx={{ p: 3 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {asnResult.title} Created
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      <Tooltip title="Copy to clipboard">
                        <IconButton onClick={() => copyToClipboard(asnResult.x12)} color="primary">
                          <ContentCopy />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Download file">
                        <IconButton onClick={() => downloadFile(asnResult.x12, `856_ASN_${asnResult.json.asnNumber}.edi`)} color="primary">
                          <Download />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Stack>
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default', fontFamily: '"Roboto Mono", "Courier New", monospace', fontSize: '0.9rem', overflow: 'auto', borderRadius: 1 }}>
                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{asnResult.x12}</pre>
                  </Paper>
                </Box>
              )}
            </TabPanel>

            {/* Invoice Result Tab */}
            <TabPanel value={tabValue} index={2}>
              {invoiceResult && (
                <Box sx={{ p: 3 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {invoiceResult.title} Created
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      <Tooltip title="Copy to clipboard">
                        <IconButton onClick={() => copyToClipboard(invoiceResult.x12)} color="primary">
                          <ContentCopy />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Download file">
                        <IconButton onClick={() => downloadFile(invoiceResult.x12, `810_Invoice_${invoiceResult.json.invoiceNumber}.edi`)} color="primary">
                          <Download />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Stack>
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default', fontFamily: '"Roboto Mono", "Courier New", monospace', fontSize: '0.9rem', overflow: 'auto', borderRadius: 1 }}>
                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{invoiceResult.x12}</pre>
                  </Paper>
                </Box>
              )}
            </TabPanel>

            {/* Converter Tab */}
            <TabPanel value={tabValue} index={3}>
              <Box sx={{ p: 3 }}>
                <Stack direction="row" spacing={2} justifyContent="center" sx={{ mb: 3 }}>
                  <Chip
                    icon={<Code />}
                    label="X12"
                    color={conversionDirection === 'x12-to-json' ? 'primary' : 'default'}
                    onClick={() => setConversionDirection('x12-to-json')}
                    sx={{ cursor: 'pointer', px: 2 }}
                  />
                  <IconButton color="primary" onClick={() => {
                    setConversionDirection(prev => prev === 'x12-to-json' ? 'json-to-x12' : 'x12-to-json');
                    setConverterInput(converterOutput);
                    setConverterOutput(converterInput);
                  }}>
                    <SwapHoriz />
                  </IconButton>
                  <Chip
                    icon={<DataObject />}
                    label="JSON"
                    color={conversionDirection === 'json-to-x12' ? 'primary' : 'default'}
                    onClick={() => setConversionDirection('json-to-x12')}
                    sx={{ cursor: 'pointer', px: 2 }}
                  />
                </Stack>

                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                  {/* Input Side */}
                  <Box sx={{ flex: 1 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                      <Typography variant="subtitle2" color="text.secondary">Input ({conversionDirection === 'x12-to-json' ? 'X12' : 'JSON'})</Typography>
                      <Stack direction="row" spacing={1}>
                        <Button size="small" onClick={loadConverterSample} startIcon={<Info />}>Sample</Button>
                        <Button size="small" color="error" onClick={() => setConverterInput('')} startIcon={<Delete />}>Clear</Button>
                      </Stack>
                    </Stack>
                    <TextField
                      fullWidth
                      multiline
                      rows={15}
                      value={converterInput}
                      onChange={(e) => setConverterInput(e.target.value)}
                      placeholder={conversionDirection === 'x12-to-json' ? "Paste X12 here..." : "Paste JSON here..."}
                      variant="outlined"
                      sx={{
                        '& .MuiInputBase-root': {
                          bgcolor: 'background.default',
                          fontFamily: '"Roboto Mono", "Courier New", monospace',
                          fontSize: '0.85rem',
                        }
                      }}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <Button
                      variant="contained"
                      onClick={handleConvert}
                      sx={{ minWidth: 40, height: 40, borderRadius: '50%' }}
                    >
                      <SwapHoriz />
                    </Button>
                  </Box>

                  {/* Output Side */}
                  <Box sx={{ flex: 1 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                      <Typography variant="subtitle2" color="text.secondary">Output ({conversionDirection === 'x12-to-json' ? 'JSON' : 'X12'})</Typography>
                      <Tooltip title="Copy">
                        <IconButton size="small" onClick={() => copyToClipboard(converterOutput)}>
                          <ContentCopy fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                    <TextField
                      fullWidth
                      multiline
                      rows={15}
                      value={converterOutput}
                      InputProps={{ readOnly: true }}
                      variant="outlined"
                      sx={{
                        '& .MuiInputBase-root': {
                          bgcolor: 'background.default',
                          fontFamily: '"Roboto Mono", "Courier New", monospace',
                          fontSize: '0.85rem',
                        }
                      }}
                    />
                  </Box>
                </Stack>
              </Box>
            </TabPanel>
          </Paper>

          {/* Footer */}
          <Box sx={{ mt: 4, textAlign: 'center', color: 'text.secondary' }}>
            <Typography variant="body2">
              Built with React & Material-UI | VICS 4010/5010 Compliant | Real-time Validation
            </Typography>
          </Box>

          {/* Snackbar */}
          <Snackbar
            open={snackbar.open}
            autoHideDuration={4000}
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          >
            <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
              {snackbar.message}
            </Alert>
          </Snackbar>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;
