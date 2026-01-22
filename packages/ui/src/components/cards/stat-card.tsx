import type { LucideIcon } from "lucide-react"
import { Card, CardContent } from "@/ui/card"
import { cn } from "@/lib/utils"

interface StatCardProps {
  icon: LucideIcon
  label: string
  value: string | number
  className?: string
  iconClassName?: string
  bgClassName?: string
}

export function StatCard({
  icon: Icon,
  label,
  value,
  className,
  iconClassName = "text-primary",
  bgClassName = "bg-primary/10",
}: Readonly<StatCardProps>) {
  return (
    <Card className={cn("border-border", className)}>
      <CardContent className="flex items-center gap-3 p-3">
        <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", bgClassName)}>
          <Icon className={cn("h-4 w-4", iconClassName)} />
        </div>
        <div>
          <p className="text-xl font-bold text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

