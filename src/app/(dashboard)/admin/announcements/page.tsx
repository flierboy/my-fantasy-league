import { listAnnouncements } from "@/lib/actions/admin/announcements";
import { AnnouncementsManager } from "@/components/admin/announcements-manager";

export const metadata = {
  title: "Admin · Announcements",
};

export default async function AdminAnnouncementsPage() {
  const announcements = await listAnnouncements();

  return (
    <div className="space-y-6">
      <header>
        <p className="ff-ribbon">Broadcast</p>
        <h1 className="ff-display mt-2 text-3xl tracking-tight">
          Announcements
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Post league news and optionally email all owners. Does not send for
          punishments.
        </p>
      </header>
      <AnnouncementsManager announcements={announcements} />
    </div>
  );
}
