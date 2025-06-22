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
	cd py_backend && python main.py

# database validations
.PHONY: test
test:
	cd py_backend && \
	PYTHONPATH=. pytest -q