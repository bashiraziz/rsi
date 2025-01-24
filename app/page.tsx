import RSICalculator from "../components/RSICalculator"
import {CardDescription } from "@/components/ui/card"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-24">
      <h1 className="text-3xl font-bold mb-8">Relative Strength Index (RSI) Calculator</h1>
      
      <CardDescription>
            Created by Rowshni
      </CardDescription>  
      <RSICalculator />
      <CardDescription>
        <a
            href="https://www.investopedia.com/terms/r/rsi.asp"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Learn more about RSI on Investopedia
          </a>
      </CardDescription>
    </main>
  )
}

