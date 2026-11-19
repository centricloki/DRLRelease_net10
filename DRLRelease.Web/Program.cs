using System.Text;
using DRLRelease.Business;
using DRLRelease.Common;
using DRLRelease.Web.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// ExceptionLog writes to <content root>\Error (same as the old app).
CommonFunction.DirectoryPath = builder.Environment.ContentRootPath;

// ---------- Configuration ----------
var jwt = builder.Configuration.GetSection("Jwt").Get<JwtOptions>() ?? new JwtOptions();
if (string.IsNullOrWhiteSpace(jwt.Key) || jwt.Key.Length < 32)
{
    throw new InvalidOperationException(
        "Jwt:Key is missing or shorter than 32 characters. Set it in appsettings.Production.json " +
        "(or user-secrets for development). See README.md.");
}

builder.Services.AddSingleton(jwt);
builder.Services.AddSingleton(new DbConnectionFactory(builder.Configuration.GetConnectionString("ConnectionString")));
builder.Services.AddScoped<AccountDataAccess>();
builder.Services.AddScoped<CommonDataAccess>();
builder.Services.AddSingleton<JwtTokenService>();

// Antiforgery keys must survive IIS app-pool recycles. Point this to a folder outside the publish folder.
var dataProtection = builder.Services.AddDataProtection().SetApplicationName("DRLRelease");
var keysPath = builder.Configuration["DataProtectionKeysPath"];
if (!string.IsNullOrWhiteSpace(keysPath))
{
    dataProtection.PersistKeysToFileSystem(new DirectoryInfo(keysPath));
}

// ---------- Authentication: JWT bearer ----------
// The token is read from the "Authorization: Bearer ..." header (API clients) or, for the
// browser pages, from the HttpOnly "access_token" cookie set at login. Same token either way.
builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.MapInboundClaims = false;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwt.Issuer,
            ValidateAudience = true,
            ValidAudience = jwt.Audience,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.Key)),
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(1),
            NameClaimType = "name"
        };

        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                if (!context.Request.Headers.ContainsKey("Authorization")
                    && context.Request.Cookies.TryGetValue(AuthCookie.Name, out var cookieToken))
                {
                    context.Token = cookieToken;
                }
                return Task.CompletedTask;
            },
            OnChallenge = context =>
            {
                // Browser (no Authorization header): send to the login page, like the old AuthorizeWebForm.
                // API clients that sent a header keep the normal 401 response.
                if (!context.Request.Headers.ContainsKey("Authorization"))
                {
                    context.HandleResponse();
                    context.Response.Redirect(context.Request.PathBase + "/Account/Login");
                }
                return Task.CompletedTask;
            }
        };
    });

// Everything requires a logged-in user unless a controller/action says [AllowAnonymous].
builder.Services.AddAuthorizationBuilder()
    .SetFallbackPolicy(new AuthorizationPolicyBuilder().RequireAuthenticatedUser().Build());

// ---------- MVC ----------
// PropertyNamingPolicy = null keeps JSON property names exactly as declared (PascalCase),
// which is what the existing DataTables JavaScript expects (same as ASP.NET MVC 5).
builder.Services.AddControllersWithViews()
    .AddJsonOptions(o => o.JsonSerializerOptions.PropertyNamingPolicy = null);

var app = builder.Build();

app.UseStaticFiles();
app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllerRoute(
    name: "Default",
    pattern: "{controller=Release}/{action=Index}/{id?}");

app.Run();
