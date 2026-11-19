using Microsoft.AspNetCore.Http;

namespace DRLRelease.Web.Models
{
    public class UploadNewAppModel
    {
        public IFormFile fileUpIPA { get; set; }
        public IFormFile fileUpPLIST { get; set; }
        public string FileSizeNote { get; set; }
    }
}