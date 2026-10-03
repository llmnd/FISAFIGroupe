import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html>
      <Head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function () {
              if (window.location.pathname !== "/market" &&
                  window.location.pathname !== "/market/commande") return;
              var preference = null;
              try {
                preference = window.localStorage.getItem("fisafi-market-theme");
              } catch (error) {
                // Use the system preference when local storage is unavailable.
              }
              var dark = preference === "dark" ||
                (preference !== "light" && window.matchMedia("(prefers-color-scheme: dark)").matches);
              document.documentElement.setAttribute("data-market-theme", dark ? "dark" : "light");
            })();`,
          }}
        />
        <link rel="icon" href="/favicon/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon/favicon-96x96.png" sizes="96x96" type="image/png" />
        <link rel="apple-touch-icon" href="/favicon/apple-touch-icon.png" />
        <link rel="manifest" href="/favicon/site.webmanifest" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Outfit:wght@200;300;400;500&family=DM+Sans:wght@200;300;400;500&display=swap"
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
