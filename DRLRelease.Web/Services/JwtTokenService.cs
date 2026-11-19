using System.Text;
using DRLRelease.DataModel;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;

namespace DRLRelease.Web.Services
{
    public class JwtOptions
    {
        public string Issuer { get; set; } = "DRLRelease";
        public string Audience { get; set; } = "DRLRelease";
        public string Key { get; set; }
        public int ExpiryHours { get; set; } = 8;
    }

    public static class AuthCookie
    {
        public const string Name = "access_token";
    }

    /// <summary>Creates the signed bearer token after the username/password check succeeds.</summary>
    public class JwtTokenService
    {
        private readonly JwtOptions _options;

        public JwtTokenService(JwtOptions options) => _options = options;

        public (string Token, DateTime ExpiresUtc) Create(Web_Users user)
        {
            var now = DateTime.UtcNow;
            var expires = now.AddHours(_options.ExpiryHours);

            var descriptor = new SecurityTokenDescriptor
            {
                Issuer = _options.Issuer,
                Audience = _options.Audience,
                IssuedAt = now,
                NotBefore = now,
                Expires = expires,
                Claims = new Dictionary<string, object>
                {
                    ["sub"] = user.UserId.ToString(),
                    ["name"] = user.UserName ?? string.Empty,
                    ["email"] = user.EmailAddress ?? string.Empty,
                    ["user_type"] = user.UserType.ToString()
                },
                SigningCredentials = new SigningCredentials(
                    new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_options.Key)),
                    SecurityAlgorithms.HmacSha256)
            };

            return (new JsonWebTokenHandler().CreateToken(descriptor), expires);
        }
    }
}
