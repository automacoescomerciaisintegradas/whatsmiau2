package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/automacoescomerciaisintegradas/whatsmiau2/internal/crm/models"
)

// MockRepository para testes
type MockRepository struct {
	leads  map[int64]*models.Lead
	nextID int64
}

func NewMockRepository() *MockRepository {
	return &MockRepository{
		leads:  make(map[int64]*models.Lead),
		nextID: 1,
	}
}

func (m *MockRepository) CreateLead(lead *models.Lead) error {
	lead.ID = m.nextID
	m.leads[lead.ID] = lead
	m.nextID++
	return nil
}

func (m *MockRepository) GetLead(id int64) (*models.Lead, error) {
	if lead, ok := m.leads[id]; ok {
		return lead, nil
	}
	return nil, nil
}

func (m *MockRepository) UpdateLead(id int64, updates *models.UpdateLeadRequest) error {
	if lead, ok := m.leads[id]; ok {
		if updates.Nome != nil {
			lead.Nome = *updates.Nome
		}
		if updates.Status != nil {
			lead.Status = *updates.Status
		}
		return nil
	}
	return nil
}

func (m *MockRepository) DeleteLead(id int64) error {
	delete(m.leads, id)
	return nil
}

func (m *MockRepository) ListLeads(filters *models.LeadFilters) ([]*models.Lead, error) {
	result := []*models.Lead{}
	for _, lead := range m.leads {
		result = append(result, lead)
	}
	return result, nil
}

func (m *MockRepository) GetLeadStats() (*models.LeadStats, error) {
	return &models.LeadStats{
		Total: len(m.leads),
	}, nil
}

// Implementar outros métodos da interface (stubs)
func (m *MockRepository) CreateMessage(msg *models.Message) error { return nil }
func (m *MockRepository) GetMessagesByLead(leadID int64, limit int) ([]*models.Message, error) {
	return nil, nil
}
func (m *MockRepository) GetMessageStats(leadID int64) (*models.MessageStats, error) { return nil, nil }
func (m *MockRepository) CreatePayment(payment *models.Payment) error                { return nil }
func (m *MockRepository) GetPayment(id int64) (*models.Payment, error)               { return nil, nil }
func (m *MockRepository) UpdatePaymentStatus(id int64, status string, paidAt *string) error {
	return nil
}
func (m *MockRepository) GetPaymentByMPID(mpPaymentID string) (*models.Payment, error) {
	return nil, nil
}
func (m *MockRepository) GetPaymentStats() (*models.PaymentStats, error) { return nil, nil }

// Testes
func TestCreateLead(t *testing.T) {
	// Setup
	repo := NewMockRepository()
	handler := NewLeadHandler(repo)

	// Request body
	reqBody := models.CreateLeadRequest{
		Nome:     "João Silva",
		WhatsApp: "5511999999999",
		Email:    "joao@example.com",
	}
	body, _ := json.Marshal(reqBody)

	// Create request
	req := httptest.NewRequest(http.MethodPost, "/api/crm/leads", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")

	// Create response recorder
	rr := httptest.NewRecorder()

	// Execute
	handler.CreateLead(rr, req)

	// Assert
	if status := rr.Code; status != http.StatusCreated {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusCreated)
	}

	// Parse response
	var response map[string]interface{}
	json.NewDecoder(rr.Body).Decode(&response)

	if !response["success"].(bool) {
		t.Error("Expected success to be true")
	}

	if response["lead"] == nil {
		t.Error("Expected lead in response")
	}
}

func TestListLeads(t *testing.T) {
	// Setup
	repo := NewMockRepository()
	handler := NewLeadHandler(repo)

	// Add some test data
	repo.CreateLead(&models.Lead{Nome: "Lead 1", WhatsApp: "111"})
	repo.CreateLead(&models.Lead{Nome: "Lead 2", WhatsApp: "222"})

	// Create request
	req := httptest.NewRequest(http.MethodGet, "/api/crm/leads", nil)
	rr := httptest.NewRecorder()

	// Execute
	handler.ListLeads(rr, req)

	// Assert
	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}

	var response map[string]interface{}
	json.NewDecoder(rr.Body).Decode(&response)

	if count := int(response["count"].(float64)); count != 2 {
		t.Errorf("Expected 2 leads, got %d", count)
	}
}

func TestGetLeadStats(t *testing.T) {
	// Setup
	repo := NewMockRepository()
	handler := NewLeadHandler(repo)

	// Add test data
	repo.CreateLead(&models.Lead{Nome: "Lead 1", WhatsApp: "111"})

	// Create request
	req := httptest.NewRequest(http.MethodGet, "/api/crm/leads/stats", nil)
	rr := httptest.NewRecorder()

	// Execute
	handler.GetLeadStats(rr, req)

	// Assert
	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}

	var response map[string]interface{}
	json.NewDecoder(rr.Body).Decode(&response)

	stats := response["stats"].(map[string]interface{})
	if total := int(stats["total"].(float64)); total != 1 {
		t.Errorf("Expected total 1, got %d", total)
	}
}
