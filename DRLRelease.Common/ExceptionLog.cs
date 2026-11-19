namespace DRLRelease.Common
{
    // Same behaviour as before: one text file per day in <app root>\Error.
    // Planned for a later release: replace with ILogger / Serilog.
    public class ExceptionLog
    {
        private static readonly object _lock = new object();

        public static void WriteLog(Exception e)
        {
            var text = DateTime.Now + Environment.NewLine
                     + e.Source + Environment.NewLine
                     + e.Message + Environment.NewLine
                     + e.TargetSite + Environment.NewLine
                     + e.StackTrace + Environment.NewLine
                     + (e.InnerException != null ? "[" + e.InnerException.Message + "]" + e.InnerException.StackTrace + Environment.NewLine : "")
                     + Environment.NewLine;
            Append(text);
        }

        public static void WriteLog(string errorMsg)
        {
            Append(DateTime.Now + Environment.NewLine + errorMsg + Environment.NewLine + Environment.NewLine);
        }

        private static void Append(string text)
        {
            try
            {
                string dir = Path.Combine(CommonFunction.DirectoryPath, "Error");
                string file = Path.Combine(dir, $"{DateTime.Now.Year}_{DateTime.Now.Month}_{DateTime.Now.Day}.log");
                lock (_lock)
                {
                    Directory.CreateDirectory(dir);
                    File.AppendAllText(file, text);
                }
            }
            catch
            {
                // logging must never break the request
            }
        }
    }
}
