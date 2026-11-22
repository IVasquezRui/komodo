# =============================================================================
# Go Gateway — Multi-stage build for minimal image size
# =============================================================================
# Stage 1: Build the binary
FROM golang:alpine AS builder

ENV GOTOOLCHAIN=auto

RUN apk add --no-cache git ca-certificates

WORKDIR /build

# Cache dependencies first (Docker layer caching optimization)
COPY go.mod go.sum ./
RUN go mod download

# Build the binary with optimizations
COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
    go build -ldflags="-w -s" -o /build/gateway ./main.go

# Stage 2: Minimal runtime image (~15MB total)
FROM alpine:3.20

RUN apk add --no-cache ca-certificates tzdata

WORKDIR /app

COPY --from=builder /build/gateway .

EXPOSE 8080

# Run as non-root user for security
RUN adduser -D -u 1001 appuser
USER appuser

ENTRYPOINT ["./gateway"]
