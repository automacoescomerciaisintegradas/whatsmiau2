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

RUN apk update && apk add --no-cache ffmpeg mailcap ca-certificates

WORKDIR /app

COPY --from=builder /app/whatsmiau2 /app/whatsmiau2

# Copiar arquivos estáticos
COPY --from=builder /app/public ./public
COPY --from=builder /app/docs ./docs

RUN mkdir /app/data && chmod 777 -R /app/data

EXPOSE 8081

ENTRYPOINT ["./whatsmiau2"]
