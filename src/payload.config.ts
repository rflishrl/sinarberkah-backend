import path from "path";
import { fileURLToPath } from "url";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { s3Storage } from "@payloadcms/storage-s3";
import { buildConfig } from "payload";

import { Banners } from "./collections/Banners";
import { Categories } from "./collections/Categories";
import { Leads } from "./collections/Leads";
import { Media } from "./collections/Media";
import { Products } from "./collections/Products";
import { Testimonials } from "./collections/Testimonials";
import { Users } from "./collections/Users";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default buildConfig({
  serverURL: process.env.SERVER_URL || "http://localhost:3000",
  admin: {
    user: Users.slug,
    meta: {
      titleSuffix: "- Admin Sinar Berkah",
    },
  },
  collections: [
    Users,
    Categories,
    Products,
    Banners,
    Testimonials,
    Leads,
    Media,
  ],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || "SUPER_SECRET_PAYLOAD_KEY_CHANGE_IN_PRODUCTION",
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || "",
    },
  }),
  plugins: [
    s3Storage({
      collections: {
        media: true,
      },
      bucket: process.env.R2_BUCKET || "",
      config: {
        endpoint: process.env.R2_ENDPOINT || "",
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
        },
        region: "auto",
      },
    }),
  ],
});
