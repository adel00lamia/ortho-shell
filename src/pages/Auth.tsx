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

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const { signIn, signUp, user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

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
      toast({ variant: "destructive", title: "Error signing in", description: error.message });
    } else {
      toast({ title: "Welcome back!", description: "You have been signed in successfully." });
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
        title: error.message.includes('User already registered') ? "Account already exists" : "Error creating account",
        description: error.message.includes('User already registered') ? "Please try signing in instead." : error.message,
      });
    } else {
      toast({ title: "Account created!", description: "Please check your email to verify your account." });
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
      toast({ variant: "destructive", title: "Error sending reset email", description: error.message });
    } else {
      toast({ title: "Reset email sent!", description: "Check your email for password reset instructions." });
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
      toast({ variant: "destructive", title: "Error resending verification", description: error.message });
    } else {
      toast({ title: "Verification email sent!", description: "Check your email for the verification link." });
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">FLM Academy</CardTitle>
          <CardDescription className="text-center">
            Sign in to your account or create a new one
          </CardDescription>
        </CardHeader>
        <CardContent>
          {resetMode ? (
            <div className="space-y-4">
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">Reset Password</h3>
                <p className="text-sm text-muted-foreground">Enter your email to receive reset instructions</p>
              </div>
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email</Label>
                  <Input id="reset-email" name="email" type="email" placeholder="your@email.com" required />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Sending..." : "Send Reset Email"}
                </Button>
                <Button type="button" variant="ghost" className="w-full" onClick={() => setResetMode(false)}>
                  Back to Sign In
                </Button>
              </form>
            </div>
          ) : (
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input id="signin-email" name="email" type="email" placeholder="your@email.com" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <Input id="signin-password" name="password" type="password" required />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>
                  <div className="text-center">
                    <Button type="button" variant="link" className="text-sm" onClick={() => setResetMode(true)}>
                      Forgot your password?
                    </Button>
                  </div>
                </form>
              </TabsContent>
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input id="firstName" name="firstName" placeholder="John" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input id="lastName" name="lastName" placeholder="Doe" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input id="signup-email" name="email" type="email" placeholder="your@email.com" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input id="signup-password" name="password" type="password" required />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Creating account..." : "Create Account"}
                  </Button>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      Didn't receive verification email?{' '}
                      <Button
                        type="button"
                        variant="link"
                        className="text-sm p-0 h-auto"
                        onClick={() => {
                          const emailInput = document.getElementById('signup-email') as HTMLInputElement;
                          if (emailInput?.value) {
                            handleResendVerification(emailInput.value);
                          } else {
                            toast({ variant: "destructive", title: "Please enter your email first" });
                          }
                        }}
                      >
                        Resend
                      </Button>
                    </p>
                  </div>
                </form>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
