using DRLRelease.Business;
using DRLRelease.Common;
using DRLRelease.DataModel;
using DRLRelease.Web.Models;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.Extensions.Configuration;

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Xml;

namespace DRLRelease.Web.Controllers
{
    [Authorize]
    public class ReleaseController : Controller
    {
        private readonly CommonDataAccess _common;
        private readonly IWebHostEnvironment _env;   // <-- ADD THIS
        private readonly IConfiguration _config;     // <-- ADD THIS

        public ReleaseController(CommonDataAccess common, IWebHostEnvironment env, IConfiguration config)
        {
            _common = common;
            _env = env;
            _config = config;
        }

        // GET: /Release/   (dashboard)
        public IActionResult Index()
        {
            List<AppVersion> appversions = _common.GetAppVersionList();

            // 1. Production Version (Updated to use .ToList() and foreach, matching Test Version logic)
            ViewBag.LatestProductionVersion = "V_0.0";
            List<AppVersion> prodapp = (from ap in appversions where ap.IsActive == true && ap.IsProduction == true select ap).ToList();
            string ProdVersion = "";
            foreach (AppVersion item in prodapp)
            {
                if (!string.IsNullOrEmpty(ProdVersion))
                    ProdVersion = ProdVersion + " , V_" + Convert.ToString(item.Version);
                else
                    ProdVersion = " V_" + Convert.ToString(item.Version);
            }
            if (!string.IsNullOrEmpty(ProdVersion))
                ViewBag.LatestProductionVersion = ProdVersion;

            // 2. Test Version
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

            // 3. Active Version
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

        #region Versions

        // GET: /Release/AppVersions
        public IActionResult AppVersions()
        {
            return View();
        }

        // POST: /Release/VersionList (Matches old AJAX call)
        [HttpPost]
        public IActionResult VersionList()
        {
            var list = _common.GetVersionList();
            return Json(list);
        }

        // POST: /Release/UpdateAppVersion
        [HttpPost]
        public IActionResult UpdateAppVersion(int aapVersionId, int status)
        {
            try
            {
                _common.UpdateAppVersionStatus(aapVersionId, status);
                return Json(new { Success = true, Message = "Status updated successfully." });
            }
            catch (Exception)
            {
                return Json(new { Success = false, Message = "An error occurred while updating the status." });
            }
        }

        #endregion

        #region Promote to Production (Update Version)

        // GET: /Release/UpdateVersion  (the page)
        [HttpGet]
        public IActionResult UpdateVersion()
        {
            var model = new UploadProductionVersionModel();

            // EXACT same query as the old dialog: sp_Release_GetAppVersion, AppVersionID=0, IsProduction=false
            var data = new AppVersion { AppVersionID = 0, IsProduction = false };
            model.TestVersionList = _common.GetAppVersion(data).Where(x => x.IsActive == true).ToList();

            return View(model);
        }

        // POST: /Release/UpdateProductionVersion  (JSON AJAX endpoint)
        [HttpPost]
        public IActionResult UpdateProductionVersion([FromBody] UpdateProductionVersionRequest request)
        {
            bool isSuccess = false;
            string message = string.Empty;

            try
            {
                var whatsNewList = request?.WhatsNewList;
                string strWhatsNew = (whatsNewList != null && whatsNewList.Length > 0)
                    ? string.Join(".", whatsNewList)
                    : string.Empty;

                isSuccess = _common.UpdateProductionAppVersion(request.AppVersionId, strWhatsNew);
                if (!isSuccess) message = "Production app version NOT updated.";
            }
            catch (Exception ex)
            {
                message = "Error occurred while updating production app.";
                ExceptionLog.WriteLog(ex);
            }

            return Json(new { success = isSuccess, message = message });
        }

        #endregion

        #region Assign Version

        [HttpPost] // <-- Fix: Match the POST request from your JavaScript
        public IActionResult PopupAssignVersion(string versionType, List<int> userIdList, List<string> userNameList, List<string> userCurrentVersions, List<int> currentVersionIdList)
        {
            var model = new AssignVersionModel
            {
                VersionType = versionType,
                ErrorMessage = "",
                CurrentVersion = "",
                CurrentVersionId = 0,
                IsDisabledButton = false
            };

            string userIds = "";
            string userNames = "";

            if (userIdList != null && userIdList.Count > 0)
            {
                userIds = string.Join(" / ", userIdList);
                userNames = string.Join(" / ", userNameList);

                // Check if all selected users have the SAME current version
                var distinctVersions = userCurrentVersions.Distinct().ToList();
                if (distinctVersions.Count > 1)
                {
                    model.IsDisabledButton = true;
                    model.ErrorMessage = "Selected Users have different Current Versions.";
                }
                else
                {
                    model.CurrentVersion = distinctVersions[0];
                    model.CurrentVersionId = currentVersionIdList[0];
                }

                // Get ALL versions (not just active) for assignment - matches old app behavior
                var allVersions = _common.GetAllVersionList();
                
                // Filter to only show versions that are Active OR Production
                var assignVersions = allVersions.Where(x => x.IsActive || x.IsProduction).ToList();

                // Create SelectList with explicit Value and Text
                model.AssignList = new SelectList(
                    assignVersions.Select(v => new { v.AppVersionID, v.Version }),
                    "AppVersionID",
                    "Version"
                );

                if (string.IsNullOrEmpty(model.ErrorMessage) && assignVersions.Count == 0)
                {
                    model.IsDisabledButton = true;
                    model.ErrorMessage = "No new version is available to assign to these users.";
                }
            }
            else
            {
                model.IsDisabledButton = true;
                model.ErrorMessage = "No Record Selected.";
            }

            model.UserIDs = userIds;
            model.UserNames = userNames;

            return PartialView("Popup_AssignVersion", model);
        }

        [HttpPost]
        public IActionResult SaveAssignVersion(int assignedVersionId, List<int> userIdList, int userCurrentVersionId)
        {
            bool isSuccessful = false;
            string message = string.Empty;

            try
            {
                foreach (var userId in userIdList)
                {
                    var data = new UserAppVersion
                    {
                        AssignedVersion = assignedVersionId,
                        CurrentVersion = userCurrentVersionId,
                        NotificationCode = "", // Legacy placeholder
                        UserID = userId
                    };

                    // Save to database via Dapper
                    _common.SetUserAppVersion(data);

                    // NOTE: Push Notification logic has been intentionally removed as requested.
                }
                isSuccessful = true;
            }
            catch (Exception ex)
            {
                message = "Version not assigned to selected user.";
                ExceptionLog.WriteLog(ex);
            }

            return Json(new { success = isSuccessful, message = message });
        }

        #endregion

        #region Upload New App

        [HttpGet]
        public IActionResult UploadNewApp()
        {
            var model = new UploadNewAppModel
            {
                FileSizeNote = "Note : Make sure your file is under 200 MB."
            };
            return View(model);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        [RequestSizeLimit(209715200)] // 200 MB limit
        public async Task<IActionResult> UploadNewApp(UploadNewAppModel model)
        {
            if (ModelState.IsValid)
            {
                if (model.fileUpIPA != null && model.fileUpPLIST != null && model.fileUpIPA.Length > 0 && model.fileUpPLIST.Length > 0)
                {
                    // 1. BACKEND VALIDATION: Check file extensions (matches old CheckFileType logic)
                    string ipaExt = Path.GetExtension(model.fileUpIPA.FileName).TrimStart('.').ToUpperInvariant();
                    string plistExt = Path.GetExtension(model.fileUpPLIST.FileName).TrimStart('.').ToUpperInvariant();

                    if (ipaExt != "MSIXBUNDLE" || plistExt != "XML")
                    {
                        ModelState.AddModelError("", "Either <b>MSIXBUNDLE</b> or <b>XML</b> file(s) has selected wrong type of file(s).");
                        return View(model);
                    }

                    try
                    {
                        var baseUploadPath = _config.GetValue<string>("IPadAppPath") ?? Path.Combine(_env.WebRootPath, "IPadApp");
                        Directory.CreateDirectory(baseUploadPath);

                        var tempPath = Path.Combine(baseUploadPath, Guid.NewGuid().ToString());
                        Directory.CreateDirectory(tempPath);

                        var ipaPath = Path.Combine(tempPath, model.fileUpIPA.FileName);
                        var plistPath = Path.Combine(tempPath, model.fileUpPLIST.FileName);

                        // Save files temporarily
                        using (var stream = new FileStream(ipaPath, FileMode.Create))
                            await model.fileUpIPA.CopyToAsync(stream);

                        using (var stream = new FileStream(plistPath, FileMode.Create))
                            await model.fileUpPLIST.CopyToAsync(stream);

                        // Extract version from plist XML
                        var versionDetails = GetIpadVersion(plistPath);

                        if (!string.IsNullOrEmpty(versionDetails.Version))
                        {
                            var targetVersionPath = Path.Combine(baseUploadPath, versionDetails.Version);

                            if (Directory.Exists(targetVersionPath))
                                Directory.Delete(targetVersionPath, true);

                            Directory.CreateDirectory(targetVersionPath);
                            System.IO.File.Move(ipaPath, Path.Combine(targetVersionPath, model.fileUpIPA.FileName));
                            System.IO.File.Move(plistPath, Path.Combine(targetVersionPath, model.fileUpPLIST.FileName));
                            Directory.Delete(tempPath, true); // Clean up temp folder

                            // Save to Database via Dapper
                            var appversion = _common.GetAppVersion(versionDetails.Version) ?? new AppVersion();
                            appversion.DownloadURL = versionDetails.DownloadURL.Replace(".ipa", ".plist").Trim();
                            appversion.Version = versionDetails.Version;
                            appversion.IsActive = true;
                            appversion.IsProduction = false;

                            if (_common.AddNewAppVersion(appversion))
                            {
                                ViewBag.result = "New Application has been successfully uploaded!";
                                ModelState.Clear(); // Clears the form fields on success
                            }
                            else
                            {
                                ModelState.AddModelError("", "There will be some issue while uploading files.");
                            }
                        }
                        else
                        {
                            ModelState.AddModelError("", "Could not extract version from the .plist file. Ensure it is a valid iOS plist.");
                        }
                    }
                    catch (Exception ex)
                    {
                        ExceptionLog.WriteLog(ex);
                        ModelState.AddModelError("", "Upload failed");
                    }
                }
                else
                {
                    // Matches old app's exact error message for missing files
                    ModelState.AddModelError("", "Either <b>IPA</b> or <b>PLIST</b> file are missing. Try to upload again.");
                }
            }
            return View(model);
        }

        private UploadedVersion GetIpadVersion(string plistFilePath)
        {
            var ipadDetails = new UploadedVersion();
            try
            {
                var doc = new XmlDocument();
                doc.Load(plistFilePath);

                var downloadUrlNode = doc.SelectSingleNode("//dict/array/dict/array/dict/string[2]");
                var versionNode = doc.SelectSingleNode("//dict/array/dict/dict[1]/string[2]");

                if (downloadUrlNode != null)
                    ipadDetails.DownloadURL = downloadUrlNode.InnerText;
                if (versionNode != null)
                    ipadDetails.Version = versionNode.InnerText;
            }
            catch (Exception ex)
            {
                ExceptionLog.WriteLog(ex);
            }
            return ipadDetails;
        }

        #endregion
    }
}