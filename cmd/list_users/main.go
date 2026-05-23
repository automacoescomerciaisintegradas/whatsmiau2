package main

import (
	"fmt"
	"log"
	"whatsmiau2/internal/models"
	
	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
)

func main() {
	db, err := gorm.Open(sqlite.Open("file:data.db?_foreign_keys=on"), &gorm.Config{})
	if err != nil {
		log.Fatal("failed to connect database", err)
	}

	var users []models.User
	db.Find(&users)
	
	if len(users) == 0 {
		fmt.Println("No users found in database.")
		return
	}

	for _, u := range users {
		fmt.Printf("ID: %d | Name: %s | Email: %s | Provider: %s | HasPassword: %v\n", 
			u.ID, u.Name, u.Email, u.Provider, u.Password != "")
            
        // RESET PASSWORD to 123456 for all users (since this is a dev local environment and user is locked out)
        if err := u.HashPassword("123456"); err == nil {
            db.Save(&u)
            fmt.Println("Password reset to 123456")
        }
	}
}
