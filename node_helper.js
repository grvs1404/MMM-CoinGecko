const NodeHelper = require("node_helper");

module.exports = NodeHelper.create({
  async socketNotificationReceived(notification, config) {
    if (notification !== "COINGECKO_FETCH") return;

    try {
      const url = new URL(`${config.apiBase}/coins/markets`);
      url.searchParams.set("vs_currency", config.vsCurrency);
      url.searchParams.set("ids", config.coins.join(","));
      url.searchParams.set("price_change_percentage", "24h");

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      const rows = data.map(c => ({
        name: c.name,
        symbol: c.symbol,
        price: c.current_price,
        change24h: c.price_change_percentage_24h || 0
      }));

      this.sendSocketNotification("COINGECKO_DATA", { rows });
    } catch (err) {
      this.sendSocketNotification("COINGECKO_ERROR", { error: err.message });
    }
  }
});
