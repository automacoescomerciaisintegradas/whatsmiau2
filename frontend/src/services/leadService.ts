import type {
  Lead,
  CreateLeadRequest,
  UpdateLeadRequest,
  LeadFilters,
  LeadsListResponse,
  LeadDetailResponse,
  LeadStatsResponse
} from '../types/lead';

// API Base URL - configure based on environment
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

class LeadService {
  private baseUrl = `${API_BASE_URL}/api/crm/leads`;

  /**
   * Create a new lead
   */
  async createLead(data: CreateLeadRequest): Promise<Lead> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create lead');
    }

    const result = await response.json();
    return result.lead;
  }

  /**
   * Get a single lead by ID
   */
  async getLead(id: number): Promise<Lead> {
    const response = await fetch(`${this.baseUrl}?id=${id}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch lead');
    }

    const result: LeadDetailResponse = await response.json();
    return result.lead;
  }

  /**
   * List leads with optional filters
   */
  async listLeads(filters?: LeadFilters): Promise<{ leads: Lead[]; count: number }> {
    const params = new URLSearchParams();
    
    if (filters) {
      if (filters.status) params.append('status', filters.status);
      if (filters.temperatura) params.append('temperatura', filters.temperatura);
      if (filters.fonte) params.append('fonte', filters.fonte);
      if (filters.search) params.append('search', filters.search);
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.offset) params.append('offset', filters.offset.toString());
    }

    const url = params.toString() ? `${this.baseUrl}?${params.toString()}` : this.baseUrl;
    const response = await fetch(url);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch leads');
    }

    const result: LeadsListResponse = await response.json();
    return {
      leads: result.leads || [],
      count: result.count || 0
    };
  }

  /**
   * Update an existing lead
   */
  async updateLead(id: number, data: UpdateLeadRequest): Promise<void> {
    const response = await fetch(`${this.baseUrl}?id=${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update lead');
    }
  }

  /**
   * Delete a lead
   */
  async deleteLead(id: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}?id=${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete lead');
    }
  }

  /**
   * Get lead statistics
   */
  async getStats(): Promise<LeadStatsResponse['stats']> {
    const response = await fetch(`${this.baseUrl}/stats`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch stats');
    }

    const result: LeadStatsResponse = await response.json();
    return result.stats;
  }
}

// Export singleton instance
export const leadService = new LeadService();
export default leadService;
