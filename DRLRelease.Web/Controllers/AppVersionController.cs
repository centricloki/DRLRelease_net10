using DRLRelease.Business;
using DRLRelease.DataModel;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DRLRelease.Web.Controllers
{
    [Authorize]
    public class AppVersionController : Controller
    {
        private readonly CommonDataAccess _common;

        public AppVersionController(CommonDataAccess common)
        {
            _common = common;
        }

        // GET: Render the App Version management page
        public IActionResult Index()
        {
            return View();
        }

        // GET: API endpoint for jQuery DataTables to fetch the version list
        [HttpGet]
        public IActionResult GetVersionList()
        {
            var versions = _common.GetVersionList();
            // Returns PascalCase JSON as configured in Program.cs
            return Json(versions);
        }

        // POST: API endpoint to toggle Active/Inactive status
        [HttpPost]
        public IActionResult ToggleStatus(int appVersionId, int status)
        {
            try
            {
                bool success = _common.UpdateAppVersionStatus(appVersionId, status);
                return Json(new { success = success, message = success ? "Status updated successfully." : "Failed to update status." });
            }
            catch (Exception ex)
            {
                // Log exception here if you have a logger wired up
                return Json(new { success = false, message = "An error occurred: " + ex.Message });
            }
        }
    }
}