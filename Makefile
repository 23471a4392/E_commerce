.PHONY: install build start dev test seed docker-build docker-run

install:
	npm install

build:
	npm run build

start:
	npm start

dev:
	npm run dev &
	npm run dev:server

test:
	npm test

seed:
	npm run seed

docker-build:
	docker build -t oppenheimer-store .

docker-run:
	docker run -p 5000:5000 oppenheimer-store

help:
	@echo "Oppenheimer E-Commerce — make install|build|start|dev|test|seed|docker-build|docker-run"
