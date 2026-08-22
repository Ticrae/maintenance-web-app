import { common } from "./common";
import { auth } from "./auth";
import { admin } from "./admin";
import { supervisor } from "./supervisor";
import { maintenance } from "./maintenance";
import { staff } from "./staff";

export const dictionaries = {
  en: {
    common: common.en,
    auth: auth.en,
    admin: admin.en,
    supervisor: supervisor.en,
    maintenance: maintenance.en,
    staff: staff.en,
  },
  fr: {
    common: common.fr,
    auth: auth.fr,
    admin: admin.fr,
    supervisor: supervisor.fr,
    maintenance: maintenance.fr,
    staff: staff.fr,
  },
};

export type Dictionary = typeof dictionaries.en;
