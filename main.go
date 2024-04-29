//go:build js
// +build js

package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"syscall/js"

	ytd "github.com/kkdai/youtube/v2"
)

var client = ytd.Client{
	HTTPClient: &http.Client{
		Transport: &CustomTransport{
			Transport: http.DefaultTransport,
		}},
}

func main() {
	js.Global().Set("Download", wrapPromise(func(args []js.Value) (any, error) {
		if len(args) == 0 {
			return nil, fmt.Errorf("missing id")
		}

		id := args[0].String()
		video, err := client.GetVideo(id)
		if err != nil {
			return nil, err
		}

		return video, nil
	}))

	<-make(chan struct{})
}

type CustomTransport struct {
	Transport http.RoundTripper
}

func (c *CustomTransport) RoundTrip(req *http.Request) (*http.Response, error) {
	prefix := "/proxy?url="
	// Cloudflare function does not support CONNECT method for normal proxy
	// modify the request to send to custom endpoint
	newURL, err := url.Parse(prefix + req.URL.String())
	if err != nil {
		fmt.Println("Error parsing URL:", err)
		newURL = req.URL
	}

	req.URL = newURL
	return c.Transport.RoundTrip(req)
}

// wrapPromise wrap results into promise
func wrapPromise(fnc func(args []js.Value) (any, error)) any {
	return js.FuncOf(func(this js.Value, args []js.Value) any {
		return js.Global().Get("Promise").New(js.FuncOf(func(this js.Value, promiseArgs []js.Value) any {
			resolve := promiseArgs[0]
			reject := promiseArgs[1]

			go func() {
				data, err := fnc(args)
				if err != nil {
					errorObject := js.Global().Get("Error").New(err.Error())
					reject.Invoke(errorObject)
					return
				}
				jsonBytes, err := json.Marshal(data)
				arrayConstructor := js.Global().Get("Uint8Array")
				dataJS := arrayConstructor.New(len(jsonBytes))
				js.CopyBytesToJS(dataJS, jsonBytes)

				responseConstructor := js.Global().Get("Response")
				response := responseConstructor.New(dataJS)

				resolve.Invoke(response)
			}()
			return nil
		}))
	})
}
