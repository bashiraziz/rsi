import { NextResponse } from "next/server"

const BASE_URL = "https://api.polygon.io/v2"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get("symbol")
  const type = "history"

  if (!symbol) {
    return NextResponse.json({ error: "Symbol is required" }, { status: 400 })
  }

  const apiKey = process.env.POLYGON_API_KEY
  if (!apiKey) {
    console.error("POLYGON_API_KEY is not set")
    return NextResponse.json({ error: "API key is not configured" }, { status: 500 })
  }

  try {
    if (type === "history") {
      const endDate = new Date().toISOString().split("T")[0]
      // Fetch data for the last 60 days to ensure we have enough for all RSI periods
      const startDate = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
      const url = `${BASE_URL}/aggs/ticker/${symbol}/range/1/day/${startDate}/${endDate}?apiKey=${apiKey}&sort=asc&limit=60`

      console.log("Fetching historical data for symbol:", symbol)

      const response = await fetch(url)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch historical data")
      }

      if (data.results && data.results.length > 0) {
        interface Result {
          t: number;
          c: number;
        }

        const pricesWithDates = data.results.map((result: Result) => ({
          date: new Date(result.t).toISOString().split("T")[0],
          price: result.c,
        }))

        console.log("Raw price data:", JSON.stringify(pricesWithDates, null, 2))

        interface PriceWithDate {
          date: string;
          price: number;
        }

        const prices: number[] = pricesWithDates.map((entry: PriceWithDate) => entry.price)
        const dates: string[] = pricesWithDates.map((entry: PriceWithDate) => entry.date)

        return NextResponse.json({
          prices,
          dates,
          rawData: pricesWithDates, // Include raw data for verification
        })
      } else {
        throw new Error("No price data available for this symbol")
      }
    } else {
      const url = `${BASE_URL}/last/trade/${symbol}?apiKey=${apiKey}`

      console.log("Fetching current price for symbol:", symbol)

      const response = await fetch(url)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch current price")
      }

      if (data.results) {
        const currentPrice = data.results.p
        console.log("Current price:", currentPrice)

        return NextResponse.json({
          symbol: data.results.T,
          price: currentPrice,
          date: new Date(data.results.t).toISOString().split("T")[0],
        })
      } else {
        throw new Error("Invalid API response format")
      }
    }
  } catch (error) {
    console.error("Error fetching stock data:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch stock data"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

