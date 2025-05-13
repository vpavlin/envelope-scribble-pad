all: push

build:
	npm run build
container: build
	docker build -t quay.io/vpavlin0/envelope-scribble-pad .
push: container
	docker push quay.io/vpavlin0/envelope-scribble-pad