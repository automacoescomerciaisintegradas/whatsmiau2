package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

const (
	baseURL = "http://localhost:8085"
)

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type LoginResponse struct {
	Token string `json:"token"`
	User  struct {
		ID    int    `json:"id"`
		Email string `json:"email"`
		Name  string `json:"name"`
	} `json:"user"`
}

type SendTextRequest struct {
	Number      string      `json:"number"`
	TextMessage TextMessage `json:"textMessage"`
	Options     *Options    `json:"options,omitempty"`
}

type TextMessage struct {
	Text string `json:"text"`
}

type Options struct {
	Delay       int    `json:"delay,omitempty"`
	Presence    string `json:"presence,omitempty"`
	LinkPreview bool   `json:"linkPreview,omitempty"`
}

func main() {
	fmt.Println("=== Teste de Envio de Mensagem WhatsMiau2 ===\n")

	// Passo 1: Login
	fmt.Println("1. Fazendo login...")
	token := login("test@test.com", "test123")
	if token == "" {
		fmt.Println("❌ Falha no login. Certifique-se de que o usuário existe.")
		fmt.Println("\nPara criar um usuário de teste:")
		fmt.Println("curl -X POST http://localhost:8085/v1/auth/register \\")
		fmt.Println("  -H 'Content-Type: application/json' \\")
		fmt.Println("  -d '{\"name\":\"Test User\",\"email\":\"test@test.com\",\"password\":\"test123\"}'")
		return
	}
	fmt.Printf("✅ Login bem-sucedido! Token: %s...\n\n", token[:20])

	// Passo 2: Listar instâncias
	fmt.Println("2. Listando instâncias...")
	instances := listInstances(token)
	if len(instances) == 0 {
		fmt.Println("❌ Nenhuma instância encontrada.")
		fmt.Println("\nPara criar uma instância, acesse: http://localhost:8085/")
		return
	}

	instanceID := instances[0]
	fmt.Printf("✅ Usando instância: %s\n\n", instanceID)

	// Passo 3: Enviar mensagem
	fmt.Println("3. Enviando mensagem de teste...")
	sendMessage(token, instanceID, "558894227586", "Olá! Esta é uma mensagem de teste do WhatsMiau2.")
}

func login(email, password string) string {
	reqBody := LoginRequest{
		Email:    email,
		Password: password,
	}

	jsonData, _ := json.Marshal(reqBody)
	resp, err := http.Post(baseURL+"/v1/auth/login", "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		fmt.Printf("Erro ao fazer requisição: %v\n", err)
		return ""
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		body, _ := io.ReadAll(resp.Body)
		fmt.Printf("Erro no login (Status %d): %s\n", resp.StatusCode, string(body))
		return ""
	}

	var loginResp LoginResponse
	if err := json.NewDecoder(resp.Body).Decode(&loginResp); err != nil {
		fmt.Printf("Erro ao decodificar resposta: %v\n", err)
		return ""
	}

	return loginResp.Token
}

func listInstances(token string) []string {
	req, _ := http.NewRequest("GET", baseURL+"/v1/instance", nil)
	req.Header.Set("Authorization", "Bearer "+token)

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		fmt.Printf("Erro ao listar instâncias: %v\n", err)
		return nil
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		body, _ := io.ReadAll(resp.Body)
		fmt.Printf("Erro ao listar instâncias (Status %d): %s\n", resp.StatusCode, string(body))
		return nil
	}

	var instances []map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&instances); err != nil {
		fmt.Printf("Erro ao decodificar instâncias: %v\n", err)
		return nil
	}

	var ids []string
	for _, inst := range instances {
		if id, ok := inst["id"].(string); ok {
			ids = append(ids, id)
			fmt.Printf("   - %s (Status: %v)\n", id, inst["status"])
		}
	}

	return ids
}

func sendMessage(token, instanceID, number, text string) {
	reqBody := SendTextRequest{
		Number: number,
		TextMessage: TextMessage{
			Text: text,
		},
		Options: &Options{
			Delay:    1000,
			Presence: "composing",
		},
	}

	jsonData, _ := json.Marshal(reqBody)

	url := fmt.Sprintf("%s/v1/message/sendText/%s", baseURL, instanceID)
	req, _ := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+token)

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		fmt.Printf("❌ Erro ao enviar mensagem: %v\n", err)
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)

	if resp.StatusCode == 200 {
		fmt.Printf("✅ Mensagem enviada com sucesso!\n")
		fmt.Printf("Resposta: %s\n", string(body))
	} else {
		fmt.Printf("❌ Erro ao enviar mensagem (Status %d)\n", resp.StatusCode)
		fmt.Printf("Resposta: %s\n", string(body))

		// Dicas de troubleshooting
		if resp.StatusCode == 404 {
			fmt.Println("\n💡 Dica: Verifique se o ID da instância está correto")
		} else if resp.StatusCode == 400 {
			fmt.Println("\n💡 Dica: A instância pode não estar conectada. Conecte via QR Code primeiro.")
		} else if resp.StatusCode == 401 {
			fmt.Println("\n💡 Dica: Token inválido ou expirado. Faça login novamente.")
		}
	}
}
