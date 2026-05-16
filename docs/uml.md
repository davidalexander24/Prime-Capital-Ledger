# UML — Prime Capital Ledger

Dokumen ini berisi dua diagram UML: **Use Case Diagram** (interaksi pengguna dengan sistem) dan **Class Diagram** (struktur entitas inti). Hanya fitur yang sudah diimplementasikan secara penuh yang ditampilkan.

---

## 1. Use Case Diagram

Aktor utama adalah **User (Investor)**. Sistem mencakup modul autentikasi, dashboard, portofolio, transaksi, import data, dan analitik.

```mermaid
flowchart LR
    User((User<br/>Investor))

    subgraph PCL["Prime Capital Ledger System"]
        direction TB
        UC1(["Register Account"])
        UC2(["Login with Email & Password"])
        UC3(["Login with Google OAuth"])
        UC4(["Logout"])
        UC5(["View Dashboard"])
        UC6(["View Portfolio Holdings"])
        UC7(["View Transaction Ledger"])
        UC8(["Log Manual Transaction"])
        UC9(["Import PDF Statement"])
        UC10(["View Analytics"])
        UC11(["View Account Settings"])

        UC9 -.->|"includes"| UC7
        UC8 -.->|"includes"| UC7
        UC5 -.->|"includes"| UC6
    end

    User --> UC1
    User --> UC2
    User --> UC3
    User --> UC4
    User --> UC5
    User --> UC6
    User --> UC7
    User --> UC8
    User --> UC9
    User --> UC10
    User --> UC11

    classDef actor fill:#1e293b,stroke:#475569,color:#e2e8f0
    classDef usecase fill:#0f172a,stroke:#38bdf8,color:#e0f2fe
    class User actor
    class UC1,UC2,UC3,UC4,UC5,UC6,UC7,UC8,UC9,UC10,UC11 usecase
```

### Daftar Use Case

| ID | Use Case | Deskripsi Singkat |
|---|---|---|
| UC1 | Register Account | Membuat akun baru via email + password (bcrypt) |
| UC2 | Login (Email/Password) | Autentikasi credentials lewat NextAuth |
| UC3 | Login (Google OAuth) | Autentikasi pihak ketiga, otomatis membuat baris `Account` |
| UC4 | Logout | Menghapus session dari `Session` table |
| UC5 | View Dashboard | Ringkasan total value, P&L, valuation chart, top traded |
| UC6 | View Portfolio Holdings | Tabel agregasi posisi berdasarkan transaksi |
| UC7 | View Transaction Ledger | Daftar lengkap transaksi BUY/SELL/DEPOSIT/WITHDRAW |
| UC8 | Log Manual Transaction | Form input transaksi dengan ticker search |
| UC9 | Import PDF Statement | Upload laporan Ajaib / Stockbit, preview, commit |
| UC10 | View Analytics | Return bulanan, alokasi sektor, metrik risiko |
| UC11 | View Account Settings | Profil, statistik transaksi, logout |

> Relasi `<<includes>>` menunjukkan use case yang memerlukan use case lain sebagai bagian dari alurnya. Contoh: setiap kali user `Import PDF Statement` (UC9), sistem secara implisit melakukan operasi yang sama dengan `View Transaction Ledger` (UC7) karena data masuk ke tabel yang sama.

---

## 2. Class Diagram

Diagram kelas berikut memetakan entitas inti aplikasi (sesuai `prisma/schema.prisma`). Setiap class memiliki atribut bertipe yang sesuai dengan kolom database.

```mermaid
classDiagram
    direction LR

    class User {
        +String id
        +String name
        +String email
        +String password
        +DateTime emailVerified
        +String image
        +DateTime createdAt
        +DateTime updatedAt
        +register() User
        +login() Session
        +logout() void
    }

    class Account {
        +String id
        +String userId
        +String type
        +String provider
        +String providerAccountId
        +String access_token
        +String refresh_token
        +Int expires_at
    }

    class Session {
        +String id
        +String sessionToken
        +String userId
        +DateTime expires
    }

    class Asset {
        +String id
        +String ticker
        +String companyName
        +String currency
        +fetchLastPrice() Decimal
    }

    class Transaction {
        +String id
        +String userId
        +String assetId
        +TransactionType type
        +Decimal quantity
        +Decimal executionPrice
        +Decimal fee
        +Date date
        +DateTime createdAt
        +computeNetValue() Decimal
    }

    class DailyValuation {
        +String id
        +String userId
        +Date date
        +Decimal cashBalanceUSD
        +Decimal marketValueUSD
        +Decimal totalEquityUSD
        +Decimal totalEquityIDR
        +Decimal exchangeRate
    }

    class TransactionType {
        <<enumeration>>
        BUY
        SELL
        DEPOSIT
        WITHDRAW
    }

    User "1" --> "0..*" Account       : authProviders
    User "1" --> "0..*" Session       : sessions
    User "1" --> "0..*" Transaction   : transactions
    User "1" --> "0..*" DailyValuation: valuations
    Asset "1" --> "0..*" Transaction  : appearsIn
    Transaction --> TransactionType   : type
```

### Catatan Class

- **`User`** adalah aggregate root untuk semua data milik pengguna; cascade delete diterapkan pada `Account` dan `Session`.
- **`Asset`** bersifat global (master data) — di-share antar user, tidak punya `userId`.
- **`Transaction`** adalah entitas *append-only* (tidak memiliki `updatedAt`). Koreksi dilakukan dengan menambah transaksi baru, bukan mengubah baris lama → audit trail terjaga.
- **`DailyValuation`** adalah snapshot yang dihasilkan oleh server (bukan input user) — dibangun ulang setiap kali transaksi baru di-commit.
- Enumerasi **`TransactionType`** disimpan di level PostgreSQL sebagai `ENUM`, bukan `string`, untuk integritas data.
