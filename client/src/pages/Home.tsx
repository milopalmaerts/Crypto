import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUpIcon, TrendingDownIcon, ArrowUpIcon, ArrowDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

interface TopCoin {
  id: string;
  name: string;
  symbol: string;
  current_price: number;
  market_cap: number;
  market_cap_rank?: number;
  price_change_percentage_24h: number;
  image: string;
}

const Home = () => {
  const [topCoins, setTopCoins] = useState<TopCoin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check authentication status
    const token = localStorage.getItem('auth_token');
    setIsAuthenticated(!!token);
    
    fetchTopCoins();
  }, []);

  const fetchTopCoins = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/api/coins');
      
      if (response.ok) {
        const data = await response.json();
        setTopCoins(data);
      } else {
        setError('Failed to fetch cryptocurrency data');
      }
    } catch (error) {
      console.error('Error fetching top coins:', error);
      setError('Unable to load cryptocurrency data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading cryptocurrency data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            CryptoTracker
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Track cryptocurrency prices, manage your portfolio, and stay updated with the latest market trends
          </p>
          <div className="flex justify-center gap-4">
            {isAuthenticated ? (
              <>
                <Link to="/portfolio">
                  <Button className="bg-gradient-primary hover:shadow-neon transition-all duration-300">
                    View Portfolio
                  </Button>
                </Link>
                <Link to="/news">
                  <Button variant="outline">
                    Latest News
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link to="/register">
                  <Button className="bg-gradient-primary hover:shadow-neon transition-all duration-300">
                    Get Started
                  </Button>
                </Link>
                <Link to="/news">
                  <Button variant="outline">
                    Latest News
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Market Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-card border-border/50 shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Market Cap
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">$2.3T</div>
              <p className="text-xs text-success">+2.4% (24h)</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-card border-border/50 shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                24h Volume
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">$89.2B</div>
              <p className="text-xs text-destructive">-1.2% (24h)</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-card border-border/50 shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Coins
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">13,245</div>
              <p className="text-xs text-muted-foreground">Available</p>
            </CardContent>
          </Card>
        </div>

        {/* Top 10 Cryptocurrencies */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground">Top 10 Cryptocurrencies</h2>
            <Button variant="outline" size="sm" onClick={fetchTopCoins}>
              Refresh
            </Button>
          </div>
          
          {error ? (
            <Card className="bg-gradient-card border-border/50 shadow-card">
              <CardContent className="py-8 text-center">
                <p className="text-destructive mb-4">{error}</p>
                <Button onClick={fetchTopCoins} variant="outline">
                  Try Again
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {topCoins.map((coin, index) => {
                const isPositive = coin.price_change_percentage_24h >= 0;
                return (
                  <Link key={coin.id} to={`/coin/${coin.id}`}>
                    <Card className="bg-gradient-card border-border/50 shadow-card hover:shadow-neon/20 transition-all duration-300 cursor-pointer">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center">
                              <span className="text-xs font-bold text-primary-foreground">
                                #{index + 1}
                              </span>
                            </div>
                            
                            <div className="flex items-center space-x-3">
                              {coin.image ? (
                                <img 
                                  src={coin.image} 
                                  alt={coin.name}
                                  className="w-10 h-10 rounded-full"
                                  onError={(e) => {
                                    // Fallback to gradient circle if image fails to load
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    const fallback = target.nextElementSibling as HTMLElement;
                                    if (fallback) fallback.style.display = 'flex';
                                  }}
                                />
                              ) : null}
                              <div 
                                className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center"
                                style={{ display: coin.image ? 'none' : 'flex' }}
                              >
                                <span className="text-sm font-bold text-primary-foreground">
                                  {coin.symbol.slice(0, 2)}
                                </span>
                              </div>
                              <div>
                                <h3 className="font-semibold text-foreground">{coin.name}</h3>
                                <p className="text-sm text-muted-foreground">{coin.symbol.toUpperCase()}</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-6">
                            <div className="text-right">
                              <p className="font-bold text-foreground">${coin.current_price?.toLocaleString() || 'N/A'}</p>
                              <p className="text-sm text-muted-foreground">
                                Cap: ${coin.market_cap ? (coin.market_cap / 1e9).toFixed(1) : 'N/A'}B
                              </p>
                            </div>
                            
                            <Badge 
                              variant={isPositive ? "default" : "destructive"}
                              className={cn(
                                "px-3 py-1 text-sm font-medium flex items-center gap-1",
                                isPositive 
                                  ? "bg-success/20 text-success border-success/30"
                                  : "bg-destructive/20 text-destructive border-destructive/30"
                              )}
                            >
                              {isPositive ? (
                                <ArrowUpIcon className="w-3 h-3" />
                              ) : (
                                <ArrowDownIcon className="w-3 h-3" />
                              )}
                              {isPositive ? '+' : ''}{coin.price_change_percentage_24h?.toFixed(2) || '0.00'}%
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Call to Action - Only show when not authenticated */}
        {!isAuthenticated && (
          <Card className="bg-gradient-card border-border/50 shadow-card">
            <CardContent className="py-8 text-center space-y-4">
              <TrendingUpIcon className="w-12 h-12 text-primary mx-auto" />
              <h3 className="text-xl font-bold text-foreground">Start Your Crypto Journey</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Create an account to track your portfolio, get personalized insights, and never miss important market movements.
              </p>
              <div className="flex justify-center gap-4">
                <Link to="/register">
                  <Button className="bg-gradient-primary hover:shadow-neon transition-all duration-300">
                    Get Started
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="outline">
                    Sign In
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Home;