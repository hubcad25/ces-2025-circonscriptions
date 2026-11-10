import { useEffect, useState } from "react";
import AboutPage from "./AboutPage";
import ExplorePage from "./ExplorePage";
import { type Lang, LangContext, initialLang, saveLang } from "./i18n";
import RidingPage from "./RidingPage";
import ValidationPage from "./ValidationPage";

const SITE_TITLE = { en: "What Your Riding Thinks", fr: "Ce que pense votre circonscription" };

const TABS = [
  { hash: "#/", label: { en: "Explore", fr: "Explorer" } },
  { hash: "#/validation", label: { en: "Validation", fr: "Validation" } },
  { hash: "#/about", label: { en: "About", fr: "À propos" } },
];

function Page({ hash }: { hash: string }) {
  const ridingMatch = hash.match(/^#\/riding\/(\d+)$/);
  if (ridingMatch) return <RidingPage fed23={Number(ridingMatch[1])} />;
  if (hash === "#/validation") return <ValidationPage />;
  if (hash === "#/about") return <AboutPage />;
  return <ExplorePage />;
}

export default function App() {
  const [hash, setHash] = useState(window.location.hash || "#/");
  const [lang, setLang] = useState<Lang>(initialLang);

  useEffect(() => {
    saveLang(lang);
    document.title = SITE_TITLE[lang];
  }, [lang]);

  // Pages are addressed by the URL hash (#/riding/24059), which GitHub Pages serves as is.
  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash || "#/");
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  return (
    <LangContext.Provider value={lang}>
      <div className="layout">
        <nav className="sidebar">
          <div className="sidebar-title">
            {SITE_TITLE[lang]}
          </div>
          {TABS.map((tab) => (
            <a key={tab.hash} href={tab.hash} aria-current={tab.hash === hash ? "page" : undefined}>
              {tab.label[lang]}
            </a>
          ))}
          <button className="lang-toggle" onClick={() => setLang(lang === "fr" ? "en" : "fr")}>
            {lang === "fr" ? "English" : "Français"}
          </button>
        </nav>
        <main>
          <Page hash={hash} />
        </main>
      </div>
    </LangContext.Provider>
  );
}
