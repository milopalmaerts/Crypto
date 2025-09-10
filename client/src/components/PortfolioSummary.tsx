import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUpIcon, WalletIcon, PieChartIcon, ArrowUpIcon, ArrowDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CryptoHolding } from "./CryptoCard";

interface PortfolioSummaryProps {
  holdings: CryptoHolding[];
}

export const PortfolioSummary = ({ holdings }: PortfolioSummaryProps) => {
  const totalValue = holdings.reduce((sum, crypto) => sum + (crypto.amount * crypto.currentPrice), 0);
  const totalCost = holdings.reduce((sum, crypto) => sum + (crypto.amount * crypto.avgPrice), 0);
  const totalProfitLoss = totalValue - totalCost;
  const totalProfitLossPercentage = totalCost > 0 ? ((totalProfitLoss / totalCost) * 100) : 0;
  const isProfit = totalProfitLoss >= 0;

  const stats = [
    {
      title: "Total Value",
      value: totalValue,
      format: "currency",
      icon: WalletIcon,
      gradient: "bg-gradient-primary"
    },
    {
      title: "Total P&L",
      value: totalProfitLoss,
      format: "currency",
      icon: isProfit ? ArrowUpIcon : ArrowDownIcon,
      gradient: isProfit ? "bg-gradient-success" : "bg-destructive",
      textColor: isProfit ? "text-success" : "text-destructive"
    },
    {
      title: "Holdings",
      value: holdings.length,
      format: "number",
      icon: PieChartIcon,
      gradient: "bg-neon-purple"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          CryptoTrack
        </h1>
        <p className="text-muted-foreground">Your crypto portfolio at a glance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="bg-gradient-card border-border/50 shadow-card hover:shadow-neon/20 transition-all duration-300">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center",
                    stat.gradient
                  )}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <div className={cn(
                    "text-2xl font-bold",
                    stat.textColor || "text-foreground"
                  )}>
                    {stat.format === "currency" 
                      ? `${stat.value >= 0 ? "+" : ""}$${Math.abs(stat.value).toLocaleString("en-US", {minimumFractionDigits: 2, maximumFractionDigits: 2})}`
                      : stat.value.toLocaleString()
                    }
                  </div>
                  {stat.title === "Total P&L" && (
                    <Badge 
                      variant={isProfit ? "default" : "destructive"}
                      className={cn(
                        "text-xs",
                        isProfit 
                          ? "bg-success/20 text-success border-success/30"
                          : "bg-destructive/20 text-destructive border-destructive/30"
                      )}
                    >
                      {isProfit ? (
                        <ArrowUpIcon className="w-3 h-3" />
                      ) : (
                        <ArrowDownIcon className="w-3 h-3" />
                      )}
                      {isProfit ? "+" : ""}{totalProfitLossPercentage.toFixed(2)}%
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {holdings.length > 0 && (
        <Card className="bg-gradient-card border-border/50 shadow-card">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUpIcon className="w-5 h-5 text-primary" />
              <CardTitle className="text-foreground">Portfolio Performance</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-xs text-muted-foreground">24h Change</p>
                <p className="text-lg font-semibold text-success">+2.34%</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">7d Change</p>
                <p className="text-lg font-semibold text-success">+8.12%</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">30d Change</p>
                <p className="text-lg font-semibold text-destructive">-5.67%</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">All Time</p>
                <p className={cn(
                  "text-lg font-semibold",
                  isProfit ? "text-success" : "text-destructive"
                )}>
                  {isProfit ? "+" : ""}{totalProfitLossPercentage.toFixed(2)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};