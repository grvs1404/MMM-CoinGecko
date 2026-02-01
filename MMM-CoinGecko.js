/* global Module */

Module.register("MMM-CoinGecko", {
  defaults: {
    header: "Crypto",
    coins: ["bitcoin", "ethereum"],
    vsCurrency: "usd",
    show24hChange: true,
    updateInterval: 5 * 60 * 1000,
    retryDelay: 30 * 1000,
    apiBase: "https://api.coingecko.com/api/v3",
    locale: "en-US",
    fiatRound: 2,
    nonFiatRound: 6,
    sortBy: "market_cap_desc",
    perPage: 250,
    debug: false
  },

  start() {
    this.loaded = false;
    this.error = null;
    this.rows = [];
    this.config.vsCurrency = String(this.config.vsCurrency || "usd").toLowerCase();
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
    }

    if (notification === "COINGECKO_ERROR") {
      this.loaded = true;
      this.error = payload?.error || String(payload);
      this.updateDom();
      this.scheduleUpdate(this.config.retryDelay);
    }
  },

  isFiat(code) {
    const fiats = new Set(["usd","eur","gbp","cad","aud","jpy","chf","sek","nok","dkk"]);
    return fiats.has(code);
  },

  formatNumber(value, vsCurrency) {
    const decimals = this.isFiat(vsCurrency) ? this.config.fiatRound : this.config.nonFiatRound;
    return new Intl.NumberFormat(this.config.locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals
    }).format(value);
  },

  getDom() {
    const wrapper = document.createElement("div");

    if (!this.loaded) {
      wrapper.innerHTML = "Loading…";
      wrapper.className = "dimmed small";
      return wrapper;
    }

    if (this.error) {
      wrapper.innerHTML = `CoinGecko error: ${this.error}`;
      wrapper.className = "small bright";
      return wrapper;
    }

    if (!this.rows.length) {
      wrapper.innerHTML = "No data available.";
      wrapper.className = "dimmed small";
      return wrapper;
    }

    const table = document.createElement("table");
    table.className = "small coingecko-table";

    this.rows.forEach(r => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="left">${r.name} <span class="dimmed">(${r.symbol.toUpperCase()})</span></td>
        <td class="right">${this.formatNumber(r.price, this.config.vsCurrency)} ${this.config.vsCurrency.toUpperCase()}</td>
        ${this.config.show24hChange ? `<td class="right">${r.change24h.toFixed(2)}%</td>` : ""}
      `;
      table.appendChild(tr);
    });

    wrapper.appendChild(table);
    return wrapper;
  }
});
