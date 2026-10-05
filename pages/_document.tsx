import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="fr">
      <Head />
      <body>
        {/* Script synchrone : s'exécute AVANT le premier paint, évite le FOUC
            sur les pages qui ne doivent pas avoir le padding-top global. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                try {
                  var path = window.location.pathname || "";
                  if (path === "/dashboard" || path.indexOf("/dashboard/") === 0) {
                    document.body.classList.add("portal-has-user-dashboard");
                  }
                  if (path === "/admin-dashboard" || path.indexOf("/admin-dashboard/") === 0) {
                    document.body.classList.add("admin-dashboard-active");
                  }
                } catch (e) { /* noop */ }
              })();
            `,
          }}
        />
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}