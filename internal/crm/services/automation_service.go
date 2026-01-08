package services

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"whatsmiau2/internal/crm/models"
	"whatsmiau2/internal/crm/repository"
	"whatsmiau2/internal/whatsapp"

	"go.mau.fi/whatsmeow/types"
	waProto "go.mau.fi/whatsmeow/binary/proto"
)

// AutomationService gerencia as regras de automação
type AutomationService struct {
	repo     repository.AutomationRepository
	manager  *whatsapp.Manager
}

// NewAutomationService cria novo serviço de automação
func NewAutomationService(repo repository.AutomationRepository, manager *whatsapp.Manager) *AutomationService {
	return &AutomationService{
		repo:    repo,
		manager: manager,
	}
}

// CreateRule cria nova regra de automação
func (s *AutomationService) CreateRule(req *models.CreateAutomationRuleRequest) (*models.AutomationRule, error) {
	// Converter os dados do trigger para JSON
	triggerData, err := json.Marshal(req.TriggerData)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal trigger data: %w", err)
	}

	// Converter as ações para JSON
	actions, err := json.Marshal(req.Actions)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal actions: %w", err)
	}

	// Criar a regra
	rule := &models.AutomationRule{
		Name:        req.Name,
		Description: req.Description,
		TriggerType: req.TriggerType,
		TriggerData: string(triggerData),
		Actions:     string(actions),
		Enabled:     req.Enabled,
	}

	if err := s.repo.CreateAutomationRule(rule); err != nil {
		return nil, fmt.Errorf("failed to create automation rule: %w", err)
	}

	// Criar as ações individualmente
	for _, actionReq := range req.Actions {
		action := &models.AutomationAction{
			RuleID:     rule.ID,
			ActionType: actionReq.ActionType,
			Order:      actionReq.Order,
		}

		actionData, err := json.Marshal(actionReq.ActionData)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal action data: %w", err)
		}
		action.ActionData = string(actionData)

		if err := s.repo.CreateAutomationAction(action); err != nil {
			return nil, fmt.Errorf("failed to create automation action: %w", err)
		}
	}

	return rule, nil
}

// ExecuteRule executa uma regra de automação para um lead específico
func (s *AutomationService) ExecuteRule(ruleID int64, lead *models.Lead) error {
	// Obter a regra
	rule, err := s.repo.GetAutomationRule(ruleID)
	if err != nil {
		return fmt.Errorf("failed to get automation rule: %w", err)
	}

	if !rule.Enabled {
		return fmt.Errorf("automation rule is not enabled")
	}

	// Criar registro de execução
	execution := &models.AutomationExecution{
		RuleID: rule.ID,
		LeadID: lead.ID,
		Status: "processing",
	}
	if err := s.repo.CreateAutomationExecution(execution); err != nil {
		return fmt.Errorf("failed to create automation execution: %w", err)
	}

	// Obter ações da regra
	actions, err := s.repo.GetAutomationActionsByRule(rule.ID)
	if err != nil {
		s.updateExecutionError(execution.ID, fmt.Sprintf("failed to get automation actions: %v", err))
		return fmt.Errorf("failed to get automation actions: %w", err)
	}

	// Executar ações sequencialmente
	for _, action := range actions {
		if err := s.executeAction(action, lead); err != nil {
			s.updateExecutionError(execution.ID, fmt.Sprintf("failed to execute action: %v", err))
			return fmt.Errorf("failed to execute action: %w", err)
		}
	}

	// Atualizar status da execução para completado
	if err := s.repo.UpdateAutomationExecutionStatus(execution.ID, "completed", nil); err != nil {
		log.Printf("Failed to update execution status: %v", err)
	}

	return nil
}

// executeAction executa uma ação específica
func (s *AutomationService) executeAction(action *models.AutomationAction, lead *models.Lead) error {
	switch action.ActionType {
	case "send_message":
		return s.executeSendMessageAction(action, lead)
	case "update_lead":
		return s.executeUpdateLeadAction(action, lead)
	case "create_task":
		return s.executeCreateTaskAction(action, lead)
	default:
		return fmt.Errorf("unknown action type: %s", action.ActionType)
	}
}

// executeSendMessageAction executa ação de envio de mensagem
func (s *AutomationService) executeSendMessageAction(action *models.AutomationAction, lead *models.Lead) error {
	var msgData models.SendMessageActionData
	if err := json.Unmarshal([]byte(action.ActionData), &msgData); err != nil {
		return fmt.Errorf("failed to unmarshal message action data: %w", err)
	}

	// Aguardar tempo especificado antes de enviar
	if msgData.WaitTime > 0 {
		time.Sleep(time.Duration(msgData.WaitTime) * time.Second)
	}

	// Obter cliente do WhatsApp
	client, exists := s.manager.GetClient(msgData.InstanceID)
	if !exists {
		return fmt.Errorf("whatsapp client not found for instance: %s", msgData.InstanceID)
	}

	if !client.IsConnected() {
		return fmt.Errorf("whatsapp client is not connected for instance: %s", msgData.InstanceID)
	}

	// Enviar mensagem para o lead
	ctx := context.Background()

	// Preparar o número de telefone do lead
	// Remover caracteres não numéricos e garantir formato correto
	phone := lead.WhatsApp
	// Remover caracteres não numéricos
	var cleanPhone string
	for _, r := range phone {
		if r >= '0' && r <= '9' {
			cleanPhone += string(r)
		}
	}

	// Adicionar @c.us para formar o JID
	jid := cleanPhone + "@c.us"

	// Converter string para JID
	recipientJid, err := types.ParseJID(jid)
	if err != nil {
		return fmt.Errorf("failed to parse recipient JID: %w", err)
	}

	// Enviar mensagem de texto
	_, err = client.WA.SendMessage(ctx, recipientJid, &waProto.Message{
		Conversation: &msgData.Message,
	})

	if err != nil {
		return fmt.Errorf("failed to send message to %s: %w", lead.WhatsApp, err)
	}

	log.Printf("Message sent successfully to %s: %s", lead.WhatsApp, msgData.Message)

	return nil
}

// executeUpdateLeadAction executa ação de atualização de lead
func (s *AutomationService) executeUpdateLeadAction(action *models.AutomationAction, lead *models.Lead) error {
	// Implementar lógica para atualizar lead com base nos dados da ação
	var updateData map[string]interface{}
	if err := json.Unmarshal([]byte(action.ActionData), &updateData); err != nil {
		return fmt.Errorf("failed to unmarshal update lead action data: %w", err)
	}

	// Atualizar campos do lead com base nos dados recebidos
	updates := &models.UpdateLeadRequest{}
	
	if status, ok := updateData["status"].(string); ok {
		updates.Status = &status
	}
	
	if temperatura, ok := updateData["temperatura"].(string); ok {
		updates.Temperatura = &temperatura
	}
	
	if observacoes, ok := updateData["observacoes"].(string); ok {
		updates.Observacoes = &observacoes
	}

	// Aqui você pode adicionar mais campos conforme necessário

	// Atualizar o lead no repositório
	// Isso seria feito com um repositório de leads, que não está injetado aqui
	// Para simplificar, vamos apenas retornar um erro indicando que precisa ser implementado
	return fmt.Errorf("update lead action not fully implemented - would update lead %d with data: %+v", lead.ID, updateData)
}

// executeCreateTaskAction executa ação de criação de tarefa
func (s *AutomationService) executeCreateTaskAction(action *models.AutomationAction, lead *models.Lead) error {
	// Implementar lógica para criar tarefa com base nos dados da ação
	var taskData map[string]interface{}
	if err := json.Unmarshal([]byte(action.ActionData), &taskData); err != nil {
		return fmt.Errorf("failed to unmarshal create task action data: %w", err)
	}

	// Aqui você criaria uma tarefa com base nos dados recebidos
	// Por enquanto, faremos um log da ação
	log.Printf("Would create task for lead %s with data: %+v", lead.WhatsApp, taskData)

	return nil
}

// updateExecutionError atualiza o status de execução com erro
func (s *AutomationService) updateExecutionError(executionID int64, errorMsg string) {
	errorStr := errorMsg
	if err := s.repo.UpdateAutomationExecutionStatus(executionID, "failed", &errorStr); err != nil {
		log.Printf("Failed to update execution error status: %v", err)
	}
}

// TriggerAutomation verifica se alguma regra deve ser acionada com base em um evento
func (s *AutomationService) TriggerAutomation(eventType string, eventData map[string]interface{}) error {
	// Obter todas as regras habilitadas
	rules, err := s.repo.ListAutomationRules(&[]bool{true}[0]) // Apenas regras habilitadas
	if err != nil {
		return fmt.Errorf("failed to list automation rules: %w", err)
	}

	// Verificar cada regra para ver se o evento a aciona
	for _, rule := range rules {
		if rule.TriggerType == eventType {
			// Verificar se os dados do evento correspondem aos critérios da regra
			if s.matchesTriggerCriteria(rule, eventData) {
				// Obter o lead do evento
				leadID, ok := eventData["lead_id"].(float64) // JSON unmarshals numbers as float64
				if !ok {
					log.Printf("No lead_id found in event data for rule %d", rule.ID)
					continue
				}

				// Obter o lead do banco de dados (isso exigiria um repositório de leads)
				// Por simplificação, vamos apenas logar a tentativa
				log.Printf("Would execute rule %d for lead %d", rule.ID, int64(leadID))

				// Em uma implementação completa, aqui chamaríamos s.ExecuteRule(rule.ID, &lead)
			}
		}
	}

	return nil
}

// matchesTriggerCriteria verifica se os dados do evento correspondem aos critérios da regra
func (s *AutomationService) matchesTriggerCriteria(rule *models.AutomationRule, eventData map[string]interface{}) bool {
	// Por enquanto, apenas verificamos se o tipo de trigger corresponde
	// Em uma implementação mais completa, isso faria verificações mais detalhadas
	return true // Simplificação para esta implementação
}