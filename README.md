# CES 2025 par circonscription

Estimations par circonscription fédérale (découpage 2023) des intentions de vote et des attitudes politiques, à partir de l'Étude électorale canadienne 2025, par MRP.

<!--- Les estimations de vote sont comparées aux résultats officiels de l'élection du 28 avril 2025. --->

Pipeline : Python et SQL (DuckDB). Dashboard statique : React.

## Lancer

Prérequis : [uv](https://docs.astral.sh/uv/) (installe Python 3.12).

```bash
make install   # dépendances
make extract   # télécharge les données brutes dans data/raw/, vérifie le SHA-256
make build     # exécute sql/raw, sql/staging puis sql/analytics dans data/ces.duckdb
make tables    # liste les tables et leur nombre de lignes
make show TABLE=analytics.results_fed   # aperçu d'une table
make ui        # interface web DuckDB, en lecture seule
make lint      # ruff check + format --check
make test      # contrôles de qualité sur data/ces.duckdb
```

`make test` lit la base construite : lancer `make build` avant. `make ui` ouvre la base en lecture seule ; la fermer avant `make build`, DuckDB n'accepte qu'un seul écrivain à la fois.

## Sources

| Source | Détail | Lien |
|---|---|---|
| Élections Canada | 45e élection générale (28 avril 2025), tableau 12 « Résultats détaillés par circonscription » | https://elections.ca/res/rep/off/ovrGE45/62/data_donnees/table_tableau12.csv |
| Ressources naturelles Canada | Limites des circonscriptions fédérales, découpages 2013 et 2023 | https://ftp.maps.canada.ca/pub/elections_elections/Electoral-districts_Circonscription-electorale/ |
| Statistique Canada | Points représentatifs des îlots de diffusion 2021 | https://geo.statcan.gc.ca/geo_wa/rest/services/2021/Cartographic_boundary_files/MapServer/13 |
| Statistique Canada | Recensement 2021 : population par aire de diffusion et par circonscription (2013 et 2023) | https://api.statcan.gc.ca/census-recensement/profile/sdmx/rest |

Les données brutes ne sont pas versionnées (`data/` est ignoré par Git) ; elles sont retéléchargées par les scripts.

## Structure

- `pipeline/` : scripts Python (extraction des sources, exécution des couches SQL)
- `sql/raw` : sources telles que reçues
- `sql/staging` : données nettoyées, une table par source
- `sql/analytics` : tables d'analyse

Tables actuelles :
- `raw.results` : export brut d'Élections Canada
- `staging.candidates` : une ligne par candidat ; le parti est extrait du suffixe bilingue collé au nom, les six principaux partis sont distingués, les autres sont regroupés sous `OTH`
- `staging.ridings_2013`, `staging.ridings_2023` : limites des circonscriptions, en EPSG:3347
- `staging.blocks`, `staging.da_population` : îlots de diffusion (point représentatif) et population des aires de diffusion
- `staging.riding_population` : population officielle par circonscription, découpages 2013 et 2023
- `analytics.fed_crosswalk` : part de la population de chaque circonscription 2013 dans chaque circonscription 2023, par jointure spatiale des îlots ; la population d'une aire de diffusion est répartie également entre ses îlots (écart médian de 0,16 % avec la population officielle par circonscription, maximum 4,2 %)
- `analytics.results_fed` : une ligne par circonscription × parti (votes, part, rang, gagnant, avance sur le suivant) ; 343 circonscriptions, correspond aux résultats officiels (169 PLC, 144 PCC, 22 BQ, 7 NPD, 1 PVC)
