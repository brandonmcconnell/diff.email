import { QueryCache, QueryClient } from "@tanstack/react-query";
import { TRPCClientError, createTRPCClient, httpBatchLink } from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { toast } from "sonner";
import type { AppRouter } from "../../../server/src/routers";

function isUnauthError(err: unknown): err is TRPCClientError<AppRouter> {
	return err instanceof TRPCClientError && err.shape?.code === "UNAUTHORIZED";
}

export const queryClient = new QueryClient({
	queryCache: new QueryCache({
		onError: (error) => {
			if (isUnauthError(error)) {
				toast.error(error.message, {
					action: {
						label: "retry",
						onClick: () => {
							queryClient.invalidateQueries();
						},
					},
				});
			}
		},
	}),
});

const trpcClient = createTRPCClient<AppRouter>({
	links: [
		httpBatchLink({
			url: `${process.env.NEXT_PUBLIC_SERVER_URL}/trpc`,
			fetch(url, options) {
				return fetch(url, {
					...options,
					credentials: "include",
				});
			},
		}),
	],
});

export const trpc = createTRPCOptionsProxy<AppRouter>({
	client: trpcClient,
	queryClient,
});
