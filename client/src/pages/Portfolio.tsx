import { useState, useEffect } from "react";
import { PortfolioSummary } from "@/components/PortfolioSummary";
import { CryptoCard, type CryptoHolding } from "@/components/CryptoCard";
import { AddCryptoModal } from "@/components/AddCryptoModal";
import { Button } from "@/components/ui/button";
import { RefreshCwIcon, TrendingUpIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { dbHelpers } from "@/lib/supabase";
import { marketApi } from "@/lib/marketApi";

const Portfolio = () => {
  const [holdings, setHoldings] = useState<CryptoHolding[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user, session } = useAuth();
  const navigate = useNavigate();

  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!user && !!session;
  };

  // Fetch portfolio from Supabase
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

      if (!user?.id) {
        console.error('User ID not available');
        return;
      }

      // Fetch holdings from Supabase
      const portfolioData = await dbHelpers.holdings.getAll(user.id);
      
      // Fetch current prices for each holding
      const updatedHoldings = await Promise.all(
        portfolioData.map(async (holding) => {
          try {
            const coinData = await marketApi.getCoinDetail(holding.crypto_id);
            return {
              ...holding,
              currentPrice: coinData.market_data?.current_price?.usd || holding.avg_price
            };
          } catch (error) {
            console.error(`Error fetching price for ${holding.symbol}:`, error);
            return {
              ...holding,
              currentPrice: holding.avg_price // Fallback to avg price
            };
          }
        })
      );
      
      setHoldings(updatedHoldings);
    } catch (error) {
      console.error('Error fetching portfolio:', error);
      toast({
        title: "Error",
        description: "Failed to fetch portfolio data",
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

      if (!user?.id) {
        console.error('User ID not available');
        return;
      }

      setLoading(true);
      
      // Add holding to Supabase
      await dbHelpers.holdings.create({
        user_id: user.id,
        crypto_id: newCrypto.id,
        symbol: newCrypto.symbol,
        name: newCrypto.name,
        amount: newCrypto.amount,
        avg_price: newCrypto.avgPrice,
      });

      await fetchPortfolio(); // Refresh the portfolio
      toast({
        title: "Success",
        description: `${newCrypto.symbol} added to your portfolio`,
      });
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