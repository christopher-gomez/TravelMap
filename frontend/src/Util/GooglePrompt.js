import { Logger } from "./Utils";

export function PromptSignIn(onError) {
  if (!window.google) return;
  window.google.accounts.id.prompt((notification) => {
    if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
      // Handle the failure to display or user skipping the sign-in prompt
      Logger.Log("Sign-in prompt not displayed or was skipped.");

      if (onError) onError();
    }
  });
}

export function SignOut(googleAccount, reloadOnComplete = true) {
  if (!window.google) return;

  Logger.Log("Revoking token");

  window.google.accounts.id.revoke(googleAccount.email, (done) => {
    Logger.Log("consent revoked", done);
    if (reloadOnComplete) window.location.reload();
  });
}
