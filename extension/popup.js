(function () {
    var BACKEND = "http://127.0.0.1:5000";

    // ── Tabs ──
    document.querySelectorAll(".tab").forEach(function (tab) {
        tab.addEventListener("click", function () {
            document.querySelectorAll(".tab").forEach(function (t) { t.classList.remove("active"); });
            document.querySelectorAll(".panel").forEach(function (p) { p.classList.remove("active"); });
            tab.classList.add("active");
            document.getElementById("p-" + tab.dataset.tab).classList.add("active");
        });
    });

    // ── Load Config ──
    function loadConfig() {
        fetch(BACKEND + "/roulette/config")
            .then(function (r) { return r.json(); })
            .then(function (d) {
                if (d && d.threshold) document.getElementById("th").value = d.threshold;
                document.getElementById("api-status").textContent = "\u2705 Conectado";
                document.getElementById("api-status").style.color = "#00ffa3";
            })
            .catch(function () {
                document.getElementById("api-status").textContent = "\u274C Offline";
                document.getElementById("api-status").style.color = "#ff4757";
            });
    }

    // ── Save Config ──
    document.getElementById("save").onclick = function () {
        var val = parseInt(document.getElementById("th").value, 10);
        if (isNaN(val) || val < 1) return;
        var btn = document.getElementById("save");
        btn.textContent = "...";
        btn.disabled = true;
        fetch(BACKEND + "/roulette/config", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ threshold: val })
        })
            .then(function (r) { return r.json(); })
            .then(function () {
                btn.textContent = "\u2713";
                btn.classList.add("saved");
                setTimeout(function () { btn.textContent = "Salvar"; btn.classList.remove("saved"); btn.disabled = false; }, 1200);
            })
            .catch(function () {
                btn.textContent = "Erro";
                btn.style.background = "#ff4757"; btn.style.color = "#fff";
                setTimeout(function () { btn.textContent = "Salvar"; btn.style.background = ""; btn.style.color = ""; btn.disabled = false; }, 1500);
            });
    };

    // ── Reset Data ──
    document.getElementById("reset-btn").onclick = function () {
        var btn = document.getElementById("reset-btn");
        if (!confirm("Limpar TODOS os dados de salas? Isso zera contagens.")) return;
        btn.textContent = "...";
        btn.disabled = true;
        fetch(BACKEND + "/roulette/reset", { method: "POST" })
            .then(function (r) { return r.json(); })
            .then(function () {
                btn.textContent = "\u2713 Limpo";
                setTimeout(function () { btn.textContent = "Resetar Dados"; btn.disabled = false; loadRooms(); }, 1500);
            })
            .catch(function () {
                btn.textContent = "Erro";
                setTimeout(function () { btn.textContent = "Resetar Dados"; btn.disabled = false; }, 1500);
            });
    };

    // ── Load Rooms ──
    var urlMap = {};

    function loadUrlMap() {
        try {
            chrome.storage.local.get("urlMap", function (result) {
                if (result && result.urlMap) urlMap = result.urlMap;
            });
        } catch (e) { }
    }

    function getUrl(roomName) {
        var key = roomName.replace(/\s+/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
        // Direct match
        if (urlMap[key]) return urlMap[key].url;
        // Fuzzy match
        var keys = Object.keys(urlMap);
        for (var i = 0; i < keys.length; i++) {
            if (keys[i].includes(key) || key.includes(keys[i])) return urlMap[keys[i]].url;
        }
        return "";
    }

    function loadRooms() {
        loadUrlMap();
        fetch(BACKEND + "/roulette/status")
            .then(function (r) { return r.json(); })
            .then(function (data) {
                var rooms = data.rooms || [];
                var th = data.threshold || 6;
                var list = document.getElementById("rooms-list");

                if (rooms.length === 0) {
                    list.innerHTML = '<div class="empty">Nenhuma sala ativa.<br>Abra o lobby da Betano.</div>';
                    document.getElementById("st-total").textContent = "0";
                    document.getElementById("st-hot").textContent = "0";
                    document.getElementById("st-warn").textContent = "0";
                    return;
                }

                rooms.sort(function (a, b) { return (b.zigzag || 0) - (a.zigzag || 0); });

                var html = "";
                var hot = 0, warn = 0;

                rooms.forEach(function (room) {
                    var zz = room.zigzag || 0;
                    var ratio = zz / th;
                    var cls = "", icon = "\uD83D\uDFE2";

                    if (ratio >= 1) { cls = "hot"; icon = "\uD83D\uDD34"; hot++; }
                    else if (ratio >= 0.6) { cls = "warn"; icon = "\uD83D\uDFE0"; warn++; }

                    var name = room.room_name || "Sala";
                    var url = getUrl(name);

                    html += '<div class="room ' + cls + '"' + (url ? ' data-url="' + url + '"' : '') + '>' +
                        '<div class="r-icon">' + icon + '</div>' +
                        '<div class="r-body">' +
                        '<div class="r-name">' + name + '</div>' +
                        '<div class="r-sub">' + (ratio >= 1 ? '\uD83C\uDFAF SINAL ATIVO' + (url ? '' : ' \u00B7 sem link') : 'Monitorando') + '</div>' +
                        '</div>' +
                        '<div class="r-count">' + zz + 'x</div>' +
                        '</div>';
                });

                list.innerHTML = html;
                document.getElementById("st-total").textContent = rooms.length;
                document.getElementById("st-hot").textContent = hot;
                document.getElementById("st-warn").textContent = warn;

                list.querySelectorAll(".room[data-url]").forEach(function (el) {
                    el.style.cursor = "pointer";
                    el.addEventListener("click", function () {
                        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                            if (tabs[0]) chrome.tabs.update(tabs[0].id, { url: el.dataset.url });
                        });
                    });
                });
            })
            .catch(function () {
                document.getElementById("rooms-list").innerHTML = '<div class="empty">\u274C Backend offline.<br>Inicie localhost:5000</div>';
            });
    }

    loadConfig();
    loadRooms();
    setInterval(loadRooms, 4000);
})();
