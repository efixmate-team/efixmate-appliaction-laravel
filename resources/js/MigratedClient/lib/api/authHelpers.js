/** @format */

import { POST } from "./coreClient.js";

export const commonAPIs = {
  checkUID: (data) => POST("/check-uid", data),
  logout: () => POST("/logout"),
};
