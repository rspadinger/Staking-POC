interface TokenLogoProps {
  symbol: string
  size?: "sm" | "md" | "lg"
}

export function TokenLogo({ symbol, size = "md" }: TokenLogoProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  }

  return (
    <div className={`${sizeClasses[size]} rounded-full bg-primary/20 flex items-center justify-center`}>
      <span className="font-bold text-primary">{symbol.substring(0, 1)}</span>
    </div>
  )
}

