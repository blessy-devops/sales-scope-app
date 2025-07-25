import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function Setup() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validations
    if (!fullName || !email || !password || !confirmPassword) {
      setError('Por favor, preencha todos os campos');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      setLoading(false);
      return;
    }

    try {
      // Create the first admin user using normal signup
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          }
        }
      });

      if (authError) throw authError;

      // Update user profile to mark as non-first-login since this is admin setup
      if (authData.user) {
        // Wait a bit for the profile to be created by the trigger, then update
        setTimeout(async () => {
          try {
            await supabase
              .from('user_profiles')
              .update({ 
                first_login: false,
                created_by: null // This is the initial admin
              })
              .eq('id', authData.user.id);
            console.log('Profile updated successfully');
          } catch (err) {
            console.error('Error updating profile:', err);
          }
        }, 2000); // Increased timeout to 2 seconds
      }

      // Set default invite code if not exists
      await supabase
        .from('system_settings')
        .upsert({
          key: 'invite_code',
          value: 'blessy2024'
        }, {
          onConflict: 'key'
        });

      navigate('/login');
    } catch (error: any) {
      console.error('Error creating admin user:', error);
      setError(error.message || 'Não foi possível criar o usuário administrador');
    } finally {
      setLoading(false);
    }
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

        {/* Setup Card */}
        <Card className="border-border/50 shadow-lg">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold">Configuração Inicial</CardTitle>
            <CardDescription>
              Crie a primeira conta de administrador do sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="fullName">Nome Completo</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Digite seu nome completo"
                  required
                />
              </div>
              
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
                  placeholder="Digite sua senha (mín. 6 caracteres)"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirme sua senha"
                  required
                />
              </div>
              
              <Alert>
                <AlertDescription>
                  Esta será a conta principal de administrador do sistema. 
                  O código de convite padrão será definido como "blessy2024".
                </AlertDescription>
              </Alert>
              
              <Button 
                type="submit" 
                className="w-full"
                disabled={loading}
              >
                {loading ? 'Configurando...' : 'Configurar Sistema'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}