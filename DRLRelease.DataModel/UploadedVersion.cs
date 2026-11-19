using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DRLRelease.DataModel
{
    public class UploadedVersion
    {
        public string DownloadURL { get; set; }
        public string Version { get; set; }
    }

    public enum AppFileType
    {
        IPA
        , PLIST
    }
}
