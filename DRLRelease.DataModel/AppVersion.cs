using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DRLRelease.DataModel
{
    public class AppVersion
    {
        public int AppVersionID { get; set; }
        public string Version { get; set; }
        public string DownloadURL { get; set; }
        public bool IsProduction { get; set; }
        public bool IsActive { get; set; }
        public string WhatsNew { get; set; }

        public bool IsAction { get; set; }
    }
}
