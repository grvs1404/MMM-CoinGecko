# MMM-CoinGecko

A lightweight **MagicMirror²** module that displays cryptocurrency prices using the **CoinGecko** API.

- ✅ No API key required  
- ✅ Multiple coins  
- ✅ Optional column headers  
- ✅ Colorized price changes (up/down)  
- ✅ Additional change periods (1h / 24h / 7d / 30d / 1y, etc.)  

## Installation

SSH into your MagicMirror device and run:

```bash
cd ~/MagicMirror/modules
git clone https://github.com/grvs1404/MMM-CoinGecko.git
```

**Dependencies:** None. You do **not** need to run `npm install`.

## Configuration

Add this module block to your `config/config.js` inside the `modules: [ ... ]` array.

### Minimal example (defaults to USD)

```js
{
  module: "MMM-CoinGecko",
  position: "top_right",
  config: {
    coins: ["bitcoin", "ethereum"]
  }
},
```

### Example with multiple change columns

```js
{
  module: "MMM-CoinGecko",
  position: "top_center",
  config: {
    header: "Crypto",
    coins: ["bitcoin", "ethereum", "ripple", "solana", "pillar"],
    vsCurrency: "usd",
    changePeriods: ["1h", "24h", "7d", "30d"],
    showHeaders: true,
    updateInterval: 5 * 60 * 1000
  }
},
```

Restart MagicMirror:

```bash
pm2 restart mm
```

## Configuration options

| Option | Type | Default | Description |
|---|---|---|---|
| `header` | string | `"Crypto"` | Module header text |
| `coins` | string[] | `["bitcoin","ethereum"]` | **CoinGecko coin IDs** to display |
| `vsCurrency` | string | `"usd"` | Price currency (e.g., `usd`, `eur`, `btc`, `xrp`) |
| `changePeriods` | string[] | `["24h","7d"]` | Percent change columns (`"1h"`, `"24h"`, `"7d"`, `"14d"`, `"30d"`, `"200d"`, `"1y"`) |
| `showHeaders` | boolean | `true` | Show column titles row |
| `updateInterval` | number (ms) | `300000` | Refresh interval |
| `retryDelay` | number (ms) | `30000` | Retry interval after errors |
| `locale` | string | `"en-US"` | Number formatting locale |
| `fiatRound` | number | `2` | Decimal rounding for fiat vs currencies |
| `nonFiatRound` | number | `6` | Decimal rounding for non-fiat vs currencies (BTC/XRP pairs, etc.) |
| `apiBase` | string | CoinGecko v3 | Override the API base (advanced) |
| `debug` | boolean | `false` | Logs the CoinGecko request URL to MM logs |

## Coin IDs (important)

This module uses **CoinGecko coin IDs**, not ticker symbols.

Examples:

| Asset | Ticker | CoinGecko ID |
|---|---|---|
| Bitcoin | BTC | `bitcoin` |
| Ethereum | ETH | `ethereum` |
| XRP | XRP | `ripple` |
| Solana | SOL | `solana` |
| Pillar | PLR | `pillar` |

You can find coin IDs by searching on CoinGecko and using the URL slug:

- Example: `https://www.coingecko.com/en/coins/ripple` → ID is `ripple`

## Notes on rate limits

CoinGecko free endpoints may rate-limit aggressive polling. The default update interval (5 minutes) is designed to be safe.
If you run many CoinGecko modules or very frequent updates, increase `updateInterval`.

## Troubleshooting

### “No data available.”
- Check that your `coins` list uses valid CoinGecko IDs (not tickers).
- Try fewer coins to test.
- Enable `debug: true` and check `pm2 logs mm` for the request URL.

### Module doesn’t load / config parse error
- In `config.js`, make sure each module block ends with a comma **except the last**:

```js
{ module: "MMM-CoinGecko", ... },
{ module: "AnotherModule", ... },
```

### Older Node.js / fetch not found
This module uses Node’s built-in `fetch`. MagicMirror² on modern installs includes it.
If your environment is very old, upgrade Node/MagicMirror or open an issue.

## License

MIT — see [LICENSE](LICENSE).
