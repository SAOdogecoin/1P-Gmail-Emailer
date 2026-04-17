/* 
   Background Service Worker - 1P Gmail Emailer
   Automates the find/open Gmail flow upon click in content script
*/

const DEFAULT_DB = {
  "UPS": "preferred.us@ups.com; gfaubion@ups.com",
  "FEDEX": "N/A", 
  "ONTRAC": "AmazonSAGTeam@OnTrac.co", 
  "CENTRAL TRANSPORT": "cs.pickup@centraltransport.com; pickup@centraltransport.com; cs@centraltransport.com", 
  "DAY AND ROSS": "DRAM@dayandrossinc.ca; custservice@dayandrossinc.ca",
  "SPEEDY TRANSPORT": "information@speedy.ca",
  "ABF FREIGHT": "amazon@abf.com",
  "QUIK X": "pbarnes@quikx.com",
  "FEDERAL GATEWAY": "info@federalmovingandstorage.com",
  "XPO LOGISTICS": "LTL.Amazon@xpo.com",
  "ROCO FREIGHT": "alexander.tomlin@rxo.com",
  "SWIFT TRANSPORTATION": "Amazon@swifttrans.com",
  "TFORCE FREIGHT": "tracking@tforcefreightcanada.com",
  "TFIN": "tracking@tforcefreightcanada.com",
  "AAA COOPER": "AmazonLT@aaacooper.com",
  "ECHO GLOBAL": "info@echo.com",
  "OLD DOMINION": "customer.service@odfl.com",
  "HAPAG LLOYD": "hapag.docs.ph@benline.com",
  "MAERSK": "toc@amazon.com",
  "ESTES": "WebSupport@estes-express.com",
  "FALCON LOGISTICS": "support@falconlanelogistics.com",
  "PALLETLINE": "info@palletline.co.uk",
  "PLTLN": "info@palletline.co.uk"
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "processAmazonData") {
        chrome.storage.local.get(['carrierSettings', 'asnMappings'], (result) => {
            const mappings = result.asnMappings || {};
            const mappedPO = (message.asn && mappings[message.asn]) ? mappings[message.asn] : null;
            const finalPO = mappedPO || message.extractedPO;

            chrome.storage.local.set({ lastCopiedData: message.text, lastExtractedPO: finalPO });

            const db = result.carrierSettings || DEFAULT_DB;
            const data = parseAmazonData(message.text, db, finalPO);

            if (data.isAmz && sender.tab) {
                chrome.scripting.executeScript({
                    target: { tabId: sender.tab.id },
                    func: (bodyText) => navigator.clipboard.writeText(bodyText),
                    args: [data.body]
                });
            }

            routeAction(data);
            sendResponse({ isAmz: data.isAmz, isEstes: data.isEstes, isUps: data.isUps, tracking: data.tracking });
        });
        return true;
    }
    if (message.action === "autoAct") {
        routeAction(message.data);
        sendResponse({ ok: true });
        return true;
    }
});

function routeAction(data) {
    if (data.isAmz) {
        focusOrOpenContactTab(data.body);
    } else if (data.isEstes && data.tracking && data.tracking !== "N/A") {
        chrome.tabs.create({ url: `https://www.estes-express.com/myestes/shipment-tracking/?query=${data.tracking}&type=PRO` });
    } else if (data.isUps && data.tracking && data.tracking !== "N/A") {
        chrome.tabs.create({ url: `https://www.ups.com/track?loc=en_US&tracknum=${data.tracking}` }, (newTab) => {
            // Wait for page to load, then click POD link if present
            const poll = setInterval(() => {
                chrome.tabs.get(newTab.id, (tab) => {
                    if (!tab) { clearInterval(poll); return; }
                    if (tab.status === 'complete') {
                        clearInterval(poll);
                        setTimeout(() => {
                            chrome.scripting.executeScript({
                                target: { tabId: newTab.id },
                                func: clickUpsPod
                            }).catch(() => {});
                        }, 2500);
                    }
                });
            }, 500);
        });
    } else if (data.email && data.email !== "N/A") {
        automateGmailCompose(data);
    }
}

function focusOrOpenContactTab(bodyText) {
    chrome.tabs.query({ url: "*://vendorcentral.amazon.com/hz/vendor/members/contact*" }, (tabs) => {
        if (tabs.length > 0) {
            const tab = tabs[0];
            chrome.windows.update(tab.windowId, { focused: true }, () => {
                chrome.tabs.update(tab.id, { active: true }, () => {
                    chrome.scripting.executeScript({
                        target: { tabId: tab.id },
                        func: fillAmazonContactFormBg,
                        args: [bodyText]
                    }).catch(() => {});
                });
            });
        } else {
            chrome.tabs.create({ url: "https://vendorcentral.amazon.com/hz/vendor/members/contact" });
        }
    });
}

// Injected into UPS tracking page to auto-click the Proof of Delivery link
function clickUpsPod() {
    let attempts = 0;
    const poll = setInterval(() => {
        const el = document.getElementById('stApp_btnProofOfDeliveryonDetails')
            || Array.from(document.querySelectorAll('a.ups-link')).find(a => /proof of delivery/i.test(a.innerText));
        if (el) {
            clearInterval(poll);
            el.click();
        }
        if (++attempts > 30) clearInterval(poll); // ~15s timeout
    }, 500);
}

function automateGmailCompose(data) {
    chrome.tabs.query({ url: "*://mail.google.com/*" }, (tabs) => {
        if (tabs.length > 0) {
            const gmailTab = tabs[0];
            chrome.windows.update(gmailTab.windowId, { focused: true });
            chrome.tabs.update(gmailTab.id, { active: true }, () => {
                chrome.scripting.executeScript({
                    target: { tabId: gmailTab.id },
                    func: fillGmail,
                    args: [data.subject, data.body, data.email]
                });
            });
        } else {
            chrome.tabs.create({ url: "https://mail.google.com/" }, (newTab) => {
                const checkStatus = setInterval(() => {
                    chrome.tabs.get(newTab.id, (tab) => {
                        if (tab && tab.status === 'complete') {
                            clearInterval(checkStatus);
                            chrome.scripting.executeScript({
                                target: { tabId: newTab.id },
                                func: fillGmail,
                                args: [data.subject, data.body, data.email]
                            });
                        }
                    });
                }, 1000);
            });
        }
    });
}

// Injected into the Amazon contact page to fill the shadow DOM textarea
function fillAmazonContactFormBg(bodyText) {
  const katEl = document.querySelector('kat-textarea.hill-text-area')
    || document.querySelector('kat-textarea[size="large"]')
    || document.querySelector('kat-textarea');
  if (!katEl) return false;

  try { katEl.value = bodyText; } catch(e) {}
  katEl.setAttribute('value', bodyText);

  const sr = katEl.shadowRoot;
  if (sr) {
    const ta = sr.querySelector('textarea');
    if (ta) {
      ta.focus();
      Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(ta, bodyText);
      ta.dispatchEvent(new InputEvent('input',  { bubbles: true, composed: true, data: bodyText }));
      ta.dispatchEvent(new Event('change',       { bubbles: true, composed: true }));
      ta.dispatchEvent(new Event('blur',         { bubbles: true, composed: true }));
    }
  }

  katEl.dispatchEvent(new InputEvent('input',  { bubbles: true, composed: true }));
  katEl.dispatchEvent(new Event('change',       { bubbles: true, composed: true }));
  return true;
}

// Injected Logic (Duplicated for availability in Service Worker context)
function fillGmail(subj, body, toEmail) {
  const existingSubject = document.querySelector('input[name="subjectbox"]');
  if (!existingSubject) {
    const composeBtn = Array.from(document.querySelectorAll('div[role="button"]'))
                            .find(el => el.innerText === "Compose" || (el.getAttribute('aria-label') && el.getAttribute('aria-label').includes("Compose")));
    if (composeBtn) composeBtn.click();
  }

  let attempts = 0;
  const checkReady = setInterval(() => {
    const toInput = document.querySelector('input[aria-label*="To"], [aria-label*="To recipients"], [name="to"], [role="combobox"]');
    const subjInput = document.querySelector('input[name="subjectbox"]');
    const bodyInput = document.querySelector('div[aria-label="Message Body"], div[role="textbox"]');

    if (subjInput && bodyInput) {
      clearInterval(checkReady);
      
      if (toInput && toEmail && toEmail !== "N/A") {
          toInput.focus();
          const emailList = toEmail.replace(/;/g, ', ');
          document.execCommand('insertText', false, emailList);
          toInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));
      }

      setTimeout(() => {
        subjInput.focus();
        document.execCommand('selectAll', false, null);
        document.execCommand('insertText', false, subj);
      }, 300);

      setTimeout(() => {
          bodyInput.focus();
          document.execCommand('selectAll', false, null);
          document.execCommand('delete', false, null);
          const htmlBody = body.replace(/\n/g, '<br>');
          document.execCommand('insertHTML', false, htmlBody);
      }, 600);
    }
    if (++attempts > 20) clearInterval(checkReady);
  }, 300);
}

// Data Parser logic (Duplicated for Service Worker)
function parseAmazonData(text, db, prePickedPO) {
  const getVal = (r) => { const m = text.match(r); return m && m[1] ? m[1].trim() : "N/A"; };
  
  const carrierRaw = (getVal(/Carrier:\s*\n(.+)/) || getVal(/Carrier:\s*(.+)/)).trim();
  let tracking = getVal(/Carrier tracking.*PRO.*:\s*\n?([A-Z0-9]+)/i);
  if (tracking === "N/A") tracking = getVal(/Carrier tracking[^:\n]*:\s*\n?([A-Z0-9]+)/i);
  if (tracking === "N/A") tracking = getVal(/Tracking[^:\n]*(?:number|#|ID)[^:\n]*:\s*\n?([A-Z0-9]+)/i);
  const mode = getVal(/Mode:\s*\n?(.+)/);
  const poMatch = text.match(/\bPurchase order\b[\s\S]{0,1000}?\b([A-Z0-9]*\d[A-Z0-9]{6,11})\b/i);
  let poId = prePickedPO || (poMatch ? poMatch[1] : "N/A");
  const asn = getVal(/Shipment ID \(ASN\):\s*\n?(\d+)/);
  const arn = getVal(/ARN\s*#:\s*\n?(\d+)/);
  
  // If the extracted PO is a dictionary word (all letters), fallback to something else or just check it more strictly
  // Note: Most Amazon POs have a digit.
  
  const shipFrom = (getVal(/Ship from:\s*\n([\s\S]+?)(?=\nShip to)/)).replace(/\n/g, ", ");
  let shipToRaw = getVal(/Ship to:\s*\n([\s\S]+?)(?=\nYour reference)/);
  if (shipToRaw !== "N/A") {
      shipToRaw = shipToRaw.split(/ASN\s*(?:number|#)|ARN\s*#/i)[0]; 
  }
  const shipTo = shipToRaw.replace(/\n/g, ", ").replace(/,\s*$/, "").trim();

  const shipDateRaw = (getVal(/Picked up:\s*\n?(.+)/) || getVal(/Ship date:\s*\n?(.+)/)).trim();
  const pickedUpLine = shipDateRaw !== "N/A" ? `\nPicked up: ${shipDateRaw}` : "";

  const modeUpper = mode.toUpperCase();
  let docType = (modeUpper.includes("PARCEL")) ? "POD" : "BOL";

  const carrierUpper = carrierRaw.toUpperCase();
  let email = "N/A";
  for (const [key, val] of Object.entries(db)) {
    if (carrierUpper.includes(key)) {
      email = val;
      break;
    }
  }

  const isAmz = carrierUpper.includes("AMAZON") || carrierUpper.includes("AMZX") || carrierUpper.includes("AMZ LTL") || carrierUpper.includes("AMZR") || carrierUpper.includes("MANO DELIVERY") || carrierUpper.includes("AZNG");
  let subject = "";
  let body = "";

  if (isAmz) {
    subject = `BOL REQUEST - PO: ${poId}`;
    body = `Hi Amazon Freight Support Team,\n\nWe are requesting for the signed BOL for PO ID ${poId}. We require this documentation to investigate a shortage.\n\nAssociated ASN/ARN: ${asn} / ${arn}\n\nPlease provide a high-resolution copy of the BOL (Bill of Lading) indicating the Amazon stamp and/or the receiver’s signature confirming the pallet/unit count.\n\nNote: This is an AMZX shipment, hence please do not advise us to contact the carrier directly since the shipment page instructs us to create a case for delivery-related issues.\n\n"This shipment has been assigned to an Amazon-managed carrier. For assistance, go to Support and select Contact us, select Shipments, and then select the relevant issue type."\n\nThanks.`;
  } else if (carrierUpper.includes("CENTRAL TRANSPORT")) {
    subject = `${docType} REQUEST for PO ID ${poId}`;
    body = `Hi,\n\nWe are requesting the signed BOL for PO ID ${poId}. We require this documentation to investigate a shortage claim.\n\nCarrier tracking or PRO number: ${tracking}${pickedUpLine}\nShip to: ${shipTo}\nShip from: ${shipFrom}\n\nPlease provide a high-resolution copy of the BOL (Bill of Lading) indicating the Amazon stamp and/or the receiver’s signature confirming the pallet/unit count.\n\nThank you.`;
  } else if (carrierUpper.includes("UPS") || carrierUpper.includes("FEDEX")) {
    subject = `${docType} REQUEST for PO ID ${poId}`;
    body = `Hi ${carrierRaw} Support Team,\n\nWe are writing to request a formal Proof of Delivery (POD) for a shipment that is no longer appearing in the active tracking system. Because the tracking has expired, we are unable to download the documentation via the standard carrier portal.\n\nShipment Information:\nTracking Number: ${tracking}\nShip from Address: ${shipFrom}\nShip to Address: ${shipTo}\n\nFor shortage claim purposes, we need a copy of the delivery record, specifically showing the weight of the package, delivery address, date/time, and the signature/name of the individual who accepted the package.\n\nThank you for your assistance in locating this archived record.`;
  } else if (modeUpper.includes("PARCEL")) {
    subject = `${docType} REQUEST for PO ID ${poId}`;
    body = `Hi ${carrierRaw} Support Team,\n\nWe are writing to request a formal Proof of Delivery (POD) for a shipment that is no longer appearing in the active tracking system. Because the tracking has expired, we are unable to download the documentation via the standard carrier portal.\n\nShipment Information:\nTracking Number: ${tracking}\nShipper Address: ${shipFrom}\nRecipient Address: ${shipTo}\n\nFor shortage claim purposes, we need a copy of the delivery record, specifically showing the delivery address, date/time, and the signature/name of the individual who accepted the package.\n\nThank you for your assistance in locating this archived record.`;
  } else {
    subject = `${docType} REQUEST for PO ID ${poId}`;
    body = `Hi,\n\nWe are requesting for the signed BOL for PO ID ${poId}. We require this documentation to investigate a shortage claim.\n\nPRO number: ${tracking}${pickedUpLine}\nShip from: ${shipFrom}\nShip to: ${shipTo}\n\nPlease provide a high-resolution copy of the signed BOL (Bill of Lading) indicating the Amazon stamp and/or the receiver’s signature confirming the pallet/unit count.\n\nThank you.`;
  }

  const isEstes = carrierUpper.includes("ESTES") || carrierUpper.includes("EXLA");
  const isUps = carrierUpper.includes("UPS") || carrierUpper.includes("UPSN");

  return { isAmz, isEstes, isUps, tracking, email, subject, body, poId };
}
