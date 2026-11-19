using System.ComponentModel.DataAnnotations;
using DRLRelease.Business;
using DRLRelease.Common;
using DRLRelease.DataModel;
using DRLRelease.Web.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DRLRelease.Web.Controllers
{
    public class TokenRequest
    {
        [Required] public string UserName { get; set; }
        [Required] public string Password { get; set; }
    }

    /// <summary>
    /// Username + password in, bearer token out. Use the token as "Authorization: Bearer {token}".
    /// The browser pages use the same token, stored in an HttpOnly cookie by the login page.
    /// </summary>
    [ApiController]
    [Route("api/auth")]
    [AllowAnonymous]
    public class AuthApiController : ControllerBase
    {
        private readonly AccountDataAccess _account;
        private readonly JwtTokenService _tokens;
        private readonly JwtOptions _options;

        public AuthApiController(AccountDataAccess account, JwtTokenService tokens, JwtOptions options)
        {
            _account = account;
            _tokens = tokens;
            _options = options;
        }

        [HttpPost("token")]
        public IActionResult Token([FromBody] TokenRequest request)
        {
            string password = CommonFunction.Encrypt(request.Password);
            Web_Users user = _account.Login(request.UserName, password);
            if (user == null)
            {
                return Unauthorized(new { error = "invalid_credentials" });
            }

            var (token, _) = _tokens.Create(user);
            return Ok(new
            {
                access_token = token,
                token_type = "Bearer",
                expires_in = _options.ExpiryHours * 3600
            });
        }
    }
}
