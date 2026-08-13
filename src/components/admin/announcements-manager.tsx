"use client";

import {
  createAnnouncement,
  deleteAnnouncement,
  type AnnouncementRow,
} from "@/lib/actions/admin/announcements";
import { ActionForm } from "./action-form";
import { SubmitButton } from "./submit-button";
import { Field, fieldInputClass, fieldTextareaClass } from "./field";

export function AnnouncementsManager({
  announcements,
}: {
  announcements: AnnouncementRow[];
}) {
  return (
    <div className="space-y-8">
      <section className="rounded-xl border-2 border-foreground bg-white p-5 shadow-sm sm:p-6">
        <h2 className="ff-display text-xl">Post announcement</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          League-wide message. Optionally email every owner with an address on
          file. (Punishments never trigger email.)
        </p>
        <ActionForm action={createAnnouncement} className="mt-4">
          <Field label="Title" htmlFor="title">
            <input
              id="title"
              name="title"
              required
              className={fieldInputClass}
              placeholder="Draft reminder"
            />
          </Field>
          <Field label="Message" htmlFor="body" hint="Plain text, short is best">
            <textarea
              id="body"
              name="body"
              required
              rows={5}
              className={fieldTextareaClass}
              placeholder="Hey league — draft is Sunday at 3:45. Be on time."
            />
          </Field>
          <label className="flex items-start gap-2 text-sm font-semibold">
            <input
              type="checkbox"
              name="email_owners"
              value="on"
              defaultChecked
              className="mt-0.5 h-4 w-4 accent-foreground"
            />
            <span>
              Email all owners
              <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                Default on. Uncheck to post without emailing. Needs RESEND_API_KEY.
              </span>
            </span>
          </label>
          <SubmitButton>Post announcement</SubmitButton>
        </ActionForm>
      </section>

      <section className="space-y-4">
        <h2 className="ff-display text-xl">Recent announcements</h2>
        {announcements.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No announcements yet. If posting fails with a missing-table error,
            run <code className="font-mono text-xs">supabase/migrate-email.sql</code>.
          </p>
        )}
        {announcements.map((a) => (
          <article
            key={a.id}
            className="rounded-xl border-2 border-foreground bg-white p-5 shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="ff-display text-lg">{a.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(a.created_at).toLocaleString()}
                </p>
              </div>
              <ActionForm action={deleteAnnouncement} className="!space-y-0">
                <input type="hidden" name="id" value={a.id} />
                <SubmitButton variant="outline">Delete</SubmitButton>
              </ActionForm>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">
              {a.body}
            </p>
          </article>
        ))}
      </section>
    </div>
  );
}
