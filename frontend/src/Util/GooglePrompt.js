export function PromptSignIn(onError) {
  if (!window.google) return;
  window.google.accounts.id.prompt((notification) => {
    if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
      // Handle the failure to display or user skipping the sign-in prompt
      console.log("Sign-in prompt not displayed or was skipped.");

      if (onError) onError();
    }
  });
}

export function SignOut(googleAccount, reloadOnComplete = true) {
  if (!window.google) return;

  console.log("Revoking token");

  window.google.accounts.id.revoke(googleAccount.email, (done) => {
    console.log("consent revoked", done);
    if (reloadOnComplete) window.location.reload();
  });
}
