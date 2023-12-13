package main

import (
	"fmt"
	"net/http"
	"log"
	"time"
	"os"

	//lksdk "github.com/livekit/server-sdk-go"
	"github.com/livekit/protocol/auth"
)

func getJoinToken(apiKey, apiSecret, room, identity string) string {
	token := auth.NewAccessToken(apiKey, apiSecret)
	grant := &auth.VideoGrant{
		RoomJoin: true,
		Room:     room,
	}
	token.AddGrant(grant).
		SetIdentity(identity).
		SetValidFor(time.Hour)

	jwt, err := token.ToJWT()
	if err != nil {
		fmt.Println("error creating jwt", err)
		return ""
	}

	return jwt
}

func main() {
	apiKey := os.Getenv("LK_API_KEY")
	apiSecret := os.Getenv("LK_API_SECRET")
	
	http.HandleFunc("/getToken", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte(getJoinToken(apiKey, apiSecret, "my-room", "identity")))
	})
	
	log.Fatal(http.ListenAndServe(":8080", nil))
}