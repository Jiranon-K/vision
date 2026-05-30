"use client";

import { toast } from "sonner";

const socials = [
  {
    name: "X",
    icon: (
      <path d="M18.244 2H21.5l-7.5 8.57L23 22h-6.844l-5.36-7.01L4.66 22H1.4l8.02-9.166L1 2h7.02l4.84 6.4L18.244 2Zm-1.2 18h1.9L7.04 4H5.02l12.024 16Z" />
    ),
  },
  {
    name: "Facebook",
    icon: (
      <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.9h2.54V9.85c0-2.52 1.5-3.91 3.78-3.91 1.1 0 2.24.2 2.24.2v2.47h-1.26c-1.24 0-1.63.78-1.63 1.57v1.88h2.78l-.44 2.9h-2.34V22c4.78-.76 8.44-4.92 8.44-9.94Z" />
    ),
  },
  {
    name: "LinkedIn",
    icon: (
      <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9h4v12H3V9Zm6 0h3.8v1.64h.05c.53-1 1.82-2.05 3.75-2.05C20.6 8.59 22 10.3 22 13.5V21h-4v-6.6c0-1.58-.03-3.6-2.2-3.6-2.2 0-2.53 1.72-2.53 3.49V21H9V9Z" />
    ),
  },
];

const SocialLinks = () => {
  const notReady = (name: string) =>
    toast.info(`${name} ยังไม่พร้อมใช้งาน`, {
      description: "เรากำลังเชื่อมต่อช่องทางนี้ เร็ว ๆ นี้",
    });

  return (
    <div className="flex items-center gap-3">
      {socials.map((s) => (
        <button
          key={s.name}
          type="button"
          onClick={() => notReady(s.name)}
          aria-label={s.name}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-brand-lime hover:text-brand-dark transition-colors duration-300 cursor-pointer"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            {s.icon}
          </svg>
        </button>
      ))}
    </div>
  );
};

export default SocialLinks;
