import { useState, useEffect } from "react";
import { PortfolioSummary } from "@/components/PortfolioSummary";
import { CryptoCard, type CryptoHolding } from "@/components/CryptoCard";
import { AddCryptoModal } from "@/components/AddCryptoModal";
import { Button } from "@/components/ui/button";
import { RefreshCwIcon, TrendingUpIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const Portfolio = () => {
  const [holdings, setHoldings] = useState<CryptoHolding[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Helper function to get auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!localStorage.getItem('auth_token');
  };

  // Fetch portfolio from database
  const fetchPortfolio = async () => {
    try {
      if (!isAuthenticated()) {
        toast({
          title: "Authentication Required",
          description: "Please log in to view your portfolio",
          variant: "destructive",
        });
        navigate('/login');
        return;
      }

      const response = await fetch('http://localhost:3001/api/portfolio', {
        headers: getAuthHeaders()
      });
      
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('auth_token');
        toast({
          title: "Session Expired",
          description: "Please log in again",
          variant: "destructive",
        });
        navigate('/login');
        return;
      }
      
      if (response.ok) {
        const portfolioData = await response.json();
        
        // Fetch current prices for each holding
        const updatedHoldings = await Promise.all(
          portfolioData.map(async (holding: CryptoHolding) => {
            try {
              const priceResponse = await fetch(`http://localhost:3001/api/coin/${holding.id}`);
              if (priceResponse.ok) {
                const coinData = await priceResponse.json();
                return {
                  ...holding,
                  currentPrice: coinData.market_data?.current_price?.usd || holding.avgPrice
                };
              }
            } catch (error) {
              console.error(`Error fetching price for ${holding.symbol}:`, error);
            }
            return {
              ...holding,
              currentPrice: holding.avgPrice // Fallback to avg price
            };
          })
        );
        
        setHoldings(updatedHoldings);
      } else {
        console.error('Failed to fetch portfolio');
        toast({
          title: "Error",
          description: "Failed to fetch portfolio data",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching portfolio:', error);
      toast({
        title: "Error",
        description: "Unable to connect to server",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Load portfolio on component mount
  useEffect(() => {
    fetchPortfolio();
  }, []);

  const addCrypto = async (newCrypto: Omit<CryptoHolding, "currentPrice">) => {
    try {
      if (!isAuthenticated()) {
        toast({
          title: "Authentication Required",
          description: "Please log in to add cryptocurrencies",
          variant: "destructive",
        });
        navigate('/login');
        return;
      }

      setLoading(true);
      const response = await fetch('http://localhost:3001/api/portfolio', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          crypto_id: newCrypto.id,
          symbol: newCrypto.symbol,
          name: newCrypto.name,
          amount: newCrypto.amount,
          avgPrice: newCrypto.avgPrice,
        }),
      });

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('auth_token');
        toast({
          title: "Session Expired",
          description: "Please log in again",
          variant: "destructive",
        });
        navigate('/login');
        return;
      }

      if (response.ok) {
        await fetchPortfolio(); // Refresh the portfolio
        toast({
          title: "Success",
          description: `${newCrypto.symbol} added to your portfolio`,
        });
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Failed to add cryptocurrency",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error adding crypto:', error);
      toast({
        title: "Error",
        description: "Failed to add cryptocurrency",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshPrices = async () => {
    setLoading(true);
    await fetchPortfolio();
    setLastUpdated(new Date());
    
    toast({
      title: "Prices Updated",
      description: "Portfolio prices have been refreshed",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">My Portfolio</h1>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={refreshPrices}
              className="border-border/50 hover:border-primary/50"
            >
              <RefreshCwIcon className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <AddCryptoModal onAddCrypto={addCrypto} />
          </div>
        </div>

        <PortfolioSummary holdings={holdings} />

        {holdings.length > 0 ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-foreground">Your Holdings</h2>
              <p className="text-sm text-muted-foreground">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {holdings.map((crypto) => (
                <CryptoCard key={crypto.id} crypto={crypto} />
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-gradient-primary/20 flex items-center justify-center">
              <TrendingUpIcon className="w-8 h-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-foreground">Start Your Crypto Journey</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Add your first cryptocurrency to start tracking your portfolio performance
              </p>
            </div>
            <AddCryptoModal onAddCrypto={addCrypto} />
          </div>
        )}
      </main>
    </div>
  );
};

export default Portfolio;