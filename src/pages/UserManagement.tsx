import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  Users, UserPlus, Search, Edit, Trash2, Shield, Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';

interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  role: string | null;
  created_at: string;
  company_id: string | null;
}

const fadeIn = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.35, delay: i * 0.04 },
  }),
};

const UserManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [userRoles, setUserRoles] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const { user } = useAuth();
  const { language } = useLanguage();

  useEffect(() => {
    loadUsers();
  }, [user]);

  const loadUsers = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single();
      if (!profile?.company_id) { setLoading(false); return; }

      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false });

      setUsers(profiles || []);

      // Try to load roles (admin only)
      const { data: roles } = await supabase.from('user_roles').select('user_id, role');
      if (roles) {
        const roleMap: Record<string, string> = {};
        roles.forEach(r => { roleMap[r.user_id] = r.role; });
        setUserRoles(roleMap);
      }
    } catch (err) {
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  const getUserRole = (userId: string, profileRole: string | null) => {
    return userRoles[userId] || profileRole || 'employee';
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin': return <Badge className="bg-destructive/10 text-destructive border-destructive/20">{language === 'fr' ? 'Admin' : 'Admin'}</Badge>;
      case 'hr_manager': return <Badge className="bg-primary/10 text-primary border-primary/20">{language === 'fr' ? 'RH' : 'HR Manager'}</Badge>;
      case 'trainer': return <Badge className="bg-accent/10 text-accent border-accent/20">{language === 'fr' ? 'Formateur' : 'Trainer'}</Badge>;
      default: return <Badge variant="secondary">{language === 'fr' ? 'Employé' : 'Employee'}</Badge>;
    }
  };

  const filteredUsers = users.filter(u => {
    const name = `${u.first_name || ''} ${u.last_name || ''}`.toLowerCase();
    const matchesSearch = name.includes(searchTerm.toLowerCase());
    const role = getUserRole(u.id, u.role);
    const matchesRole = filterRole === 'all' || role === filterRole;
    return matchesSearch && matchesRole;
  });

  const handleAddUser = () => {
    toast({ title: language === 'fr' ? "Fonctionnalité bientôt disponible" : "Coming soon", description: language === 'fr' ? "L'invitation d'utilisateurs sera bientôt disponible." : "User invitation will be available soon." });
    setIsAddUserOpen(false);
  };

  const handleDeleteUser = async (userId: string) => {
    toast({ title: language === 'fr' ? "Suppression non autorisée" : "Deletion not allowed", description: language === 'fr' ? "Contactez un administrateur." : "Contact an administrator.", variant: "destructive" });
  };

  const roleStats = {
    total: users.length,
    admins: users.filter(u => getUserRole(u.id, u.role) === 'admin').length,
    hrManagers: users.filter(u => getUserRole(u.id, u.role) === 'hr_manager').length,
    employees: users.filter(u => getUserRole(u.id, u.role) === 'employee').length,
  };

  return (
    <div className="space-y-6 p-6">
      <motion.div initial="hidden" animate="visible" variants={fadeIn} custom={0} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ fontFamily: 'Plus Jakarta Sans' }}>
            {language === 'fr' ? 'Gestion des utilisateurs' : 'User Management'}
          </h1>
          <p className="text-muted-foreground">{language === 'fr' ? 'Gérez les utilisateurs et les rôles' : 'Manage users, roles, and permissions'}</p>
        </div>
        <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <UserPlus className="h-4 w-4" />
              {language === 'fr' ? 'Ajouter' : 'Add User'}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{language === 'fr' ? 'Ajouter un utilisateur' : 'Add New User'}</DialogTitle>
              <DialogDescription>
                {language === 'fr' ? 'Invitez un utilisateur à rejoindre votre organisation.' : 'Invite a user to join your organization.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{language === 'fr' ? 'Prénom' : 'First Name'}</Label>
                  <Input placeholder="John" />
                </div>
                <div className="space-y-2">
                  <Label>{language === 'fr' ? 'Nom' : 'Last Name'}</Label>
                  <Input placeholder="Doe" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" placeholder="user@company.com" />
              </div>
              <div className="space-y-2">
                <Label>{language === 'fr' ? 'Rôle' : 'Role'}</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder={language === 'fr' ? 'Sélectionner' : 'Select role'} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">{language === 'fr' ? 'Employé' : 'Employee'}</SelectItem>
                    <SelectItem value="trainer">{language === 'fr' ? 'Formateur' : 'Trainer'}</SelectItem>
                    <SelectItem value="hr_manager">{language === 'fr' ? 'RH' : 'HR Manager'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleAddUser} className="w-full">
                {language === 'fr' ? 'Inviter' : 'Send Invitation'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: language === 'fr' ? 'Total' : 'Total Users', value: roleStats.total, icon: Users, color: 'text-primary' },
          { label: 'Admins', value: roleStats.admins, icon: Shield, color: 'text-destructive' },
          { label: language === 'fr' ? 'RH' : 'HR Managers', value: roleStats.hrManagers, icon: Users, color: 'text-primary' },
          { label: language === 'fr' ? 'Employés' : 'Employees', value: roleStats.employees, icon: Users, color: 'text-muted-foreground' },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div key={stat.label} initial="hidden" animate="visible" variants={fadeIn} custom={i + 1}>
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" style={{ fontFamily: 'Plus Jakarta Sans' }}>{stat.value}</div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <motion.div initial="hidden" animate="visible" variants={fadeIn} custom={5}>
        <Card>
          <CardHeader>
            <CardTitle>{language === 'fr' ? 'Utilisateurs' : 'Users'}</CardTitle>
            <CardDescription>{language === 'fr' ? 'Gérez les accès de votre organisation' : "Manage your organization's users and their access"}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={language === 'fr' ? 'Rechercher...' : 'Search users...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{language === 'fr' ? 'Tous les rôles' : 'All Roles'}</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="hr_manager">{language === 'fr' ? 'RH' : 'HR Manager'}</SelectItem>
                  <SelectItem value="trainer">{language === 'fr' ? 'Formateur' : 'Trainer'}</SelectItem>
                  <SelectItem value="employee">{language === 'fr' ? 'Employé' : 'Employee'}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">{language === 'fr' ? 'Aucun utilisateur trouvé' : 'No users found'}</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{language === 'fr' ? 'Utilisateur' : 'User'}</TableHead>
                    <TableHead>{language === 'fr' ? 'Rôle' : 'Role'}</TableHead>
                    <TableHead>{language === 'fr' ? 'Inscrit le' : 'Joined'}</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((u) => {
                    const role = getUserRole(u.id, u.role);
                    return (
                      <TableRow key={u.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                              {(u.first_name || '?')[0]}{(u.last_name || '')[0]}
                            </div>
                            <div>
                              <div className="font-medium">{u.first_name || ''} {u.last_name || ''}</div>
                              <div className="text-xs text-muted-foreground">{u.id.slice(0, 8)}…</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getRoleBadge(role)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(u.created_at).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteUser(u.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default UserManagement;
