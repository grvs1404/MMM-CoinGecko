/* global Module */

Module.register("MMM-CoinGecko", {
  defaults: {
    header: "Crypto",

    /**
     * CoinGecko coin IDs (NOT tickers). Examples:
     *  - bitcoin
     *  - ethereum
     *  - ripple   (XRP)
     *  - solana
     *  - pillar   (PLR)
     */
    coins: ["bitcoin", "ethereum"],

    /** Single vs-currency (default: usd). Examples: usd, eur, btc, xrp */
    vsCurrency: "usd",

    /**
     * Change periods to display as columns.
     * Supported by CoinGecko for /coins/markets:
     *  "1h","24h","7d","14d","30d","200d","1y"
     */
    changePeriods: ["24h", "7d"],

    /** Show a header row with column titles */
    showHeaders: true,

    /** Update intervals */
    updateInterval: 5 * 60 * 1000, // 5 minutes
    retryDelay: 30 * 1000,         // 30 seconds

    /** API base */
    apiBase: "https://api.coingecko.com/api/v3",

    /** Number formatting */
    locale: "en-US",
    fiatRound: 2,
    nonFiatRound: 6,

    /**
     * Market ordering (CoinGecko-supported for /coins/markets).
     * You are also filtering by ids, so this mainly affects the returned order
     * if CoinGecko decides to reorder.
     */
    sortBy: "market_cap_desc",
    perPage: 250,

    /** Debug logging */
    debug: false
  },

  start() {
    this.loaded = false;
    this.error = null;
    this.rows = [];

    // Defensive normalization
    this.config.vsCurrency = String(this.config.vsCurrency || "usd").toLowerCase();
    this.config.changePeriods = (this.config.changePeriods || ["24h"]).map(p => String(p).toLowerCase());

    this.scheduleUpdate(0);
  },

  getStyles() {
    return ["styles.css"];
  },

  getHeader() {
    return this.config.header;
  },

  scheduleUpdate(delay) {
    setTimeout(() => {
      this.sendSocketNotification("COINGECKO_FETCH", this.config);
    }, delay);
  },

  socketNotificationReceived(notification, payload) {
    if (notification === "COINGECKO_DATA") {
      this.loaded = true;
      this.error = null;
      this.rows = payload.rows || [];
      this.updateDom();
      this.scheduleUpdate(this.config.updateInterval);
      return;
    }

    if (notification === "COINGECKO_ERROR") {
      this.loaded = true;
      this.error = payload?.error || String(payload);
      this.updateDom();
      this.scheduleUpdate(this.config.retryDelay);
      return;
    }

    if (notification === "COINGECKO_DEBUG" && this.config.debug) {
      // eslint-disable-next-line no-console
      console.log("[MMM-CoinGecko]", payload);
    }
  },

  isFiat(code) {
    const fiats = new Set([
      "usd","eur","gbp","cad","aud","jpy","chf","sek","nok","dkk",
      "pln","czk","huf","try","inr","brl","mxn","zar","sgd","hkd","nzd"
    ]);
    return fiats.has(String(code).toLowerCase());
  },

  formatNumber(value, vsCurrency) {
    const isFiat = this.isFiat(vsCurrency);
    const decimals = isFiat ? this.config.fiatRound : this.config.nonFiatRound;

    return new Intl.NumberFormat(this.config.locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals
    }).format(value);
  },

  getDom() {
    const wrapper = document.createElement("div");
    wrapper.className = "coingecko-wrapper";

    if (!this.loaded) {
      const loading = document.createElement("div");
      loading.className = "dimmed light small";
      loading.innerText = "Loading…";
      wrapper.appendChild(loading);
      return wrapper;
    }

    if (this.error) {
      const err = document.createElement("div");
      err.className = "small bright";
      err.innerText = `CoinGecko error: ${this.error}`;
      wrapper.appendChild(err);
      return wrapper;
    }

    if (!this.rows.length) {
      const empty = document.createElement("div");
      empty.className = "dimmed small";
      empty.innerText = "No data available.";
      wrapper.appendChild(empty);
      return wrapper;
    }

    const table = document.createElement("table");
    table.className = "small coingecko-table";

    const periods = (this.config.changePeriods || []).map(p => String(p).toLowerCase());
    const vs = String(this.config.vsCurrency).toUpperCase();

    if (this.config.showHeaders) {
      const hr = document.createElement("tr");
      hr.className = "coingecko-header-row";

      const periodLabels = periods.map(p => p.toUpperCase());
      hr.innerHTML = `
        <th class="left">Coin</th>
        <th class="right">Price (${vs})</th>
        ${periodLabels.map(p => `<th class="right">${p}</th>`).join("")}
      `;
      table.appendChild(hr);
    }

    this.rows.forEach((r) => {
      const tr = document.createElement("tr");

      const coinCell = document.createElement("td");
      coinCell.className = "left";
      coinCell.innerHTML = `${r.name} <span class="dimmed">(${String(r.symbol).toUpperCase()})</span>`;
      tr.appendChild(coinCell);

      const priceCell = document.createElement("td");
      priceCell.className = "right";
      priceCell.innerHTML = `${this.formatNumber(r.price, this.config.vsCurrency)} <span class="dimmed">${vs}</span>`;
      tr.appendChild(priceCell);

      periods.forEach((p) => {
        const pct = Number(r.changes?.[p]);
        const td = document.createElement("td");
        td.className = "right";

        if (Number.isFinite(pct)) {
          const cls = pct > 0 ? "pos" : (pct < 0 ? "neg" : "flat");
          td.innerHTML = `<span class="${cls}">${pct.toFixed(2)}%</span>`;
        } else {
          td.innerHTML = `<span class="dimmed">—</span>`;
        }

        tr.appendChild(td);
      });

      table.appendChild(tr);
    });

    wrapper.appendChild(table);
    return wrapper;
  }
});
