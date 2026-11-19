using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DRLRelease.DataModel
{
    public class Web_Users
    {
        public int UserId { get; set; }
        public string UserName { get; set; }
        public string Password { get; set; }
        public string EmailAddress { get; set; }
        public int UserType { get; set; }
        public bool IsActive { get; set; }
    }

    public enum EnumWebUserType
    {
        Branch = 1,
        Corporate = 2,
        Admin = 3,
    }
}
