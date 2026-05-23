# WhatsMiau2 Manager

The **manager** package provides a thin, retry‑aware and circuit‑breaker protected HTTP client to interact with the WhatsMiau2 API. It abstracts the raw HTTP calls into idiomatic Go methods, making it easy for other services or CLI tools to consume the API.

## Installation
```bash
go get github.com/sony/gobreaker
```
(If you are using Go modules, the dependency will be added automatically when you run `go build` or `go mod tidy`).

## Types
- **Client** – wraps an `http.Client` and stores configuration such as base URL, API key, retry settings and a circuit breaker.
- **Instance** – represents an instance of WhatsMiau2 (ID, Name, Connected flag).
- Various structs in other files (`UserInfo`, `AvatarInfo`, `GroupInfo`, etc.) are defined in their respective manager files.

## Constructor
```go
mgr := manager.New("http://localhost:8085/v1", "YOUR_API_KEY")
```
Creates a client with:
- 3 retry attempts (500 ms base back‑off)
- A circuit breaker that trips after 5 consecutive failures.

## Methods
| Method | Description | HTTP endpoint | Returns |
|--------|-------------|---------------|---------|
| `ListInstances()` | Returns all registered instances. | `GET /instance/fetchInstances` | `[]Instance` |
| `CreateInstance(name string)` | Creates a new instance. | `POST /instance/create` | `*Instance` |
| `ConnectInstance(id string)` | Triggers QR or phone pairing for an instance. | `GET /instance/connect/{id}` | `*Instance` |
| `LogoutInstance(id string)` | Logs out and removes the instance session. | `DELETE /instance/logout/{id}` | `error` |
| `GetInstanceStatus(id string)` | Retrieves connection status of an instance. | `GET /instance/connectionState/{id}` | `*Instance` |
| `GetInfo(instanceID string)` *(user.go)* | Retrieves basic user info. | `GET /user/info/{instanceID}` | `*UserInfo` |
| `GetAvatar(instanceID string, preview bool)` *(user.go)* | Gets user avatar URL (preview optional). | `GET /user/avatar/{instanceID}?preview={bool}` | `*AvatarInfo` |
| `ChangeAvatar(instanceID, media string)` *(user.go)* | Updates avatar using a URL or base64 data URI. | `POST /user/avatar/{instanceID}` | `error` |
| `ChangePushName(instanceID, name string)` *(user.go)* | Updates push name. | `POST /user/pushname/{instanceID}` | `error` |
| `GetPrivacy(instanceID string)` *(user.go)* | Retrieves privacy settings. | `GET /user/privacy/{instanceID}` | `map[string]interface{}` |
| `GetGroups(instanceID string)` *(user.go)* | Lists groups the user participates in. | `GET /user/groups/{instanceID}` | `[]map[string]interface{}` |
| `GetNewsletter(instanceID string)` *(user.go)* | Lists newsletters (channels) the user follows. | `GET /user/newsletters/{instanceID}` | `[]map[string]interface{}` |
| `GetContacts(instanceID string)` *(user.go)* | Retrieves contacts. | `GET /user/contacts/{instanceID}` | `map[string]interface{}` |
| `CheckUser(instanceID string, numbers []string)` *(user.go)* | Checks if numbers are on WhatsApp. | `POST /user/check/{instanceID}` | `map[string]interface{}` |
| `GetBusinessProfile(instanceID string)` *(user.go)* | Retrieves business profile. | `GET /user/business/{instanceID}` | `map[string]interface{}` |
| `ListGroups(instanceID string)` *(group.go)* | Lists groups for the instance. | `GET /group/list/{instanceID}` | `[]GroupInfo` |
| `GetInfo(instanceID, jid string)` *(group.go)* | Retrieves metadata of a specific group. | `GET /group/info/{instanceID}?jid={jid}` | `*GroupInfo` |
| `CreateGroup(instanceID, title string, participants []string)` *(group.go)* | Creates a new group. | `POST /group/create/{instanceID}` | `groupJID string` |
| `AddParticipants(instanceID, groupJID string, participants []string)` *(group.go)* | Adds participants to a group. | `POST /group/add/{instanceID}` | `error` |
| `RemoveParticipants(instanceID, groupJID string, participants []string)` *(group.go)* | Removes participants from a group. | `POST /group/remove/{instanceID}` | `error` |
| `LeaveGroup(instanceID, groupJID string)` *(group.go)* | Makes the instance leave a group. | `POST /group/leave/{instanceID}` | `error` |
| `FollowNewsletter(instanceID, jid string)` *(newsletter.go)* | Follows a newsletter (channel). | `POST /newsletter/follow/{instanceID}` | `error` |
| `UnfollowNewsletter(instanceID, jid string)` *(newsletter.go)* | Unfollows a newsletter. | `POST /newsletter/unfollow/{instanceID}` | `error` |
| `GetNewsletterInfo(instanceID, jid string)` *(newsletter.go)* | Retrieves newsletter metadata. | `GET /newsletter/{instanceID}/info?jid={jid}` | `map[string]interface{}` |
| `SendText(instanceID, to, text string)` *(message.go)* | Sends a text message. | `POST /send/{instanceID}/text` | `error` |
| `SendMedia(instanceID, to, mediaURL, caption string)` *(message.go)* | Sends image/video/document. | `POST /send/{instanceID}/image` | `error` |
| `SendReaction(instanceID, to, messageID, reaction string)` *(message.go)* | Sends a reaction to a message. | `POST /send/{instanceID}/reaction` | `error` |

## Retry & Circuit‑Breaker
All HTTP requests go through `Client.do`, which:
1. Attempts the request up to `retryAttempts` times with exponential back‑off (`retryDelay`).
2. Wraps the whole retry loop in a **circuit breaker** (`github.com/sony/gobreaker`).
   - After 5 consecutive failures the breaker opens for 30 seconds.
   - While open, calls return an error immediately, protecting downstream services.

## Example Usage
```go
package main

import (
    "log"
    "whatsmiau2/internal/manager"
)

func main() {
    mgr := manager.New("http://localhost:8085/v1", "your-api-key-here")

    // List instances
    instances, err := mgr.ListInstances()
    if err != nil {
        log.Fatalf("failed to list instances: %v", err)
    }
    log.Printf("instances: %+v", instances)

    // Send a text message using the first instance
    if len(instances) > 0 {
        err = mgr.SendText(instances[0].ID, "5511999999999", "Olá do manager!")
        if err != nil {
            log.Fatalf("failed to send text: %v", err)
        }
        log.Println("message sent")
    }
}
```

## Testing
The package is designed to be easily mockable. You can replace `Client.http` with a custom `http.RoundTripper` that returns canned responses for unit tests.

---
*Generated by Antigravity – your AI coding assistant.*
