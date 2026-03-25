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

run-backend-local:
	source ~/venvs/sobres/bin/activate && cd py_backend && DEV_RESET_DB=1 python main.py

run-backend-docker:
	docker-compose up py_backend

# database validations
.PHONY: test
test:
	cd py_backend && \
	PYTHONPATH=. pytest -q