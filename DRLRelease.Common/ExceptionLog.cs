using Serilog;

namespace DRLRelease.Common
{
    public static class ExceptionLog
    {
        /// <summary>
        /// Logs an exception using Serilog.
        /// Signature remains unchanged so existing Business/Web layer calls require zero modifications.
        /// </summary>
        public static void WriteLog(Exception ex)
        {
            if (ex == null) return;

            // Serilog automatically captures the full stack trace and inner exceptions
            Log.Error(ex, "Unhandled Exception occurred");
        }

        /// <summary>
        /// Optional: Logs an informational message using Serilog.
        /// </summary>
        public static void WriteInfo(string message)
        {
            Log.Information(message);
        }
    }
}