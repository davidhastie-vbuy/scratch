# BOOKaTRADE — Workspace Rules

## Critical: Bauhaus Font Line-Height Bug

The self-hosted **Bauhaus font** (`src/fonts/BauhausRegular.ttf`, `BauhausBold.ttf`) has extreme vertical metrics baked into the font file. This means:

- **CSS `line-height` does NOT work** to reduce spacing between lines of Bauhaus text. Setting `line-height: 0.5` (via Tailwind `leading-[0.5]`, inline style `{{ lineHeight: 0.5 }}`, or any other method) has **zero visual effect**. The font's internal ascent/descent values create a minimum visual line spacing that cannot be overridden.
- **Solution**: To control spacing between lines of Bauhaus display text, use `display: block` spans with **negative margin-top** (`-mt-X`). Example:
  ```tsx
  <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl xl:text-[5.5rem]">
    <span className="block">Line One</span>
    <span className="block -mt-3 sm:-mt-4 lg:-mt-5 xl:-mt-7">Line Two</span>
    <span className="block -mt-3 sm:-mt-4 lg:-mt-5 xl:-mt-7">Line Three</span>
  </h1>
  ```
- Scale the negative margins responsively to match the font size at each breakpoint.
- Do NOT waste time trying `line-height`, `leading-*`, or inline `lineHeight` on Bauhaus headings.

## Additional: Tailwind text-* Utilities Override leading-*

Tailwind's responsive text-size utilities (`sm:text-5xl`, `lg:text-6xl`, etc.) include their own built-in `line-height` values. At responsive breakpoints, these override any standalone `leading-*` class because the responsive `@media` rules appear later in the stylesheet. Even if this didn't matter for Bauhaus (since line-height has no effect anyway), be aware of this for other fonts too.

## Deployment

- **GCP auth tokens expire daily**. If `gcloud run deploy` fails with an auth error, run `gcloud auth login` first.
- **Deploy command**: `gcloud run deploy bookatrade --source . --region=europe-west2`
- **Domain mapping**: Not supported in `europe-west2`. A Google Cloud Load Balancer with static IP (`8.232.110.89`) routes `bookatrade.io` to Cloud Run.

## Design Rules

- No rounded corners (border-radius: 0) — Bauhaus aesthetic
- Primary color: sage green `#6B7F5E`
- Logo: `src/assets/bookatrade-logo-black.png` everywhere
- Focus/active input borders: sage green (not red). Red is errors only.
