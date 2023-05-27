clean:
	npm run clean:program-rust

build:
	npm run build:program-rust

deploy:
	solana program deploy dist/program/scheduler.so

build_and_deploy:
	make build && make deploy