import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, ArrowRight, Loader2, Eye, EyeOff, CheckCircle2, Shield, Zap, BarChart3 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [selectedRole, setSelectedRole] = useState('employee');
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, signUp, user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { language } = useLanguage();
  const fr = language === 'fr';

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, loading, navigate]);

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const { error } = await signIn(email, password);
    if (error) {
      toast({ variant: "destructive", title: fr ? "Erreur de connexion" : "Error signing in", description: error.message });
    } else {
      toast({ title: fr ? "Bienvenue !" : "Welcome back!", description: fr ? "Vous êtes connecté." : "You have been signed in successfully." });
    }
    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const { error } = await signUp(email, password, firstName, lastName, selectedRole);
    if (error) {
      toast({
        variant: "destructive",
        title: error.message.includes('User already registered')
          ? (fr ? "Compte existant" : "Account already exists")
          : (fr ? "Erreur de création" : "Error creating account"),
        description: error.message.includes('User already registered')
          ? (fr ? "Essayez de vous connecter." : "Please try signing in instead.")
          : error.message,
      });
    } else {
      toast({ title: fr ? "Compte créé !" : "Account created!", description: fr ? "Vérifiez votre email." : "Please check your email to verify your account." });
    }
    setIsLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast({ variant: "destructive", title: fr ? "Erreur" : "Error sending reset email", description: error.message });
    } else {
      toast({ title: fr ? "Email envoyé !" : "Reset email sent!", description: fr ? "Vérifiez votre boîte mail." : "Check your email for password reset instructions." });
      setResetMode(false);
    }
    setIsLoading(false);
  };

  const handleResendVerification = async (email: string) => {
    setIsLoading(true);
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: `${window.location.origin}/` },
    });
    if (error) {
      toast({ variant: "destructive", title: fr ? "Erreur" : "Error resending verification", description: error.message });
    } else {
      toast({ title: fr ? "Email envoyé !" : "Verification email sent!" });
    }
    setIsLoading(false);
  };

  const features = [
    { icon: Zap, label: fr ? 'Plans de formation IA' : 'AI Training Plans' },
    { icon: BarChart3, label: fr ? 'Analytics & ROI' : 'Analytics & ROI' },
    { icon: Shield, label: fr ? 'Conforme OFPPT/GIAC' : 'OFPPT/GIAC Compliant' },
    { icon: CheckCircle2, label: fr ? 'Certifications' : 'Certifications' },
  ];

  const PasswordInput = ({ id, name }: { id: string; name: string }) => (
    <div className="relative">
      <Input
        id={id}
        name={name}
        type={showPassword ? 'text' : 'password'}
        required
        minLength={name === 'password' && id.includes('signup') ? 6 : undefined}
        className="pr-10"
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setShowPassword(!showPassword)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
      >
        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen flex relative overflow-hidden" style={{ background: 'var(--hero-gradient)' }}>
      {/* Decorative blobs */}
      <div className="absolute top-20 left-1/4 w-96 h-96 rounded-full bg-primary/10 blur-[120px]" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full bg-accent/10 blur-[100px]" />

      {/* Left side — feature highlights (hidden on small screens) */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="hidden lg:flex flex-col justify-center flex-1 px-16 relative z-10"
      >
        <div className="max-w-md space-y-8">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-3xl font-extrabold text-white tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans' }}>
              QimataQ
            </span>
          </div>
          <p className="text-lg text-white/70 leading-relaxed">
            {fr
              ? "La plateforme tout-en-un pour diagnostiquer, planifier, exécuter et suivre vos formations d'entreprise."
              : 'The all-in-one platform to assess, plan, execute and track your corporate training programs.'}
          </p>
          <div className="grid grid-cols-2 gap-4">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="flex items-center gap-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-3"
              >
                <f.icon className="h-5 w-5 text-accent" />
                <span className="text-sm text-white/80 font-medium">{f.label}</span>
              </motion.div>
            ))}
          </div>
          <div className="flex items-center gap-2 pt-4">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/60 to-accent/60 border-2 border-white/10" />
              ))}
            </div>
            <span className="text-sm text-white/50">
              {fr ? '+500 entreprises nous font confiance' : '+500 companies trust us'}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Right side — auth form */}
      <div className="flex items-center justify-center flex-1 px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="flex items-center justify-center gap-2 mb-8 lg:hidden">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-2xl font-extrabold text-white tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans' }}>
              QimataQ
            </span>
          </div>

          <Card className="border-border/50 shadow-2xl backdrop-blur-sm">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-2xl text-center" style={{ fontFamily: 'Plus Jakarta Sans' }}>
                {resetMode
                  ? (fr ? 'Réinitialiser le mot de passe' : 'Reset Password')
                  : (fr ? 'Bienvenue' : 'Welcome')}
              </CardTitle>
              <CardDescription className="text-center">
                {resetMode
                  ? (fr ? 'Entrez votre email pour recevoir les instructions' : 'Enter your email to receive reset instructions')
                  : (fr ? 'Connectez-vous ou créez un compte' : 'Sign in or create a new account')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {resetMode ? (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-email">Email</Label>
                    <Input id="reset-email" name="email" type="email" placeholder="your@email.com" required />
                  </div>
                  <Button type="submit" className="w-full gap-2" disabled={isLoading}>
                    {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                    {isLoading ? (fr ? 'Envoi...' : 'Sending...') : (fr ? 'Envoyer' : 'Send Reset Email')}
                  </Button>
                  <Button type="button" variant="ghost" className="w-full" onClick={() => setResetMode(false)}>
                    {fr ? 'Retour à la connexion' : 'Back to Sign In'}
                  </Button>
                </form>
              ) : (
                <Tabs defaultValue="signin" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="signin">{fr ? 'Connexion' : 'Sign In'}</TabsTrigger>
                    <TabsTrigger value="signup">{fr ? 'Inscription' : 'Sign Up'}</TabsTrigger>
                  </TabsList>
                  <TabsContent value="signin">
                    <form onSubmit={handleSignIn} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signin-email">Email</Label>
                        <Input id="signin-email" name="email" type="email" placeholder="your@email.com" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signin-password">{fr ? 'Mot de passe' : 'Password'}</Label>
                        <PasswordInput id="signin-password" name="password" />
                      </div>
                      <Button type="submit" className="w-full gap-2" disabled={isLoading}>
                        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                        {isLoading ? (fr ? 'Connexion...' : 'Signing in...') : (fr ? 'Se connecter' : 'Sign In')}
                        {!isLoading && <ArrowRight className="h-4 w-4" />}
                      </Button>
                      <div className="text-center">
                        <Button type="button" variant="link" className="text-sm text-muted-foreground" onClick={() => setResetMode(true)}>
                          {fr ? 'Mot de passe oublié ?' : 'Forgot your password?'}
                        </Button>
                      </div>
                    </form>
                  </TabsContent>
                  <TabsContent value="signup">
                    <form onSubmit={handleSignUp} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">{fr ? 'Prénom' : 'First Name'}</Label>
                          <Input id="firstName" name="firstName" placeholder="John" required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName">{fr ? 'Nom' : 'Last Name'}</Label>
                          <Input id="lastName" name="lastName" placeholder="Doe" required />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-email">Email</Label>
                        <Input id="signup-email" name="email" type="email" placeholder="your@email.com" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-password">{fr ? 'Mot de passe' : 'Password'}</Label>
                        <PasswordInput id="signup-password" name="password" />
                        <p className="text-xs text-muted-foreground">{fr ? '6 caractères minimum' : 'At least 6 characters'}</p>
                      </div>
                      <div className="space-y-2">
                        <Label>{fr ? 'Rôle' : 'Role'}</Label>
                        <Select value={selectedRole} onValueChange={setSelectedRole}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">{fr ? 'Administrateur' : 'Administrator'}</SelectItem>
                            <SelectItem value="hr_manager">{fr ? 'Responsable RH' : 'HR Manager'}</SelectItem>
                            <SelectItem value="trainer">{fr ? 'Formateur' : 'Trainer'}</SelectItem>
                            <SelectItem value="employee">{fr ? 'Employé' : 'Employee'}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button type="submit" className="w-full gap-2" disabled={isLoading}>
                        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                        {isLoading ? (fr ? 'Création...' : 'Creating account...') : (fr ? 'Créer un compte' : 'Create Account')}
                        {!isLoading && <ArrowRight className="h-4 w-4" />}
                      </Button>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">
                          {fr ? 'Email non reçu ?' : "Didn't receive verification email?"}{' '}
                          <Button
                            type="button"
                            variant="link"
                            className="text-sm p-0 h-auto"
                            onClick={() => {
                              const emailInput = document.getElementById('signup-email') as HTMLInputElement;
                              if (emailInput?.value) handleResendVerification(emailInput.value);
                              else toast({ variant: "destructive", title: fr ? "Entrez votre email" : "Please enter your email first" });
                            }}
                          >
                            {fr ? 'Renvoyer' : 'Resend'}
                          </Button>
                        </p>
                      </div>
                    </form>
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>

          <p className="text-center text-xs text-white/40 mt-6">
            © {new Date().getFullYear()} QimataQ · contact@trainproacademy.ma
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;
