/* 
   ThreeColts Audit Automator - Logic Script
   Updated: v1.6 - Removed ARN # from Ship To Address
*/

// --- DEFAULT DATABASE ---
const DEFAULT_DB = {
  // UPS FREIGHT (LTL/TL) — rebranded to TForce but domestic UPS Freight email
  "UPS FREIGHT": "customerrelations@cs.tforcefreight.com",
  // UPS Small Parcel (tracking starts with 1Z)
  "UPS": "preferred.us@ups.com; gfaubion@ups.com",
  "FEDEX": "N/A",
  "ONTRAC": "AmazonSAGTeam@OnTrac.co",
  "EMSY": "AmazonSAGTeam@OnTrac.co",
  // Central Transport — CTII code = same email as standard
  "CENTRAL TRANSPORT INTERNATIONAL INC": "pickup@centraltransport.com",
  "CTII": "pickup@centraltransport.com",
  "CENTRAL TRANSPORT": "cs.pickup@centraltransport.com; pickup@centraltransport.com; cs@centraltransport.com",
  "JB HUNT": "amazon.ltl@jbhunt.com",
  "HUNT, J B TRANSPORT INC (HJBT)": "amazon.ltl@jbhunt.com",
  "DAY AND ROSS": "DRAM@dayandrossinc.ca; custservice@dayandrossinc.ca",
  "SPEEDY TRANSPORT": "customercare@speedy.ca",
  "SZTG": "customercare@speedy.ca",
  "ABF FREIGHT": "amazon@abf.com",
  "ABFS": "amazon@abf.com",
  "QUIK X": "pbarnes@quikx.com",
  "QXTI": "pbarnes@quikx.com",
  "FEDERAL GATEWAY": "info@federalmovingandstorage.com",
  "FEDG": "info@federalmovingandstorage.com",
  "XPO LOGISTICS": "LTL.Amazon@xpo.com",
  "CNWY": "LTL.Amazon@xpo.com",
  "ROCO FREIGHT": "alexander.tomlin@rxo.com",
  "ROCO": "alexander.tomlin@rxo.com",
  "SWIFT TRANSPORTATION": "Amazon@swifttrans.com",
  "SWFT": "Amazon@swifttrans.com",
  // TForce Freight Canada (TFIN) — separate from UPS Freight domestic
  "TFORCE FREIGHT": "tracking@tforcefreightcanada.com",
  "TFIN": "tracking@tforcefreightcanada.com",
  "AAA COOPER": "AmazonLT@aaacooper.com",
  "AACT": "AmazonLT@aaacooper.com",
  // Echo Global — tracking account has email, LLC entity (ECHS) does not
  "ECHO GLOBAL": "info@echo.com",
  "ECHS": "N/A",
  "CH ROBINSON": "N/A",
  "RBHD": "N/A",
  "OLD DOMINION": "customer.service@odfl.com",
  "ODFL": "customer.service@odfl.com",
  "HAPAG LLOYD": "hapag.docs.ph@benline.com",
  "HLCU": "hapag.docs.ph@benline.com",
  "MAERSK": "toc@amazon.com",
  "MAEU": "toc@amazon.com",
  "ESTES": "WebSupport@estes-express.com",
  "EXLA": "WebSupport@estes-express.com",
  "FALCON LOGISTICS": "support@falconlanelogistics.com",
  "FLOC": "support@falconlanelogistics.com",
  "PALLETLINE": "info@palletline.co.uk",
  "PLTLN": "info@palletline.co.uk"
};

// --- DEFAULT TEMPLATES ---
const DEFAULT_TEMPLATES = {
  amzx: `Hi Amazon Freight Support Team,\n\nWe are requesting for the signed BOL for PO ID {poId}. We require this documentation to investigate a shortage.\n\nAssociated ASN/ARN: {asn} / {arn}\n\nPlease provide a high-resolution copy of the BOL (Bill of Lading) indicating the Amazon stamp and/or the receiver's signature confirming the pallet/unit count.\n\nNote: This is an AMZX shipment, hence please do not advise us to contact the carrier directly since the shipment page instructs us to create a case for delivery-related issues.\n\n"This shipment has been assigned to an Amazon-managed carrier. For assistance, go to Support and select Contact us, select Shipments, and then select the relevant issue type."\n\nThanks.`,
  centralTransport: `Hi,\n\nWe are requesting for the signed BOL for PO ID {poId}. We require this documentation to investigate a shortage claim.\n\n\nPRO number: {tracking}{pickedUpLine}\nShip from: {shipFrom}\nShip to: {shipTo}\n\n\nPlease provide a high-resolution copy of the signed BOL (Bill of Lading) indicating the Amazon stamp and/or the receiver's signature confirming the pallet/unit count.\n\nThank you.`,
  upsFedex: `Hi {carrier} Support Team,\n\nWe are writing to request a formal Proof of Delivery (POD) for a shipment that is no longer appearing in the active tracking system. Because the tracking has expired, we are unable to download the documentation via the standard carrier portal.\n\nShipment Information:\nTracking Number: {tracking}\nShip from Address: {shipFrom}\nShip to Address: {shipTo}\n\nFor shortage claim purposes, we need a copy of the delivery record, specifically showing the weight of the package, delivery address, date/time, and the signature/name of the individual who accepted the package.\n\nThank you for your assistance in locating this archived record.`,
  smallParcel: `Hi {carrier} Support Team,\n\nWe are writing to request a formal Proof of Delivery (POD) for a shipment that is no longer appearing in the active tracking system. Because the tracking has expired, we are unable to download the documentation via the standard carrier portal.\n\nShipment Information:\nTracking Number: {tracking}\nShipper Address: {shipFrom}\nRecipient Address: {shipTo}\n\nFor shortage claim purposes, we need a copy of the delivery record, specifically showing the delivery address, date/time, and the signature/name of the individual who accepted the package.\n\nThank you for your assistance in locating this archived record.`,
  standardLtl: `Hi,\n\nWe are requesting for the signed BOL for PO ID {poId}. We require this documentation to investigate a shortage claim.\n\n\nPRO number: {tracking}{pickedUpDateLine}\nShip from: {shipFrom}\nShip to: {shipTo}\n\n\nPlease provide a high-resolution copy of the signed BOL (Bill of Lading) indicating the Amazon stamp and/or the receiver's signature confirming the pallet/unit count.\n\nThank you.`,
  disputeBol: `Hi,\n\nWe've verified the shipment and confirmed a receipt shortage for PO ID: {poId}\n\nCould you please process a credit for the corresponding invoice to reflect this shortage?\n\nSee attached copy of the signed BOL as your reference confirming that the units were successfully delivered by the carrier.\n\nThanks!`,
  disputePod: `Hi,\n\nWe've verified the shipment and confirmed a receipt shortage for PO ID: {poId}\n\nCould you please process a credit for the corresponding invoice to reflect this shortage?\n\nSee attached copy of the POD as your reference confirming that the units were successfully delivered by the carrier.\n\nThanks!`,
  disputeSpd: `Hi,\n\nWe've verified the shipment and confirmed a receipt shortage for PO ID: {poId}\n\nCould you please process a credit for the corresponding invoice to reflect this shortage?\n\nThanks!`,
  followup: `Hi,\n\nGood day!\n\nWe\'re following up on the request regarding the signed Bill of Lading (BOL) for PO {poId}. We have yet to receive the documentation, and this is now becoming urgent as we need to resolve an active shortage claim.\n\nAs a reminder, we require a high-resolution copy that clearly shows:\nThe Amazon stamp and/or the receiver\'s signature.\nThe confirmed pallet/unit count at the time of delivery.\n\nShipment Details:\n\nPRO Number: {pro}{pickupLine}\nShip From: {shipFrom}\nShip To: {shipTo}\n\nCould you please provide an update on the status of this document request?\n\nThank you for your prompt assistance.\n\nBest regards,`,
  followupPod: `Hi,\n\nGood day!\n\nWe\'re following up on the request regarding the Proof of Delivery (POD) for PO {poId}. We have yet to receive the documentation, and this is now becoming urgent as we need to resolve an active shortage claim.\n\nAs a reminder, we require a delivery record that clearly shows:\n- The delivery address\n- Date and time of delivery\n- The signature or name of the individual who accepted the package.\n\nShipment Information:\n\nTracking Number: {pro}\nShipper Address: {shipFrom}\nRecipient Address: {shipTo}\n\nCould you please provide an update on the status of this document request?\n\nThank you for your prompt assistance.\n\nBest regards,`
};

// --- GLOBAL VARIABLES ---
let activeCarrierDB = {};
let activeTemplates = {};
let currentSubject = "";
let currentBody = "";
let currentEmail = "";
let isAmzCase = false;
let isEstesCase = false;
let isUpsCase = false;
let currentTracking = "";
let lastAutoTrigger = 0;

function autoTrigger() {
  const now = Date.now();
  if (now - lastAutoTrigger < 1000) return; // debounce — avoid double-fire from paste+storage
  lastAutoTrigger = now;

  // Only fire if we have something actionable
  const actionable = isAmzCase
    || (isEstesCase && currentTracking && currentTracking !== "N/A")
    || (isUpsCase && currentTracking && currentTracking !== "N/A")
    || (currentEmail && currentEmail !== "N/A");
  if (!actionable) return;

  // Visual feedback for AMZX (popup stays open long enough to show it)
  if (isAmzCase) {
    navigator.clipboard.writeText(currentBody).catch(() => copyTextSync(currentBody));
    setBtn("✅ Copied!", "#1e8e3e", 2000);
  }

  // Delegate actual tab logic to background service worker (survives popup close)
  chrome.runtime.sendMessage({
    action: "autoAct",
    data: {
      isAmz: isAmzCase,
      isEstes: isEstesCase,
      isUps: isUpsCase,
      tracking: currentTracking,
      email: currentEmail,
      subject: currentSubject,
      body: currentBody
    }
  });
}

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get(['carrierSettings', 'lastCopiedData', 'lastExtractedPO', 'templateSettings', 'lastMainTab'], (result) => {
    if (result.carrierSettings) {
      activeCarrierDB = result.carrierSettings;
    } else {
      activeCarrierDB = DEFAULT_DB;
      chrome.storage.local.set({ carrierSettings: DEFAULT_DB });
    }

    activeTemplates = result.templateSettings || { ...DEFAULT_TEMPLATES };
    if (!result.templateSettings) chrome.storage.local.set({ templateSettings: DEFAULT_TEMPLATES });

    // Restore last active main tab
    if (result.lastMainTab) switchMainTab(result.lastMainTab);

    // Reload last copied data and auto-trigger if carrier is known
    if (result.lastCopiedData) {
      document.getElementById('amzInput').value = result.lastCopiedData;
      updateWithExtracted(result.lastCopiedData, result.lastExtractedPO);
      autoTrigger();
    }
  });
});

const GITHUB_RAW = "https://raw.githubusercontent.com/SAOdogecoin/1P-Gmail-Emailer/main";

function updateWithExtracted(text, prePO) {
    if (!text) return;
    const parsed = parseAmazonData(text, prePO);
    updateUI(parsed);
}

// AUTO-UPDATE (Added): If background script saves new data, update the UI
chrome.storage.onChanged.addListener((changes) => {
    if (changes.lastCopiedData || changes.lastExtractedPO) {
        chrome.storage.local.get(['lastCopiedData', 'lastExtractedPO'], (res) => {
            document.getElementById('amzInput').value = res.lastCopiedData || "";
            updateWithExtracted(res.lastCopiedData, res.lastExtractedPO);
            autoTrigger();
        });
    }
});

// --- MAIN TAB SWITCHING ---
function switchMainTab(tab) {
  document.querySelectorAll('.main-tab-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.mainTab === tab);
  });
  document.getElementById('emailTabContent').style.display    = tab === 'email'    ? 'block' : 'none';
  document.getElementById('followupTabContent').style.display = tab === 'followup' ? 'block' : 'none';
}

document.querySelectorAll('.main-tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.mainTab;
    switchMainTab(tab);
    chrome.storage.local.set({ lastMainTab: tab });
  });
});

// --- FOLLOW UP LOGIC ---
document.getElementById('followupInput').addEventListener('input', () => {
  const text = document.getElementById('followupInput').value;
  if (!text.trim()) {
    document.getElementById('copyFollowupBtn').disabled = true;
    return;
  }
  const parsed = parseOriginalBolEmail(text);
  document.getElementById('fu-poId').innerText = parsed.poId;
  document.getElementById('fu-pro').innerText = parsed.pro;
  const pickupRow = document.getElementById('fu-pickup').closest('.card-row');
  if (parsed.pickup !== 'N/A') {
    document.getElementById('fu-pickup').innerText = parsed.pickup;
    pickupRow.style.display = 'flex';
  } else {
    pickupRow.style.display = 'none';
  }
  document.getElementById('fu-shipFrom').innerText = parsed.shipFrom;
  document.getElementById('fu-shipTo').innerText = parsed.shipTo;
  
  // Auto-switch the UI toggle based on detection
  document.querySelectorAll('.fu-type-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.fuType === parsed.type);
  });

  document.getElementById('followupCard').style.display = 'block';
  document.getElementById('copyFollowupBtn').disabled = false;
});

// Follow-up type switching
document.querySelectorAll('.fu-type-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.fu-type-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    // Re-trigger the preview if there's input
    if (document.getElementById('followupInput').value.trim()) {
      document.getElementById('followupInput').dispatchEvent(new Event('input'));
    }
  });
});

document.getElementById('copyFollowupBtn').addEventListener('click', () => {
  const text = document.getElementById('followupInput').value;
  const parsed = parseOriginalBolEmail(text);
  const followupBody = buildFollowupEmail(parsed);
  navigator.clipboard.writeText(followupBody).catch(() => copyTextSync(followupBody));
  const btn = document.getElementById('copyFollowupBtn');
  const orig = btn.innerHTML;
  btn.innerHTML = 'Copied!';
  btn.style.backgroundColor = '#16a34a';
  setTimeout(() => { btn.innerHTML = orig; btn.style.backgroundColor = ''; }, 2000);
});

function parseOriginalBolEmail(text) {
  const lines = text.split(/\r?\n/);

  // Finds a line matching keyPattern, returns value on same line or next non-empty line
  const findValue = (keyPattern) => {
    for (let i = 0; i < lines.length; i++) {
      const m = lines[i].match(keyPattern);
      if (!m) continue;
      const inline = (m[1] || '').trim();
      if (inline) return inline;
      // Value on next line
      for (let j = i + 1; j < lines.length; j++) {
        const next = lines[j].trim();
        if (next) return next;
      }
    }
    return 'N/A';
  };

  // PO ID — "PO ID XXXXXXXX" or "PO XXXXXXXX"
  const poMatch = text.match(/PO\s*(?:ID)?\s*[:\s#]*([A-Z0-9]{6,12})/i);
  const poId = poMatch ? poMatch[1].trim() : 'N/A';

  // PRO / Tracking Number
  // Priority order: "Tracking Number:", "PRO number:", "PRO:", "Tracking:"
  // We use a more specific regex to avoid matching "active tracking system"
  const pro = findValue(/(?:Tracking\s*Number|PRO\s*number|PRO|Tracking)\s*[:]\s*(.*)/i);
  
  // Pickup date
  const pickup = findValue(/(?:Picked\s*up|Ship\s*date)\s*(?:date)?\s*[:\s]*(.*)/i);

  // Ship from / Shipper
  const shipFrom = findValue(/(?:Ship\s*from|Shipper)\s*(?:Address)?\s*[:\s]*(.*)/i);
  
  // Ship to / Recipient
  const shipTo   = findValue(/(?:Ship\s*to|Recipient)\s*(?:Address)?\s*[:\s]*(.*)/i);

  // Carrier
  const carrier  = findValue(/Carrier\s*[:\s]*(.*)/i);

  // Auto-detect type
  let type = 'bol';
  const textUpper = text.toUpperCase();
  // Better detection: look for "Tracking Number" specifically as a label
  if (textUpper.includes('TRACKING NUMBER:') || textUpper.includes('SHIPPER ADDRESS:') || textUpper.includes('RECIPIENT ADDRESS:')) {
    type = 'pod';
  } else if (textUpper.includes('PRO NUMBER:') || textUpper.includes('BOL REQUEST')) {
    type = 'bol';
  }
  
  return { poId, pro, pickup, shipFrom, shipTo, carrier, type };
}

function buildFollowupEmail({ poId, pro, pickup, shipFrom, shipTo, carrier }) {
  const pickupLine = pickup !== 'N/A' ? `\nPickup Date: ${pickup}` : '';
  
  // If PO is N/A, make it blank as requested
  const cleanPO = poId === 'N/A' ? '' : poId;
  const cleanPro = pro === 'N/A' ? '' : pro;

  const vars = { poId: cleanPO, pro: cleanPro, pickupLine, shipFrom, shipTo, carrier };
  
  // Determine which template to use (BOL or POD)
  const activeBtn = document.querySelector('.fu-type-btn.active');
  const type = activeBtn ? activeBtn.dataset.fuType : 'bol';
  const tplKey = type === 'pod' ? 'followupPod' : 'followup';
  
  return fillTemplate(activeTemplates[tplKey] || DEFAULT_TEMPLATES[tplKey], vars);
}

// --- NAVIGATION & SETTINGS ---
document.getElementById('openSettings').addEventListener('click', () => {
  document.getElementById('homePage').style.display = 'none';
  document.getElementById('settingsPage').style.display = 'block';
  renderSettings();
});

document.getElementById('syncGlobal').addEventListener('click', async () => {
  const btn = document.getElementById('syncGlobal');
  const origHTML = btn.innerHTML;
  
  if (confirm("Reset local settings to match the latest global defaults from GitHub? ALL custom edits will be lost.")) {
    btn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="animation: spin 1s linear infinite"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>`;
    
    try {
      const res = await fetch(`${GITHUB_RAW}/config.json`, { cache: "no-store" });
      if (!res.ok) throw new Error("Fetch failed");
      const data = await res.json();
      
      chrome.storage.local.set({ 
        carrierSettings: data.carrierSettings, 
        templateSettings: data.templateSettings 
      }, () => {
        window.location.reload();
      });
    } catch (e) {
      console.error(e);
      // Fallback to local defaults if offline
      chrome.storage.local.remove(['carrierSettings', 'templateSettings'], () => {
        window.location.reload();
      });
    }
  }
});

// Added spin animation for sync
const style = document.createElement('style');
style.textContent = `@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`;
document.head.appendChild(style);

document.getElementById('cancelSettings').addEventListener('click', () => {
  document.getElementById('settingsPage').style.display = 'none';
  document.getElementById('homePage').style.display = 'block';
  document.getElementById('saveMsg').style.opacity = '0';
});

function renderSettings() {
  const container = document.getElementById('settingsList');
  container.innerHTML = '';
  const keys = Object.keys(activeCarrierDB).sort();
  keys.forEach(key => addSettingRow(key, activeCarrierDB[key]));
  renderTemplates();
}

function renderTemplates() {
  ['amzx','centralTransport','upsFedex','smallParcel','standardLtl','disputeBol','disputePod','disputeSpd','followup','followupPod'].forEach(key => {
    const el = document.getElementById(`tpl-${key}`);
    if (el) el.value = (activeTemplates[key] !== undefined ? activeTemplates[key] : DEFAULT_TEMPLATES[key]) || '';
  });
}

// Tab switching (Carriers vs Templates)
document.querySelectorAll('.settings-tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.settings-tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab + 'TabContent').classList.add('active');
  });
});

// Sub-tab switching (Templates groups)
document.querySelectorAll('.tpl-subtab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tplTab;
    document.querySelectorAll('.tpl-subtab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tpl-tab-content').forEach(c => c.style.display = 'none');
    
    btn.classList.add('active');
    document.getElementById(`tpl-${tab}-content`).style.display = 'block';
  });
});

const DEL_ICON = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;

function addSettingRow(name = "", email = "") {
  const container = document.getElementById('settingsList');
  const div = document.createElement('div');
  div.className = 'settings-row';
  div.innerHTML = `
    <input type="text" class="inp-name" placeholder="Carrier" value="${name}">
    <input type="text" class="inp-email" placeholder="Email(s)" value="${email}">
    <button class="btn-del" title="Delete">${DEL_ICON}</button>
  `;
  div.querySelector('.btn-del').addEventListener('click', () => {
    div.remove();
    doSave();
  });
  div.querySelectorAll('input').forEach(inp => {
    inp.addEventListener('input', doSave);
  });
  container.appendChild(div);
  div.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  div.querySelector('.inp-name').focus();
}

document.getElementById('addCarrierBtn').addEventListener('click', () => addSettingRow());

function doSave() {
  const rows = document.querySelectorAll('.settings-row');
  const newDB = {};
  rows.forEach(row => {
    const key = row.querySelector('.inp-name').value.toUpperCase().trim();
    const val = row.querySelector('.inp-email').value.trim();
    if (key) newDB[key] = val;
  });
  activeCarrierDB = newDB;

  const templateKeys = ['amzx','centralTransport','upsFedex','smallParcel','standardLtl','disputeBol','disputePod','disputeSpd','followup', 'followupPod'];
  const newTemplates = {};
  templateKeys.forEach(key => {
    const el = document.getElementById(`tpl-${key}`);
    if (el) newTemplates[key] = el.value;
  });
  activeTemplates = newTemplates;

  chrome.storage.local.set({ carrierSettings: newDB, templateSettings: newTemplates }, () => {
    const msg = document.getElementById('saveMsg');
    msg.style.opacity = '1';
    // Clear existing timeout if any
    if (window.saveMsgTimeout) clearTimeout(window.saveMsgTimeout);
    window.saveMsgTimeout = setTimeout(() => msg.style.opacity = '0', 1500);
  });
}

// Attach listeners to template textareas for auto-save
['amzx','centralTransport','upsFedex','smallParcel','standardLtl','disputeBol','disputePod','disputeSpd','followup', 'followupPod'].forEach(key => {
  const el = document.getElementById(`tpl-${key}`);
  if (el) el.addEventListener('input', doSave);
});


// --- MAIN LOGIC (PARSER) ---

document.getElementById('amzInput').addEventListener('input', () => {
  const text = document.getElementById('amzInput').value;
  if (!text) { resetUI(); return; }
  
  // PERSISTENCE (Added): Save current input
  chrome.storage.local.set({ lastCopiedData: text });

  const parsed = parseAmazonData(text); // Manual edits won't have pre-extracted PO
  updateUI(parsed);
  autoTrigger();
});

// Copy Email Handler
document.getElementById('ccBox').addEventListener('click', function() {
  const emailSpan = document.getElementById('ccEmailDisplay');
  const emailText = emailSpan.innerText;
  if (!emailText || emailText === "N/A") return;
  copyToClipboard(emailText, this, emailSpan);
});

// Synchronous clipboard copy — works even when document loses focus
function copyTextSync(text) {
    const el = document.createElement('textarea');
    el.value = text;
    el.style.cssText = 'position:fixed;opacity:0;top:0;left:0;';
    document.body.appendChild(el);
    el.focus();
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
}

function setBtn(text, color, durationMs) {
    const btn = document.getElementById('fillBtn');
    const orig = btn.innerText;
    const origColor = btn.style.backgroundColor || '';
    btn.innerText = text;
    btn.style.backgroundColor = color;
    setTimeout(() => { btn.innerText = orig; btn.style.backgroundColor = origColor; }, durationMs);
}

// Main Action Button (Fill Email OR Copy Case Text)
document.getElementById('fillBtn').addEventListener('click', () => {
  if (isAmzCase) {
      // Copy to clipboard
      navigator.clipboard.writeText(currentBody).catch(() => copyTextSync(currentBody));

      // Also try to auto-fill the contact form if the tab is already open
      chrome.tabs.query({ url: "*://vendorcentral.amazon.com/hz/vendor/members/contact*" }, (tabs) => {
          if (tabs.length > 0) {
              const contactTab = tabs[0];
              chrome.windows.update(contactTab.windowId, { focused: true });
              chrome.tabs.update(contactTab.id, { active: true }, () => {
                  chrome.scripting.executeScript({
                      target: { tabId: contactTab.id },
                      func: fillAmazonContactForm,
                      args: [currentBody]
                  }, (results) => {
                      const result = results && results[0] && results[0].result;
                      const success = result === 'ok';
                      setBtn(success ? "✅ Filled + Copied!" : `⚠️ ${result || 'inject-fail'}`, success ? "#1e8e3e" : "#c5221f", 3000);
                  });
              });
          } else {
              setBtn("✅ Copied!", "#1e8e3e", 2000);
          }
      });
  } else {
      // Find existing Gmail tab
      chrome.tabs.query({ url: "*://mail.google.com/*" }, (tabs) => {
        if (tabs.length > 0) {
          const gmailTab = tabs[0];
          // Activate tab and its window
          chrome.windows.update(gmailTab.windowId, { focused: true });
          chrome.tabs.update(gmailTab.id, { active: true }, () => {
            chrome.scripting.executeScript({
              target: { tabId: gmailTab.id },
              func: fillGmail,
              args: [currentSubject, currentBody, currentEmail]
            });
          });
        } else {
          // No Gmail tab, open new one
          chrome.tabs.create({ url: "https://mail.google.com/" }, (newTab) => {
            // My fillGmail logic already has internal polling for readyState/Selectors
            // But let's verify tab is complete before injecting
            const checkStatus = setInterval(() => {
              chrome.tabs.get(newTab.id, (tab) => {
                if (tab && tab.status === 'complete') {
                  clearInterval(checkStatus);
                  chrome.scripting.executeScript({
                    target: { tabId: newTab.id },
                    func: fillGmail,
                    args: [currentSubject, currentBody, currentEmail]
                  });
                }
              });
            }, 1000);
          });
        }
      });
  }
});

function resetUI() {
  document.getElementById('infoCard').style.display = 'none';
  document.getElementById('fillBtn').disabled = true;
  document.getElementById('fillBtn').innerText = "Auto-Fill Email";
  isAmzCase = false;
}

function updateUI(data) {
  const infoCard = document.getElementById('infoCard');
  const fillBtn = document.getElementById('fillBtn');
  const ccBox = document.getElementById('ccBox');
  const amzBox = document.getElementById('amzBox');
  const estesTrackBtn = document.getElementById('estesTrackBtn');
  
  currentSubject = data.subject;
  currentBody = data.body;
  currentEmail = data.email;
  currentTracking = data.tracking;
  isAmzCase = data.isAmz;
  isEstesCase = data.isEstes;
  isUpsCase = data.isUps;

  infoCard.style.display = 'block';

  document.getElementById('subjectDisplay').innerText = truncate(data.subject, 30);
  document.getElementById('templateTypeDisplay').innerText = data.templateType;
  
  // Estes tracking pill
  if (data.isEstes && data.tracking && data.tracking !== "N/A") {
    estesTrackBtn.style.display = 'block';
    estesTrackBtn.onclick = () => {
      chrome.tabs.create({ url: `https://www.estes-express.com/myestes/shipment-tracking/?query=${data.tracking}&type=PRO` });
    };
  } else {
    estesTrackBtn.style.display = 'none';
  }

  if (data.isAmz) {
    ccBox.style.display = 'none';
    amzBox.style.display = 'flex';
    fillBtn.disabled = false;
    fillBtn.innerText = "Copy Case Text";
  } else {
    amzBox.style.display = 'none';
    ccBox.style.display = 'flex';
    document.getElementById('ccEmailDisplay').innerText = data.email;
    fillBtn.disabled = false;
    fillBtn.innerText = "Auto-Fill Email";
  }
}

function parseAmazonData(text, prePickedPO) {
  const getVal = (r) => { const m = text.match(r); return m && m[1] ? m[1].trim() : "N/A"; };
  
  // Data Extraction
  let carrierRaw = (getVal(/Carrier:\s*\n(.+)/) || getVal(/Carrier:\s*(.+)/)).trim();
  let tracking = getVal(/Carrier tracking.*PRO.*:\s*\n?([A-Z0-9]+)/i);
  if (tracking === "N/A") tracking = getVal(/Carrier tracking[^:\n]*:\s*\n?([A-Z0-9]+)/i);
  if (tracking === "N/A") tracking = getVal(/Tracking[^:\n]*(?:number|#|ID)[^:\n]*:\s*\n?([A-Z0-9]+)/i);
  const mode = getVal(/Mode:\s*\n?(.+)/);
  const poMatch = text.match(/\bPurchase order\b[\s\S]{0,1000}?\b([A-Z0-9]*\d[A-Z0-9]{6,11})\b/i);
  const poId = prePickedPO || (poMatch ? poMatch[1] : "N/A");
  const asn = getVal(/Shipment ID \(ASN\):\s*\n?(\d+)/);
  const arn = getVal(/ARN\s*#:\s*\n?(\d+)/);
  
  // Clean "Ship From" - just convert newlines to commas
  const shipFrom = (getVal(/Ship from:\s*\n([\s\S]+?)(?=\nShip to)/)).replace(/\n/g, ", ");
  
  // Clean "Ship To" - Remove ARN Number and convert newlines to commas
  let shipToRaw = getVal(/Ship to:\s*\n([\s\S]+?)(?=\nYour reference)/);
  
  // LOGIC CHANGE: Split at "ASN number" or "ARN #" to remove it and everything after it
  if (shipToRaw !== "N/A") {
      shipToRaw = shipToRaw.split(/ASN\s*(?:number|#)|ARN\s*#/i)[0]; 
  }
  
  // Format with commas and remove trailing punctuation
  const shipTo = shipToRaw.replace(/\n/g, ", ").replace(/,\s*$/, "").trim();

  // Picked up logic: Only include if literal text exists (as per request)
  const shipDateRaw = (getVal(/Picked up:\s*\n?(.+)/) || getVal(/Ship date:\s*\n?(.+)/)).trim();
  const pickedUpLine = shipDateRaw !== "N/A" ? `\nPicked up date: ${shipDateRaw}` : "";
  const pickedUpDateLine = shipDateRaw !== "N/A" ? `\nPicked up date: ${shipDateRaw}` : "";

  const modeUpper = mode.toUpperCase();
  let docType = (modeUpper.includes("PARCEL")) ? "POD" : "BOL";

  const carrierUpper = carrierRaw.toUpperCase();
  let email = "N/A";
  let subject = "";
  let body = "";
  let templateType = "";
  let isAmz = false;

  // --- 1. DETECT EMAIL ---
  for (const [key, val] of Object.entries(activeCarrierDB)) {
    if (carrierUpper.includes(key)) {
      email = val;
      break;
    }
  }

  // --- 2. DETECT SCENARIO ---

  const T = activeTemplates;
  const vars = { poId, tracking, carrier: carrierRaw, shipFrom, shipTo, asn, arn, docType, pickedUpLine, pickedUpDateLine };

  // A. AMAZON MANAGED (AMZX)
  if (carrierUpper.includes("AMAZON") || carrierUpper.includes("AMZX") || carrierUpper.includes("AMZ LTL") || carrierUpper.includes("AMZR") || carrierUpper.includes("MANO DELIVERY") || carrierUpper.includes("AZNG")) {
    isAmz = true;
    templateType = "AMZX Case Creation";
    subject = `BOL REQUEST - PO: ${poId}`;
    body = fillTemplate(T.amzx || DEFAULT_TEMPLATES.amzx, vars);
  }
  // B. CENTRAL TRANSPORT LTL
  else if (carrierUpper.includes("CENTRAL TRANSPORT")) {
    templateType = "Central Transport (LTL)";
    subject = `BOL REQUEST for PO ID ${poId}`;
    body = fillTemplate(T.centralTransport || DEFAULT_TEMPLATES.centralTransport, vars);
  }
  // C. UPS / FEDEX Small Parcel — only when mode is PARCEL (UPS Freight LTL/TL falls to standard LTL)
  else if ((carrierUpper.includes("UPS") || carrierUpper.includes("FEDEX")) && modeUpper.includes("PARCEL")) {
    templateType = "UPS/FedEx (Doc Request)";
    subject = `POD/BOL REQUEST for PO ID ${poId}`;
    body = fillTemplate(T.upsFedex || DEFAULT_TEMPLATES.upsFedex, vars);
  }
  // D. GENERIC SMALL PARCEL / ONTRAC / EMSY
  else if (modeUpper.includes("PARCEL") || carrierUpper.includes("ONTRAC") || carrierUpper.includes("EMSY")) {
    templateType = "Small Parcel (POD)";
    subject = `POD REQUEST for PO ID ${poId}`;
    body = fillTemplate(T.smallParcel || DEFAULT_TEMPLATES.smallParcel, vars);
  }
  // E. GENERIC LTL
  else {
    templateType = "Standard LTL (BOL)";
    subject = `BOL REQUEST for PO ID ${poId}`;
    body = fillTemplate(T.standardLtl || DEFAULT_TEMPLATES.standardLtl, vars);
  }

  // Sanitize quotes for usage in JS strings
  subject = subject.replace(/’/g, "'").replace(/[“”]/g, '"');
  body = body.replace(/’/g, "'").replace(/[“”]/g, '"');

  const isEstes = carrierUpper.includes("ESTES") || carrierUpper.includes("EXLA");
  const isUps = carrierUpper.includes("UPS") || carrierUpper.includes("UPSN");

  return { isAmz, email, subject, body, templateType, isEstes, isUps, tracking };
}

// Utility: Copy Visual Feedback
function copyToClipboard(text, element, textElement) {
  navigator.clipboard.writeText(text).then(() => {
    const original = textElement.innerText;
    textElement.innerText = "Copied!";
    element.style.backgroundColor = "#1e8e3e"; 
    element.style.color = "#fff";
    setTimeout(() => {
      textElement.innerText = original;
      element.style.backgroundColor = "#e8f0fe"; 
      element.style.color = "#1967d2";
    }, 1200);
  });
}

function truncate(str, n) {
  return (str.length > n) ? str.substr(0, n-1) + '...' : str;
}

function fillTemplate(tpl, vars) {
  return tpl.replace(/\{(\w+)\}/g, (_, key) => vars[key] !== undefined ? vars[key] : `{${key}}`);
}

// Injected Script for Amazon Vendor Central Contact Form (shadow DOM textarea)
function fillAmazonContactForm(bodyText) {
  // Find kat-textarea with multiple fallback selectors
  const katEl = document.querySelector('kat-textarea.hill-text-area')
    || document.querySelector('kat-textarea[size="large"]')
    || document.querySelector('kat-textarea');
  if (!katEl) return 'no-kat-element';

  // 1. Set value property directly on the custom element (KAT exposes .value)
  try { katEl.value = bodyText; } catch(e) {}
  katEl.setAttribute('value', bodyText);

  // 2. Pierce shadow root and fill the inner <textarea>
  const sr = katEl.shadowRoot;
  if (sr) {
    const ta = sr.querySelector('textarea');
    if (ta) {
      ta.focus();
      // Native setter bypasses framework value caching
      Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(ta, bodyText);
      ta.dispatchEvent(new InputEvent('input',  { bubbles: true, composed: true, data: bodyText }));
      ta.dispatchEvent(new Event('change',       { bubbles: true, composed: true }));
      ta.dispatchEvent(new Event('blur',         { bubbles: true, composed: true }));
    }
  }

  // 3. Fire events on the outer KAT element so its listeners pick up the change
  katEl.dispatchEvent(new InputEvent('input',  { bubbles: true, composed: true }));
  katEl.dispatchEvent(new Event('change',       { bubbles: true, composed: true }));

  return 'ok';
}

// Injected Script for Gmail
function fillGmail(subj, body, toEmail) {
  // 1. Locate "Compose" button and click it if no compose window is visible
  const existingSubject = document.querySelector('input[name="subjectbox"]');
  if (!existingSubject) {
    const composeBtn = Array.from(document.querySelectorAll('div[role="button"]'))
                            .find(el => el.innerText === "Compose" || (el.getAttribute('aria-label') && el.getAttribute('aria-label').includes("Compose")));
    if (composeBtn) composeBtn.click();
  }

  // 2. Periodically check for the compose window and fill it
  let attempts = 0;
  const checkReady = setInterval(() => {
    const toInput = document.querySelector('input[aria-label*="To"], [aria-label*="To recipients"], [name="to"], [role="combobox"]');
    const subjInput = document.querySelector('input[name="subjectbox"]');
    const bodyInput = document.querySelector('div[aria-label="Message Body"], div[role="textbox"]');

    if (subjInput && bodyInput) {
      clearInterval(checkReady);
      
      // Fill "To" field
      if (toInput && toEmail && toEmail !== "N/A") {
          toInput.focus();
          // Gmail prefers commas to trigger pills; replace semicolons
          const emailList = toEmail.replace(/;/g, ', ');
          document.execCommand('insertText', false, emailList);
          
          // Simulation of Enter key to turn text into "Pills" UI
          const enterDown = new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true });
          toInput.dispatchEvent(enterDown);
      }

      // Fill Subject
      setTimeout(() => {
        subjInput.focus();
        document.execCommand('selectAll', false, null);
        document.execCommand('insertText', false, subj);
      }, 300);

      // Fill Body
      setTimeout(() => {
          bodyInput.focus();
          // Clear and Insert
          document.execCommand('selectAll', false, null);
          document.execCommand('delete', false, null);
          
          const htmlBody = body.replace(/\n/g, '<br>');
          document.execCommand('insertHTML', false, htmlBody);
      }, 600);
    }

    if (++attempts > 20) clearInterval(checkReady); // Timeout after ~6s
  }, 300);
}