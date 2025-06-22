# Makefile for top-level project

# Frontend
run-frontend:
	cd web-ui && pnpm run dev

build-docker:
	docker-compose build

up:
	docker-compose up --build

# Backend
.PHONY: run-backend

run-backend:
	uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
