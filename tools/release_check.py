#!/usr/bin/env python3
"""Release-Wächter: prüft das Repo, bevor der Prüfungsprügler veröffentlicht wird.

Läuft im Workflow vor dem Build. Schlägt eine Pflichtprüfung fehl, bricht der
Lauf ab und die zuletzt veröffentlichte Fassung bleibt online.

Pflichtprüfungen (Fehler):
  * Rechtsdateien vorhanden (Lizenzen, Nutzungshinweise, README)
  * keine gesperrten Begriffe in Texten, Karten und Code (Liste NICHT im Repo)
  * keine Datei über 10 MB

Gesperrte Begriffe (z. B. Namen von Bildungsträgern, Kursszenarien, Personen)
stehen bewusst nicht im öffentlichen Repo, sondern
  * lokal in der Datei .release-terms (eine Zeile pro Begriff, ist in .gitignore)
  * auf GitHub in der Repository-Variable RELEASE_FORBIDDEN_TERMS
    (Settings > Secrets and variables > Actions > Variables, Begriffe durch
    Komma getrennt)

Aufruf: python3 tools/release_check.py
"""

from __future__ import annotations

import os
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SKIP_DIRS = {".git", "node_modules", "docs", "shots", "__pycache__"}
REQUIRED = ["LICENSE", "LICENSE-CODE", "NUTZUNGSHINWEISE.md", "README.md"]
TEXT_SUFFIXES = {".md", ".json", ".js", ".mjs", ".html", ".css", ".webmanifest", ".py", ".yml"}
MAX_BYTES = 10 * 1024 * 1024


def files():
    for p in ROOT.rglob("*"):
        if p.is_file() and not (set(p.relative_to(ROOT).parts) & SKIP_DIRS):
            yield p


def forbidden_terms() -> list[str]:
    terms: list[str] = []
    env = os.environ.get("RELEASE_FORBIDDEN_TERMS", "")
    terms += [t.strip() for t in env.split(",") if t.strip()]
    local = ROOT / ".release-terms"
    if local.exists():
        terms += [l.strip() for l in local.read_text(encoding="utf-8").splitlines()
                  if l.strip() and not l.startswith("#")]
    return sorted(set(terms), key=str.lower)


def main() -> int:
    errors: list[str] = []
    hints: list[str] = []

    for name in REQUIRED:
        if not (ROOT / name).exists():
            errors.append(f"Pflichtdatei fehlt: {name}")

    terms = forbidden_terms()
    if not terms:
        msg = "Keine gesperrten Begriffe hinterlegt (.release-terms oder RELEASE_FORBIDDEN_TERMS)."
        # Auf GitHub ist die Liste Pflicht, lokal reicht ein Hinweis
        (errors if os.environ.get("GITHUB_ACTIONS") == "true" else hints).append(msg)
    # Ganze Wörter: ein gesperrter Begriff schlägt nicht an, wenn er nur Teil eines längeren Wortes ist
    term_rx = (re.compile(r"(?<!\w)(?:" + "|".join(re.escape(t) for t in terms) + r")(?!\w)", re.IGNORECASE)
               if terms else None)

    for f in files():
        rel = f.relative_to(ROOT)
        if f.stat().st_size > MAX_BYTES:
            errors.append(f"{rel}: größer als 10 MB")
        if not term_rx or f.suffix not in TEXT_SUFFIXES or f.name == ".release-terms":
            continue
        for i, line in enumerate(f.read_text(encoding="utf-8", errors="ignore").splitlines(), 1):
            for m in term_rx.finditer(line):
                errors.append(f"{rel}:{i}: gesperrter Begriff „{m.group(0)}“")

    for h in hints:
        print("Hinweis:", h)
    if errors:
        print(f"\nRelease gestoppt, {len(errors)} Fehler:")
        for e in errors[:50]:
            print("  ✗", e)
        return 1
    print("\nRelease-Wächter: alles in Ordnung.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
