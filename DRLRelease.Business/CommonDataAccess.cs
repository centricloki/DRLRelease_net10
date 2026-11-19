using System.Data;
using Dapper;
using DRLRelease.DataModel;

namespace DRLRelease.Business
{
    /// <summary>
    /// Same stored procedures, same tables and same return values as the old CommonDataAccess.
    /// Only the plumbing changed (Dapper instead of DataSet/SqlHelper). Inline SQL is now parameterized.
    /// </summary>
    public class CommonDataAccess
    {
        private readonly DbConnectionFactory _db;

        public CommonDataAccess(DbConnectionFactory db) => _db = db;

        // ---------- helpers ----------

        private List<T> QuerySp<T>(string sp, object param = null)
        {
            using var cn = _db.Create();
            return cn.Query<T>(sp, param, commandType: CommandType.StoredProcedure).ToList();
        }

        private List<T> QueryText<T>(string sql, object param = null)
        {
            using var cn = _db.Create();
            return cn.Query<T>(sql, param).ToList();
        }

        /// <summary>True if the procedure returned at least one result set (old: ds.Tables.Count &gt; 0).</summary>
        private bool SpReturnsResultSet(string sp, object param)
        {
            using var cn = _db.Create();
            using var reader = cn.ExecuteReader(sp, param, commandType: CommandType.StoredProcedure);
            return reader.FieldCount > 0;
        }

        /// <summary>True if the procedure returned at least one row (old: Tables.Count &gt; 0 &amp;&amp; Rows.Count &gt; 0).</summary>
        private bool SpReturnsRows(string sp, object param)
        {
            using var cn = _db.Create();
            return cn.Query(sp, param, commandType: CommandType.StoredProcedure).Any();
        }

        private void ExecuteText(string sql, object param)
        {
            using var cn = _db.Create();
            cn.Execute(sql, param);
        }

        // ---------- App versions ----------

        public bool AddNewAppVersion(AppVersion appversion)
        {
            return SpReturnsResultSet("sp_Release_AddAppVersion", new
            {
                AppVersionID = appversion.AppVersionID,
                Version = appversion.Version,
                DownloadURL = appversion.DownloadURL,
                IsProduction = appversion.IsProduction,
                IsActive = appversion.IsActive,
                WhatsNew = appversion.WhatsNew
            });
        }

        public List<AppVersion> GetAppVersion(AppVersion appversion)
        {
            return QuerySp<AppVersion>("sp_Release_GetAppVersion", new
            {
                AppVersionID = appversion.AppVersionID,
                IsProduction = appversion.IsProduction
            });
        }

        public AppVersion GetAppVersion(string version)
        {
            // Was string-concatenated SQL (injectable); now parameterized.
            return QueryText<AppVersion>("SELECT * FROM AppVersion WHERE Version = @Version", new { Version = version })
                   .FirstOrDefault();
        }

        public List<AppVersion> GetAppVersionList()
            => QueryText<AppVersion>("SELECT * FROM AppVersion where IsActive = 1");

        public List<AppVersion> GetAllVersionList()
            => QueryText<AppVersion>("SELECT * FROM AppVersion");

        public List<AppVersion> GetVersionList()
            => QueryText<AppVersion>("SELECT *, CONVERT(BIT,(CASE WHEN IsActive = 1 THEN 0 ELSE 1 END))  AS IsAction FROM AppVersion app");

        public bool UpdateProductionAppVersion(int appVersionId, string whatsnew)
            => SpReturnsRows("sp_Release_UpdateProductionVersion", new { AppVersionID = appVersionId, WhatsNew = whatsnew });

        public bool UpdateAppVersionStatus(int appVersionId, int status)
        {
            ExecuteText("Update AppVersion SET IsActive = @Status WHERE AppVersionID = @AppVersionID",
                        new { Status = status, AppVersionID = appVersionId });
            return true; // old code returned true for any result other than -1 (never happens for UPDATE)
        }

        // ---------- User / version assignment ----------

        public List<UserAppVersion> GetUserAppVersionList(string versionType)
            => QuerySp<UserAppVersion>("sp_Release_GetUserAppVersionList_TS11182026", new { VersionType = versionType });

        public bool SetUserAppVersion(UserAppVersion u)
        {
            return SpReturnsRows("sp_Release_UserAppVersion", new
            {
                UserID = u.UserID,
                IsSendNotification = u.IsSendNotification,
                NotificationCode = u.NotificationCode,
                DeviceID = u.DeviceID,
                CurrentVersion = u.CurrentVersion,
                AssignedVersion = u.AssignedVersion
            });
        }

        // Push-related (push is no longer used; kept so the old call sites keep compiling).
        public bool SetNotificationToUser(long userId)
        {
            ExecuteText("Update UserApplicationDetails set IsSendNotification=1 WHERE UserID = @UserID", new { UserID = userId });
            return true;
        }

        public string GetUserDeviceToken(long userId)
        {
            return QueryText<string>("SELECT DeviceToken FROM UserApplicationDetails WHERE UserID = @UserID", new { UserID = userId })
                   .FirstOrDefault();
        }

        // ---------- Web users ----------

        public List<Web_Users> GetWebUserList()
            => QueryText<Web_Users>("SELECT * FROM web_users");

        public bool RegisterNewUser(Web_Users model)
        {
            const string sql =
                "INSERT INTO web_users (UserName,Password,EmailAddress,UserType,IsActive) " +
                "VALUES(@UserName,@Password,@EmailAddress,@UserType,@IsActive); " +
                "SELECT * from web_users";

            return QueryText<Web_Users>(sql, new
            {
                UserName = model.UserName,
                Password = model.Password,
                EmailAddress = model.EmailAddress,
                UserType = model.UserType,
                IsActive = model.IsActive
            }).Count > 0;
        }
    }
}
