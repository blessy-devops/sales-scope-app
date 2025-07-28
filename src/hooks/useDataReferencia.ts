import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getDaysInMonth } from 'date-fns';

type CalculationMode = 'd-1' | 'd0';

export function useDataReferencia() {
  const [mode, setMode] = useState<CalculationMode>('d-1'); // default
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchCalculationMode();
  }, []);

  const fetchCalculationMode = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'calculation_mode')
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = not found
        throw error;
      }
      
      if (data) {
        setMode(data.value as CalculationMode);
      }
    } catch (error) {
      console.error('Error fetching calculation mode:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveCalculationMode = async (newMode: CalculationMode) => {
    try {
      const { error } = await supabase
        .from('system_settings')
        .upsert({
          key: 'calculation_mode',
          value: newMode
        }, {
          onConflict: 'key'
        });
      
      if (error) throw error;
      setMode(newMode);
    } catch (error) {
      console.error('Error saving calculation mode:', error);
      throw error;
    }
  };
  
  const hoje = new Date();
  const dataReferencia = new Date(hoje);
  
  if (mode === 'd-1') {
    dataReferencia.setDate(dataReferencia.getDate() - 1);
  }
  
  const diaAtual = dataReferencia.getDate();
  const diasPassados = diaAtual;
  const totalDiasDoMes = getDaysInMonth(hoje);
  const diasRestantes = totalDiasDoMes - diaAtual;
  
  return { 
    dataReferencia, 
    diasPassados, 
    diasRestantes, 
    totalDiasDoMes,
    mode, 
    loading,
    saveCalculationMode,
    hoje
  };
}