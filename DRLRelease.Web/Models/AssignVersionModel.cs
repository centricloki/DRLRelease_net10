using Microsoft.AspNetCore.Mvc.Rendering;
using System.Collections.Generic;

namespace DRLRelease.Web.Models
{
    public class AssignVersionModel
    {
        public string VersionType { get; set; }
        public string UserIDs { get; set; }
        public string UserNames { get; set; }
        public string CurrentVersion { get; set; }
        public int CurrentVersionId { get; set; }
        public bool IsDisabledButton { get; set; }
        public string ErrorMessage { get; set; }
        public SelectList AssignList { get; set; }
    }
}