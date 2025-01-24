interface StockData {
  symbol: string
  price: number
}

const stockPrices: { [key: string]: number } = {
  AAPL: 150,
  GOOGL: 2800,
  MSFT: 300,
  AMZN: 3300,
  "^GSPC": 4500, // S&P 500
  "^DJI": 35000, // Dow Jones Industrial Average
  "^IXIC": 15000, // NASDAQ Composite
}

export function getRandomPrice(basePrice: number): number {
  const change = (Math.random() - 0.5) * 2 // Random value between -1 and 1
  return basePrice + change
}

export function simulateRealTimeData(symbol: string, callback: (data: StockData) => void) {
  let basePrice = stockPrices[symbol] || 100 // Default to 100 if symbol not found

  const intervalId = setInterval(() => {
    basePrice = getRandomPrice(basePrice)
    callback({ symbol, price: basePrice })
  }, 1000) // Update every second

  return () => clearInterval(intervalId) // Return a cleanup function
}

