const NodeHelper = require("node_helper");

module.exports = NodeHelper.create({
  async socketNotificationReceived(notification, config) {
    if (notification !== "COINGECKO_FETCH") return;

    try {
      const apiBase = (config.apiBase || "https://api.coingecko.com/api/v3").replace(/\/+$/, "");
      const coins = (config.coins || []).map(String).filter(Boolean);
      const vsCurrency = String(config.vsCurrency || "usd").toLowerCase();
      const periods = (config.changePeriods || ["24h"]).map(p => String(p).toLowerCase());

      if (!coins.length) throw new Error("No coins configured (config.coins is empty).");

      const url = new URL(`${apiBase}/coins/markets`);
      url.searchParams.set("vs_currency", vsCurrency);
      url.searchParams.set("ids", coins.join(","));
      url.searchParams.set("order", config.sortBy || "market_cap_desc");
      url.searchParams.set("per_page", String(config.perPage || 250));
      url.searchParams.set("page", "1");
      url.searchParams.set("sparkline", "false");
      url.searchParams.set("price_change_percentage", periods.join(","));

      if (config.debug) {
        this.sendSocketNotification("COINGECKO_DEBUG", { url: url.toString() });
      }

      const res = await fetch(url.toString(), { headers: { accept: "application/json" } });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text.slice(0, 250)}`);
      }

      const data = await res.json();

      const rows = (data || []).map((c) => {
        const changes = {};
        for (const p of periods) {
          const k1 = `price_change_percentage_${p}_in_currency`;
          const k2 = `price_change_percentage_${p}`;
          const val = c[k1] ?? c[k2];
          changes[p] = (val === null || val === undefined) ? undefined : Number(val);
        }

        return {
          id: c.id,
          name: c.name,
          symbol: c.symbol,
          price: c.current_price,
          changes
        };
      });

      this.sendSocketNotification("COINGECKO_DATA", { rows });
    } catch (err) {
      this.sendSocketNotification("COINGECKO_ERROR", { error: err?.message || String(err) });
    }
  }
});
