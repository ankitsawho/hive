import { clubRouter } from "~/server/api/routers/club";
import { createTRPCRouter } from "~/server/api/trpc";
import { postRouter } from "./routers/post";
import { commentRouter } from "./routers/comment";
import { searchRouter } from "./routers/search";
import { userRouter } from "./routers/user";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  club: clubRouter,
  post: postRouter,
  comment: commentRouter,
  search: searchRouter,
  user: userRouter
});

// export type definition of API
export type AppRouter = typeof appRouter;
