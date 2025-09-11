import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUpIcon, ArrowDownIcon, TrendingUpIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

export interface CryptoHolding {
  id: string;
  symbol: string;
  name: string;
  amount: number;
  avgPrice: number;
  currentPrice?: number; // Added at runtime for display
}

interface CryptoCardProps {
  crypto: CryptoHolding;
  className?: string;
}

export const CryptoCard = ({ crypto, className }: CryptoCardProps) => {
  const currentPrice = crypto.currentPrice || crypto.avgPrice;
  const totalValue = crypto.amount * currentPrice;
  const totalCost = crypto.amount * crypto.avgPrice;
  const profitLoss = totalValue - totalCost;
  const profitLossPercentage = ((profitLoss / totalCost) * 100);
  const isProfit = profitLoss >= 0;

  // Remove the useEffect that was making unnecessary chart API calls
  // Chart data is only needed in the CoinDetail page, not in the card overview

  return (
    <Link to={`/coin/${crypto.id}`}>
      <Card className={cn("bg-gradient-card border-border/50 shadow-card hover:shadow-neon/20 transition-all duration-300 cursor-pointer", className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center">
                <span className="text-xs font-bold text-primary-foreground">
                  {crypto.symbol.slice(0, 2)}
                </span>
              </div>
              <div>
                <CardTitle className="text-lg text-foreground">{crypto.symbol}</CardTitle>
                <p className="text-sm text-muted-foreground">{crypto.name}</p>
              </div>
            </div>
            <Badge 
              variant={isProfit ? "default" : "destructive"}
              className={cn(
                "px-2 py-1 text-xs font-medium",
                isProfit 
                  ? "bg-success/20 text-success border-success/30 hover:bg-success/30"
                  : "bg-destructive/20 text-destructive border-destructive/30 hover:bg-destructive/30"
              )}
            >
              <span className="flex items-center gap-1">
                {isProfit ? (
                  <ArrowUpIcon className="w-3 h-3" />
                ) : (
                  <ArrowDownIcon className="w-3 h-3" />
                )}
                {isProfit ? '+' : ''}{profitLossPercentage.toFixed(2)}%
              </span>
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Holdings</p>
              <p className="text-sm font-medium text-foreground">{crypto.amount.toFixed(6)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Avg Price</p>
              <p className="text-sm font-medium text-foreground">${crypto.avgPrice.toFixed(2)}</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Current Price</span>
              <span className="text-sm font-medium text-foreground">${currentPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Value</span>
              <span className="text-lg font-semibold text-foreground">${totalValue.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-border/50">
              <span className="text-sm font-medium text-muted-foreground">Profit/Loss</span>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "text-lg font-bold",
                  isProfit ? "text-success" : "text-destructive"
                )}>
                  {isProfit ? "+" : ""}${profitLoss.toFixed(2)}
                </span>
                <TrendingUpIcon className={cn(
                  "w-4 h-4",
                  isProfit ? "text-success rotate-0" : "text-destructive rotate-180"
                )} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default CryptoCard;
