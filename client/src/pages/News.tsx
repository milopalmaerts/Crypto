import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarIcon, ExternalLinkIcon, TrendingUpIcon } from "lucide-react";
import { API_ENDPOINTS } from '../config/api';

interface NewsItem {
  id: string;
  title: string;
  description: string;
  url: string;
  published_at: string;
  source: string;
  category: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
}

const News = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { value: 'all', label: 'All News' },
    { value: 'bitcoin', label: 'Bitcoin' },
    { value: 'ethereum', label: 'Ethereum' },
    { value: 'defi', label: 'DeFi' },
    { value: 'nft', label: 'NFT' },
    { value: 'regulation', label: 'Regulation' },
  ];

  useEffect(() => {
    fetchNews();
  }, [selectedCategory]);

  const fetchNews = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_ENDPOINTS.NEWS}?category=${selectedCategory}`);
      
      if (response.ok) {
        const data = await response.json();
        setNews(data);
      } else {
        // Fallback to mock data if API fails
        setNews(getMockNews());
      }
    } catch (error) {
      console.error('Error fetching news:', error);
      setNews(getMockNews());
    } finally {
      setLoading(false);
    }
  };

  const getMockNews = (): NewsItem[] => [
    {
      id: '1',
      title: 'Bitcoin Reaches New All-Time High Amid Institutional Adoption',
      description: 'Bitcoin surged to unprecedented levels as major institutions continue to embrace cryptocurrency as a store of value.',
      url: '#',
      published_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      source: 'CryptoNews Today',
      category: 'bitcoin',
      sentiment: 'positive'
    },
    {
      id: '2',
      title: 'Ethereum 2.0 Staking Rewards Hit Record Levels',
      description: 'The Ethereum network sees unprecedented staking participation as users flock to earn rewards on the proof-of-stake consensus.',
      url: '#',
      published_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      source: 'Ethereum Weekly',
      category: 'ethereum',
      sentiment: 'positive'
    },
    {
      id: '3',
      title: 'DeFi Protocol Launches Revolutionary Yield Farming Platform',
      description: 'A new decentralized finance protocol promises higher yields and lower fees through innovative smart contract technology.',
      url: '#',
      published_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      source: 'DeFi Digest',
      category: 'defi',
      sentiment: 'positive'
    },
    {
      id: '4',
      title: 'Major Exchange Implements Enhanced Security Measures',
      description: 'Following recent security concerns, leading cryptocurrency exchange introduces multi-layered protection for user funds.',
      url: '#',
      published_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
      source: 'Crypto Security Report',
      category: 'regulation',
      sentiment: 'neutral'
    },
    {
      id: '5',
      title: 'NFT Marketplace Sees 300% Growth in Trading Volume',
      description: 'Digital art and collectibles continue to gain traction as NFT trading reaches new monthly records.',
      url: '#',
      published_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      source: 'NFT Tribune',
      category: 'nft',
      sentiment: 'positive'
    },
    {
      id: '6',
      title: 'Central Bank Digital Currency Pilot Program Announced',
      description: 'Government officials reveal plans for comprehensive testing of digital currency infrastructure.',
      url: '#',
      published_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      source: 'Financial Times Crypto',
      category: 'regulation',
      sentiment: 'neutral'
    }
  ];

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive':
        return 'bg-success/20 text-success border-success/30';
      case 'negative':
        return 'bg-destructive/20 text-destructive border-destructive/30';
      default:
        return 'bg-muted/20 text-muted-foreground border-muted/30';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading latest news...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-foreground">Crypto News</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Stay updated with the latest cryptocurrency news, market analysis, and industry developments
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-2">
          {categories.map((category) => (
            <Button
              key={category.value}
              variant={selectedCategory === category.value ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category.value)}
              className="min-w-[100px]"
            >
              {category.label}
            </Button>
          ))}
        </div>

        {/* News Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {news.map((article) => (
            <Card key={article.id} className="bg-gradient-card border-border/50 shadow-card hover:shadow-neon/20 transition-all duration-300">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <Badge key={`${article.id}-category`} variant="outline" className="text-xs">
                    {article.category}
                  </Badge>
                  {article.sentiment && (
                    <Badge key={`${article.id}-sentiment`} variant="outline" className={`text-xs ${getSentimentColor(article.sentiment)}`}>
                      {article.sentiment}
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-lg leading-tight line-clamp-2">
                  {article.title}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {article.description}
                </p>
                
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <CalendarIcon className="w-3 h-3" />
                    {formatTimeAgo(article.published_at)}
                  </div>
                  <span>{article.source}</span>
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => window.open(article.url, '_blank')}
                >
                  <ExternalLinkIcon className="w-3 h-3 mr-2" />
                  Read More
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* No News Message */}
        {news.length === 0 && (
          <Card className="bg-gradient-card border-border/50 shadow-card">
            <CardContent className="py-12 text-center">
              <TrendingUpIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No News Available</h3>
              <p className="text-muted-foreground">
                No news articles found for the selected category. Try selecting a different category or refresh the page.
              </p>
              <Button onClick={fetchNews} className="mt-4" variant="outline">
                Refresh News
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default News;