// content.js - SPA Compatible Injection

(function() {
    const BUTTON_ID = 'amz-action-btn';
    const TRACKING_BTN_ID = 'amz-estes-track-btn';
    const DOC_BTN_ID = 'amz-estes-doc-btn';
    const EMAIL_BTN_ID = 'amz-estes-email-btn';
    const UPS_TRACKING_BTN_ID = 'amz-ups-track-btn';
    const DETAIL_PATH = '/afi-shipment-mgr/shipmentdetail';
    const QUEUE_PATH = '/afi-shipment-mgr/shippingqueue';
    const DISPUTES_PATH = '/disputes/re/create';

    const DISPUTE_DEFAULTS = {
        disputeBol: `Hi,\n\nWe've verified the shipment and confirmed a receipt shortage for PO ID: {poId}\n\nCould you please process a credit for the corresponding invoice to reflect this shortage?\n\nSee attached copy of the signed BOL as your reference confirming that the units were successfully delivered by the carrier.\n\nThanks!`,
        disputePod: `Hi,\n\nWe've verified the shipment and confirmed a receipt shortage for PO ID: {poId}\n\nCould you please process a credit for the corresponding invoice to reflect this shortage?\n\nSee attached copy of the POD as your reference confirming that the units were successfully delivered by the carrier.\n\nThanks!`,
        disputeSpd: `Hi,\n\nWe've verified the shipment and confirmed a receipt shortage for PO ID: {poId}\n\nCould you please process a credit for the corresponding invoice to reflect this shortage?\n\nThanks!`
    };

    function manageButtonVisibility() {
        const url = window.location.href;
        const existingBtn = document.getElementById(BUTTON_ID);
        
        const isDetail = url.includes(DETAIL_PATH);
        const isQueue = url.includes(QUEUE_PATH);

        if (isDetail) {
            autoHighlightPO();
            checkEstesOnPage();
            checkUPSOnPage();
        }

        const isDisputes = url.includes(DISPUTES_PATH);
        if (isDisputes) {
            checkDisputePills();
        } else {
            removeDisputePills();
        }

        if ((isDetail || isQueue) && !existingBtn) {
            createButton(isDetail ? 'detail' : 'queue');
        } else if (!(isDetail || isQueue) && existingBtn) {
            existingBtn.remove();
        } else if (existingBtn) {
            // Update mode if it changed (SPA navigation)
            const currentMode = existingBtn.getAttribute('data-mode');
            const targetMode = isDetail ? 'detail' : 'queue';
            if (currentMode !== targetMode) {
                existingBtn.remove();
                removeEstesBtns();
                createButton(targetMode);
            }
        }

        if (!(isDetail || isQueue)) {
            removeEstesBtns();
        }
    }

    function autoHighlightPO() {
        const asnMatch = window.location.href.match(/asn=(\d+)/i);
        const currentAsn = asnMatch ? asnMatch[1] : null;

        try { chrome.runtime && chrome.runtime.id; } catch(e) { return; } // extension reloaded

        chrome.storage.local.get(['asnMappings', 'lastExtractedPO'], (result) => {
            const mappings = result.asnMappings || {};
            const finalPO = (currentAsn && mappings[currentAsn]) ? mappings[currentAsn] : result.lastExtractedPO;

            if (finalPO && finalPO !== "N/A") {
                const els = Array.from(document.querySelectorAll('span, b, td, a, kat-link')).filter(el => {
                    const t = (el.getAttribute('label') || el.innerText || "").trim();
                    return t === finalPO || (t.includes(finalPO) && t.length < 60);
                });
                els.forEach(el => {
                    el.style.backgroundColor = 'yellow';
                    el.style.color = 'black';
                    el.style.fontWeight = 'bold';
                    el.style.border = '2px solid orange';
                });
            }
        });
    }

    function createButton(mode) {
        const btn = document.createElement('button');
        btn.id = BUTTON_ID;
        btn.setAttribute('data-mode', mode);
        btn.innerText = (mode === 'detail') ? 'Create\nEmail' : 'Open\nPOs';
        
        Object.assign(btn.style, {
            position: 'fixed',
            top: '50%',
            right: '20px',
            transform: 'translateY(-50%)',
            zIndex: '99999',
            backgroundColor: '#1a73e8',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '70px',
            height: '70px',
            boxShadow: '0 4px 10px rgba(0,0,0,0.4)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            fontFamily: 'Roboto, Arial, sans-serif',
            fontWeight: 'bold',
            fontSize: '11px',
            lineHeight: '1.2',
            padding: '5px',
            transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        });

        btn.onmouseover = () => {
            btn.style.backgroundColor = '#1557b0';
            btn.style.transform = 'translateY(-50%) scale(1.1)';
        };
        btn.onmouseout = () => {
            btn.style.backgroundColor = '#1a73e8';
            btn.style.transform = 'translateY(-50%) scale(1.0)';
        };

        btn.onclick = () => {
            if (mode === 'detail') {
                handleDetailFlow(btn);
            } else {
                handleQueueFlow(btn);
            }
        };

        document.body.appendChild(btn);
    }

    function removeEstesBtns() {
        [TRACKING_BTN_ID, DOC_BTN_ID, EMAIL_BTN_ID, UPS_TRACKING_BTN_ID].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.remove();
        });
    }

    function checkEstesOnPage() {
        const text = document.body.innerText;
        const carrierMatch = text.match(/Carrier:\s*\n?(.+)/i);
        const carrierRaw = carrierMatch ? carrierMatch[1].trim().toUpperCase() : '';
        if (!carrierRaw.includes('ESTES') && !carrierRaw.includes('EXLA')) {
            removeEstesBtns();
            return;
        }
        const trackingMatch = text.match(/Carrier tracking.*PRO.*:\s*\n?([A-Z0-9]+)/i);
        const trackingId = trackingMatch ? trackingMatch[1].trim() : null;

        const poId = extractPOFromDetail();

        if (trackingId && !document.getElementById(TRACKING_BTN_ID)) {
            createEstesPill(TRACKING_BTN_ID, 'View Tracking', 'calc(50% + 50px)', () => {
                window.open(`https://www.estes-express.com/myestes/shipment-tracking/?query=${trackingId}&type=PRO`, '_blank');
            });
        }
        if (poId && !document.getElementById(DOC_BTN_ID)) {
            createEstesPill(DOC_BTN_ID, 'Request Doc', 'calc(50% + 95px)', () => {
                window.open(`https://www.estes-express.com/myestes/document-retrieval/?pro=${poId}`, '_blank');
            });
        }
        if (!document.getElementById(EMAIL_BTN_ID)) {
            createEstesPill(EMAIL_BTN_ID, '1P-Email', 'calc(50% + 140px)', () => {
                navigator.clipboard.writeText('amz1paudits@threecolts.com');
            });
        }
    }

    function checkUPSOnPage() {
        const text = document.body.innerText;
        const carrierMatch = text.match(/Carrier:\s*\n?(.+)/i);
        const carrierRaw = carrierMatch ? carrierMatch[1].trim().toUpperCase() : '';
        if (!carrierRaw.includes('UPS')) {
            const existing = document.getElementById(UPS_TRACKING_BTN_ID);
            if (existing) existing.remove();
            return;
        }
        const trackingMatch = text.match(/Carrier tracking.*PRO.*:\s*\n?([A-Z0-9]+)/i);
        const trackingId = trackingMatch ? trackingMatch[1].trim() : null;
        if (trackingId && !document.getElementById(UPS_TRACKING_BTN_ID)) {
            createEstesPill(UPS_TRACKING_BTN_ID, 'View Tracking', 'calc(50% + 50px)', () => {
                window.open(`https://www.ups.com/track?loc=en_US&tracknum=${trackingId}`, '_blank');
            });
        }
    }

    function createEstesPill(id, label, topOffset, clickHandler) {
        const pill = document.createElement('button');
        pill.id = id;
        pill.innerText = label;
        Object.assign(pill.style, {
            position: 'fixed',
            top: topOffset,
            right: '20px',
            zIndex: '99999',
            backgroundColor: '#34a853',
            color: '#ffffff',
            border: 'none',
            borderRadius: '50px',
            padding: '7px 16px',
            fontSize: '11px',
            fontWeight: '600',
            fontFamily: 'Roboto, Arial, sans-serif',
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
            whiteSpace: 'nowrap',
            transition: 'background 0.2s'
        });
        pill.onmouseover = () => { pill.style.backgroundColor = '#2d9248'; };
        pill.onmouseout = () => { pill.style.backgroundColor = '#34a853'; };
        pill.onclick = clickHandler;
        document.body.appendChild(pill);
    }

    // --- DETAIL PAGE LOGIC ---
    function handleDetailFlow(btn) {
        try {
            const selection = window.getSelection();
            const range = document.createRange();
            range.selectNodeContents(document.body);
            selection.removeAllRanges();
            selection.addRange(range);
            document.execCommand('copy');
            selection.removeAllRanges();

            const plainText = document.body.innerText;
            const asnMatch = window.location.href.match(/asn=(\d+)/i);
            const currentAsn = asnMatch ? asnMatch[1] : null;

            // Trigger automation message
            btn.innerText = '⏳';
            btn.style.backgroundColor = '#f29900';

            chrome.runtime.sendMessage({
                action: "processAmazonData",
                text: plainText,
                extractedPO: extractPOFromDetail(),
                asn: currentAsn
            }, (response) => {
                const isAmz = response && response.isAmz;
                btn.innerText = isAmz ? '✅ Copied!' : '✅ Done';
                btn.style.backgroundColor = '#1e8e3e';
                setTimeout(() => {
                    btn.innerText = 'Create\nEmail';
                    btn.style.backgroundColor = '#1a73e8';
                }, 2000);

            });
        } catch (err) {
            console.error('Action failed:', err);
        }
    }

    function extractPOFromDetail() {
        const poPattern = /\b([A-Z0-9]*[0-9][A-Z0-9]{6,11})\b/i;
        const allKatLinks = Array.from(document.querySelectorAll('kat-link[label]'));
        for (let k of allKatLinks) {
            const lbl = k.getAttribute('label').trim();
            if (poPattern.test(lbl) && !/ASN|HJBT|PRO/i.test(lbl)) return lbl;
        }
        const allLinks = Array.from(document.querySelectorAll('a'));
        for (let a of allLinks) {
            const txt = a.innerText.trim();
            if (poPattern.test(txt) && !/ASN|HJBT|PRO/i.test(txt)) return txt;
        }
        return null;
    }

    // --- QUEUE PAGE LOGIC ---
    function handleQueueFlow(btn) {
        // 1. Extract ASNs (Targeting kat-links specifically)
        const asnSet = new Set();
        document.querySelectorAll('kat-link').forEach(link => {
            const href = link.getAttribute('href') || "";
            // Only capture if it's explicitly a shipmentdetail ASN link
            if (href.includes('shipmentdetail') && href.includes('asn=')) {
                const match = href.match(/asn=(\d+)/);
                if (match) asnSet.add(match[1]);
            }
        });
        const asns = Array.from(asnSet);

        // 2. Extract PO ID (Broad Search)
        const text = document.body.innerText;
        let poId = null;
        
        // Try the specific "View intro ... Clear search" pattern first
        const poMatch = text.match(/View intro\s*([\s\n]+)([A-Z0-9]{5,20})\s*([\s\n]+)Clear search/i);
        if (poMatch) poId = poMatch[2].trim();

        // Fallback: If not found, look for any input value or likely search filter
        if (!poId) {
            // Check any input elements or custom input attributes
            const inputs = Array.from(document.querySelectorAll('input, kat-input'));
            for (let input of inputs) {
                const val = (input.value || input.getAttribute('value') || "").trim();
                // Amazon POs are usually 8 chars alphanumeric
                if (/^[A-Z0-9]{7,12}$/i.test(val) && /\d/.test(val)) {
                    poId = val;
                    break;
                }
            }
        }

        if (asns.length > 0 && poId) {
            chrome.storage.local.get(['asnMappings'], (result) => {
                const mappings = result.asnMappings || {};
                asns.forEach(asn => { mappings[asn] = poId; });
                chrome.storage.local.set({ asnMappings: mappings, lastExtractedPO: poId }, () => {
                    asns.forEach((asn, index) => {
                        setTimeout(() => {
                            window.open(`${window.location.origin}/kt/vendor/members/afi-shipment-mgr/shipmentdetail?asn=${asn}`, '_blank');
                        }, index * 400);
                    });
                });
            });
            btn.innerText = '🚀 Opened';
            btn.style.backgroundColor = '#1e8e3e';
            setTimeout(() => {
                btn.innerText = 'Open\nPOs';
                btn.style.backgroundColor = '#1a73e8';
            }, 2000);
        } else {
            alert(`Found ${asns.length} ASNs and PO: ${poId || 'Missing'}. Try searching for the PO again then click this.`);
        }
    }

    // --- DISPUTE PAGE LOGIC ---
    function removeDisputePills() {
        ['amz-disp-toggle', 'amz-disp-bol', 'amz-disp-pod', 'amz-disp-spd'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.remove();
        });
    }

    function checkDisputePills() {
        if (document.getElementById('amz-disp-toggle')) return;

        const defs = [
            { id: 'amz-disp-bol', label: 'BOL/LTL',        key: 'disputeBol', top: 'calc(50% + 36px)'  },
            { id: 'amz-disp-pod', label: 'POD/S.Parcel',   key: 'disputePod', top: 'calc(50% + 68px)'  },
            { id: 'amz-disp-spd', label: 'No Attch./SPD',  key: 'disputeSpd', top: 'calc(50% + 100px)' }
        ];

        // Create toggle circle
        const toggle = document.createElement('button');
        toggle.id = 'amz-disp-toggle';
        toggle.innerText = 'TEMPLATE';
        Object.assign(toggle.style, {
            position: 'fixed',
            top: '50%',
            right: '20px',
            transform: 'translateY(-50%)',
            zIndex: '99999',
            backgroundColor: '#1a73e8',
            color: '#ffffff',
            border: 'none',
            borderRadius: '50%',
            width: '56px',
            height: '56px',
            fontSize: '8.5px',
            fontWeight: '700',
            fontFamily: 'Roboto, Arial, sans-serif',
            cursor: 'pointer',
            boxShadow: '0 3px 8px rgba(0,0,0,0.3)',
            lineHeight: '1.2',
            textAlign: 'center',
            transition: 'background 0.2s'
        });

        // Create pills (hidden initially)
        defs.forEach(def => createDisputePill(def.id, def.label, def.top, def.key));
        defs.forEach(def => { document.getElementById(def.id).style.display = 'none'; });

        let expanded = false;
        toggle.onclick = () => {
            expanded = !expanded;
            toggle.style.backgroundColor = expanded ? '#1557b0' : '#1a73e8';
            defs.forEach(def => {
                document.getElementById(def.id).style.display = expanded ? 'block' : 'none';
            });
        };
        toggle.onmouseover = () => { toggle.style.backgroundColor = expanded ? '#1248a0' : '#1557b0'; };
        toggle.onmouseout = () => { toggle.style.backgroundColor = expanded ? '#1557b0' : '#1a73e8'; };

        document.body.appendChild(toggle);
    }

    function createDisputePill(id, label, top, templateKey) {
        const pill = document.createElement('button');
        pill.id = id;
        pill.innerText = label;
        Object.assign(pill.style, {
            position: 'fixed',
            top: top,
            right: '20px',
            zIndex: '99999',
            backgroundColor: '#1a73e8',
            color: '#ffffff',
            border: 'none',
            borderRadius: '50px',
            padding: '6px 13px',
            fontSize: '11px',
            fontWeight: '600',
            fontFamily: 'Roboto, Arial, sans-serif',
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
            whiteSpace: 'nowrap',
            transition: 'background 0.2s'
        });
        pill.onmouseover = () => { if (pill.innerText !== 'Copied!') pill.style.backgroundColor = '#1557b0'; };
        pill.onmouseout = () => { if (pill.innerText !== 'Copied!') pill.style.backgroundColor = '#1a73e8'; };
        pill.onclick = () => {
            chrome.storage.local.get(['templateSettings', 'lastExtractedPO'], (result) => {
                const templates = result.templateSettings || {};
                const poId = result.lastExtractedPO || '';
                const raw = templates[templateKey] || DISPUTE_DEFAULTS[templateKey] || '';
                const text = raw.replace(/\{poId\}/g, poId);
                navigator.clipboard.writeText(text).then(() => {
                    const orig = pill.innerText;
                    pill.innerText = 'Copied!';
                    pill.style.backgroundColor = '#1e8e3e';
                    setTimeout(() => { pill.innerText = orig; pill.style.backgroundColor = '#1a73e8'; }, 1500);
                });
            });
        };
        document.body.appendChild(pill);
    }

    // --- INITIALIZATION ---
    manageButtonVisibility();
    setInterval(manageButtonVisibility, 1000);
})();