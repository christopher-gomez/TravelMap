import { useEffect, useRef, useState } from "react";
import Popup from "./Popup";
import { Box, Button, IconButton, Typography } from "@mui/material";
import { Google } from "@mui/icons-material";
import { PromptSignIn } from "./GooglePrompt";
import { getFamilyGoogleUsers } from "../Api/Google";

export default ({
  onGoogleAccount,
  loginPopupOpen,
  setLoginPopupOpen,
  errorPopupOpen,
  setErrorPopupOpen,
  onLoginClicked
}) => {
  const loadGoogleScript = () => {
    if (inittedGoogleSignIn.current) return;

    inittedGoogleSignIn.current = true;
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => initGoogleSignIn();
    document.body.appendChild(script);
  };

  const inittedGoogleSignIn = useRef(false);

  function initGoogleSignIn() {
    // if (inittedGoogleSignIn.current) return;

    inittedGoogleSignIn.current = true;
    window.google.accounts.id.initialize({
      client_id:
        "620708696585-c3cic34ecbdjsbh1jv49nqna5s5aoe4k.apps.googleusercontent.com",
      callback: handleCredentialResponse,
      auto_select: true,
    });

    if (localStorage.getItem("googleSignInToken")) {
      const jwt = localStorage.getItem("googleSignInToken");
      const { exp } = JSON.parse(atob(jwt.split(".")[1]));
      if (exp * 1000 < Date.now()) {
        console.log("previous sign in token expired");
        localStorage.removeItem("googleSignInToken");
      } else {
        console.log("previous valid sign in token found");
        setSignInToken(jwt);
      }
    }
  }

  const [signInToken, setSignInToken] = useState(null);
  const [googleAccount, setGoogleAccount] = useState(null);

  useEffect(() => {
    const validateToken = async () => {
      const data = JSON.parse(atob(signInToken.split(".")[1]));
      const users = await getFamilyGoogleUsers();
      if (users.includes(data.email)) {
        console.log("Got google id");
        setGoogleAccount(data);
        localStorage.setItem("googleSignInToken", signInToken);
      } else {
        console.log("Invalid google id");
        setSignInToken(null);
        if (setErrorPopupOpen) setErrorPopupOpen(true);
      }
    };

    if (signInToken) {
      validateToken();
    } else if (!signInToken && googleAccount) {
      console.log("No google id");
      setGoogleAccount(null);
      localStorage.removeItem("googleSignInToken");
    }
  }, [signInToken]);

  useEffect(() => {
    if (onGoogleAccount) onGoogleAccount(googleAccount);
  }, [googleAccount]);

  async function handleCredentialResponse(response) {
    setSignInToken(response.credential);
  }

  useEffect(() => {
    if (!inittedGoogleSignIn.current) loadGoogleScript();
  }, []);

  //   const [loginPopupOpen, setLoginPopupOpen] = useState(false);
  //   const [errorPopupOpen, setErrorPopupOpen] = useState(false);

  return (
    <Popup
      open={loginPopupOpen || errorPopupOpen}
      setOpen={() => {
        setLoginPopupOpen(false);
        setErrorPopupOpen(false);
      }}
      actions={
        errorPopupOpen
          ? [
              <Button
                onClick={() => {
                  setErrorPopupOpen(false);
                }}
              >
                Got It!
              </Button>,
            ]
          : undefined
      }
      title={loginPopupOpen ? "Log In" : errorPopupOpen ? "Oops!" : undefined}
      dividers={true}
    >
      <Box sx={{ display: "flex", flexFlow: "column", placeContent: "center" }}>
        {loginPopupOpen && (
          <>
            <Typography
              sx={{ fontStyle: "italic", fontWeight: 500 }}
              variant="subtitle1"
            >
              Sign in with Google make edits to the itinerary.
            </Typography>
            <IconButton
              onClick={() => {
                onLoginClicked();
                setLoginPopupOpen(false);
                PromptSignIn(() => {
                  setErrorPopupOpen(true);
                });
              }}
              sx={{ width: "fit-content", margin: "auto" }}
            >
              <Google />
            </IconButton>
          </>
        )}
        {errorPopupOpen && (
          <Typography
            sx={{ fontStyle: "italic", fontWeight: 500, textAlign: "center" }}
            variant="subtitle1"
          >
            There was an error signing in with Google.
            <br />
            It's probably because you're not going on the trip.
            <br />
            Sorry!
          </Typography>
        )}
      </Box>
    </Popup>
  );
};
