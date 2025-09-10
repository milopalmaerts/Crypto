import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusIcon, CoinsIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { CryptoHolding } from "./CryptoCard";

interface AddCryptoModalProps {
  onAddCrypto: (crypto: Omit<CryptoHolding, "currentPrice">) => void;
}

const popularCryptos = [
  { symbol: "BTC", name: "Bitcoin", id: "bitcoin" },
  { symbol: "ETH", name: "Ethereum", id: "ethereum" },
  { symbol: "ADA", name: "Cardano", id: "cardano" },
  { symbol: "SOL", name: "Solana", id: "solana" },
  { symbol: "DOT", name: "Polkadot", id: "polkadot" },
  { symbol: "MATIC", name: "Polygon", id: "matic-network" },
  { symbol: "SUI", name: "Sui", id: "sui" },
];

export const AddCryptoModal = ({ onAddCrypto }: AddCryptoModalProps) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    id: "",
    symbol: "",
    name: "",
    amount: "",
    avgPrice: "",
  });
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.symbol || !formData.name || !formData.amount || !formData.avgPrice) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(formData.amount);
    const avgPrice = parseFloat(formData.avgPrice);

    if (isNaN(amount) || isNaN(avgPrice) || amount <= 0 || avgPrice <= 0) {
      toast({
        title: "Error",
        description: "Amount and price must be positive numbers",
        variant: "destructive",
      });
      return;
    }

    onAddCrypto({
      id: formData.id || formData.symbol.toLowerCase(),
      symbol: formData.symbol.toUpperCase(),
      name: formData.name,
      amount,
      avgPrice,
    });

    setFormData({ id: "", symbol: "", name: "", amount: "", avgPrice: "" });
    setOpen(false);
    
    toast({
      title: "Success",
      description: `${formData.symbol.toUpperCase()} added to your portfolio`,
    });
  };

  const selectCrypto = (crypto: { symbol: string; name: string; id: string }) => {
    setFormData(prev => ({
      ...prev,
      id: crypto.id,
      symbol: crypto.symbol,
      name: crypto.name,
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-primary hover:shadow-neon transition-all duration-300">
          <PlusIcon className="w-4 h-4 mr-2" />
          Add Crypto
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-popover border-border/50 shadow-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <CoinsIcon className="w-5 h-5 text-primary" />
            Add Cryptocurrency
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Add a new cryptocurrency to your portfolio by entering the details below.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="crypto-select" className="text-sm font-medium text-foreground">
                Popular Cryptocurrencies
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {popularCryptos.map((crypto) => (
                  <Button
                    key={crypto.symbol}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => selectCrypto(crypto)}
                    className={`text-left border-border/50 hover:border-primary/50 hover:bg-primary/10 ${
                      formData.symbol === crypto.symbol ? "border-primary bg-primary/20" : ""
                    }`}
                  >
                    <span className="font-medium">{crypto.symbol}</span>
                    <span className="text-xs text-muted-foreground ml-auto">{crypto.name}</span>
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="symbol" className="text-sm font-medium text-foreground">
                  Symbol
                </Label>
                <Input
                  id="symbol"
                  placeholder="BTC"
                  value={formData.symbol}
                  onChange={(e) => setFormData(prev => ({ ...prev, symbol: e.target.value }))}
                  className="bg-background border-border/50 focus:border-primary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-foreground">
                  Name
                </Label>
                <Input
                  id="name"
                  placeholder="Bitcoin"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="bg-background border-border/50 focus:border-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-sm font-medium text-foreground">
                  Amount
                </Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.000001"
                  placeholder="0.5"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  className="bg-background border-border/50 focus:border-primary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="avgPrice" className="text-sm font-medium text-foreground">
                  Average Price ($)
                </Label>
                <Input
                  id="avgPrice"
                  type="number"
                  step="0.01"
                  placeholder="45000"
                  value={formData.avgPrice}
                  onChange={(e) => setFormData(prev => ({ ...prev, avgPrice: e.target.value }))}
                  className="bg-background border-border/50 focus:border-primary"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1 border-border/50 hover:bg-secondary/50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gradient-primary hover:shadow-neon transition-all duration-300"
            >
              Add to Portfolio
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};