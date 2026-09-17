// Translation strings for the unauthenticated auth flow (login, password
// reset, invite acceptance). The `en` and `fr` objects mirror the same key
// shape so any consumer can index by locale without conditional logic.
export const auth = {
  en: {
    // Login page copy
    login: {
      promoEyebrow: "Maintenance + Homes",
      promoHeadline: "Report it once. Everyone sees where it stands.",
      statHomes: "homes",
      statMedianResponse: "median response",
      statJobsLastMonth: "jobs last month",
      title: "Log in",
      subtitle: "Use the work email your home manager set you up with.",
      email: "Email",
      emailPlaceholder: "you@organisation.com",
      password: "Password",
      forgotPassword: "Forgot password?",
      passwordPlaceholder: "Enter your password",
      show: "Show",
      hide: "Hide",
      keepSignedIn: "Keep me signed in on this device",
      submit: "Log in",
      submitting: "Logging in…",
      or: "or",
      google: "Continue with Google",
      sessionExpired: "Your session expired. Please log in again.",
      noAccess: "That Google account isn't linked to an account here. Contact your home manager or admin.",
      oauthError: "Something went wrong signing you in with Google. Please try again.",
      inviteError: "This invite link is invalid or has expired. Ask your admin to send you a new one.",
      noAccount: "No account? Contact your home manager or admin.",
    },
    // "Forgot password" request page copy
    forgotPassword: {
      title: "Forgot your password?",
      subtitle: "Enter your work email and we'll send a link to set a new one.",
      email: "Email",
      submit: "Send reset link",
      submitting: "Sending...",
      backToLogin: "← Back to log in",
      checkEmailTitle: "Check your email",
      // JSX so the email address can be bolded inline within the sentence
      checkEmailBody: (email: string) => (
        <>
          If an account exists for <strong className="text-ink">{email}</strong>, we sent a password reset link.
        </>
      ),
      nothingArrived: "Nothing arrived?",
      spamHint: "Check your spam folder or make sure you entered the correct work email.",
    },
    // Password reset (after following the emailed link) page copy
    resetPassword: {
      title: "Set a new password",
      subtitle: "Enter your new password below.",
      newPassword: "New password",
      confirmPassword: "Confirm new password",
      submit: "Update password",
      submitting: "Updating...",
      mismatch: "Passwords do not match.",
      tooShort: "Password must be at least 8 characters.",
    },
    // Invite-acceptance (new account activation) page copy
    acceptInvite: {
      title: "Welcome aboard",
      subtitle: "Set a password to activate your account.",
      newPassword: "Password",
      confirmPassword: "Confirm password",
      submit: "Activate account",
      submitting: "Activating...",
      mismatch: "Passwords do not match.",
      tooShort: "Password must be at least 8 characters.",
    },
  },
  // French translations — same keys/shape as `en` above
  fr: {
    login: {
      promoEyebrow: "Maintenance et maisons",
      promoHeadline: "Signalez-le une fois. Tout le monde voit où ça en est.",
      statHomes: "maisons",
      statMedianResponse: "réponse médiane",
      statJobsLastMonth: "interventions le mois dernier",
      title: "Connexion",
      subtitle: "Utilisez l'e-mail professionnel fourni par votre responsable.",
      email: "E-mail",
      emailPlaceholder: "vous@organisation.com",
      password: "Mot de passe",
      forgotPassword: "Mot de passe oublié ?",
      passwordPlaceholder: "Entrez votre mot de passe",
      show: "Afficher",
      hide: "Masquer",
      keepSignedIn: "Rester connecté sur cet appareil",
      submit: "Connexion",
      submitting: "Connexion…",
      or: "ou",
      google: "Continuer avec Google",
      sessionExpired: "Votre session a expiré. Veuillez vous reconnecter.",
      noAccess: "Ce compte Google n'est lié à aucun compte ici. Contactez votre responsable ou l'administrateur.",
      oauthError: "Une erreur s'est produite lors de la connexion avec Google. Veuillez réessayer.",
      inviteError: "Ce lien d'invitation est invalide ou a expiré. Demandez à votre administrateur de vous en envoyer un nouveau.",
      noAccount: "Pas de compte ? Contactez votre responsable ou l'administrateur.",
    },
    forgotPassword: {
      title: "Mot de passe oublié ?",
      subtitle: "Entrez votre e-mail professionnel et nous vous enverrons un lien pour en définir un nouveau.",
      email: "E-mail",
      submit: "Envoyer le lien",
      submitting: "Envoi en cours...",
      backToLogin: "← Retour à la connexion",
      checkEmailTitle: "Consultez vos e-mails",
      checkEmailBody: (email: string) => (
        <>
          Si un compte existe pour <strong className="text-ink">{email}</strong>, nous avons envoyé un lien de
          réinitialisation.
        </>
      ),
      nothingArrived: "Rien reçu ?",
      spamHint: "Vérifiez votre dossier spam ou assurez-vous d'avoir saisi le bon e-mail professionnel.",
    },
    resetPassword: {
      title: "Définir un nouveau mot de passe",
      subtitle: "Entrez votre nouveau mot de passe ci-dessous.",
      newPassword: "Nouveau mot de passe",
      confirmPassword: "Confirmer le nouveau mot de passe",
      submit: "Mettre à jour le mot de passe",
      submitting: "Mise à jour...",
      mismatch: "Les mots de passe ne correspondent pas.",
      tooShort: "Le mot de passe doit contenir au moins 8 caractères.",
    },
    acceptInvite: {
      title: "Bienvenue",
      subtitle: "Définissez un mot de passe pour activer votre compte.",
      newPassword: "Mot de passe",
      confirmPassword: "Confirmer le mot de passe",
      submit: "Activer le compte",
      submitting: "Activation...",
      mismatch: "Les mots de passe ne correspondent pas.",
      tooShort: "Le mot de passe doit contenir au moins 8 caractères.",
    },
  },
};
