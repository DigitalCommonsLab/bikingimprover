import Vue from "vue";
import createAuth0Client from "@auth0/auth0-spa-js";

//const authConfig = require("../../auth_config.js");

/** Define a default action to perform after authentication */

let instance;



/** Returns the current instance of the SDK */
export const getInstance = () => instance;

/** Creates an instance of the Auth0 SDK. If one has already been created, it returns that instance */
export const useAuth0 = ({
  onRedirectCallback = window.AUTH0_CALLBACK,
  redirectUri = window.AUTH0_REDIRECT,
  ...options
}) => {
  if (instance) return instance;

  // The 'instance' is simply a Vue object
  instance = new Vue({
    data() {
      return {
        loading: true,
        isAuthenticated: false,
        user: {},
        OSMToken: null,
        authToken: null,
        auth0Client: null,
        popupOpen: false,
        error: null
      };
    },
    methods: {
      /** Authenticates the user using a popup window */
      async loginWithPopup(options, config) {
        this.popupOpen = true;

        try {
          await this.auth0Client.loginWithPopup(options, config);
          this.user = await this.auth0Client.getUser();
          this.isAuthenticated = await this.auth0Client.isAuthenticated();
          this.error = null;
        } catch (e) {
          this.error = e;
          // eslint-disable-next-line
          console.error(e);
        } finally {
          this.popupOpen = false;
        }

        this.user = await this.auth0Client.getUser();
        this.isAuthenticated = true;
      },
      /** Handles the callback when logging in using a redirect */
      async handleRedirectCallback() {
        this.loading = true;
        try {
          await this.auth0Client.handleRedirectCallback();
          this.user = await this.auth0Client.getUser();
          this.isAuthenticated = true;
          this.error = null;
        } catch (e) {
          this.error = e;
        } finally {
          this.loading = false;
        }
      },
      /** Authenticates the user using the redirect method */
      loginWithRedirect(o) {
        return this.auth0Client.loginWithRedirect(o);
      },

      async getUser(){
        this.user = await this.auth0Client.getUser();
      },

      /** Returns all the claims present in the ID token */
      getIdTokenClaims(o) {
        return this.auth0Client.getIdTokenClaims(o);
      },
      /** Returns the access token. If the token is invalid or missing, a new one is retrieved */
      getTokenSilently(o) {
        //console.log(options)
        return this.auth0Client.getTokenSilently(o);
      },
      /** Gets the access token using a popup window */

      getTokenWithPopup(o) {
        return this.auth0Client.getTokenWithPopup(o);
      },
      /** Logs the user out and removes their session on the authorization server */
      logout(o) {
        return this.auth0Client.logout(o);
      },

      async checkValidity(token){
        console.log("Checking validity.......");
        var my_request = {
          method: "get",
          headers: {"Content-Type":"application/json", "pw_token": token},
        }
        var my_url = this.$api_url + "/posts/checkTokenValidity"
        try {
          return fetch(my_url, my_request)
            .then(response => {
              if (response.ok) {
                return response.json().then(data => {
                  console.log(data);
                  return true;
                });
              } else {
                console.log("Response status:", response.status);
                return false;
              }
            })
            .catch(error => {
              console.log(error);
              return false;
            });
        } catch (error) {
          console.log(error);
          return false;
        }
      },

      ////////////////
      //Retrieve the token for the api calling
      async getTokenApi(){
        if(this.authToken!=null){
          //console.log("THIS IS MY AUTHTOKEN:" + this.authToken.access_token);
          //Check expiration, if expired then set it to null and recall this function. Else return the token
          if(await this.checkValidity(this.authToken.access_token)){
            console.log("VALID");
            return this.authToken;
          }else{
            //refresh token
            console.log("INVALID");
            this.authToken = null;
            //refresh the token
            return await this.getTokenApi();
          }
        }else{
          var my_request = {
            method: "get",
            headers: {"Content-Type":"application/json"},
          }
          var my_url = this.$api_url + "/posts/user/getTokenApi"
          try{
            const fetchdata = await fetch(my_url,my_request)
            .then(response => response.json())
            .then((new_response_data)=>{
              this.authToken = new_response_data
              return new_response_data;
            }).catch((err)=>console.log(err))
            this.authToken = fetchdata
            return fetchdata
          }catch(e){
            console.log(e)
          }
        }
      },

      async getOSMTokenApi(user_id, token_to_use){
        if(this.OSMToken!=null){
          //console.log("THIS IS MY OSMTOKEN:" + this.OSMToken);
          //Check expiration, if expired then set it to null and recall this function. Else return the token
          return this.OSMToken;
        }else{
          var my_body = {
            "user_id": user_id
          }
          try{
            var my_url = this.$api_url + "/posts/get-osm-token";
            const myRequest = {
              method:"post",
              headers:{ "Content-Type":"application/json", "token": token_to_use},
              body:JSON.stringify(my_body)
            };
            const fetchdata = await fetch(my_url,myRequest)
              .then(response => {
                if(response.status == 404){
                  throw new Error("user didn't log via OSM")
                }
                return response.json()
              })
              .then((new_response_data)=>{
                this.OSMToken = new_response_data;
                return new_response_data;
              }).catch((err)=>console.log(err)) 
              //console.log(fetchdata)
              this.OSMToken = fetchdata;
              return fetchdata
          }catch(e){
            console.log(e)
          }
        }
      }
      ///////////////
    },
    /** Use this lifecycle method to instantiate the SDK client */
    async created() {
      // Create a new instance of the SDK client using members of the given options object
      this.auth0Client = await createAuth0Client({
        ...options,
        client_id: options.clientId,
        redirect_uri: redirectUri
      });

      try {
        // If the user is returning to the app after authentication..
        if (
          window.location.search.includes("code=") &&
          window.location.search.includes("state=")
        ) {
          // handle the redirect and retrieve tokens
          const { appState } = await this.auth0Client.handleRedirectCallback();

          this.error = null;

          // Notify subscribers that the redirect callback has happened, passing the appState
          // (useful for retrieving any pre-authentication state)
          onRedirectCallback(appState);
        }
      } catch (e) {
        this.error = e;
      } finally {
        // Initialize our internal authentication state
        this.isAuthenticated = await this.auth0Client.isAuthenticated();
        this.user = await this.auth0Client.getUser();
        this.loading = false;
      }
    }
  });

  return instance;
};

// Create a simple Vue plugin to expose the wrapper object throughout the application
export const Auth0Plugin = {
  install(Vue, options) {
    Vue.prototype.$auth = useAuth0(options);
  }
};
