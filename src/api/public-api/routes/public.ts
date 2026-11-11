export default {
  routes: [
    {
      method: "GET",
      path: "/public/scenes",
      handler: "scenes.list",
      config: { auth: false },
    },
    {
      method: "GET",
      path: "/public/scenes/:slug",
      handler: "scenes.detail",
      config: { auth: false },
    },
  ],
};
