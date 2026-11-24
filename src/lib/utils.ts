import { createCn } from "cn/config";

/** Penggabung class Tailwind yang mengenali token tipografi, shadow, dan radius Becraft. */
export const cn = createCn({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: [
            "hero",
            "display",
            "stat",
            "h2",
            "h3",
            "body",
            "body-medium",
            "body-strong",
            "small",
            "small-medium",
            "small-strong",
            "caption",
            "caption-s",
            "caption-strong",
            "overline",
            "button",
            "button-s",
          ],
        },
      ],
      shadow: [{ shadow: ["focus-ring", "atas"] }],
      rounded: [{ rounded: ["2xs"] }],
    },
  },
});
