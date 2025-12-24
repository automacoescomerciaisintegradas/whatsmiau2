package main

import (
	"encoding/base64"
	"flag"
	"fmt"
	"log"
	"mime"
	"os"
	"path/filepath"
	"strings"

	"whatsmiau2/internal/manager"
)

func main() {
	// Flags comuns
	apiURL := flag.String("url", "http://localhost:8085/v1", "Base URL of WhatsMiau2 API")
	apiKey := flag.String("key", "", "API key (required)")
	action := flag.String("action", "list", "Action to perform: list|send|media|avatar|push|group|newsletter")
	instance := flag.String("instance", "", "Instance ID (required for most actions)")

	// Flags específicas de envio de texto
	to := flag.String("to", "", "Recipient number (E.164) for send action")
	text := flag.String("text", "", "Message text for send action")

	// Flags para mídia
	mediaPath := flag.String("media", "", "Path to image/video/document for media action")
	caption := flag.String("caption", "", "Caption for media message")

	// Flags para grupos
	groupAction := flag.String("gaction", "list", "Group sub‑action: list|info|create|add|remove|leave")
	groupJID := flag.String("groupjid", "", "JID of the group (required for info/add/remove/leave)")
	groupTitle := flag.String("title", "", "Title for creating a group")
	participants := flag.String("participants", "", "Comma‑separated list of numbers for group create/add/remove")

	// Flags para newsletters
	newsletterAction := flag.String("naction", "list", "Newsletter sub‑action: follow|unfollow|info")
	newsletterJID := flag.String("newsletterjid", "", "JID of the newsletter (required for follow/unfollow/info)")

	flag.Parse()

	if *apiKey == "" {
		fmt.Println("API key is required (use -key flag)")
		os.Exit(1)
	}
	if *action != "list" && *action != "newsletter" && *action != "group" && *instance == "" {
		fmt.Println("Instance ID is required for this action")
		os.Exit(1)
	}

	mgr := manager.New(*apiURL, *apiKey)

	switch strings.ToLower(*action) {
	case "list":
		instances, err := mgr.ListInstances()
		if err != nil {
			log.Fatalf("erro ao listar instâncias: %v", err)
		}
		for _, i := range instances {
			fmt.Printf("- ID: %s | Name: %s | Connected: %v\n", i.ID, i.Name, i.Connected)
		}
	case "send":
		if *to == "" || *text == "" {
			fmt.Println("-to and -text are required for send action")
			os.Exit(1)
		}
		err := mgr.SendText(*instance, *to, *text)
		if err != nil {
			log.Fatalf("erro ao enviar mensagem: %v", err)
		}
		fmt.Println("Mensagem enviada com sucesso!")
	case "media":
		if *to == "" || *mediaPath == "" {
			fmt.Println("-to and -media are required for media action")
			os.Exit(1)
		}
		// Ler arquivo e converter para data URI (base64)
		data, err := os.ReadFile(*mediaPath)
		if err != nil {
			log.Fatalf("erro ao ler arquivo de mídia: %v", err)
		}
		mimeType := mime.TypeByExtension(filepath.Ext(*mediaPath))
		if mimeType == "" {
			mimeType = "application/octet-stream"
		}
		b64 := base64.StdEncoding.EncodeToString(data)
		dataURI := fmt.Sprintf("data:%s;base64,%s", mimeType, b64)
		err = mgr.SendMedia(*instance, *to, dataURI, *caption)
		if err != nil {
			log.Fatalf("erro ao enviar mídia: %v", err)
		}
		fmt.Println("Mídia enviada com sucesso!")
	case "avatar":
		avatar, err := mgr.GetAvatar(*instance, false)
		if err != nil {
			log.Fatalf("erro ao obter avatar: %v", err)
		}
		fmt.Printf("Avatar URL: %s\n", avatar.URL)
	case "push":
		if *text == "" {
			fmt.Println("-text is required for push action (new push name)")
			os.Exit(1)
		}
		err := mgr.ChangePushName(*instance, *text)
		if err != nil {
			log.Fatalf("erro ao mudar push name: %v", err)
		}
		fmt.Println("Push name alterado com sucesso!")
	case "group":
		switch strings.ToLower(*groupAction) {
		case "list":
			groups, err := mgr.ListGroups(*instance)
			if err != nil {
				log.Fatalf("erro ao listar grupos: %v", err)
			}
			for _, g := range groups {
				fmt.Printf("- JID: %s | Title: %s\n", g.JID, g.Title)
			}
		case "info":
			if *groupJID == "" {
				fmt.Println("-groupjid is required for group info")
				os.Exit(1)
			}
			info, err := mgr.GetGroupInfo(*instance, *groupJID)
			if err != nil {
				log.Fatalf("erro ao obter info do grupo: %v", err)
			}
			fmt.Printf("Group JID: %s | Title: %s\n", info.JID, info.Title)
		case "create":
			if *groupTitle == "" {
				fmt.Println("-title is required to create a group")
				os.Exit(1)
			}
			parts := []string{}
			if *participants != "" {
				parts = strings.Split(*participants, ",")
			}
			jid, err := mgr.CreateGroup(*instance, *groupTitle, parts)
			if err != nil {
				log.Fatalf("erro ao criar grupo: %v", err)
			}
			fmt.Printf("Grupo criado com JID: %s\n", jid)
		case "add":
			if *groupJID == "" || *participants == "" {
				fmt.Println("-groupjid and -participants are required for add")
				os.Exit(1)
			}
			parts := strings.Split(*participants, ",")
			err := mgr.AddParticipants(*instance, *groupJID, parts)
			if err != nil {
				log.Fatalf("erro ao adicionar participantes: %v", err)
			}
			fmt.Println("Participantes adicionados com sucesso!")
		case "remove":
			if *groupJID == "" || *participants == "" {
				fmt.Println("-groupjid and -participants are required for remove")
				os.Exit(1)
			}
			parts := strings.Split(*participants, ",")
			err := mgr.RemoveParticipants(*instance, *groupJID, parts)
			if err != nil {
				log.Fatalf("erro ao remover participantes: %v", err)
			}
			fmt.Println("Participantes removidos com sucesso!")
		case "leave":
			if *groupJID == "" {
				fmt.Println("-groupjid is required for leave")
				os.Exit(1)
			}
			err := mgr.LeaveGroup(*instance, *groupJID)
			if err != nil {
				log.Fatalf("erro ao sair do grupo: %v", err)
			}
			fmt.Println("Saído do grupo com sucesso!")
		default:
			fmt.Printf("Sub‑ação de grupo desconhecida: %s\n", *groupAction)
			os.Exit(1)
		}
	case "newsletter":
		switch strings.ToLower(*newsletterAction) {
		case "follow":
			if *newsletterJID == "" {
				fmt.Println("-newsletterjid is required for follow")
				os.Exit(1)
			}
			err := mgr.FollowNewsletter(*instance, *newsletterJID)
			if err != nil {
				log.Fatalf("erro ao seguir newsletter: %v", err)
			}
			fmt.Println("Newsletter seguida com sucesso!")
		case "unfollow":
			if *newsletterJID == "" {
				fmt.Println("-newsletterjid is required for unfollow")
				os.Exit(1)
			}
			err := mgr.UnfollowNewsletter(*instance, *newsletterJID)
			if err != nil {
				log.Fatalf("erro ao deixar de seguir newsletter: %v", err)
			}
			fmt.Println("Newsletter deixada com sucesso!")
		case "info":
			if *newsletterJID == "" {
				fmt.Println("-newsletterjid is required for info")
				os.Exit(1)
			}
			info, err := mgr.GetNewsletterInfo(*instance, *newsletterJID)
			if err != nil {
				log.Fatalf("erro ao obter info da newsletter: %v", err)
			}
			fmt.Printf("Newsletter info: %+v\n", info)
		default:
			fmt.Printf("Sub‑ação de newsletter desconhecida: %s\n", *newsletterAction)
			os.Exit(1)
		}
	default:
		fmt.Printf("Ação desconhecida: %s\n", *action)
		os.Exit(1)
	}
}
