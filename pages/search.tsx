import fs from "fs";
import path from "path";
import Link from "next/link";
import { GetServerSideProps } from "next";
import styles from "./search.module.css";

type Item = { href: string; title: string };

export default function SearchPage({ q, results }: { q: string; results: Item[] }) {
  return (
    <main className={styles.root}>
      <h1 className={styles.title}>Résultats de recherche
        <span className={styles.count}>{results.length ? `${results.length} résultat(s)` : ""}</span>
      </h1>

      <p className={styles.meta}>
        Recherche: <strong>{q || "(vide)"}</strong>
      </p>

      {!q ? (
        <p className={styles.empty}>Entrez un terme de recherche depuis la barre en haut.</p>
      ) : results.length === 0 ? (
        <p className={styles.empty}>Aucun résultat trouvé.</p>
      ) : (
        <ul className={styles.results}>
          {results.map((r) => (
            <li key={r.href} className={styles.item}>
              <div>
                <Link href={r.href} className={styles.link}>
                  {r.title}
                </Link>
                <span className={styles.href}>— {r.href}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

function normalizeRoute(filePath: string) {
  // Convert filesystem path to web route
  const rel = path.relative(path.join(process.cwd(), "pages"), filePath).replace(/\\/g, "/");
  if (!rel) return null;
  // ignore API and Next internals
  if (rel.startsWith("api/") || rel.startsWith("_")) return null;
  if (!rel.endsWith(".tsx") && !rel.endsWith(".jsx") && !rel.endsWith(".ts") && !rel.endsWith(".js")) return null;

  const withoutExt = rel.replace(/\.(tsx|ts|jsx|js)$/, "");
  // index files become the directory root
  const route = withoutExt.replace(/(^|\/)index$/, "");
  // collapse duplicate slashes and ensure leading slash
  return "/" + route.replace(/(^\/|\/$)/g, "").replace(/\/+/g, "/");
}

function labelFromRoute(route: string) {
  if (!route || route === "/") return "Accueil";
  const parts = route.split("/").filter(Boolean).map(p => p.replace(/\[.*\]/, "").replace(/-/g, ' '));
  return parts.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(" — ");
}

function walkPages(dir: string, out: string[]) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "api" || e.name.startsWith(".")) continue;
      walkPages(full, out);
    } else {
      out.push(full);
    }
  }
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const q = typeof ctx.query.q === "string" ? ctx.query.q.trim() : "";

  const pagesDir = path.join(process.cwd(), "pages");
  let files: string[] = [];
  try {
    walkPages(pagesDir, files);
  } catch (err) {
    // if read fails, return empty
    return { props: { q, results: [] } };
  }

  const items: Item[] = [];
  const seen = new Set<string>();
  for (const f of files) {
    const r = normalizeRoute(f);
    if (!r) continue;
    // prefer unique routes
    if (seen.has(r)) continue;
    seen.add(r);
    const title = labelFromRoute(r);
    items.push({ href: r === "" ? "/" : r, title });
  }

  if (!q) return { props: { q: "", results: [] } };

  const qlc = q.toLowerCase();
  const results = items.filter(it => (it.title + ' ' + it.href).toLowerCase().includes(qlc)).slice(0, 50);

  return { props: { q, results } };
};
