FROM golang:1.24-alpine AS builder

WORKDIR /app

# Install gcc and SQLite dev libraries
RUN apk add build-base sqlite-dev gcc musl-dev

COPY go.mod go.sum ./
RUN go mod download

COPY . .

# Enable CGO for SQLite
RUN CGO_ENABLED=1 GOOS=linux go build -a -installsuffix cgo -o whatsmiau2 main.go

FROM alpine:latest

RUN apk add --no-cache ffmpeg mailcap ca-certificates sqlite-libs && \
    adduser -D -H -u 10001 cleudocode

WORKDIR /app

COPY --from=builder /app/whatsmiau2 /app/whatsmiau2

# Copiar arquivos estáticos
COPY --from=builder /app/public ./public
COPY --from=builder /app/docs ./docs

RUN mkdir -p /app/data && chown -R cleudocode:cleudocode /app

USER cleudocode

EXPOSE 8085

ENTRYPOINT ["./whatsmiau2"]
