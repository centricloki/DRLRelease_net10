using System.Security.Cryptography;
using System.Text;

namespace DRLRelease.Common
{
    public class CommonFunction
    {
        // Set once at startup (Program.cs) to the application content root.
        public static string DirectoryPath = Environment.CurrentDirectory;

        // NOTE: DES with a fixed key/IV is kept ONLY so existing passwords in dbo.Web_Users keep working.
        // Planned for a later release: replace with a salted hash (PBKDF2/Argon2) and re-hash on login.
        private static readonly byte[] Key = Encoding.UTF8.GetBytes("@#-DRL!^");
        private static readonly byte[] IV = { 18, 52, 86, 120, 144, 171, 205, 239 };

        public static string Decrypt(string value)
        {
            if (value.Trim().Length > 0)
            {
                using var des = DES.Create();
                using var memoryStream = new MemoryStream(Convert.FromBase64String(value));
                using var cryptoStream = new CryptoStream(memoryStream, des.CreateDecryptor(Key, IV), CryptoStreamMode.Read);
                using var reader = new StreamReader(cryptoStream);
                return reader.ReadToEnd();
            }
            return value;
        }

        public static string Encrypt(string value)
        {
            try
            {
                if (value.Trim().Length > 0)
                {
                    using var des = DES.Create();
                    byte[] input = Encoding.UTF8.GetBytes(value);
                    using var ms = new MemoryStream();
                    using (var cs = new CryptoStream(ms, des.CreateEncryptor(Key, IV), CryptoStreamMode.Write))
                    {
                        cs.Write(input, 0, input.Length);
                        cs.FlushFinalBlock();
                    }
                    return Convert.ToBase64String(ms.ToArray());
                }
                return value;
            }
            catch
            {
                return value;
            }
        }
    }
}
