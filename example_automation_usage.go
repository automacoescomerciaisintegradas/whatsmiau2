package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

// Exemplo de como usar as funcionalidades de automação do WhatsMiau2

// Exemplo de criação de regra de automação
func createAutomationRule(apiURL, apiKey string) error {
	// Definir a regra de automação
	ruleData := map[string]interface{}{
		"name":        "Boas-vindas a nova lead",
		"description": "Enviar mensagem de boas-vindas para novos leads",
		"trigger_type": "new_lead",
		"trigger_data": map[string]interface{}{
			"status": "novo",
		},
		"actions": []map[string]interface{}{
			{
				"action_type": "send_message",
				"action_data": map[string]interface{}{
					"instance_id": "minha_instancia_whatsapp",
					"message":     "Olá! Seja bem-vindo(a)! Agradecemos seu contato.",
					"wait_time":   2,
				},
				"order": 1,
			},
		},
		"enabled": true,
	}

	jsonData, err := json.Marshal(ruleData)
	if err != nil {
		return fmt.Errorf("falha ao converter dados para JSON: %v", err)
	}

	// Criar a requisição HTTP
	req, err := http.NewRequest("POST", apiURL+"/v1/crm/automation/rules", bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("falha ao criar requisição: %v", err)
	}

	// Adicionar cabeçalhos
	req.Header.Set("Content-Type", "application/json")
	if apiKey != "" {
		req.Header.Set("Authorization", "Bearer "+apiKey)
	}

	// Enviar a requisição
	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("falha ao enviar requisição: %v", err)
	}
	defer resp.Body.Close()

	// Ler a resposta
	if resp.StatusCode == 201 {
		fmt.Println("✅ Regra de automação criada com sucesso!")
	} else {
		fmt.Printf("⚠️ Falha ao criar regra de automação. Status: %d\n", resp.StatusCode)
	}

	return nil
}

// Exemplo de listagem de regras de automação
func listAutomationRules(apiURL, apiKey string) error {
	// Criar a requisição HTTP
	req, err := http.NewRequest("GET", apiURL+"/v1/crm/automation/rules", nil)
	if err != nil {
		return fmt.Errorf("falha ao criar requisição: %v", err)
	}

	// Adicionar cabeçalhos
	if apiKey != "" {
		req.Header.Set("Authorization", "Bearer "+apiKey)
	}

	// Enviar a requisição
	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("falha ao enviar requisição: %v", err)
	}
	defer resp.Body.Close()

	// Ler a resposta
	if resp.StatusCode == 200 {
		fmt.Println("✅ Regras de automação listadas com sucesso!")
	} else {
		fmt.Printf("⚠️ Falha ao listar regras de automação. Status: %d\n", resp.StatusCode)
	}

	return nil
}

func exampleMain() {
	apiURL := "http://localhost:8085" // Substitua pela URL do seu servidor
	apiKey := ""                      // Substitua pela sua sua chave de API, se houver

	fmt.Println("🚀 Iniciando demonstração do sistema de automação do WhatsMiau2...")

	// Criar uma regra de automação de exemplo
	fmt.Println("\n1. Criando regra de automação...")
	if err := createAutomationRule(apiURL, apiKey); err != nil {
		fmt.Printf("❌ Erro ao criar regra de automação: %v\n", err)
	}

	// Listar regras de automação
	fmt.Println("\n2. Listando regras de automação...")
	if err := listAutomationRules(apiURL, apiKey); err != nil {
		fmt.Printf("❌ Erro ao listar regras de automação: %v\n", err)
	}

	fmt.Println("\n✨ Demonstração concluída!")
	fmt.Println("\n📋 Funcionalidades implementadas:")
	fmt.Println("- Criação de regras de automação com diferentes triggers")
	fmt.Println("- Ações configuráveis (envio de mensagens, atualização de leads, etc.)")
	fmt.Println("- Integração com o sistema de WhatsApp para envio automático de mensagens")
	fmt.Println("- Armazenamento persistente das regras no banco de dados")
	fmt.Println("- API REST para gerenciamento das regras")
	
	fmt.Println("\n🎯 Possíveis usos:")
	fmt.Println("- Envio automático de mensagens de boas-vindas")
	fmt.Println("- Sequências de follow-up para leads")
	fmt.Println("- Atualização automática de status de leads")
	fmt.Println("- Integração com sistemas de CRM existentes")
}