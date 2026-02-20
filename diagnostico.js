/**
 * COLE ESTE SCRIPT NO CONSOLE DO CHROME (F12 > Console)
 * na página do lobby da Betano.
 * Ele vai mostrar EXATAMENTE o que a extensão intercepta.
 */

// Interceptar WebSocket
(function () {
    var OrigWS = window.WebSocket;
    var wsCount = 0;

    window.WebSocket = function (url, protocols) {
        var ws = protocols ? new OrigWS(url, protocols) : new OrigWS(url);
        wsCount++;
        console.log('%c[DIAG] WS #' + wsCount + ' aberto: ' + url, 'color:#0ff;font-weight:bold');

        ws.addEventListener('message', function (evt) {
            var data = evt.data;
            var type = typeof data;
            var len = data ? (data.byteLength || data.size || data.length || 0) : 0;

            if (type === 'string' && len > 20 && len < 5000) {
                // Try JSON
                try {
                    var json = JSON.parse(data);
                    var keys = Object.keys(json);
                    console.log('%c[DIAG-WS-JSON] keys=' + keys.join(',') + ' | ' + data.substring(0, 300), 'color:#ff0');
                } catch (e) {
                    console.log('[DIAG-WS-TEXT] len=' + len + ' | ' + data.substring(0, 200));
                }
            } else if (data instanceof ArrayBuffer || data instanceof Blob) {
                console.log('[DIAG-WS-BIN] type=' + type + ' len=' + len);
                // Try to read binary as text
                if (data instanceof Blob) {
                    data.text().then(function (t) {
                        if (t.length > 20 && t.length < 5000) {
                            try {
                                var j = JSON.parse(t);
                                console.log('%c[DIAG-WS-BLOB-JSON] ' + JSON.stringify(j).substring(0, 500), 'color:#0f0;font-weight:bold');
                            } catch (e) {
                                console.log('[DIAG-WS-BLOB-TEXT] ' + t.substring(0, 200));
                            }
                        }
                    });
                }
            }
        });

        return ws;
    };
    window.WebSocket.prototype = OrigWS.prototype;
    window.WebSocket.CONNECTING = 0;
    window.WebSocket.OPEN = 1;
    window.WebSocket.CLOSING = 2;
    window.WebSocket.CLOSED = 3;

    // Interceptar fetch
    var origFetch = window.fetch;
    window.fetch = function () {
        var url = arguments[0];
        if (typeof url === 'object') url = url.url;
        return origFetch.apply(this, arguments).then(function (resp) {
            var clone = resp.clone();
            clone.text().then(function (text) {
                if (text.length > 50 && text.length < 10000) {
                    try {
                        var j = JSON.parse(text);
                        // Look for arrays with numbers
                        var str = JSON.stringify(j).substring(0, 500);
                        if (/\d{1,2}/.test(str) && /"(roulette|roleta|table|game|room|lobby)/i.test(str)) {
                            console.log('%c[DIAG-FETCH-MATCH] url=' + url + ' | ' + str, 'color:#0f0;font-weight:bold;font-size:12px');
                        }
                    } catch (e) { }
                }
            });
            return resp;
        });
    };

    // Interceptar XHR
    var origOpen = XMLHttpRequest.prototype.open;
    var origSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.open = function (m, url) { this._url = url; return origOpen.apply(this, arguments); };
    XMLHttpRequest.prototype.send = function () {
        var self = this;
        this.addEventListener('load', function () {
            try {
                var text = self.responseText;
                if (text && text.length > 50 && text.length < 10000) {
                    var j = JSON.parse(text);
                    var str = JSON.stringify(j).substring(0, 500);
                    if (/\d{1,2}/.test(str) && /"(roulette|roleta|table|game|room|lobby)/i.test(str)) {
                        console.log('%c[DIAG-XHR-MATCH] url=' + self._url + ' | ' + str, 'color:#0f0;font-weight:bold;font-size:12px');
                    }
                }
            } catch (e) { }
        });
        return origSend.apply(this, arguments);
    };

    console.log('%c[DIAG] Diagnostico ativo! Interceptando fetch + XHR + WebSocket. Aguarde 10-30 segundos...', 'background:#0a0;color:#fff;font-size:16px;padding:8px');
    console.log('%cProcure por linhas VERDES ou AMARELAS abaixo.', 'color:#ff0;font-size:14px');
})();
