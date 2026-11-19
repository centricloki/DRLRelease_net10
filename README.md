# DRL Release Management – .NET 10 migration (Steps 1–3)

Same features as the .NET Framework 4.5 / MVC 5 version. Only the framework, data access (Dapper) and
authentication (JWT bearer) changed.

## What is in this drop

| Step | Content |
|------|---------|
| 1 | Solution on `net10.0`, Dapper data layer (same stored procedures / tables), config in `appsettings.json` |
| 2 | Login, Logout, first-admin Register, JWT bearer authentication |
| 3 | Dashboard (`/Release/Index`): version labels + Production / Test / All users lists |

Not migrated yet (menu items 404 until then): Upload New App, Update Version, App Version, Assign Version, Filters.
Push notifications are intentionally not migrated (`DRLRelease.Notification` is an empty stub; delete it later).

## Run locally

1. Install the .NET 10 SDK.
2. Create `DRLRelease.Web/appsettings.Development.json` (it is git-ignored):

```json
{
  "ConnectionStrings": {
    "ConnectionString": "Server=YOUR_SERVER;Database=DRLNew_HIER;User ID=...;Password=...;TrustServerCertificate=True"
  },
  "Jwt": { "Key": "PASTE-A-RANDOM-VALUE-OF-AT-LEAST-32-CHARACTERS" }
}
```

   Generate a key (PowerShell): `[Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(48))`

3. `dotnet restore` then `dotnet run --project DRLRelease.Web` and open http://localhost:5080
4. After the first successful restore, replace the floating package versions (`2.*`, `6.*`, `10.*`) with the exact versions.

`TrustServerCertificate=True` is needed because Microsoft.Data.SqlClient encrypts by default and
your SQL Server may not have a trusted certificate. Remove it if the server has one.

## Authentication

* Browser: `POST /Account/Login` checks username/password with `sp_Release_WebLogin` (same DES-encrypted
  password check as before), then stores a signed JWT in an HttpOnly cookie (`access_token`, 8 hours).
* Other clients: `POST /api/auth/token` with `{"userName":"...","password":"..."}` returns
  `{"access_token":"...","token_type":"Bearer","expires_in":28800}`. Send `Authorization: Bearer <token>`.
* Everything requires login unless marked `[AllowAnonymous]`.

## Test checklist (move to the next step only when each line passes)

**Step 1 – foundation**
- [ ] Solution builds with no errors.
- [ ] `/Account/Login` opens (proves DB connection and `SELECT * FROM web_users`).

**Step 2 – authentication**
- [ ] Existing admin can log in; a wrong password shows "The user name or password provided is incorrect."
- [ ] Opening `/Release` while logged out redirects to `/Account/Login`.
- [ ] Log off returns to the login page; browser Back does not show data.
- [ ] `POST /api/auth/token` returns a token; `GET /Release/Index` with the header works; a bad token gives 401.
- [ ] Register page only opens when `web_users` is empty (test on a copy of the database).

**Step 3 – dashboard**
- [ ] Production / Test / Active version labels equal the old site.
- [ ] The three tabs list the same users and versions as the old site (compare row counts and a few rows).
- [ ] "Last login" dates display correctly.

## Deploying to IIS (manual)

1. Install the **.NET 10 Hosting Bundle** on the server, then `iisreset`.
2. App pool: **.NET CLR version = No Managed Code**.
3. `dotnet publish DRLRelease.Web -c Release -o publish` and copy `publish` to the site folder
   (put `app_offline.htm` in the folder first, delete it after copying).
4. Create `appsettings.Production.json` on the server (connection string, `Jwt:Key`,
   `DataProtectionKeysPath` = a folder outside the site, e.g. `D:\DRLData\Keys`, writable by the app pool identity).
5. Browse the site; if it fails to start, set `stdoutLogEnabled="true"` in the generated `web.config` temporarily.
