using System.Data;
using Dapper;
using DRLRelease.DataModel;

namespace DRLRelease.Business
{
    public class AccountDataAccess
    {
        private readonly DbConnectionFactory _db;

        public AccountDataAccess(DbConnectionFactory db) => _db = db;

        /// <summary>Calls sp_Release_WebLogin. The password must already be encrypted (CommonFunction.Encrypt).</summary>
        public Web_Users Login(string userName, string password)
        {
            using var cn = _db.Create();
            return cn.Query<Web_Users>(
                "sp_Release_WebLogin",
                new { UserName = userName, Password = password },
                commandType: CommandType.StoredProcedure).FirstOrDefault();
        }
    }
}
