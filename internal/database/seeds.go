package database

import (
	"whatsmiau2/internal/models"

	"gorm.io/gorm"
)

// SeedPlans populates the database with the default subscription plans
func (d *Database) SeedPlans() error {
	// 1. Deactivate old/legacy plans to ensure they don't show up in the UI
	legacyPlans := []string{"Plano Mensal", "Plano Semestral", "Plano Anual"}
	if err := d.DB.Model(&models.Plan{}).Where("name IN ?", legacyPlans).Update("active", false).Error; err != nil {
		return err
	}

	// 2. Define New Premium Plans
	newPlans := []models.Plan{
		{
			Name:         "Teste Gratis 3h",
			Price:        0.00,
			DurationDays: 0,
			Features:     `["1 Instância WhatsApp", "Acesso completo por 3 horas", "Sem cartão de crédito", "Ideal para testes rápidos"]`,
			Active:       true,
			Description:  "Plano de teste por 3 horas",
		},
		{
			Name:         "Starter",
			Price:        97.00,
			DurationDays: 30,
			Features:     `["1 Instância WhatsApp", "Envios Manuais Ilimitados", "Suporte por Email", "Acesso à Comunidade", "Webhooks Básicos", "Documentação da Minha API", "Acesso Swagger", "Documentação Whatsmeow"]`,
			Active:       true,
			Description:  "Plano mensal",
		},
		{
			Name:         "Professional",
			Price:        197.00,
			DurationDays: 30,
			Features:     `["3 Instâncias WhatsApp", "Chatbot Inteligente (Simples)", "Disparador em Massa", "Suporte Prioritário", "Webhooks Avançados", "Documentação da Minha API"]`,
			Active:       true,
			Description:  "Plano mensal",
		},
		{
			Name:         "Scale",
			Price:        299.00,
			DurationDays: 30,
			Features:     `["10 Instâncias WhatsApp", "Chatbot com IA (Gemini)", "Múltiplos Usuários", "API White Label", "Gerente de Contas", "Documentação da Minha API"]`,
			Active:       true,
			Description:  "Plano mensal",
		},
		{
			Name:         "Enterprise",
			Price:        499.00,
			DurationDays: 30,
			Features:     `["Instâncias Ilimitadas", "Infraestrutura Dedicada", "SLA Garantido", "Personalização Total", "Consultoria Mensal", "Documentação da Minha API"]`,
			Active:       true,
			Description:  "Plano mensal",
		},
	}

	// 3. Upsert Plans (Update if exists, Create if not)
	for _, plan := range newPlans {
		var existing models.Plan
		result := d.DB.Where("name = ?", plan.Name).First(&existing)

		if result.Error == nil {
			// Update existing plan
			existing.Price = plan.Price
			existing.DurationDays = plan.DurationDays
			existing.Features = plan.Features
			existing.Active = true // Re-activate if it was inactive
			existing.Description = plan.Description
			d.DB.Save(&existing)
		} else if result.Error == gorm.ErrRecordNotFound {
			// Create new plan
			d.DB.Create(&plan)
		} else {
			return result.Error
		}
	}

	return nil
}
