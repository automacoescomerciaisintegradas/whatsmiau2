// Lead Types
export interface Lead {
  id: number;
  nome: string;
  whatsapp: string;
  email?: string;
  empresa?: string;
  site?: string;
  instagram?: string;
  linkedin?: string;
  localizacao?: string;
  valor: number;
  fonte: string;
  status: string;
  temperatura: string;
  observacoes?: string;
  tags?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateLeadRequest {
  nome: string;
  whatsapp: string;
  email?: string;
  empresa?: string;
  site?: string;
  instagram?: string;
  linkedin?: string;
  localizacao?: string;
  valor?: number;
  fonte?: string;
  status?: string;
  temperatura?: string;
  observacoes?: string;
}

export interface UpdateLeadRequest {
  nome?: string;
  email?: string;
  empresa?: string;
  site?: string;
  instagram?: string;
  linkedin?: string;
  localizacao?: string;
  valor?: number;
  fonte?: string;
  status?: string;
  temperatura?: string;
  observacoes?: string;
}

export interface LeadFilters {
  status?: string;
  temperatura?: string;
  fonte?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface LeadStats {
  total: number;
  novos: number;
  em_contato: number;
  negociacao: number;
  fechados: number;
  perdidos: number;
  valor_total: number;
  conversao: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  error?: string;
  data?: T;
}

export interface LeadsListResponse {
  success: boolean;
  count: number;
  leads: Lead[];
}

export interface LeadDetailResponse {
  success: boolean;
  lead: Lead;
}

export interface LeadStatsResponse {
  success: boolean;
  stats: LeadStats;
}

// Lead Status Options
export const LEAD_STATUS = {
  novo: 'Novo',
  em_contato: 'Em Contato',
  negociacao: 'Negociação',
  fechado: 'Fechado',
  perdido: 'Perdido'
} as const;

export type LeadStatus = keyof typeof LEAD_STATUS;

// Lead Temperature Options  
export const LEAD_TEMPERATURA = {
  frio: 'Frio',
  morno: 'Morno',
  quente: 'Quente'
} as const;

export type LeadTemperatura = keyof typeof LEAD_TEMPERATURA;

// Lead Source Options
export const LEAD_FONTE = {
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
  facebook: 'Facebook',
  linkedin: 'LinkedIn',
  site: 'Site',
  indicacao: 'Indicação',
  outro: 'Outro'
} as const;

export type LeadFonte = keyof typeof LEAD_FONTE;
