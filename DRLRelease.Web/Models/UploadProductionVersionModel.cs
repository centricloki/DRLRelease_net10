using DRLRelease.DataModel;
using System.Collections.Generic;

namespace DRLRelease.Web.Models
{
    public class UploadProductionVersionModel
    {
        public List<AppVersion> TestVersionList { get; set; }
    }

    // Request body for the JSON POST (matches old JS keys exactly)
    public class UpdateProductionVersionRequest
    {
        public int AppVersionId { get; set; }
        public string[] WhatsNewList { get; set; }
    }
}