const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

const getEDIDate = () => new Date().toISOString().slice(2, 10).replace(/-/g, '');
const getEDITime = () => new Date().getHours().toString().padStart(2, '0') + new Date().getMinutes().toString().padStart(2, '0');

// --- X12 856 ASN Generator (Supports both VICS 4010 and 5010) ---
const convertTo856 = (data, vicsVersion = '4010') => {
    const date = getEDIDate();
    const time = getEDITime();
    
    const isaVersion = vicsVersion === '5010' ? '00501' : '00401';
    const gsVersion = vicsVersion === '5010' ? '005010' : '004010VICS';
    
    let x = `ISA*00*          *00*          *ZZ*SENDERID       *ZZ*RECEIVERID     *${date}*${time}*U*${isaVersion}*000000001*0*T*>~\n`;
    x += `GS*SH*SENDERID*RECEIVERID*${date}*${time}*1*X*${gsVersion}~\n`;
    x += `ST*856*0001~\n`;
    x += `BSN*00*${data.asnNumber}*${date}*${time}*0001~\n`;
    
    // HL Shipment Level
    x += `HL*1**S~\n`; 
    x += `TD1*CTN25*${data.items.length}~\n`; // Packaging
    x += `TD5*B*02*FDE*M*FEDERAL EXPRESS~\n`; // Carrier
    x += `REF*BM*${data.bolNumber}~\n`; // BOL
    
    if(data.shipTo) {
        x += `N1*ST*${data.shipTo.name}*9*${data.shipTo.id}~\n`;
        
        // 5010 requires more address details
        if (vicsVersion === '5010' && data.shipTo.address) {
            if (data.shipTo.address.street) {
                x += `N3*${data.shipTo.address.street}~\n`;
            }
            if (data.shipTo.address.city && data.shipTo.address.state && data.shipTo.address.zip) {
                x += `N4*${data.shipTo.address.city}*${data.shipTo.address.state}*${data.shipTo.address.zip}~\n`;
            }
        }
    }

    // HL Order Level
    x += `HL*2*1*O~\n`; 
    x += `PRF*${data.poNumber}~\n`;
    
    // HL Item Level
    data.items.forEach((item, index) => {
        x += `HL*${index + 3}*2*I~\n`; 
        x += `LIN**VC*${item.sku}~\n`;
        x += `SN1**${item.qty}*EA~\n`;
        x += `PO4*1*1*EA~\n`; // Inner Pack
    });
    
    x += `CTT*${data.items.length}~\n`;
    x += `SE*${(data.items.length * 4) + 11 + (vicsVersion === '5010' && data.shipTo?.address ? 2 : 0)}*0001~\n`;
    x += `GE*1*1~\n`;
    x += `IEA*1*000000001~`;
    return x;
};

// --- X12 810 INVOICE Generator (Supports both VICS 4010 and 5010) ---
const convertTo810 = (data, vicsVersion = '4010') => {
    const date = getEDIDate();
    const time = getEDITime();
    
    const isaVersion = vicsVersion === '5010' ? '00501' : '00401';
    const gsVersion = vicsVersion === '5010' ? '005010' : '004010VICS';
    
    let x = `ISA*00*          *00*          *ZZ*SENDERID       *ZZ*RECEIVERID     *${date}*${time}*U*${isaVersion}*000000002*0*T*>~\n`;
    x += `GS*IN*SENDERID*RECEIVERID*${date}*${time}*2*X*${gsVersion}~\n`;
    x += `ST*810*0001~\n`;
    x += `BIG*${date}*${data.invoiceNumber}*${date}*${data.poNumber}***DI~\n`;
    
    if(data.billTo) {
        x += `N1*BT*${data.billTo.name}*9*${data.billTo.id}~\n`;
        
        // 5010 requires more address details
        if (vicsVersion === '5010' && data.billTo.address) {
            if (data.billTo.address.street) {
                x += `N3*${data.billTo.address.street}~\n`;
            }
            if (data.billTo.address.city && data.billTo.address.state && data.billTo.address.zip) {
                x += `N4*${data.billTo.address.city}*${data.billTo.address.state}*${data.billTo.address.zip}~\n`;
            }
        }
    }
    
    x += `ITD*01*3*2**30**31~\n`; // Terms: 2% 10, Net 30
    
    let segmentCount = 7 + (vicsVersion === '5010' && data.billTo?.address ? 2 : 0);
    
    data.items.forEach((item, index) => {
        x += `IT1*${index + 1}*${item.qty}*EA*${item.unitPrice}**VC*${item.sku}~\n`;
        x += `PID*F****${item.sku}~\n`;
        segmentCount += 2;
    });
    
    x += `TDS*${Math.round(data.grandTotal * 100)}~\n`; // Amount in cents
    
    // 5010 may require additional tax segments
    if (vicsVersion === '5010' && data.taxAmount) {
        x += `TXI*TX*${Math.round(data.taxAmount * 100)}~\n`;
        segmentCount += 1;
    }
    
    x += `SAC*C*D240***${Math.round(data.grandTotal * 0.01 * 100)}****06*Freight~\n`;
    x += `CTT*${data.items.length}~\n`;
    x += `SE*${segmentCount + 2}*0001~\n`;
    x += `GE*1*2~\n`;
    x += `IEA*1*000000002~`;
    return x;
};

// --- Enhanced Validation Functions ---
const validatePOData = (po) => {
    const errors = [];
    
    if (!po) {
        errors.push('PO data is required');
        throw new Error(errors.join(', '));
    }
    
    if (!po.poNumber) {
        errors.push('PO number is missing');
    }
    
    if (!po.items || !Array.isArray(po.items)) {
        errors.push('PO must contain an items array');
    } else if (po.items.length === 0) {
        errors.push('PO must contain at least one item');
    } else {
        // Validate each item
        po.items.forEach((item, index) => {
            if (!item.sku) {
                errors.push(`Item ${index + 1}: Missing SKU`);
            }
            if (!item.quantity && item.quantity !== 0) {
                errors.push(`Item ${index + 1}: Missing quantity`);
            }
            if (item.quantity <= 0) {
                errors.push(`Item ${index + 1}: Quantity must be greater than 0`);
            }
        });
    }
    
    if (errors.length > 0) {
        throw new Error(errors.join(', '));
    }
    
    return true;
};

const validateASNData = (asn) => {
    const errors = [];
    
    if (!asn) {
        errors.push('ASN data is required');
        throw new Error(errors.join(', '));
    }
    
    if (!asn.items || !Array.isArray(asn.items)) {
        errors.push('ASN must contain an items array');
    } else if (asn.items.length === 0) {
        errors.push('ASN must contain at least one item');
    } else {
        asn.items.forEach((item, index) => {
            if (!item.sku) {
                errors.push(`ASN item ${index + 1}: Missing SKU`);
            }
            if (!item.qty && item.qty !== 0) {
                errors.push(`ASN item ${index + 1}: Missing quantity`);
            }
            if (item.qty <= 0) {
                errors.push(`ASN item ${index + 1}: Quantity must be greater than 0`);
            }
        });
    }
    
    if (errors.length > 0) {
        throw new Error(errors.join(', '));
    }
    
    return true;
};

// --- API ROUTES ---
app.post('/api/generate-856', (req, res) => {
    try {
        const { po, vicsVersion = '4010' } = req.body;
        
        // Validate input
        validatePOData(po);
        
        const asnData = { 
            asnNumber: `ASN${Date.now().toString().slice(-5)}`,
            bolNumber: `BOL${Math.floor(Math.random() * 100000)}`,
            poNumber: po.poNumber,
            shipTo: po.shipTo || { name: "RETAIL DC", id: "0001" },
            items: po.items.map(i => ({ 
                sku: i.sku, 
                qty: i.quantity 
            })) 
        };
        
        const x12 = convertTo856(asnData, vicsVersion);
        
        res.json({ 
            title: `856 ASN (VICS ${vicsVersion})`, 
            json: asnData, 
            x12: x12,
            success: true,
            message: `ASN created successfully using VICS ${vicsVersion}`,
            vicsVersion
        });
        
        console.log(`✅ 856 ASN Generated for PO: ${po.poNumber} (VICS ${vicsVersion})`);
        
    } catch (e) { 
        console.error('❌ Error generating 856:', e.message);
        res.status(400).json({ 
            error: e.message || "Failed to generate ASN",
            success: false
        }); 
    }
});

app.post('/api/generate-810', (req, res) => {
    try {
        const { asn, po, vicsVersion = '4010' } = req.body;
        
        // Validate inputs
        validateASNData(asn);
        validatePOData(po);
        
        // Match ASN items with PO items to get pricing
        const invoiceItems = asn.items.map(asnItem => {
            const poMatch = po.items.find(p => p.sku === asnItem.sku);
            
            if (!poMatch) {
                throw new Error(`SKU ${asnItem.sku} from ASN not found in PO`);
            }
            
            const price = poMatch.price || 0;
            return { 
                sku: asnItem.sku, 
                qty: asnItem.qty, 
                unitPrice: price, 
                lineTotal: asnItem.qty * price 
            };
        });
        
        const subtotal = invoiceItems.reduce((sum, i) => sum + i.lineTotal, 0);
        const freight = subtotal * 0.01; // 1% freight charge
        const taxAmount = vicsVersion === '5010' ? subtotal * 0.08 : 0; // 8% tax for 5010
        const grandTotal = subtotal + freight + taxAmount;
        
        const invoiceData = {
            invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
            poNumber: po.poNumber,
            billTo: po.billTo || po.shipTo || { name: "RETAIL DC", id: "0001" },
            items: invoiceItems,
            subtotal: subtotal,
            freight: freight,
            taxAmount: taxAmount,
            grandTotal: grandTotal
        };
        
        const x12 = convertTo810(invoiceData, vicsVersion);
        
        res.json({ 
            title: `810 Invoice (VICS ${vicsVersion})`, 
            json: invoiceData, 
            x12: x12,
            success: true,
            message: `Invoice created successfully using VICS ${vicsVersion}`,
            vicsVersion
        });
        
        console.log(`✅ 810 Invoice Generated: ${invoiceData.invoiceNumber} (VICS ${vicsVersion})`);
        
    } catch (e) { 
        console.error('❌ Error generating 810:', e.message);
        res.status(400).json({ 
            error: e.message || "Failed to generate invoice",
            success: false
        }); 
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        message: 'VICS 4010/5010 EDI Suite API is running',
        supportedVersions: ['4010', '5010'],
        timestamp: new Date().toISOString()
    });
});

// Validation endpoint for testing
app.post('/api/validate', (req, res) => {
    try {
        const { data, type } = req.body; // type: 'po' or 'asn'
        
        if (type === 'po') {
            validatePOData(data);
            res.json({
                valid: true,
                message: 'PO data is valid',
                success: true
            });
        } else if (type === 'asn') {
            validateASNData(data);
            res.json({
                valid: true,
                message: 'ASN data is valid',
                success: true
            });
        } else {
            res.status(400).json({
                valid: false,
                error: 'Invalid validation type. Use "po" or "asn"',
                success: false
            });
        }
    } catch (e) {
        res.status(400).json({
            valid: false,
            error: e.message,
            success: false
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    res.status(500).json({ 
        error: 'Internal server error',
        message: err.message,
        success: false
    });
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ VICS 4010/5010 EDI Suite API Server');
    console.log(`🚀 Running on http://localhost:${PORT}`);
    console.log('📡 Endpoints:');
    console.log('   POST /api/generate-856  - Generate 856 ASN');
    console.log('   POST /api/generate-810  - Generate 810 Invoice');
    console.log('   POST /api/validate      - Validate PO/ASN data');
    console.log('   GET  /api/health        - Health check');
    console.log('🔧 Supported VICS Versions: 4010, 5010');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
});