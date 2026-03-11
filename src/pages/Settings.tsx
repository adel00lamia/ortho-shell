import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Calendar, CreditCard, Users, User, Save, Building2, Shield, FileText, Download } from 'lucide-react';
import { exportAppFeaturesPDF } from '@/lib/appFeaturesPDF';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';

const DISCOVERY_MODE = import.meta.env.DEV && import.meta.env.VITE_DISCOVERY_MODE === 'true';

interface Profile {
  first_name: string;
  last_name: string;
  avatar_url: string;
  company_id: string | null;
}

interface Subscription {
  id: string;
  plan: string;
  interval: 'monthly' | 'annual';
  status: 'trialing' | 'active' | 'past_due' | 'canceled';
  current_period_end: string;
  seats: number;
  stripe_subscription_id: string;
  created_at: string;
}

const Settings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { language } = useLanguage();
  const isFr = language === 'fr';

  // Profile state
  const [profile, setProfile] = useState<Profile>({
    first_name: '',
    last_name: '',
    avatar_url: '',
    company_id: null,
  });
  const [profileLoading, setProfileLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Billing state
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [billingLoading, setBillingLoading] = useState(true);

  // Team roles state
  const [teamMembers, setTeamMembers] = useState<{ user_id: string; email: string; role: string; first_name: string; last_name: string }[]>([]);
  const [teamLoading, setTeamLoading] = useState(true);
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
    loadSubscription();
  }, [user]);

  useEffect(() => {
    if (profile.company_id) loadTeamMembers();
  }, [profile.company_id]);

  const loadProfile = async () => {
    if (!user) {
      if (DISCOVERY_MODE) {
        setProfile({
          first_name: 'Demo',
          last_name: 'User',
          avatar_url: '',
          company_id: null,
        });
      }
      setProfileLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('first_name, last_name, avatar_url, company_id')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error loading profile:', error);
      } else if (data) {
        setProfile({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          avatar_url: data.avatar_url || '',
          company_id: data.company_id,
        });
      }
    } catch (err) {
      console.error('Error loading profile:', err);
    } finally {
      setProfileLoading(false);
    }
  };

  const loadSubscription = async () => {
    if (!user) {
      setBillingLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['trialing', 'active', 'past_due'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching subscription:', error);
      }
      setSubscription(data as Subscription | null);
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setBillingLoading(false);
    }
  };

  const loadTeamMembers = async () => {
    if (!user || !profile.company_id) {
      setTeamLoading(false);
      return;
    }
    try {
      // Get all profiles in the same company
      const { data: profiles, error: profErr } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .eq('company_id', profile.company_id);
      if (profErr) throw profErr;

      // Get all roles
      const userIds = (profiles || []).map(p => p.id);
      if (userIds.length === 0) { setTeamLoading(false); return; }

      const { data: roles, error: roleErr } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', userIds);
      if (roleErr) throw roleErr;

      // Get emails from auth (via profiles join isn't possible, use the user's own email for self, otherwise show name)
      const roleMap = new Map((roles || []).map(r => [r.user_id, r.role]));

      const members = (profiles || []).map(p => ({
        user_id: p.id,
        email: p.id === user.id ? (user.email || '') : '',
        role: roleMap.get(p.id) || 'employee',
        first_name: p.first_name || '',
        last_name: p.last_name || '',
      }));

      setTeamMembers(members);
    } catch (err) {
      console.error('Error loading team:', err);
    } finally {
      setTeamLoading(false);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    setUpdatingRole(userId);
    try {
      // Upsert the role
      const { error } = await supabase
        .from('user_roles')
        .upsert([{ user_id: userId, role: newRole as any }], { onConflict: 'user_id,role' });

      if (error) {
        await supabase.from('user_roles').delete().eq('user_id', userId);
        const { error: insertErr } = await supabase
          .from('user_roles')
          .insert([{ user_id: userId, role: newRole as any }]);
        if (insertErr) throw insertErr;
      }

      setTeamMembers(prev => prev.map(m => m.user_id === userId ? { ...m, role: newRole } : m));
      toast({ title: isFr ? 'Rôle mis à jour' : 'Role updated' });
    } catch (err) {
      console.error('Error updating role:', err);
      toast({ variant: 'destructive', title: isFr ? 'Erreur' : 'Error updating role' });
    } finally {
      setUpdatingRole(null);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) {
      if (DISCOVERY_MODE) {
        toast({
          title: isFr ? 'Mode découverte' : 'Discovery Mode',
          description: isFr
            ? 'Connectez-vous pour sauvegarder votre profil.'
            : 'Sign in to save your profile.',
        });
      }
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: profile.first_name,
          last_name: profile.last_name,
          avatar_url: profile.avatar_url,
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: isFr ? 'Profil mis à jour' : 'Profile updated',
        description: isFr
          ? 'Vos informations ont été sauvegardées.'
          : 'Your information has been saved.',
      });
    } catch (err) {
      console.error('Error saving profile:', err);
      toast({
        title: isFr ? 'Erreur' : 'Error',
        description: isFr
          ? 'Impossible de sauvegarder le profil.'
          : 'Could not save profile.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString(isFr ? 'fr-FR' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'trialing': return 'bg-blue-500';
      case 'active': return 'bg-green-500';
      case 'past_due': return 'bg-orange-500';
      case 'canceled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getPlanPrice = (plan: string, interval: string) => {
    const prices: Record<string, Record<string, number>> = {
      starter: { monthly: 2500, annual: 2075 },
      professional: { monthly: 7500, annual: 6225 },
      enterprise: { monthly: 15000, annual: 12450 },
    };
    return prices[plan]?.[interval] || 0;
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">{isFr ? 'Paramètres' : 'Settings'}</h1>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              {isFr ? 'Profil' : 'Profile'}
            </TabsTrigger>
            <TabsTrigger value="billing" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              {isFr ? 'Facturation' : 'Billing'}
            </TabsTrigger>
            <TabsTrigger value="team" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              {isFr ? 'Équipe & Rôles' : 'Team & Roles'}
            </TabsTrigger>
            <TabsTrigger value="features" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {isFr ? 'Guide App' : 'App Guide'}
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {isFr ? 'Informations personnelles' : 'Personal Information'}
                </CardTitle>
                <CardDescription>
                  {isFr
                    ? 'Gérez vos informations de profil.'
                    : 'Manage your profile information.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {profileLoading ? (
                  <p className="text-muted-foreground">{isFr ? 'Chargement...' : 'Loading...'}</p>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="first_name">{isFr ? 'Prénom' : 'First Name'}</Label>
                        <Input
                          id="first_name"
                          value={profile.first_name}
                          onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                          placeholder={isFr ? 'Votre prénom' : 'Your first name'}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="last_name">{isFr ? 'Nom' : 'Last Name'}</Label>
                        <Input
                          id="last_name"
                          value={profile.last_name}
                          onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                          placeholder={isFr ? 'Votre nom' : 'Your last name'}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        value={user?.email || (DISCOVERY_MODE ? 'demo@example.com' : '')}
                        disabled
                        className="bg-muted"
                      />
                      <p className="text-xs text-muted-foreground">
                        {isFr
                          ? "L'email ne peut pas être modifié ici."
                          : 'Email cannot be changed here.'}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="avatar_url">{isFr ? 'URL de l\'avatar' : 'Avatar URL'}</Label>
                      <Input
                        id="avatar_url"
                        value={profile.avatar_url}
                        onChange={(e) => setProfile({ ...profile, avatar_url: e.target.value })}
                        placeholder="https://example.com/avatar.png"
                      />
                    </div>

                    {profile.company_id && (
                      <div className="pt-2">
                        <Button variant="outline" asChild>
                          <a href="/company-profile" className="flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            {isFr ? 'Modifier le profil entreprise' : 'Edit Company Profile'}
                          </a>
                        </Button>
                      </div>
                    )}

                    <div className="flex justify-end pt-4">
                      <Button onClick={handleSaveProfile} disabled={saving} className="flex items-center gap-2">
                        <Save className="h-4 w-4" />
                        {saving
                          ? (isFr ? 'Sauvegarde...' : 'Saving...')
                          : (isFr ? 'Sauvegarder' : 'Save Changes')}
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing">
            {billingLoading ? (
              <p className="text-muted-foreground">{isFr ? 'Chargement...' : 'Loading...'}</p>
            ) : !subscription ? (
              <Card>
                <CardHeader>
                  <CardTitle>{isFr ? 'Aucun abonnement actif' : 'No Active Subscription'}</CardTitle>
                  <CardDescription>
                    {isFr
                      ? "Vous n'avez pas d'abonnement actif. Commencez votre essai gratuit !"
                      : "You don't have an active subscription. Start your free trial today!"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild>
                    <a href="/pricing">{isFr ? 'Voir les plans' : 'View Plans'}</a>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      {isFr ? 'Plan actuel' : 'Current Plan'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-lg">
                          {subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {isFr ? 'Facturé' : 'Billed'} {subscription.interval}
                        </div>
                      </div>
                      <Badge className={getStatusColor(subscription.status)}>
                        {subscription.status === 'trialing'
                          ? (isFr ? 'Essai' : 'Trial')
                          : subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                      </Badge>
                    </div>
                    <div className="text-2xl font-bold">
                      {new Intl.NumberFormat('en-MA', {
                        style: 'currency',
                        currency: 'MAD',
                        minimumFractionDigits: 0,
                      }).format(getPlanPrice(subscription.plan, subscription.interval))}
                      <span className="text-sm font-normal text-muted-foreground">
                        /{subscription.interval === 'annual' ? (isFr ? 'an' : 'year') : (isFr ? 'mois' : 'month')}
                      </span>
                    </div>
                    <Button
                      onClick={() =>
                        toast({
                          title: isFr ? 'Bientôt disponible' : 'Coming soon',
                          description: isFr
                            ? 'Le portail de gestion sera bientôt disponible.'
                            : 'Subscription management portal will be available soon.',
                        })
                      }
                      className="w-full"
                    >
                      {isFr ? 'Gérer l\'abonnement' : 'Manage Subscription'}
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      {isFr ? 'Détails de facturation' : 'Billing Details'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="text-sm text-muted-foreground">
                        {subscription.status === 'trialing'
                          ? (isFr ? 'Fin de l\'essai' : 'Trial ends')
                          : (isFr ? 'Prochaine facturation' : 'Next billing date')}
                      </div>
                      <div className="font-semibold">{formatDate(subscription.current_period_end)}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {subscription.seats} {isFr ? 'siège' : 'seat'}{subscription.seats !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Team & Roles Tab */}
          <TabsContent value="team">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  {isFr ? 'Gestion des rôles' : 'Role Management'}
                </CardTitle>
                <CardDescription>
                  {isFr ? 'Modifiez les rôles des membres de votre équipe' : 'Change your team members\' roles'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {teamLoading ? (
                  <p className="text-sm text-muted-foreground">{isFr ? 'Chargement...' : 'Loading...'}</p>
                ) : teamMembers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{isFr ? 'Aucun membre trouvé' : 'No team members found'}</p>
                ) : (
                  <div className="space-y-3">
                    {teamMembers.map(member => (
                      <div key={member.user_id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div>
                          <p className="font-medium text-sm">
                            {member.first_name || member.last_name
                              ? `${member.first_name} ${member.last_name}`.trim()
                              : (member.email || member.user_id.slice(0, 8))}
                          </p>
                          {member.email && <p className="text-xs text-muted-foreground">{member.email}</p>}
                          {member.user_id === user?.id && (
                            <Badge variant="outline" className="text-xs mt-1">{isFr ? 'Vous' : 'You'}</Badge>
                          )}
                        </div>
                        <Select
                          value={member.role}
                          onValueChange={(val) => handleUpdateRole(member.user_id, val)}
                          disabled={updatingRole === member.user_id}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">{isFr ? 'Administrateur' : 'Administrator'}</SelectItem>
                            <SelectItem value="hr_manager">{isFr ? 'Responsable RH' : 'HR Manager'}</SelectItem>
                            <SelectItem value="trainer">{isFr ? 'Formateur' : 'Trainer'}</SelectItem>
                            <SelectItem value="employee">{isFr ? 'Employé' : 'Employee'}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Settings;
