import { onRequestPost as __api_subscribe_ts_onRequestPost } from "/home/claude/thelearningcurve/functions/api/subscribe.ts"

export const routes = [
    {
      routePath: "/api/subscribe",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_subscribe_ts_onRequestPost],
    },
  ]