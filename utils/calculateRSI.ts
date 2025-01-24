export function calculateRSI(prices: number[], period = 14): number {
  if (prices.length < period + 1) {
    return 0
  }

  let gains = 0
  let losses = 0

  // Calculate initial average gain and loss
  for (let i = 1; i <= period; i++) {
    const difference = prices[i] - prices[i - 1]
    if (difference >= 0) {
      gains += difference
    } else {
      losses -= difference
    }
  }

  let avgGain = gains / period
  let avgLoss = losses / period

  // Calculate RSI using the smooth RSI formula
  for (let i = period + 1; i < prices.length; i++) {
    const difference = prices[i] - prices[i - 1]
    if (difference >= 0) {
      avgGain = (avgGain * (period - 1) + difference) / period
      avgLoss = (avgLoss * (period - 1)) / period
    } else {
      avgGain = (avgGain * (period - 1)) / period
      avgLoss = (avgLoss * (period - 1) - difference) / period
    }
  }

  if (avgLoss === 0) {
    return 100
  }

  const rs = avgGain / avgLoss
  return 100 - 100 / (1 + rs)
}

