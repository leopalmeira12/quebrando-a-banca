/**
 * DOZEN TRACKER v25.6 - BACKGROUND VISION ENGINE
 * Always captures the BETANO tab, even if user is on another tab.
 */
const BACKEND = "http://127.0.0.1:5000";
let visionRunning = false;
let betanoTabId = null;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "START_VISION") {
        betanoTabId = sender.tab.id;
        if (!visionRunning) {
            visionRunning = true;
            startVisionLoop();
        }
    }
});

async function findBetanoTab() {
    return new Promise((resolve) => {
        chrome.tabs.query({ url: "*://*.betano.bet.br/*" }, (tabs) => {
            if (tabs && tabs.length > 0) {
                resolve(tabs[0]);
            } else {
                // Try broader match
                chrome.tabs.query({}, (allTabs) => {
                    const bt = allTabs.find(t => t.url && t.url.includes("betano"));
                    resolve(bt || null);
                });
            }
        });
    });
}

async function captureTab(tab) {
    return new Promise((resolve) => {
        // captureVisibleTab captures the active tab in a window
        // So we need to capture from the window where Betano is
        chrome.tabs.captureVisibleTab(tab.windowId, { format: "jpeg", quality: 40 }, (dataUrl) => {
            if (chrome.runtime.lastError) {
                resolve(null);
            } else {
                resolve(dataUrl);
            }
        });
    });
}

async function startVisionLoop() {
    console.log("[VISION] Loop iniciado. Buscando aba Betano...");

    while (visionRunning) {
        try {
            const tab = await findBetanoTab();

            if (tab) {
                // Ensure Betano tab is the active tab in its window for capture
                await new Promise((resolve) => {
                    chrome.tabs.update(tab.id, { active: true }, () => {
                        // Small delay to let browser render the tab
                        setTimeout(resolve, 300);
                    });
                });

                const dataUrl = await captureTab(tab);

                if (dataUrl) {
                    const response = await fetch(BACKEND + "/roulette/vision", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ image: dataUrl })
                    });

                    const data = await response.json();

                    if (data.alerts && data.alerts.length > 0) {
                        // Send signal to the Betano tab
                        chrome.tabs.sendMessage(tab.id, {
                            type: "AI_SIGNAL",
                            alerts: data.alerts
                        });
                    }
                }
            }
        } catch (e) {
            console.warn("[VISION] Erro:", e.message);
        }

        await new Promise(r => setTimeout(r, 4000));
    }
}

// Auto-inject content script on Betano pages
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete" && tab.url && tab.url.includes("betano")) {
        betanoTabId = tabId;
        chrome.scripting.executeScript({
            target: { tabId },
            files: ["content.js"]
        }).catch(() => { });
    }
});
