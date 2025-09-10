import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon, ExpandIcon, ShrinkIcon, ArrowUpIcon, ArrowDownIcon, TrendingUpIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from "@/lib/utils";

interface ChartDataPoint {
  timestamp: number;
  price: number;
  date: string;
}

interface ChartResponse {
  data: ChartDataPoint[];
  period: string;
}

type TimePeriod = '1' | '7' | '30' | '365' | 'max';
type ChartSize = 'small' | 'medium' | 'large' | 'xlarge';

interface CoinDetail {
  id: string;
  name: string;
  symbol: string;
  market_data: {
    current_price: { usd: number };
    market_cap: { usd: number };
    market_cap_rank: number;
    price_change_percentage_24h: number;
  };
  description: { en: string };
  image: { large: string };
}

const CoinDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [coin, setCoin] = useState<CoinDetail | null>(null);
  const [chartData, setChartData] = useState<ChartResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('7');
  const [chartSize, setChartSize] = useState<ChartSize>('medium');

  const timePeriods: { value: TimePeriod; label: string }[] = [
    { value: '1', label: 'Dag' },
    { value: '7', label: 'Week' },
    { value: '30', label: 'Maand' },
    { value: '365', label: 'Jaar' },
    { value: 'max', label: 'Altijd' }
  ];

  const chartSizes: { value: ChartSize; label: string; height: number }[] = [
    { value: 'small', label: 'Klein', height: 250 },
    { value: 'medium', label: 'Normaal', height: 400 },
    { value: 'large', label: 'Groot', height: 550 },
    { value: 'xlarge', label: 'Zeer Groot', height: 700 }
  ];

  const fetchChartData = async (period: TimePeriod, retryCount = 0) => {
    if (!id) return;
    
    setChartLoading(true);
    try {
      const chartRes = await fetch(`http://localhost:3001/api/coin/${id}/chart?days=${period}`);
      
      if (chartRes.status === 429) {
        console.warn(`Rate limited by API (attempt ${retryCount + 1}), retrying...`);
        
        // Faster retry with shorter delays (max 2 retries)
        if (retryCount < 2) {
          const delay = (retryCount + 1) * 1500; // 1.5s, 3s
          console.log(`Retrying in ${delay}ms...`);
          setTimeout(() => {
            fetchChartData(period, retryCount + 1);
          }, delay);
          return;
        } else {
          console.log('Max retries reached, showing fallback message');
          setChartData(null);
          setChartLoading(false);
          return;
        }
      }
      
      if (!chartRes.ok) {
        throw new Error(`HTTP error! status: ${chartRes.status}`);
      }
      
      const chart = await chartRes.json();
      setChartData(chart);
    } catch (error) {
      console.error('Error fetching chart data:', error);
      setChartData(null);
    } finally {
      if (retryCount === 0) { // Only set loading to false on the initial call
        setChartLoading(false);
      }
    }
  };

  const fetchCoinData = async (retryCount = 0) => {
    if (!id) return;
    
    try {
      const coinRes = await fetch(`http://localhost:3001/api/coin/${id}`);
      
      if (coinRes.status === 429) {
        console.warn(`Coin data rate limited (attempt ${retryCount + 1}), retrying...`);
        
        // Faster retry with shorter delays (max 2 retries)
        if (retryCount < 2) {
          const delay = (retryCount + 1) * 2000; // 2s, 4s
          console.log(`Retrying coin data in ${delay}ms...`);
          setTimeout(() => {
            fetchCoinData(retryCount + 1);
          }, delay);
          return;
        } else {
          console.log('Max coin data retries reached');
          setLoading(false);
          return;
        }
      }
      
      if (!coinRes.ok) {
        throw new Error(`HTTP error! status: ${coinRes.status}`);
      }
      
      const coinData = await coinRes.json();
      setCoin(coinData);
      
      // Only fetch chart data after coin data is successfully loaded
      // Add a small delay to respect rate limits
      setTimeout(() => {
        fetchChartData(selectedPeriod);
      }, 1000);
      
    } catch (error) {
      console.error('Error fetching coin data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!id) return;

    // Only fetch coin data initially
    // Chart data will be fetched after coin data succeeds
    fetchCoinData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Handle period changes separately to avoid re-fetching coin data
  useEffect(() => {
    if (!id || !coin) return; // Only fetch chart if coin data exists
    
    fetchChartData(selectedPeriod);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPeriod, coin]);

  const handlePeriodChange = (period: TimePeriod) => {
    setSelectedPeriod(period);
  };

  const handleSizeChange = (size: ChartSize) => {
    setChartSize(size);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  if (!coin) return <div className="min-h-screen flex items-center justify-center">Coin not found</div>;

  const currentChartSize = chartSizes.find(size => size.value === chartSize) || chartSizes[1];
  const getPeriodLabel = () => {
    const period = timePeriods.find(p => p.value === selectedPeriod);
    return period ? period.label : '7 dagen';
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link to="/">
            <Button variant="outline" className="mb-4">
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Back to Portfolio
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <Card className="bg-gradient-card border-border/50 shadow-card">
              <CardHeader>
                <div className="flex items-center space-x-4">
                  {coin.image?.large && (
                    <img src={coin.image.large} alt={coin.name} className="w-16 h-16" />
                  )}
                  {!coin.image?.large && (
                    <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center">
                      <span className="text-xl font-bold text-primary-foreground">
                        {coin.symbol?.slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <CardTitle className="text-2xl">{coin.name}</CardTitle>
                    <p className="text-muted-foreground">{coin.symbol?.toUpperCase()}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Current Price</p>
                  <p className="text-2xl font-bold">${coin.market_data?.current_price?.usd?.toLocaleString() || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Market Cap</p>
                  <p className="text-lg">${coin.market_data?.market_cap?.usd?.toLocaleString() || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Market Cap Rank</p>
                  <p className="text-lg">#{coin.market_data?.market_cap_rank || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">24h Change</p>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={(coin.market_data?.price_change_percentage_24h || 0) >= 0 ? "default" : "destructive"}
                      className={cn(
                        "px-3 py-1 text-sm font-medium flex items-center gap-1",
                        (coin.market_data?.price_change_percentage_24h || 0) >= 0
                          ? "bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20"
                          : "bg-red-500/10 text-red-600 border-red-500/20 hover:bg-red-500/20"
                      )}
                    >
                      {(coin.market_data?.price_change_percentage_24h || 0) >= 0 ? (
                        <ArrowUpIcon className="w-3 h-3" />
                      ) : (
                        <ArrowDownIcon className="w-3 h-3" />
                      )}
                      {(coin.market_data?.price_change_percentage_24h || 0) >= 0 ? '+' : ''}
                      {coin.market_data?.price_change_percentage_24h?.toFixed(2) || '0.00'}%
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card className="bg-gradient-card border-border/50 shadow-card">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <CardTitle>Prijs Grafiek ({getPeriodLabel()})</CardTitle>
                  
                  <div className="flex flex-col sm:flex-row gap-2">
                    {/* Size controls */}
                    <div className="flex gap-1">
                      {chartSizes.map((size) => (
                        <Button
                          key={size.value}
                          variant={chartSize === size.value ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleSizeChange(size.value)}
                          className="text-xs"
                        >
                          {size.value === 'small' && <ShrinkIcon className="w-3 h-3" />}
                          {size.value === 'xlarge' && <ExpandIcon className="w-3 h-3" />}
                          {size.value !== 'small' && size.value !== 'xlarge' && size.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Time period controls */}
                <div className="flex flex-wrap gap-2 mt-4">
                  {timePeriods.map((period) => (
                    <Button
                      key={period.value}
                      variant={selectedPeriod === period.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePeriodChange(period.value)}
                      disabled={chartLoading}
                      className="min-w-[60px]"
                    >
                      {period.label}
                    </Button>
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                {chartLoading ? (
                  <div className="flex items-center justify-center" style={{ height: currentChartSize.height }}>
                    <div className="text-muted-foreground">Laden...</div>
                  </div>
                ) : !chartData?.data || chartData.data.length === 0 ? (
                  <div className="flex flex-col items-center justify-center" style={{ height: currentChartSize.height }}>
                    <div className="text-muted-foreground mb-2">Geen grafiekgegevens beschikbaar</div>
                    <div className="text-sm text-muted-foreground">Probeer het later opnieuw of kies een andere periode</div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={currentChartSize.height}>
                    <LineChart data={chartData.data}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12 }}
                        interval="preserveStartEnd"
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        domain={['dataMin * 0.95', 'dataMax * 1.05']}
                      />
                      <Tooltip 
                        formatter={(value: number) => [`$${value.toFixed(2)}`, 'Prijs']}
                        labelFormatter={(label) => `Datum: ${label}`}
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '6px'
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="price" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4, stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mt-8">
          <Card className="bg-gradient-card border-border/50 shadow-card">
            <CardHeader>
              <CardTitle>About {coin.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div dangerouslySetInnerHTML={{ __html: coin.description?.en || 'No description available.' }} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CoinDetail;