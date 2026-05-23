package crm

import (
	"errors"
	"fmt"
	"time"

	"whatsmiau2/internal/database"
	"whatsmiau2/internal/models"

	"gorm.io/gorm"
)

type SubscriptionService struct {
	db *database.Database
}

func NewSubscriptionService(db *database.Database) *SubscriptionService {
	return &SubscriptionService{db: db}
}

// CreateSubscription creates a new subscription for a user
func (s *SubscriptionService) CreateSubscription(userID, planID uint, providerID string) (*models.Subscription, error) {
	// Check if user already has an active subscription
	var existingSub models.Subscription
	if err := s.db.DB.Where("user_id = ? AND status = ?", userID, models.SubscriptionStatusActive).First(&existingSub).Error; err == nil {
		// If user wants to change to a different plan, cancel the old one first
		if existingSub.PlanID != planID {
			if err := s.CancelSubscription(userID); err != nil {
				return nil, fmt.Errorf("failed to cancel existing subscription: %w", err)
			}
		} else {
			// Idempotent behavior: return current active subscription
			return &existingSub, nil
		}
	}

	// Get Plan details to calculate dates
	var plan models.Plan
	if err := s.db.DB.First(&plan, planID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			// Log para debug: verificar quais planos estão disponíveis
			var allPlans []models.Plan
			s.db.DB.Find(&allPlans)
			fmt.Printf("Tentativa de encontrar plano ID %d, mas não foi encontrado. Planos disponíveis: ", planID)
			for _, p := range allPlans {
				fmt.Printf("ID: %d (ativo: %t), ", p.ID, p.Active)
			}
			fmt.Println()

			return nil, errors.New("plan not found")
		}
		return nil, fmt.Errorf("error retrieving plan: %w", err)
	}

	// Ensure the plan is active
	if !plan.Active {
		return nil, errors.New("plan is not active")
	}

	now := time.Now()
	nextBilling := now.AddDate(0, 0, plan.DurationDays)
	status := models.SubscriptionStatusPending
	isFreePlan := plan.Price <= 0

	// For free trial plans, activate immediately and use a 3-hour window
	if isFreePlan {
		status = models.SubscriptionStatusActive
		nextBilling = now.Add(3 * time.Hour)
		if providerID == "" || providerID == "mercadopago" {
			providerID = "free_trial"
		}
	}

	sub := &models.Subscription{
		UserID:            userID,
		PlanID:            planID,
		Status:            status,
		StartDate:         now,
		NextBillingDate:   nextBilling,
		PaymentProviderID: providerID,
	}

	if err := s.db.DB.Create(sub).Error; err != nil {
		return nil, err
	}

	// For free plans, update user immediately as subscriber
	if isFreePlan {
		if err := s.db.DB.Model(&models.User{}).Where("id = ?", userID).Updates(map[string]interface{}{
			"is_subscriber":       true,
			"subscription_status": string(models.SubscriptionStatusActive),
		}).Error; err != nil {
			return nil, err
		}
	}

	return sub, nil
}

// ActivateSubscription activates a subscription after payment
func (s *SubscriptionService) ActivateSubscription(subscriptionID uint) error {
	return s.db.DB.Transaction(func(tx *gorm.DB) error {
		var sub models.Subscription
		if err := tx.First(&sub, subscriptionID).Error; err != nil {
			return err
		}

		// Update Subscription
		sub.Status = models.SubscriptionStatusActive
		if err := tx.Save(&sub).Error; err != nil {
			return err
		}

		// Update User
		if err := tx.Model(&models.User{}).Where("id = ?", sub.UserID).Updates(map[string]interface{}{
			"is_subscriber":       true,
			"subscription_status": string(models.SubscriptionStatusActive),
		}).Error; err != nil {
			return err
		}

		return nil
	})
}

// CancelSubscription cancels a subscription
func (s *SubscriptionService) CancelSubscription(userID uint) error {
	return s.db.DB.Transaction(func(tx *gorm.DB) error {
		var sub models.Subscription
		if err := tx.Where("user_id = ? AND status = ?", userID, models.SubscriptionStatusActive).First(&sub).Error; err != nil {
			return errors.New("no active subscription found")
		}

		sub.Status = models.SubscriptionStatusCancelled
		if err := tx.Save(&sub).Error; err != nil {
			return err
		}

		// Update User
		if err := tx.Model(&models.User{}).Where("id = ?", userID).Updates(map[string]interface{}{
			"is_subscriber":       false,
			"subscription_status": string(models.SubscriptionStatusCancelled),
		}).Error; err != nil {
			return err
		}

		return nil
	})
}

// CheckAccess checks if a user has an active subscription
func (s *SubscriptionService) CheckAccess(userID uint) (bool, error) {
	var user models.User
	if err := s.db.DB.First(&user, userID).Error; err != nil {
		return false, err
	}
	if user.IsAdmin() {
		return true, nil
	}
	return user.IsSubscriber, nil
}

// SeedPlans ensures default plans exist by calling the database seeder
func (s *SubscriptionService) SeedPlans() error {
	return s.db.SeedPlans()
}

// GetUserSubscription returns the current subscription for a user
func (s *SubscriptionService) GetUserSubscription(userID uint) (*models.Subscription, error) {
	var sub models.Subscription
	if err := s.db.DB.Preload("Plan").Where("user_id = ?", userID).Order("created_at desc").First(&sub).Error; err != nil {
		return nil, err
	}
	return &sub, nil
}

// ChangePlan upgrades or downgrades a user's subscription
func (s *SubscriptionService) ChangePlan(userID, newPlanID uint) (*models.Subscription, error) {
	var sub models.Subscription
	err := s.db.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("user_id = ? AND status = ?", userID, models.SubscriptionStatusActive).First(&sub).Error; err != nil {
			return errors.New("não possui assinatura ativa")
		}

		var newPlan models.Plan
		if err := tx.First(&newPlan, newPlanID).Error; err != nil {
			return errors.New("plano não encontrado")
		}

		// Update Subscription
		sub.PlanID = newPlanID
		// In a real system, we might calculate prorated differences here
		if err := tx.Save(&sub).Error; err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	return &sub, nil
}

// CreateEnterpriseLead creates a lead for Scale/Enterprise plans
func (s *SubscriptionService) CreateEnterpriseLead(lead *models.EnterpriseLead) error {
	return s.db.DB.Create(lead).Error
}
