import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

const db = supabase as any;

export interface MarketplaceListing {
  id: string;
  seller_id: string;
  module_id: string | null;
  title: string;
  description: string | null;
  short_description: string | null;
  price_cents: number;
  currency: string;
  category: string;
  tags: string[];
  cover_image_url: string | null;
  preview_url: string | null;
  status: string;
  platform_fee_percent: number;
  rating_avg: number;
  rating_count: number;
  purchase_count: number;
  created_at: string;
  seller_name?: string;
}

export interface MarketplacePurchase {
  id: string;
  listing_id: string;
  buyer_id: string;
  amount_cents: number;
  status: string;
  purchased_at: string;
  listing?: MarketplaceListing;
}

export function usePublishedListings(category?: string) {
  return useQuery({
    queryKey: ['marketplace-listings', category],
    queryFn: async () => {
      let query = db
        .from('marketplace_listings')
        .select('*')
        .eq('status', 'published')
        .order('purchase_count', { ascending: false });

      if (category && category !== 'all') {
        query = query.eq('category', category);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as MarketplaceListing[];
    },
  });
}

export function useMyListings() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['my-listings', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await db
        .from('marketplace_listings')
        .select('*')
        .eq('seller_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as MarketplaceListing[];
    },
  });
}

export function useMyPurchases() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['my-purchases', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await db
        .from('marketplace_purchases')
        .select('*, listing:marketplace_listings(*)')
        .eq('buyer_id', user!.id)
        .eq('status', 'completed')
        .order('purchased_at', { ascending: false });
      if (error) throw error;
      return (data || []) as MarketplacePurchase[];
    },
  });
}

export function useHasPurchased(listingId: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['has-purchased', listingId, user?.id],
    enabled: !!user && !!listingId,
    queryFn: async () => {
      const { data } = await db
        .from('marketplace_purchases')
        .select('id')
        .eq('listing_id', listingId)
        .eq('buyer_id', user!.id)
        .eq('status', 'completed')
        .maybeSingle();
      return !!data;
    },
  });
}

export function useCreateListing() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (listing: {
      title: string;
      description?: string;
      short_description?: string;
      price_cents: number;
      currency?: string;
      category: string;
      tags?: string[];
      cover_image_url?: string;
      module_id?: string;
    }) => {
      const { data, error } = await db
        .from('marketplace_listings')
        .insert({
          ...listing,
          seller_id: user!.id,
          status: 'draft',
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-listings'] });
      toast({ title: 'Listing created' });
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });
}

export function useUpdateListing() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<MarketplaceListing> & { id: string }) => {
      const { data, error } = await db
        .from('marketplace_listings')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-listings'] });
      queryClient.invalidateQueries({ queryKey: ['marketplace-listings'] });
      toast({ title: 'Listing updated' });
    },
  });
}

export function usePublishListing() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db
        .from('marketplace_listings')
        .update({ status: 'published', updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-listings'] });
      queryClient.invalidateQueries({ queryKey: ['marketplace-listings'] });
      toast({ title: 'Listing published!' });
    },
  });
}

export function useStripeAccount() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['stripe-account', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await db
        .from('trainer_stripe_accounts')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();
      return data;
    },
  });
}

export function useListingReviews(listingId: string) {
  return useQuery({
    queryKey: ['listing-reviews', listingId],
    enabled: !!listingId,
    queryFn: async () => {
      const { data, error } = await db
        .from('marketplace_reviews')
        .select('*')
        .eq('listing_id', listingId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}