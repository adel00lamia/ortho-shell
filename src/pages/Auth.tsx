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
import { Sparkles, ArrowRight, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const { signIn, signUp, user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { language } = useLanguage();

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
      toast({ variant: "destructive", title: language === 'fr' ? "Erreur de connexion" : "Error signing in", description: error.message });
    } else {
      toast({ title: language === 'fr' ? "Bienvenue !" : "Welcome back!", description: language === 'fr' ? "Vous êtes connecté." : "You have been signed in successfully." });
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
    const { error } = await signUp(email, password, firstName, lastName);
    if (error) {
      toast({
        variant: "destructive",
        title: error.message.includes('User already registered')
          ? (language === 'fr' ? "Compte existant" : "Account already exists")
          : (language === 'fr' ? "Erreur de création" : "Error creating account"),
        description: error.message.includes('User already registered')
          ? (language === 'fr' ? "Essayez de vous connecter." : "Please try signing in instead.")
          : error.message,
      });
    } else {
      toast({ title: language === 'fr' ? "Compte créé !" : "Account created!", description: language === 'fr' ? "Vérifiez votre email." : "Please check your email to verify your account." });
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
      toast({ variant: "destructive", title: language === 'fr' ? "Erreur" : "Error sending reset email", description: error.message });
    } else {
      toast({ title: language === 'fr' ? "Email envoyé !" : "Reset email sent!", description: language === 'fr' ? "Vérifiez votre boîte mail." : "Check your email for password reset instructions." });
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
      toast({ variant: "destructive", title: language === 'fr' ? "Erreur" : "Error resending verification", description: error.message });
    } else {
      toast({ title: language === 'fr' ? "Email envoyé !" : "Verification email sent!" });
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: 'var(--hero-gradient)' }}>
      {/* Decorative */}
      <div className="absolute top-20 left-1/4 w-96 h-96 rounded-full bg-primary/10 blur-[120px]" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full bg-accent/10 blur-[100px]" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative z-10 w-full max-w-md px-4"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-2xl font-extrabold text-white tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans' }}>
            TrainPro Academy
          </span>
        </div>

        <Card className="border-border/50 shadow-2xl">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl text-center" style={{ fontFamily: 'Plus Jakarta Sans' }}>
              {resetMode
                ? (language === 'fr' ? 'Réinitialiser le mot de passe' : 'Reset Password')
                : (language === 'fr' ? 'Bienvenue' : 'Welcome')}
            </CardTitle>
            <CardDescription className="text-center">
              {resetMode
                ? (language === 'fr' ? 'Entrez votre email pour recevoir les instructions' : 'Enter your email to receive reset instructions')
                : (language === 'fr' ? 'Connectez-vous ou créez un compte' : 'Sign in or create a new account')}
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
                  {isLoading ? (language === 'fr' ? 'Envoi...' : 'Sending...') : (language === 'fr' ? 'Envoyer' : 'Send Reset Email')}
                </Button>
                <Button type="button" variant="ghost" className="w-full" onClick={() => setResetMode(false)}>
                  {language === 'fr' ? 'Retour à la connexion' : 'Back to Sign In'}
                </Button>
              </form>
            ) : (
              <Tabs defaultValue="signin" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="signin">{language === 'fr' ? 'Connexion' : 'Sign In'}</TabsTrigger>
                  <TabsTrigger value="signup">{language === 'fr' ? 'Inscription' : 'Sign Up'}</TabsTrigger>
                </TabsList>
                <TabsContent value="signin">
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signin-email">Email</Label>
                      <Input id="signin-email" name="email" type="email" placeholder="your@email.com" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signin-password">{language === 'fr' ? 'Mot de passe' : 'Password'}</Label>
                      <Input id="signin-password" name="password" type="password" required />
                    </div>
                    <Button type="submit" className="w-full gap-2" disabled={isLoading}>
                      {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                      {isLoading ? (language === 'fr' ? 'Connexion...' : 'Signing in...') : (language === 'fr' ? 'Se connecter' : 'Sign In')}
                      {!isLoading && <ArrowRight className="h-4 w-4" />}
                    </Button>
                    <div className="text-center">
                      <Button type="button" variant="link" className="text-sm text-muted-foreground" onClick={() => setResetMode(true)}>
                        {language === 'fr' ? 'Mot de passe oublié ?' : 'Forgot your password?'}
                      </Button>
                    </div>
                  </form>
                </TabsContent>
                <TabsContent value="signup">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">{language === 'fr' ? 'Prénom' : 'First Name'}</Label>
                        <Input id="firstName" name="firstName" placeholder="John" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">{language === 'fr' ? 'Nom' : 'Last Name'}</Label>
                        <Input id="lastName" name="lastName" placeholder="Doe" required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input id="signup-email" name="email" type="email" placeholder="your@email.com" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">{language === 'fr' ? 'Mot de passe' : 'Password'}</Label>
                      <Input id="signup-password" name="password" type="password" required minLength={6} />
                      <p className="text-xs text-muted-foreground">{language === 'fr' ? '6 caractères minimum' : 'At least 6 characters'}</p>
                    </div>
                    <Button type="submit" className="w-full gap-2" disabled={isLoading}>
                      {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                      {isLoading ? (language === 'fr' ? 'Création...' : 'Creating account...') : (language === 'fr' ? 'Créer un compte' : 'Create Account')}
                      {!isLoading && <ArrowRight className="h-4 w-4" />}
                    </Button>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">
                        {language === 'fr' ? 'Email non reçu ?' : "Didn't receive verification email?"}{' '}
                        <Button
                          type="button"
                          variant="link"
                          className="text-sm p-0 h-auto"
                          onClick={() => {
                            const emailInput = document.getElementById('signup-email') as HTMLInputElement;
                            if (emailInput?.value) handleResendVerification(emailInput.value);
                            else toast({ variant: "destructive", title: language === 'fr' ? "Entrez votre email" : "Please enter your email first" });
                          }}
                        >
                          {language === 'fr' ? 'Renvoyer' : 'Resend'}
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
          © {new Date().getFullYear()} TrainPro Academy
        </p>
      </motion.div>
    </div>
  );
};

export default Auth;
