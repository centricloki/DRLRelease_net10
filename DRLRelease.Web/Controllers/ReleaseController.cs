using DRLRelease.Business;
using DRLRelease.DataModel;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DRLRelease.Web.Controllers
{
    [Authorize]
    public class ReleaseController : Controller
    {
        private readonly CommonDataAccess _common;

        public ReleaseController(CommonDataAccess common) => _common = common;

        // GET: /Release/   (dashboard)
        public IActionResult Index()
        {
            //Production Version
            ViewBag.LatestProductionVersion = "V_0.0";
            List<AppVersion> appversions = _common.GetAppVersionList();
            AppVersion app = (from ap in appversions where ap.IsActive == true && ap.IsProduction == true select ap).FirstOrDefault();
            if (app != null)
                ViewBag.LatestProductionVersion = "V_" + app.Version.ToString();
            //Test Version
            ViewBag.LatestTestVersion = "V_0.0";
            List<AppVersion> testapp = (from ap in appversions where ap.IsActive == true && ap.IsProduction == false select ap).ToList();
            string TestVersion = "";
            foreach (AppVersion item in testapp)
            {
                if (!string.IsNullOrEmpty(TestVersion))
                    TestVersion = TestVersion + " , V_" + Convert.ToString(item.Version);
                else
                    TestVersion = " V_" + Convert.ToString(item.Version);
            }
            if (!string.IsNullOrEmpty(TestVersion))
                ViewBag.LatestTestVersion = TestVersion;
            // Active Version
            ViewBag.ActiveVersions = "V_0.0";
            List<AppVersion> allapp = (from ap in appversions where ap.IsActive == true select ap).ToList();
            string ActiveVersion = "";
            foreach (AppVersion item in allapp)
            {
                if (!string.IsNullOrEmpty(ActiveVersion))
                    ActiveVersion = ActiveVersion + " , V_" + Convert.ToString(item.Version);
                else
                    ActiveVersion = " V_" + Convert.ToString(item.Version);
            }
            if (!string.IsNullOrEmpty(ActiveVersion))
                ViewBag.ActiveVersions = ActiveVersion;

            return View();
        }

        #region Production / Test / All user lists (called by DataTables on the dashboard)

        [HttpPost]
        public JsonResult ProductionList() => Json(_common.GetUserAppVersionList("Production"));

        [HttpPost]
        public JsonResult TestList() => Json(_common.GetUserAppVersionList("Test"));

        [HttpPost]
        public JsonResult AllUserList() => Json(_common.GetUserAppVersionList("All"));

        #endregion
    }
}
