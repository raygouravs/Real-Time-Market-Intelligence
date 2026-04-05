/*
    REFERENCES: 
    - Redis streams. Available at: https://redis.io/docs/latest/develop/data-types/streams/#consuming-data
      - referred to establish persistent connection to redis streams as given in the code example.
*/

export class AnalyticsService {
  constructor(redisRepo) {
    this.redisRepo = redisRepo;

    this.stocks = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'BRKB', 'V', 'JNJ'];

    // in-memory state
    this.memoryStore = {};
  }

  initStockSymbolInMemoryStore(symbol) {
    if (!this.memoryStore[symbol]) {
      this.memoryStore[symbol] = {
        prices: [],
        prevClose: null,
        lastPrice: null,
        trend: ""
      };
    }
  }

  // MARKET INDEX computation
  async calculateMarketIndexLineChart() {
    
    const stock_prices = [];

    for(const symbol of this.stocks){
      const stock_price = this.memoryStore[symbol].lastPrice;
      console.log(`${symbol} last price => ` + stock_price);
      if(stock_price !== null && stock_price!== undefined){
        stock_prices.push(stock_price);
      }
    }

    let price_sum = 0;

    for(const price of stock_prices){
      price_sum += Number(price);
    }

    if (stock_prices.length === 0) return;

    const indexVal = Number((price_sum/stock_prices.length).toFixed(2));
    console.log("price_sum => " + price_sum);
    console.log("stock prices length => " + stock_prices.length);
    console.log("computed market index => " + indexVal);

    await this.redisRepo.addToStream('marketindex', {
      value: indexVal
    }, 1000);

  }

  // GAINERS/LOSERS computation
  gainOrLossDashboardMetric(symbol, tick) {
    const stock = this.memoryStore[symbol]
    if(stock.prices.length < 10) {
      stock.prices.push(tick.price)
    } else {
      stock.prices.shift();
      stock.prices.push(tick.price);
    }

    stock.lastPrice = Number(tick.price);

    if(stock.prices.length > 1){
      const arrlen = stock.prices.length;
      const secondLastPrice = stock.prices[arrlen-2];
      console.log(symbol + " last price => " + stock.lastPrice);
      console.log(symbol + " second last price => " + secondLastPrice);
      if(stock.lastPrice > secondLastPrice) {
        console.log(symbol + " => " + "gaining...")
        stock.trend = "gain"
        this.redisRepo.addToStream(`analytics:${symbol}`, stock, 1000)
      } else if(stock.lastPrice < secondLastPrice) {
        console.log(symbol + " => " + "losing...")
        stock.trend = "loss"
        this.redisRepo.addToStream(`analytics:${symbol}`, stock, 1000)
      } else {
        console.log(symbol + " => " + "no change...")
        stock.trend = "none"
        this.redisRepo.addToStream(`analytics:${symbol}`, stock, 1000)
      }
    } else {
      console.log('not enough data...');
    }
  }

  // stock-tick data processing pipeline
  async processTick(stocksymbol, tick) {
    //console.log("tick data processed.." + " " + stocksymbol + ":" + " " + JSON.stringify(tick, null, 2))

    //calculate gainers/losers trend
    this.gainOrLossDashboardMetric(stocksymbol, tick)
  }

  async readStockTickData(stocksymbol) {
    let lastId = "0-0";
    //// const POLL_INTERVAL_MS = 500; // OG val
    const POLL_INTERVAL_MS = 15000;

    while (true) {
      console.log("inside while loop...");
      try {

        const redisData = await this.redisRepo.readStream(
          `ticks:${stocksymbol}`,
          lastId,
          10
        );

        //console.log("redis data =>", JSON.stringify(redisData, null, 2));


        if (redisData && redisData.length > 0) {
          console.log("data exists...");
    
          const [[, messages]] = redisData;

          for (const [id, fields] of messages) {
            lastId = id;

            const tick = {};
            for (let i = 0; i < fields.length; i += 2) {
              tick[fields[i]] = fields[i + 1];
            }

            await this.processTick(stocksymbol, tick);
          }
      }

      // Timeout before polling
      await new Promise((res) => setTimeout(res, POLL_INTERVAL_MS));
    } catch (err) {
      console.error("Error reading Redis stream:", err);
      await new Promise((res) => setTimeout(res, POLL_INTERVAL_MS));
    }
  }
}

  // Start the service
  async start() {
    console.log("Analytics Service Started...");
    const MARKET_INDEX_INTERVAL = 15000;

    for(const sym of this.stocks){
       this.initStockSymbolInMemoryStore(sym)
    }

    for(const symbol of this.stocks){
      this.readStockTickData(symbol);
    }

    setInterval(() => {
      this.calculateMarketIndexLineChart();
    }, MARKET_INDEX_INTERVAL);
  }
}
