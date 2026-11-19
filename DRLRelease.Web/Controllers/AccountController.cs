using DRLRelease.Business;
using DRLRelease.Common;
using DRLRelease.DataModel;
using DRLRelease.Web.Models;
using DRLRelease.Web.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DRLRelease.Web.Controllers
{
    public class AccountController : Controller
    {
        private readonly AccountDataAccess _account;
        private readonly CommonDataAccess _common;
        private readonly JwtTokenService _tokens;

        public AccountController(AccountDataAccess account, CommonDataAccess common, JwtTokenService tokens)
        {
            _account = account;
            _common = common;
            _tokens = tokens;
        }

        // GET: /Account/Login
        [HttpGet]
        [AllowAnonymous]
        public IActionResult Login(string returnUrl)
        {
            ViewBag.ReturnUrl = returnUrl;
            if (User.Identity?.IsAuthenticated == true)
            {
                return RedirectToAction("Index", "Release");
            }

            RemoveAuthCookie();
            List<Web_Users> list = _common.GetWebUserList();
            if (list == null || list.Count == 0)
            {
                return RedirectToAction("Register", "Account");
            }
            return View();
        }

        // POST: /Account/Login
        [HttpPost]
        [AllowAnonymous]
        [ValidateAntiForgeryToken]
        public IActionResult Login(LoginModel model, string returnUrl)
        {
            if (ModelState.IsValid)
            {
                string password = CommonFunction.Encrypt(Convert.ToString(model.Password));
                string userName = Convert.ToString(model.UserName);
                Web_Users user = _account.Login(userName, password);

                if (user != null)
                {
                    SignIn(user);
                    return RedirectToLocal(returnUrl);
                }
            }

            // If we got this far, something failed, redisplay form
            ModelState.AddModelError("", "The user name or password provided is incorrect.");
            return View(model);
        }

        // POST: /Account/LogOff
        [HttpPost]
        [AllowAnonymous]
        [ValidateAntiForgeryToken]
        public IActionResult LogOff()
        {
            RemoveAuthCookie();
            return RedirectToAction("Index", "Release");
        }

        // GET: /Account/Register  (only available while no web user exists: first-admin setup)
        [HttpGet]
        [AllowAnonymous]
        public IActionResult Register()
        {
            List<Web_Users> list = _common.GetWebUserList();
            if (list != null && list.Count > 0)
            {
                return RedirectToAction("Login", "Account");
            }
            return View();
        }

        // POST: /Account/Register
        [HttpPost]
        [AllowAnonymous]
        [ValidateAntiForgeryToken]
        public IActionResult Register(RegisterModel model)
        {
            // The old POST had no such check, so anyone could create an Admin by posting directly.
            List<Web_Users> existing = _common.GetWebUserList();
            if (existing != null && existing.Count > 0)
            {
                return RedirectToAction("Login", "Account");
            }

            if (ModelState.IsValid)
            {
                string password = CommonFunction.Encrypt(Convert.ToString(model.Password));
                var webuser = new Web_Users
                {
                    EmailAddress = model.EmailAddress,
                    IsActive = true,
                    Password = password,
                    UserName = model.UserName,
                    UserType = (int)EnumWebUserType.Admin
                };

                if (_common.RegisterNewUser(webuser))
                {
                    Web_Users user = _account.Login(Convert.ToString(model.UserName), password);
                    if (user != null)
                    {
                        SignIn(user);
                        return RedirectToAction("Index", "Release");
                    }
                }
                ModelState.AddModelError("", "Admin user not registerd.");
            }

            // If we got this far, something failed, redisplay form
            return View(model);
        }

        #region Helpers

        private void SignIn(Web_Users user)
        {
            var (token, expiresUtc) = _tokens.Create(user);
            Response.Cookies.Append(AuthCookie.Name, token, new CookieOptions
            {
                HttpOnly = true,
                Secure = Request.IsHttps,
                SameSite = SameSiteMode.Lax,
                Expires = expiresUtc,
                IsEssential = true
            });
        }

        private void RemoveAuthCookie() => Response.Cookies.Delete(AuthCookie.Name);

        private IActionResult RedirectToLocal(string returnUrl)
        {
            if (Url.IsLocalUrl(returnUrl))
            {
                return Redirect(returnUrl);
            }
            return RedirectToAction("Index", "Release");
        }

        #endregion
    }
}
