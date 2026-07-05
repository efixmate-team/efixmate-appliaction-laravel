import { GET, POST } from "./api/coreClient";

export const publicAPI = {
  submitContactInquiry: (data) => POST("/public/contact-inquiries", data),
  uploadSettings: () => GET("/public/upload-settings"),

  // Landing CMS — client-side fetch variants (server-side uses landingCmsApi from features/landing-cms/api)
  cmsHome:       () => GET("/public/cms/home"),
  cmsAbout:      () => GET("/public/cms/about"),
  cmsContact:    () => GET("/public/cms/contact"),
  cmsServices:   () => GET("/public/cms/services"),
  cmsHowItWorks: () => GET("/public/cms/how-it-works"),
  cmsSiteSettings: () => GET("/public/cms/site-settings"),
  cmsFooter:     () => GET("/public/cms/footer"),
};
