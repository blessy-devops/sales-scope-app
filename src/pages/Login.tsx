import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signIn, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';
  const message = location.state?.message;

  useEffect(() => {
    if (message) {
      setSuccess(message);
    }
  }, [message]);

  useEffect(() => {
    if (user) {
      // Check if user needs to change password on first login
      checkFirstLogin();
    }
  }, [user]);

  const checkFirstLogin = async () => {
    if (!user) return;
    
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('first_login')
      .eq('id', user.id)
      .single();

    if (profile?.first_login) {
      navigate('/change-password');
    } else {
      navigate(from, { replace: true });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password) {
      setError('Por favor, preencha todos os campos');
      setLoading(false);
      return;
    }

    const { error } = await signIn(email, password);
    
    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        setError('Email ou senha incorretos');
      } else {
        setError(error.message);
      }
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center">
          <img
            src="https://uvqugawzhtcajucqbvro.supabase.co/storage/v1/object/sign/logo-blessy/blessy-logo-branca.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV84NjA5NmFiNC1iOGEwLTQ3YjktOTI5My03NTlkMzBmZDllMjkiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJsb2dvLWJsZXNzeS9ibGVzc3ktbG9nby1icmFuY2EucG5nIiwiaWF0IjoxNzUzNDE2MDQ3LCJleHAiOjE4Nzk1NjAwNDd9.lmqIiLO83M7rODEY1l35ug_osTQe4fVIxMGvbV2VuAU"
            alt="Blessy Logo"
            className="mx-auto h-16 w-auto"
          />
        </div>

        {/* Login Card */}
        <Card className="border-border/50 shadow-lg">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold">Entrar</CardTitle>
            <CardDescription>
              Entre com suas credenciais para acessar o sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {success && (
                <Alert>
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}
              
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Digite seu email"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite sua senha"
                  required
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full"
                disabled={loading}
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>
            
            <div className="mt-4 space-y-2 text-center">
              <p className="text-sm text-muted-foreground">
                <Link 
                  to="/forgot-password" 
                  className="font-medium text-primary hover:underline"
                >
                  Esqueci minha senha
                </Link>
              </p>
              <p className="text-sm text-muted-foreground">
                Não tem uma conta?{' '}
                <Link 
                  to="/signup" 
                  className="font-medium text-primary hover:underline"
                >
                  Criar conta
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}