/**
 * @name BetterTimestamps
 * @author R.ynox
 * @description Shows live relative time (e.g. "3m ago") next to every message timestamp. Updates automatically!
 * @version 1.1.0
 */

module.exports = class BetterTimestamps {

    constructor() {
        this._intervals = [];
        this._observer  = null;
    }

    start() {
        BdApi.DOM.addStyle("BetterTimestamps", `
            .bt-relative {
                font-size: 0.72rem;
                color: var(--text-muted);
                margin-left: 5px;
                font-style: italic;
                opacity: 0.85;
                user-select: none;
                pointer-events: none;
            }
        `);
        this._processAll();
        this._watchForNewMessages();
        BdApi.UI.showToast("BetterTimestamps enabled!", { type: "success" });
    }

    stop() {
        this._intervals.forEach(id => clearInterval(id));
        this._intervals = [];

        if (this._observer) {
            this._observer.disconnect();
            this._observer = null;
        }

        document.querySelectorAll(".bt-relative").forEach(el => el.remove());
        BdApi.DOM.removeStyle("BetterTimestamps");
        BdApi.UI.showToast("BetterTimestamps disabled.", { type: "info" });
    }

    // ── Helpers ────────────────────────────────────────────────

    _relative(ts) {
        const diff    = Date.now() - ts;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours   = Math.floor(minutes / 60);
        const days    = Math.floor(hours / 24);
        const weeks   = Math.floor(days / 7);
        const months  = Math.floor(days / 30);
        const years   = Math.floor(days / 365);

        if (seconds < 60)  return `${seconds}s ago`;
        if (minutes < 60)  return `${minutes}m ago`;
        if (hours   < 24)  return `${hours}h ago`;
        if (days    < 7)   return `${days}d ago`;
        if (weeks   < 4)   return `${weeks}w ago`;
        if (months  < 12)  return `${months}mo ago`;
        return `${years}y ago`;
    }

    _addLabel(tsEl) {
        if (tsEl.dataset.btDone) return;
        tsEl.dataset.btDone = "1";

        const timeEl  = tsEl.querySelector("time[datetime]") ?? tsEl.closest("time[datetime]");
        const isoDate = timeEl?.getAttribute("datetime");
        if (!isoDate) return;

        const ts = new Date(isoDate).getTime();
        if (isNaN(ts)) return;

        const label = document.createElement("span");
        label.className   = "bt-relative";
        label.textContent = `(${this._relative(ts)})`;
        tsEl.appendChild(label);

        const id = setInterval(() => {
            if (!document.contains(label)) { clearInterval(id); return; }
            label.textContent = `(${this._relative(ts)})`;
        }, 30_000);

        this._intervals.push(id);
    }

    _processAll() {
        document.querySelectorAll('[class*="timestamp"]').forEach(el => this._addLabel(el));
    }

    _watchForNewMessages() {
        this._observer = new MutationObserver(mutations => {
            for (const { addedNodes } of mutations) {
                for (const node of addedNodes) {
                    if (!(node instanceof HTMLElement)) continue;
                    if (typeof node.className === "string" && node.className.includes("timestamp")) {
                        this._addLabel(node);
                    }
                    node.querySelectorAll('[class*="timestamp"]').forEach(el => this._addLabel(el));
                }
            }
        });
        this._observer.observe(document.body, { childList: true, subtree: true });
    }
};
