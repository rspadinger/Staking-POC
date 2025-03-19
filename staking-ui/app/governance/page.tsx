"use client"

import { useState, useEffect } from "react"

export default function GovernancePage() {
  const [mounted, setMounted] = useState(false)

  // Ensure we only render client-side components after hydration
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    // Return a placeholder with the same structure to prevent layout shift
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Governance</h1>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Governance</h1>
          <p className="text-muted-foreground">
            Participate in the decision-making process for the future of StakeFlow.
          </p>
        </div>

        <div className="flex items-center justify-center h-[400px]">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-primary mb-4">Governance - Coming Soon</h2>
            <p className="text-muted-foreground max-w-md">
              We're working on implementing governance features that will allow token holders to propose and vote on
              protocol changes.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

