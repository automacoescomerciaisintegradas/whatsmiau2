// Package manager provides a thin HTTP client wrapper around the WhatsMiau2 API.
package manager

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/sony/gobreaker"
)

type Client struct {
	baseURL       string
	apiKey        string
	http          *http.Client
	retryAttempts int           // number of retry attempts for transient errors
	retryDelay    time.Duration // base delay between retries (exponential backoff)
	breaker       *gobreaker.CircuitBreaker
}

// New creates a new manager client with default retry and circuit‑breaker settings.
func New(baseURL, apiKey string) *Client {
	cbSettings := gobreaker.Settings{
		Name:        "WhatsMiau2API",
		MaxRequests: 5,
		Interval:    60 * time.Second,
		Timeout:     30 * time.Second,
		ReadyToTrip: func(counts gobreaker.Counts) bool {
			// trip after 5 consecutive failures
			return counts.ConsecutiveFailures > 5
		},
	}
	return &Client{
		baseURL:       baseURL,
		apiKey:        apiKey,
		http:          &http.Client{Timeout: 30 * time.Second},
		retryAttempts: 3,
		retryDelay:    500 * time.Millisecond,
		breaker:       gobreaker.NewCircuitBreaker(cbSettings),
	}
}

// do performs an HTTP request with the required apikey header, retry logic and circuit‑breaker.
func (c *Client) do(method, path string, payload interface{}) (*http.Response, error) {
	var body io.Reader
	if payload != nil {
		b, err := json.Marshal(payload)
		if err != nil {
			return nil, err
		}
		body = bytes.NewReader(b)
	}

	// The actual request execution is wrapped by the circuit breaker.
	exec := func() (interface{}, error) {
		var lastErr error
		for attempt := 0; attempt < c.retryAttempts; attempt++ {
			req, err := http.NewRequest(method, fmt.Sprintf("%s%s", c.baseURL, path), body)
			if err != nil {
				return nil, err
			}
			req.Header.Set("apikey", c.apiKey)
			req.Header.Set("Content-Type", "application/json")
			resp, err := c.http.Do(req)
			if err == nil && resp.StatusCode < 500 {
				// success or client error (4xx) – no retry needed
				return resp, nil
			}
			if resp != nil {
				resp.Body.Close()
			}
			lastErr = err
			// exponential backoff before next attempt
			time.Sleep(c.retryDelay * time.Duration(attempt+1))
		}
		if lastErr != nil {
			return nil, fmt.Errorf("request failed after %d attempts: %w", c.retryAttempts, lastErr)
		}
		return nil, fmt.Errorf("request failed after %d attempts", c.retryAttempts)
	}

	// Execute via circuit breaker.
	result, err := c.breaker.Execute(exec)
	if err != nil {
		return nil, err
	}
	// The breaker guarantees that result is *http.Response.
	return result.(*http.Response), nil
}
