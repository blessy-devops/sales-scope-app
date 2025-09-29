import { useState, useCallback } from 'react';
import { SubChannel, CreateSubChannelData } from '@/types/subChannel';

export interface OverlapValidation {
  type: 'error' | 'warning' | 'none';
  message: string;
  conflictingChannels: SubChannel[];
}

interface OverlapDetection {
  exact_vs_exact: boolean;
  contains_vs_contains: boolean;
  exact_vs_contains: boolean;
}

export function useOverlapValidation(existingSubChannels: SubChannel[], parentChannelId: string) {
  const [validationState, setValidationState] = useState<OverlapValidation>({
    type: 'none',
    message: '',
    conflictingChannels: []
  });

  const validateOverlap = useCallback((formData: CreateSubChannelData, currentSubChannelId?: string): OverlapValidation => {
    // Filter out current sub-channel if editing and get only same parent channel
    const relevantChannels = existingSubChannels.filter(sc => 
      sc.parent_channel_id === parentChannelId && 
      sc.id !== currentSubChannelId
    );

    const conflicts: SubChannel[] = [];
    let worstConflictType: 'error' | 'warning' | 'none' = 'none';
    const conflictMessages: string[] = [];

    for (const existing of relevantChannels) {
      const detection = detectOverlapType(formData, existing);
      
      if (detection.exact_vs_exact) {
        conflicts.push(existing);
        worstConflictType = 'error';
        conflictMessages.push(`🚫 Conflito EXATO com "${existing.name}": UTMs idênticos`);
      } else if (detection.exact_vs_contains) {
        conflicts.push(existing);
        if (worstConflictType !== 'error') worstConflictType = 'warning';
        conflictMessages.push(`⚠️ Possível conflito com "${existing.name}": UTM exato vs contém`);
      } else if (detection.contains_vs_contains) {
        const overlapLevel = calculateContainsOverlap(formData, existing);
        if (overlapLevel === 'high') {
          conflicts.push(existing);
          if (worstConflictType !== 'error') worstConflictType = 'warning';
          conflictMessages.push(`⚠️ Alta sobreposição com "${existing.name}": UTMs muito similares`);
        }
      }
    }

    const result: OverlapValidation = {
      type: worstConflictType,
      message: conflictMessages.length > 0 
        ? conflictMessages.join('\n') 
        : worstConflictType === 'none' 
          ? '✅ Nenhum conflito detectado' 
          : '',
      conflictingChannels: conflicts
    };

    setValidationState(result);
    return result;
  }, [existingSubChannels, parentChannelId]);

  return {
    validationState,
    validateOverlap,
    setValidationState
  };
}

function detectOverlapType(newData: CreateSubChannelData, existing: SubChannel): OverlapDetection {
  const newSource = newData.utm_source.toLowerCase().trim();
  const newMedium = newData.utm_medium.toLowerCase().trim();
  const existingSource = existing.utm_source.toLowerCase().trim();
  const existingMedium = existing.utm_medium.toLowerCase().trim();

  // Source must always match exactly since it's always 'exact' matching
  const sourceMatch = newSource === existingSource;
  
  if (!sourceMatch) {
    // No overlap if sources don't match exactly
    return {
      exact_vs_exact: false,
      exact_vs_contains: false,
      contains_vs_contains: false
    };
  }

  // With same source, check medium matching based on utm_medium_matching_type
  const exact_vs_exact = 
    newData.utm_medium_matching_type === 'exact' && 
    existing.utm_medium_matching_type === 'exact' &&
    newMedium === existingMedium;

  const exact_vs_contains = 
    (newData.utm_medium_matching_type === 'exact' && existing.utm_medium_matching_type === 'contains' &&
     existingMedium.includes(newMedium)) ||
    (newData.utm_medium_matching_type === 'contains' && existing.utm_medium_matching_type === 'exact' &&
     newMedium.includes(existingMedium));

  const contains_vs_contains = 
    newData.utm_medium_matching_type === 'contains' && 
    existing.utm_medium_matching_type === 'contains' &&
    (newMedium.includes(existingMedium) || existingMedium.includes(newMedium));

  return {
    exact_vs_exact,
    exact_vs_contains,
    contains_vs_contains
  };
}

function calculateContainsOverlap(newData: CreateSubChannelData, existing: SubChannel): 'none' | 'low' | 'medium' | 'high' {
  const newSource = newData.utm_source.toLowerCase().trim();
  const newMedium = newData.utm_medium.toLowerCase().trim();
  const existingSource = existing.utm_source.toLowerCase().trim();
  const existingMedium = existing.utm_medium.toLowerCase().trim();

  // Source must match exactly (always 'exact' matching)
  if (newSource !== existingSource) return 'none';
  
  // Calculate overlap score based only on medium since source already matches
  let overlapScore = 50; // Base score for matching source
  
  // Medium overlap evaluation
  if (newMedium === existingMedium) overlapScore += 50;
  else if (newMedium.includes(existingMedium) || existingMedium.includes(newMedium)) overlapScore += 30;
  else if (calculateStringSimilarity(newMedium, existingMedium) > 0.7) overlapScore += 20;

  if (overlapScore >= 80) return 'high';
  if (overlapScore >= 70) return 'medium';
  if (overlapScore >= 60) return 'low';
  return 'none';
}

function calculateStringSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }
  
  return matrix[str2.length][str1.length];
}