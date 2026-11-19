using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DRLRelease.DataModel
{
    public class UserAppVersion
    {
        public long UserApplicationDetailID { get; set; }
        public Nullable<DateTime> DateAdded { get; set; }
        public bool IsUpdated { get; set; }
        public Nullable<DateTime> UpdatedDate { get; set; }
        public bool IsSendNotification { get; set; }
        public string NotificationCode { get; set; }
        public string DeviceID { get; set; }
        public int CurrentVersion { get; set; }
        public int AssignedVersion { get; set; }
        public Nullable<DateTime> LastSyncDate { get; set; }
        public Nullable<DateTime> LastLoginDateTime { get; set; }
        public string IOSVersion { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public long UserID { get; set; }
        public Nullable<DateTime> UFileNameLastSyncDate { get; set; }

        public string AssignedVersionName { get; set; }
        public string CurrentVersionName { get; set; }
        //Below properties would be used in filters
        public string UserName { get; set; }
        public string IsUpdatedFilter { get; set; }
        public string VersionType { get; set; }
    }

    public class UserList
    {
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public long UserID { get; set; }
        public string CurrentVersionName { get; set; }
        public bool IsUpdated { get; set; }
        public string IOSVersion { get; set; }
    }
}
