import { protectedProcedure, publicProcedure, router } from "../lib/trpc";
import { emailsRouter } from "./emails";
import { profileRouter } from "./profile";
import { projectsRouter } from "./projects";
import { runsRouter } from "./runs";
import { versionsRouter } from "./versions";

export const appRouter = router({
	healthCheck: publicProcedure.query(() => {
		return "OK";
	}),
	privateData: protectedProcedure.query(({ ctx }) => {
		return {
			message: "This is private",
			user: ctx.session.user,
		};
	}),
	projects: projectsRouter,
	emails: emailsRouter,
	versions: versionsRouter,
	runs: runsRouter,
	profile: profileRouter,
});
export type AppRouter = typeof appRouter;
