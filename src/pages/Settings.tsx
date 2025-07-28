import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useTheme } from 'next-themes';
import { Plus, Trash2, Key, User, Calendar } from 'lucide-react';
import { useDataReferencia } from '@/hooks/useDataReferencia';

interface DashboardConfig {
  showTotalSales: boolean;
  showGlobalTarget: boolean;
  showGapPercentage: boolean;
  showGapValue: boolean;
  showDailyTarget: boolean;
  showChart: boolean;
  showChannelCards: boolean;
  showQuickActions: boolean;
}

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
  created_by: string | null;
}

export default function Settings() {
  const { toast } = useToast();
  const { setPreference, getPreference, loading } = useUserPreferences();
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { mode, saveCalculationMode } = useDataReferencia();
  
  // Dashboard preferences state
  const [config, setConfig] = useState<DashboardConfig>({
    showTotalSales: true,
    showGlobalTarget: true,
    showGapPercentage: true,
    showGapValue: true,
    showDailyTarget: true,
    showChart: true,
    showChannelCards: true,
    showQuickActions: true,
  });

  // Users management state
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isInviteCodeOpen, setIsInviteCodeOpen] = useState(false);
  const [currentInviteCode, setCurrentInviteCode] = useState('');
  
  // Add user form
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [addingUser, setAddingUser] = useState(false);
  
  // Invite code form
  const [newInviteCode, setNewInviteCode] = useState('');
  const [updatingCode, setUpdatingCode] = useState(false);

  useEffect(() => {
    if (!loading) {
      const dashboardConfig = getPreference('dashboardConfig', config);
      setConfig(dashboardConfig);
    }
  }, [loading, getPreference]);

  useEffect(() => {
    fetchUsers();
    fetchInviteCode();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar a lista de usuários.',
        variant: 'destructive',
      });
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchInviteCode = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'invite_code')
        .single();

      if (error) throw error;
      setCurrentInviteCode(data?.value || '');
      setNewInviteCode(data?.value || '');
    } catch (error) {
      console.error('Error fetching invite code:', error);
    }
  };

  const handleConfigChange = (key: keyof DashboardConfig, value: boolean) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const saveConfiguration = async () => {
    try {
      await setPreference('dashboardConfig', config);
      toast({
        title: 'Sucesso',
        description: 'Configurações salvas com sucesso!',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar as configurações.',
        variant: 'destructive',
      });
    }
  };

  const addUser = async () => {
    if (!newUserName || !newUserEmail || !newUserPassword) {
      toast({
        title: 'Erro',
        description: 'Por favor, preencha todos os campos.',
        variant: 'destructive',
      });
      return;
    }

    setAddingUser(true);
    try {
      // Create user via regular signup flow
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUserEmail,
        password: newUserPassword,
        options: {
          data: {
            full_name: newUserName
          }
        }
      });

      if (authError) throw authError;

      // The user profile will be created automatically by the trigger
      // Update it to set created_by after a brief delay to ensure the trigger completed
      if (authData.user) {
        setTimeout(async () => {
          await supabase
            .from('user_profiles')
            .update({ 
              created_by: user?.id 
            })
            .eq('id', authData.user.id);
        }, 1000);

        // Send welcome email (optional - will fail silently if Resend is not configured)
        try {
          await supabase.functions.invoke('send-welcome-email', {
            body: {
              name: newUserName,
              email: newUserEmail,
              temporaryPassword: newUserPassword
            }
          });
        } catch (emailError) {
          console.log('Welcome email not sent (Resend not configured):', emailError);
        }
      }

      toast({
        title: 'Sucesso',
        description: 'Usuário criado com sucesso!',
      });

      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
      setIsAddUserOpen(false);
      await fetchUsers();
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível criar o usuário.',
        variant: 'destructive',
      });
    } finally {
      setAddingUser(false);
    }
  };

  const removeUser = async (userId: string) => {
    if (userId === user?.id) {
      toast({
        title: 'Erro',
        description: 'Você não pode remover seu próprio usuário.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Delete user profile (this will cascade delete the auth user)
      const { error } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', userId);
      
      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Usuário removido com sucesso!',
      });

      await fetchUsers();
    } catch (error: any) {
      console.error('Error removing user:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível remover o usuário.',
        variant: 'destructive',
      });
    }
  };

  const updateInviteCode = async () => {
    if (!newInviteCode.trim()) {
      toast({
        title: 'Erro',
        description: 'Por favor, insira um código de convite.',
        variant: 'destructive',
      });
      return;
    }

    setUpdatingCode(true);
    try {
      const { error } = await supabase
        .from('system_settings')
        .update({ value: newInviteCode.trim() })
        .eq('key', 'invite_code');

      if (error) throw error;

      setCurrentInviteCode(newInviteCode.trim());
      setIsInviteCodeOpen(false);
      
      toast({
        title: 'Sucesso',
        description: 'Código de convite atualizado com sucesso!',
      });
    } catch (error: any) {
      console.error('Error updating invite code:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o código de convite.',
        variant: 'destructive',
      });
    } finally {
      setUpdatingCode(false);
    }
  };

  const handleCalculationModeChange = async (newMode: 'd-1' | 'd0') => {
    try {
      await saveCalculationMode(newMode);
      toast({
        title: 'Sucesso',
        description: 'Modo de cálculo atualizado com sucesso!',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o modo de cálculo.',
        variant: 'destructive',
      });
    }
  };

  const configItems = [
    {
      key: 'showTotalSales' as keyof DashboardConfig,
      label: 'Vendas Realizadas',
      description: 'Exibir valor total de vendas realizadas'
    },
    {
      key: 'showGlobalTarget' as keyof DashboardConfig,
      label: 'Meta Global',
      description: 'Exibir valor da meta global'
    },
    {
      key: 'showGapPercentage' as keyof DashboardConfig,
      label: 'GAP (%)',
      description: 'Exibir percentual do GAP'
    },
    {
      key: 'showGapValue' as keyof DashboardConfig,
      label: 'GAP (Valor)',
      description: 'Exibir valor absoluto do GAP'
    },
    {
      key: 'showDailyTarget' as keyof DashboardConfig,
      label: 'Meta Diária',
      description: 'Exibir meta diária necessária'
    },
    {
      key: 'showChart' as keyof DashboardConfig,
      label: 'Gráfico',
      description: 'Exibir gráfico de vendas vs meta'
    },
    {
      key: 'showChannelCards' as keyof DashboardConfig,
      label: 'Cards dos Canais',
      description: 'Exibir cards com dados por canal'
    },
    {
      key: 'showQuickActions' as keyof DashboardConfig,
      label: 'Ações Rápidas',
      description: 'Exibir botões de ações rápidas'
    }
  ];

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie as configurações do sistema e usuários
        </p>
      </div>

      <Tabs defaultValue="preferences" className="space-y-4">
        <TabsList>
          <TabsTrigger value="preferences">Preferências do Sistema</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
        </TabsList>

        <TabsContent value="preferences" className="space-y-4">
          {/* Dashboard Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Configurações do Dashboard</CardTitle>
              <CardDescription>
                Personalize quais elementos são exibidos no dashboard principal
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {configItems.map((item) => (
                  <div key={item.key} className="flex items-center justify-between space-x-2">
                    <div className="flex-1">
                      <Label htmlFor={item.key} className="text-sm font-medium">
                        {item.label}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                    <Switch
                      id={item.key}
                      checked={config[item.key]}
                      onCheckedChange={(checked) => handleConfigChange(item.key, checked)}
                    />
                  </div>
                ))}
              </div>
              <Button onClick={saveConfiguration} className="w-full">
                Salvar Configurações
              </Button>
            </CardContent>
          </Card>

          {/* Calculation Mode Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Modo de Cálculo de Dados
              </CardTitle>
              <CardDescription>
                Configure como os cálculos do dashboard são realizados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="calculation-mode"
                    checked={mode === 'd0'}
                    onCheckedChange={(checked) => handleCalculationModeChange(checked ? 'd0' : 'd-1')}
                  />
                  <Label htmlFor="calculation-mode" className="text-sm font-medium">
                    {mode === 'd0' ? 'Até hoje (D0)' : 'Até ontem (D-1)'}
                  </Label>
                </div>
                <div className="text-sm text-muted-foreground pl-6">
                  {mode === 'd0' 
                    ? 'Inclui o dia atual nos cálculos - útil para acompanhamento em tempo real'
                    : 'Considera apenas dias com dados completos - mais conservador'
                  }
                </div>
                <div className="bg-muted/50 p-3 rounded-lg text-sm">
                  <p className="font-medium mb-1">Como isso afeta os cálculos:</p>
                  <ul className="text-muted-foreground space-y-1 text-xs">
                    <li>• <strong>Ritmo Atual:</strong> Vendas realizadas ÷ dias {mode === 'd0' ? 'passados (incluindo hoje)' : 'completos'}</li>
                    <li>• <strong>Meta Esperada:</strong> Baseada nos dias {mode === 'd0' ? 'passados' : 'completos'}</li>
                    <li>• <strong>Projeção:</strong> Considera {mode === 'd0' ? 'dados atuais' : 'histórico completo'}</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Theme Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Tema</CardTitle>
              <CardDescription>
                Escolha o tema da interface
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="theme">Tema da Interface</Label>
                <Select value={theme} onValueChange={setTheme}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um tema" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Claro</SelectItem>
                    <SelectItem value="dark">Escuro</SelectItem>
                    <SelectItem value="system">Sistema</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          {/* Users Management Header */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Gerenciamento de Usuários</CardTitle>
                  <CardDescription>
                    Gerencie usuários do sistema e código de convite
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Dialog open={isInviteCodeOpen} onOpenChange={setIsInviteCodeOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Key className="w-4 h-4 mr-2" />
                        Código de Convite
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Gerenciar Código de Convite</DialogTitle>
                        <DialogDescription>
                          Altere o código necessário para criação de novas contas
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="currentCode">Código Atual</Label>
                          <Input
                            id="currentCode"
                            value={currentInviteCode}
                            disabled
                            className="bg-muted"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="newCode">Novo Código</Label>
                          <Input
                            id="newCode"
                            value={newInviteCode}
                            onChange={(e) => setNewInviteCode(e.target.value)}
                            placeholder="Digite o novo código de convite"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setIsInviteCodeOpen(false)}
                        >
                          Cancelar
                        </Button>
                        <Button onClick={updateInviteCode} disabled={updatingCode}>
                          {updatingCode ? 'Salvando...' : 'Salvar'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar Usuário
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Adicionar Novo Usuário</DialogTitle>
                        <DialogDescription>
                          Crie uma nova conta de usuário no sistema
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="userName">Nome Completo</Label>
                          <Input
                            id="userName"
                            value={newUserName}
                            onChange={(e) => setNewUserName(e.target.value)}
                            placeholder="Digite o nome completo"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="userEmail">Email</Label>
                          <Input
                            id="userEmail"
                            type="email"
                            value={newUserEmail}
                            onChange={(e) => setNewUserEmail(e.target.value)}
                            placeholder="Digite o email"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="userPassword">Senha Provisória</Label>
                          <Input
                            id="userPassword"
                            type="password"
                            value={newUserPassword}
                            onChange={(e) => setNewUserPassword(e.target.value)}
                            placeholder="Digite uma senha provisória"
                          />
                        </div>
                        <Alert>
                          <AlertDescription>
                            O usuário será obrigado a alterar a senha no primeiro login.
                          </AlertDescription>
                        </Alert>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setIsAddUserOpen(false)}
                        >
                          Cancelar
                        </Button>
                        <Button onClick={addUser} disabled={addingUser}>
                          {addingUser ? 'Criando...' : 'Criar Usuário'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingUsers ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Data de Criação</TableHead>
                      <TableHead>Criado Por</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((userProfile) => (
                      <TableRow key={userProfile.id}>
                        <TableCell className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          {userProfile.full_name}
                        </TableCell>
                        <TableCell>{userProfile.email}</TableCell>
                        <TableCell>
                          {new Date(userProfile.created_at).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          {userProfile.created_by || 'Sistema'}
                        </TableCell>
                        <TableCell className="text-right">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={userProfile.id === user?.id}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirmar Remoção</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja remover o usuário {userProfile.full_name}? 
                                  Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => removeUser(userProfile.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Remover
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}