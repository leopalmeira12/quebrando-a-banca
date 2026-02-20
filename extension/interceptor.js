/**
 * INTERCEPTOR.JS v21.1 — Runs in PAGE's MAIN world (bypasses CSP)
 * Intercepts fetch, XHR, AND WebSocket to capture ALL data sources.
 */
(function () {
    if (window.__DT_INT) return;
    window.__DT_INT = true;

    // ── Override XMLHttpRequest ──
    var origOpen = XMLHttpRequest.prototype.open;
    var origSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.open = function (method, url) {
        this._dtUrl = url;
        return origOpen.apply(this, arguments);
    };
    XMLHttpRequest.prototype.send = function () {
        var self = this;
        this.addEventListener("load", function () {
            try {
                if (self.responseText && self.responseText.length > 50) {
                    window.postMessage({ type: "__DT_DATA__", src: "xhr", url: String(self._dtUrl || ""), body: self.responseText }, "*");
                }
            } catch (e) { }
        });
        return origSend.apply(this, arguments);
    };

    // ── Override fetch ──
    var origFetch = window.fetch;
    window.fetch = function () {
        var url = arguments[0];
        if (typeof url === "object" && url.url) url = url.url;
        return origFetch.apply(this, arguments).then(function (response) {
            var clone = response.clone();
            clone.text().then(function (text) {
                if (text && text.length > 50) {
                    window.postMessage({ type: "__DT_DATA__", src: "fetch", url: String(url || ""), body: text }, "*");
                }
            }).catch(function () { });
            return response;
        });
    };

    // ── Override WebSocket ──
    var OrigWS = window.WebSocket;
    window.WebSocket = function (url, protocols) {
        var ws = protocols ? new OrigWS(url, protocols) : new OrigWS(url);

        console.log("[DT] WebSocket opened: " + url);
        window.postMessage({ type: "__DT_WS_OPEN__", url: String(url) }, "*");

        ws.addEventListener("message", function (evt) {
            var data = evt.data;
            if (typeof data === "string" && data.length > 10) {
                window.postMessage({ type: "__DT_DATA__", src: "ws", url: String(url), body: data }, "*");
            }
        });

        return ws;
    };
    // Preserve prototype and static props
    window.WebSocket.prototype = OrigWS.prototype;
    window.WebSocket.CONNECTING = OrigWS.CONNECTING;
    window.WebSocket.OPEN = OrigWS.OPEN;
    window.WebSocket.CLOSING = OrigWS.CLOSING;
    window.WebSocket.CLOSED = OrigWS.CLOSED;

    console.log("%c[DT] Interceptor v21.1 ACTIVE (fetch + XHR + WebSocket)", "color:#0f0;font-weight:bold;font-size:13px");
})();
