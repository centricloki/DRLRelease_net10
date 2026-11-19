using Microsoft.Data.SqlClient;

namespace DRLRelease.Business
{
    /// <summary>
    /// Replaces the old static SqlHelper / baseDataAccess. One new connection per call,
    /// returned to the pool when disposed. No shared static connection or transaction.
    /// </summary>
    public class DbConnectionFactory
    {
        private readonly string _connectionString;

        public DbConnectionFactory(string connectionString)
        {
            if (string.IsNullOrWhiteSpace(connectionString))
                throw new InvalidOperationException("ConnectionStrings:ConnectionString is not configured.");
            _connectionString = connectionString;
        }

        public SqlConnection Create() => new SqlConnection(_connectionString);
    }
}
