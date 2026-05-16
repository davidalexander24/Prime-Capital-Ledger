# Flowchart - Prime Capital Ledger

Dokumen ini berisi dua flowchart utama: **(A) Authentication Flow** dan **(B) PDF Import Flow**. Keduanya merepresentasikan jalur kode nyata yang ada di repository, bukan alur generik.

---

## A. Authentication Flow

Mencakup dua jalur login: **Google OAuth** dan **Email + Password (Credentials)**. Keduanya berakhir pada sesi JWT NextAuth dan redirect ke `/dashboard`.

```mermaid
flowchart TD
    Start([User membuka /login]) --> Choice{Pilih metode login}

    Choice -->|"Google"| GoogleClick[Klik tombol Sign in with Google]
    GoogleClick --> OAuthRedirect[Redirect ke Google OAuth consent screen]
    OAuthRedirect --> OAuthApprove{User menyetujui?}
    OAuthApprove -->|"Tidak"| LoginFail[Kembali ke /login]
    OAuthApprove -->|"Ya"| Callback["GET /api/auth/callback/google"]
    Callback --> CheckAccount{Account sudah<br/>terdaftar?}
    CheckAccount -->|"Tidak"| CreateUser[Insert ke users + accounts]
    CheckAccount -->|"Ya"| LinkSession[Insert ke sessions]
    CreateUser --> LinkSession

    Choice -->|"Email + Password"| Form[Submit form email & password]
    Form --> Lookup["SELECT * FROM users WHERE email = ?"]
    Lookup --> UserExists{User ditemukan?}
    UserExists -->|"Tidak"| AuthFail[Tampilkan error: Invalid credentials]
    UserExists -->|"Ya"| BcryptCheck["bcrypt.compare(input, user.password)"]
    BcryptCheck --> PasswordOk{Password cocok?}
    PasswordOk -->|"Tidak"| AuthFail
    PasswordOk -->|"Ya"| LinkSession

    AuthFail --> Start
    LoginFail --> Start

    LinkSession --> IssueJWT[NextAuth menerbitkan JWT session token]
    IssueJWT --> Redirect[Redirect ke /dashboard]
    Redirect --> End([Selesai - User authenticated])

    classDef startend fill:#0f172a,stroke:#38bdf8,color:#e0f2fe
    classDef decision fill:#1e293b,stroke:#facc15,color:#fef3c7
    classDef process fill:#0f172a,stroke:#475569,color:#e2e8f0
    classDef fail fill:#3f1d1d,stroke:#ef4444,color:#fecaca
    class Start,End startend
    class Choice,OAuthApprove,CheckAccount,UserExists,PasswordOk decision
    class GoogleClick,OAuthRedirect,Callback,CreateUser,LinkSession,Form,Lookup,BcryptCheck,IssueJWT,Redirect process
    class AuthFail,LoginFail fail
```

### Catatan Implementasi

- Route handler NextAuth: `src/app/api/auth/[...nextauth]/route.ts`.
- Endpoint registrasi terpisah: `src/app/api/auth/register/route.ts` (membuat baris `users` baru dengan `bcrypt.hash`).
- Session disimpan di tabel **`sessions`** (managed by `@auth/prisma-adapter`).
- Strategi JWT: token disimpan di browser cookie; lookup `sessions` dipakai NextAuth untuk validasi/expiry.

---

## B. PDF Import Flow

Alur paling kompleks di aplikasi: user mengunggah laporan PDF dari Ajaib/Stockbit, parser mengekstrak transaksi, user mengonfirmasi, lalu data masuk ke ledger.

```mermaid
flowchart TD
    Start([User membuka /dashboard/import]) --> Upload[Drag & drop atau pilih file PDF]
    Upload --> Validate{"File valid?<br/>(PDF, kurang dari 10MB)"}
    Validate -->|"Tidak"| ShowError[Tampilkan error: format/ukuran salah]
    ShowError --> Start

    Validate -->|"Ya"| CallParse["Server Action: parsePdfTransactions(formData)"]
    CallParse --> AuthCheck{Session valid?}
    AuthCheck -->|"Tidak"| Unauthorized[Return: Unauthorized]
    AuthCheck -->|"Ya"| ReadPDF["PDFParse(buffer) -> raw text"]

    ReadPDF --> DetectBroker{"Format broker terdeteksi?<br/>(Ajaib / Stockbit)"}
    DetectBroker -->|"Tidak"| ParseFail[Return: Format tidak dikenali]
    DetectBroker -->|"Ya"| Extract[Ekstrak baris transaksi<br/>regex per format broker]

    Extract --> NormalizeDate[Konversi tanggal<br/>Indonesian months to JS Date]
    NormalizeDate --> LookupTicker[Resolve nama perusahaan<br/>Yahoo Finance + Redis cache]
    LookupTicker --> BuildRows["Bangun array ParsedRow[]"]

    BuildRows --> Preview[Kirim ke client sebagai preview]
    Preview --> UserReview{User menyetujui preview?}
    UserReview -->|"Tidak"| Cancel([User batalkan])
    UserReview -->|"Ya"| Commit["Server Action: commitParsedTransactions(rows)"]

    Commit --> Dedup{Cek duplikasi<br/>existing same userId+date+ticker+qty}
    Dedup -->|"Duplikat"| SkipRow[Skip baris]
    Dedup -->|"Baru"| UpsertAsset["UPSERT into assets<br/>by ticker"]
    UpsertAsset --> InsertTx["INSERT into transactions"]
    SkipRow --> NextRow{Masih ada baris?}
    InsertTx --> NextRow
    NextRow -->|"Ya"| Dedup
    NextRow -->|"Tidak"| Recompute["Recompute daily_valuations<br/>untuk tanggal terdampak"]

    Recompute --> Success([Selesai - tampilkan jumlah imported & skipped])

    classDef startend fill:#0f172a,stroke:#38bdf8,color:#e0f2fe
    classDef decision fill:#1e293b,stroke:#facc15,color:#fef3c7
    classDef process fill:#0f172a,stroke:#475569,color:#e2e8f0
    classDef fail fill:#3f1d1d,stroke:#ef4444,color:#fecaca
    class Start,Success,Cancel startend
    class Validate,AuthCheck,DetectBroker,UserReview,Dedup,NextRow decision
    class Upload,CallParse,ReadPDF,Extract,NormalizeDate,LookupTicker,BuildRows,Preview,Commit,UpsertAsset,InsertTx,SkipRow,Recompute process
    class ShowError,Unauthorized,ParseFail fail
```

### Catatan Implementasi

- Server Action utama: `src/app/actions/import.ts` - fungsi `parsePdfTransactions()` dan `commitParsedTransactions()`.
- Library parsing: **`pdf-parse`** untuk mengekstrak text mentah, kemudian regex spesifik per broker (Ajaib vs Stockbit) untuk membaca baris transaksi.
- **Bulan dalam Bahasa Indonesia** (`Jan`, `Feb`, ..., `Des`) dipetakan ke index bulan JavaScript di awal file.
- **Yahoo Finance lookup** untuk mendapatkan nama perusahaan dilakukan sekali per ticker dan di-cache via Redis agar tidak memukul rate limit.
- **Deduplikasi** mencegah transaksi yang sama ter-import dua kali ketika user mengunggah laporan yang tumpang tindih periode.
- Setelah commit selesai, **`daily_valuations`** untuk tanggal-tanggal yang terdampak dibangun ulang agar dashboard menampilkan nilai yang benar.

---

## Ringkasan

| Flowchart | Tujuan | Tabel Tersentuh |
|---|---|---|
| **A. Authentication** | Mengamankan akses ke `/dashboard/*` | `users`, `accounts`, `sessions` |
| **B. PDF Import** | Menambahkan transaksi dalam batch dari laporan broker | `assets`, `transactions`, `daily_valuations` |

Kedua flow ini adalah jalur kode yang paling cocok untuk didemonstrasikan di sesi presentasi karena menyentuh paling banyak tabel sekaligus dan menampilkan integrasi sistem eksternal (Google OAuth + Yahoo Finance + PDF parsing + Redis cache).
