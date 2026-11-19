using DRLRelease.DataModel;
using System.Collections.Generic;

namespace DRLRelease.Web.Models
{
    public class ProductionPromoteModel
    {
        public int AppVersionId { get; set; }
        public List<AppVersion> TestVersionList { get; set; } = new List<AppVersion>();
        public string[] WhatsNewList { get; set; }
    }
}