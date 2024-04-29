.PHONY: wasm
wasm:
	GOOS=js GOARCH=wasm go build --o ./public/goytd.wasm