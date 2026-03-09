import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Star, Clock, Users, Search, Filter, ArrowLeft, Heart, Share2, ShoppingBag, Plus, Store, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserRole } from '@/hooks/useUserRole';
import { EmptyState } from '@/components/shared/EmptyState';
import {
  usePublishedListings,
  useMyListings,
  useMyPurchases,
  useCreateListing,
  usePublishListing,
  type MarketplaceListing,
} from '@/hooks/useMarketplace';

export default function Marketplace() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [savedCourses, setSavedCourses] = useState<string[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newListing, setNewListing] = useState({
    title: '', description: '', short_description: '', price_cents: 0, category: 'technology', cover_image_url: '',
  });
  const { toast } = useToast();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { role } = useUserRole();
  const m = t.marketplace;

  const { data: listings = [], isLoading } = usePublishedListings(categoryFilter);
  const { data: myListings = [] } = useMyListings();
  const { data: myPurchases = [] } = useMyPurchases();
  const createListing = useCreateListing();
  const publishListing = usePublishListing();

  const canSell = role === 'trainer' || role === 'admin';

  const filtered = listings.filter(l =>
    !searchTerm || l.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (l.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleSaveCourse = (id: string) => {
    const isCurrentlySaved = savedCourses.includes(id);
    setSavedCourses(prev => isCurrentlySaved ? prev.filter(x => x !== id) : [...prev, id]);
    toast({ title: isCurrentlySaved ? m.courseRemovedWishlist : m.courseAddedWishlist });
  };

  const shareCourse = (listing: MarketplaceListing) => {
    if (navigator.share) {
      navigator.share({ title: listing.title, text: listing.short_description || '', url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({ title: m.linkCopied, description: m.linkCopiedDesc });
    }
  };

  const handleCreateListing = async () => {
    await createListing.mutateAsync(newListing);
    setShowCreateDialog(false);
    setNewListing({ title: '', description: '', short_description: '', price_cents: 0, category: 'technology', cover_image_url: '' });
  };

  const formatPrice = (cents: number) => {
    if (cents === 0) return m.free;
    return `${(cents / 100).toLocaleString()} MAD`;
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
      draft: { label: m.draft, variant: 'secondary' },
      published: { label: m.published, variant: 'default' },
      pending_review: { label: m.pendingReview, variant: 'outline' },
      suspended: { label: m.suspended, variant: 'destructive' },
      archived: { label: m.archived, variant: 'secondary' },
    };
    const s = map[status] || map.draft;
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

  const ListingCard = ({ listing }: { listing: MarketplaceListing }) => (
    <Card className="h-full hover:shadow-lg transition-shadow">
      {listing.cover_image_url && (
        <div className="h-40 bg-muted rounded-t-lg overflow-hidden">
          <img src={listing.cover_image_url} alt={listing.title} className="w-full h-full object-cover" />
        </div>
      )}
      <CardHeader>
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="text-lg line-clamp-2">{listing.title}</CardTitle>
          {listing.rating_count > 0 && (
            <div className="flex items-center gap-1 shrink-0">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium">{listing.rating_avg}</span>
            </div>
          )}
        </div>
        <CardDescription className="line-clamp-2">{listing.short_description || listing.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Badge variant="outline">{listing.category}</Badge>
          {listing.purchase_count > 0 && (
            <span className="flex items-center gap-1"><Users className="h-3 w-3" />{listing.purchase_count}</span>
          )}
        </div>
        <div className="flex justify-between items-center pt-2">
          <span className="text-xl font-bold">{formatPrice(listing.price_cents)}</span>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={() => toggleSaveCourse(listing.id)}>
              <Heart className={`h-4 w-4 ${savedCourses.includes(listing.id) ? 'fill-red-500 text-red-500' : ''}`} />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => shareCourse(listing)}>
              <Share2 className="h-4 w-4" />
            </Button>
            <Button size="sm">{m.buyNow}</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto py-8 space-y-6">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-2">
        <ArrowLeft className="mr-2 h-4 w-4" />{t.common.back}
      </Button>

      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">{m.title}</h1>
        <p className="text-muted-foreground">{m.subtitle}</p>
      </div>

      <Tabs defaultValue="browse">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="browse" className="gap-2"><ShoppingBag className="h-4 w-4" />{m.browse}</TabsTrigger>
          {canSell && <TabsTrigger value="sell" className="gap-2"><Store className="h-4 w-4" />{m.sell}</TabsTrigger>}
          <TabsTrigger value="purchases" className="gap-2"><Package className="h-4 w-4" />{m.myPurchases}</TabsTrigger>
        </TabsList>

        {/* Browse Tab */}
        <TabsContent value="browse" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative md:col-span-2">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input placeholder={m.searchCourses} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger><SelectValue placeholder={m.category} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{m.allCategories}</SelectItem>
                    <SelectItem value="technology">Technology</SelectItem>
                    <SelectItem value="management">Management</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="cybersecurity">Cybersecurity</SelectItem>
                    <SelectItem value="soft-skills">Soft Skills</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">{t.common.loading}</div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={ShoppingBag}
              title={m.emptyMarketplace}
              description={m.emptyMarketplaceDesc}
              actionLabel={canSell ? m.createListing : undefined}
              onAction={canSell ? () => setShowCreateDialog(true) : undefined}
              highlights={canSell ? (m.sellHighlights as unknown as string[]) : undefined}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map(listing => <ListingCard key={listing.id} listing={listing} />)}
            </div>
          )}
        </TabsContent>

        {/* Sell Tab */}
        {canSell && (
          <TabsContent value="sell" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">{m.myListings}</h2>
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button><Plus className="h-4 w-4 mr-2" />{m.createListing}</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{m.createListing}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">{m.listingTitle}</label>
                      <Input value={newListing.title} onChange={e => setNewListing(p => ({ ...p, title: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-sm font-medium">{m.shortDescription}</label>
                      <Input value={newListing.short_description} onChange={e => setNewListing(p => ({ ...p, short_description: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-sm font-medium">{m.listingDescription}</label>
                      <Textarea value={newListing.description} onChange={e => setNewListing(p => ({ ...p, description: e.target.value }))} rows={4} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">{m.price}</label>
                        <Input type="number" min={0} value={newListing.price_cents / 100} onChange={e => setNewListing(p => ({ ...p, price_cents: Math.round(Number(e.target.value) * 100) }))} />
                      </div>
                      <div>
                        <label className="text-sm font-medium">{m.category}</label>
                        <Select value={newListing.category} onValueChange={v => setNewListing(p => ({ ...p, category: v }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="technology">Technology</SelectItem>
                            <SelectItem value="management">Management</SelectItem>
                            <SelectItem value="marketing">Marketing</SelectItem>
                            <SelectItem value="cybersecurity">Cybersecurity</SelectItem>
                            <SelectItem value="soft-skills">Soft Skills</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">{m.coverImage}</label>
                      <Input value={newListing.cover_image_url} onChange={e => setNewListing(p => ({ ...p, cover_image_url: e.target.value }))} placeholder="https://..." />
                    </div>
                    <Button onClick={handleCreateListing} disabled={!newListing.title || createListing.isPending} className="w-full">
                      {createListing.isPending ? t.common.loading : m.createListing}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {myListings.length === 0 ? (
              <EmptyState
                icon={Store}
                title={m.noListingsYet}
                description={m.noListingsDesc}
                actionLabel={m.createListing}
                onAction={() => setShowCreateDialog(true)}
                highlights={m.sellHighlights as unknown as string[]}
              />
            ) : (
              <div className="space-y-3">
                {myListings.map(listing => (
                  <Card key={listing.id} className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium truncate">{listing.title}</h3>
                          {statusBadge(listing.status)}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{listing.short_description}</p>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-right">
                          <p className="font-semibold">{formatPrice(listing.price_cents)}</p>
                          <p className="text-xs text-muted-foreground">{listing.purchase_count} {m.sales}</p>
                        </div>
                        {listing.status === 'draft' && (
                          <Button size="sm" onClick={() => publishListing.mutate(listing.id)}>
                            {m.publishListing}
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        )}

        {/* Purchases Tab */}
        <TabsContent value="purchases" className="space-y-6">
          {myPurchases.length === 0 ? (
            <EmptyState
              icon={Package}
              title={m.noPurchasesYet}
              description={m.noPurchasesDesc}
              actionLabel={m.browse}
              onAction={() => {
                const el = document.querySelector('[data-value="browse"]') as HTMLElement;
                el?.click();
              }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myPurchases.map(purchase => (
                <Card key={purchase.id} className="p-4">
                  <div className="space-y-2">
                    <h3 className="font-medium">{purchase.listing?.title || 'Course'}</h3>
                    <p className="text-sm text-muted-foreground">{purchase.listing?.short_description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{formatPrice(purchase.amount_cents)}</span>
                      <Badge variant="secondary">{m.purchased}</Badge>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
