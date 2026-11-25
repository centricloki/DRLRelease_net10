using System.Text;
using DRLRelease.Business;
using DRLRelease.Common;
using DRLRelease.Web.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.IdentityModel.Tokens;
using Serilog;
using Microsoft.AspNetCore.StaticFiles;

var builder = WebApplication.CreateBuilder(args);

// Read log path from appsettings.json, with a safe fallback
var logPath = builder.Configuration.GetValue<string>("Serilog:LogFilePath")
              ?? Path.Combine(builder.Environment.ContentRootPath, "Logs", "log-.txt");

// Ensure the directory exists (especially for local dev)
Directory.CreateDirectory(Path.GetDirectoryName(logPath)!);

// 1. Configure Serilog
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .MinimumLevel.Override("Microsoft", Serilog.Events.LogEventLevel.Warning)
    .Enrich.FromLogContext()
    .WriteTo.File(
        path: logPath,
        rollingInterval: RollingInterval.Day,
        retainedFileCountLimit: 30,
        outputTemplate: "{Timestamp:yyyy-MM-dd HH:mm:ss.fff zzz} [{Level:u3}] {Message:lj}{NewLine}{Exception}")
    .CreateLogger();

// 2. Tell ASP.NET Core to use Serilog instead of the default logger
builder.Host.UseSerilog();

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

var staticFileContentTypes =
    new FileExtensionContentTypeProvider();

staticFileContentTypes.Mappings[".msixbundle"] =
    "application/vnd.ms-appx.bundle";

staticFileContentTypes.Mappings[".msix"] =
    "application/vnd.ms-appx";

staticFileContentTypes.Mappings[".appinstaller"] =
    "application/appinstaller";

app.UseStaticFiles(new StaticFileOptions
{
    ContentTypeProvider = staticFileContentTypes,

    OnPrepareResponse = context =>
    {
        if (context.File.Name.EndsWith(
            ".msixbundle",
            StringComparison.OrdinalIgnoreCase))
        {
            context.Context.Response.Headers.Append(
                "Content-Disposition",
                $"attachment; filename=\"{context.File.Name}\"");

            context.Context.Response.Headers.Append(
                "X-Content-Type-Options",
                "nosniff");
        }
    }
});
app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllerRoute(
    name: "Default",
    pattern: "{controller=Release}/{action=Index}/{id?}");

app.Run();