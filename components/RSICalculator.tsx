"use client"

import { useState, useCallback, useEffect } from "react"
import { calculateRSI } from "../utils/calculateRSI"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ReloadIcon } from "@radix-ui/react-icons"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface PriceData {
  day: number
  price: number
  date: string
}

const RSI_PERIODS = [9, 14, 21, 30]

export default function RSICalculator() {
  const [symbol, setSymbol] = useState<string>("")
  const [inputSymbol, setInputSymbol] = useState<string>("")
  const [priceData, setPriceData] = useState<PriceData[]>([])
  const [rsiHistory, setRsiHistory] = useState<{ time: string; rsi: number }[]>([])
  const [currentPrice, setCurrentPrice] = useState<number>(0)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [rsiPeriod, setRsiPeriod] = useState<number>(14)
  const [apiKeyError, setApiKeyError] = useState<boolean>(false)

  const fetchData = useCallback(async () => {
    if (!symbol) return

    setLoading(true)
    setError(null)
    setApiKeyError(false)

    try {
      // Fetch historical data
      const historyResponse = await fetch(`/api/stock-data?symbol=${symbol}&type=history`)
      const historyData = await historyResponse.json()

      if (!historyResponse.ok) {
        if (historyData.error === "API key is not configured") {
          setApiKeyError(true)
          throw new Error("API key is not configured. Please set up your Polygon API key.")
        }
        throw new Error(historyData.error || "Failed to fetch historical data")
      }

      if (historyData.prices && historyData.dates && historyData.prices.length > 0) {
        // Create price data array with correct chronological order
        const priceDataWithDates = historyData.prices.map((price: number, index: number) => ({
          day: historyData.prices.length - index,
          price,
          date: historyData.dates[index],
        }))

        console.log("Processed price data:", priceDataWithDates)

        setPriceData(priceDataWithDates)
        const rsi = calculateRSI(historyData.prices, rsiPeriod)
        console.log(`Calculated RSI (${rsiPeriod} days):`, rsi)
        setRsiHistory([{ time: new Date().toLocaleTimeString(), rsi }])
      } else {
        throw new Error("No historical data available for this symbol")
      }

      // Fetch current price
      const quoteResponse = await fetch(`/api/stock-data?symbol=${symbol}`)
      const quoteData = await quoteResponse.json()

      if (!quoteResponse.ok) {
        throw new Error(quoteData.error || "Failed to fetch current price")
      }

      setCurrentPrice(quoteData.price)

      // Only add current price to calculations if it's different from the latest historical price
      const latestHistoricalPrice = priceData[priceData.length - 1]?.price
      if (quoteData.price !== latestHistoricalPrice) {
        setPriceData((prevData) => {
          const updatedPrices = [
            ...prevData,
            {
              day: 0,
              price: quoteData.price,
              date: quoteData.date,
            },
          ]
          const prices = updatedPrices.map((d) => d.price)
          const newRSI = calculateRSI(prices, rsiPeriod)
          console.log(`Updated RSI (${rsiPeriod} days) with current price:`, newRSI)
          setRsiHistory((prev) => [...prev, { time: new Date().toLocaleTimeString(), rsi: newRSI }].slice(-20))
          return updatedPrices
        })
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error fetching data"
      console.error("Error fetching data:", errorMessage)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [symbol, priceData, rsiPeriod])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputSymbol.trim()) {
      setError("Please enter a stock symbol")
      return
    }
    setSymbol(inputSymbol.toUpperCase())
    setPriceData([])
    setRsiHistory([])
    setCurrentPrice(0)
    setError(null)
    setApiKeyError(false)
  }

  const handleRsiPeriodChange = (value: string) => {
    setRsiPeriod(Number(value))
  }

  const handleReset = () => {
    setSymbol("")
    setInputSymbol("")
    setPriceData([])
    setRsiHistory([])
    setCurrentPrice(0)
    setError(null)
    setApiKeyError(false)
    setRsiPeriod(14)
  }

  useEffect(() => {
    if (priceData.length > 0) {
      const prices = priceData.map((d) => d.price)
      const newRSI = calculateRSI(prices, rsiPeriod)
      setRsiHistory([{ time: new Date().toLocaleTimeString(), rsi: newRSI }])
    }
  }, [rsiPeriod, priceData])

  const latestRSI = rsiHistory.length > 0 ? rsiHistory[rsiHistory.length - 1].rsi : 0

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Manual RSI Calculator for stocks (Using Polygon API)
          
        </CardTitle>
        
          <CardDescription>
          Enter a stock symbol (e.g., AAPL) and click &quot;Set Symbol&quot;. Then click &quot;Fetch Data&quot; to calculate RSI.
        </CardDescription>
        
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="mb-4">
          <div className="flex space-x-2">
            <Input
              type="text"
              value={inputSymbol}
              onChange={(e) => setInputSymbol(e.target.value.toUpperCase())}
              placeholder="Enter stock symbol (e.g., AAPL)"
              className="flex-grow"
            />
            <Button type="submit">Set Symbol</Button>
            <Button type="button" variant="outline" onClick={handleReset}>
              Reset
            </Button>
          </div>
        </form>
        <div className="mb-4">
          <label htmlFor="rsi-period" className="block text-sm font-medium text-gray-700 mb-1">
            Select desired RSI Period (days)
          </label>
          <Select onValueChange={handleRsiPeriodChange} value={rsiPeriod.toString()}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select RSI period" />
            </SelectTrigger>
            <SelectContent>
              {RSI_PERIODS.map((period) => (
                <SelectItem key={period} value={period.toString()}>
                  {period} days
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {symbol && (
          <div className="mt-4">
            <Button onClick={fetchData} disabled={loading} className="w-full">
              {loading ? <ReloadIcon className="mr-2 h-4 w-4 animate-spin" /> : null}
              Fetch Data for {symbol}
            </Button>
          </div>
        )}
        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {apiKeyError && (
          <Alert variant="destructive" className="mt-4">
            <AlertTitle>API Key Not Configured</AlertTitle>
            <AlertDescription>
              Please set up your Polygon API key in the environment variables. Add POLYGON_API_KEY=your_api_key_here to
              your .env.local file.
              <a
                href="https://polygon.io/dashboard/signup"
                target="_blank"
                rel="noopener noreferrer"
                className="block mt-2 text-blue-600 hover:text-blue-800 underline"
              >
                Sign up for a Polygon.io API key
              </a>
            </AlertDescription>
          </Alert>
        )}
        {symbol && !error && (
          <div className="text-center mt-4">
            <p className="text-xl font-bold mb-2">{symbol}</p>
            {currentPrice > 0 && <p className="text-2xl font-bold mb-2">Current Price: ${currentPrice.toFixed(2)}</p>}
            {latestRSI > 0 && (
              <>
                <p className="text-4xl font-bold">
                  RSI ({rsiPeriod} days): {latestRSI.toFixed(2)}
                </p>
                <p className="mt-4 text-sm text-gray-500">
                  {latestRSI < 30 ? "Oversold" : latestRSI > 70 ? "Overbought" : "Neutral"}
                </p>
              </>
            )}
            {rsiHistory.length > 0 && (
              <div className="h-64 mt-8">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={rsiHistory}>
                    <XAxis dataKey="time" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="rsi" stroke="#8884d8" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
            {priceData.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-2">Price Data Used for RSI Calculation</h3>
                <div className="max-h-64 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">Day</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Price</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {priceData.slice(-rsiPeriod).map((data) => (
                        <TableRow key={data.day}>
                          <TableCell className="font-medium">{data.day}</TableCell>
                          <TableCell>{data.date}</TableCell>
                          <TableCell>${data.price.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

