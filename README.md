# Fantasy Football Manager — Self-Hosted League & Tournament Engine

<div align="center">

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)]()
[![Docker](https://img.shields.io/badge/Deployment-Docker_Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)](docker/docker-compose.yaml)
[![SQLite](https://img.shields.io/badge/Database-SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white)]()
[![License](https://img.shields.io/badge/License-GPL--3.0-blue.svg?style=for-the-badge)](LICENSE)

**An open-source, multi-league fantasy sports and predictive match tournament platform.**

</div>

---

## ⚽ Platform Architecture

```mermaid
graph TD
    classDef client fill:#eff6ff,stroke:#1e40af,stroke-width:2px;
    classDef core fill:#f0fdf4,stroke:#15803d,stroke-width:2px;
    classDef db fill:#fdf2f8,stroke:#be185d,stroke-width:2px;

    subgraph ClientExperience ["🎮 Player & Admin Web Portal"]
        Squad[Squad Builder & Transfer Market]
        MatchDay[Live Matchday Scoring & Predictions]
        Leaderboard[Global & Private League Rankings]
        Admin[Admin Panel & League Customizer]
    end

    subgraph ServiceLayer ["⚙️ Game Logic & Calculation Engine"]
        RuleEngine[Custom Point & Bonus Rule Evaluator]
        SyncEngine[Matchday Stats & Fixture Ingestion]
        WalletManager[Budget & Transfer Cap Manager]
    end

    subgraph Persistence ["💾 Embedded Storage"]
        DB[(SQLite / Persistent Volume)]
    end

    Squad & MatchDay --> WalletManager & RuleEngine
    SyncEngine --> RuleEngine
    RuleEngine --> DB
    DB --> Leaderboard & Admin

    class Squad,MatchDay,Leaderboard,Admin client;
    class RuleEngine,SyncEngine,WalletManager core;
    class DB db;
```

---

## ✨ Key Features

- **Multi-League Flexibility**: Support for Premier League, Bundesliga, and custom user-defined league plugins.
- **Dynamic Valuation**: Real-time player pricing fluctuations based on form and transfer volume.
- **Match Predictions**: Earn bonus league points by forecasting match outcomes and clean sheets.
- **Modern Responsive UI**: Built-in dark and light themes with responsive mobile squad builders.

---

## 🚀 Deployment via Docker

```bash
# Launch containerized platform
docker-compose -f docker/docker-compose.yaml up -d
```
Access the application on port `3000`.

---

## 📬 Contact

- **Maintainer**: Sayan Bhattacharya ([sayanpm17@gmail.com](mailto:sayanpm17@gmail.com))
