import RSICalculator from "../components/RSICalculator"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-24">
      <h1 className="text-4xl font-bold mb-8">Stock RSI Calculator</h1>
      <p>Created by Rowshni</p>
      <RSICalculator />
    </main>
  )
}

