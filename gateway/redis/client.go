package redisclient

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/redis/go-redis/v9"
)

// Client wraps the Redis connection with Komodo-specific operations.
type Client struct {
	rdb *redis.Client
}

// New creates a new Redis client from a connection URL.
// It verifies connectivity with a PING and retries up to 5 times
// (budget servers may be slow to start).
func New(redisURL string) (*Client, error) {
	opts, err := redis.ParseURL(redisURL)
	if err != nil {
		return nil, fmt.Errorf("invalid redis URL: %w", err)
	}

	// Connection pool tuned for budget VPS
	opts.PoolSize = 20
	opts.MinIdleConns = 5
	opts.DialTimeout = 5 * time.Second
	opts.ReadTimeout = 3 * time.Second
	opts.WriteTimeout = 3 * time.Second

	rdb := redis.NewClient(opts)

	// Retry PING with backoff (Redis may still be starting)
	var lastErr error
	for i := 0; i < 5; i++ {
		ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
		_, lastErr = rdb.Ping(ctx).Result()
		cancel()
		if lastErr == nil {
			log.Println("[redis] Connected successfully")
			return &Client{rdb: rdb}, nil
		}
		log.Printf("[redis] Ping attempt %d failed: %v, retrying...", i+1, lastErr)
		time.Sleep(time.Duration(i+1) * time.Second)
	}

	return nil, fmt.Errorf("failed to connect to Redis after 5 attempts: %w", lastErr)
}

// Ping checks Redis connectivity.
func (c *Client) Ping(ctx context.Context) error {
	return c.rdb.Ping(ctx).Err()
}

// Get retrieves a value by key. Returns ("", redis.Nil) on cache miss.
func (c *Client) Get(ctx context.Context, key string) (string, error) {
	return c.rdb.Get(ctx, key).Result()
}

// Set stores a value with a TTL.
func (c *Client) Set(ctx context.Context, key string, value interface{}, ttl time.Duration) error {
	return c.rdb.Set(ctx, key, value, ttl).Err()
}

// SetNX atomically sets a key only if it does NOT exist (distributed lock).
// Returns true if the lock was acquired, false if the key already existed.
func (c *Client) SetNX(ctx context.Context, key string, value interface{}, ttl time.Duration) (bool, error) {
	return c.rdb.SetNX(ctx, key, value, ttl).Result()
}

// Del removes one or more keys.
func (c *Client) Del(ctx context.Context, keys ...string) error {
	return c.rdb.Del(ctx, keys...).Err()
}

// Publish sends a message to a Redis Pub/Sub channel.
func (c *Client) Publish(ctx context.Context, channel string, message interface{}) error {
	return c.rdb.Publish(ctx, channel, message).Err()
}

// Subscribe returns a PubSub instance subscribed to the given channels.
func (c *Client) Subscribe(ctx context.Context, channels ...string) *redis.PubSub {
	return c.rdb.Subscribe(ctx, channels...)
}

// Close gracefully shuts down the Redis connection pool.
func (c *Client) Close() error {
	return c.rdb.Close()
}

// Underlying returns the raw go-redis client for advanced operations.
func (c *Client) Underlying() *redis.Client {
	return c.rdb
}
