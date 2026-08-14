"use client";

import type { ConstitutionSection } from "@/lib/data/constitution";
import { CONSTITUTION_SECTION_KEYS } from "@/lib/data/constitution";
import {
  createConstitutionSection,
  deleteConstitutionSection,
  reorderConstitutionSection,
  updateConstitutionIntro,
  updateConstitutionSection,
} from "@/lib/actions/admin/constitution";
import { ActionForm } from "./action-form";
import { SubmitButton } from "./submit-button";
import { Field, fieldInputClass, fieldTextareaClass } from "./field";

export function ConstitutionManager({
  intro,
  sections,
  error,
}: {
  intro: string;
  sections: ConstitutionSection[];
  error?: string;
}) {
  return (
    <div className="space-y-8">
      {error && (
        <div className="rounded-lg border-2 border-destructive/40 bg-red-50 p-4 text-sm text-red-950">
          <p className="font-bold">Database note</p>
          <p className="mt-1 font-mono text-xs">{error}</p>
          <p className="mt-2 text-xs">
            Run{" "}
            <code className="font-mono">supabase/migrate-constitution.sql</code>{" "}
            in the Supabase SQL Editor if the table is missing.
          </p>
        </div>
      )}

      <section className="ff-card p-5 sm:p-6">
        <h2 className="ff-display text-xl">Intro</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Opening paragraph at the top of the public constitution page. Saving
          publishes immediately.
        </p>
        <ActionForm action={updateConstitutionIntro} className="mt-4">
          <Field label="Intro text" htmlFor="constitution_intro">
            <textarea
              id="constitution_intro"
              name="constitution_intro"
              required
              rows={4}
              defaultValue={intro}
              className={fieldTextareaClass}
            />
          </Field>
          <SubmitButton>Save intro</SubmitButton>
        </ActionForm>
      </section>

      <section className="ff-card p-5 sm:p-6">
        <h2 className="ff-display text-xl">Add section</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          One rule per line in the body. Order controls the public page
          sequence.
        </p>
        <ActionForm action={createConstitutionSection} className="mt-4">
          <SectionFields
            defaultSort={
              sections.length
                ? Math.max(...sections.map((s) => s.sort_order)) + 10
                : 10
            }
          />
          <SubmitButton>Add section</SubmitButton>
        </ActionForm>
      </section>

      <section className="space-y-4">
        <h2 className="ff-display text-xl">
          Sections ({sections.length})
        </h2>
        {sections.length === 0 && (
          <p className="ff-card p-6 text-sm text-muted-foreground">
            No DB sections yet — the public page is showing the built-in
            fallback until you add sections (or run the seed migration).
          </p>
        )}
        {sections.map((section, idx) => (
          <article key={section.id} className="ff-card space-y-3 p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-bold text-muted-foreground">
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <span className="rounded-full border-2 border-foreground bg-[#f4f2ef] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                  {section.section_key}
                </span>
                <span className="ff-display text-sm">{section.title}</span>
              </div>
              <div className="flex flex-wrap gap-1">
                <ActionForm
                  action={reorderConstitutionSection}
                  className="!space-y-0"
                >
                  <input type="hidden" name="id" value={section.id} />
                  <input type="hidden" name="direction" value="up" />
                  <SubmitButton variant="outline" className="!h-8 !px-2 !text-[10px]">
                    ↑ Up
                  </SubmitButton>
                </ActionForm>
                <ActionForm
                  action={reorderConstitutionSection}
                  className="!space-y-0"
                >
                  <input type="hidden" name="id" value={section.id} />
                  <input type="hidden" name="direction" value="down" />
                  <SubmitButton variant="outline" className="!h-8 !px-2 !text-[10px]">
                    ↓ Down
                  </SubmitButton>
                </ActionForm>
              </div>
            </div>

            <ActionForm action={updateConstitutionSection}>
              <input type="hidden" name="id" value={section.id} />
              <SectionFields section={section} />
              <SubmitButton>Save section</SubmitButton>
            </ActionForm>

            <ActionForm
              action={deleteConstitutionSection}
              className="border-t border-border pt-3"
            >
              <input type="hidden" name="id" value={section.id} />
              <SubmitButton variant="outline">Delete section</SubmitButton>
            </ActionForm>
          </article>
        ))}
      </section>
    </div>
  );
}

function SectionFields({
  section,
  defaultSort = 0,
}: {
  section?: ConstitutionSection;
  defaultSort?: number;
}) {
  const fid = section?.id ?? "new";
  const keyOptions = Array.from(
    new Set([
      ...CONSTITUTION_SECTION_KEYS,
      ...(section?.section_key ? [section.section_key] : []),
    ])
  );

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field
        label="Section key"
        htmlFor={`${fid}-key`}
        hint="Stable id for anchors (e.g. roster, scoring)"
      >
        <input
          id={`${fid}-key`}
          name="section_key"
          list={`${fid}-key-list`}
          defaultValue={section?.section_key ?? ""}
          className={fieldInputClass}
          placeholder="roster"
        />
        <datalist id={`${fid}-key-list`}>
          {keyOptions.map((k) => (
            <option key={k} value={k} />
          ))}
        </datalist>
      </Field>
      <Field label="Sort order" htmlFor={`${fid}-sort`}>
        <input
          id={`${fid}-sort`}
          name="sort_order"
          type="number"
          min={0}
          defaultValue={section?.sort_order ?? defaultSort}
          className={fieldInputClass}
        />
      </Field>
      <Field label="Title" htmlFor={`${fid}-title`} className="sm:col-span-2">
        <input
          id={`${fid}-title`}
          name="title"
          required
          defaultValue={section?.title ?? ""}
          className={fieldInputClass}
          placeholder="Roster"
        />
      </Field>
      <Field
        label="Body (one rule per line)"
        htmlFor={`${fid}-body`}
        className="sm:col-span-2"
        hint="Plain text. Each line becomes a bullet on the public page."
      >
        <textarea
          id={`${fid}-body`}
          name="body"
          required
          rows={6}
          defaultValue={section?.body_raw ?? ""}
          className={fieldTextareaClass}
          placeholder={"Rule one.\nRule two."}
        />
      </Field>
    </div>
  );
}
