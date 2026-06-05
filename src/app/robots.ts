import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/timetable",
          "/student-interest",
          "/calendar",
          "/support",
        ],
      },
    ],
    sitemap: "https://sarvadamodernschool.com/sitemap.xml",
  };
}
