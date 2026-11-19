namespace DRLRelease.Notification
{
    // Push notifications (iOS/APNs) are no longer used. This empty stub only keeps the
    // call sites compiling during the migration. Delete this project once the new
    // version is running in production.
    public static class Pusher
    {
        public static bool SendToiOSDevice(string deviceToken, string message) => false;
    }
}
